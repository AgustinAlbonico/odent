import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import {
  changeAppointmentStatusSchema,
  createAppointmentSchema,
  queryAppointmentsSchema,
  updateAppointmentSchema,
} from '@sistema-odontologico/validation';
import { AppointmentsService } from './appointments.service.js';
import { SchedulesService } from './schedules.service.js';
import { ExceptionsService } from './exceptions.service.js';
import { HolidaysService } from './holidays.service.js';
import type { CalendarFilters } from './appointments.repository.js';
import type { AppointmentStatus } from './appointments.types.js';

type AuthenticatedRequest = {
  user?: {
    sub: string;
    tid: string;
    role?: string;
  };
  params: Record<string, string>;
};

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentsService,
    private readonly schedulesService: SchedulesService,
    private readonly exceptionsService: ExceptionsService,
    private readonly holidaysService: HolidaysService,
  ) {}

  // ─── GET /appointments — Búsqueda avanzada con filtros ──────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = queryAppointmentsSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Parámetros de consulta inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.service.findAll(parsed.data, user.tid);
  }

  // ─── POST /appointments — Crear turno ───────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de turno inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.service.create(parsed.data, user.tid, user.sub);
  }

  // ─── PATCH /appointments/:id — Editar turno ─────────────────────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = updateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Datos de actualización inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.service.update(id, parsed.data, user.tid, user.sub);
  }

  // ─── PATCH /appointments/:id/status — Cambiar estado ────────────────

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const parsed = changeAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Estado inválido.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return this.service.changeStatus(id, parsed.data.status, user.tid, user.sub);
  }

  // ─── POST /appointments/:id/cancel — Cancelar turno ─────────────────

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    if (!body || typeof body !== 'object' || !('reason' in body)) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'El motivo de cancelación es obligatorio.',
      });
    }

    const reason = (body as { reason: string }).reason;
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'El motivo de cancelación debe ser un texto no vacío.',
      });
    }

    return this.service.cancel(id, reason.trim(), user.tid, user.sub);
  }

  // ─── GET /appointments/professionals — Profesionales para selects ────

  @Get('professionals')
  @HttpCode(HttpStatus.OK)
  async getProfessionals(@Req() req: AuthenticatedRequest) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();
    return this.service.findProfessionalsForSelect(user.tid);
  }

  // ─── GET /appointments/calendar — Datos para calendario ─────────────

  @Get('calendar')
  @HttpCode(HttpStatus.OK)
  async getCalendarData(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const { from, to, professionalIds, status } = query;

    if (!from || !to) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Los parámetros "from" y "to" son obligatorios.',
      });
    }

    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Formato de fecha inválido. Use YYYY-MM-DD.',
      });
    }

    const filters: CalendarFilters = {};

    if (professionalIds) {
      filters.professionalIds = professionalIds.split(',').map((id) => id.trim());
    }

    if (status) {
      filters.status = status.split(',').map((s) => s.trim()) as AppointmentStatus[];
    }

    return this.service.getCalendarData(dateFrom, dateTo, filters, user.tid);
  }

  // ─── GET /appointments/availability — Consultar disponibilidad ──────

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  async getAvailability(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const { professionalId, from, to } = query;

    if (!professionalId) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'El parámetro "professionalId" es obligatorio.',
      });
    }

    if (!from || !to) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Los parámetros "from" y "to" son obligatorios.',
      });
    }

    const dateFrom = new Date(from);
    const dateTo = new Date(to);

    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'Formato de fecha inválido. Use YYYY-MM-DD.',
      });
    }

    return this.service.getAvailability(professionalId, dateFrom, dateTo, user.tid);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SCHEDULES (Horarios de atención)
  // ─────────────────────────────────────────────────────────────────────

  @Get('schedules')
  @HttpCode(HttpStatus.OK)
  async getSchedules(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const { professionalId } = query;
    const effectiveProfessionalId = user.role === 'profesional' ? user.sub : professionalId;

    if (effectiveProfessionalId) {
      return this.schedulesService.findByProfessional(effectiveProfessionalId, user.tid);
    }

    return this.schedulesService.findAll(user.tid);
  }

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    if (!body || typeof body !== 'object') {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'El cuerpo de la petición es obligatorio.',
      });
    }

    const payload = body as Record<string, unknown>;
    const { professionalId, dayOfWeek, startTime, endTime, slotDurationMinutes } = payload;
    const effectiveProfessionalId = user.role === 'profesional' ? user.sub : professionalId;

    if (!effectiveProfessionalId || dayOfWeek === undefined || !startTime || !endTime || !slotDurationMinutes) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'professionalId, dayOfWeek, startTime, endTime y slotDurationMinutes son obligatorios.',
      });
    }

    return this.schedulesService.create(
      {
        professionalId: effectiveProfessionalId as string,
        dayOfWeek: Number(dayOfWeek),
        startTime: startTime as string,
        endTime: endTime as string,
        slotDurationMinutes: Number(slotDurationMinutes),
      },
      user.tid,
    );
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSchedule(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    return this.schedulesService.delete(id, user.tid);
  }

  // ─────────────────────────────────────────────────────────────────────
  // EXCEPTIONS (Excepciones / Bloqueos)
  // ─────────────────────────────────────────────────────────────────────

  @Get('exceptions')
  @HttpCode(HttpStatus.OK)
  async getExceptions(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const { professionalId, dateFrom, dateTo } = query;
    const effectiveProfessionalId = user.role === 'profesional' ? user.sub : professionalId;

    if (effectiveProfessionalId) {
      return this.exceptionsService.findByProfessional(
        effectiveProfessionalId,
        user.tid,
        dateFrom,
        dateTo,
      );
    }

    return this.exceptionsService.findAll(user.tid, dateFrom, dateTo);
  }

  @Post('exceptions')
  @HttpCode(HttpStatus.CREATED)
  async createException(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    if (!body || typeof body !== 'object') {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'El cuerpo de la petición es obligatorio.',
      });
    }

    const payload = body as Record<string, unknown>;
    const { professionalId, startDate, endDate, startTime, endTime, reason, type } = payload;
    const effectiveProfessionalId = user.role === 'profesional' ? user.sub : professionalId;

    if (!effectiveProfessionalId || !startDate || !endDate || !reason || !type) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'professionalId, startDate, endDate, reason y type son obligatorios.',
      });
    }

    if (type !== 'full_day' && type !== 'time_range') {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'type debe ser "full_day" o "time_range".',
      });
    }

    if (type === 'time_range' && (!startTime || !endTime)) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'Para excepciones de tipo "time_range", startTime y endTime son obligatorios.',
      });
    }

    return this.exceptionsService.create(
      {
        professionalId: effectiveProfessionalId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        startTime: startTime as string | undefined,
        endTime: endTime as string | undefined,
        reason: reason as string,
        type: type as 'full_day' | 'time_range',
      },
      user.tid,
    );
  }

  @Delete('exceptions/:id')
  @HttpCode(HttpStatus.OK)
  async deleteException(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    return this.exceptionsService.delete(id, user.tid);
  }

  // ─────────────────────────────────────────────────────────────────────
  // HOLIDAYS (Feriados)
  // ─────────────────────────────────────────────────────────────────────

  @Get('holidays')
  @HttpCode(HttpStatus.OK)
  async getHolidays(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    const { year } = query;
    return this.holidaysService.findByTenant(
      user.tid,
      year ? Number(year) : undefined,
    );
  }

  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  async addHoliday(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    // Only admins can add holidays
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Solo administradores pueden agregar feriados.');
    }

    if (!body || typeof body !== 'object') {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'El cuerpo de la petición es obligatorio.',
      });
    }

    const payload = body as Record<string, unknown>;
    const { date, name } = payload;

    if (!date || !name) {
      throw new BadRequestException({
        code: 'invalid_payload',
        message: 'date y name son obligatorios.',
      });
    }

    return this.holidaysService.addInstitutional(
      { date: date as string, name: name as string },
      user.tid,
    );
  }

  @Post('holidays/sync')
  @HttpCode(HttpStatus.OK)
  async syncHolidays(
    @Query() query: Record<string, string | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    // Only admins can sync holidays
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Solo administradores pueden sincronizar feriados.');
    }

    const { year } = query;
    if (!year) {
      throw new BadRequestException({
        code: 'invalid_query',
        message: 'El parámetro "year" es obligatorio.',
      });
    }

    return this.holidaysService.syncFromArgentinaDatos(Number(year), user.tid);
  }

  // ─── GET /appointments/:id — Detalle de un turno ────────────────────
  // MUST be declared AFTER all specific @Get routes (calendar, availability,
  // schedules, exceptions, holidays) to avoid :id matching them first.

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = (req as any).user;
    if (!user?.tid) throw new UnauthorizedException();

    return this.service.findOne(id, user.tid);
  }
}
