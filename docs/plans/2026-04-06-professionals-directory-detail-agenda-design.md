# Diseño — Directorio de profesionales con ficha completa y agenda embebida

> **Fecha**: 2026-04-06
> **Estado**: aprobado
> **Alcance**: ` /professionals` + ` /professionals/[id]`

## 1. Objetivo

Transformar el módulo actual de profesionales en un directorio real con ficha dedicada por profesional. Desde esa ficha se debe poder consultar información operativa y reservar turnos directamente sobre la agenda del profesional.

## 2. Estado actual

- ` /professionals` ya existe, pero hoy funciona como listado con un modal de mutuales.
- No existe una ficha dedicada del profesional.
- La reserva de turnos ya está resuelta en `WeeklyGrid`.
- La gestión de mutuales por profesional ya existe y puede reutilizarse.
- Los datos base del profesional pueden salir de `getUsers(role=profesional)` y `getUser(id)`.

## 3. Decisión

Se adopta una arquitectura de dos niveles:

1. **Directorio** en ` /professionals` para búsqueda y listado.
2. **Ficha dedicada** en ` /professionals/[id]` para operación y detalle.

Se descarta un modal grande o un master-detail en la misma tabla porque no escala bien para una ficha completa con agenda, mutuales, horarios, excepciones y próximos turnos.

## 4. UX propuesta

### 4.1 Directorio de profesionales

- Lista paginada con búsqueda.
- Cada fila muestra:
  - nombre completo
  - email
  - estado
  - acción principal: `Ver ficha`
- El foco del listado deja de ser “mutuales” y pasa a ser “acceder a la ficha operativa”.

### 4.2 Ficha del profesional

La ficha se organiza en bloques verticales dentro de una pantalla dedicada:

- **Header del profesional**
  - nombre completo
  - email
  - badges de rol/estado
  - metadatos operativos (alta, último acceso)
- **Resumen rápido**
  - estado de cuenta
  - cantidad de mutuales habilitadas
  - próximos turnos
- **Mutuales habilitadas**
  - listado
  - alta/baja desde la misma ficha
- **Horarios de atención**
  - resumen de horarios configurados
- **Excepciones próximas**
  - próximos bloqueos / excepciones
- **Agenda operativa**
  - `WeeklyGrid` embebido fijado al profesional actual
  - reserva de turnos desde la misma ficha
  - alta rápida de paciente dentro del flujo de reserva
- **Próximos turnos**
  - listado breve de los próximos turnos del profesional

## 5. Cambios técnicos

### 5.1 Frontend

- `apps/web/src/app/(dashboard)/professionals/page.tsx`
  - simplificar el módulo para que actúe como directorio
  - reemplazar la acción actual basada en modal por navegación a la ficha
- `apps/web/src/app/(dashboard)/professionals/[id]/page.tsx`
  - nueva ruta para la ficha completa
  - cargar datos del profesional, mutuales, horarios, excepciones y próximos turnos
  - embeber `WeeklyGrid` con el `professionalId` fijo

### 5.2 Reutilización

- Reutilizar `WeeklyGrid` para agenda y reserva.
- Reutilizar APIs existentes:
  - `getUser(id)`
  - `getProfessionalMutuals(id)`
  - `addProfessionalMutual(id, ...)`
  - `removeProfessionalMutual(id, ...)`
  - `getSchedules(id)`
  - `getExceptions(id, dateFrom, dateTo)`
  - `getAppointments({ professionalId, ... })`

### 5.3 Backend

- Para esta iteración no se requieren endpoints nuevos.
- Se tolera componer la ficha desde múltiples requests ya existentes para evitar un cambio backend más grande.

## 6. Reglas funcionales

- La ficha solo aplica a usuarios con rol `profesional`.
- Si se abre un usuario que no es profesional, la pantalla debe informar que no corresponde a una ficha profesional.
- La agenda embebida no debe mostrar selector de profesional porque la ficha ya define el contexto.
- La reserva desde la ficha debe respetar los permisos ya resueltos en `WeeklyGrid`.

## 7. Verificación

- Verificar que ` /professionals` siga listando profesionales y navegue a ` /professionals/[id]`.
- Verificar que la ficha cargue datos base del profesional.
- Verificar que mutuales puedan verse y gestionarse desde la ficha.
- Verificar que horarios y excepciones se muestren con datos del profesional seleccionado.
- Verificar que la agenda embebida permita reservar turnos desde la ficha.
- Verificar que la documentación funcional se actualice.
