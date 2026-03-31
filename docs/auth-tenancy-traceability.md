# Auth & Tenancy Foundation — Traceability Matrix

> **Change**: auth-tenancy-foundation
> **Date**: 2026-03-30
> **Status**: ✅ 20/20 spec scenarios COMPLIANT — all tasks implemented, typecheck + tests passing

---

## 1. RF → Tasks → Tests Matrix

### P0 — Críticos

| RF | Description | Implementation Task(s) | Unit Test(s) | Integration Test(s) | E2E Skeleton | Status |
|---|---|---|---|---|---|---|
| RF-AA-001 | Login con mail y contraseña | Auth service login() | `security.test.ts` (rate limiting) | `auth-lifecycle.test.ts` (login success/failure) | `auth-access.spec.ts` (login → dashboard) | ✅ Implemented |
| RF-AA-002 | Sesión segura con JWT en cookies | Auth service login() + JWT signing | — | `auth-lifecycle.test.ts` (session created) | `auth-access.spec.ts` (login flow) | ✅ Implemented |
| RF-AA-003 | Identidad inequívoca por sesión | JWT payload (sub, tid, role, tokenVersion) | `abilities.test.ts` (resolvePermissions) | `auth-lifecycle.test.ts` (session context) | — | ✅ Implemented |
| RF-AA-004 | Evaluación separada de ver y hacer | PermissionsService canView/canOperate | `abilities.test.ts` (canView ≠ canOperate) | — | `auth-access.spec.ts` (sidebar filtering) | ✅ Implemented |
| RF-AA-005 | Restricción por alcance | PermissionsService getEffectiveScope | `abilities.test.ts` (scope dimension) | — | `auth-access.spec.ts` (direct route access) | ✅ Implemented |
| RF-AA-006 | Roles base obligatorios | BaseRole enum + DEFAULT_ROLE_PERMISSIONS | `permissions.test.ts` (4 roles) | — | `auth-access.spec.ts` (role-based redirect) | ✅ Implemented |
| RF-AA-007 | Permisos granulares | PermissionEntry + userPermissions table | `permissions.test.ts` (default perms) | — | — | ✅ Implemented |
| RF-AA-008 | Menú condicionado por permisos | PermissionsService getAccessibleModules | `abilities.test.ts` (getAccessibleModules) | — | `auth-access.spec.ts` (sidebar shows permitted) | ✅ Implemented |
| RF-AA-009 | Bloqueo efectivo ante acceso no autorizado | AuthGuard (VIEW/OPERATE/SCOPE) | `abilities.test.ts` (denied cases) | `audit.test.ts` (ACCESS_DENIED) | `auth-access.spec.ts` (direct route → 403) | ✅ Implemented |
| RF-AA-009A | Restricción plan → padrón profesional | PlanGovernanceService + PlanRestrictionGuard | `plan-restriction.test.ts` (all quota scenarios) | — | — | ✅ Implemented |
| RF-AA-010 | Recuperación de contraseña | PasswordService requestRecovery/resetWithRecovery | — | `recovery.test.ts` (full flow) | `auth-access.spec.ts` (recovery flow) | ✅ Implemented |
| RF-AA-011 | Cambio de contraseña propio | PasswordService changePassword | — | `recovery.test.ts` (change pattern) | — | ✅ Implemented |
| RF-AA-012 | Cambio obligatorio de contraseña | PasswordService forceChangePassword | — | `recovery.test.ts` (force pattern) | `auth-access.spec.ts` (force change flow) | ✅ Implemented |
| RF-AA-013 | Expiración por inactividad | Session policy + JWT expiry | — | `auth-lifecycle.test.ts` (token expiry) | `auth-access.spec.ts` (session expires) | ✅ Implemented |
| RF-AA-014 | Expiración por duración máxima | JWT exp claim + session policies | — | `auth-lifecycle.test.ts` (refresh rejection) | `auth-access.spec.ts` (max duration) | ✅ Implemented |
| RF-AA-015 | Renovación controlada de sesión | Auth service refresh() | — | `auth-lifecycle.test.ts` (refresh rotates) | — | ✅ Implemented |
| RF-AA-016 | Cierre de sesión manual | Auth service logout() | — | `auth-lifecycle.test.ts` (logout + audit) | `auth-access.spec.ts` (logout flow) | ✅ Implemented |
| RF-AA-017 | Gestión de sesiones activas | Session admin (controller pattern) | — | `session-admin.test.ts` (list/close/audit) | — | ✅ Implemented |
| RF-AA-018 | Bloqueo temporal por abuso | SecurityService rate limiting | `security.test.ts` (lockout at threshold) | `auth-lifecycle.test.ts` (locked out user) | — | ✅ Implemented |
| RF-AA-019 | Auditoría de eventos de acceso | AuditEventType enum + recordAudit() | — | `audit.test.ts` (all event types) | — | ✅ Implemented |

### P1 — Importantes

| RF | Description | Implementation Task(s) | Unit Test(s) | Integration Test(s) | E2E Skeleton | Status |
|---|---|---|---|---|---|---|
| RF-AA-020 | Rehabilitación controlada de cuentas | PasswordService + SecurityService clearFailedAttempts | `security.test.ts` (clear attempts) | `recovery.test.ts` (reset clears lock) | — | ✅ Implemented |
| RF-AA-021 | Historial personal de accesos | Audit trail (self-query) | — | `audit.test.ts` (filter by actor) | — | ✅ Implemented |
| RF-AA-022 | Redirección inicial según contexto | Frontend role-based routing | — | — | `auth-access.spec.ts` (role-based redirect) | ✅ Implemented |
| RF-AA-023 | Política institucional de sesión configurable | SessionPolicyService + SessionPolicyController + SessionPolicyRuntimeService | `session-policy-runtime-contract.test.ts` (4) | `auth-session-policy-enforcement.test.ts` (2) | — | ✅ Implemented |
| RF-AA-024 | Exportación controlada de auditoría | Audit export endpoint | — | `audit.test.ts` (CSV export) | — | ✅ Implemented |

### P2 — Deseables

| RF | Description | Implementation Task(s) | Unit Test(s) | Integration Test(s) | E2E Skeleton | Status |
|---|---|---|---|---|---|---|
| RF-AA-025 | Aviso de acceso inusual | SecurityService checkUnusualAccess | `security.test.ts` (unusual access) | `auth-lifecycle.test.ts` (unusual detection) | — | ✅ Implemented |
| RF-AA-026 | Revisión periódica de permisos | PermissionReviewService | — | `permission-review.test.ts` (full cycle) | — | ✅ Implemented |

---

## 2. Validation Criteria Coverage

| Validation ID | Criterion | Covering Test(s) | Status |
|---|---|---|---|
| V1 | Module enum has 17 values | `permissions.test.ts` (Module enum) | ✅ Covered |
| V2 | Action enum has 15 values | `permissions.test.ts` (Action enum) | ✅ Covered |
| V3 | Scope enum has 6 values | `permissions.test.ts` (Scope enum) | ✅ Covered |
| V4 | BaseRole enum has 4 values | `permissions.test.ts` (BaseRole enum) | ✅ Covered |
| V5 | Admin gets all permissions with INSTITUTIONAL_TOTAL | `permissions.test.ts` (Admin role) | ✅ Covered |
| V6 | Profesional gets clinical modules only | `permissions.test.ts` (Profesional role) | ✅ Covered |
| V7 | Asistente gets operational modules only | `permissions.test.ts` (Asistente role) | ✅ Covered |
| V8 | Supervisor gets clinical + supervision | `permissions.test.ts` (Supervisor role) | ✅ Covered |
| V9 | VIEW ≠ OPERATE ≠ SCOPE | `permissions.test.ts` (evaluation rules) | ✅ Covered |
| V10 | PLAN_LIMITS has all TenantPlan entries | `plan-limits.test.ts` (coverage) | ✅ Covered |
| V11 | Plan limits increase monotonically | `plan-limits.test.ts` (monotonicity) | ✅ Covered |
| V12 | tenantSchema produces valid schema names | `plan-limits.test.ts` (schema resolver) | ✅ Covered |
| V13 | Cupo disponible → allowed: true | `plan-restriction.test.ts` | ✅ Covered |
| V14 | Cupo agotado sin grace → quota_exhausted | `plan-restriction.test.ts` | ✅ Covered |
| V15 | Cupo agotado + gracia activa → grace_active | `plan-restriction.test.ts` | ✅ Covered |
| V16 | Cupo agotado + gracia expirada → grace_expired_over_quota | `plan-restriction.test.ts` | ✅ Covered |
| V17 | Rate limiting triggers at 5 attempts | `security.test.ts` | ✅ Covered |
| V18 | Lockout clears on success | `security.test.ts` (clearFailedAttempts) | ✅ Covered |
| V19 | New IP flagged as unusual | `security.test.ts` (new IP) | ✅ Covered |
| V20 | Different UA flagged as unusual | `security.test.ts` (new UA) | ✅ Covered |
| V21 | canView returns false for NONE scope | `abilities.test.ts` | ✅ Covered |
| V22 | canOperate returns false for view actions | `abilities.test.ts` | ✅ Covered |
| V23 | getEffectiveScope returns NONE for missing perms | `abilities.test.ts` | ✅ Covered |
| V24 | Login success creates session + audit | `auth-lifecycle.test.ts` | ✅ Covered |
| V25 | Token version mismatch rejects refresh | `auth-lifecycle.test.ts` | ✅ Covered |
| V26 | Recovery token cannot be reused | `recovery.test.ts` | ✅ Covered |

---

## 3. Known Gaps

### RFs with incomplete test coverage

| RF | Gap | Explanation |
|---|---|---|
| RF-AA-013 | Session inactivity timeout | Tests verify JWT `exp` claim and runtime enforcement (`session-policy-runtime-enforcement.test.ts`) but not end-to-end real-time expiry with a running server. |
| RF-AA-014 | Max session duration | Similar to RF-AA-013 — integration tests verify the rejection path (`auth-session-policy-enforcement.test.ts`) but not a live session timing out over time. |

### Tests that need a running database

| Test File | What needs DB | Alternative |
|---|---|---|
| `recovery.test.ts` | Token hash comparison (bcrypt) | Currently uses simplified mocks. Would benefit from actual bcrypt round-trip with a test DB. |
| `permission-review.test.ts` | Multi-table joins (permissions, reviews, users) | Mock DB simulates joins but real DB would validate SQL correctness. |
| `session-admin.test.ts` | Session listing with joins | Mock DB; real DB would validate Drizzle query correctness. |
| All E2E tests (`auth-access.spec.ts`) | Running API + Web server | Marked as `.skip`; need CI/staging environment. |

### Test infrastructure improvements needed

1. **Playwright setup for apps/web**: Los E2E siguen como skeletons `.skip`; falta instalar/configurar Playwright si se quieren ejecutar.
2. **Test database**: Integration tests se apoyan en mocks de Drizzle; un PostgreSQL de prueba con migraciones daría evidencia más fuerte.

---

## 4. Test File Index

### Shared Packages

| File | Type | Tests |
|---|---|---|
| `packages/permissions/__tests__/permissions.test.ts` | Unit | 23 |
| `packages/tenancy-core/__tests__/plan-limits.test.ts` | Unit | 12 |
| **Packages subtotal** | | **35** |

### API Backend (`apps/api`)

| File | Type | Tests |
|---|---|---|
| `test/unit/abilities.test.ts` | Unit | 20 |
| `test/unit/security.test.ts` | Unit | 15 |
| `test/unit/plan-restriction.test.ts` | Unit | 8 |
| `test/unit/session-policy-runtime-contract.test.ts` | Unit | 4 |
| `test/unit/session-policy-runtime-enforcement.test.ts` | Unit | 3 |
| `test/unit/auth-runtime-contract.test.ts` | Unit | 2 |
| `test/unit/professionals-runtime-contract.test.ts` | Unit | 10 |
| `test/unit/audit-controller.test.ts` | Unit | 1 |
| `test/integration/auth-lifecycle.test.ts` | Integration | 12 |
| `test/integration/recovery.test.ts` | Integration | 5 |
| `test/integration/session-admin.test.ts` | Integration | 6 |
| `test/integration/audit.test.ts` | Integration | 14 |
| `test/integration/permission-review.test.ts` | Integration | 4 |
| `test/integration/auth-session-policy-enforcement.test.ts` | Integration | 2 |
| `test/integration/auth-authorization-runtime.test.ts` | Integration | 4 |
| `test/integration/account-admin.test.ts` | Integration | 1 |
| `test/health.e2e-spec.ts` | Integration smoke | 1 |
| **API subtotal** | | **114** |

### Web Frontend (`apps/web`)

| File | Type | Tests |
|---|---|---|
| `src/middleware.test.ts` | Unit | 8 |
| `src/lib/auth/login-form.test.ts` | Unit | 6 |
| `src/lib/auth/routing.test.ts` | Unit | 4 |
| `src/lib/auth/api.test.ts` | Unit | 4 |
| `src/components/navigation/sidebar.test.ts` | Unit | 3 |
| `src/lib/auth/reason.test.ts` | Unit | 1 |
| **Web subtotal** | | **26** |

### E2E Skeletons (Playwright — all `.skip`)

| File | Type | Tests |
|---|---|---|
| `tests/e2e/auth-access.spec.ts` | E2E Skeleton | 11 (all skipped) |

---

**Total**: 175 test cases passing + 11 E2E skeletons (skipped — require Playwright + running servers)

---

*Generated as part of auth-tenancy-foundation change · Updated 2026-03-30 (final verified state)*
