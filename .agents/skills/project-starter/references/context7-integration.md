# Integracion Context7 — project-starter

Protocolo obligatorio para usar Context7 MCP durante las fases 3 y 4 del skill.

---

## Cuando usar Context7

| Fase | Uso | Obligatorio |
|------|-----|-------------|
| FASE 1 (Descubrimiento) | NO usar | No |
| FASE 2 (Arquitectura) | Opcional — solo si el usuario pide comparar herramientas de monorepo (Nx vs Turborepo) | No |
| FASE 3 (Stack Principal) | OBLIGATORIO — para cada area de decision | Si |
| FASE 4 (Implementacion) | OBLIGATORIO — para cada libreria recomendada | Si |
| FASE 5 (Documento) | Para verificar versiones actuales | Si |
| FASE 6 (Bootstrap) | Para obtener comandos de instalacion correctos | Si |

---

## Protocolo de uso

### Paso 1: Resolver ID de libreria

Antes de recomendar cualquier herramienta, resolver su ID en Context7:

```
context7_resolve-library-id(
  libraryName: "nombre de la libreria",
  query: "descripcion de lo que necesitas"
)
```

**Ejemplo**:
```
context7_resolve-library-id(
  libraryName: "Prisma",
  query: "ORM for TypeScript with PostgreSQL support"
)
```

### Paso 2: Consultar documentacion

Con el ID resuelto, obtener informacion actualizada:

```
context7_query-docs(
  libraryId: "/prisma/docs",
  query: "getting started setup configuration"
)
```

### Paso 3: Presentar al usuario

Presentar la informacion como sugerencia guiada, NO como imposicion:

```
Para [area], estas son las opciones que encontre actualizadas:

1. **[Libreria A]** (v[version])
   - Ventaja: [principal beneficio]
   - Desventaja: [principal limitacion]
   - Ideal para: [escenario]
   - No conviene si: [anti-patron]

2. **[Libreria B]** (v[version])
   - Ventaja: [principal beneficio]
   - Desventaja: [principal limitacion]
   - Ideal para: [escenario]
   - No conviene si: [anti-patron]

Dado tu contexto ([resumen de decisiones previas]), yo te recomendaria [X] porque [razon].
Pero [Y] tambien es buena opcion si [condicion].
```

---

## Queries recomendados por area

### Frameworks Frontend

| Libreria | Query sugerido |
|----------|---------------|
| React | "React setup, features, and ecosystem overview" |
| Next.js | "Next.js app router setup and features" |
| Angular | "Angular standalone components and signals" |
| Vue | "Vue 3 composition API setup" |
| Svelte | "SvelteKit setup and features" |
| Solid | "SolidJS setup and reactivity" |

### Frameworks Backend

| Libreria | Query sugerido |
|----------|---------------|
| NestJS | "NestJS setup modules controllers services" |
| Express | "Express setup middleware routing" |
| Fastify | "Fastify setup plugins and performance" |
| Hono | "Hono setup routing and middleware" |
| Django | "Django setup models views" |
| FastAPI | "FastAPI setup routes and async" |

### ORMs y Query Builders

| Libreria | Query sugerido |
|----------|---------------|
| Prisma | "Prisma setup schema migrations queries" |
| Drizzle | "Drizzle ORM setup schema queries" |
| TypeORM | "TypeORM setup entities repositories" |
| Knex | "Knex setup migrations query builder" |

### Autenticacion

| Libreria | Query sugerido |
|----------|---------------|
| Auth.js | "Auth.js NextAuth setup providers sessions" |
| Clerk | "Clerk setup authentication React" |
| Supabase Auth | "Supabase auth setup email password OAuth" |
| Passport.js | "Passport.js strategies setup JWT" |

### UI Components

| Libreria | Query sugerido |
|----------|---------------|
| shadcn/ui | "shadcn ui setup components theming" |
| Radix UI | "Radix UI primitives setup accessibility" |
| MUI | "Material UI setup theming components" |
| Mantine | "Mantine setup components hooks" |

### Testing

| Libreria | Query sugerido |
|----------|---------------|
| Vitest | "Vitest setup configuration mocking" |
| Jest | "Jest setup configuration TypeScript" |
| Playwright | "Playwright setup e2e testing configuration" |
| Testing Library | "Testing Library React setup queries" |

### Validacion

| Libreria | Query sugerido |
|----------|---------------|
| Zod | "Zod schema validation TypeScript" |
| Valibot | "Valibot validation setup" |

### Estado

| Libreria | Query sugerido |
|----------|---------------|
| Zustand | "Zustand store setup middleware" |
| TanStack Query | "TanStack Query setup queries mutations cache" |
| Jotai | "Jotai atoms setup derived state" |
| Redux Toolkit | "Redux Toolkit setup slices async thunks" |

---

## Reglas de Context7

### HACER

1. **Siempre resolver el ID primero** — no adivinar el libraryId
2. **Consultar antes de recomendar** — no recomendar de memoria si Context7 esta disponible
3. **Incluir version actual** — la gente necesita saber que version instalar
4. **Comparar opciones compatibles** — no comparar un ORM de Python con uno de TypeScript
5. **Adaptar al contexto** — si ya eligio React, no sugerir opciones de Vue

### NO HACER

1. **No bombardear con 10 opciones** — filtrar a 2-3 opciones relevantes segun contexto
2. **No imponer** — siempre presentar como sugerencia con trade-offs
3. **No consultar Context7 para decisiones triviales** — si la unica opcion razonable es X, no hace falta validar
4. **No hacer mas de 3 llamadas a Context7 por area** — si no encontras en 3 intentos, usar conocimiento general
5. **No bloquear el flujo** — si Context7 falla o no devuelve resultados utiles, continuar con conocimiento general y avisar

### Manejo de fallos

Si Context7 no devuelve resultados utiles:

```
No encontre informacion actualizada en Context7 para [libreria].
Basandome en mi conocimiento general:
[recomendacion con disclaimer de que puede no estar 100% actualizada]

Te recomiendo verificar la documentacion oficial antes de instalar.
```

---

## Ejemplo completo de flujo

### Escenario: Usuario eligio TypeScript + React + PostgreSQL, necesita ORM

1. **Resolver candidatos**:
```
context7_resolve-library-id(libraryName: "Prisma", query: "TypeScript ORM for PostgreSQL")
context7_resolve-library-id(libraryName: "Drizzle", query: "TypeScript ORM for PostgreSQL")
```

2. **Consultar docs**:
```
context7_query-docs(libraryId: "/prisma/docs", query: "setup PostgreSQL schema migrations")
context7_query-docs(libraryId: "/drizzle-team/drizzle-orm", query: "setup PostgreSQL schema migrations")
```

3. **Presentar al usuario** (con `question` tool):
```
Para ORM con TypeScript + PostgreSQL, estas son las mejores opciones:

1. Prisma (v6.x)
   - Ventaja: Schema declarativo, migraciones automaticas, excelente DX
   - Desventaja: Genera query engine binario, puede ser lento en cold starts
   - Ideal para: Proyectos que priorizan DX y productividad
   - No conviene si: Necesitas queries SQL complejos sin escape hatch

2. Drizzle (v0.38+)
   - Ventaja: Type-safe, ligero, SQL-like syntax, sin runtime overhead
   - Desventaja: Ecosistema mas chico, API menos estable (pre-1.0)
   - Ideal para: Proyectos que priorizan performance y control sobre SQL
   - No conviene si: Queres abstraerte completamente de SQL

Dado que es un [tipo de proyecto] con [contexto], yo te recomendaria [X].
```
