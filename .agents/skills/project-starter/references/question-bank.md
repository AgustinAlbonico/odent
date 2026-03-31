# Banco de Preguntas — project-starter

Banco organizado por bloques tematicos alineados a cada fase del skill. El agente selecciona las preguntas relevantes segun la clasificacion del proyecto y las respuestas previas. **Maximo 4 preguntas por ronda.**

Todas las preguntas se hacen con la herramienta `question`. Mezclar preguntas con opciones y abiertas.

---

## Regla de adaptacion (OBLIGATORIA)

Antes de elegir preguntas de cada bloque:

1. Revisar respuestas anteriores — no repetir lo ya respondido
2. Verificar implicaciones — si una decision ya resuelve otra, saltarla
3. Adaptar opciones — las opciones deben reflejar el contexto actual (no mostrar "microservicios" si ya eligio monolito)
4. Detectar inconsistencias — si una respuesta contradice una anterior, advertir antes de seguir

### Filtro rapido por pregunta

Una pregunta entra solo si cumple TODO:

1. No fue respondida directa o indirectamente por el usuario.
2. Su respuesta cambia una decision real del documento final.
3. Es relevante para la clasificacion del proyecto (MVP vs escalable).
4. No es redundante con una decision ya tomada.

Si falla un punto, se descarta.

---

## Bloque 1 — Descubrimiento del Proyecto (FASE 1)

### Ronda 1: Vision y contexto

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 1.1 | Que tipo de producto o sistema queres construir? | Con opciones | Siempre |
| | - Aplicacion web (SaaS, plataforma, dashboard) | | |
| | - API / Backend service | | |
| | - Aplicacion mobile (nativa o hibrida) | | |
| | - Aplicacion desktop | | |
| | - CLI / herramienta de linea de comandos | | |
| | - Combinacion de varios | | |
| 1.2 | En una o dos oraciones, cual es el objetivo principal del producto? Que problema resuelve? | Abierta | Siempre |
| 1.3 | Quien es el usuario principal? | Con opciones | Siempre |
| | - Usuarios finales (clientes, consumidores) | | |
| | - Equipo interno (empleados de tu empresa) | | |
| | - Desarrolladores (API publica, SDK, herramienta dev) | | |
| | - Administradores / operadores | | |
| | - Varios tipos de usuario | | |
| 1.4 | Que nivel de madurez tiene este proyecto? | Con opciones | Siempre |
| | - MVP / prototipo (validar idea rapido) | | |
| | - Producto interno (requerimientos claros, equipo acotado) | | |
| | - Producto productivo / escalable (alta disponibilidad, multi-usuario, crecimiento) | | |
| | - Prueba tecnica / proyecto personal de aprendizaje | | |

### Ronda 2: Contexto adicional (solo si clasificacion >= producto interno)

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 1.5 | Cuantas personas van a usar el sistema inicialmente? | Con opciones | Si no quedo claro |
| | - Solo yo / muy pocas (1-5) | | |
| | - Equipo mediano (5-50) | | |
| | - Muchos usuarios (50-500) | | |
| | - Escala grande (500+) | | |
| 1.6 | Hay restricciones conocidas que debas respetar? | Con opciones | Siempre recomendado |
| | - Tiempo (deadline especifico) | | |
| | - Presupuesto limitado (hosting barato, sin servicios pagos) | | |
| | - Regulaciones o compliance (GDPR, HIPAA, etc.) | | |
| | - Stack obligatorio (la empresa ya usa X tecnologia) | | |
| | - Sin restricciones especiales | | |
| 1.7 | Tenes experiencia previa con algun stack o tecnologia que prefieras usar? | Abierta | Siempre — ayuda a adaptar recomendaciones |
| 1.8 | Cuantos desarrolladores van a trabajar en esto? | Con opciones | Si clasificacion >= producto interno |
| | - Solo yo | | |
| | - Equipo chico (2-4 devs) | | |
| | - Equipo mediano (5-10 devs) | | |
| | - Equipo grande (10+ devs) | | |

---

## Bloque 2 — Arquitectura de Alto Nivel (FASE 2)

### Ronda 3: Estructura y patron

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 2.1 | Como queres organizar el codigo del proyecto? | Con opciones | Siempre |
| | - Monorepo (todo en un solo repositorio) | | |
| | - Multirepo (repositorios separados por servicio/app) | | |
| | - No estoy seguro, recomendame segun el contexto | | |
| 2.2 | Que patron arquitectonico preferis para el backend? | Con opciones | Siempre si hay backend |
| | - Monolito (una sola aplicacion) | | |
| | - Modular monolith (monolito con modulos bien separados) | | |
| | - Microservicios (servicios independientes) | | |
| | - Serverless (funciones individuales) | | |
| | - No estoy seguro, recomendame | | |
| 2.3 | Que superficies va a tener el sistema? (se puede elegir varias) | Con opciones multiples | Siempre |
| | - Frontend web (SPA o SSR) | | |
| | - Backend / API | | |
| | - Aplicacion mobile | | |
| | - Workers / procesos en background | | |
| | - Cron jobs / tareas programadas | | |
| | - Integraciones con servicios externos | | |
| 2.4 | Donde pensas desplegar el proyecto? | Con opciones | Siempre |
| | - Cloud (AWS, GCP, Azure) | | |
| | - VPS (DigitalOcean, Hetzner, Linode) | | |
| | - PaaS (Vercel, Railway, Render, Fly.io) | | |
| | - On-premise / red local (LAN) | | |
| | - Hibrido (combinacion) | | |
| | - Todavia no se, recomendame | | |

### Ronda 4: Escala y tenancy (solo si clasificacion >= producto interno)

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 2.5 | Necesitas que el sistema sea multi-tenant? (varios clientes/organizaciones compartiendo la misma instancia) | Con opciones | Si es SaaS o plataforma |
| | - Si, multi-tenant con datos aislados por organizacion | | |
| | - Si, pero con base de datos separada por tenant | | |
| | - No, es single-tenant (una sola organizacion) | | |
| | - No estoy seguro | | |
| 2.6 | Necesitas escalabilidad horizontal? (agregar mas instancias para manejar mas carga) | Con opciones | Si clasificacion = escalable |
| | - Si, desde el inicio | | |
| | - No ahora, pero quiero que la arquitectura lo permita a futuro | | |
| | - No, la carga va a ser baja/predecible | | |
| 2.7 | Como se van a comunicar las partes del sistema entre si? | Con opciones | Si hay multiples superficies |
| | - REST APIs | | |
| | - GraphQL | | |
| | - gRPC | | |
| | - Message queues / eventos | | |
| | - Combinacion (contame cual) | | |
| | - No estoy seguro, recomendame | | |
| 2.8 | Necesitas soporte offline o funcionalidad sin conexion? | Con opciones | Si hay frontend o mobile |
| | - Si, critico (debe funcionar offline) | | |
| | - Parcial (cache de datos para lectura) | | |
| | - No, siempre conectado | | |

---

## Bloque 3 — Stack Principal (FASE 3)

**IMPORTANTE**: En este bloque, ANTES de presentar opciones al usuario, usar Context7 para obtener informacion actualizada de las librerias candidatas. Ver [references/context7-integration.md](references/context7-integration.md).

### Ronda 5: Lenguaje y frameworks

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 3.1 | Que lenguaje principal queres usar? | Con opciones | Siempre |
| | - TypeScript | | |
| | - JavaScript | | |
| | - Python | | |
| | - Go | | |
| | - Rust | | |
| | - Java / Kotlin | | |
| | - C# / .NET | | |
| | - Otro (especificar) | | |
| 3.2 | Para el frontend, que framework preferis? (opciones adaptadas con Context7) | Con opciones | Si hay frontend |
| | [Opciones generadas dinamicamente segun lenguaje + Context7] | | |
| 3.3 | Para el backend, que framework preferis? (opciones adaptadas con Context7) | Con opciones | Si hay backend |
| | [Opciones generadas dinamicamente segun lenguaje + Context7] | | |
| 3.4 | Necesitas un meta-framework? (SSR, SSG, full-stack) | Con opciones | Si hay frontend web |
| | - Si (Next.js, Nuxt, SvelteKit, Astro, Analog, etc.) | | |
| | - No, SPA pura | | |
| | - No estoy seguro, recomendame | | |

### Ronda 6: Datos y persistencia

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 3.5 | Que base de datos preferis? (opciones adaptadas con Context7) | Con opciones | Siempre si hay persistencia |
| | - PostgreSQL (relacional, feature-rich) | | |
| | - MySQL / MariaDB (relacional, simple) | | |
| | - MongoDB (documento, flexible) | | |
| | - SQLite (embebida, sin servidor) | | |
| | - Supabase (PostgreSQL managed + auth + realtime) | | |
| | - Otro (especificar) | | |
| 3.6 | Que ORM o query builder queres usar? (opciones adaptadas con Context7) | Con opciones | Si hay base de datos |
| | [Opciones generadas segun lenguaje + DB + Context7] | | |
| 3.7 | Necesitas cache? | Con opciones | Si clasificacion >= producto interno |
| | - Si, Redis | | |
| | - Si, in-memory (para empezar) | | |
| | - No por ahora | | |
| | - No estoy seguro, recomendame | | |
| 3.8 | Necesitas sistema de colas o procesamiento en background? | Con opciones | Si hay workers o cron jobs |
| | - Si (BullMQ, RabbitMQ, etc.) | | |
| | - No por ahora, pero quiero que sea facil agregarlo | | |
| | - No, todo es sincrono | | |

### Ronda 7: Auth, estado y testing

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 3.9 | Como queres manejar la autenticacion? (opciones adaptadas con Context7) | Con opciones | Siempre si hay usuarios |
| | - Servicio externo (Clerk, Auth0, Supabase Auth) | | |
| | - Libreria (Auth.js/NextAuth, Passport.js) | | |
| | - Custom (JWT propio, session-based) | | |
| | - Sin autenticacion (API publica o herramienta local) | | |
| | - No estoy seguro, recomendame | | |
| 3.10 | Para el manejo de estado en frontend, que preferis? (opciones adaptadas con Context7) | Con opciones | Si hay frontend |
| | [Opciones generadas segun framework frontend + Context7] | | |
| 3.11 | Que estrategia de testing queres seguir? | Con opciones | Siempre |
| | - Testing completo (unit + integration + e2e) | | |
| | - Unit + integration (sin e2e por ahora) | | |
| | - Solo unit tests | | |
| | - Minimal (solo tests criticos) | | |
| | - No estoy seguro, recomendame segun el tipo de proyecto | | |
| 3.12 | Que herramientas de testing preferis? (opciones adaptadas con Context7) | Con opciones | Siempre |
| | [Opciones generadas segun lenguaje + framework + Context7] | | |

---

## Bloque 4 — Implementacion Detallada (FASE 4)

**IMPORTANTE**: Adaptar la cantidad de preguntas de este bloque segun la clasificacion:
- MVP: Solo Ronda 8 (esenciales)
- Producto interno: Rondas 8-9
- Producto escalable: Rondas 8-10

### Ronda 8: UI y DX (esenciales)

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 4.1 | Que libreria de componentes de UI queres usar? (opciones adaptadas con Context7) | Con opciones | Si hay frontend |
| | [Opciones generadas segun framework + Context7] | | |
| 4.2 | Que herramienta de validacion de formularios preferis? (opciones con Context7) | Con opciones | Si hay formularios |
| | [Opciones generadas segun framework + Context7] | | |
| 4.3 | Que linter/formatter queres usar? | Con opciones | Siempre |
| | - ESLint + Prettier (clasico, ecosistema enorme) | | |
| | - Biome (todo en uno, rapido, menos config) | | |
| | - ESLint + oxlint (rapido, compatible) | | |
| | - Solo ESLint (sin formatter dedicado) | | |
| | - Otro (especificar) | | |
| 4.4 | Que plataforma de CI/CD queres usar? | Con opciones | Siempre |
| | - GitHub Actions | | |
| | - GitLab CI | | |
| | - Vercel (auto-deploy) | | |
| | - Otro (especificar) | | |
| | - Todavia no, despues lo defino | | |

### Ronda 9: Seguridad y calidad (producto interno y escalable)

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 4.5 | Que nivel de seguridad necesitas? | Con opciones | Si clasificacion >= producto interno |
| | - Basico (CORS, helmet, validacion de input) | | |
| | - Medio (+ rate limiting, CSP, CSRF protection) | | |
| | - Alto (+ WAF, audit logging, penetration testing, compliance) | | |
| | - No estoy seguro, recomendame segun el tipo de proyecto | | |
| 4.6 | Como queres manejar los permisos y roles? | Con opciones | Si hay autenticacion |
| | - RBAC simple (roles fijos: admin, user, viewer) | | |
| | - RBAC dinamico (roles configurables) | | |
| | - ABAC (permisos basados en atributos) | | |
| | - Sin sistema de permisos (todos pueden hacer todo) | | |
| | - No estoy seguro, recomendame | | |
| 4.7 | Que cobertura de tests minima esperas? | Con opciones | Si clasificacion >= producto interno |
| | - >80% (alta calidad, CI bloquea si baja) | | |
| | - >60% (buena cobertura, flexible) | | |
| | - Sin minimo fijo, pero quiero tests en los flujos criticos | | |
| | - No me preocupa la cobertura por ahora | | |
| 4.8 | Como queres manejar los errores y el logging? | Con opciones | Siempre |
| | - Logging estructurado (Pino, Winston) + servicio de errores (Sentry) | | |
| | - Solo logging estructurado | | |
| | - Console.log basico (para empezar) | | |
| | - No estoy seguro, recomendame | | |

### Ronda 10: Observabilidad y convenciones (producto escalable)

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| 4.9 | Necesitas observabilidad? (metricas, tracing, dashboards) | Con opciones | Si clasificacion = escalable |
| | - Si, completa (OpenTelemetry, Grafana, Prometheus) | | |
| | - Si, basica (metricas de aplicacion + health checks) | | |
| | - No por ahora, pero quiero que sea facil agregarlo | | |
| | - No | | |
| 4.10 | Necesitas internacionalizacion (i18n)? | Con opciones | Si hay frontend y clasificacion >= producto interno |
| | - Si, desde el inicio (multi-idioma) | | |
| | - No ahora, pero quiero que la estructura lo permita | | |
| | - No, solo un idioma | | |
| 4.11 | Que convencion de carpetas preferis? | Con opciones | Siempre |
| | - Feature-based (carpeta por feature con todo adentro) | | |
| | - Screaming architecture (carpeta por dominio/bounded context) | | |
| | - Modular (modulos con estructura interna estandar) | | |
| | - Clasica (components/, services/, utils/, etc.) | | |
| | - No estoy seguro, recomendame segun la arquitectura elegida | | |
| 4.12 | Que convenciones de Git queres seguir? | Con opciones | Siempre |
| | - Conventional Commits + Commitlint + Husky | | |
| | - Conventional Commits (sin enforcement automatico) | | |
| | - Formato libre | | |
| | - No estoy seguro, recomendame | | |

---

## Bloque 5 — Preguntas de atajo (proyecto simple)

Si el usuario da suficiente contexto en su mensaje inicial (ej: "quiero un proyecto con React y NestJS para un e-commerce"), usar este bloque reducido:

| # | Pregunta | Tipo | Cuando usar |
|---|----------|------|-------------|
| S.1 | Entiendo que queres [resumen]. Te propongo estos defaults: [lista]. Estas de acuerdo o queres cambiar algo? | Con opciones | Cuando hay suficiente contexto |
| | - De acuerdo, sigamos con esos defaults | | |
| | - Quiero cambiar algunas cosas | | |
| | - Quiero revisar cada decision | | |
| S.2 | De estos defaults, que queres ajustar? | Abierta | Si elige "cambiar algunas cosas" |
| S.3 | Hay algo que te preocupe o que sea critico para este proyecto? | Abierta | Siempre como cierre rapido |

---

## Guia de seleccion por clasificacion

### MVP / Prototipo (8-12 preguntas, 3-4 rondas)
- **Ronda 1**: 3-4 de Bloque 1 (vision)
- **Ronda 2**: 2-3 de Bloque 2 (arquitectura, proponer defaults)
- **Ronda 3**: 3-4 de Bloque 3 (stack esencial)
- **Ronda 4**: 2-3 de Bloque 4 Ronda 8 (UI + linter + CI)

### Producto Interno (12-18 preguntas, 5-7 rondas)
- **Rondas 1-2**: Bloque 1 completo
- **Rondas 3-4**: Bloque 2 completo
- **Rondas 5-6**: Bloque 3 completo
- **Rondas 7-8**: Bloque 4 Rondas 8-9

### Producto Escalable (18-28 preguntas, 7-10 rondas)
- **Rondas 1-2**: Bloque 1 completo
- **Rondas 3-4**: Bloque 2 completo
- **Rondas 5-7**: Bloque 3 completo
- **Rondas 8-10**: Bloque 4 completo

---

## Anti-patrones

| Evitar | Mejor |
|--------|-------|
| "Que framework queres?" sin opciones | "Para tu caso (SaaS con TypeScript), estas son las opciones mas populares segun Context7: [lista con trade-offs]" |
| Preguntar sobre Docker si es un MVP simple | Saltar — proponer solo si el despliegue lo requiere |
| Preguntar sobre microservicios para un proyecto personal | Advertir que es overkill y proponer monolito o modular monolith |
| Preguntar i18n para una herramienta CLI interna | Saltar — no es relevante |
| Mostrar 10 opciones de ORM sin contexto | Filtrar a 2-3 segun lenguaje y DB elegidos, con Context7 |
