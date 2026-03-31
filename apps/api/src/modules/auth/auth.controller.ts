import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { loginSchema, type LoginInput } from '@sistema-odontologico/validation';
import { defaultCookieConfig, toCookieMaxAgeMs } from '@sistema-odontologico/auth-core';
import { Public } from '../../common/decorators/index.js';
import type { AuthenticatedRequest, HttpResponse } from '../../common/http/http.types.js';
import { TenantService } from '../tenancy/tenancy.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { email, password } = parsed.data;
    const ipAddress = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';
    const tenantId = this.tenantService.extractTenantId(req.headers['x-tenant-id']);

    if (!tenantId) {
      throw new BadRequestException('Tenant header x-tenant-id is required');
    }

    const result = await this.authService.login(email, password, ipAddress, userAgent, tenantId);

    if (!result.success) {
      if (result.reason === 'pending_password_change' && result.accessToken && result.session) {
        res.cookie(defaultCookieConfig.accessTokenName, result.accessToken, {
          httpOnly: defaultCookieConfig.httpOnly,
          secure: defaultCookieConfig.secure,
          sameSite: defaultCookieConfig.sameSite,
          path: defaultCookieConfig.path,
          maxAge: toCookieMaxAgeMs(defaultCookieConfig.accessMaxAge),
        });
        res.clearCookie(defaultCookieConfig.refreshTokenName);

        return {
          requiresPasswordChange: true,
          user: this.toAuthUser(result.session),
          securityNotice: result.securityNotice,
        };
      }
      throw new UnauthorizedException({
        code: result.reason,
        message: this.getErrorMessage(result.reason),
      });
    }

    if (!result.accessToken) {
      throw new UnauthorizedException('Access token missing');
    }

    // Set cookies
    res.cookie(defaultCookieConfig.accessTokenName, result.accessToken, {
      httpOnly: defaultCookieConfig.httpOnly,
      secure: defaultCookieConfig.secure,
      sameSite: defaultCookieConfig.sameSite,
      path: defaultCookieConfig.path,
      maxAge: toCookieMaxAgeMs(defaultCookieConfig.accessMaxAge),
    });

    if (result.refreshToken) {
      res.cookie(defaultCookieConfig.refreshTokenName, result.refreshToken, {
        httpOnly: defaultCookieConfig.httpOnly,
        secure: defaultCookieConfig.secure,
        sameSite: defaultCookieConfig.sameSite,
        path: defaultCookieConfig.path,
        maxAge: toCookieMaxAgeMs(defaultCookieConfig.refreshMaxAge),
      });
    }

    return {
      user: result.session ? this.toAuthUser(result.session) : undefined,
      securityNotice: result.securityNotice,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: HttpResponse) {
    const userId = (req as any).user?.sub;
    if (!userId) throw new UnauthorizedException();

    const ipAddress = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    await this.authService.logout('session', userId, ipAddress, userAgent);

    // Clear cookies
    res.clearCookie(defaultCookieConfig.accessTokenName);
    res.clearCookie(defaultCookieConfig.refreshTokenName);

    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: HttpResponse) {
    const refreshToken = req.cookies?.[defaultCookieConfig.refreshTokenName];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const ipAddress = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    const result = await this.authService.refresh(refreshToken, ipAddress, userAgent);
    if (!result) throw new UnauthorizedException('Invalid refresh token');

    res.cookie(defaultCookieConfig.accessTokenName, result.accessToken, {
      httpOnly: defaultCookieConfig.httpOnly,
      secure: defaultCookieConfig.secure,
      sameSite: defaultCookieConfig.sameSite,
      path: defaultCookieConfig.path,
      maxAge: toCookieMaxAgeMs(defaultCookieConfig.accessMaxAge),
    });

    res.cookie(defaultCookieConfig.refreshTokenName, result.refreshToken, {
      httpOnly: defaultCookieConfig.httpOnly,
      secure: defaultCookieConfig.secure,
      sameSite: defaultCookieConfig.sameSite,
      path: defaultCookieConfig.path,
      maxAge: toCookieMaxAgeMs(defaultCookieConfig.refreshMaxAge),
    });

    return { message: 'Token refreshed' };
  }

  private getErrorMessage(reason?: string): string {
    const messages: Record<string, string> = {
      invalid_credentials: 'Credenciales inválidas',
      account_inactive: 'Cuenta inactiva',
      account_locked: 'Cuenta bloqueada temporalmente',
      pending_password_change: 'Debe cambiar su contraseña',
    };
    return messages[reason ?? ''] ?? 'Error de autenticación';
  }

  private toAuthUser(session: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    mustChangePassword: boolean;
  }) {
    return {
      id: session.userId,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      mustChangePassword: session.mustChangePassword,
    };
  }
}
