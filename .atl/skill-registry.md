# Skill Registry — sistema odontologico

_Generated on 2026-03-30 during SDD init._

## Scope

- Project root: `C:\Users\agust\Desktop\sistema odontologico`
- Persistence mode: `engram`
- Dedupe rule: project-level skills override user-level skills with the same name.
- Skip rule applied: `sdd-*`, `_shared`, and `skill-registry` were excluded from the registry inventory.

## Detected project profile

This repository is currently **documentation-first**. The runtime/product stack is defined in project documents, but the actual application source tree (`apps/`, `packages/`, `infra/`, `.github/workflows/`) has **not been bootstrapped yet**.

### Target stack from project documents

- Architecture: TypeScript monorepo, modular monolith, multi-tenant SaaS
- Monorepo tooling: `pnpm workspaces` + `Turborepo`
- Frontend: `React 19` + `Next.js 16`
- Backend: `NestJS 11`
- Database: `PostgreSQL 17` with tenant isolation by schema
- Data access: `Drizzle ORM` + `Drizzle Kit`
- Validation/contracts: `Zod`
- State/UI: `TanStack Query`, `Zustand`, `Radix UI`, `Framer Motion`
- Testing: `Vitest`, `Testing Library`, `Playwright`
- Quality/DX: `Biome`, `Husky`, `lint-staged`, `Conventional Commits`
- Infra/ops: `Docker` hybrid strategy, `GitHub Actions`, `Pino`, `Sentry`

### Evidence used

- `docs/tech-decisions/2026-03-30-sistema-odontologico.md`
- `docs/roadmap/2026-03-30-roadmap-maestro.md`
- `docs/prd/`
- `AGENTS.md`

## Project conventions and instruction entrypoints

### Root instruction file

- `AGENTS.md`

### Referenced instruction sets from `AGENTS.md`

- `.clavix/instructions/core/clavix-mode.md`
- `.clavix/instructions/core/file-operations.md`
- `.clavix/instructions/core/verification.md`
- `.clavix/instructions/workflows/start.md`
- `.clavix/instructions/workflows/summarize.md`
- `.clavix/instructions/workflows/improve.md`
- `.clavix/instructions/workflows/prd.md`
- `.clavix/instructions/workflows/plan.md`
- `.clavix/instructions/workflows/implement.md`
- `.clavix/instructions/workflows/archive.md`
- `.clavix/instructions/workflows/refine.md`
- `.clavix/instructions/workflows/review.md`
- `.clavix/instructions/workflows/verify.md`
- `.clavix/instructions/troubleshooting/jumped-to-implementation.md`
- `.clavix/instructions/troubleshooting/mode-confusion.md`
- `.clavix/instructions/troubleshooting/skipped-file-creation.md`
- `.clavix/INSTRUCTIONS.md`
- `.clavix/QUICKSTART.md`
- `.opencode/command/clavix-archive.md`
- `.opencode/command/clavix-implement.md`
- `.opencode/command/clavix-improve.md`
- `.opencode/command/clavix-plan.md`
- `.opencode/command/clavix-prd.md`
- `.opencode/command/clavix-refine.md`
- `.opencode/command/clavix-review.md`
- `.opencode/command/clavix-start.md`
- `.opencode/command/clavix-summarize.md`
- `.opencode/command/clavix-verify.md`

### Working conventions inferred from current docs

- The repo is in planning/discovery state, not implementation state.
- Clavix planning/implementation boundaries are explicitly enforced.
- Project documentation under `docs/` is already treated as living source context.
- Conventional commits are part of the intended engineering process.

## Recommended skills for this project

These are the highest-value skills for the stack and current project direction.

| Skill | Why it matters here | Trigger summary | Source |
|---|---|---|---|
| `project-starter` | Existing foundational project bootstrap skill already used to generate decisions | New project setup, stack definition, bootstrap planning | project-level |
| `monorepo-management` | Matches the chosen `pnpm` + `Turborepo` monorepo strategy | Setting up or optimizing monorepos and shared packages | user-level (`.agents`) |
| `nestjs-best-practices` | Aligns with the chosen backend architecture in NestJS | Writing/reviewing NestJS modules, auth, DI, security | user-level (`.agents`) |
| `vercel-react-best-practices` | Strong fit for `Next.js` + `React` implementation quality | React/Next.js pages, data fetching, performance | user-level (`.agents`) |
| `postgresql-expert-best-practices-code-review` | Important because tenancy depends on PostgreSQL schema strategy | Schema design, migrations, indexing, query review | user-level (`.agents`) |
| `docker-expert` | The technical decision doc mandates Docker from day 1 | Dockerfiles, compose, container hardening, deploy setup | user-level (`.agents`) |
| `javascript-testing-patterns` | Target testing stack is Vitest + Testing Library + E2E | Unit/integration test setup and testing workflows | user-level (`.agents`) |
| `playwright-e2e-testing` | Explicitly chosen E2E framework in the stack | Browser E2E automation and critical flows | user-level (`.agents`) |
| `react-doctor` | Useful once `apps/web` exists and React changes land | Post-change React review and diagnostics | user-level (`.config/opencode`) |
| `verification-before-completion` | Good enforcement skill for evidence-based completion | Before claiming fixes/features are done | user-level (`superpowers`) |

## Project-level skills

| Skill | Trigger summary | Path |
|---|---|---|
| `project-starter` | Start a new project, define stack, initialize repository/bootstrap | `.agents/skills/project-starter/` |

## User-level skill inventory

### `C:\Users\agust\.config\opencode\skills`

`branch-pr`, `issue-creation`, `judgment-day`, `skill-creator`, `go-testing`, `feature-shaper`, `react-doctor`, `interactive-task`, `interactive-bug`

### `C:\Users\agust\.agents\skills`

`adapt`, `animate`, `architecture-patterns`, `audit`, `bolder`, `brainstorming`, `clarify`, `code-review-quality`, `colorize`, `conventional-commit`, `critique`, `delight`, `design-taste-frontend`, `distill`, `docker-expert`, `e2e-qa-tester`, `extract`, `find-skills`, `frontend-design`, `full-output-enforcement`, `git-advanced-workflows`, `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils`, `harden`, `high-end-visual-design`, `idea-validator`, `industrial-brutalist-ui`, `javascript-testing-patterns`, `market-researcher`, `minimalist-ui`, `monorepo-management`, `nestjs-best-practices`, `normalize`, `onboard`, `optimize`, `playwright-e2e-testing`, `polish`, `postgresql-expert-best-practices-code-review`, `prd-creator`, `qa`, `quieter`, `redesign-existing-projects`, `sonarqube-quality-gate-playbook`, `startup-ideation`, `stitch-design-taste`, `tailwindcss-advanced-layouts`, `tauri-migration`, `tauri-react-nest-lan-migration`, `teach-impeccable`, `test-coverage-improver`, `typescript-advanced-types`, `ui-cloner`, `ui-cloner-brand-interview`, `ui-cloner-forensic-audit`, `ui-cloner-iterator`, `ui-cloner-quality-check`, `ui-cloner-synthesis`, `ui-ux-polish`, `vercel-react-best-practices`, `vite`

### `C:\Users\agust\.cache\opencode\node_modules\superpowers\skills`

`dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills`

## Resolution notes

- No `openspec/` directory was detected.
- No file-based SDD backend was requested.
- The current repository state supports **Engram-first SDD**, with project context anchored in docs until the monorepo bootstrap happens.
