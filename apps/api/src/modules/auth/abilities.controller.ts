import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, users } from '../../infra/database/index.js';
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
    const jwtPayload = (req as any).user;
    if (!jwtPayload) throw new UnauthorizedException();

    const permissions: PermissionEntry[] = await this.permissionsService.resolvePermissions(
      jwtPayload.sub,
      jwtPayload.role,
    );

    // Fetch fresh user data for profile fields (photo, names)
    const [row] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        updatedAt: users.updatedAt,
        phone: users.phone,
        licenseNumber: users.licenseNumber,
        specialty: users.specialty,
        dni: users.dni,
      })
      .from(users)
      .where(eq(users.id, jwtPayload.sub))
      .limit(1);

    return {
      user: {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        firstName: row?.firstName ?? null,
        lastName: row?.lastName ?? null,
        role: jwtPayload.role,
        tenantId: jwtPayload.tid,
        mustChangePassword: Boolean(jwtPayload.mustChangePassword),
        photoUrl: row?.photoUrl
          ? `${row.photoUrl}?v=${new Date(row.updatedAt ?? Date.now()).getTime()}`
          : null,
        phone: row?.phone ?? null,
        licenseNumber: row?.licenseNumber ?? null,
        specialty: row?.specialty ?? null,
        dni: row?.dni ?? null,
      },
      abilities: permissions,
    };
  }
}
