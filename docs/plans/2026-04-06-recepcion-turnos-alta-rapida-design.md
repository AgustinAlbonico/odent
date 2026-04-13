# Diseño — Agenda operativa para recepción con alta rápida de paciente

> **Fecha**: 2026-04-06
> **Estado**: aprobado
> **Alcance**: `appointments/calendar` para recepción/admin

## 1. Objetivo

Permitir que recepción saque un turno para un paciente con un profesional desde la grilla semanal del calendario. Si la persona todavía no existe como paciente, el flujo debe permitir un alta rápida sin salir de la agenda.

## 2. Restricciones del sistema actual

- El dominio de agenda trabaja con `patients`, no con una entidad genérica `cliente`.
- La grilla semanal de recepción (`ReceptionistWeeklyGrid`) hoy funciona como vista de resumen multi-profesional y no representa disponibilidad operativa por profesional.
- La grilla del profesional (`WeeklyGrid`) ya resuelve selección de slots, reserva, bloqueos y recarga de agenda.
- El backend ya expone `POST /appointments` y `POST /admin/patients`.
- El alta de paciente ya permite creación mínima con `firstName` y `lastName` obligatorios.

## 3. Decisión

Se adopta un flujo de dos modos para recepción/admin:

1. **Modo resumen**: mantener la vista semanal multi-profesional actual para lectura general.
2. **Modo operativo por profesional**: cuando recepción selecciona un profesional, la vista cambia a la grilla operativa existente (`WeeklyGrid`) para ese profesional.

Esta decisión evita forzar reservas sobre una grilla que no representa disponibilidad real por profesional y maximiza la reutilización del comportamiento ya probado en la agenda del profesional.

## 4. UX propuesta

### 4.1 Calendario de recepción

- Se agrega un selector de profesional visible para recepción/admin en `appointments/calendar`.
- Sin profesional seleccionado, se muestra la grilla semanal multi-profesional actual.
- Con profesional seleccionado, se muestra la grilla operativa semanal del profesional elegido.
- Debe existir una forma clara de volver al modo resumen limpiando el filtro.

### 4.2 Reserva de turno

- En modo operativo, recepción puede seleccionar slots libres contiguos y abrir el modal de reserva existente.
- El modal conserva selección de paciente existente y observaciones.
- Se agrega una acción de **alta rápida de paciente** dentro del mismo modal.

### 4.3 Alta rápida de paciente

- Se despliega dentro del modal de reserva, sin navegación a otra pantalla.
- Campos mínimos:
  - `firstName` obligatorio
  - `lastName` obligatorio
  - `phone` opcional
  - `dni` opcional
  - `email` opcional
- Si el alta es exitosa, el paciente nuevo queda seleccionado automáticamente en la reserva.
- Si falla la creación, el slot seleccionado debe conservarse y el usuario puede corregir y reintentar.

## 5. Cambios técnicos

### 5.1 Frontend

- `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
  - cargar profesionales para recepción/admin
  - renderizar selector de profesional
  - decidir entre `ReceptionistWeeklyGrid` y `WeeklyGrid` según selección
- `apps/web/src/components/appointments/calendar/WeeklyGrid.tsx`
  - habilitar alta rápida de paciente dentro del modal de reserva
  - crear paciente y seleccionarlo automáticamente para reservar
- No se requiere rediseñar `ReceptionistWeeklyGrid`; se mantiene como vista resumen.

### 5.2 Backend

- No se requieren endpoints nuevos para este alcance.
- Se reutilizan:
  - `POST /appointments`
  - `GET /appointments/professionals`
  - `GET /appointments/calendar`
  - `POST /api/admin/patients`

## 6. Validaciones y manejo de errores

- La reserva sigue dependiendo de las validaciones de conflictos del backend.
- Si el paciente nuevo se intenta crear con un DNI duplicado, se muestra el error y no se pierde la selección de slots.
- Si la franja deja de estar disponible entre selección y confirmación, el backend rechaza la reserva y el usuario puede reintentar.
- Si recepción no selecciona profesional, no entra en modo operativo y no puede reservar desde la vista resumen.

## 7. Verificación

- Verificar que recepción/admin pueda alternar entre modo resumen y modo operativo.
- Verificar que la selección de profesional renderice la grilla operativa correcta.
- Verificar reserva con paciente existente.
- Verificar alta rápida de paciente y reserva posterior sin salir del modal.
- Verificar manejo de error por DNI duplicado.
- Verificar actualización de documentación en `docs/funcionalidades-implementadas.md`.
