# Diseño técnico — Agenda diaria simplificada para profesionales

> **Fecha**: 2026-04-02  
> **Estado**: diseño propuesto, pendiente de revisión final del usuario  
> **Ámbito**: `apps/web/src/app/(dashboard)/appointments/calendar` y componentes asociados

---

## 1. Objetivo

Simplificar la pantalla de calendario para profesionales para que funcione como una **agenda diaria** fácil de entender, centrada en **hoy** por defecto, con navegación por fecha y sin elementos administrativos o visualmente ruidosos.

La pantalla debe priorizar tres cosas, en este orden:

1. **Resumen del día seleccionado**
2. **Turnos del día en orden horario**
3. **Referencias rápidas compactas**

---

## 2. Problema actual

La versión actual del calendario muestra demasiados bloques al mismo tiempo:

- encabezado grande de “Calendario de turnos”
- bloque “Ajustes de agenda”
- selector de vistas (mes, semana, día, día completo)
- resumen amplio del período completo
- calendario orientado a múltiples vistas, no al trabajo diario

Eso aumenta la carga cognitiva para usuarios poco técnicos y hace que la pantalla se sienta más como una herramienta administrativa que como una agenda operativa.

---

## 3. Decisión de producto

Para el rol `profesional`, la pantalla `/appointments/calendar` pasa a comportarse como una **agenda diaria estricta**.

### Reglas principales

- Al entrar, la vista abre en **la fecha de hoy**.
- La pantalla muestra **solo los turnos del día seleccionado**.
- Se elimina la UI para cambiar entre vistas mensuales o semanales.
- El profesional no ve filtros administrativos ni conceptos técnicos innecesarios.
- La navegación se hace por:
  - día anterior
  - hoy
  - día siguiente
  - selector de fecha

---

## 4. Estructura visual final

### 4.1 Cabecera mínima

Se mantiene el contexto de módulo “Turnos y Agenda”, pero se eliminan los bloques grandes que hoy empujan el contenido importante hacia abajo.

#### Se elimina

- el bloque grande “Calendario de turnos”
- el bloque “Ajustes de agenda”
- el selector de vistas “Mes / Semana / Día / Día completo”

#### Se mantiene

- navegación por fecha del día seleccionado
- acceso claro al día de hoy
- selector manual de fecha

La cabecera operativa debe ocupar poco alto y permitir que el usuario vea el contenido útil sin hacer scroll excesivo.

---

### 4.2 Resumen del día seleccionado

Lo primero visible dentro del contenido principal debe ser un **resumen compacto del día**.

#### Contenido del resumen

- fecha seleccionada en formato humano
- total de turnos del día
- cantidad por estado:
  - pendiente
  - confirmado
  - en espera
  - atendido
  - cancelado
  - ausente

#### Criterios visuales

- tarjetas o badges compactos
- color semántico + etiqueta textual
- jerarquía alta para la fecha seleccionada
- sin textos largos ni explicaciones redundantes

#### Ejemplo conceptual

- Miércoles 3 de abril
- 8 turnos
- 2 pendientes
- 3 confirmados
- 1 en espera
- 1 atendido
- 1 cancelado

---

### 4.3 Lista / grilla diaria de turnos

Debajo del resumen se muestra la agenda del día, en orden cronológico.

La implementación debe priorizar **lectura rápida** antes que densidad visual.

#### Cada fila o tarjeta debe mostrar

- hora
- nombre del paciente
- estado visual del turno
- dato secundario opcional si está disponible y no ensucia, por ejemplo mutual

#### Comportamiento

- solo turnos del día seleccionado
- orden ascendente por hora
- si hay varios turnos, deben ser fáciles de escanear rápidamente
- el estado debe ser comprensible sin depender solo del color

#### Representación visual recomendada

Usar filas o tarjetas compactas con:

- ícono del estado
- color semántico del estado
- hora con fuerte jerarquía
- nombre del paciente como dato principal

La pantalla debe sentirse como una **agenda diaria clínica**, no como un calendario técnico genérico.

---

### 4.4 Referencias rápidas compactas

Debajo de la lista diaria debe quedar un bloque pequeño de referencias rápidas.

#### Objetivo

Ayudar a interpretar estados sin competir visualmente con los turnos del día.

#### Reglas

- más chico que el bloque actual
- menos padding y menos altura
- solo color + ícono + texto corto
- se mantiene al final, no arriba

---

### 4.5 Estado vacío

Si el día seleccionado no tiene turnos, la pantalla debe mostrar un estado vacío simple.

#### Mensaje principal

`No hay turnos para esta fecha`

#### Mensaje secundario

`Probá elegir otro día`

#### Reglas

- no usar textos largos
- no agregar instrucciones técnicas
- mantener una señal visual amable y clara

---

## 5. Comportamiento por rol

### Profesional

- entra en modo agenda diaria
- fecha inicial: hoy
- agenda propia, sin selector de profesional
- sin filtros administrativos
- sin vistas alternativas

### Otros roles

Este cambio está focalizado en profesionales. Si la pantalla sigue siendo compartida con otros roles, deben evaluarse dos opciones de implementación:

1. mantener experiencia especializada solo para `profesional`
2. extender la agenda diaria simplificada a todos los roles

### Recomendación

En esta iteración, aplicar el cambio **solo al rol profesional**, para evitar alterar de más los flujos administrativos.

---

## 6. Navegación temporal

La navegación del calendario debe pasar a ser navegación diaria.

### Controles requeridos

- botón “Día anterior”
- botón “Hoy”
- botón “Día siguiente”
- selector de fecha

### Regla de interacción

Cada cambio de fecha debe refrescar inmediatamente:

- resumen del día
- lista de turnos del día
- estado vacío si corresponde

No debe depender de cambiar de vista ni de acciones secundarias.

---

## 7. Reglas de UX writing

La copia debe ser corta, operativa y humana.

### Mantener

- “Hoy”
- “Día anterior” / “Día siguiente”
- “No hay turnos para esta fecha”
- “Probá elegir otro día”

### Evitar

- “Calendario de turnos” como héroe visual grande
- “Ajustes de agenda”
- terminología técnica innecesaria
- textos explicativos largos

---

## 8. Reglas visuales

Se deben usar los tokens del design system vigente.

### Estados

- pendiente → warning
- confirmado → success
- en espera → primary
- atendido → muted / neutral
- cancelado → muted o destructive suave según jerarquía final
- ausente → destructive

### Criterios

- cada estado debe tener color + texto + ícono
- el contenido principal debe aparecer sin necesidad de mucho scroll
- en mobile la agenda del día debe seguir siendo la protagonista

---

## 9. Impacto técnico esperado

### Componentes a ajustar

- `apps/web/src/app/(dashboard)/appointments/calendar/page.tsx`
- `apps/web/src/components/appointments/calendar/CalendarHeader.tsx`
- `apps/web/src/components/appointments/calendar/CalendarView.tsx`
- `apps/web/src/components/appointments/calendar/CalendarSummary.tsx`
- `apps/web/src/components/appointments/calendar/CalendarLegend.tsx`
- `apps/web/src/components/appointments/calendar/calendar-config.ts`

### Cambios funcionales esperados

- el calendario deja de comportarse como vista múltiple para profesionales
- el fetch debe enfocarse en el día seleccionado
- la UI debe renderizar resumen diario + lista diaria + referencias compactas

---

## 10. Verificación esperada

### Desktop

- el profesional entra y ve hoy por defecto
- no aparecen vistas mes/semana/día/día completo
- no aparece “Ajustes de agenda”
- no aparece el bloque grande de “Calendario de turnos”
- lo primero visible es el resumen del día seleccionado
- debajo aparecen los turnos del día

### Mobile

- la fecha y la navegación diaria son legibles
- el resumen entra arriba sin ruido innecesario
- la lista diaria se puede recorrer cómodamente
- las referencias rápidas quedan abajo y compactas

---

## 11. Criterio de éxito

La pantalla será exitosa si un profesional puede abrirla y entender en menos de unos segundos:

- qué día está viendo
- cuántos turnos tiene ese día
- cuáles son sus próximos turnos
- qué significa cada estado

sin tener que interpretar conceptos de calendario complejos ni navegar vistas innecesarias.
