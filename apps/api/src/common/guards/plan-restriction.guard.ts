import {
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProfessionalsService } from '../../modules/professionals/professionals.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { DatabaseService } from '../../infra/database/database.service.js';
import type { QuotaCheckResult } from '../../modules/professionals/professionals.service.js';

/**
 * Metadata key for plan-restriction action type.
 * Set via @PlanRestricted('create' | 'activate' | 'reactivate') decorator.
 */
export const PLAN_RESTRICTION_KEY = 'planRestriction';
type PlanRestrictedAction = 'create' | 'activate' | 'reactivate';

/**
 * Plan Restriction Guard — checks plan-based quotas before professional CRUD.
 *
 * This guard is SEPARATE from:
 * - RBAC (handled by AuthGuard)
 * - Data scope (handled by scope dimension in AuthGuard)
 * - Professional's own status (active/inactive/locked)
 *
 * Only blocks GROWTH actions (create/activate/reactivate) when quota is exhausted.
 * Does NOT disable modules, unrelated permissions, or access of already active professionals.
 *
 * Covers RF-AA-009A.
 */
@Injectable()
export class PlanRestrictionGuard implements CanActivate {
  constructor(
    private readonly professionalsService: ProfessionalsService,
    private readonly dbService: DatabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // Determine the action type from metadata
    const actionType = this.reflector.getAllAndOverride<PlanRestrictedAction>(
      PLAN_RESTRICTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!actionType) return true; // No plan restriction metadata — allow

    const tenantId = user.tid;
    if (!tenantId) {
      throw new ForbiddenException({
        code: 'no_tenant',
        message: 'No se pudo determinar la institución',
      });
    }

    // Delegate to the appropriate quota check
    let result: QuotaCheckResult;
    switch (actionType) {
      case 'create':
        result = await this.professionalsService.canCreateProfessional(tenantId);
        break;
      case 'activate':
        result = await this.professionalsService.canActivateProfessional(tenantId);
        break;
      case 'reactivate':
        result = await this.professionalsService.canReactivateProfessional(tenantId);
        break;
      default:
        return true;
    }

    if (!result.allowed) {
      // Audit the blocked attempt
      await this.logBlockedAttempt(request, user, actionType, result);

      // Map reason to user-friendly message
      const messages: Record<string, string> = {
        quota_exhausted:
          'Cuota de profesionales activos alcanzada. Actualice el plan para agregar más profesionales.',
        grace_active:
          'Período de gracia activo — no se pueden agregar profesionales hasta regularizar el plan.',
        grace_expired_over_quota:
          'Período de gracia vencido con exceso de profesionales. Regularice el plan para continuar.',
      };

      throw new ForbiddenException({
        code: 'plan_quota_blocked',
        reason: result.reason,
        blockedAction: actionType,
        message: messages[result.reason ?? 'quota_exhausted'],
        quotaInfo: result.quotaInfo,
      });
    }

    return true;
  }

  /**
   * Log a blocked attempt as a PLAN_QUOTA_BLOCKED audit event.
   * This preserves the evidence that the plan restriction blocked a growth action.
   */
  private async logBlockedAttempt(
    request: any,
    user: any,
    actionType: string,
    result: QuotaCheckResult,
  ) {
    const { auditEvents } = await import('../../infra/database/schema.js');

    await this.dbService.db.insert(auditEvents).values({
      tenantId: user.tid,
      eventType: AuditEventType.PLAN_QUOTA_BLOCKED,
      actorId: user.sub,
      actorEmail: user.email,
      ipAddress: request.ip ?? 'unknown',
      userAgent: request.get('user-agent') ?? 'unknown',
      metadata: JSON.stringify({
        blockedAction: actionType,
        reason: result.reason,
        quotaInfo: result.quotaInfo,
        tenantId: user.tid,
      }),
    });
  }
}

/**
 * Decorator to mark a route as plan-restricted.
 * Use on professional CRUD routes: create, activate, reactivate.
 */
export const PlanRestricted = (action: 'create' | 'activate' | 'reactivate') =>
  SetMetadata(PLAN_RESTRICTION_KEY, action);
