# Bootstrap Evidence

## Estructura creada

- Root workspace con `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `tsconfig.base.json` y hooks.
- `apps/web` como shell Next.js con placeholder reutilizando `@sistema-odontologico/ui`.
- `apps/api` como shell NestJS con `GET /api/health`.
- `packages/config`, `packages/tsconfig`, `packages/types`, `packages/ui`.
- `infra/docker` y `infra/compose*.yml` para PostgreSQL local en modo híbrido.
- `.github/workflows/ci.yml` con install, lint, typecheck y build.

## Evidencias operativas previstas

- `pnpm install` genera `pnpm-lock.yaml` y resuelve workspaces.
- `pnpm --filter @sistema-odontologico/api test` valida el health endpoint.
- `pnpm exec biome check ...` valida formato/lint del bootstrap.
- `pnpm exec tsc -p <package/app>/tsconfig.json --noEmit` valida tipos sin compilar bundles.

## Diferido explícitamente

- Auth/JWT/cookies seguras.
- RBAC, permisos y restricciones por plan.
- Tenancy real por schema y contexto obligatorio.
- Drizzle ORM, migraciones y seeds.
- Módulos de dominio (`profesionales`, `pacientes`, `turnos`, etc.).
- Observabilidad productiva y OpenAPI.

## Nota de validación

El bootstrap queda listo para que la siguiente change (`auth-tenancy-foundation`) extienda la base sin redefinir la estructura ni el tooling compartido.
