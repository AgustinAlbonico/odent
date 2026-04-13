# Diseño técnico — Módulo de Turnos y Agenda

> **Fecha**: 2026-04-02  
> **Estado**: diseño aprobado  
> **PRD de referencia**: `docs/prd/2026-03-30-turnos-y-agenda.md`  
> **Release**: R1 — Operación diaria mínima vendible  

---

## 1. Visión general

El módulo de Turnos y Agenda es el corazón operativo del sistema. Permite a recepcionistas y profesionales gestionar la atención diaria de la clínica: crear turnos, reprogramar, cancelar, confirmar asistencia y visualizar la agenda en múltiples vistas (mes, semana, día, 24h).

Además, incluye un **bot de WhatsApp estructurado** (sin IA) que permite a los pacientes confirmar, reprogramar o cancelar turnos directamente desde WhatsApp, y un sistema de **recordatorios automáticos** por WhatsApp y email.

### Decisiones de diseño clave

| Decisión | Valor | Razón |
|----------|-------|-------|
| Arquitectura | Módulo dentro del modular monolith (Enfoque 1) | Consistente con la arquitectura actual, mínimo overhead |
| Calendario | FullCalendar | Librería madura que resuelve las 4 vistas sin reinventar la rueda |
| WhatsApp | Waha (self-hosted, gratuito) | Sin costo, API REST simple, suficiente para MVP |
| Email | Resend (free tier: 3000/mes) | API moderna, buen deliverability, gratis para MVP |
| Cola de tareas | BullMQ + Redis | Ecosistema Node/NestJS maduro, buen tooling |
| Feriados | ArgentinaDatos API + tabla local | API gratuita de Argentina; sincronización periódica, no dependencia en hot path |
| Consultorios | Fuera de alcance | No se asignan consultorios a turnos en esta versión |
| Reserva por paciente | Solo vía WhatsApp bot | Sin portal web de autogestión por ahora |

---

## 2. Modelo de datos

Todas las tablas incluyen `tenant_id` (UUID) por el modelo multi-tenant.

### 2.1 `appointment_schedules` — Horarios de atención

Define la disponibilidad semanal de cada profesional. Un profesional puede tener múltiples rangos por día (ej: mañana 9-12 y tarde 14-18).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| professional_id | UUID FK | Profesional |
| day_of_week | INT | 0=Domingo, 1=Lunes, ..., 6=Sábado |
| start_time | TIME | Hora inicio (ej: `09:00`) |
| end_time | TIME | Hora fin (ej: `17:00`) |
| slot_duration_minutes | INT | Duración de cada turno (ej: 30) |
| is_active | BOOLEAN | Si está vigente |

### 2.2 `appointment_exceptions` — Excepciones / Bloqueos

Bloqueos temporales que anulan el horario habitual (vacaciones, licencias, congresos, compromisos personales).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| professional_id | UUID FK | Profesional |
| start_date | DATE | Fecha inicio del bloqueo |
| end_date | DATE | Fecha fin del bloqueo |
| start_time | TIME | Hora inicio (null = todo el día) |
| end_time | TIME | Hora fin (null = todo el día) |
| reason | VARCHAR | Motivo (vacaciones, licencia, etc.) |
| type | ENUM | `full_day` o `time_range` |

### 2.3 `appointments` — Turnos

La entidad central del módulo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| professional_id | UUID FK | Profesional |
| patient_id | UUID FK | Paciente |
| mutual_id | UUID FK | Mutual (nullable) |
| start_at | TIMESTAMPTZ | Fecha y hora de inicio |
| end_at | TIMESTAMPTZ | Fecha y hora de fin |
| status | ENUM | `pending`, `confirmed`, `waiting`, `attended`, `cancelled`, `no_show` |
| source | ENUM | `desk` (recepción), `whatsapp`, `web` |
| notes | TEXT | Observaciones operativas |
| reminder_sent_at | TIMESTAMPTZ | Último recordatorio enviado |
| confirmed_at | TIMESTAMPTZ | Timestamp de confirmación |
| cancelled_by | UUID FK | User que canceló (nullable) |
| cancellation_reason | TEXT | Motivo de cancelación |
| created_by | UUID FK | User que creó el turno |
| created_at | TIMESTAMPTZ | Timestamp de creación |
| updated_at | TIMESTAMPTZ | Timestamp de última actualización |

### 2.4 `holidays` — Feriados

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| date | DATE | Fecha del feriado |
| name | VARCHAR | Nombre (ej: "Año Nuevo") |
| type | ENUM | `national` (de ArgentinaDatos) o `institutional` (manual) |
| is_active | BOOLEAN | Si está vigente |

### 2.5 `appointment_audit_log` — Trazabilidad

Registra cada cambio significativo en un turno.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| appointment_id | UUID FK | Turno afectado |
| action | ENUM | `created`, `updated`, `status_changed`, `cancelled`, `rescheduled` |
| old_values | JSONB | Estado anterior (snapshot) |
| new_values | JSONB | Estado nuevo (snapshot) |
| changed_by | UUID FK | User que hizo el cambio |
| changed_at | TIMESTAMPTZ | Timestamp |

### 2.6 `whatsapp_bot_sessions` — Sesiones del bot

Estado actual del flujo conversacional por número de teléfono.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| tenant_id | UUID FK | Tenant |
| phone_number | VARCHAR | Número del paciente (E.164) |
| patient_id | UUID FK | Paciente vinculado (nullable hasta que se identifique) |
| current_state | ENUM | `idle`, `confirming`, `rescheduling`, `cancelling`, `rescheduling_select_date`, `rescheduling_select_time` |
| context_data | JSONB | Datos del flujo (turno actual, fecha seleccionada, etc.) |
| last_interaction_at | TIMESTAMPTZ | Última interacción |
| expires_at | TIMESTAMPTZ | Expiración de la sesión (30 min de inactividad) |

### 2.7 Índices

```sql
-- Búsqueda por profesional y fecha (la query más frecuente)
CREATE INDEX idx_appts_professional_date ON appointments(tenant_id, professional_id, start_at);

-- Búsqueda por paciente
CREATE INDEX idx_appts_patient ON appointments(tenant_id, patient_id, start_at);

-- Búsqueda por estado
CREATE INDEX idx_appts_status ON appointments(tenant_id, status, start_at);

-- Disponibilidad: horarios por profesional y día
CREATE INDEX idx_schedules_professional_day ON appointment_schedules(tenant_id, professional_id, day_of_week);

-- Excepciones: bloqueos por profesional y fecha
CREATE INDEX idx_exceptions_professional_date ON appointment_exceptions(tenant_id, professional_id, start_date, end_date);

-- Sesiones de WhatsApp por número
CREATE INDEX idx_wa_sessions_phone ON whatsapp_bot_sessions(tenant_id, phone_number);

-- Audit log por turno
CREATE INDEX idx_audit_appointment ON appointment_audit_log(tenant_id, appointment_id, changed_at);
```

---

## 3. Arquitectura del backend

### 3.1 Estructura de archivos

```
apps/api/src/modules/appointments/
├── appointments.module.ts
├── appointments.controller.ts
├── appointments.service.ts
├── appointments.repository.ts
├── appointments.types.ts
├── schedules.service.ts
├── exceptions.service.ts
├── conflicts.service.ts
├── holidays.service.ts
├── whatsapp/
│   ├── whatsapp.controller.ts
│   ├── whatsapp.service.ts
│   └── whatsapp.types.ts
├── reminders/
│   ├── reminders.processor.ts
│   └── reminders.service.ts
└── dto/
    ├── create-appointment.dto.ts
    ├── update-appointment.dto.ts
    ├── query-appointments.dto.ts
    └── schedule.dto.ts
```

### 3.2 Endpoints REST

| Método | Path | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/appointments` | Búsqueda avanzada con filtros | Tenant-scoped |
| `GET` | `/appointments/:id` | Detalle de un turno | Tenant-scoped |
| `POST` | `/appointments` | Crear turno | Tenant-scoped |
| `PATCH` | `/appointments/:id` | Editar turno | Tenant-scoped |
| `PATCH` | `/appointments/:id/status` | Cambiar estado | Tenant-scoped |
| `POST` | `/appointments/:id/cancel` | Cancelar turno | Tenant-scoped |
| `GET` | `/appointments/calendar` | Datos para calendario (mes/semana/día) | Tenant-scoped |
| `GET` | `/appointments/availability` | Consultar disponibilidad | Tenant-scoped |
| `GET` | `/schedules` | Horarios de atención | Tenant-scoped |
| `POST` | `/schedules` | Crear/editar horario | Tenant-scoped |
| `DELETE` | `/schedules/:id` | Eliminar horario | Tenant-scoped |
| `GET` | `/exceptions` | Excepciones de un profesional | Tenant-scoped |
| `POST` | `/exceptions` | Crear excepción | Tenant-scoped |
| `DELETE` | `/exceptions/:id` | Eliminar excepción | Tenant-scoped |
| `GET` | `/holidays` | Feriados del tenant | Tenant-scoped |
| `POST` | `/holidays/sync` | Sincronizar desde ArgentinaDatos | Admin |
| `POST` | `/holidays` | Agregar feriado institucional | Admin |
| `POST` | `/webhooks/whatsapp` | Webhook de WhatsApp (Waha) | Sin auth (verificación por token) |

### 3.3 Motor de validación de conflictos

El `conflicts.service.ts` es el corazón de las validaciones. Se ejecuta en cada creación o edición de turno.

**Orden de validación (precedencia):**

1. **Excepción vigente** → hard block. Si el profesional tiene un bloqueo en esa fecha/hora, no se puede crear el turno. Mensaje: "El profesional tiene una excepción vigente: {reason}".
2. **Conflicto de superposición** → hard block. Si ya existe un turno activo del mismo profesional que se superpone, se rechaza. Mensaje: "El profesional ya tiene un turno en ese horario".
3. **Feriado** → soft warning. Se advierte pero se permite si el usuario confirma. Mensaje: "La fecha seleccionada es feriado: {name}. ¿Desea continuar?".
4. **Fuera de horario habitual** → soft warning. Se advierte pero se permite. Mensaje: "El horario está fuera del horario habitual del profesional".

**Algoritmo de detección de superposición:**

```typescript
function hasOverlap(
  professionalId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string
): boolean {
  // Dos turnos se superponen si: A.start < B.end && A.end > B.start
  return repository.exists({
    professional_id: professionalId,
    status: { notIn: ['cancelled', 'no_show'] },
    start_at: { lt: endAt },
    end_at: { gt: startAt },
    id: excludeId ? { not: excludeId } : undefined,
  });
}
```

### 3.4 Máquina de estados del turno

```
Pendiente ──► Confirmado ──► En espera ──► Atendido (terminal)
    │              │              │
    │              │              └──► Cancelado (excepcional, terminal)
    │              │
    │              └──► Cancelado (terminal)
    │              └──► No asistió (terminal)
    │
    └──► Cancelado (terminal)
    └──► No asistió (terminal)
```

Cada transición se registra en `appointment_audit_log` con `old_values` y `new_values`.

### 3.5 Sincronización de feriados

- **Job programado**: 1 vez por mes, consulta `https://api.argentinadatos.com/v1/feriados/{año}` para el año actual y el siguiente.
- **Upsert**: Los feriados nacionales se insertan o actualizan por fecha+nombre. No se duplican.
- **Feriados institucionales**: Se crean manualmente y no se tocan en la sincronización.
- **Fallback**: Si la API no responde, los feriados existentes en la tabla siguen funcionando. No se bloquea la operación.

---

## 4. Bot de WhatsApp (estructurado, sin IA)

### 4.1 Proveedor: Waha (self-hosted)

- Corre en un contenedor Docker propio
- Se conecta escaneando un QR (como WhatsApp Web)
- Expone API REST para enviar mensajes y webhook para recibir
- Soporta mensajes interactivos con botones

### 4.2 Máquina de estados del bot

Cada conversación con un paciente tiene un estado. El estado se guarda en `whatsapp_bot_sessions` con expiración de 30 minutos de inactividad.

```
Estado: IDLE
  → Paciente envía cualquier mensaje
  → Bot responde con menú principal:
      "¿Qué querés hacer?"
      1️⃣ Confirmar turno próximo
      2️⃣ Reprogramar turno
      3️⃣ Cancelar turno

Estado: CONFIRMING
  → Muestra datos del turno próximo
  → Botones: "✅ Confirmo" / "❌ No puedo"
  → Si confirma: actualiza estado a "confirmed", responde "¡Listo! Te esperamos"
  → Si no: vuelve a IDLE

Estado: RESCHEDULING
  → Muestra días disponibles como botones (próximos 7 días con huecos)
  → Paciente elige día → Estado: RESCHEDULING_SELECT_DATE
  → Muestra horarios disponibles como botones
  → Paciente elige horario → pide confirmación
  → Si confirma: actualiza turno, responde con nuevos datos
  → Vuelve a IDLE

Estado: CANCELLING
  → Muestra turno próximo
  → Botón: "Sí, cancelar"
  → Si confirma: cambia estado a "cancelled", responde confirmación
  → Vuelve a IDLE
```

### 4.3 Identificación del paciente

- El bot identifica al paciente por el número de teléfono (`phone_number` en la tabla `patients`).
- Si el número no está registrado, responde: "No encontramos tu número registrado. Comunicate con la clínica para darte de alta."
- Si el paciente tiene múltiples turnos próximos, muestra el más cercano primero.

### 4.4 Mensajes del bot

**Menú principal:**
```
🦷 ¡Hola {nombre}! ¿Qué querés hacer?

1️⃣ Confirmar turno
2️⃣ Reprogramar turno
3️⃣ Cancelar turno

Respondé con el número de la opción.
```

**Confirmación:**
```
📅 Tenés un turno:
🗓️ {fecha} a las {hora}
👩‍⚕️ {profesional}

¿Confirmás tu asistencia?
✅ Sí, confirmo
❌ No puedo ir
```

**Recordatorio automático:**
```
🦷 Recordatorio de turno

Hola {nombre}, te recordamos que tenés un turno:
📅 {fecha} a las {hora}
👩‍⚕️ {profesional}

Respondé:
1️⃣ Confirmo
2️⃣ Necesito reprogramar
3️⃣ Cancelo
```

---

## 5. Worker y Jobs (BullMQ + Redis)

### 5.1 Colas

| Cola | Jobs | Frecuencia | Prioridad |
|------|------|------------|-----------|
| `reminders` | Enviar recordatorio 24hs antes | Cada 5 min | Alta |
| `confirmations` | Enviar solicitud de confirmación | Cada 5 min | Alta |
| `whatsapp-outbound` | Mensaje saliente de WhatsApp | Inmediato | Media |
| `email-outbound` | Email saliente | Inmediato | Baja |
| `holidays-sync` | Sincronizar feriados | 1 vez/mes | Baja |

### 5.2 Recordatorios

**Reglas de disparo (configurables por tenant, defaults):**

| Evento | Canal | Timing |
|--------|-------|--------|
| Recordatorio principal | WhatsApp | 24 horas antes |
| Segundo recordatorio | WhatsApp | 2 horas antes (solo si no confirmó) |
| Respaldo por email | Email | 1 hora después del WhatsApp principal |

**Contenido del email de respaldo:**
```
Asunto: Recordatorio de turno - {fecha}

Hola {nombre},

Te recordamos que tenés un turno programado:
Fecha: {fecha}
Hora: {hora}
Profesional: {profesional}

Si necesitás reprogramar o cancelar, comunicate con la clínica.

Saludos,
{nombre_clínica}
```

### 5.3 Entry point del worker

El worker es un proceso separado que usa la misma codebase de NestJS:

```
apps/api/src/worker/main.ts
```

Levanta los módulos de NestJS necesarios (appointments, communications) pero en lugar de iniciar el HTTP server, inicia el procesador de BullMQ. Comparte servicios con la API principal.

---

## 6. Frontend (Next.js)

### 6.1 Estructura de rutas

```
apps/web/src/app/(dashboard)/appointments/
├── layout.tsx
├── page.tsx              → redirect a /appointments/calendar
├── calendar/
│   └── page.tsx          # Página principal del calendario
├── search/
│   └── page.tsx          # Búsqueda avanzada de turnos
├── schedules/
│   └── page.tsx          # Gestión de horarios de atención
├── exceptions/
│   └── page.tsx          # Gestión de excepciones/bloqueos
└── [id]/
    └── page.tsx          # Detalle/edición de un turno
```

### 6.2 Componentes

```
apps/web/src/components/appointments/
├── calendar/
│   ├── CalendarView.tsx          # Tabs: mes/semana/día/24h
│   ├── MonthView.tsx             # Grilla mensual con indicadores
│   ├── WeekView.tsx              # Columnas por día
│   ├── DayView.tsx               # Timeline por profesional
│   ├── DayView24h.tsx            # Timeline 00:00-23:59
│   ├── CalendarHeader.tsx        # Navegación (hoy, prev, next, date picker)
│   └── CalendarFilters.tsx       # Filtros: profesional, especialidad, cancelados
├── appointment-card/
│   ├── AppointmentCard.tsx       # Tarjeta en grilla (color por estado)
│   └── AppointmentCardMini.tsx   # Versión compacta (vista mensual)
├── forms/
│   ├── CreateAppointmentForm.tsx # Alta de turno
│   ├── EditAppointmentForm.tsx   # Edición/reagendado
│   ├── CancelAppointmentForm.tsx # Diálogo de cancelación
│   └── ChangeStatusForm.tsx      # Cambio de estado rápido
├── availability/
│   ├── AvailabilityGrid.tsx      # Grilla de horarios disponibles
│   └── ScheduleForm.tsx          # Formulario de horarios
├── search/
│   ├── SearchFilters.tsx         # Filtros combinables
│   └── SearchResults.tsx         # Tabla de resultados
├── exceptions/
│   ├── ExceptionForm.tsx         # Formulario de excepción
│   └── ExceptionList.tsx         # Lista de excepciones
└── shared/
    ├── StatusBadge.tsx           # Badge de estado con color
    ├── ConflictWarning.tsx       # Alerta de conflicto
    └── HolidayIndicator.tsx      # Indicador de feriado
```

### 6.3 Librería de calendario: FullCalendar

Se usa **FullCalendar** (`@fullcalendar/react`) con los plugins:
- `@fullcalendar/daygrid` (vista mensual)
- `@fullcalendar/timegrid` (vistas semana y día con horas)
- `@fullcalendar/list` (vista lista opcional)
- `@fullcalendar/core` (localización en español)

**Por qué FullCalendar y no el calendario nativo**: El calendario del navegador es inutilizable para una agenda profesional. FullCalendar resuelve las 4 vistas, drag & drop, scroll, timezone handling y rendimiento con muchos eventos sin reinventar nada.

### 6.4 Estados visuales (colores del design system)

| Estado | Token | Color visual | Badge |
|--------|-------|-------------|-------|
| Pendiente | `--color-warning` | Ámbar | `warning` |
| Confirmado | `--color-success` | Verde | `success` |
| En espera | `--color-primary` | Teal | `primary` |
| Atendido | `--color-muted-foreground` | Gris | `muted` |
| Cancelado | `--color-muted-foreground` (atenuado) | Gris claro | `muted` |
| No asistió | `--color-destructive` (atenuado) | Rojo claro | `destructive` |

### 6.5 Vista combinada con filtro

La vista diaria muestra por defecto **todos los profesionales** en filas separadas (tipo timeline). Se puede filtrar por:
- Profesional individual
- Especialidad
- Mostrar/ocultar turnos cancelados

El filtro se mantiene en la URL como query params para que sea compartible y persistente al recargar.

---

## 7. Dependencias externas

### 7.1 WhatsApp — Waha

- **URL**: `http://localhost:3000` (dev) / contenedor Docker en producción
- **Webhook**: `POST /webhooks/whatsapp` recibe mensajes entrantes
- **Envío de mensajes**: `POST /api/sendText` y `POST /api/sendButtons`
- **Autenticación**: QR scan inicial, sesión persistente en volumen Docker

### 7.2 Email — Resend

- **API key**: variable de entorno `RESEND_API_KEY`
- **Free tier**: 3000 emails/mes, 100/día
- **Remitente**: configurado en `RESEND_FROM`
- **Template**: HTML simple con branding de la clínica

### 7.3 Feriados — ArgentinaDatos

- **Endpoint**: `GET https://api.argentinadatos.com/v1/feriados/{año}`
- **Sin API key**, sin registro
- **Timeout**: 5 segundos (si falla, se usan los datos locales)
- **Sincronización**: job mensual automático

### 7.4 Redis

- **Uso**: BullMQ para colas de jobs + cache de sesiones del bot de WhatsApp
- **URL**: variable de entorno `REDIS_URL`
- **Dev**: contenedor Docker local

---

## 8. Reglas de negocio

### 8.1 Precedencia de reglas

1. **Excepción** → hard block
2. **Superposición** → hard block
3. **Feriado** → soft warning
4. **Fuera de horario** → soft warning

### 8.2 Reglas de transición de estado

| De | A | Válida | Notas |
|----|---|--------|-------|
| Pendiente | Confirmado | ✅ | Recepción o paciente confirma |
| Pendiente | Cancelado | ✅ | Con motivo obligatorio |
| Pendiente | No asistió | ✅ | Si el paciente no llegó |
| Confirmado | En espera | ✅ | Paciente llegó a la clínica |
| Confirmado | Cancelado | ✅ | Con motivo obligatorio |
| Confirmado | No asistió | ✅ | Paciente no llegó |
| En espera | Atendido | ✅ | Atención completada |
| En espera | Cancelado | ✅ | Caso excepcional |
| Atendido | — | ❌ | Estado final |
| Cancelado | — | ❌ | Estado final |
| No asistió | — | ❌ | Estado final |

### 8.3 Multi-tenant

Todas las queries incluyen `tenant_id` automáticamente a través del `TenantContext` existente. Ningún tenant puede ver ni modificar datos de otro.

### 8.4 Planes y profesionales activos

Las restricciones de plan (cupo de profesionales activos) no afectan turnos existentes. Si un profesional estaba activo al momento de crear turnos, esos turnos siguen vigentes aunque el tenant quede excedido por downgrade.

---

## 9. Dependencias funcionales internas

| Módulo | Relación |
|--------|----------|
| `professionals` | FK en appointments, schedules, exceptions |
| `patients` | FK en appointments, identificación por teléfono en bot |
| `mutuals` | FK opcional en appointments |
| `tenancy` | TenantContext para scoping |
| `auth` | Permisos para crear/editar/cancelar turnos |
| `audit` | Registro de acciones sensibles (opcional, usa appointment_audit_log) |

---

## 10. Permisos y roles

| Rol | Crear turno | Editar turno | Cancelar turno | Cambiar estado | Ver agenda | Ver cancelados |
|-----|-------------|--------------|----------------|----------------|------------|----------------|
| Recepcionista | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profesional | ❌ | ❌ | ❌ | ✅ (solo propios) | ✅ (solo propios) | ✅ (solo propios) |
| Administrador | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Supervisor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 11. Riesgos técnicos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Waha se desconecta (QR expira) | Alto | Alerta al admin, fallback a email, reconexión automática |
| Redis cae | Alto | Jobs se reintentan, sin pérdida de datos (BullMQ persiste en Redis) |
| ArgentinaDatos no responde | Bajo | Feriados locales siguen funcionando, reintento en próximo job |
| FullCalendar con muchos turnos se pone lento | Medio | Virtualización, carga lazy por rango de fechas, paginación |
| Sesión del bot de WhatsApp expira | Bajo | El paciente puede reiniciar el flujo en cualquier momento |
| Turnos duplicados por doble click | Medio | Idempotencia en el backend (validación de overlap), debounce en frontend |

---

## 12. Criterios de aceptación técnica

1. **Crear turno**: Recepción puede crear un turno en menos de 30 segundos con validación automática de conflictos.
2. **Vista calendario**: Las vistas mes, semana y día cargan en menos de 2 segundos con hasta 200 turnos en el período.
3. **Bot de WhatsApp**: Un paciente puede confirmar su turno en menos de 3 mensajes.
4. **Recordatorios**: Se envían automáticamente según la configuración del tenant sin intervención manual.
5. **Búsqueda**: La búsqueda avanzada responde en menos de 1 segundo con filtros combinados.
6. **Multi-tenant**: Ninguna query puede retornar datos de otro tenant (verificado por tests).
7. **Audit log**: Cada cambio de estado queda registrado con usuario, timestamp y valores antes/después.
