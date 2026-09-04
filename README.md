# ODENT — Sistema de gestión para clínicas odontológicas

Plataforma **multi-tenant** para clínicas odontológicas: agenda de turnos, gestión de pacientes, profesionales, obras sociales y permisos por plan de suscripción. Pensada para que cada institución opere su propio tenant de forma aislada, con un catálogo de funcionalidades habilitadas según el plan (free, basic, professional, enterprise).

## Funcionalidades

### Autenticación y seguridad
- Login con email + password, **cookies httpOnly** para access y refresh tokens.
- **Refresh token rotativo** con validación de sesión activa y token version.
- **Bloqueo por fuerza bruta**: 15 minutos tras 5 intentos fallidos, con expiración automática.
- **Control de sesiones concurrentes** con límite configurable y expulsión de sesiones antiguas.
- **Políticas de sesión** editables desde admin: timeout de inactividad, duración máxima, sesiones simultáneas.
- Cambio forzado de contraseña, recuperación por email con prevención de enumeración, rehabilitación de cuentas.
- Ruteo por rol post-login y UI condicionada por permisos efectivos (`GET /auth/abilities`).

### Gestión clínica
- **Pacientes**: CRUD completo con búsqueda por DNI/nombre, ficha con grupo sanguíneo y notas, validación de DNI único, baja lógica.
- **Obras sociales / mutuales**: catálogo centralizado con validación de unicidad, vinculación paciente ↔ mutual (número de afiliado, plan, % de cobertura) y mutuales aceptadas por profesional.
- **Profesionales**: alta con usuario y contraseña aleatoria, activación/reactivación, **control de cuota por plan** con período de gracia.
- **Turnos**: agenda con FullCalendar (vista día/semana/mes + listado), dashboard del día y alta rápida desde recepción.
- **Archivos clínicos**: almacenamiento de imágenes y documentos en MinIO, con procesamiento vía sharp.
- **Auditoría**: trazabilidad de acciones a través del package compartido `audit-core`.

### Multi-tenancy y planes
- Aislamiento por tenant vía header `x-tenant-id` enforced en `tenancy-core`.
- Permisos declarativos centralizados en el package `permissions`, agrupados y consultables por el frontend.
- Límites de profesionales activos según plan de la institución, con grace period.

## Stack

| Capa | Tecnologías |
|---|---|
| API | NestJS 11, TypeScript 5.9, Drizzle ORM + postgres.js, BullMQ + Redis (worker separado), MinIO, sharp, nodemailer, Passport + JWT (cookies httpOnly) |
| Web | Next.js 16 (App Router), React 19, FullCalendar, react-day-picker, react-easy-crop, lucide-react |
| Compartido | 9 packages workspace: `auth-core`, `permissions`, `tenancy-core`, `audit-core`, `types`, `validation`, `ui`, `config`, `tsconfig` |
| Herramientas | Turborepo, pnpm 10, Biome 2, commitlint + husky + lint-staged, Vitest 4, GitHub Actions CI |

## Estructura del monorepo

```
odent/
├── apps/
│   ├── api/        # NestJS: modules, worker BullMQ, health, infra
│   └── web/        # Next.js App Router: (auth) y (dashboard)
├── packages/       # auth-core, permissions, tenancy-core, audit-core,
│                   # types, validation, ui, config, tsconfig
├── infra/          # docker compose (PostgreSQL, Redis, MinIO) + init.sql
└── docs/           # PRDs, planes de diseño, investigación de mercado
```

## Puesta en marcha

Requisitos: Node 20+, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env        # configurar credenciales
pnpm infra:up               # PostgreSQL + Redis + MinIO vía docker compose
pnpm dev                    # api + web en paralelo (Turborepo)
```

Comandos útiles:

```bash
pnpm build        # build de todas las apps
pnpm test         # suite de tests (Vitest)
pnpm lint         # Biome
pnpm typecheck
pnpm infra:down   # detener la infraestructura
```

## Documentación

- `docs/funcionalidades-implementadas.md` — catálogo completo de funcionalidades implementadas.
- `docs/prd/` — PRDs por área: historia clínica, cuenta corriente, depósitos, llamador de pacientes, onboarding, configuración.
- `docs/plans/` — diseños de implementación con fecha.
- `docs/investigacion/` — investigación de mercado de software odontológico en Argentina e integración con obras sociales.

## Licencia

Privado. Todos los derechos reservados.
