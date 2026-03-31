import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordService } from './password.service.js';
import {
  recoveryRequestSchema,
  recoveryResetSchema,
  passwordChangeSchema,
  forcedPasswordChangeSchema,
} from '@sistema-odontologico/validation';
import { Public } from '../../../common/decorators/index.js';
import { defaultCookieConfig } from '@sistema-odontologico/auth-core';
import type { AuthenticatedRequest, HttpResponse } from '../../../common/http/http.types.js';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('recovery/request')
  @Public()
  @HttpCode(HttpStatus.OK)
  async requestRecovery(@Body() body: unknown) {
    const parsed = recoveryRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    // Always return success to prevent email enumeration
    await this.passwordService.requestRecovery(
      parsed.data.email,
      'system',
      'system',
    );

    return { message: 'Si el email existe, recibirás instrucciones de recuperación' };
  }

  @Post('recovery/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetWithRecovery(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const parsed = recoveryResetSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const success = await this.passwordService.resetWithRecovery(
      parsed.data.token,
      parsed.data.newPassword,
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );

    if (!success) throw new BadRequestException('Token inválido o expirado');

    return { message: 'Contraseña actualizada correctamente' };
  }

  @Post('change')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const userId = (req as any).user?.sub;
    if (!userId) throw new UnauthorizedException();

    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    await this.passwordService.changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );

    return { message: 'Contraseña cambiada correctamente' };
  }

  @Post('force-change')
  @HttpCode(HttpStatus.OK)
  async forceChangePassword(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const userId = (req as any).user?.sub;
    if (!userId) throw new UnauthorizedException();

    const parsed = forcedPasswordChangeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    await this.passwordService.forceChangePassword(
      userId,
      parsed.data.newPassword,
      req.ip ?? 'unknown',
      req.get('user-agent') ?? 'unknown',
    );

    res.clearCookie(defaultCookieConfig.accessTokenName);
    res.clearCookie(defaultCookieConfig.refreshTokenName);

    return { message: 'Contraseña actualizada. Inicie sesión nuevamente.' };
  }
}
