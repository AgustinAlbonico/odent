# Task Breakdown — Módulo de Turnos y Agenda

> **Fecha**: 2026-04-02
> **PRD**: `docs/prd/2026-03-30-turnos-y-agenda.md`
> **Design**: `docs/superpowers/specs/2026-04-02-turnos-y-agenda-design.md`
> **Release**: R1 — Operación diaria mínima vendible

---

## Fase 1 — Infraestructura Base

### T001 — Migración: tabla `appointments` (turnos)
**Descripción**: Crear la migración Drizzle para la tabla `appointments` con todas las columnas, tipos ENUM, FKs y índices definidos en el design spec.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla + enums)
- Nueva migración en `apps/api/drizzle/migrations/`

**Criterios de aceptación**:
- Tabla con columnas: id, tenant_id, professional_id, patient_id, mutual_id, start_at, end_at, status, source, notes, reminder_sent_at, confirmed_at, cancelled_by, cancellation_reason, created_by, created_at, updated_at
- Enums: appointment_status ('pending','confirmed','waiting','attended','cancelled','no_show'), appointment_source ('desk','whatsapp','web')
- FKs apuntando a professionals, patients, mutuals, users (tenant implícito)
- Índices: idx_appts_professional_date, idx_appts_patient, idx_appts_status

**Dependencias**: Ninguna
**Prioridad**: P0
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

---

### T002 — Migración: tabla `appointment_schedules` (horarios de atención)
**Descripción**: Crear la migración Drizzle para la tabla `appointment_schedules` que define la disponibilidad semanal de cada profesional.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla)
- Nueva migración

**Criterios de aceptación**:
- Columnas: id, tenant_id, professional_id, day_of_week (0-6), start_time, end_time, slot_duration_minutes, is_active
- Índice: idx_schedules_professional_day

**Dependencias**: Ninguna
**Prioridad**: P0
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

---

### T003 — Migración: tabla `appointment_exceptions` (excepciones/bloqueos)
**Descripción**: Crear la migración Drizzle para la tabla `appointment_exceptions` que registra bloqueos temporales de disponibilidad.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla)
- Nueva migración

**Criterios de aceptación**:
- Columnas: id, tenant_id, professional_id, start_date, end_date, start_time (nullable), end_time (nullable), reason, type (ENUM: 'full_day' | 'time_range')
- Índice: idx_exceptions_professional_date

**Dependencias**: Ninguna
**Prioridad**: P0
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

---

### T004 — Migración: tabla `holidays` (feriados)
**Descripción**: Crear la migración Drizzle para la tabla `holidays` que almacena feriados nacionales e institucionales.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla)
- Nueva migración

**Criterios de aceptación**:
- Columnas: id, tenant_id, date, name, type (ENUM: 'national' | 'institutional'), is_active
- Sin índice especial necesario (tabla pequeña)

**Dependencias**: Ninguna
**Prioridad**: P0
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

---

### T005 — Migración: tabla `appointment_audit_log` (trazabilidad)
**Descripción**: Crear la migración Drizzle para la tabla `appointment_audit_log` que registra cada cambio significativo en un turno.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla)
- Nueva migración

**Criterios de aceptación**:
- Columnas: id, tenant_id, appointment_id, action (ENUM: 'created','updated','status_changed','cancelled','rescheduled'), old_values (JSONB), new_values (JSONB), changed_by, changed_at
- Índice: idx_audit_appointment

**Dependencias**: T001
**Prioridad**: P0
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

---

### T006 — Migración: tabla `whatsapp_bot_sessions` (sesiones del bot)
**Descripción**: Crear la migración Drizzle para la tabla `whatsapp_bot_sessions` que mantiene el estado conversacional del bot de WhatsApp.

**Archivos**:
- `apps/api/src/infra/database/schema.ts` (agregar tabla)
- Nueva migración

**Criterios de aceptación**:
- Columnas: id, tenant_id, phone_number, patient_id (nullable), current_state (ENUM: 'idle','confirming','rescheduling','rescheduling_select_date','rescheduling_select_time'), context_data (JSONB), last_interaction_at, expires_at
- Índice: idx_wa_sessions_phone

**Dependencias**: Ninguna
**Prioridad**: P1
**Estimación**: S
**Estado**: ✅ Completado — 2026-04-02

### T007 — Configurar módulo NestJS `appointments`
**Descripción**: Crear la estructura base del módulo NestJS `appointments` con el archivo de módulo principal, importaciones necesarias y registro en el AppModule.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.module.ts`
- `apps/api/src/app.module.ts` (registrar módulo)

**Criterios de aceptación**:
- Módulo creado con imports de DatabaseModule, TenancyModule
- Registrado en AppModule
- Compilación exitosa sin errores

**Dependencias**: T001-T006 (migraciones completadas)
**Prioridad**: P0
**Estimación**: S

---

### T008 — Instalar dependencias externas
**Descripción**: Instalar los paquetes npm necesarios para el módulo: BullMQ, Redis client, FullCalendar, Resend, y dependencias de tipos.

**Paquetes backend**:
- `bullmq`, `ioredis` (ya puede estar instalado)
- `@nestjs/bullmq`

**Paquetes frontend**:
- `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/core`
- `date-fns` (si no está instalado)

**Archivos**:
- `apps/api/package.json`
- `apps/web/package.json`

**Criterios de aceptación**:
- Todos los paquetes instalados sin conflictos
- TypeScript reconoce los tipos

**Dependencias**: Ninguna
**Prioridad**: P0
**Estimación**: S

---

## Fase 2 — Backend Core (Turnos)

### T009 — Tipos y DTOs de turnos
**Descripción**: Definir los tipos TypeScript y DTOs de validación para las operaciones de turnos.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.types.ts`
- `apps/api/src/modules/appointments/dto/create-appointment.dto.ts`
- `apps/api/src/modules/appointments/dto/update-appointment.dto.ts`
- `apps/api/src/modules/appointments/dto/query-appointments.dto.ts`

**Criterios de aceptación**:
- Tipos: AppointmentStatus, AppointmentSource, Appointment entity
- DTO CreateAppointment: professional_id, patient_id, mutual_id (optional), start_at, end_at, notes (optional) — con class-validator
- DTO UpdateAppointment: campos parciales con class-validator
- DTO QueryAppointments: filtros por professional_id, patient_id, status, date_from, date_to, mutual_id, page, limit

**Dependencias**: T001, T007
**Prioridad**: P0
**Estimación**: S

---

### T010 — Repository de turnos
**Descripción**: Implementar el repositorio de turnos usando Drizzle ORM con métodos de consulta, creación, actualización y búsqueda.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.repository.ts`

**Criterios de aceptación**:
- Métodos: findById, findByProfessionalAndDateRange, findByPatient, findByFilters, create, update, softDelete (no, se usa status)
- Todas las queries incluyen `tenant_id` automáticamente (usar TenantContext existente)
- Métodos optimizados con los índices definidos en T001

**Dependencias**: T001, T007, T009
**Prioridad**: P0
**Estimación**: M

---

### T011 — Servicio de detección de conflictos (`conflicts.service.ts`)
**Descripción**: Implementar el motor de validación de conflictos que se ejecuta en cada creación o edición de turno. Es el corazón de las validaciones.

**Archivos**:
- `apps/api/src/modules/appointments/conflicts.service.ts`

**Criterios de aceptación**:
- Método `checkConflicts(professionalId, startAt, endAt, excludeId?)` retorna:
  - `hardBlocks`: array de bloqueos (excepciones vigentes, superposiciones)
  - `softWarnings`: array de advertencias (feriados, fuera de horario)
- Detección de superposición: A.start < B.end && A.end > B.start (excluye cancelled y no_show)
- Verificación de excepciones vigentes en el rango de fechas
- Verificación de feriados en la fecha
- Verificación de horario habitual del profesional

**Dependencias**: T001, T002, T003, T004, T010
**Prioridad**: P0
**Estimación**: M

---

### T012 — Servicio de transiciones de estado
**Descripción**: Implementar la máquina de estados del turno con validación de transiciones válidas y registro en audit log.

**Archivos**:
- Nuevo archivo o integrado en `appointments.service.ts`

**Criterios de aceptación**:
- Matriz de transiciones válidas implementada:
  - pending → confirmed, cancelled, no_show
  - confirmed → waiting, cancelled, no_show
  - waiting → attended, cancelled
  - attended, cancelled, no_show → terminales (sin transición)
- Cada transición registra entrada en `appointment_audit_log` con old_values y new_values
- Transición inválida lanza `BadRequestException` con mensaje descriptivo

**Dependencias**: T001, T005, T010
**Prioridad**: P0
**Estimación**: S

---

### T013 — Servicio principal de turnos (`appointments.service.ts`)
**Descripción**: Implementar el servicio principal que orquesta la creación, edición, cancelación y consulta de turnos, integrando el repositorio, el motor de conflictos y la máquina de estados.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.service.ts`

**Criterios de aceptación**:
- `create(input)`: valida conflictos, crea turno con status 'pending', registra audit log
- `update(id, input)`: valida conflictos para nuevo horario, actualiza, registra audit log
- `changeStatus(id, newStatus, userId)`: valida transición, actualiza, registra audit log
- `cancel(id, reason, userId)`: cambia a 'cancelled' con motivo obligatorio, registra audit log
- `findById(id)`: retorna turno con datos de profesional y paciente
- `findByFilters(filters)`: búsqueda paginada con filtros combinables
- `getCalendarData(dateRange, filters)`: datos optimizados para el calendario frontend

**Dependencias**: T010, T011, T012
**Prioridad**: P0
**Estimación**: M

---

### T014 — Controller de turnos (`appointments.controller.ts`)
**Descripción**: Implementar el controller REST con todos los endpoints de turnos definidos en el design spec.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.controller.ts`

**Criterios de aceptación**:
- `GET /appointments` — búsqueda avanzada con filtros (query params)
- `GET /appointments/:id` — detalle de un turno
- `POST /appointments` — crear turno (con validación de conflictos, retorna warnings si los hay)
- `PATCH /appointments/:id` — editar turno (re-valida conflictos)
- `PATCH /appointments/:id/status` — cambiar estado
- `POST /appointments/:id/cancel` — cancelar turno (reason obligatorio en body)
- `GET /appointments/calendar` — datos para calendario (mes/semana/día)
- `GET /appointments/availability` — consultar disponibilidad (professional_id + date_range)
- Todos los endpoints con guard de tenant-scoped auth
- Respuestas con códigos HTTP correctos (200, 201, 400, 404, 409)

**Dependencias**: T013
**Prioridad**: P0
**Estimación**: M

---

### T015 — Endpoint de disponibilidad (`GET /appointments/availability`)
**Descripción**: Implementar el endpoint que consulta los horarios disponibles para un profesional en un rango de fechas, considerando horarios habituales, excepciones, feriados y turnos existentes.

**Archivos**:
- Método en `appointments.controller.ts` y `appointments.service.ts`

**Criterios de aceptación**:
- Input: professional_id, date_from, date_to
- Output: array de slots disponibles con { date, time, is_available }
- Excluye: turnos existentes, excepciones vigentes, feriados
- Respeta slot_duration_minutes del horario habitual del profesional
- Performance: responde en < 500ms para un rango de 30 días

**Dependencias**: T011, T013
**Prioridad**: P0
**Estimación**: M

---

## Fase 3 — Backend Extendido (Horarios, Excepciones, Feriados)

### T016 — DTOs y tipos para horarios, excepciones y feriados
**Descripción**: Definir los DTOs de validación para las operaciones CRUD de horarios de atención, excepciones y feriados.

**Archivos**:
- `apps/api/src/modules/appointments/dto/schedule.dto.ts`
- `apps/api/src/modules/appointments/dto/exception.dto.ts`
- `apps/api/src/modules/appointments/dto/holiday.dto.ts`

**Criterios de aceptación**:
- ScheduleDto: professional_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active
- ExceptionDto: professional_id, start_date, end_date, start_time (optional), end_time (optional), reason, type
- HolidayDto: date, name, type, is_active

**Dependencias**: T002, T003, T004
**Prioridad**: P0
**Estimación**: S

---

### T017 — Servicio de horarios de atención (`schedules.service.ts`)
**Descripción**: Implementar el servicio CRUD para gestionar los horarios de atención de los profesionales.

**Archivos**:
- `apps/api/src/modules/appointments/schedules.service.ts`

**Criterios de aceptación**:
- `create(input)`: crea horario, valida que no se duplique (mismo profesional + mismo día + mismo rango)
- `findByProfessional(professionalId)`: retorna todos los horarios activos del profesional
- `update(id, input)`: actualiza horario existente
- `delete(id)`: elimina horario (soft delete con is_active = false)
- `getWeeklySchedule(professionalId)`: retorna horarios agrupados por día de la semana

**Dependencias**: T002, T016
**Prioridad**: P0
**Estimación**: S

---

### T018 — Servicio de excepciones (`exceptions.service.ts`)
**Descripción**: Implementar el servicio CRUD para gestionar excepciones y bloqueos de agenda.

**Archivos**:
- `apps/api/src/modules/appointments/exceptions.service.ts`

**Criterios de aceptación**:
- `create(input)`: crea excepción, valida que no se superponga con otra excepción del mismo profesional
- `findByProfessional(professionalId, dateFrom?, dateTo?)`: retorna excepciones filtrables por rango
- `delete(id)`: elimina excepción
- `isActiveForDate(professionalId, date)`: verifica si hay excepción vigente para una fecha (usado por conflicts.service)

**Dependencias**: T003, T016
**Prioridad**: P0
**Estimación**: S

---

### T019 — Servicio de feriados (`holidays.service.ts`)
**Descripción**: Implementar el servicio de gestión de feriados con sincronización desde ArgentinaDatos API.

**Archivos**:
- `apps/api/src/modules/appointments/holidays.service.ts`

**Criterios de aceptación**:
- `findByTenant(tenantId, year?)`: retorna feriados del tenant
- `addInstitutional(input)`: agrega feriado institucional manualmente
- `syncFromArgentinaDatos(year)`: consulta API ArgentinaDatos, hace upsert por fecha+nombre, no duplica
- `isHoliday(date, tenantId)`: verifica si una fecha es feriado
- Timeout de 5 segundos para la API externa
- Fallback: si la API no responde, no falla — usa datos locales existentes

**Dependencias**: T004, T016
**Prioridad**: P0
**Estimación**: M

---

### T020 — Controllers de horarios, excepciones y feriados
**Descripción**: Implementar los endpoints REST para la gestión de horarios, excepciones y feriados.

**Archivos**:
- Agregar métodos a `appointments.controller.ts` o crear controllers separados

**Criterios de aceptación**:
- `GET /schedules` — lista horarios (filtro por professional_id)
- `POST /schedules` — crear/editar horario
- `DELETE /schedules/:id` — eliminar horario
- `GET /exceptions` — lista excepciones (filtro por professional_id, date range)
- `POST /exceptions` — crear excepción
- `DELETE /exceptions/:id` — eliminar excepción
- `GET /holidays` — lista feriados del tenant
- `POST /holidays/sync` — sincronizar desde ArgentinaDatos (solo admin)
- `POST /holidays` — agregar feriado institucional (solo admin)
- Todos con auth tenant-scoped (excepto sync y add institucional que requieren admin)

**Dependencias**: T017, T018, T019
**Prioridad**: P0
**Estimación**: S

---

## Fase 4 — WhatsApp Bot

### T021 — Tipos y configuración de WhatsApp
**Descripción**: Definir los tipos TypeScript y la configuración del servicio de WhatsApp (Waha).

**Archivos**:
- `apps/api/src/modules/appointments/whatsapp/whatsapp.types.ts`
- `apps/api/src/modules/appointments/whatsapp/whatsapp.config.ts`

**Criterios de aceptación**:
- Tipos: WhatsAppMessage, WhatsAppButton, BotState, BotContext
- Configuración: WAHA_BASE_URL, WAHA_SESSION_NAME, WAHA_WEBHOOK_TOKEN (variables de entorno)
- Servicio configurado como provider inyectable en el módulo

**Dependencias**: T006
**Prioridad**: P1
**Estimación**: S

---

### T022 — Servicio de WhatsApp (`whatsapp.service.ts`)
**Descripción**: Implementar el servicio de comunicación con Waha para enviar mensajes de texto, botones interactivos y recibir webhooks.

**Archivos**:
- `apps/api/src/modules/appointments/whatsapp/whatsapp.service.ts`

**Criterios de aceptación**:
- `sendText(phoneNumber, text)`: envía mensaje de texto vía Waha API
- `sendButtons(phoneNumber, text, buttons)`: envía mensaje con botones interactivos
- `processIncomingMessage(message)`: procesa mensaje entrante y delega al bot handler
- Manejo de errores: si Waha no responde, loguea y no crash
- Identificación de paciente por phone_number

**Dependencias**: T021
**Prioridad**: P1
**Estimación**: M

---

### T023 — Máquina de estados del bot de WhatsApp
**Descripción**: Implementar la máquina de estados conversacional del bot con los flujos de confirmación, reprogramación y cancelación.

**Archivos**:
- `apps/api/src/modules/appointments/whatsapp/bot-statemachine.ts` (nuevo)

**Criterios de aceptación**:
- Estados: idle → confirming → rescheduling → rescheduling_select_date → rescheduling_select_time → cancelling
- Flujo IDLE: muestra menú principal con 3 opciones
- Flujo CONFIRMING: muestra datos del turno próximo, botones "Confirmo"/"No puedo"
- Flujo RESCHEDULING: muestra días disponibles como botones, luego horarios
- Flujo CANCELLING: muestra turno, botón "Sí, cancelar"
- Sesión expira a los 30 minutos de inactividad
- Si número no registrado: responde con mensaje de "no encontrado"
- Cada interacción actualiza `whatsapp_bot_sessions`

**Dependencias**: T006, T021, T022
**Prioridad**: P1
**Estimación**: L

---

### T024 — Webhook de WhatsApp (`whatsapp.controller.ts`)
**Descripción**: Implementar el endpoint webhook que recibe mensajes entrantes de Waha y los procesa.

**Archivos**:
- `apps/api/src/modules/appointments/whatsapp/whatsapp.controller.ts`

**Criterios de aceptación**:
- `POST /webhooks/whatsapp` — recibe payload de Waha
- Verificación de token de webhook (no usa JWT auth)
- Delega al bot-statemachine para procesar el mensaje
- Respuesta 200 OK inmediata (procesamiento async si es necesario)
- Log de mensajes entrantes para debugging

**Dependencias**: T022, T023
**Prioridad**: P1
**Estimación**: S

---

## Fase 5 — Worker y Jobs (BullMQ + Redis)

### T025 — Configuración de BullMQ y Redis
**Descripción**: Configurar las colas de BullMQ en el módulo de NestJS y las variables de entorno de Redis.

**Archivos**:
- `apps/api/src/modules/appointments/reminders/reminders.module.ts`
- `apps/api/.env` (agregar REDIS_URL)
- `apps/api/src/app.module.ts` (registrar BullModule)

**Criterios de aceptación**:
- Colas definidas: reminders, confirmations, whatsapp-outbound, email-outbound, holidays-sync
- Redis connection configurado vía REDIS_URL
- BullModule registrado en el módulo de appointments

**Dependencias**: T008
**Prioridad**: P1
**Estimación**: S

---

### T026 — Servicio de recordatorios (`reminders.service.ts`)
**Descripción**: Implementar el servicio que gestiona el envío de recordatorios de turnos por WhatsApp y email.

**Archivos**:
- `apps/api/src/modules/appointments/reminders/reminders.service.ts`

**Criterios de aceptación**:
- `scheduleReminder(appointmentId)`: programa recordatorio 24hs antes del turno
- `sendReminder(appointmentId)`: envía recordatorio por WhatsApp (canal principal)
- `sendEmailBackup(appointmentId)`: envía email de respaldo 1 hora después del WhatsApp
- `sendConfirmationRequest(appointmentId)`: envía solicitud de confirmación
- Actualiza `reminder_sent_at` en el turno después de enviar
- Templates de mensajes según design spec

**Dependencias**: T013, T022, T025
**Prioridad**: P1
**Estimación**: M

---

### T027 — Processor de colas (`reminders.processor.ts`)
**Descripción**: Implementar los processors de BullMQ que consumen las colas y ejecutan los jobs programados.

**Archivos**:
- `apps/api/src/modules/appointments/reminders/reminders.processor.ts`

**Criterios de aceptación**:
- Processor para cola `reminders`: busca turnos próximos (24hs), envía recordatorios
- Processor para cola `confirmations`: busca turnos que necesitan solicitud de confirmación
- Processor para cola `whatsapp-outbound`: envía mensajes salientes
- Processor para cola `email-outbound`: envía emails vía Resend
- Processor para cola `holidays-sync`: ejecuta sync mensual de feriados
- Reintentos configurados (3 intentos con backoff)
- Logs de éxito/fallo de cada job

**Dependencias**: T025, T026
**Prioridad**: P1
**Estimación**: M

---

### T028 — Entry point del worker (`worker/main.ts`)
**Descripción**: Crear el entry point separado del worker que levanta los módulos de NestJS necesarios sin iniciar el HTTP server.

**Archivos**:
- `apps/api/src/worker/main.ts`
- `apps/api/src/worker/worker.module.ts`

**Criterios de aceptación**:
- Worker levanta módulos de NestJS (appointments, communications, tenancy)
- No inicia HTTP server (solo procesadores de BullMQ)
- Comparte servicios con la API principal
- Graceful shutdown al recibir SIGTERM/SIGINT
- Script npm para ejecutar: `npm run worker`

**Dependencias**: T027
**Prioridad**: P1
**Estimación**: S

---

### T029 — Job de sincronización de feriados
**Descripción**: Implementar el job programado que sincroniza feriados desde ArgentinaDatos API una vez por mes.

**Archivos**:
- Integrado en `reminders.processor.ts` o archivo separado

**Criterios de aceptación**:
- Se ejecuta automáticamente 1 vez por mes (cron: `0 0 1 * *`)
- Consulta API para año actual y siguiente
- Upsert por fecha+nombre (no duplica)
- Feriados institucionales no se tocan
- Si la API falla, loguea warning pero no crashea

**Dependencias**: T019, T025, T027
**Prioridad**: P2
**Estimación**: S

---

## Fase 6 — Frontend: Calendario

### T030 — Layout y routing de appointments
**Descripción**: Crear la estructura de rutas del módulo de turnos en el frontend con layout y página raíz.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/layout.tsx`
- `apps/web/src/app/(dashboard)/appointments/page.tsx` (redirect a /calendar)

**Criterios de aceptación**:
- Layout con navegación secundaria (tabs o sidebar): Calendario, Búsqueda, Horarios, Excepciones
- Página raíz redirige a `/appointments/calendar`
- Breadcrumbs funcionales
- Título de página: "Turnos y Agenda"

**Dependencias**: Ninguna (frontend puede avanzar en paralelo con backend)
**Prioridad**: P0
**Estimación**: S

---

### T031 — Componente `StatusBadge` (badge de estado del turno)
**Descripción**: Crear el componente de badge que muestra el estado del turno con el color correspondiente del design system.

**Archivos**:
- `apps/web/src/components/appointments/shared/StatusBadge.tsx`

**Criterios de aceptación**:
- Variantes CVA: pending (warning/ámbar), confirmed (success/verde), waiting (primary/teal), attended (muted/gris), cancelled (muted/atenuado), no_show (destructive/atenuado)
- Muestra ícono de Lucide según estado
- Tooltip con descripción del estado
- Tamaño sm para tablas, md para cards

**Dependencias**: Design system existente
**Prioridad**: P0
**Estimación**: S

---

### T032 — Componente `CalendarHeader` (navegación del calendario)
**Descripción**: Crear el header del calendario con navegación (hoy, anterior, siguiente, date picker) y selector de vista.

**Archivos**:
- `apps/web/src/components/appointments/calendar/CalendarHeader.tsx`

**Criterios de aceptación**:
- Botones: Hoy, ← (anterior), → (siguiente)
- Date picker para saltar a fecha específica
- Selector de vista: Mes, Semana, Día, 24h (tabs o segmented control)
- Muestra el período actual (ej: "Abril 2026", "Semana del 13-19 de abril")
- Query params en URL para persistir vista y fecha

**Dependencias**: T030
**Prioridad**: P0
**Estimación**: S

---

### T033 — Componente `CalendarFilters` (filtros del calendario)
**Descripción**: Crear el panel de filtros del calendario: profesional, especialidad, mostrar/ocultar cancelados.

**Archivos**:
- `apps/web/src/components/appointments/calendar/CalendarFilters.tsx`

**Criterios de aceptación**:
- Select de profesional (carga desde API `/professionals`)
- Select de especialidad (dependiente del profesional o independiente)
- Toggle "Mostrar cancelados"
- Filtros persisten en URL como query params
- Diseño compacto, no intrusivo

**Dependencias**: T030, T032
**Prioridad**: P0
**Estimación**: S

---

### T034 — Componente `CalendarView` (contenedor principal del calendario)
**Descripción**: Crear el componente contenedor que integra FullCalendar con las 4 vistas y conecta con la API.

**Archivos**:
- `apps/web/src/components/appointments/calendar/CalendarView.tsx`

**Criterios de aceptación**:
- Integra `@fullcalendar/react` con plugins: daygrid, timegrid, list
- Vista mes: daygrid con indicadores de cantidad de turnos
- Vista semana: timegrid con columnas por día
- Vista día: timegrid con timeline por profesional
- Vista 24h: timegrid con rango 00:00-23:59
- Carga datos desde `GET /appointments/calendar` según rango visible
- Click en evento abre detalle del turno
- Localización en español (locale: 'es')
- Manejo de loading states con skeleton

**Dependencias**: T008, T031, T032, T033, T014
**Prioridad**: P0
**Estimación**: L

---

### T035 — Componente `AppointmentCard` (tarjeta de turno en calendario)
**Descripción**: Crear la tarjeta visual que representa un turno dentro del calendario, con color por estado.

**Archivos**:
- `apps/web/src/components/appointments/appointment-card/AppointmentCard.tsx`
- `apps/web/src/components/appointments/appointment-card/AppointmentCardMini.tsx`

**Criterios de aceptación**:
- AppointmentCard (vista día/semana): muestra hora, paciente, profesional, badge de estado
- AppointmentCardMini (vista mes): muestra solo hora + badge de estado (compacto)
- Borde lateral con color según estado (design system tokens)
- Hover: sombra sutil + cursor pointer
- Click: abre detalle o formulario de edición
- Truncamiento de texto largo con ellipsis

**Dependencias**: T031
**Prioridad**: P0
**Estimación**: S

---

### T036 — Página del calendario (`/appointments/calendar`)
**Descripción**: Crear la página principal que integra todos los componentes del calendario.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`

**Criterios de aceptación**:
- Integra CalendarHeader, CalendarFilters, CalendarView
- Fetch de datos de turnos para el rango visible
- Estado de loading con skeleton de tabla
- Estado de error con mensaje amigable
- Filtros y vista persisten en URL
- Responsive: se adapta a pantallas más pequeñas (aunque desktop-first)

**Dependencias**: T032, T033, T034, T035
**Prioridad**: P0
**Estimación**: M

---

## Fase 7 — Frontend: Formularios

### T037 — Componente `ConflictWarning` (alerta de conflicto)
**Descripción**: Crear el componente que muestra advertencias de conflicto al crear o editar turnos.

**Archivos**:
- `apps/web/src/components/appointments/shared/ConflictWarning.tsx`

**Criterios de aceptación**:
- Muestra hard blocks como Alert destructive (no se puede crear)
- Muestra soft warnings como Alert warning (se puede continuar)
- Mensajes descriptivos según el tipo de conflicto
- Botón "Continuar de todos modos" para soft warnings

**Dependencias**: T031
**Prioridad**: P0
**Estimación**: S

---

### T038 — Componente `CreateAppointmentForm` (alta de turno)
**Descripción**: Crear el formulario de alta de turno con validación en tiempo real de conflictos.

**Archivos**:
- `apps/web/src/components/appointments/forms/CreateAppointmentForm.tsx`

**Criterios de aceptación**:
- Campos: paciente (search/select), profesional (select), fecha (date picker), hora (time picker), duración (select), mutual (select opcional), observaciones (textarea)
- Al seleccionar profesional + fecha + hora: llama a `GET /appointments/availability` para validar
- Muestra ConflictWarning si hay soft warnings
- Bloquea submit si hay hard blocks
- Al crear: muestra toast de éxito, actualiza calendario
- Formulario en Dialog/Sheet (no página separada)
- Precarga de datos si viene del calendario (slot clickeado)

**Dependencias**: T037, T014, T015
**Prioridad**: P0
**Estimación**: M

---

### T039 — Componente `EditAppointmentForm` (edición/reagendado)
**Descripción**: Crear el formulario de edición de turno existente con re-validación de conflictos.

**Archivos**:
- `apps/web/src/components/appointments/forms/EditAppointmentForm.tsx`

**Criterios de aceptación**:
- Precarga datos del turno existente
- Mismos campos que CreateAppointmentForm
- Re-valida conflictos al cambiar fecha/hora/profesional
- Si cambia fecha/hora: registra como "rescheduled" en audit log
- Si cambia solo observaciones: registra como "updated"
- Dialog/Sheet para edición inline

**Dependencias**: T037, T038
**Prioridad**: P0
**Estimación**: M

---

### T040 — Componente `CancelAppointmentForm` (cancelación)
**Descripción**: Crear el diálogo de cancelación de turno con motivo obligatorio.

**Archivos**:
- `apps/web/src/components/appointments/forms/CancelAppointmentForm.tsx`

**Criterios de aceptación**:
- Muestra datos del turno a cancelar
- Campo obligatorio: motivo de cancelación (textarea)
- Confirmación antes de ejecutar
- Al cancelar: toast de éxito, turno se marca como cancelled en calendario
- Muestra turno cancelado atenuado si "mostrar cancelados" está activo

**Dependencias**: T014
**Prioridad**: P0
**Estimación**: S

---

### T041 — Componente `ChangeStatusForm` (cambio de estado rápido)
**Descripción**: Crear el componente de cambio de estado rápido (dropdown o menú contextual).

**Archivos**:
- `apps/web/src/components/appointments/forms/ChangeStatusForm.tsx`

**Criterios de aceptación**:
- Muestra solo transiciones válidas desde el estado actual
- Ej: desde "pending" muestra opciones: Confirmado, Cancelado, No asistió
- Ej: desde "waiting" muestra: Atendido, Cancelado
- Confirmación rápida (sin diálogo completo)
- Toast de confirmación al cambiar
- Actualiza calendario en tiempo real

**Dependencias**: T014, T031
**Prioridad**: P0
**Estimación**: S

---

### T042 — Página de detalle de turno (`/appointments/[id]`)
**Descripción**: Crear la página de detalle/edición de un turno específico.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/[id]/page.tsx`

**Criterios de aceptación**:
- Muestra datos completos del turno (paciente, profesional, fecha, hora, estado, mutual, observaciones)
- Botones de acción: Editar, Cancelar, Cambiar estado
- Historial de cambios (audit log del turno)
- Breadcrumb: Turnos > Detalle
- Estado de loading y error

**Dependencias**: T014, T038, T039, T040, T041
**Prioridad**: P0
**Estimación**: M

---

## Fase 8 — Frontend: Búsqueda y Gestión

### T043 — Componente `SearchFilters` (filtros de búsqueda avanzada)
**Descripción**: Crear el componente de filtros combinables para la búsqueda avanzada de turnos.

**Archivos**:
- `apps/web/src/components/appointments/search/SearchFilters.tsx`

**Criterios de aceptación**:
- Filtros: paciente (search input), profesional (select), fecha desde/hasta (date range pickers), estado (multi-select), mutual (select)
- Filtros combinables (todos opcionales)
- Botón "Buscar" y "Limpiar filtros"
- Filtros persisten en URL como query params
- Diseño en fila horizontal o grid compacto

**Dependencias**: T014
**Prioridad**: P0
**Estimación**: S

---

### T044 — Componente `SearchResults` (tabla de resultados)
**Descripción**: Crear la tabla de resultados de búsqueda con paginación y acciones rápidas.

**Archivos**:
- `apps/web/src/components/appointments/search/SearchResults.tsx`

**Criterios de aceptación**:
- Tabla con columnas: Fecha, Hora, Paciente, Profesional, Mutual, Estado, Acciones
- StatusBadge en columna de estado
- Acciones rápidas por fila: Ver detalle, Cambiar estado, Cancelar
- Paginación (20 resultados por página)
- Empty state cuando no hay resultados
- Skeleton loading mientras carga

**Dependencias**: T031, T041, T043
**Prioridad**: P0
**Estimación**: M

---

### T045 — Página de búsqueda (`/appointments/search`)
**Descripción**: Crear la página de búsqueda avanzada de turnos.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/search/page.tsx`

**Criterios de aceptación**:
- Integra SearchFilters + SearchResults
- Búsqueda se ejecuta al hacer submit o al cambiar filtros (con debounce)
- URL con query params para compartir búsquedas
- Performance: respuesta en < 1 segundo con filtros combinados

**Dependencias**: T043, T044
**Prioridad**: P0
**Estimación**: S

---

### T046 — Componente `ScheduleForm` (formulario de horarios)
**Descripción**: Crear el formulario para crear/editar horarios de atención de un profesional.

**Archivos**:
- `apps/web/src/components/appointments/availability/ScheduleForm.tsx`

**Criterios de aceptación**:
- Campos: profesional (select), día de la semana (select), hora inicio, hora fin, duración del turno (select: 15, 20, 30, 45, 60 min)
- Visualización semanal tipo grilla (visualizar horarios existentes)
- Validación: no duplicar rangos para mismo profesional + mismo día
- Crear y editar en el mismo componente

**Dependencias**: T017, T020
**Prioridad**: P1
**Estimación**: M

---

### T047 — Página de horarios (`/appointments/schedules`)
**Descripción**: Crear la página de gestión de horarios de atención.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/schedules/page.tsx`

**Criterios de aceptación**:
- Lista de horarios por profesional
- Botón "Agregar horario" abre ScheduleForm
- Acciones: editar, eliminar horario
- Filtro por profesional
- Confirmación antes de eliminar

**Dependencias**: T046
**Prioridad**: P1
**Estimación**: S

---

### T048 — Componente `ExceptionForm` (formulario de excepciones)
**Descripción**: Crear el formulario para crear excepciones/bloqueos de agenda.

**Archivos**:
- `apps/web/src/components/appointments/exceptions/ExceptionForm.tsx`

**Criterios de aceptación**:
- Campos: profesional (select), tipo (full_day / time_range), fecha inicio, fecha fin, hora inicio (si time_range), hora fin (si time_range), motivo (textarea)
- Validación: no superponer con excepciones existentes del mismo profesional
- Preview visual del bloqueo en una mini-grilla

**Dependencias**: T018, T020
**Prioridad**: P1
**Estimación**: M

---

### T049 — Componente `ExceptionList` (lista de excepciones)
**Descripción**: Crear la lista de excepciones activas con acciones de gestión.

**Archivos**:
- `apps/web/src/components/appointments/exceptions/ExceptionList.tsx`

**Criterios de aceptación**:
- Tabla con columnas: Profesional, Período, Tipo, Motivo, Acciones
- Filtro por profesional y por estado (activas/vencidas)
- Acción: eliminar excepción (con confirmación)
- Indicador visual de excepciones vigentes vs futuras

**Dependencias**: T048
**Prioridad**: P1
**Estimación**: S

---

### T050 — Página de excepciones (`/appointments/exceptions`)
**Descripción**: Crear la página de gestión de excepciones/bloqueos.

**Archivos**:
- `apps/web/src/app/(dashboard)/appointments/exceptions/page.tsx`

**Criterios de aceptación**:
- Integra ExceptionForm + ExceptionList
- Botón "Agregar excepción" abre formulario en dialog
- Lista filtrable por profesional
- Confirmación antes de eliminar

**Dependencias**: T048, T049
**Prioridad**: P1
**Estimación**: S

---

### T051 — Componente `HolidayIndicator` (indicador de feriado)
**Descripción**: Crear el componente que indica visualmente cuando una fecha es feriado.

**Archivos**:
- `apps/web/src/components/appointments/shared/HolidayIndicator.tsx`

**Criterios de aceptación**:
- Muestra badge/icono cuando la fecha seleccionada es feriado
- Tooltip con nombre del feriado
- Diferencia visual entre feriado nacional e institucional
- Se integra en el date picker y en la vista de calendario

**Dependencias**: T019
**Prioridad**: P2
**Estimación**: S

---

### T052 — Componente `AvailabilityGrid` (grilla de horarios disponibles)
**Descripción**: Crear la grilla visual de horarios disponibles para un profesional en una fecha específica.

**Archivos**:
- `apps/web/src/components/appointments/availability/AvailabilityGrid.tsx`

**Criterios de aceptación**:
- Muestra slots de tiempo disponibles/no disponibles
- Slots ocupados: atenuados, no clickeables
- Slots disponibles: clickeables, con hover
- Agrupados por franja horaria (mañana/tarde)
- Se usa en el formulario de creación de turnos y en el bot de reprogramación

**Dependencias**: T015
**Prioridad**: P2
**Estimación**: M

---

## Fase 9 — Integración y Testing

### T053 — Pruebas unitarias del backend de turnos
**Descripción**: Escribir pruebas unitarias para los servicios core del módulo de turnos.

**Archivos**:
- `apps/api/src/modules/appointments/appointments.service.spec.ts`
- `apps/api/src/modules/appointments/conflicts.service.spec.ts`
- `apps/api/src/modules/appointments/schedules.service.spec.ts`
- `apps/api/src/modules/appointments/exceptions.service.spec.ts`
- `apps/api/src/modules/appointments/holidays.service.spec.ts`

**Criterios de aceptación**:
- Tests de conflictos: superposición, excepciones, feriados, fuera de horario
- Tests de transiciones de estado: válidas e inválidas
- Tests de CRUD de turnos con mock del repositorio
- Tests de horarios: duplicación, eliminación
- Tests de excepciones: superposición
- Tests de feriados: sync, detección
- Cobertura mínima: 80% en servicios core

**Dependencias**: T011, T012, T013, T017, T018, T019
**Prioridad**: P0
**Estimación**: M

---

### T054 — Pruebas E2E del flujo completo de turnos
**Descripción**: Escribir pruebas E2E con Playwright que validen el flujo completo: crear turno → ver en calendario → cambiar estado → cancelar.

**Archivos**:
- `apps/web/e2e/appointments.spec.ts` (o archivo equivalente)

**Criterios de aceptación**:
- Test: crear turno desde formulario, verificar que aparece en calendario
- Test: cambiar estado de pending a confirmed a attended
- Test: cancelar turno con motivo, verificar que se muestra atenuado
- Test: búsqueda avanzada con filtros combinados
- Test: detección de conflictos (intenta crear turno superpuesto)
- Test: navegación entre vistas del calendario (mes, semana, día)
- Todas las pruebas pasan en CI

**Dependencias**: T036, T038, T040, T041, T045
**Prioridad**: P0
**Estimación**: M

---

### T055 — Pruebas E2E de horarios y excepciones
**Descripción**: Escribir pruebas E2E para los flujos de gestión de horarios y excepciones.

**Archivos**:
- `apps/web/e2e/schedules.spec.ts`
- `apps/web/e2e/exceptions.spec.ts`

**Criterios de aceptación**:
- Test: crear horario de atención, verificar que aparece en lista
- Test: eliminar horario, verificar que desaparece
- Test: crear excepción, verificar que bloquea turnos en ese rango
- Test: eliminar excepción, verificar que se libera el rango

**Dependencias**: T047, T050
**Prioridad**: P1
**Estimación**: S

---

### T056 — Pruebas E2E del bot de WhatsApp (simulado)
**Descripción**: Escribir pruebas del bot de WhatsApp con mock de Waha API.

**Archivos**:
- `apps/api/src/modules/appointments/whatsapp/whatsapp.service.spec.ts`
- `apps/api/src/modules/appointments/whatsapp/bot-statemachine.spec.ts`

**Criterios de aceptación**:
- Test: flujo de confirmación completo (idle → confirming → confirmed)
- Test: flujo de cancelación completo (idle → cancelling → cancelled)
- Test: flujo de reprogramación (idle → rescheduling → select_date → select_time)
- Test: número no registrado → mensaje de error
- Test: expiración de sesión a los 30 minutos
- Mock de Waha API para no depender del servicio real

**Dependencias**: T022, T023
**Prioridad**: P1
**Estimación**: M

---

### T057 — Validación multi-tenant
**Descripción**: Verificar que todas las queries del módulo respetan el aislamiento de tenant.

**Archivos**:
- Tests específicos en los spec files existentes
- `apps/api/src/modules/appointments/tenancy.spec.ts`

**Criterios de aceptación**:
- Ninguna query retorna datos de otro tenant
- Creación de turno asocia correctamente al tenant actual
- Tests con múltiples tenants verifican aislamiento
- Webhook de WhatsApp valida tenant por número de teléfono

**Dependencias**: T053
**Prioridad**: P0
**Estimación**: S

---

### T058 — Documentación de API y actualización de funcionalidades
**Descripción**: Documentar los endpoints del módulo y actualizar el inventario de funcionalidades implementadas.

**Archivos**:
- `docs/funcionalidades-implementadas.md` (actualizar)
- Documentación de API (Swagger/OpenAPI si está configurado)

**Criterios de aceptación**:
- `docs/funcionalidades-implementadas.md` actualizado con todas las features del módulo
- Endpoints documentados con request/response examples
- Variables de entorno documentadas (.env.example actualizado)
- Instrucciones de despliegue del worker documentadas

**Dependencias**: Todas las tasks anteriores completadas
**Prioridad**: P0
**Estimación**: S

---

## Resumen de dependencias y orden de ejecución

```
FASE 1: Infraestructura
  T001 ─┬─ T005 ──┐
  T002 ─┤         ├── T007 ── T009 ── T010 ──┐
  T003 ─┤         │                           │
  T004 ─┘         │                           │
  T006 ───────────┘                           │
  T008 ───────────────────────────────────────┘

FASE 2: Backend Core
  T010 ── T011 ──┬─ T013 ── T014 ── T034 ── T036
  T012 ──────────┘         │          │
  T015 ────────────────────┘          │
                                      │
FASE 3: Backend Extendido             │
  T002 ── T016 ── T017 ──┬─ T020 ────┘
  T003 ── T016 ── T018 ──┤
  T004 ── T016 ── T019 ──┘

FASE 4: WhatsApp Bot
  T006 ── T021 ── T022 ── T023 ── T024

FASE 5: Worker
  T008 ── T025 ── T026 ── T027 ── T028
                 T019 ── T029

FASE 6: Frontend Calendario
  T030 ── T032 ── T033 ── T034 ── T036
  T031 ── T035 ────────────┘

FASE 7: Frontend Formularios
  T037 ── T038 ── T039 ──┬─ T042
  T040 ──────────────────┤
  T041 ──────────────────┘

FASE 8: Frontend Búsqueda y Gestión
  T043 ── T044 ── T045
  T046 ── T047
  T048 ── T049 ── T050
  T051 (independiente)
  T052 (independiente)

FASE 9: Integración y Testing
  T053 ── T057 ── T058
  T054 ──────────┘
  T055 ──────────┘
  T056 ──────────┘
```

## Matriz de prioridades

| Prioridad | Tasks | Descripción |
|-----------|-------|-------------|
| **P0** | T001-T005, T007-T015, T016-T020, T030-T045, T053-T054, T057-T058 | Crítico: sin esto no hay módulo funcional |
| **P1** | T006, T021-T029, T046-T050, T055-T056 | Importante: WhatsApp, worker, gestión de horarios |
| **P2** | T051-T052 | Deseable: indicadores visuales y grilla de disponibilidad |

## Estimación total

| Tamaño | Cantidad | Tasks |
|--------|----------|-------|
| **S** (Small) | 28 | T001-T008, T009, T012, T016, T017, T018, T020, T021, T024, T025, T028, T029, T031-T033, T035, T037, T040-T041, T043, T045, T047, T049, T051, T055, T057-T058 |
| **M** (Medium) | 17 | T010, T011, T013-T015, T019, T022, T026-T027, T036, T038-T039, T042, T044, T046, T048, T052-T054, T056 |
| **L** (Large) | 2 | T023, T034 |

**Total: 47 tasks** — Estimación de 8-12 semanas con equipo de 2-3 desarrolladores full-stack.
