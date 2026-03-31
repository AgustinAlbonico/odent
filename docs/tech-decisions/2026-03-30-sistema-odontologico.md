# Sistema Odontológico SaaS — Decisiones Técnicas

> **Fecha**: 2026-03-30
> **Clasificación**: producto escalable
> **Autor**: generado con project-starter

---

## Resumen Ejecutivo

El proyecto es un SaaS web multi-tenant de gestión odontológica orientado a clínicas, asociaciones y equipos profesionales que necesitan operar agenda, pacientes, historia clínica, odontograma, recetas, administración y evolución futura hacia módulos financieros más profundos. La prioridad técnica para la primera etapa es construir una base sólida y mantenible, con foco en seguridad, aislamiento por tenant, claridad arquitectónica y costo operativo razonable.

La solución elegida combina un frontend web con Next.js y un backend dedicado en NestJS dentro de un monorepo TypeScript, apoyado sobre PostgreSQL con aislamiento por schemas de tenant. La estrategia favorece una base seria y extensible, capaz de crecer a futuro hacia desktop/mobile, workers, Redis y despliegue cloud, sin sobrediseñar desde el día 1.

---

## Decisiones Técnicas

### Arquitectura

| Decisión | Valor | Justificación |
|----------|-------|---------------|
| Estructura del repo | Monorepo | Permite compartir tipos, validaciones, contratos, utilidades y tooling entre web y backend, simplifica refactors atómicos y acompaña mejor una futura expansión a nuevas superficies. |
| Herramienta de monorepo | pnpm workspaces + Turborepo | pnpm workspaces da una base muy sólida para workspaces TypeScript y Turborepo ayuda a ordenar build, typecheck, lint y test con caching y pipelines claros. |
| Patrón arquitectónico | Modular monolith | Da una sola aplicación backend operable y económica al inicio, pero con fronteras de dominio claras para extraer módulos a futuro si realmente hiciera falta. |
| Multi-tenancy | Sí, por schemas en PostgreSQL | Equilibra aislamiento y costo operativo mejor que una base por tenant, y es más seguro/ordenado que solo `tenant_id` para este dominio. |
| Escalabilidad | Vertical al inicio, preparada para horizontal a futuro | Encaja con VPS en la primera etapa sin hipotecar evolución futura a cloud ni a infra distribuida. |
| Comunicación interna | REST entre web y backend | Es la opción más clara para web-first, monorepo y backend dedicado, con menor complejidad operativa que GraphQL o gRPC en esta etapa. |
| Superficies iniciales | Frontend web + backend/API | Responde al alcance actual sin abrir todavía desktop, mobile ni workers completos desde el arranque. |
| Workers / procesos en background | No desde el día 1, pero arquitectura preparada | El dominio va a necesitar tareas diferidas más adelante, pero no conviene sumar esa complejidad antes de consolidar la base. |

### Despliegue

| Decisión | Valor | Justificación |
|----------|-------|---------------|
| Plataforma | VPS | Minimiza costo y complejidad inicial, y además aprovecha experiencia previa disponible en el equipo. |
| Proveedor | VPS a definir (recomendación inicial: Hetzner o DigitalOcean) | Todavía no se cerró proveedor exacto, pero ambos encajan bien para una primera etapa controlada y económica. |
| Containerización | Docker con estrategia híbrida | Conviene desde el día 1 para estandarizar entornos y despliegue, pero sin forzar que todo el desarrollo diario de web/api ocurra dentro de contenedores. |
| CI/CD | GitHub Actions | Tiene muy buen fit con monorepo TypeScript, testing automatizado y evolución gradual del pipeline. |
| Estrategia de evolución | Arquitectura lista para migrar a cloud | La decisión de VPS no debe bloquear una evolución futura a infraestructura más administrada si el producto o la escala lo piden. |

---

### Política de Docker

Se adopta una **estrategia híbrida** para Docker.

#### Docker sí se usa para:

- despliegue reproducible de `web` y `api`;
- estandarización de runtime entre ambientes;
- infraestructura local de desarrollo (`PostgreSQL`, storage S3-compatible y futuros servicios auxiliares);
- facilitar la transición posterior desde VPS hacia cloud sin rehacer la base operativa.

#### Docker no se impone como requisito para todo el loop diario de desarrollo

En la primera etapa, el equipo puede trabajar en modo híbrido:

- `web` y `api` ejecutándose localmente con tooling nativo (`pnpm dev`),
- servicios de infraestructura levantados con Docker Compose.

Esto prioriza experiencia de desarrollo, hot reload simple y menor fricción operativa, sin perder la ventaja de tener contenedores listos para staging/producción.

#### Artefactos Docker esperados en el bootstrap

- `Dockerfile` para `apps/web`
- `Dockerfile` para `apps/api`
- `compose.yml` para infraestructura local
- overrides o scripts para modo desarrollo híbrido y modo full-container

#### Principio rector

Docker se usa como herramienta para **paridad, despliegue y operación**, no como dogma que obligue a containerizar todo el flujo local desde el día 1.

---

## Stack Completo

### Core

| Área | Tecnología | Versión recomendada | Notas |
|------|-----------|---------------------|-------|
| Lenguaje | TypeScript | 5.9.x | Lenguaje principal para frontend, backend y paquetes compartidos. |
| Runtime | Node.js | 22 LTS | Base moderna y estable para Next.js, NestJS y tooling del monorepo. |
| Package manager | pnpm | 10.x | Mejor fit para monorepos por performance, workspaces y control de dependencias. |
| Orquestación de monorepo | Turborepo | estable actual | Recomendado para pipelines, caching y ejecución por paquete/app. |

### Frontend

| Área | Tecnología | Versión recomendada | Notas |
|------|-----------|---------------------|-------|
| Framework | React | 19.x | Base del frontend web por compatibilidad con Next.js y ecosistema fuerte. |
| Meta-framework | Next.js | 16.1.x | Web app principal, SSR/CSR según necesidad, routing moderno y excelente DX. |
| UI Components | Radix UI Primitives | estable actual | Base accesible y flexible para construir un diseño propio sin atarse a una librería visual cerrada. |
| Estado (server state) | TanStack Query | 5.x | Ideal para fetching, caché, invalidación y mutaciones sobre datos del backend. |
| Estado (client state) | Zustand | 5.x | Para estado liviano de UI, filtros, modales, wizard state y composición local. |
| Validación | Zod | 4.x | Compartible entre frontend y backend, con muy buen fit para TypeScript. |
| Animaciones | Framer Motion | estable actual | Uso moderado y utilitario para transiciones y microinteracciones con mejor pulido visual. |
| Formularios | React Hook Form + Zod | estable actual | Recomendación derivada para formularios complejos, aunque la validación canónica sigue estando en Zod. |

### Backend

| Área | Tecnología | Versión recomendada | Notas |
|------|-----------|---------------------|-------|
| Framework | NestJS | 11.1.x | Excelente fit con modular monolith, DI, guards, validation pipelines y estructura enterprise. |
| Base de datos | PostgreSQL | 17.x | Base principal por confiabilidad, consistencia, riqueza relacional y soporte fuerte de schemas. |
| ORM / Query builder | Drizzle ORM + Drizzle Kit | estable actual | Ofrece más control y cercanía a SQL que Prisma, lo que encaja mejor con tenancy por schema y dominio complejo. |
| Autenticación | Custom JWT en cookies | propia | Requerimiento del negocio: mail + contraseña, JWT en cookies, permisos granulares y reglas institucionales por tenant. |
| Cache | No al inicio | — | La arquitectura debe prever incorporación rápida de Redis cuando aparezca la necesidad real. |
| Colas | No al inicio | — | Se deja listo el diseño para agregar workers y colas después sin reestructurar el backend. |
| Almacenamiento | S3-compatible | estable actual | Base recomendada para adjuntos clínicos, audios, logos y archivos futuros sin acoplarse al filesystem local. |
| Rate limiting inicial | En aplicación, preparado para migrar a Redis | propia + futura infraestructura | Al inicio se puede resolver dentro de la app; al escalar conviene moverlo a Redis. |

### Testing

| Área | Tecnología | Versión recomendada | Notas |
|------|-----------|---------------------|-------|
| Unit / Integration | Vitest | 4.x | Muy buen fit para TypeScript moderno y monorepo. |
| E2E | Playwright | 1.58.x | Para flujos críticos reales del sistema. |
| Component testing | Testing Library | estable actual | Recomendado para pruebas de componentes críticos de UI sin sobrecargar el stack. |
| Cobertura mínima | 70% inicial global | — | Con exigencia reforzada en auth, tenancy, profesionales y configuración. |

### DX y Calidad

| Área | Tecnología | Notas |
|------|-----------|-------|
| Linter | Biome | Se prioriza herramienta unificada, rápida y simple de mantener. |
| Formatter | Biome | Evita duplicar tooling innecesario. |
| Git hooks | Husky + lint-staged | Recomendado para sostener calidad local antes del push. |
| Commits | Conventional Commits | Alineado con la convención ya usada y útil para trazabilidad futura. |
| Documentación | OpenAPI/Swagger para backend + documentación viva en `docs/` | El backend necesita contratos claros; el proyecto ya viene documentado con PRDs, roadmap y specs. |

---

## Seguridad

| Área | Enfoque | Herramienta/Patrón |
|------|---------|-------------------|
| Nivel general | Alto | El proyecto maneja identidad, permisos granulares, datos sensibles y futura trazabilidad clínica/administrativa. |
| CORS | Allowlist por ambiente | Solo orígenes permitidos por entorno; nada de políticas abiertas por defecto. |
| Rate limiting | Inicial en app, migrable a Redis | En login, recuperación de contraseña, endpoints sensibles y acciones administrativas críticas. |
| CSP | Sí | Recomendado para endurecer la superficie web desde el inicio. |
| Permisos/Roles | RBAC granular con capacidades + alcance contextual | CASL + modelo propio de permisos, diferenciando VER / HACER / ALCANCE. |
| Audit logging | Sí | Obligatorio para login, logout, cambios de rol, activaciones/desactivaciones y eventos críticos. |
| Gestión de sesiones | JWT en cookies seguras | Cookies `httpOnly`, seguras y alineadas al modelo de auth definido en PRDs. |
| Tenancy security | Aislamiento por schema + contexto obligatorio de tenant | Todo acceso a datos debe ejecutarse bajo contexto explícito del tenant. |
| Restricción institucional por plan | Separada de permisos | El límite de profesionales activos por tenant no reemplaza permisos ni bloquea módulos; solo restringe altas/reactivaciones. |

---

## Observabilidad

| Área | Herramienta | Notas |
|------|-----------|-------|
| Logging | Pino | Logging estructurado, veloz y apto para producción. |
| Error tracking | Sentry | Para errores de frontend y backend, con foco inicial en issues reales y trazabilidad. |
| Métricas | No prioritarias en primera etapa | Se pueden incorporar luego si la operación lo justifica. |
| Tracing | No completo en la primera etapa | Conviene dejar el diseño preparado, pero no sobredimensionar la base. |
| Health checks | Sí | Necesarios para VPS, monitoreo básico y futura migración a cloud. |

---

## Estructura del Proyecto

```text
sistema-odontologico/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── public/
│   │   └── tests/
│   └── api/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── tenancy/
│       │   │   ├── profesionales/
│       │   │   ├── configuracion/
│       │   │   ├── pacientes/
│       │   │   ├── turnos/
│       │   │   └── common/
│       │   ├── infra/
│       │   └── shared/
│       └── tests/
├── packages/
│   ├── config/
│   ├── tsconfig/
│   ├── validation/
│   ├── types/
│   ├── auth-core/
│   ├── permissions/
│   ├── tenancy-core/
│   ├── ui/
│   └── observability/
├── docs/
│   ├── prd/
│   ├── roadmap/
│   ├── superpowers/
│   └── tech-decisions/
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
├── .github/
│   └── workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── biome.json
```

### Descripción de carpetas

| Carpeta | Propósito |
|---------|-----------|
| `apps/web` | Aplicación web principal en Next.js. |
| `apps/api` | Backend NestJS con modular monolith por dominios. |
| `packages/config` | Configuraciones reutilizables del monorepo. |
| `packages/tsconfig` | Presets compartidos de TypeScript. |
| `packages/validation` | Esquemas Zod reutilizables entre frontend y backend. |
| `packages/types` | Tipos y contratos compartidos. |
| `packages/auth-core` | Tipos, helpers y contratos base de autenticación/autorización. |
| `packages/permissions` | Modelo de permisos, abilities y helpers comunes. |
| `packages/tenancy-core` | Contratos y utilidades de contexto tenant. |
| `packages/ui` | Componentes UI propios construidos sobre Radix. |
| `packages/observability` | Helpers compartidos para logging, tracing futuro y manejo consistente de errores. |
| `docs/prd` | PRDs funcionales por módulo. |
| `docs/roadmap` | Roadmap maestro y releases. |
| `docs/tech-decisions` | Decisiones técnicas consolidadas. |
| `infra` | Artefactos de despliegue, Docker y scripts de infraestructura. |
| `.github/workflows` | Pipelines de CI/CD con GitHub Actions. |

---

## Módulos / Apps Iniciales

| Módulo/App | Tipo | Descripción | Dependencias |
|-----------|------|-------------|-------------|
| `web` | frontend | Aplicación principal para administración, profesionales y asistentes. | `ui`, `types`, `validation`, `permissions` |
| `api` | backend | Backend central del producto con modular monolith. | PostgreSQL, Drizzle, `auth-core`, `tenancy-core`, `observability` |
| `config` | shared | Presets compartidos de tooling y configuración. | — |
| `tsconfig` | shared | Presets TS centralizados para apps y packages. | TypeScript |
| `validation` | shared | Esquemas Zod compartidos. | Zod |
| `types` | shared | Tipos de dominio y contratos serializables. | TypeScript |
| `auth-core` | shared | Tipos y utilidades base de auth, sesión y claims. | `types` |
| `permissions` | shared | Definiciones de permisos granulares y abilities. | CASL, `types` |
| `tenancy-core` | shared | Contratos y utilidades para contexto tenant. | `types` |
| `ui` | shared | Design system propio sobre Radix. | React, Radix UI |
| `observability` | shared | Logging, errores, correlación y convenciones observables. | Pino, Sentry |

---

## Decisiones específicas de dominio relevantes para el stack

1. **El sistema nace multi-tenant desde el día 1**. No se considera single-tenant como fase intermedia.
2. **Los planes por tenant existen desde el inicio**, pero por ahora solo limitan la cantidad de profesionales activos y no hacen feature gating.
3. **La autenticación es custom** porque la lógica de acceso está fuertemente acoplada a tenancy, roles, permisos y restricciones institucionales.
4. **El modular monolith debe ser extraction-ready**: auth, tenancy, notificaciones o finanzas podrían separarse más adelante si el producto lo exigiera.
5. **La base inicial es español-only**, sin i18n en la primera etapa.

---

## Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Fugas entre tenants por mal manejo del contexto de schema | Media | Alto | Encapsular el acceso a datos con contexto obligatorio de tenant, tests de aislamiento y convenciones estrictas en backend. |
| Complejidad de migraciones por schema | Alta | Alto | Diseñar desde temprano una estrategia de migración por tenant y automatizarla en bootstrap/ops. |
| Auth custom mal resuelta o demasiado acoplada | Media | Alto | Separar identidad, sesión, permisos y restricciones institucionales; cubrir con tests críticos desde Release 0. |
| Mezclar permisos con restricciones de plan | Media | Alto | Mantener modelo explícito: permiso del rol ≠ cupo institucional ≠ estado del profesional. |
| Deriva arquitectónica del modular monolith | Media | Alto | Definir fronteras de módulo, reglas de importación y contratos compartidos desde el arranque. |
| Sobrecarga operativa del VPS | Media | Medio | Usar Docker, health checks, backups claros y preparar la arquitectura para futura migración a cloud. |
| Storage mal abstraído y difícil de migrar | Baja | Medio | Diseñar una interfaz de almacenamiento desacoplada del proveedor concreto. |
| Monorepo con dependencias circulares | Media | Medio | Definir paquetes con responsabilidades claras y revisar el grafo de dependencias desde temprano. |

---

## Próximos Pasos

1. [ ] Guardar y aprobar formalmente este documento como base técnica del proyecto.
2. [ ] Ejecutar el bootstrap del monorepo con `pnpm workspaces + Turborepo + Docker + Biome`.
3. [ ] Crear la estructura inicial de `apps/web`, `apps/api` y paquetes compartidos.
4. [ ] Definir y generar la base Docker del proyecto: `Dockerfile` para web y api, `compose.yml` para infraestructura local y scripts para modo híbrido de desarrollo.
5. [ ] Diseñar técnicamente Release 0 en detalle: auth, tenancy, profesionales y configuración mínima.
6. [ ] Definir estrategia operativa de PostgreSQL por schemas de tenant y su mecanismo de migración.
7. [ ] Implementar primero los cimientos: autenticación/autorización, contexto tenant, padrón profesional y configuración institucional mínima.
8. [ ] Configurar CI con GitHub Actions para lint, typecheck, tests e2e críticos en etapas posteriores.

---

*Generado por project-starter · 2026-03-30*
