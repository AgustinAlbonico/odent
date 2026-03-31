---
name: project-starter
description: >
  Guia interactiva para definir tecnica y funcionalmente un proyecto desde cero.
  Usa preguntas adaptativas con la herramienta `question` para recorrer desde la vision
  del producto hasta el bootstrap de la estructura inicial. Integra Context7 MCP para
  recomendar librerias, frameworks y herramientas actualizadas en cada etapa.
  Trigger: Cuando el usuario quiere arrancar un proyecto nuevo, definir stack tecnico,
  inicializar un repositorio, o dice "nuevo proyecto", "project starter", "arrancar proyecto",
  "definir stack", "bootstrap proyecto".
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Protocolo project-starter

## Flujo general

```
FASE 1: Descubrimiento del Proyecto
    | vision, tipo, usuarios, complejidad, contexto
    v
FASE 2: Arquitectura de Alto Nivel
    | monorepo/multirepo, monolito/microservicios, despliegue, tenancy
    v
FASE 3: Stack Principal
    | frameworks, lenguaje, base de datos, ORM, auth, estado, colas, testing
    v  (Context7 activo desde aca)
FASE 4: Implementacion Detallada
    | UI, animaciones, validacion, seguridad, logging, i18n, CI/CD, convenciones
    v  (Context7 activo)
FASE 5: Generacion del Documento de Decisiones
    | resumen ejecutivo, decisiones, stack, riesgos, proximos pasos
    v
FASE 6: Bootstrap / Inicializacion del Proyecto
    | carpetas, apps/packages, configs, dependencias, setup inicial
```

---

## Reglas CRITICAS

1. **SIEMPRE usar herramienta `question`** para preguntar al usuario — nunca preguntas en texto plano
2. **Maximo 4 preguntas por ronda** — nunca mas
3. **Mezclar preguntas con opciones y abiertas** segun el tipo de decision
4. **NUNCA asumir tecnologias** sin preguntar — proponer alternativas con trade-offs
5. **NUNCA saltar a generar codigo** sin terminar las fases de preguntas
6. **Context7 es OBLIGATORIO** desde FASE 3 en adelante — usar `context7_resolve-library-id` y `context7_query-docs` para recomendar herramientas actuales
7. **Adaptar preguntas** segun respuestas anteriores — si una decision implica otras, aprovecharlo
8. **Advertir inconsistencias** — si detecta combinaciones riesgosas o incompatibles, avisar y sugerir alternativas
9. **Progresion logica** — siempre de lo general a lo especifico, nunca al reves
10. **El bootstrap respeta las decisiones** — la estructura generada debe reflejar EXACTAMENTE lo decidido, no una plantilla generica

---

## FASE 1 — Descubrimiento del Proyecto (obligatoria)

**Objetivo**: Entender que se quiere construir, para quien, y en que contexto.

### Que explorar

- Tipo de producto o sistema (SaaS, herramienta interna, API publica, e-commerce, etc.)
- Objetivo principal del producto
- Tipo de usuario principal y secundarios
- Contexto de uso (web, mobile, desktop, CLI, embebido)
- Nivel de complejidad esperado (MVP, prototipo, producto interno, producto escalable)
- Restricciones conocidas (tiempo, presupuesto, equipo, regulaciones)

### Clasificacion del proyecto

Basandose en las respuestas, clasificar:

| Tipo | Senales | Profundidad de preguntas |
|------|---------|--------------------------|
| **MVP / Prototipo** | Validar idea, time-to-market, equipo chico | Fases 1-3 reducidas, FASE 4 minima |
| **Producto interno** | Equipo conocido, requirements claros, sin escalabilidad extrema | Fases 1-4 completas, FASE 4 moderada |
| **Producto escalable** | Multi-tenant, alta disponibilidad, equipo grande, compliance | Todas las fases al maximo |

### Ronda 1: Vision y contexto

Usar preguntas del banco de preguntas: [references/question-bank.md](references/question-bank.md) — Bloque 1.

Al terminar la ronda, mostrar resumen:

```
Entendi el contexto del proyecto:
- Tipo: [clasificacion]
- Producto: [descripcion corta]
- Usuarios: [principales]
- Contexto de uso: [plataformas]
- Nivel: [MVP | interno | escalable]

Hay algo incorrecto o queres agregar algo antes de pasar a arquitectura?
```

---

## FASE 2 — Arquitectura de Alto Nivel

**Objetivo**: Definir la estructura macro del sistema.

### Decisiones a resolver

| Decision | Opciones tipicas | Depende de |
|----------|------------------|------------|
| Estructura del repo | Monorepo, multirepo, monorepo hibrido | Cantidad de apps, equipo |
| Patron arquitectonico | Monolito, modular monolith, microservicios | Complejidad, equipo, escala |
| Superficies del sistema | Frontend, backend, mobile, workers, APIs, cron jobs | Tipo de producto |
| Escalabilidad | Vertical, horizontal, auto-scaling | Nivel del proyecto |
| Multi-tenancy | Single-tenant, multi-tenant por schema, multi-tenant por DB | Tipo de producto |
| Despliegue | Cloud (AWS/GCP/Azure), VPS, local/on-premise, hibrido | Presupuesto, compliance |
| Comunicacion entre servicios | REST, GraphQL, gRPC, message queues, eventos | Arquitectura elegida |

### Reglas de esta fase

- Si el proyecto es MVP/prototipo, recomendar monolito o modular monolith y explicar por que
- Si elige microservicios, advertir sobre complejidad operativa y preguntar si tiene el equipo para mantenerlo
- Si elige monorepo, preguntar si conoce herramientas como Turborepo, Nx o pnpm workspaces
- Cada recomendacion debe incluir: ventaja principal, desventaja principal, y cuando NO conviene

### Ronda 2-3: Preguntas de arquitectura

Usar preguntas del banco: [references/question-bank.md](references/question-bank.md) — Bloque 2.

Adaptar segun la clasificacion de FASE 1:
- MVP: 1 ronda (3-4 preguntas), proponer defaults sensatos
- Producto interno: 1-2 rondas
- Producto escalable: 2-3 rondas

### Checkpoint de arquitectura

```
Arquitectura definida:
- Repo: [monorepo | multirepo]
- Patron: [monolito | modular monolith | microservicios]
- Superficies: [lista]
- Despliegue: [target]
- Multi-tenant: [si/no y tipo]

Hay algo que quieras cambiar antes de bajar al stack tecnico?
```

---

## FASE 3 — Stack Principal (Context7 OBLIGATORIO)

**Objetivo**: Definir las herramientas centrales del proyecto.

### Decisiones a resolver

| Area | Ejemplos | Context7 query |
|------|----------|----------------|
| Lenguaje principal | TypeScript, Python, Go, Rust, Java | No aplica |
| Framework frontend | React, Angular, Vue, Svelte, Solid | `context7_resolve-library-id` por cada opcion |
| Framework backend | NestJS, Express, Fastify, Django, FastAPI, Go stdlib | Idem |
| Base de datos | PostgreSQL, MySQL, MongoDB, SQLite, Supabase | Idem |
| ORM / Query builder | Prisma, Drizzle, TypeORM, Sequelize, Knex | Idem |
| Autenticacion | Auth.js, Clerk, Supabase Auth, Firebase Auth, custom JWT | Idem |
| Manejo de estado | Redux, Zustand, Jotai, Signals, TanStack Query | Idem |
| Sistema de colas | BullMQ, RabbitMQ, SQS, Redis Streams | Idem |
| Almacenamiento de archivos | S3, Cloudflare R2, MinIO, local filesystem | Idem |
| Testing | Vitest, Jest, Playwright, Cypress, Testing Library | Idem |
| Documentacion | Storybook, Swagger/OpenAPI, TypeDoc, Docusaurus | Idem |

### Protocolo Context7

Para cada area de decision donde se necesite recomendar herramientas:

1. Usar `context7_resolve-library-id` para obtener IDs de las opciones candidatas
2. Usar `context7_query-docs` para obtener informacion actualizada
3. Presentar las opciones al usuario con:
   - Descripcion breve de cada opcion
   - Ventaja principal
   - Desventaja o limitacion
   - Escenario ideal de uso
   - Compatibilidad con decisiones ya tomadas
4. **NO imponer** — siempre preguntar con `question` tool

Ver protocolo completo en [references/context7-integration.md](references/context7-integration.md).

### Ronda 4-6: Preguntas de stack

Usar preguntas del banco: [references/question-bank.md](references/question-bank.md) — Bloque 3.

Agrupar preguntas por dominio para no abrumar:
- Ronda A: Lenguaje + frameworks (frontend/backend)
- Ronda B: Datos (DB + ORM + cache)
- Ronda C: Auth + estado + testing

Adaptar segun clasificacion:
- MVP: 2 rondas, proponer un stack cohesivo como default
- Producto interno: 2-3 rondas
- Producto escalable: 3-4 rondas

### Checkpoint de stack

```
Stack principal definido:
- Lenguaje: [X]
- Frontend: [framework + meta-framework si aplica]
- Backend: [framework]
- Base de datos: [X]
- ORM: [X]
- Auth: [X]
- Estado: [X]
- Testing: [X]
- Colas: [X o "no necesario"]
- Storage: [X o "no necesario"]
- Docs: [X]

Hay algo que quieras cambiar antes de pasar a detalles de implementacion?
```

---

## FASE 4 — Implementacion Detallada (Context7 OBLIGATORIO)

**Objetivo**: Definir las herramientas y convenciones de implementacion fina.

### Decisiones a resolver

| Area | Ejemplos |
|------|----------|
| Libreria de UI | shadcn/ui, Radix, MUI, Ant Design, Chakra, Mantine |
| Animaciones | Framer Motion, GSAP, CSS animations, Lottie |
| Validacion de formularios | Zod, Yup, Valibot, io-ts |
| Seguridad | Helmet, CORS config, rate limiting, CSP, CSRF |
| Manejo de errores | Error boundaries, Sentry, custom error handler |
| Logging | Pino, Winston, console structured logging |
| Observabilidad | OpenTelemetry, Datadog, New Relic, Grafana |
| Internacionalizacion | i18next, FormatJS/react-intl, Paraglide |
| Permisos / roles | CASL, casbin, custom RBAC, ABAC |
| Cache | Redis, in-memory LRU, TanStack Query cache, SWR |
| Rate limiting | express-rate-limit, upstash/ratelimit, nginx |
| Linters / formatters | ESLint, Prettier, Biome, oxlint |
| CI/CD | GitHub Actions, GitLab CI, CircleCI, Vercel |
| Convenciones de carpetas | Feature-based, screaming architecture, modular |
| Git conventions | Conventional commits, Commitlint, Husky |

### Reglas de esta fase

- No preguntar TODO — adaptar segun el tipo de proyecto y decisiones previas
- Si es MVP, reducir a lo esencial: UI + validacion + linter + CI basico
- Si es escalable, cubrir observabilidad, seguridad, i18n, permisos
- Si el frontend elegido tiene ecosistema fuerte (ej: Next.js), proponer integraciones nativas
- Cada recomendacion de Context7 debe explicar POR QUE conviene y CUANDO NO conviene

### Preferencias de calidad

Preguntar sobre:
- Cobertura de tests minima esperada
- Estandares de DX (developer experience)
- Escalabilidad futura vs. velocidad de entrega
- Mantenibilidad a largo plazo

### Ronda 7-10: Preguntas de implementacion

Usar preguntas del banco: [references/question-bank.md](references/question-bank.md) — Bloque 4.

Adaptar segun clasificacion:
- MVP: 1-2 rondas (UI + validacion + linter + CI)
- Producto interno: 2-3 rondas
- Producto escalable: 3-4 rondas

---

## FASE 5 — Generacion del Documento de Decisiones

**Objetivo**: Consolidar todas las decisiones en un documento estructurado.

Usar el template definido en [references/output-template.md](references/output-template.md).

### Contenido del documento

1. **Resumen ejecutivo** — que es el proyecto en 2-3 oraciones
2. **Decisiones tecnicas** — tabla completa de cada decision con justificacion
3. **Arquitectura elegida** — diagrama textual + justificacion
4. **Stack completo** — lista categorizada con version recomendada
5. **Librerias y herramientas** — con justificacion breve de cada una
6. **Estructura del proyecto** — arbol de carpetas propuesto
7. **Modulos o apps iniciales** — que se crea en el bootstrap
8. **Decisiones de seguridad, testing y despliegue** — resumen
9. **Riesgos tecnicos detectados** — con mitigacion propuesta
10. **Proximos pasos** — que hacer despues del bootstrap

### Presentacion al usuario

```
Genere el documento de decisiones tecnicas del proyecto.
Revisalo y decime si hay algo que quieras ajustar antes de pasar al bootstrap.

Queres que lo guarde como archivo?
```

### Persistencia

1. Crear directorio `docs/tech-decisions/` si no existe
2. Nombre de archivo: `YYYY-MM-DD-<nombre-proyecto-kebab>.md`
3. Escribir el archivo
4. Confirmar:

```
Documento guardado: docs/tech-decisions/YYYY-MM-DD-nombre-del-proyecto.md
```

---

## FASE 6 — Bootstrap / Inicializacion del Proyecto

**Objetivo**: Generar la estructura inicial del proyecto segun las decisiones tomadas.

### Reglas del bootstrap

1. **RESPETAR las decisiones** — no usar plantillas genericas, construir segun lo decidido
2. **Preguntar antes de ejecutar** — mostrar el plan de bootstrap y pedir confirmacion
3. **Ser incremental** — crear estructura, luego configs, luego dependencias
4. **No sobrecargar** — solo lo necesario para arrancar, no generar codigo de negocio

### Plan de bootstrap (mostrar antes de ejecutar)

```
Plan de inicializacion:

1. Estructura de carpetas:
   [arbol propuesto]

2. Archivos de configuracion:
   [lista de configs a crear]

3. Dependencias a instalar:
   [lista categorizada: produccion | desarrollo | testing]

4. Setup de herramientas:
   [lista de setups: linter, formatter, git hooks, CI, etc.]

Confirmas que ejecute este plan?
```

### Que genera el bootstrap

| Elemento | Descripcion |
|----------|-------------|
| Carpetas | Estructura segun arquitectura y convenciones elegidas |
| package.json / manifiestos | Con dependencias decididas y scripts basicos |
| tsconfig / jsconfig | Segun lenguaje y framework |
| .eslintrc / biome.json | Segun linter elegido |
| .prettierrc | Si aplica |
| .gitignore | Adaptado al stack |
| .env.example | Variables de entorno necesarias |
| docker-compose.yml | Si el despliegue incluye Docker |
| CI/CD config | Segun plataforma elegida (.github/workflows, etc.) |
| README.md | Con instrucciones de setup basicas |
| Estructura de modulos | Carpetas iniciales segun convenciones (features, modules, etc.) |

### Que NO genera el bootstrap

- Codigo de negocio (controladores, servicios, componentes de UI)
- Migraciones de base de datos
- Tests (solo la estructura para ellos)
- Documentacion extensa (solo README basico)

### Despues del bootstrap

```
Proyecto inicializado correctamente.

Estructura creada en: [ruta]
Dependencias instaladas: [si/no]

Proximos pasos recomendados:
1. [paso 1]
2. [paso 2]
3. [paso 3]

Necesitas algo mas?
```

---

## Metodo de interaccion

### Principios

- **Preguntas ordenadas** — bloques tematicos, no avalancha
- **Maximo 4 preguntas por ronda** — siempre con `question` tool
- **Adaptativo** — las preguntas se adaptan a respuestas anteriores
- **Sin redundancia** — si una decision implica otras, aprovechar
- **Advertencias proactivas** — detectar inconsistencias y combinaciones riesgosas
- **Actitud de arquitecto** — guiar con criterio, no solo preguntar

### Flujo de advertencia de inconsistencias

Si se detecta una combinacion riesgosa:

```
Atencion: elegiste [X] para [area] y [Y] para [area].
Esto puede generar [problema especifico] porque [razon tecnica].

Alternativas:
1. Cambiar [X] por [A] — [trade-off]
2. Cambiar [Y] por [B] — [trade-off]
3. Mantener la combinacion actual asumiendo [riesgo]

Que preferis?
```

### Atajos para proyectos simples

Si el usuario dice algo como "quiero un proyecto simple con React y Node":
- Preguntar solo las decisiones que no se pueden inferir
- Proponer defaults sensatos para el resto
- Mostrar los defaults y preguntar si esta de acuerdo

```
Para un proyecto [tipo] con [stack mencionado], te propongo estos defaults:
- [default 1]: [razon]
- [default 2]: [razon]
- [default 3]: [razon]

Estas de acuerdo o queres cambiar algo?
```

---

## Comandos

```bash
# Activar el skill
/project-starter "descripcion corta del proyecto"

# Ejemplos
/project-starter "SaaS de gestion de inventario para PyMEs"
/project-starter "API REST para sistema de reservas de hotel"
/project-starter "aplicacion mobile-first para delivery de comida"
/project-starter "herramienta CLI para automatizar deploys"
```

---

## Recursos

- **Banco de preguntas**: Ver [references/question-bank.md](references/question-bank.md) para las preguntas por fase
- **Template de output**: Ver [references/output-template.md](references/output-template.md) para el documento final
- **Integracion Context7**: Ver [references/context7-integration.md](references/context7-integration.md) para el protocolo de uso
