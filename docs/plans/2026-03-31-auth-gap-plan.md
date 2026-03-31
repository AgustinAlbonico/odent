# Plan: Cierre de brechas — PRD Autenticación y Autorización

> **Fecha**: 2026-03-31
> **Estado**: ✅ completado — 2026-03-31
> **PRD de referencia**: `docs/prd/2026-03-30-autenticacion-y-autorizacion.md`
> **Exploración base**: inventario completo del codebase (apps/api, apps/web, packages/*)

---

## Contexto

Se realizó un inventario completo cruzando cada requisito del PRD contra la implementación real del sistema. El resultado: **18 requisitos implementados, 6 parciales, 3 faltantes**.

El sistema tiene una base de auth sólida y bien arquitecturada:
- JWT en cookies seguras con rotación de refresh tokens
- Modelo de permisos 3-dimensional (VIEW ≠ OPERATE ≠ SCOPE) con 17 módulos × 15 acciones × 6 alcances
- 4 roles base (admin, profesional, asistente, profesional_supervisor)
- Gestión completa de sesiones con políticas configurables
- Auditoría con 22 tipos de evento
- Restricción de plan por cupo de profesionales
- Multi-tenant con schema isolation

Los huecos están concentrados en **administración de usuarios** (CRUD backend + UI frontend) y algunos items independientes.

---

## Estado actual por requisito PRD

### ✅ Implementados (18)

| # | Requisito | Notas |
|---|-----------|-------|
| RF-AA-001 | Login con mail y contraseña | `POST /auth/login`, bcrypt, validación zod |
| RF-AA-002 | Sesión JWT en cookies seguras | `access_token` (15min) + `refresh_token` (7d), httpOnly, secure |
| RF-AA-003 | Identidad inequívoca por sesión | JWT payload: identidad + tenant + rol + permisos |
| RF-AA-004 | Evaluación separada ver vs hacer | `canView` ≠ `canOperate` en AuthGuard |
| RF-AA-005 | Restricción por alcance | 6 niveles de scope evaluados en cada request |
| RF-AA-006 | Roles base obligatorios | 4 roles en `packages/permissions` |
| RF-AA-008 | Menú y acciones condicionados | Sidebar filtra por `VIEW_MODULE`, `useAbilities()` en frontend |
| RF-AA-009 | Bloqueo efectivo (acceso directo) | AuthGuard global, no solo UI |
| RF-AA-009A | Restricción plan (cupo prof.) | `PlanRestrictionGuard` + grace period |
| RF-AA-012 | Cambio obligatorio contraseña | `mustChangePassword` flag, guard trapea al usuario |
| RF-AA-013 | Expiración por inactividad | Default 30min, configurable |
| RF-AA-014 | Expiración por duración máxima | Default 8h, configurable |
| RF-AA-016 | Cierre de sesión manual | `POST /auth/logout`, limpia cookies + DB |
| RF-AA-017 | Gestión sesiones activas (admin) | `GET /admin/sessions` + `DELETE /admin/sessions/:id` |
| RF-AA-020 | Rehabilitación de cuentas | `PATCH /admin/users/:userId/rehabilitate` |
| RF-AA-021 | Historial personal de accesos | `GET /admin/audit/personal` |
| RF-AA-022 | Redirección inicial según rol | Frontend calcula `landingPath` post-login |
| RF-AA-023 | Política sesión configurable | `GET/PUT /admin/session-policy` con rangos validados |
| RF-AA-024 | Exportación auditoría | `GET /admin/audit/export` → CSV |
| RF-AA-026 | Revisión periódica permisos | Ciclos con confirm/revoke/auto-expiry |

### ⚠️ Parciales (6)

| # | Requisito | Qué falta |
|---|-----------|-----------|
| RF-AA-007 | Permisos granulares | Modelo completo, pero sin API CRUD para asignar permisos custom |
| RF-AA-010 | Recuperación contraseña | Backend funciona, pero no se envía email (dev-only) |
| RF-AA-011 | Cambio contraseña self-service | Backend existe, falta UI frontend |
| RF-AA-015 | Renovación sesión | Backend funciona, frontend no tiene auto-refresh antes de expirar |
| RF-AA-018 | Bloqueo por abuso | Funciona con Map en memoria (se pierde al restart). Falta Redis |
| RF-AA-019 | Auditoría eventos | 22 tipos de evento, pero AuditInterceptor no registrado globalmente |

### ❌ Faltantes (3)

| # | Requisito | Detalle |
|---|-----------|---------|
| — | CRUD Usuarios (backend) | No hay módulo Users. No hay endpoints para listar/crear/editar/eliminar usuarios |
| — | UI gestión usuarios (frontend) | No hay página `/users`. Sin formulario de alta, edición o asignación de roles |
| — | API permisos custom (backend) | Tabla `user_permissions` existe pero sin endpoints CRUD |

---

## Plan de implementación por fases

```
Fase 1A ─┐
          ├──→ Fase 2 (UI Usuarios) ──→ ✅ PRD Auth completo
Fase 1B ─┘
                ↕ (en paralelo)
          Fase 3A (password change UI)
          Fase 3B (auto-refresh)
          Fase 3C (email integration)
                ↓
          Fase 4 (producción hardening)
```

---

### FASE 1 — Backend: CRUD Usuarios + API de Permisos

> **Prioridad:** P0 — desbloquea todo lo demás.
> **Depende de:** nada (patrones ya establecidos en el codebase).

#### 1A — Módulo Users (backend)

Crear `modules/users/` siguiendo el patrón de `modules/session-admin/`.

| Tarea | Endpoint | Descripción |
|---|---|---|
| Listar usuarios | `GET /admin/users` | Paginado, filtros por rol/estado, búsqueda por nombre/email |
| Detalle usuario | `GET /admin/users/:id` | Datos del usuario + permisos efectivos (rol + custom) |
| Crear usuario | `POST /admin/users` | Email, nombre, rol, estado inicial. Si rol es profesional → `PlanRestrictionGuard` |
| Editar usuario | `PATCH /admin/users/:id` | Datos, cambio de rol. Si cambia a profesional → validar cupo plan |
| Cambiar estado | `PATCH /admin/users/:id/state` | Activar / suspender / baja. Liberar cupo si corresponde |
| Forzar cambio pass | `PATCH /admin/users/:id/force-password` | Marcar `mustChangePassword=true` |

**Archivos nuevos estimados:**
- `modules/users/users.module.ts`
- `modules/users/users.controller.ts`
- `modules/users/users.service.ts`
- `modules/users/users.repository.ts` (Drizzle)
- Validación: extender `packages/validation` con `userCreateSchema`, `userUpdateSchema`

**Tablas DB existentes (no hace falta migración):** `users`, `user_permissions`

#### 1B — API de Permisos Custom (backend)

Extender el módulo de users o crear endpoints dedicados.

| Tarea | Endpoint | Descripción |
|---|---|---|
| Listar permisos | `GET /admin/users/:id/permissions` | Permisos custom + heredados del rol |
| Reemplazar permisos | `PUT /admin/users/:id/permissions` | Bulk upsert de `{module, action, scope}[]` |
| Eliminar permiso | `DELETE /admin/users/:id/permissions/:permId` | Permisos custom individuales |

**Tabla DB existente:** `user_permissions`

---

### FASE 2 — Frontend: UI de Gestión de Usuarios

> **Prioridad:** P0 — sin esto, un admin no puede operar el sistema.
> **Depende de:** Fase 1 completa.

#### 2A — Listado de usuarios

| Tarea | Ruta | Descripción |
|---|---|---|
| Página listado | `/usuarios` | Tabla: nombre, email, rol, estado. Filtros + búsqueda |
| Acciones por fila | — | Ver detalle, editar, cambiar estado, forzar cambio contraseña |

#### 2B — Creación/edición de usuario

| Tarea | Ruta | Descripción |
|---|---|---|
| Formulario nuevo | `/usuarios/nuevo` | Nombre, apellido, email, rol (select), estado inicial |
| Formulario editar | `/usuarios/:id/editar` | Mismo form precargado |
| Validación cupo | — | Si elige rol profesional sin cupo → error con info del plan |

#### 2C — Panel de permisos por usuario

| Tarea | Ruta | Descripción |
|---|---|---|
| Pestaña permisos | En detalle de usuario | Matriz módulo × acción con selector de alcance. Heredados vs custom |
| Guardar permisos | — | Botón → `PUT /admin/users/:id/permissions` |

**Archivos nuevos estimados:**
- `app/(dashboard)/usuarios/page.tsx`
- `app/(dashboard)/usuarios/nuevo/page.tsx`
- `app/(dashboard)/usuarios/[id]/page.tsx`
- `app/(dashboard)/usuarios/[id]/editar/page.tsx`
- Components: `UserForm`, `UserPermissionsMatrix`, `UserStatusBadge`
- API client functions en `api.ts`

---

### FASE 3 — Items independientes (paralelo)

> **Prioridad:** P1 — cada uno se puede hacer independientemente.
> **Depende de:** nada.

#### 3A — Cambio de contraseña self-service (frontend)

| Tarea | Descripción |
|---|---|
| Crear página `/mi-perfil/seguridad` | Formulario: contraseña actual + nueva + confirmar |
| Conectar con `POST /auth/password/change` | El endpoint YA existe |

**Esfuerzo:** bajo. Una página, un form, un endpoint existente.

#### 3B — Auto-refresh de token (frontend)

| Tarea | Descripción |
|---|---|
| Interceptor en fetch client | Antes de expirar o al recibir 401 → `POST /auth/refresh` → reintentar request original |
| Manejo de refresh fallido | Si refresh también falla → redirigir a login |

**Esfuerzo:** bajo-medio.

#### 3C — Integración de email para recuperación

| Tarea | Descripción |
|---|---|
| Configurar servicio email | nodemailer + SMTP (o proveedor) |
| Template HTML | Link de recuperación con branding mínimo |
| Modificar recovery flow | En vez de devolver token en response, enviar por email |

**Esfuerzo:** medio. Depende de SMTP/proveedor disponible.

---

### FASE 4 — Endurecimiento para producción

> **Prioridad:** P2 — para cuando se acerquen a deploy real.

| Tarea | Descripción |
|---|---|
| Rate limiting con Redis | Migrar Map en memoria a Redis para persistencia y multi-instancia |
| Registrar AuditInterceptor | `APP_INTERCEPTOR` en `app.module.ts` para capturar 403 |
| Fix logout → sesión actual | Usar `sessionId` del JWT en vez de cerrar todas las sesiones del usuario |
| Migraciones Drizzle | Dejar `db:push`, generar archivos de migración para prod |

---

## Resumen de estimación

| Fase | Tareas | Complejidad | Requisitos PRD que cierra |
|---|---|---|---|
| Fase 1 | 9 endpoints backend | Media | RF-AA-007 (permisos), administración usuarios |
| Fase 2 | 3+ páginas frontend | Media-alta | RF-AA-007, RF-AA-008 (UI condicional completa) |
| Fase 3A | 1 página frontend | Baja | RF-AA-011 |
| Fase 3B | 1 interceptor | Baja-media | RF-AA-015 completo |
| Fase 3C | Servicio + template | Media | RF-AA-010 completo |
| Fase 4 | 4 mejoras infra | Media | Producción-ready |

---

## Puntos de decisión pendientes

1. **Email provider**: ¿SMTP propio, SendGrid, Resend, otro? Define la complejidad de Fase 3C.
2. **Redis**: ¿Ya tienen infraestructura Redis disponible? Afecta Fase 4.
3. **UI de permisos**: ¿matriz completa (17×15 casillas) o agrupación simplificada por módulo? Afecta UX de Fase 2C.

---

*Documento generado como plan de implementación · 2026-03-31*
