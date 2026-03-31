import { Controller, Get, Query, Req, UnauthorizedException, Res } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service.js';
import { auditEvents } from '../../infra/database/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { RequirePermission } from '../../common/decorators/index.js';
import { Action, Module } from '@sistema-odontologico/permissions';
import type { AuthenticatedRequest, HttpResponse } from '../../common/http/http.types.js';

function belongsToAuthorizedTenantUniverse(event: { metadata: string | null }, tenantId: string): boolean {
  if (!event.metadata) return false;

  try {
    const metadata = JSON.parse(event.metadata) as { tenantId?: string };
    return metadata.tenantId === tenantId;
  } catch {
    return false;
  }
}

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get()
  @RequirePermission(Module.AUDIT_ACCESS, Action.VIEW_AUDIT)
  async getAuditEvents(
    @Req() req: AuthenticatedRequest,
    @Query('eventType') eventType?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const p = Number(page ?? '1');
    const ps = Math.min(Number(pageSize ?? '50'), 100);

    const conditions = [];
    if (eventType) conditions.push(eq(auditEvents.eventType, eventType as any));
    if (actorId) conditions.push(eq(auditEvents.actorId, actorId));
    if (from) conditions.push(gte(auditEvents.createdAt, new Date(from)));
    if (to) conditions.push(lte(auditEvents.createdAt, new Date(to)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const events = await this.dbService.db
      .select()
      .from(auditEvents)
      .where(where)
      .orderBy(desc(auditEvents.createdAt))
      .limit(ps)
      .offset((p - 1) * ps);

    return {
      data: events.map((e) => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
      })),
      meta: { page: p, pageSize: ps },
    };
  }

  @Get('personal')
  async getPersonalHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const p = Number(page ?? '1');
    const ps = Math.min(Number(pageSize ?? '50'), 100);

    const events = await this.dbService.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.actorId, user.sub))
      .orderBy(desc(auditEvents.createdAt))
      .limit(ps)
      .offset((p - 1) * ps);

    return {
      data: events.map((e) => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
      })),
      meta: { page: p, pageSize: ps },
    };
  }

  @Get('export')
  @RequirePermission(Module.AUDIT_ACCESS, Action.VIEW_AUDIT)
  async exportAudit(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: HttpResponse,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventType') eventType?: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();
    if (!user.tid) throw new UnauthorizedException();

    const conditions = [];
    if (eventType) conditions.push(eq(auditEvents.eventType, eventType as any));
    if (from) conditions.push(gte(auditEvents.createdAt, new Date(from)));
    if (to) conditions.push(lte(auditEvents.createdAt, new Date(to)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const events = await this.dbService.db
      .select()
      .from(auditEvents)
      .where(where)
      .orderBy(desc(auditEvents.createdAt))
      .limit(10000); // Max 10k records per export

    const authorizedEvents = events.filter((event) =>
      belongsToAuthorizedTenantUniverse(event, user.tid),
    );

    // Generate CSV
    const headers = ['id', 'event_type', 'actor_email', 'ip_address', 'timestamp', 'metadata'];
    const rows = authorizedEvents.map((e) =>
      [
        e.id,
        e.eventType,
        e.actorEmail,
        e.ipAddress,
        e.createdAt?.toISOString(),
        e.metadata ?? '',
      ].join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-export.csv');

    return csv;
  }
}
