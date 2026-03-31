import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
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
import { ProfessionalsService } from './professionals.service.js';

type CreateProfessionalPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type CreateProfessionalInput = {
  firstName: string;
  lastName: string;
  email: string;
};

type AuthenticatedRequest = {
  user?: {
    sub: string;
    tid: string;
  };
  params: Record<string, string>;
};

/**
 * Runtime routes for professional growth actions.
 *
 * These endpoints intentionally wire the real auth + RBAC + plan restriction
 * pipeline without pretending to deliver the full professionals CRUD flow.
 * The key remediation here is that create/activate/reactivate now have real
 * routes where quota policy is enforced before downstream execution.
 */
@Controller('admin/professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.PROFESSIONALS, Action.CREATE)
  @UseGuards(PlanRestrictionGuard)
  @PlanRestricted('create')
  async createProfessional(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateProfessionalPayload,
  ) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return {
      professional: await this.professionalsService.createProfessional(
        user.tid,
        this.parseCreatePayload(body),
      ),
    };
  }

  @Patch(':professionalId/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.CHANGE_STATUS)
  @UseGuards(PlanRestrictionGuard)
  @PlanRestricted('activate')
  async activateProfessional(@Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return {
      professional: await this.professionalsService.activateProfessional(
        user.tid,
        this.parseProfessionalId(req.params?.professionalId),
      ),
    };
  }

  @Patch(':professionalId/reactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.CHANGE_STATUS)
  @UseGuards(PlanRestrictionGuard)
  @PlanRestricted('reactivate')
  async reactivateProfessional(@Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException();

    return {
      professional: await this.professionalsService.reactivateProfessional(
        user.tid,
        this.parseProfessionalId(req.params?.professionalId),
      ),
    };
  }

  private parseProfessionalId(professionalId?: string): string {
    const normalizedId = professionalId?.trim();

    if (!normalizedId) {
      throw new BadRequestException({
        code: 'invalid_professional_id',
        message: 'professionalId es obligatorio.',
      });
    }

    return normalizedId;
  }

  private parseCreatePayload(body?: CreateProfessionalPayload): CreateProfessionalInput {
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const email = body?.email?.trim()?.toLowerCase();

    if (!firstName || !lastName || !email) {
      throw new BadRequestException({
        code: 'invalid_professional_payload',
        message: 'firstName, lastName y email son obligatorios.',
      });
    }

    return {
      firstName,
      lastName,
      email,
    };
  }
}
