import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service.js';
import type { PermissionEntry } from '@sistema-odontologico/permissions';
import type { AuthenticatedRequest } from '../../common/http/http.types.js';

@Controller('auth/abilities')
export class AbilitiesController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Get the current user's effective permissions and accessible menu.
   * Used by frontend to conditionally show/hide UI elements.
   */
  @Get()
  async getAbilities(@Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    const permissions: PermissionEntry[] = await this.permissionsService.resolvePermissions(
      user.sub,
      user.role,
    );

    return {
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
        tenantId: user.tid,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      abilities: permissions,
    };
  }
}
