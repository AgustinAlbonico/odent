import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Action, Module } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../common/decorators/index.js';
import {
  PlanRestricted,
  PlanRestrictionGuard,
} from '../../common/guards/plan-restriction.guard.js';
import { UsersService } from './users.service.js';
import type { AuthenticatedRequest } from '../../common/http/http.types.js';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  forcePasswordSchema,
  updatePermissionsSchema,
} from '@sistema-odontologico/validation';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /admin/users — List users ────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async listUsers(
    @Req() req: AuthenticatedRequest,
    @Query() query: Record<string, string | undefined>,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const parsed = listUsersQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Parámetros de consulta inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.usersService.listUsers(parsed.data);
  }

  // ─── GET /admin/users/:userId — Get user detail ───────

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async getUser(@Req() req: AuthenticatedRequest, @Param('userId') userId: string) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.usersService.getUserById(userId);
  }

  // ─── POST /admin/users — Create user ──────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  @UseGuards(PlanRestrictionGuard)
  @PlanRestricted('create')
  async createUser(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de usuario inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Self-role check: admin can't create another admin with their own ID
    // (this is handled in the service for updates, creation is fine)

    return this.usersService.createUser(
      parsed.data,
      user.tid,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }

  // ─── PATCH /admin/users/:userId — Update user ─────────

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    // Self-modification guard
    if (userId === user.sub) {
      throw new ForbiddenException({
        code: 'cannot_modify_self',
        message: 'No puede modificar su propia cuenta desde esta sección.',
      });
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de actualización inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.usersService.updateUser(
      userId,
      parsed.data,
      user.tid,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }

  // ─── PATCH /admin/users/:userId/state — Change state ──

  @Patch(':userId/state')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async changeState(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: { state?: string },
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    // Self-modification guard
    if (userId === user.sub) {
      throw new ForbiddenException({
        code: 'cannot_modify_self',
        message: 'No puede cambiar el estado de su propia cuenta.',
      });
    }

    const validStates = ['active', 'inactive', 'locked', 'pending_password_change'] as const;
    if (!body?.state || !validStates.includes(body.state as any)) {
      throw new BadRequestException({
        code: 'invalid_state',
        message: 'Estado inválido. Valores permitidos: active, inactive, locked, pending_password_change.',
      });
    }

    return this.usersService.changeState(
      userId,
      body.state as typeof validStates[number],
      user.tid,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }

  // ─── PATCH /admin/users/:userId/force-password ────────

  @Patch(':userId/force-password')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async forcePasswordChange(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const parsed = forcePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'mustChangePassword debe ser true.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.usersService.forcePasswordChange(
      userId,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }

  // ─── GET /admin/users/:userId/permissions ─────────────

  @Get(':userId/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async getPermissions(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.usersService.getUserPermissions(userId);
  }

  // ─── PUT /admin/users/:userId/permissions ─────────────

  @Put(':userId/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async updatePermissions(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const parsed = updatePermissionsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Permisos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.usersService.updatePermissions(
      userId,
      parsed.data.permissions,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }

  // ─── DELETE /admin/users/:userId/permissions/:permissionId

  @Delete(':userId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async deletePermission(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return this.usersService.deletePermission(
      userId,
      permissionId,
      { sub: user.sub, email: user.email ?? '' },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );
  }
}
