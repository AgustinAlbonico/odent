# Diseño técnico — Calendario semanal visual para profesionales

> **Fecha**: 2026-04-02  
> **Estado**: diseño propuesto, pendiente de revisión final del usuario  
> **Ámbito**: `apps/web/src/app/(dashboard)/appointments/calendar` y componentes asociados  
> **Nota**: este diseño reemplaza la propuesta previa de agenda diaria estricta para profesionales.

---

## 1. Objetivo

Transformar la pantalla de calendario del profesional en una **grilla semanal visual operativa**, donde pueda ver de un vistazo:

- cuándo atiende
- qué horarios están libres
- qué horarios ya están reservados
- qué turnos fueron cancelados
- y desde la misma grilla poder:
  - reservar uno o varios horarios consecutivos
  - bloquear/cancelar disponibilidad libre con motivo
  - abrir el detalle de un turno ya reservado

La pantalla debe priorizar la comprensión visual y el uso rápido, evitando ruido administrativo innecesario.

---

## 2. Alcance por rol

### Profesional

Para el rol `profesional`:

- la pestaña **Excepciones** desaparece
- el calendario pasa a ser la superficie principal de trabajo
- no se muestra selector de profesional
- la agenda siempre queda restringida al propio profesional autenticado

### Otros roles

En esta iteración, el retiro de la pestaña **Excepciones** aplica **solo al profesional**. Los otros roles conservan su comportamiento actual hasta definir un rediseño específico.

---

## 3. Estructura general de la pantalla

La pantalla del profesional debe quedar organizada así:

1. **cabecera compacta de semana**
2. **resumen pequeño del día seleccionado**
3. **grilla semanal visual**
4. **acciones contextuales de selección** (solo si hay slots libres seleccionados)
5. **referencias rápidas compactas**

### Se elimina de la parte superior

- el bloque grande tipo hero de “Calendario de turnos”
- el bloque “Ajustes de agenda”
- la lógica de vistas “Mes / Semana / Día / Día completo”

La pantalla debe mostrar contenido útil desde el primer pantallazo.

---

## 4. Navegación temporal

La vista principal es semanal.

### Comportamiento

- al entrar, abre en la **semana actual**
- el día seleccionado por defecto es **hoy**
- debe permitir navegar a:
  - semana anterior
  - semana actual
  - semana siguiente

### Controles mínimos

- botón semana anterior
- botón hoy
- botón semana siguiente
- rótulo visible del rango semanal

---

## 5. Resumen del día seleccionado

Arriba de la grilla se muestra un bloque pequeño con resumen del día actualmente seleccionado.

### Contenido

- fecha seleccionada en formato humano
- cantidad total de turnos del día
- resumen por estado:
  - pendiente
  - confirmado
  - en espera
  - atendido
  - cancelado
  - ausente

### Regla de actualización

El resumen cambia cuando el usuario:

- hace click en un encabezado de día
- hace click en un slot de ese día
- cambia de semana

Debe ser compacto y fácil de escanear, no un bloque protagonista enorme.

---

## 6. Grilla semanal visual

### Estructura

- columnas: días de la semana visible
- filas: franjas horarias desde `00:00` hasta `23:59`

### Resolución de la grilla

La grilla debe dibujarse usando la **menor duración configurada** entre los horarios activos del profesional en la semana visible.

#### Razón

Esto permite:

- representar días con distintas duraciones configuradas
- mantener una grilla uniforme
- seguir respetando la lógica real de selección y validación de bloques

### Regla operativa

Aunque la grilla se dibuje con la menor duración, las acciones de selección, reserva y bloqueo deben respetar los bloques reales del horario configurado del profesional.

---

## 7. Estados visuales de cada slot

Cada celda de la grilla debe representar uno de estos estados:

### 7.1 Fuera de atención

- color: **gris**
- significado: el profesional no atiende en ese horario
- interacción: no clickeable

### 7.2 Libre dentro del horario de atención

- color: **blanco**
- significado: horario disponible para reservar
- interacción: clickeable y seleccionable

### 7.3 Seleccionado

- color: acento del sistema / estado activo
- significado: slot libre actualmente seleccionado por el usuario
- interacción: clickeable para deseleccionar

### 7.4 Reservado

- color: color operativo distinto al libre
- significado: ya existe un turno activo en ese horario
- interacción: clic abre detalle del turno

### 7.5 Cancelado

- color: **rojo suave**
- significado: el turno existía pero fue cancelado
- interacción: clic abre detalle del turno cancelado

---

## 8. Selección múltiple de slots libres

El profesional puede seleccionar varios horarios libres consecutivos para operar en bloque.

### Regla de selección

La selección múltiple solo admite slots:

- **contiguos**
- del **mismo día**

### Ejemplos válidos

- lunes 10:00 + 10:30 + 11:00
- jueves 15:00 + 15:30

### Ejemplos inválidos

- lunes 10:00 + lunes 11:00 si hay un hueco en el medio
- lunes 10:00 + martes 10:00

### Razón

La selección tiene que servir para:

- reservar varios bloques seguidos para el mismo paciente
- bloquear una franja continua de disponibilidad

y no para combinaciones arbitrarias que aumenten errores de operación.

---

## 9. Acciones contextuales sobre selección libre

Cuando haya uno o más slots válidos seleccionados, debe aparecer una barra o bloque contextual con acciones.

### Acciones disponibles

#### 9.1 Reservar turnos

Abre un modal para continuar la reserva.

### El modal debe recibir precompletado

- profesional
- día
- hora de inicio
- hora de fin resultante
- cantidad de bloques seleccionados

### Objetivo

Permitir reservar varios bloques seguidos para un mismo paciente sin tener que rehacer la selección.

#### 9.2 Cancelar esos turnos

Esta acción en realidad representa **bloquear esa franja libre** dentro del horario del profesional.

Abre un modal que debe pedir:

- motivo obligatorio

La acción crea la excepción o bloqueo correspondiente para esa franja seleccionada.

---

## 10. Click sobre turnos reservados o cancelados

Si el usuario hace click sobre un slot ocupado por un turno existente, debe abrirse un modal de detalle.

### El modal debe mostrar

- paciente
- fecha y hora
- estado del turno
- datos secundarios disponibles si son útiles

### Acciones del modal

Como mínimo:

- ver detalle del turno
- cancelar turno

### Regla de cancelación del turno reservado

Si se cancela desde el modal:

- se debe pedir motivo obligatorio
- el turno **no desaparece** de la grilla
- el turno queda visible como **cancelado** en **rojo suave**

Esto preserva trazabilidad visual y evita confusión.

---

## 11. Referencias rápidas

Debajo de la grilla debe quedar un bloque compacto de referencias rápidas.

### Objetivo

Explicar de forma visual los estados sin competir con la grilla principal.

### Reglas

- más pequeño que la versión actual
- menos padding y menos alto
- color + ícono + texto corto
- debe incluir al menos:
  - libre
  - reservado
  - cancelado
  - fuera de atención

---

## 12. Estado vacío

Si la semana no tiene turnos reservados, la grilla sigue siendo útil porque muestra visualmente:

- dónde atiende
- qué franjas están libres
- qué franjas están fuera de atención

Por eso, el concepto de estado vacío no debe reemplazar la grilla completa. Solo puede aparecer como ayuda textual breve, sin tapar la operación principal.

---

## 13. Reglas de UX

### Principios

- primero entender, después operar
- colores y formas deben ayudar, no decorar
- los estados deben ser legibles sin conocimiento técnico
- el contenido importante debe quedar visible arriba sin scroll excesivo

### Copia

Evitar:

- textos largos
- nombres administrativos innecesarios
- bloques descriptivos gigantes

Preferir:

- títulos breves
- labels directos
- acciones claramente nombradas

---

## 14. Impacto técnico esperado

### Componentes que probablemente cambien

- `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
- `apps/web/src/components/appointments/calendar/CalendarHeader.tsx`
- `apps/web/src/components/appointments/calendar/CalendarView.tsx`
- `apps/web/src/components/appointments/calendar/CalendarSummary.tsx`
- `apps/web/src/components/appointments/calendar/CalendarLegend.tsx`
- `apps/web/src/components/appointments/calendar/calendar-config.ts`
- `apps/web/src/app/(dashboard)/appointments/[id]/page.tsx` o modal reutilizable si se comparte detalle
- posibles formularios/modales reutilizables para reservar y cancelar

### Tabulación

Para el profesional, el conjunto visible de tabs debe quedar como:

- Calendario
- Búsqueda
- Horarios

Sin **Excepciones**.

---

## 15. Criterio de éxito

La pantalla será exitosa si un profesional puede abrirla y entender rápidamente:

- qué días y horarios atiende
- qué espacios tiene libres
- qué turnos ya tiene reservados
- qué turnos fueron cancelados
- cómo reservar varios bloques seguidos
- cómo bloquear una franja disponible

todo desde una sola superficie visual, sin saltar a otra pantalla para excepciones ni navegar vistas complejas de calendario.
