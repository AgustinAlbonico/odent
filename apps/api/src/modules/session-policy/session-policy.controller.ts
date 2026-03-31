import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Action, Module } from '@sistema-odontologico/permissions';
import { sessionPolicySchema } from '@sistema-odontologico/validation';
import { RequirePermission } from '../../common/decorators/index.js';
import { SessionPolicyService } from './session-policy.service.js';

interface AuthenticatedRequest {
  user?: {
    sub: string;
    email: string;
  };
  ip?: string;
  get(name: string): string | undefined;
}

@Controller('admin/session-policy')
export class SessionPolicyController {
  constructor(private readonly sessionPolicyService: SessionPolicyService) {}

  @Get()
  @RequirePermission(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES)
  async getPolicy(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    return this.sessionPolicyService.getPolicy(user.sub);
  }

  @Put()
  @RequirePermission(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES)
  async updatePolicy(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const parsed = sessionPolicySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return this.sessionPolicyService.updatePolicy(parsed.data, {
      userId: user.sub,
      userEmail: user.email,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
    });
  }
}
