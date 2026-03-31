import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from '../../infra/database/database.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { auditEvents } from '../../infra/database/schema.js';

/**
 * Interceptor that records audit events for protected actions.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly dbService: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          // Success — no need to audit every successful request
          // Only auditable actions should use this interceptor
        },
        error: (error) => {
          // Record access denied if it's a permission error
          if (error.status === 403) {
            this.recordAccessDenied(user, request, error.message);
          }
        },
      }),
    );
  }

  private async recordAccessDenied(
    user: { sub: string; email: string },
    request: any,
    reason: string,
  ) {
    try {
      await this.dbService.db.insert(auditEvents).values({
        eventType: AuditEventType.ACCESS_DENIED,
        actorId: user.sub,
        actorEmail: user.email,
        ipAddress: request.ip ?? 'unknown',
        userAgent: request.get?.('user-agent') ?? 'unknown',
        metadata: JSON.stringify({ reason, path: request.url, method: request.method }),
      });
    } catch {
      // Don't fail the request if audit fails
    }
  }
}
