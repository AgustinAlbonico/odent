# Bootstrap Scope Guard

## Objetivo

Este cambio crea únicamente la base técnica del monorepo para `sistema odontologico`.

## Whitelist — entra en este bootstrap

- Workspace raíz con `pnpm`, `turbo`, `biome` y TypeScript compartido.
- Shell técnico de `apps/web` con placeholder visual.
- Shell técnico de `apps/api` con endpoint `GET /api/health`.
- Paquetes mínimos compartidos: `config`, `tsconfig`, `types`, `ui`.
- Artefactos Docker para modo híbrido.
- Git hooks y CI mínima de calidad.
- Documentación técnica del bootstrap y diferidos.

## Blacklist — NO entra en este bootstrap

- Autenticación, JWT, sesiones, login o recuperación de contraseña.
- RBAC, permisos, CASL o políticas institucionales.
- Tenancy enforcement, `tenant_id`, schemas por tenant o middleware multi-tenant.
- CRUDs de profesionales, pacientes, turnos, recetas, odontograma o configuraciones funcionales.
- Drizzle ORM, migraciones reales, seeds o datos de negocio.
- Observabilidad productiva (`Pino`, `Sentry`, tracing, métricas avanzadas).
- Swagger/OpenAPI, colas, cache, Redis, workers, almacenamiento S3.

## Boundaries del árbol

Todo código nuevo del bootstrap debe vivir solo en:

- `apps/`
- `packages/`
- `infra/`
- `.github/`
- raíz técnica (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, etc.)

No se modifica `docs/` salvo esta documentación explícita del bootstrap.

## Cambios diferidos

- `auth-tenancy-foundation`
- `profesionales-management`
- `configuracion-minima`
- `plan-tenant-enforcement`
