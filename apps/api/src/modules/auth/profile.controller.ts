import {
  Controller,
  Patch,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profileUpdateSchema } from '@sistema-odontologico/validation';
import { db, users } from '../../infra/database/index.js';
import type { AuthenticatedRequest } from '../../common/http/http.types.js';

@Controller('auth/profile')
export class ProfileController {
  @Patch()
  async updateProfile(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const userId = (req as any).user?.sub;
    if (!userId) throw new UnauthorizedException();

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const updates: Record<string, string | null> = {};
    if (parsed.data.firstName !== undefined) updates.firstName = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updates.lastName = parsed.data.lastName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone || null;
    if (parsed.data.licenseNumber !== undefined) updates.licenseNumber = parsed.data.licenseNumber || null;
    if (parsed.data.specialty !== undefined) updates.specialty = parsed.data.specialty || null;
    if (parsed.data.dni !== undefined) updates.dni = parsed.data.dni || null;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No hay datos para actualizar.');
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    return { message: 'Perfil actualizado correctamente' };
  }
}
