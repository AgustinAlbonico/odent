import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Action, Module } from '@sistema-odontologico/permissions';
import { listUsersQuerySchema } from '@sistema-odontologico/validation';
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
    email?: string;
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.VIEW_LIST)
  async listProfessionals(
    @Req() req: AuthenticatedRequest,
    @Query() query: Record<string, string | undefined>,
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const parsed = listUsersQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Parámetros de consulta inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.professionalsService.listProfessionals(
      {
        search: parsed.data.search,
        page: parsed.data.page,
        limit: parsed.data.limit,
      },
      user.tid,
    );
  }

  @Get(':professionalId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.VIEW_DETAIL)
  async getProfessional(@Req() req: AuthenticatedRequest, @Param('professionalId') professionalId: string) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    return this.professionalsService.getProfessionalById(
      this.parseProfessionalId(professionalId),
      user.tid,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.PROFESSIONALS, Action.CREATE)
  @UseGuards(PlanRestrictionGuard)
  @PlanRestricted('create')
  async createProfessional(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateProfessionalPayload,
  ) {
    const user = req.user;
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
    const user = req.user;
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
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    return {
      professional: await this.professionalsService.reactivateProfessional(
        user.tid,
        this.parseProfessionalId(req.params?.professionalId),
      ),
    };
  }

  @Post(':professionalId/photo')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.EDIT)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException({
              code: 'unsupported_media_type',
              message: 'Solo se permiten imágenes JPEG, PNG o WebP.',
            }),
            false,
          );
        }
      },
    }),
  )
  async uploadPhoto(
    @Req() req: AuthenticatedRequest,
    @Param('professionalId') professionalId: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    if (!file) {
      throw new BadRequestException({
        code: 'no_file',
        message: 'No se recibió ningún archivo.',
      });
    }

    return this.professionalsService.updatePhoto(
      this.parseProfessionalId(professionalId),
      user.tid,
      file,
    );
  }

  @Delete(':professionalId/photo')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.EDIT)
  async deletePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('professionalId') professionalId: string,
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.professionalsService.deletePhoto(
      this.parseProfessionalId(professionalId),
      user.tid,
    );

    return { success: true };
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
