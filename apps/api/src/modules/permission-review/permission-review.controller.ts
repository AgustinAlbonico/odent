import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionReviewService } from './permission-review.service.js';
import { RequirePermission } from '../../common/decorators/index.js';
import { Action, Module } from '@sistema-odontologico/permissions';
import type { AuthenticatedRequest } from '../../common/http/http.types.js';

/**
 * Permission Review Controller — periodic review cycles for sensitive permissions.
 *
 * All endpoints require ADMIN_ROLES_PERMISSIONS.
 * Covers RF-AA-026.
 */
@Controller('admin/permission-reviews')
export class PermissionReviewController {
  constructor(private readonly reviewService: PermissionReviewService) {}

  /**
   * List pending/current reviews.
   * Filterable by status and period.
   */
  @Get()
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.VIEW_LIST)
  async listReviews(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.reviewService.listReviews({
      status,
      periodStart,
      periodEnd,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  /**
   * Generate reviews for the current cycle.
   * Creates review records for all active user_permissions.
   */
  @Post('generate')
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_ROLES_PERMISSIONS)
  async generateReviews(
    @Req() req: AuthenticatedRequest,
    @Body() body: { periodStart?: string; periodEnd?: string },
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    // Default period: current month
    const now = new Date();
    const periodStart = body.periodStart
      ? new Date(body.periodStart)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = body.periodEnd
      ? new Date(body.periodEnd)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.reviewService.generateReviews(periodStart, periodEnd, {
      sub: user.sub,
      email: user.email,
      tid: user.tid,
      ip: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
    });
  }

  /**
   * Confirm a review — permission stays active.
   */
  @Patch(':id/confirm')
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_ROLES_PERMISSIONS)
  async confirmReview(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { notes?: string },
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.reviewService.confirmReview(id, body.notes, {
      sub: user.sub,
      email: user.email,
      tid: user.tid,
      ip: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
    });
  }

  /**
   * Revoke a review — permission is removed.
   */
  @Patch(':id/revoke')
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_ROLES_PERMISSIONS)
  async revokeReview(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { notes?: string },
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.reviewService.revokeReview(id, body.notes, {
      sub: user.sub,
      email: user.email,
      tid: user.tid,
      ip: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
    });
  }
}
