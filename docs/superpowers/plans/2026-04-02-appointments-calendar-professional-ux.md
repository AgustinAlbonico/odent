# Appointments Calendar Professional UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arreglar el calendario de turnos para que funcione correctamente para profesionales y mejorar su UX/UI con señales visuales claras para usuarios poco técnicos.

**Architecture:** Mantener la arquitectura actual de `page -> header/filters/view`, pero separar el comportamiento por rol para que el profesional trabaje en modo “mi agenda” sin filtros innecesarios. La vista del calendario debe montar FullCalendar siempre y superponer estados de carga/empty state/legend en vez de reemplazar el componente completo.

**Tech Stack:** Next.js App Router, React 19, FullCalendar, Tailwind v4, Lucide React, API client `appointments-api.ts`, Playwright para verificación manual.

---

### Task 1: Corregir flujo funcional del calendario para rol profesional

**Files:**
- Modify: `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarFilters.tsx`
- Modify: `apps/web/src/lib/appointments-api.ts` (solo si todavía hay rutas/contratos mal alineados)

- [ ] Detectar el rol autenticado con `useAuth()` en `calendar/page.tsx` y derivar `isProfessional` + `effectiveProfessionalId`.
- [ ] Si el usuario es profesional, auto-seleccionar `user.id` y NO permitir cambiar profesional desde la UI.
- [ ] Evitar que `CalendarFilters` llame `getProfessionals()` cuando el rol es profesional.
- [ ] Si el usuario es profesional, ocultar completamente el filtro “Profesional”.
- [ ] Mantener el filtro de profesional solo para admin/asistente.
- [ ] Confirmar que la pantalla no haga requests a `/api/professionals` en modo profesional.

### Task 2: Arreglar el loading infinito y el fetch de eventos

**Files:**
- Modify: `apps/web/src/components/appointments/calendar/CalendarView.tsx`

- [ ] Eliminar el patrón que devuelve skeleton en vez de montar FullCalendar cuando `loading && events.length === 0`.
- [ ] Montar `FullCalendar` siempre para que `datesSet` pueda disparar `fetchEvents()`.
- [ ] Reemplazar el loading actual por un overlay liviano o una capa superior no bloqueante.
- [ ] Asegurar que `fetchEvents(start, end)` corra al entrar por primera vez al calendario.
- [ ] Agregar un empty state explícito cuando no haya eventos en el período.
- [ ] Verificar que aparezca al menos una request a `/api/appointments/calendar` al abrir la pantalla.

### Task 3: Mejorar comprensión visual para usuarios no técnicos

**Files:**
- Modify: `apps/web/src/components/appointments/calendar/CalendarHeader.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarFilters.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarView.tsx`
- Optionally create: `apps/web/src/components/appointments/calendar/CalendarLegend.tsx`
- Optionally create: `apps/web/src/components/appointments/calendar/CalendarSummary.tsx`

- [ ] Reemplazar labels ambiguos por copy más humano y operativo.
- [ ] Cambiar “24h” por una etiqueta más entendible (por ejemplo “Día completo”).
- [ ] Agregar una leyenda visible con color + ícono + texto para estados de turno.
- [ ] Usar los colores semánticos del design system (`warning`, `success`, `primary`, `destructive`, `muted`) en los estados.
- [ ] Agregar un resumen superior simple y escaneable (ej. total del día/semana por estado) si los datos disponibles lo permiten sin sobrecomplicar la UI.
- [ ] Mostrar un empty state pedagógico con icono, mensaje simple y siguientes pasos cuando no haya turnos.

### Task 4: Mejorar responsive/mobile del calendario

**Files:**
- Modify: `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarHeader.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarFilters.tsx`
- Modify: `apps/web/src/components/appointments/calendar/CalendarView.tsx`

- [ ] Asegurar que en mobile el contenido principal no quede tapado por la navegación lateral.
- [ ] Hacer que header, filtros y selector de vistas se apilen correctamente en pantallas angostas.
- [ ] Verificar tamaños táctiles mínimos y espacios cómodos.
- [ ] Si FullCalendar en mobile resulta muy denso, priorizar una vista de día/agenda legible antes que una grilla comprimida.
- [ ] Evitar scroll horizontal roto o doble scroll confuso.

### Task 5: Actualizar inventario y verificar manualmente

**Files:**
- Modify: `docs/funcionalidades-implementadas.md`

- [ ] Registrar los cambios del calendario en el inventario funcional.
- [ ] Verificar con Playwright en desktop usando `profesional@demo.com` / `Profesional123!`.
- [ ] Verificar con Playwright en mobile que el layout no quede roto.
- [ ] Confirmar que el profesional no vea selector de profesional y que el calendario cargue datos reales o empty state correcto.
- [ ] Confirmar ausencia de requests 404 relacionadas al flujo profesional del calendario.
