# Diseño — Dashboard con turnos de hoy por rol

> **Fecha**: 2026-04-06
> **Estado**: aprobado
> **Alcance**: ` /dashboard`

## 1. Objetivo

Convertir el dashboard en un punto operativo para turnos del día. La recepcionista debe ver los turnos de hoy de toda la institución; el profesional debe ver solo sus propios turnos. Desde el dashboard se deben poder ejecutar acciones rápidas básicas: confirmar, cancelar y abrir el detalle del turno.

## 2. Estado actual

- El dashboard actual es un panel genérico de sesión, permisos y wiring técnico.
- No existe hoy un listado operativo de turnos en esa pantalla.
- El detalle de turno ya permite cambiar estado, cancelar y navegar a la información completa.
- El frontend ya dispone de `getAppointments`, `changeAppointmentStatus` y `cancelAppointment`.

## 3. Decisión

Se incorpora dentro del dashboard un bloque operativo llamado **Turnos de hoy**.

- **Recepcionista**: ve todos los turnos del día de la institución.
- **Profesional**: ve solo los turnos del día donde `professionalId = user.id`.

Se descarta por ahora un dashboard completamente distinto por rol porque sería más costoso y no es necesario para esta iteración.

## 4. UX propuesta

### 4.1 Bloque principal

Agregar una card grande en el dashboard con:

- título: `Turnos de hoy`
- descripción contextual según rol
- contador de turnos cargados
- tabla/listado operativo

### 4.2 Columnas por rol

#### Recepcionista

- Hora
- Paciente
- Profesional
- Estado
- Acciones

#### Profesional

- Hora
- Paciente
- Estado
- Acciones

La columna de profesional se omite para el profesional porque sería redundante.

### 4.3 Acciones rápidas

Por fila:

- **Confirmar**
  - visible cuando el estado permita transición razonable a `confirmed`
- **Cancelar**
  - abre una confirmación liviana con motivo obligatorio
- **Ver detalle**
  - navega a ` /appointments/[id]`

## 5. Datos y filtros

La fuente de datos será `getAppointments()` con filtros del día actual.

### Recepcionista

- `dateFrom = hoy`
- `dateTo = hoy`
- sin `professionalId`
- `includeCancelled = false`

### Profesional

- `dateFrom = hoy`
- `dateTo = hoy`
- `professionalId = user.id`
- `includeCancelled = false`

Orden esperado: ascendente por `startAt`.

## 6. Cambios técnicos

### 6.1 Frontend

- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
  - integrar el nuevo bloque operativo
- crear componente dedicado para no inflar el page:
  - `apps/web/src/components/dashboard/DashboardTodayAppointmentsCard.tsx`

### 6.2 Reutilización de lógica existente

- `getAppointments()` para cargar turnos del día
- `changeAppointmentStatus()` para confirmar
- `cancelAppointment()` para cancelación con motivo
- navegación a ` /appointments/[id]` para detalle completo

## 7. Estados de UI

- **Loading**: skeleton o placeholder estructural
- **Error**: mensaje claro + retry
- **Empty**: `No hay turnos para hoy`
- **Updating**: deshabilitar acciones mientras se confirma/cancela

## 8. Reglas funcionales

- El profesional solo puede ver sus propios turnos del día.
- La recepcionista puede ver los turnos diarios institucionales.
- Las acciones rápidas respetan los permisos existentes del módulo de turnos.
- No se duplican todas las transiciones del detalle: en esta versión solo `confirmar`, `cancelar` y `ver detalle`.

## 9. Verificación

- Recepcionista ve turnos del día de distintos profesionales.
- Profesional ve solo turnos propios.
- `Confirmar` actualiza estado y refresca la lista.
- `Cancelar` exige motivo y refresca la lista.
- `Ver detalle` navega correctamente.
- Empty state y error state se muestran correctamente.
