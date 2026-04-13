import { Controller, Get, Delete, Param, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service.js';
import { sessions, users, auditEvents } from '../../infra/database/schema.js';
import { eq, isNull, and } from 'drizzle-orm';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { Action, Module } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../common/decorators/index.js';
import type { AuthenticatedRequest } from '../../common/http/http.types.js';

@Controller('admin/sessions')
export class SessionAdminController {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * List all active sessions for the tenant.
   * Requires CLOSE_SESSION_ADMIN permission.
   */
  @Get()
  @RequirePermission(Module.SYSTEM_CONFIG, Action.CLOSE_SESSION_ADMIN)
  async listActiveSessions(@Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const activeSessions = await this.dbService.db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        createdAt: sessions.createdAt,
        lastActivityAt: sessions.lastActivityAt,
      })
      .from(sessions)
      .where(isNull(sessions.closedAt));

    // Enrich with user info
    const enriched = await Promise.all(
      activeSessions.map(async (session) => {
        const userRow = await this.dbService.db
          .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);

        return {
          ...session,
          userEmail: userRow[0]?.email,
          userName: userRow[0] ? `${userRow[0].firstName} ${userRow[0].lastName}` : undefined,
        };
      }),
    );

    return { data: enriched };
  }

  /**
   * Close (terminate) a specific session.
   * Requires CLOSE_SESSION_ADMIN permission.
   */
  @Delete(':sessionId')
  @RequirePermission(Module.SYSTEM_CONFIG, Action.CLOSE_SESSION_ADMIN)
  async closeSession(@Param('sessionId') sessionId: string, @Req() req: AuthenticatedRequest) {
    const adminUser = (req as any).user;
    if (!adminUser) throw new UnauthorizedException();

    await this.dbService.db
      .update(sessions)
      .set({
        closedAt: new Date(),
        closedBy: adminUser.sub,
        closeReason: 'admin_close',
      })
      .where(eq(sessions.id, sessionId));

    // Find the session's user for audit
    const session = await this.dbService.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session[0]) {
      const targetUser = await this.dbService.db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session[0].userId))
        .limit(1);

      await this.dbService.db.insert(auditEvents).values({
        tenantId: adminUser.tid,
        eventType: AuditEventType.SESSION_CLOSED_BY_ADMIN,
        actorId: adminUser.sub,
        actorEmail: adminUser.email,
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.get('user-agent') ?? 'unknown',
        metadata: JSON.stringify({
          targetSessionId: sessionId,
          targetUserId: session[0].userId,
          targetUserEmail: targetUser[0]?.email,
        }),
      });
    }

    return { message: 'Sesión cerrada correctamente' };
  }
}
