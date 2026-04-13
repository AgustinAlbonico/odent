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
import { PatientsService } from './patients.service.js';
import {
  createPatientSchema,
  updatePatientSchema,
  listPatientsQuerySchema,
  changePatientStateSchema,
  createPatientMutualSchema,
  updatePatientMutualSchema,
} from '@sistema-odontologico/validation';

type AuthenticatedRequest = {
  user?: {
    sub: string;
    tid: string;
  };
  params: Record<string, string>;
};

@Controller('admin/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ─── GET /admin/patients — List patients ─────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.VIEW_LIST)
  async listPatients(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = listPatientsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Parámetros de consulta inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.patientsService.listPatients(parsed.data, user.tid);
  }

  // ─── GET /admin/patients/:id — Patient detail ────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.VIEW_DETAIL)
  async getPatient(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.patientsService.getPatientById(id, user.tid);
  }

  // ─── POST /admin/patients — Create patient ───────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.PATIENTS, Action.CREATE)
  async createPatient(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de paciente inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const input = parsed.data;
    return this.patientsService.createPatient({
      dni: input.dni || undefined,
      firstName: input.firstName,
      lastName: input.lastName,
      sex: input.sex || undefined,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      bloodGroup: input.bloodGroup || undefined,
      rhFactor: input.rhFactor || undefined,
      email: input.email || undefined,
      phone: input.phone || undefined,
      address: input.address || undefined,
      postalCode: input.postalCode || undefined,
      notes: input.notes || undefined,
    }, user.tid);
  }

  // ─── PATCH /admin/patients/:id — Update patient ──────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.EDIT)
  async updatePatient(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = updatePatientSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de actualización inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const input = parsed.data;
    return this.patientsService.updatePatient(id, {
      dni: input.dni,
      firstName: input.firstName,
      lastName: input.lastName,
      sex: input.sex || undefined,
      bloodGroup: input.bloodGroup || undefined,
      rhFactor: input.rhFactor || undefined,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      address: input.address,
      postalCode: input.postalCode,
      notes: input.notes,
    }, user.tid);
  }

  // ─── PATCH /admin/patients/:id/state — Change state ──

  @Patch(':id/state')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.CHANGE_STATUS)
  async changePatientState(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = changePatientStateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Estado inválido.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.patientsService.changePatientState(id, parsed.data.state, user.tid);
  }

  // ─── GET /admin/patients/:id/mutuals ─────────────────

  @Get(':id/mutuals')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.VIEW_DETAIL)
  async getPatientMutuals(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.patientsService.getPatientMutuals(id, user.tid);
  }

  // ─── POST /admin/patients/:id/mutuals ────────────────

  @Post(':id/mutuals')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.PATIENTS, Action.EDIT)
  async addPatientMutual(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = createPatientMutualSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de obra social inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.patientsService.addPatientMutual(id, parsed.data, user.tid);
  }

  // ─── DELETE /admin/patients/:id/mutuals/:mutualId ────

  @Delete(':id/mutuals/:mutualId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.PATIENTS, Action.EDIT)
  async removePatientMutual(
    @Param('id') id: string,
    @Param('mutualId') mutualId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();
    await this.patientsService.removePatientMutual(id, mutualId, user.tid);
  }

  // ─── PATCH /admin/patients/:id/mutuals/:mutualLinkId ─

  @Patch(':id/mutuals/:mutualLinkId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.PATIENTS, Action.EDIT)
  async updatePatientMutual(
    @Param('id') id: string,
    @Param('mutualLinkId') mutualLinkId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = updatePatientMutualSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de actualización inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.patientsService.updatePatientMutual(id, mutualLinkId, parsed.data, user.tid);
  }
}
