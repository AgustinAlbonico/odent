# Funcionalidades Implementadas

> Última actualización: 2026-04-09 (Hover consistente + foto ampliable en ficha de profesional)
> Este documento registra todas las funcionalidades actualmente implementadas en el sistema.

---

## 🔐 Autenticación y Autorización

### Login / Sesión
- **Login con email + password**: autenticación con validación de credenciales, tenant multi-institución (header `x-tenant-id`), cookies httpOnly para access y refresh tokens
- **Refresh token rotativo**: renovación automática de access token con validación de sesión activa, rotación de refresh token y verificación de token version
- **Logout**: cierre de sesión con invalidación de sesión en base de datos y limpieza de cookies
- **Consulta de habilidades/permisos** (`GET /auth/abilities`): devuelve permisos efectivos del usuario actual y datos de sesión, usado por el frontend para mostrar/ocultar elementos de UI
- **Ruteo por rol post-login**: redirección automática según rol (admin → /settings, profesional/asistente → /dashboard)

### Gestión de Contraseñas
- **Cambio de contraseña** (`POST /auth/password/change`): cambio voluntario con validación de contraseña actual
- **Cambio forzado de contraseña** (`POST /auth/password/force-change`): flujo obligatorio post-login para usuarios con `mustChangePassword=true`; invalida tokens existentes y requiere re-login
- **Recuperación de contraseña** (`POST /auth/password/recovery/request` + `reset`): solicitud de token de recuperación con reset; modo dev expone token directamente cuando SMTP no está configurado; prevención de enumeración de emails
- **Rehabilitación de cuenta** (`PATCH /admin/users/:userId/rehabilitate`): restablece intentos fallidos y bloqueo de cuenta desde admin

### Seguridad de Acceso
- **Bloqueo por fuerza bruta**: bloqueo temporal de 15 minutos tras 5 intentos fallidos de login; reset automático al login exitoso; expiración automática del bloqueo
- **Control de sesiones concurrentes**: límite configurable de sesiones simultáneas por usuario con expulsión de sesiones antiguas al superar el límite
- **Políticas de sesión configurables**: timeout de inactividad, duración máxima de sesión, sesiones concurrentes máximas — todo editable desde admin (`PUT /admin/session-policy`)
- **Cierre de sesiones por admin**: listado de sesiones activas y terminación forzada de cualquier sesión desde panel administrativo

---

## 👥 Pacientes

### CRUD Completo
- **Listado paginado** con búsqueda por DNI, nombre o apellido; filtro por estado (activo/inactivo); ordenamiento por apellido
- **Detalle individual**: ficha completa con datos personales, grupo sanguíneo, factor Rh, dirección, notas
- **Creación** con validación de unicidad de DNI (global, incluye inactivos)
- **Edición** con validación de DNI único entre pacientes distintos
- **Cambio de estado**: activar/desactivar paciente (baja lógica)

### Obras Sociales del Paciente
- **Vinculación paciente ↔ mutual**: agregar, editar, eliminar obras sociales asociadas; la mutual validada debe pertenecer al mismo tenant del paciente
- **Datos de cobertura**: número de afiliado, nombre del plan, porcentaje de cobertura, estado activo/inactivo
- **Baja lógica** de mutual del paciente (soft delete)

---

## 🏥 Mutuales / Obras Sociales

### Catálogo Centralizado
- **CRUD completo de mutuales**: nombre, código único, teléfono, estado
- **Búsqueda** por nombre o código; filtro para incluir/excluir inactivas
- **Soft delete**: desactivación sin eliminación física
- **Validación de unicidad**: nombre y código únicos en el catálogo

### Mutuales por Profesional
- **Asignación de mutuales a profesionales**: agregar/quitar mutuales que un profesional acepta
- **Listado de mutuales habilitadas** por profesional
- **Reactivación** de mutuales previamente removidas

---

## 👨‍⚕️ Profesionales

### Gestión de Profesionales
- **Creación de profesional**: genera usuario con rol `profesional`, contraseña aleatoria y `mustChangePassword=true`
- **Activación** de profesional inactivo
- **Reactivación** de profesional previamente desactivado
- **Control de cuota por plan**: validación de límite de profesionales activos según plan de la institución (free, basic, professional, enterprise)
- **Período de gracia**: soporte para grace period al exceder cuota de profesionales
- **Directorio de profesionales**: `/professionals` funciona como listado buscable y paginado con acceso a la ficha individual
- **Ficha completa del profesional**: `/professionals/[id]` muestra datos de identidad, estado, último acceso y fecha de alta
- **Mutuales desde la ficha**: alta y baja de mutuales habilitadas dentro del detalle del profesional
- **Configuración operativa visible**: resumen de horarios activos y excepciones próximas del profesional
- **Agenda embebida**: la ficha integra `WeeklyGrid` fijado al profesional para reservar turnos sin salir del módulo
- **Próximos turnos**: listado resumido de turnos futuros con acceso directo al detalle del turno
- **Acceso de consulta para recepción**: recepcionista puede ver el directorio y la ficha del profesional sin depender del módulo de usuarios
- **Foto de perfil**: cada profesional puede tener una foto de perfil visible en el directorio, ficha, header y página de perfil
  - **Upload con crop/zoom**: modal de recorte circular con zoom para ajustar la foto antes de subirla (react-easy-crop)
  - **Admin puede subir/eliminar foto**: desde la ficha del profesional, un admin puede gestionar la foto
  - **Vista ampliada en ficha**: en `/professionals/[id]`, si el profesional tiene foto real, se puede clickear para abrir una vista ampliada en modal/lightbox simple
  - **Hover de descubrimiento**: la miniatura clickeable muestra `cursor-pointer`, baja levemente la opacidad y superpone un affordance neutral de zoom para indicar que se puede ampliar
  - **Consistencia de interacción**: los hovers interactivos del módulo usan transiciones rápidas y sutiles para evitar cambios bruscos en acciones, tablas, tabs y controles de calendario
  - **Self-service**: el profesional puede subir/cambiar/eliminar su propia foto desde "Mi Perfil" (`/security/perfil`)
  - **Procesamiento server-side**: sharp redimensiona a 256×256, convierte a WebP y elimina metadatos EXIF
  - **Validación**: solo JPEG/PNG/WebP, máximo 5MB, SVG prohibido (XSS)
  - **Endpoints**: `POST/DELETE /admin/professionals/:id/photo` (admin) + `POST/DELETE /professionals/me/photo` (self-service)

---

## 📦 Almacenamiento de Archivos (MinIO)

### Infraestructura de Storage
- **MinIO en Docker Compose**: servicio S3-compatible self-hosted con puerto 9000 (API) y 9001 (consola)
- **StorageService abstracto**: interfaz `IStorageProvider` con implementación `MinioStorageProvider`, preparada para migrar a S3/R2 sin cambios de código
- **Bucket único con prefixes**: objetos organizados por `tenants/{tenantId}/{categoria}/{archivo}` para aislamiento multi-tenant
- **Política de lectura anónima**: los archivos bajo `tenants/*` son accesibles públicamente por URL directa (cacheable, sin presigned URLs)
- **Auto-creación de bucket**: el bucket se crea automáticamente al primer upload si no existe
- **Servido como estáticos**: controller `GET /api/storage/*` streamea archivos desde MinIO con `Cache-Control: public, max-age=86400`
- **Preparado para futuro**: la abstracción permite agregar radiografías, documentos PDF, fotos de tratamientos, etc. sin tocar la infraestructura
- **Endpoint de healthcheck**: `StorageService.healthCheck()` verifica conectividad con MinIO

---

## 👤 Gestión de Usuarios y Permisos

### Administración de Usuarios
- **Listado paginado** con filtros por rol, estado y búsqueda por nombre/email
- **Detalle de usuario**: datos completos, estado de cuenta, intentos fallidos, bloqueo, permisos personalizados
- **Creación de usuario** con rol, estado y flag de cambio de contraseña obligatorio; el alta queda asociada al tenant actual y mantiene la unicidad global vigente de email
- **Edición** de datos, rol y estado (con protección anti-auto-modificación)
- **Cambio de estado**: active, inactive, locked, pending_password_change
- **Forzar cambio de contraseña** a cualquier usuario (invalida sesiones activas vía token version)
- **Protección anti-auto-modificación**: admin no puede modificar ni desactivar su propia cuenta desde esta sección

### Sistema de Permisos (RBAC)
- **Permisos por defecto por rol**: admin, profesional, asistente, profesional_supervisor — cada rol tiene permisos base predefinidos
- **Permisos personalizados**: override granular por usuario (module + action + scope)
- **Reemplazo total de permisos**: actualización masiva de permisos personalizados de un usuario
- **Eliminación individual** de permisos personalizados
- **Consulta de permisos efectivos**: combinación de permisos heredados del rol + personalizados
- **Dimensiones de permiso**:
  - **Module**: dashboard, patients, turns, caller, clinical_history, odontogram, prescriptions, budgets, mutuals, deposits, patient_accounting, general_accounting, professionals, assistants, system_config, users_roles_permissions, audit_access
  - **Action**: view_module, view_list, view_detail, view_sensitive, view_audit, create, edit, change_status, emit, cancel, admin_catalog, admin_users, admin_roles_permissions, admin_policies, close_session_admin
  - **Scope**: none, own, assigned, operational_institutional, supervision, institutional_total

### Ciclos de Revisión de Permisos
- **Generación de revisiones**: crea registros de revisión para todos los permisos personalizados del período actual
- **Listado de revisiones pendientes** con filtros por estado y período
- **Confirmar revisión**: el permiso se mantiene activo
- **Revocar revisión**: el permiso personalizado es eliminado
- **Notas en cada revisión** para auditoría

---

## 🏢 Multi-tenancy

### Gestión de Instituciones
- **Resolución de tenant** por ID con contexto completo (plan, límites, período de gracia)
- **Creación de tenant**: genera tenant con schema PostgreSQL dedicado
- **Planes disponibles**: free (1 profesional), basic, professional, enterprise — cada uno con límites configurables de profesionales activos
- **Aislamiento por tenant en runtime**: las requests autenticadas quedan ligadas al `tid` del JWT firmado y los módulos de negocio filtran por `tenant_id` para evitar cruces entre instituciones

---

## 🔒 Seguridad y Gobernanza

### Políticas de Sesión
- **Configuración centralizada**: timeout de inactividad, duración máxima de sesión, sesiones concurrentes máximas
- **Aplicación en runtime**: las políticas se evalúan en cada login y refresh
- **Auditoría de cambios**: cada actualización de política queda registrada

### Gobernanza de Planes
- **Evaluación de cuota de profesionales**: verifica capacidad del plan institucional antes de crear/activar profesionales
- **Límites por plan**: consulta de límites configurados para cada tipo de plan
- **Separación de responsabilidades**: cuota de plan ≠ permiso RBAC ≠ scope de datos ≠ estado del profesional

---

## 📋 Auditoría

### Registro de Eventos
- **Listado de eventos de auditoría** con filtros por tipo de evento, actor, rango de fechas y paginación
- **Historial personal** (`GET /admin/audit/personal`): cada usuario puede ver su propia actividad
- **Exportación a CSV**: descarga de eventos de auditoría con filtros (máx. 10.000 registros)
- **Tipos de evento registrados**: login success/failure, logout, session expired/refreshed/closed_by_admin, password changed/forced_change, recovery requested/completed, account locked/unlocked/rehabilitated, access denied, permission granted/revoked, session policy updated, audit exported, unusual access detected, permission review confirmed/revoked/expired, plan quota blocked
- **Datos capturados por evento**: actor (ID + email), IP address, user agent, metadata JSON, timestamp

---

## 🖥️ Frontend (Web)

### Páginas Implementadas
- **Login** (`/login`): formulario de autenticación con validación
- **Recuperación de contraseña** (`/forgot-password`): solicitud de reset
- **Reset de contraseña** (`/reset-password`): formulario con token
- **Cambio forzado de contraseña** (`/forced-password-change`): flujo obligatorio
- **Dashboard** (`/dashboard`): página principal post-login
  - **Turnos de hoy por rol**: bloque operativo con listado diario de turnos
  - **Recepcionista / Admin operativo**: ve los turnos del día institucionales con paciente, profesional, estado y acciones rápidas
  - **Profesional**: ve solo sus turnos del día con paciente, estado y acciones rápidas
  - **Acciones rápidas**: confirmar, cancelar con motivo y navegar al detalle completo del turno
- **Pacientes** (`/patients`): listado y gestión
- **Mutuales** (`/mutuals`): catálogo de obras sociales
- **Profesionales** (`/professionals`): gestión de profesionales
- **Ficha de profesional** (`/professionals/[id]`): detalle operativo con agenda embebida
- **Usuarios** (`/users`): administración de usuarios y permisos
- **Configuración** (`/settings`): panel de configuración del sistema
- **Auditoría** (`/audit`): visor de eventos de auditoría
- **Sesiones** (`/sessions`): gestión de sesiones activas
- **Revisiones de permisos** (`/permission-reviews`): ciclos de revisión
- **Seguridad** (`/security`): sección de seguridad
- **Perfil** (`/security/perfil`): perfil del usuario con datos personales y profesionales
  - **Campos profesionales**: DNI, teléfono, matrícula profesional, especialidad
  - **Layout cohesivo**: avatar + datos en una sola tarjeta con grid 2 columnas, email de solo lectura
  - **Tarjeta de seguridad separada**: cambio de contraseña en tarjeta independiente con campos en grid 3 columnas
  - **Self-service photo**: subir/cambiar/eliminar foto de perfil con crop modal
- **404** (`not-found`): página de no encontrado
- **Calendario de turnos** (`/appointments/calendar`): experiencia híbrida por rol
  - **Profesional**: grilla semanal visual propia, sin selector de profesional ni tab de excepciones; muestra disponibilidad por semana completa con estados visuales (libre, reservado, cancelado, bloqueado y fuera de atención), resumen del día seleccionado, selección múltiple contigua de horarios libres, reserva en bloque, bloqueo con motivo y detalle de turnos desde la misma grilla
    - El eje horario visible se recorta automáticamente entre la primera hora configurada y la última hora configurada del profesional en la semana mostrada
    - La navegación semanal usa un selector simple de fecha: al elegir cualquier día, la vista salta a la semana correspondiente y deja ese día seleccionado
  - **Recepcionista / Admin**: experiencia dual entre resumen multi-profesional y operación por profesional
    - Cada turno muestra nombre del paciente (prominente) + nombre del profesional (secundario)
    - Código de color por estado (pendiente, confirmado, en espera, atendido, cancelado, ausente)
    - Resumen del día seleccionado con totales por estado + total semanal
    - Modal de detalle al clickear un turno (paciente, profesional, horario, estado, mutual, notas)
    - Navegación a ficha completa del turno desde el modal
    - **Modo resumen**: `ReceptionistWeeklyGrid` muestra todos los turnos de la semana para todos los profesionales
    - **Modo operativo**: al elegir un profesional en el selector superior, la vista reutiliza la grilla semanal operativa para reservar y bloquear horarios de ese profesional
    - **Selector buscable de paciente**: dentro del modal de reserva la selección se hace desde un buscador integrado con dropdown propio; muestra nombre y apellido como dato principal y DNI como dato secundario
    - **Alta rápida de paciente**: dentro del modal de reserva se puede crear un paciente nuevo con nombre, apellido y datos básicos sin salir del calendario; al guardarlo queda seleccionado automáticamente para confirmar el turno
    - Tab "Horarios" oculto para recepcionistas (los horarios los gestiona cada profesional)
    - Tab "Excepciones" visible para recepcionistas (puede bloquear horarios para un profesional)

### Componentes de Navegación
- **Sidebar**: navegación lateral con menú dinámico basado en permisos del usuario
- **Header**: barra superior con info de usuario

### Infraestructura Frontend
- **Contexto de autenticación**: provider React con estado de sesión
- **Hooks**: `useAuth` para acceso a sesión, `useAbilities` para permisos
- **Middleware Next.js**: protección de rutas autenticadas
- **API client**: funciones tipadas para llamadas al backend

---

## 📅 Gestión de Horarios, Excepciones y Feriados

### Horarios de Atención (Schedules)
- **Crear horario**: define el horario regular de un profesional (día de la semana, hora inicio, hora fin, duración de turno)
- **Listar por profesional**: horarios activos agrupados por día de la semana
- **Actualizar horario**: modificar día, hora inicio/fin o duración
- **Eliminar horario**: baja lógica (soft delete, `is_active = false`)
- **Vista semanal**: horarios agrupados por día (0=domingo a 6=sábado)
- **Grilla visual semanal**: vista interactiva con grid 7 días × horarios, celdas clickeables para crear excepciones/bloqueos directamente desde la grilla
  - Navegación entre semanas (anterior/siguiente/hoy)
  - Estados visuales: disponible, seleccionado, bloqueado (excepción), ocupado (turno), sin atención
  - Selección múltiple de slots con barra de acción inferior para bloquear
  - Desbloqueo de excepciones con un clic
  - Auto-selección de profesional según rol del usuario
  - Sección CRUD colapsable
- **Validaciones**:
  - No superponer horarios: verifica que no exista otro horario del mismo profesional en el mismo día cuyo rango horario se solape con el nuevo (condición: `newStart < existingEnd AND newEnd > existingStart`)
  - `start_time` debe ser menor que `end_time`
  - `day_of_week` entre 0 y 6
- **Eliminación con confirmación**: modal de confirmación antes de eliminar un horario configurado, mostrando día y rango horario

### Excepciones / Bloqueos (Exceptions)
- **Tab visible según rol**: para usuarios con rol `profesional`, la pestaña de excepciones se oculta y el bloqueo de franjas libres se realiza directamente desde el calendario semanal visual
- **Crear excepción**: bloquea disponibilidad de un profesional en un rango de fechas
  - Tipo `full_day`: bloquea todo el día
  - Tipo `time_range`: bloquea solo un rango horario dentro del día
- **Listar por profesional**: con filtros opcionales por rango de fechas (`dateFrom`, `dateTo`)
- **Eliminar excepción**: borrado físico
- **Verificar bloqueo**: método `isActiveForDate` usado por `ConflictsService` para validar disponibilidad
- **Validaciones**:
  - `start_date` <= `end_date`
  - Si type es `time_range`, `start_time` y `end_time` son obligatorios
  - No superponer con otra excepción del mismo profesional en el mismo rango

### Feriados (Holidays)
- **Listar feriados**: por tenant, con filtro opcional por año
- **Agregar feriado institucional**: solo administradores
- **Sincronizar feriados nacionales**: desde `api.argentinadatos.com/v1/feriados/{year}` (solo admins)
  - Timeout de 5 segundos
  - Upsert por fecha+nombre (no duplica)
  - Feriados existentes de tipo `national` se actualizan, los `institutional` no se tocan
  - Si la API falla, loguea warning pero no crashea
- **Verificar si es feriado**: método `isHoliday` usado por `ConflictsService`
- **Endpoints**:
  - `GET /appointments/professionals` — lista profesionales activos para selects del frontend (id, name, specialty)
  - `GET /appointments/schedules?professionalId=xxx`
  - `POST /appointments/schedules`
  - `DELETE /appointments/schedules/:id`
  - `GET /appointments/exceptions?professionalId=xxx&dateFrom=xxx&dateTo=xxx`
  - `POST /appointments/exceptions`
  - `DELETE /appointments/exceptions/:id`
  - `GET /appointments/holidays?year=2026`
  - `POST /appointments/holidays` (solo admin)
  - `POST /appointments/holidays/sync?year=2026` (solo admin)

---

## 📱 WhatsApp Bot (WAHA)

### Bot Conversacional de Turnos
- **Webhook de recepción** (`POST /webhooks/whatsapp`): recibe mensajes de WAHA, verifica token de webhook (`WAHA_WEBHOOK_TOKEN`), parsea payload y delega a la máquina de estados
- **Máquina de estados conversacional**: 6 estados (idle, confirming, rescheduling, rescheduling_select_date, rescheduling_select_time, cancelling) con transiciones controladas
- **Identificación de paciente**: búsqueda por número de teléfono dentro del tenant actual en tabla `patients`; si no encontrado, mensaje de registro
- **Sesiones con expiración**: tabla `whatsapp_bot_sessions` con contexto (appointmentId, selectedDate, selectedTime, professionalId, tenantId); la reutilización de sesión existente se resuelve por `phoneNumber + tenantId` y expira a los 30 minutos de inactividad
- **Flujo Confirmar turno**: busca próximo turno del paciente, muestra datos con botones "Confirmo/No puedo", cambia estado a `confirmed`
- **Flujo Reprogramar turno**: muestra días disponibles (próximos 7 días con huecos), horarios disponibles, confirmación y actualización del turno
- **Flujo Cancelar turno**: muestra datos del turno con botón de confirmación, cambia estado a `cancelled` con motivo "Cancelado por WhatsApp"
- **Servicio de mensajería WAHA**: `sendText()` y `sendButtons()` con `fetch()` nativo + AbortController (timeout 5s); errores logueados sin crashear
- **Archivos creados**:
  - `apps/api/src/modules/appointments/whatsapp/whatsapp.types.ts` — tipos y enums del bot
  - `apps/api/src/modules/appointments/whatsapp/whatsapp.service.ts` — comunicación con WAHA
  - `apps/api/src/modules/appointments/whatsapp/bot-statemachine.ts` — máquina de estados conversacional
  - `apps/api/src/modules/appointments/whatsapp/whatsapp.controller.ts` — webhook REST
- **Variables de entorno**: `WAHA_BASE_URL`, `WAHA_SESSION_NAME`, `WAHA_WEBHOOK_TOKEN`, `DEFAULT_TENANT_ID`

---

## 🔄 Worker y Colas (BullMQ + Redis)

### Infraestructura de Colas
- **5 colas configuradas**: `reminders`, `confirmations`, `whatsapp-outbound`, `email-outbound`, `holidays-sync`
- **Conexión Redis** via `REDIS_URL` en `BullModule.forRoot()` (registrado en `AppModule` y `WorkerModule`)
- **Reintentos automáticos**: 3 intentos con backoff exponencial (delay 1000ms) para jobs de reminders
- **Graceful shutdown**: el worker maneja `SIGTERM` y `SIGINT` para cerrar limpiamente

### RemindersService
- **scheduleReminder**: encola un job de recordatorio en la cola `reminders`
- **sendReminder**: envía recordatorio por WhatsApp, actualiza `reminder_sent_at`, encola email backup con delay de 1 hora
- **sendEmailBackup**: envía email vía Resend API (`fetch` a `https://api.resend.com/emails`) con HTML formateado
- **sendConfirmationRequest**: envía solicitud de confirmación con botones interactivos (Sí/Reprogramar/Cancelo)
- **Formato de mensajes**: fechas y horas en locale `es-AR`, datos de paciente, profesional, fecha y hora del turno

### Processors (5 colas)
- **RemindersProcessor** (`reminders`): ejecuta `sendReminder` para un appointment específico
- **ConfirmationsProcessor** (`confirmations`): busca turnos `pending` en ventana de confirmación (default 48hs), envía solicitud de confirmación
- **WhatsAppOutboundProcessor** (`whatsapp-outbound`): envía mensajes salientes (texto o botones) vía WAHA
- **EmailOutboundProcessor** (`email-outbound`): envía emails de backup vía RemindersService
- **HolidaysSyncProcessor** (`holidays-sync`): sincroniza feriados de ArgentinaDatos para año actual y siguiente (cron: `0 0 1 * *`)

### Worker Entry Point
- **`apps/api/src/worker/main.ts`**: crea `ApplicationContext` con `WorkerModule`, maneja señales de shutdown
- **`apps/api/src/worker/worker.module.ts`**: importa `DatabaseModule`, `AppointmentsModule`, `RemindersModule`, registra todos los processors

### Archivos creados
- `apps/api/src/modules/appointments/reminders/reminders.module.ts`
- `apps/api/src/modules/appointments/reminders/reminders.service.ts`
- `apps/api/src/modules/appointments/reminders/reminders.processor.ts`
- `apps/api/src/worker/main.ts`
- `apps/api/src/worker/worker.module.ts`

### Variables de entorno agregadas
- `REDIS_URL=redis://localhost:6379`
- `RESEND_API_KEY=`
- `RESEND_FROM=noreply@tu-dominio.com`
- `CONFIRMATION_WINDOW_HOURS=48`

---

## 📦 Módulos NO Implementados (PRDs existentes sin código)

Los siguientes módulos tienen PRD definido pero **no tienen implementación** en el backend ni frontend:

| Módulo | PRD | Estado |
|--------|-----|--------|
| Turnos y Agenda | `2026-03-30-turnos-y-agenda.md` | ✅ Schema DB + Repository + Conflict Service + State Transitions + AppointmentsService + **REST Controller (19 endpoints)** + **SchedulesService (CRUD horarios de atención)** + **ExceptionsService (CRUD excepciones/bloqueos)** + **HolidaysService (feriados + sync ArgentinaDatos)** |
| Historia Clínica | `2026-03-30-historia-clinica.md` | ❌ Sin implementar |
| Odontograma | `2026-03-30-odontograma.md` | ❌ Sin implementar |
| Presupuestos | `2026-03-30-presupuestos.md` | ❌ Sin implementar |
| Recetas | `2026-03-30-recetas.md` | ❌ Sin implementar |
| Cuenta Corriente / Contabilidad | `2026-03-30-cuenta-corriente-contabilidad.md` | ❌ Sin implementar |
| Depósitos | `2026-03-30-depositos.md` | ❌ Sin implementar |
| Llamador de Pacientes | `2026-03-30-llamador-pacientes.md` | ❌ Sin implementar |
| Ayuda / Onboarding | `2026-03-30-ayuda-onboarding.md` | ❌ Sin implementar |
| Configuración del Sistema | `2026-03-30-configuracion-sistema.md` | ⚠️ Parcial (solo session policy) |

---

## 📊 Resumen

| Categoría | Implementado | Sin Implementar |
|-----------|:-----------:|:---------------:|
| Autenticación y Sesión | ✅ Completo | — |
| Seguridad y Bloqueos | ✅ Completo | — |
| Gestión de Usuarios | ✅ Completo | — |
| Permisos y RBAC | ✅ Completo | — |
| Revisión de Permisos | ✅ Completo | — |
| Pacientes | ✅ CRUD + Mutuales | — |
| Mutuales / Obras Sociales | ✅ Catálogo + Profesionales | — |
| Profesionales | ✅ Cuota + Creación + Fotos de perfil | — |
| Multi-tenancy | ✅ Schema isolation | — |
| Almacenamiento (MinIO) | ✅ StorageService + Fotos perfil | — |
| Auditoría | ✅ Eventos + Export | — |
| Turnos y Agenda | ✅ Schema DB + Repository + Conflict Service + State Transitions Service + AppointmentsService (CRUD, status, calendar, availability) + **REST Controller (19 endpoints)** + **SchedulesService** (CRUD horarios de atención) + **ExceptionsService** (CRUD excepciones/bloqueos) + **HolidaysService** (feriados + sync ArgentinaDatos) | ✅ UI completa: calendario FullCalendar (4 vistas) con agenda auto-filtrada para profesionales, resumen/leyenda de estados, empty state claro, búsqueda con filtros, detalle de turno, gestión de horarios, excepciones, formularios CRUD |
| Historia Clínica | — | ❌ |
| Odontograma | — | ❌ |
| Presupuestos | — | ❌ |
| Recetas | — | ❌ |
| Contabilidad | — | ❌ |
| Depósitos | — | ❌ |
| Llamador | — | ❌ |
