# Calendar Week Navigation Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que la navegación semanal del calendario profesional sea más entendible para usuarios no técnicos.

**Architecture:** Mantener la navegación semanal, pero cambiar la jerarquía visual para que el rango de fechas sea el protagonista y las acciones sean texto claro en vez de controles ambiguos. El cambio queda acotado al `WeekNav` y su integración en la página del calendario profesional.

**Tech Stack:** Next.js App Router, React, Tailwind v4, Playwright para verificación visual.

---

### Task 1: Rediseñar el bloque de navegación semanal

**Files:**
- Modify: `apps/web/src/components/appointments/calendar/WeekNav.tsx`
- Modify: `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
- Modify: `docs/funcionalidades-implementadas.md`

- [ ] Reemplazar la jerarquía actual por una donde el rango `Semana del DD/MM al DD/MM` sea lo primero que se lee.
- [ ] Cambiar flechas abstractas por acciones más claras o al menos secundarias respecto del rango.
- [ ] Mostrar `Volver a esta semana` solo cuando el usuario no esté en la semana actual.
- [ ] Mantener la navegación `anterior/siguiente` funcionando.
- [ ] Verificar visualmente con Playwright que el control sea más entendible y siga funcionando.
