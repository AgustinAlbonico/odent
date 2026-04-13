import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { DEFAULT_ROLE_PERMISSIONS, type BaseRole } from '@sistema-odontologico/permissions';
import type { TenantContext } from '@sistema-odontologico/tenancy-core';
import { DatabaseService } from '../../infra/database/database.service.js';
import { PlanGovernanceService } from '../plan-governance/plan-governance.service.js';
import { users, userPermissions, auditEvents, tenants } from '../../infra/database/schema.js';
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQueryInput,
} from '@sistema-odontologico/validation';

// ─── Public response shapes ───────────────────────────

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  state: string;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserDetail extends UserListItem {
  tokenVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  updatedAt: Date;
  customPermissions: UserPermissionItem[];
}

export interface UserPermissionItem {
  id: string;
  module: string;
  action: string;
  scope: string;
}

export interface PaginatedUsersResult {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Internal types ───────────────────────────────────

type AccountState = 'active' | 'inactive' | 'locked' | 'pending_password_change';

const PROFESSIONAL_ROLES = new Set(['profesional']);
const ACTIVE_STATES = new Set<AccountState>(['active']);

@Injectable()
export class UsersService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly planGovernanceService: PlanGovernanceService,
  ) {}

  // ─── List Users ──────────────────────────────────────

  async listUsers(filters: ListUsersQueryInput, tenantId: string): Promise<PaginatedUsersResult> {
    const { role, state, search, page, limit } = filters;
    const offset = (page - 1) * limit;

    // Build conditions — always include tenant filter
    const conditions = [eq(users.tenantId, tenantId)];
    if (role) conditions.push(eq(users.role, role));
    if (state) conditions.push(eq(users.state, state));
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(ilike(users.firstName, term), ilike(users.lastName, term), ilike(users.email, term))!,
      );
    }

    const whereClause = and(...conditions);

    // Count query
    const countResult = await this.dbService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    // Data query
    const rows = await this.dbService.db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt);

    return {
      users: rows.map((r) => this.toListItem(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Get User By ID ──────────────────────────────────

  async getUserById(userId: string, tenantId: string): Promise<UserDetail> {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      throw new NotFoundException({
        code: 'user_not_found',
        message: 'Usuario no encontrado.',
      });
    }

    // Fetch custom permissions
    const perms = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    return {
      ...this.toListItem(user),
      tokenVersion: user.tokenVersion,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      updatedAt: user.updatedAt,
      customPermissions: perms.map((p) => ({
        id: p.id,
        module: p.module,
        action: p.action,
        scope: p.scope,
      })),
    };
  }

  // ─── Create User ─────────────────────────────────────

  async createUser(
    input: CreateUserInput,
    tenantId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
  ): Promise<UserDetail> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check email uniqueness
    const [existing] = await this.dbService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new ConflictException({
        code: 'user_email_conflict',
        message: 'Ya existe un usuario con ese email.',
      });
    }

    // Professional quota check
    if (input.role === 'profesional' && input.state === 'active') {
      await this.checkProfessionalQuota(tenantId);
    }

    // Hash random password
    const passwordHash = await bcrypt.hash(uuidv4(), 12);
    const now = new Date();

    const [created] = await this.dbService.db
      .insert(users)
      .values({
        tenantId,
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: input.role,
        state: input.state,
        mustChangePassword: input.mustChangePassword,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('User creation did not return a row');
    }

    // Increment professional count if needed
    if (input.role === 'profesional' && input.state === 'active') {
      await this.incrementActiveProfessionalCount(tenantId);
    }

    // Audit log
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.PERMISSION_GRANTED,
      ipAddress,
      userAgent,
      { action: 'user_created', userId: created.id, role: input.role },
      tenantId,
    );

    return this.getUserById(created.id, tenantId);
  }

  // ─── Update User ─────────────────────────────────────

  async updateUser(
    userId: string,
    input: UpdateUserInput,
    tenantId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
  ): Promise<UserDetail> {
    // Self-modification check
    if (userId === actor.sub) {
      throw new ForbiddenException({
        code: 'cannot_modify_self',
        message: 'No puede modificar su propia cuenta desde esta sección.',
      });
    }

    // Fetch current user
    const currentUser = await this.findUserOrThrow(userId, tenantId);

    // Determine quota implications
    const newRole = input.role ?? currentUser.role;
    const newState = input.state ?? currentUser.state;
    const oldRole = currentUser.role;
    const oldState = currentUser.state;

    // Role changing TO profesional — check quota
    if (newRole === 'profesional' && oldRole !== 'profesional' && newState === 'active') {
      await this.checkProfessionalQuota(tenantId);
    }

    // State changing to active for a profesional — check quota
    if (
      newRole === 'profesional' &&
      newState === 'active' &&
      oldState !== 'active' &&
      oldRole === 'profesional'
    ) {
      await this.checkProfessionalQuota(tenantId);
    }

    // Apply update
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.firstName !== undefined) updateData['firstName'] = input.firstName.trim();
    if (input.lastName !== undefined) updateData['lastName'] = input.lastName.trim();
    if (input.role !== undefined) updateData['role'] = input.role;
    if (input.state !== undefined) updateData['state'] = input.state;
    if (input.mustChangePassword !== undefined)
      updateData['mustChangePassword'] = input.mustChangePassword;

    await this.dbService.db.update(users).set(updateData).where(eq(users.id, userId));

    // Adjust professional count
    await this.adjustProfessionalCount(tenantId, oldRole, oldState, newRole, newState);

    // Audit log
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.PERMISSION_GRANTED,
      ipAddress,
      userAgent,
      {
        action: 'user_updated',
        userId,
        changes: Object.keys(updateData).filter((k) => k !== 'updatedAt'),
      },
      tenantId,
    );

    return this.getUserById(userId, tenantId);
  }

  // ─── Change State ────────────────────────────────────

  async changeState(
    userId: string,
    newState: AccountState,
    tenantId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
  ): Promise<UserDetail> {
    // Self-modification check
    if (userId === actor.sub) {
      throw new ForbiddenException({
        code: 'cannot_modify_self',
        message: 'No puede cambiar el estado de su propia cuenta.',
      });
    }

    const currentUser = await this.findUserOrThrow(userId, tenantId);
    const oldState = currentUser.state;

    if (oldState === newState) {
      throw new ConflictException({
        code: 'user_already_in_state',
        message: `El usuario ya se encuentra en estado "${newState}".`,
      });
    }

    // Professional quota: activating
    if (currentUser.role === 'profesional' && newState === 'active' && oldState !== 'active') {
      await this.checkProfessionalQuota(tenantId);
    }

    await this.dbService.db
      .update(users)
      .set({ state: newState, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Adjust professional count
    await this.adjustProfessionalCount(
      tenantId,
      currentUser.role,
      oldState,
      currentUser.role,
      newState,
    );

    // Audit log
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.ACCOUNT_REHABILITATED,
      ipAddress,
      userAgent,
      {
        action: 'user_state_changed',
        userId,
        oldState,
        newState,
      },
      tenantId,
    );

    return this.getUserById(userId, tenantId);
  }

  // ─── Force Password Change ───────────────────────────

  async forcePasswordChange(
    userId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
    tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.findUserOrThrow(userId, tenantId);

    await this.dbService.db
      .update(users)
      .set({
        mustChangePassword: true,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit log
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.PASSWORD_FORCED_CHANGE,
      ipAddress,
      userAgent,
      { action: 'force_password_change', userId },
      tenantId,
    );

    return { success: true };
  }

  // ─── Get User Permissions ────────────────────────────

  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<{
    custom: UserPermissionItem[];
    inherited: {
      role: string;
      permissions: Array<{ module: string; action: string; scope: string }>;
    };
  }> {
    const user = await this.findUserOrThrow(userId, tenantId);

    const customPerms = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role as BaseRole] ?? [];

    return {
      custom: customPerms.map((p) => ({
        id: p.id,
        module: p.module,
        action: p.action,
        scope: p.scope,
      })),
      inherited: {
        role: user.role,
        permissions: roleDefaults.map((p) => ({
          module: p.module,
          action: p.action,
          scope: p.scope,
        })),
      },
    };
  }

  // ─── Update Permissions (replace all) ────────────────

  async updatePermissions(
    userId: string,
    permissions: Array<{ module: string; action: string; scope: string }>,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
    tenantId: string,
  ): Promise<UserPermissionItem[]> {
    await this.findUserOrThrow(userId, tenantId);

    // Delete existing custom permissions
    await this.dbService.db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    // Insert new permissions
    const inserted: UserPermissionItem[] = [];
    if (permissions.length > 0) {
      type PermissionInsert = typeof userPermissions.$inferInsert;
      const values: PermissionInsert[] = permissions.map((p) => ({
        userId,
        module: p.module.toLowerCase() as PermissionInsert['module'],
        action: p.action.toLowerCase() as PermissionInsert['action'],
        scope: p.scope.toLowerCase() as PermissionInsert['scope'],
      }));

      const rows = await this.dbService.db.insert(userPermissions).values(values).returning();

      for (const row of rows) {
        inserted.push({
          id: row.id,
          module: row.module,
          action: row.action,
          scope: row.scope,
        });
      }
    }

    // Audit log — record permission change
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.PERMISSION_GRANTED,
      ipAddress,
      userAgent,
      {
        action: 'permissions_updated',
        userId,
        permissionCount: permissions.length,
      },
      tenantId,
    );

    return inserted;
  }

  // ─── Delete Single Permission ────────────────────────

  async deletePermission(
    userId: string,
    permissionId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
    tenantId: string,
  ): Promise<{ success: boolean }> {
    // Verify user belongs to tenant
    await this.findUserOrThrow(userId, tenantId);

    // Verify permission belongs to user
    const [perm] = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(and(eq(userPermissions.id, permissionId), eq(userPermissions.userId, userId)))
      .limit(1);

    if (!perm) {
      throw new NotFoundException({
        code: 'permission_not_found',
        message: 'Permiso no encontrado para este usuario.',
      });
    }

    await this.dbService.db.delete(userPermissions).where(eq(userPermissions.id, permissionId));

    // Audit log
    await this.recordAudit(
      actor.sub,
      actor.email,
      AuditEventType.PERMISSION_REVOKED,
      ipAddress,
      userAgent,
      {
        action: 'permission_deleted',
        userId,
        permissionId,
        permission: { module: perm.module, action: perm.action, scope: perm.scope },
      },
      tenantId,
    );

    return { success: true };
  }

  // ─── Private Helpers ─────────────────────────────────

  private async findUserOrThrow(userId: string, tenantId?: string) {
    const tenantCondition = tenantId
      ? and(eq(users.id, userId), eq(users.tenantId, tenantId))
      : eq(users.id, userId);

    const [user] = await this.dbService.db.select().from(users).where(tenantCondition).limit(1);

    if (!user) {
      throw new NotFoundException({
        code: 'user_not_found',
        message: 'Usuario no encontrado.',
      });
    }

    return user;
  }

  private async resolveTenantContext(tenantId: string): Promise<TenantContext> {
    const [tenant] = await this.dbService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return {
      tenantId: tenant.id,
      schema: tenant.schema,
      name: tenant.name,
      plan: tenant.plan as TenantContext['plan'],
      maxActiveProfessionals: tenant.maxActiveProfessionals,
      activeProfessionalCount: tenant.activeProfessionalCount,
      gracePeriodEnd: tenant.gracePeriodEnd ?? undefined,
    };
  }

  private async checkProfessionalQuota(tenantId: string): Promise<void> {
    const tenantCtx = await this.resolveTenantContext(tenantId);
    const result = this.planGovernanceService.checkProfessionalQuota(tenantCtx);

    if (!result.allowed) {
      const messages: Record<string, string> = {
        quota_exhausted:
          'Cuota de profesionales activos alcanzada. Actualice el plan para agregar más.',
        grace_active: 'Período de gracia activo — no se pueden agregar profesionales.',
        grace_expired_over_quota:
          'Período de gracia vencido con exceso de profesionales. Regularice el plan.',
      };

      throw new ForbiddenException({
        code: 'plan_quota_blocked',
        reason: result.reason,
        message: messages[result.reason ?? 'quota_exhausted'],
        quotaInfo: {
          current: result.current,
          maximum: result.maximum,
          remaining: 0,
        },
      });
    }
  }

  private async adjustProfessionalCount(
    tenantId: string,
    oldRole: string,
    oldState: string,
    newRole: string,
    newState: string,
  ): Promise<void> {
    const oldCounted =
      oldRole === 'profesional' && ACTIVE_STATES.has(oldState as AccountState) ? 1 : 0;
    const newCounted =
      newRole === 'profesional' && ACTIVE_STATES.has(newState as AccountState) ? 1 : 0;
    const delta = newCounted - oldCounted;

    if (delta === 0) return;

    const tenantCtx = await this.resolveTenantContext(tenantId);
    const updatedCount = tenantCtx.activeProfessionalCount + delta;

    await this.dbService.db
      .update(tenants)
      .set({
        activeProfessionalCount: Math.max(0, updatedCount),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }

  private async incrementActiveProfessionalCount(tenantId: string): Promise<void> {
    const tenantCtx = await this.resolveTenantContext(tenantId);

    await this.dbService.db
      .update(tenants)
      .set({
        activeProfessionalCount: tenantCtx.activeProfessionalCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }

  private async recordAudit(
    actorId: string,
    actorEmail: string,
    eventType: AuditEventType,
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, unknown>,
    tenantId: string,
  ): Promise<void> {
    await this.dbService.db.insert(auditEvents).values({
      tenantId,
      eventType,
      actorId,
      actorEmail,
      ipAddress,
      userAgent,
      metadata: JSON.stringify(metadata),
    });
  }

  private toListItem(r: typeof users.$inferSelect): UserListItem {
    return {
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      role: r.role,
      state: r.state,
      mustChangePassword: r.mustChangePassword,
      lastLoginAt: r.lastLoginAt,
      createdAt: r.createdAt,
    };
  }
}
