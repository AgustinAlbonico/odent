import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Action, Module } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../../common/decorators/index.js';
import type { AuthenticatedRequest } from '../../../common/http/http.types.js';
import { PasswordService } from './password.service.js';

@Controller('admin/users')
export class AccountAdminController {
  constructor(private readonly passwordService: PasswordService) {}

  @Patch(':userId/rehabilitate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_USERS)
  async rehabilitateAccount(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const actor = (req as any).user;
    if (!actor?.sub || !actor?.email) {
      throw new UnauthorizedException();
    }

    await this.passwordService.rehabilitateAccount(
      userId,
      {
        sub: actor.sub,
        email: actor.email,
      },
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );

    return {
      message: 'Cuenta rehabilitada correctamente',
    };
  }
}
