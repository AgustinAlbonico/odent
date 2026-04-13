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
} from '@nestjs/common';
import { Action, Module } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../common/decorators/index.js';
import { MutualsService } from './mutuals.service.js';
import {
  createMutualSchema,
  updateMutualSchema,
  listMutualsQuerySchema,
} from '@sistema-odontologico/validation';

@Controller('admin/mutuals')
export class MutualsController {
  constructor(private readonly mutualsService: MutualsService) {}

  // ─── GET /admin/mutuals — List mutuals ────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.MUTUALS, Action.VIEW_LIST)
  async listMutuals(
    @Query() query: Record<string, string | undefined>,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = listMutualsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Parámetros de consulta inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.mutualsService.listMutuals(parsed.data, user.tid);
  }

  // ─── GET /admin/mutuals/:id — Mutual detail ───────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.MUTUALS, Action.VIEW_DETAIL)
  async getMutual(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.mutualsService.getMutualById(id, user.tid);
  }

  // ─── POST /admin/mutuals — Create mutual ──────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MUTUALS, Action.ADMIN_CATALOG)
  async createMutual(@Body() body: unknown, @Req() req: any) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = createMutualSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de mutual inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.mutualsService.createMutual(parsed.data, user.tid);
  }

  // ─── PATCH /admin/mutuals/:id — Update mutual ─────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.MUTUALS, Action.ADMIN_CATALOG)
  async updateMutual(@Param('id') id: string, @Body() body: unknown, @Req() req: any) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = updateMutualSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de actualización inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.mutualsService.updateMutual(id, parsed.data, user.tid);
  }

  // ─── DELETE /admin/mutuals/:id — Soft delete mutual ───

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.MUTUALS, Action.ADMIN_CATALOG)
  async deleteMutual(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.mutualsService.softDeleteMutual(id, user.tid);
  }
}
