# Auth Tenancy Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar `auth-tenancy-foundation` a una implementación verificable y alineada al PRD, corrigiendo build, tests, contratos runtime y wiring faltante.

**Architecture:** Primero se corrigen los bloqueadores estructurales que impiden compilar y ejecutar tests. Después se alinean los contratos backend/frontend de autenticación y autorización. Finalmente se implementa el wiring faltante de políticas de sesión y restricciones por plan, y se reejecuta la verificación completa.

**Tech Stack:** pnpm workspace, Turborepo, NestJS 11, Next.js 16, React 19, TypeScript 5.9, Vitest, Playwright (separado de Vitest), Drizzle ORM.

---

### Task 1: Desbloquear compilación y carga de tests

**Files:**
- Modify: `packages/ui/src/components/{badge,button,card,input,label}.tsx`
- Modify: `packages/permissions/tsconfig.json`
- Modify: `packages/tenancy-core/tsconfig.json`
- Modify: `packages/tsconfig/package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/api/test/{unit,integration}/**`
- Modify: `apps/api/vitest.config.ts`
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Test: `pnpm typecheck`, `pnpm build`, `pnpm --filter @sistema-odontologico/api test`

- [x] Corregir props typing de React 19 para `ref` usando `ComponentPropsWithRef` o `RefAttributes`.
- [x] Normalizar `extends` de tsconfig (`@sistema-odontologico/tsconfig/base`) o agregar compat export.
- [x] Separar runner de E2E en web: Vitest no debe cargar specs de Playwright.
- [x] Corregir imports relativos rotos en `apps/api/test/**`.
- [x] Corregir syntax error en `apps/api/test/integration/recovery.test.ts`.
- [x] Resolver imports de workspace packages en tests API usando alias a `src` o estrategia equivalente estable.
- [x] Hacer type-only el uso de `Request`/`Response` si corresponde, o resolver dependencia faltante sin romper runtime.

### Task 2: Alinear contrato de autenticación y abilities

**Files:**
- Modify: `apps/api/src/modules/auth/{auth.controller.ts,abilities.controller.ts,auth.service.ts}`
- Modify: `apps/api/src/common/guards/auth.guard.ts`
- Modify: `apps/api/src/modules/auth/password/{password.controller.ts,password.service.ts}`
- Modify: `apps/web/src/lib/auth/{api.ts,context.tsx}`
- Modify: `apps/web/src/hooks/use-abilities.ts`
- Modify: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/app/(auth)/**`
- Test: focused auth tests + frontend auth contract assertions

- [x] Definir contrato canónico de `GET /auth/abilities` y usarlo en backend y frontend.
- [x] Unificar vocabulario de acciones/alcances con `packages/permissions`.
- [x] Montar `AuthGuard` en el pipeline real.
- [x] Unificar nombres de cookies entre backend y middleware/frontend.
- [x] Corregir payloads y flujo de forced password change / reset password.
- [x] Asegurar que login exitoso y login con cambio forzado tengan continuidad coherente y testeable.

### Task 3: Completar wiring funcional faltante del PRD

**Files:**
- Create/Modify: `apps/api/src/modules/session-policy/**`
- Modify: `apps/api/src/app.module.ts`
- Create/Modify: `apps/api/src/modules/professionals/**`
- Modify: `apps/web/src/lib/auth/api.ts`
- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Create/Modify: `apps/web/src/app/(dashboard)/page.tsx`
- Test: session-policy + professional-growth scenarios

- [x] Implementar backend real de `session-policy` con lectura/actualización dentro de límites seguros.
- [x] Crear landing route real para `/dashboard` o redirigir a una ruta existente coherente.
- [x] Agregar rutas reales para create/activate/reactivate professionals.
- [x] Aplicar `@PlanRestricted(...)` en rutas reales para crecimiento de profesionales.
- [x] Mantener separación estricta entre RBAC, scope y restricción por plan.

### Task 4: Rehabilitar verificación automática

**Files:**
- Modify: `apps/api/test/**`
- Modify: `apps/web/tests/e2e/auth-access.spec.ts`
- Modify: `docs/implementation/auth-tenancy-traceability.md`
- Test: `pnpm test`, `pnpm build`, `pnpm typecheck`

- [x] Reejecutar suites corregidas y cerrar los errores de carga restantes.
- [x] Mantener E2E separados de Vitest; si Playwright queda instalado, dejar script explícito.
- [x] Actualizar matriz de trazabilidad con estado real después de la remediación.
- [x] Ejecutar verificación final fresca antes de declarar completitud.
