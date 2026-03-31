# Template de Documento de Decisiones Tecnicas — project-starter

Este template se usa para generar el documento final de FASE 5. Adaptar secciones segun la clasificacion del proyecto.

---

```markdown
# [Nombre del Proyecto] — Decisiones Tecnicas

> **Fecha**: YYYY-MM-DD
> **Clasificacion**: MVP | producto interno | producto escalable
> **Autor**: generado con project-starter

---

## Resumen Ejecutivo

[2-3 oraciones que describen que es el proyecto, para quien, y cual es su proposito principal.]

---

## Decisiones Tecnicas

### Arquitectura

| Decision | Valor | Justificacion |
|----------|-------|---------------|
| Estructura del repo | [monorepo / multirepo] | [por que] |
| Patron arquitectonico | [monolito / modular monolith / microservicios / serverless] | [por que] |
| Multi-tenancy | [si (tipo) / no] | [por que] |
| Escalabilidad | [vertical / horizontal / auto-scaling] | [por que] |
| Comunicacion interna | [REST / GraphQL / gRPC / eventos] | [por que] |

### Despliegue

| Decision | Valor | Justificacion |
|----------|-------|---------------|
| Plataforma | [Cloud / VPS / PaaS / on-premise / hibrido] | [por que] |
| Proveedor | [AWS / GCP / Azure / Vercel / Railway / etc.] | [por que] |
| Containerizacion | [Docker / sin containers] | [por que] |
| CI/CD | [GitHub Actions / GitLab CI / Vercel / etc.] | [por que] |

---

## Stack Completo

### Core

| Area | Tecnologia | Version recomendada | Notas |
|------|-----------|---------------------|-------|
| Lenguaje | [TypeScript / Python / Go / etc.] | [version] | |
| Runtime | [Node.js / Deno / Bun / etc.] | [version] | |
| Package manager | [pnpm / npm / yarn / bun] | [version] | |

### Frontend

| Area | Tecnologia | Version recomendada | Notas |
|------|-----------|---------------------|-------|
| Framework | [React / Angular / Vue / Svelte / etc.] | [version] | |
| Meta-framework | [Next.js / Nuxt / SvelteKit / etc.] | [version] | Si aplica |
| UI Components | [shadcn/ui / Radix / MUI / etc.] | [version] | |
| Estado | [Zustand / Redux / Jotai / TanStack Query / etc.] | [version] | |
| Validacion | [Zod / Yup / Valibot / etc.] | [version] | |
| Animaciones | [Framer Motion / GSAP / CSS / etc.] | [version] | Si aplica |

### Backend

| Area | Tecnologia | Version recomendada | Notas |
|------|-----------|---------------------|-------|
| Framework | [NestJS / Express / Fastify / Django / etc.] | [version] | |
| Base de datos | [PostgreSQL / MySQL / MongoDB / etc.] | [version] | |
| ORM / Query builder | [Prisma / Drizzle / TypeORM / etc.] | [version] | |
| Autenticacion | [Clerk / Auth.js / Supabase Auth / custom JWT / etc.] | [version] | |
| Cache | [Redis / in-memory / etc.] | [version] | Si aplica |
| Colas | [BullMQ / RabbitMQ / etc.] | [version] | Si aplica |
| Almacenamiento | [S3 / R2 / MinIO / local / etc.] | [version] | Si aplica |

### Testing

| Area | Tecnologia | Version recomendada | Notas |
|------|-----------|---------------------|-------|
| Unit / Integration | [Vitest / Jest / etc.] | [version] | |
| E2E | [Playwright / Cypress / etc.] | [version] | Si aplica |
| Component testing | [Testing Library / Storybook / etc.] | [version] | Si aplica |
| Cobertura minima | [X%] | — | |

### DX y Calidad

| Area | Tecnologia | Notas |
|------|-----------|-------|
| Linter | [ESLint / Biome / oxlint] | |
| Formatter | [Prettier / Biome / ninguno] | |
| Git hooks | [Husky + lint-staged / lefthook / ninguno] | |
| Commits | [Conventional Commits + Commitlint / formato libre] | |
| Documentacion | [Storybook / Swagger / TypeDoc / etc.] | Si aplica |

---

## Seguridad

| Area | Enfoque | Herramienta/Patron |
|------|---------|-------------------|
| Nivel general | [basico / medio / alto] | |
| CORS | [configuracion] | |
| Rate limiting | [herramienta] | Si aplica |
| CSP | [si / no] | Si aplica |
| Permisos/Roles | [RBAC simple / RBAC dinamico / ABAC / sin permisos] | [CASL / casbin / custom] |
| Audit logging | [si / no] | Si clasificacion = escalable |

---

## Observabilidad

> Solo incluir si clasificacion >= producto interno.

| Area | Herramienta | Notas |
|------|-----------|-------|
| Logging | [Pino / Winston / etc.] | |
| Error tracking | [Sentry / Datadog / etc.] | Si aplica |
| Metricas | [Prometheus / Datadog / etc.] | Si aplica |
| Tracing | [OpenTelemetry / etc.] | Si aplica |
| Health checks | [si / no] | |

---

## Estructura del Proyecto

```
[nombre-proyecto]/
├── [estructura de carpetas propuesta]
├── ...
└── ...
```

### Descripcion de carpetas

| Carpeta | Proposito |
|---------|-----------|
| [carpeta] | [descripcion] |
| [carpeta] | [descripcion] |
| ... | ... |

---

## Modulos / Apps Iniciales

| Modulo/App | Tipo | Descripcion | Dependencias |
|-----------|------|-------------|-------------|
| [nombre] | [frontend / backend / shared / worker] | [que hace] | [de que depende] |
| [nombre] | [tipo] | [que hace] | [dependencias] |

---

## Riesgos Tecnicos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| [Riesgo 1] | Alta/Media/Baja | Alto/Medio/Bajo | [plan] |
| [Riesgo 2] | Alta/Media/Baja | Alto/Medio/Bajo | [plan] |

---

## Proximos Pasos

1. [ ] [Paso 1 — ej: "Ejecutar bootstrap del proyecto"]
2. [ ] [Paso 2 — ej: "Configurar base de datos y primera migracion"]
3. [ ] [Paso 3 — ej: "Implementar autenticacion basica"]
4. [ ] [Paso 4 — ej: "Crear primer modulo de negocio"]
5. [ ] [Paso 5 — ej: "Configurar CI/CD para staging"]

---

*Generado por project-starter · [fecha]*
```

---

## Reglas de uso del template

| Clasificacion | Secciones obligatorias | Secciones opcionales |
|---------------|----------------------|---------------------|
| **MVP** | Resumen, Decisiones Tecnicas (arquitectura), Stack (core + frontend + backend + testing), Estructura, Proximos Pasos | Seguridad (basico), DX |
| **Producto interno** | Todas las de MVP + Seguridad + Observabilidad (basica) + Modulos + Riesgos | Observabilidad avanzada |
| **Producto escalable** | Todas las secciones | — |

### Convenciones de escritura

1. **Concreto y justificado** — cada decision con razon, no solo el nombre de la herramienta
2. **Versiones recomendadas** — incluir version actual estable segun Context7
3. **Trade-offs visibles** — si una decision tiene riesgos, mencionarlos
4. **Estructura real** — el arbol de carpetas debe reflejar las decisiones, no ser generico
5. **Proximos pasos accionables** — cosas que se pueden hacer inmediatamente despues del bootstrap
