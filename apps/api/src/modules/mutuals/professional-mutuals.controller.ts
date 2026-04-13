import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Action, Module } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../common/decorators/index.js';
import { MutualsService } from './mutuals.service.js';
import { addProfessionalMutualSchema } from '@sistema-odontologico/validation';

@Controller('admin/professionals')
export class ProfessionalMutualsController {
  constructor(private readonly mutualsService: MutualsService) {}

  // ─── GET /admin/professionals/:id/mutuals ──────────────

  @Get(':id/mutuals')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PROFESSIONALS, Action.VIEW_DETAIL)
  async getProfessionalMutuals(@Param('id') professionalId: string, @Req() req: any) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.mutualsService.getProfessionalMutuals(professionalId, user.tid);
  }

  // ─── POST /admin/professionals/:id/mutuals ─────────────

  @Post(':id/mutuals')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.PROFESSIONALS, Action.EDIT)
  async addProfessionalMutual(
    @Param('id') professionalId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = addProfessionalMutualSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de mutual inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.mutualsService.addProfessionalMutual(
      professionalId,
      parsed.data.mutualId,
      user.tid,
    );
  }

  // ─── DELETE /admin/professionals/:id/mutuals/:mutualId ─

  @Delete(':id/mutuals/:mutualId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.PROFESSIONALS, Action.EDIT)
  async removeProfessionalMutual(
    @Param('id') professionalId: string,
    @Param('mutualId') mutualId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();
    await this.mutualsService.removeProfessionalMutual(
      professionalId,
      mutualId,
      user.tid,
    );
  }
}
