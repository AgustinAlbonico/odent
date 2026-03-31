# PRD: Turnos y Agenda

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P1 — operación diaria crítica
> **Complejidad**: alta

---

## 1. Resumen ejecutivo

Este PRD define el módulo de Turnos y Agenda para una clínica odontológica con múltiples profesionales, recepción y reglas operativas por horario, feriados y excepciones. El objetivo es ordenar la agenda diaria, reducir ausentismo, evitar superposiciones y dar visibilidad completa de la atención en vistas de mes, semana, día y día completo de 24 horas.

El módulo debe servir como herramienta central de coordinación entre recepción, profesionales y pacientes. Tiene que contemplar confirmación de asistencia, recordatorios, cancelaciones, estados del turno, búsqueda operativa rápida y validaciones que respeten horarios, feriados y excepciones sin trabar innecesariamente el trabajo cotidiano.

---

## 2. Problema de negocio

La agenda es el punto donde se cruzan la disponibilidad del profesional, la necesidad del paciente y la capacidad operativa de la clínica. Cuando esa coordinación falla, aparecen turnos superpuestos, huecos improductivos, pacientes que no confirman, cancelaciones tardías y recepcionistas resolviendo todo a mano.

En una clínica odontológica, estos desajustes no son menores: afectan la facturación del día, cargan de estrés a recepción, generan esperas innecesarias y rompen la continuidad entre agenda, atención clínica y seguimiento del paciente. Además, la agenda no puede depender de una sola vista; la recepción necesita buscar rápido, el profesional necesita ver su día y la coordinación general necesita entender ocupación semanal y mensual.

---

## 3. Oportunidad

Un módulo de turnos bien resuelto permite:

- bajar ausentismo con confirmación y recordatorios;
- mejorar ocupación de sillones y horas profesionales;
- reducir errores de coordinación;
- dar previsibilidad a recepción;
- ordenar el trabajo por profesional, especialidad y día;
- sostener una experiencia más prolija para el paciente.

---

## 4. Usuarios y actores

### Usuario principal

#### Recepción / secretaría
- Agenda turnos todo el día.
- Reagenda, cancela, confirma y busca turnos existentes.
- Necesita velocidad, validaciones claras y visibilidad de conflictos.

### Usuarios secundarios

#### Profesional
- Consulta su agenda diaria, semanal o mensual.
- Necesita ver quién viene, a qué hora y en qué estado está cada turno.

#### Paciente
- Recibe recordatorios.
- Puede confirmar o cancelar asistencia si la clínica habilita ese flujo.

#### Administración / coordinación
- Define horarios, feriados, excepciones y parámetros generales.
- Necesita trazabilidad de la agenda y métricas operativas.

---

## 5. Objetivos

### Objetivos de negocio
- Reducir ausentismo y cancelaciones no anticipadas.
- Evitar superposición de turnos para un mismo profesional.
- Mejorar ocupación diaria de la agenda.
- Dar trazabilidad de cada turno desde su alta hasta su resolución.

### Objetivos de usuario
- Crear o reprogramar un turno en pocos pasos.
- Detectar conflictos antes de confirmar una reserva.
- Poder consultar la agenda en la vista adecuada para cada tarea.
- Encontrar un turno existente con filtros simples y combinables.

### Indicadores esperados
- Menor proporción de turnos no asistidos.
- Menor tiempo promedio para crear o reprogramar un turno.
- Menor cantidad de conflictos resueltos manualmente.
- Mayor proporción de turnos confirmados antes de la atención.

---

## 6. Alcance

### Incluido en esta versión
- Calendario con vistas de mes, semana y día.
- Vista diaria extendida de 24 horas.
- Alta, edición, cancelación y reagendado de turnos.
- Estados del turno y reglas de transición.
- Detección de conflictos de agenda.
- Confirmación de asistencia.
- Recordatorios.
- Gestión de horarios de atención.
- Gestión de feriados.
- Gestión de excepciones por profesional.
- Búsqueda avanzada de turnos.
- Visualización opcional de turnos cancelados.

### Fuera de alcance
- Portal de autogestión para que el paciente reserve turnos por su cuenta.
- Lista de espera automática con reasignación inmediata.
- Reglas automáticas de penalización por reiteradas inasistencias.
- Integración con calendarios personales externos.
- Bloqueo automático de agendas existentes por exceso de cupo profesional del plan.

---

## 7. Principios de negocio

- La agenda tiene que reflejar la realidad operativa, no una versión idealizada.
- La recepción necesita velocidad, pero no a costa de perder control.
- Un conflicto debe advertirse antes de generar un problema real.
- Un turno cancelado no desaparece: conserva historial.
- La agenda del día debe poder leerse de un golpe de vista.
- Confirmar asistencia debe ayudar a reducir ausentismo, no agregar fricción innecesaria.
- Una restricción de plan sobre altas o reactivaciones no debe cancelar ni apagar la agenda de profesionales que ya estaban activos.

---

## 8. Entidades de negocio involucradas

### Turno
Reserva de atención con fecha, hora, profesional, paciente, estado y observaciones.

### Profesional
Persona que atiende y define disponibilidad de agenda.

Para sostener agenda operativa debe ser un profesional activo dentro del padrón institucional. Si la clínica queda excedida luego de una baja de plan, los profesionales que ya estaban activos continúan operando; la restricción se aplica solo a nuevas altas o reactivaciones definidas en el PRD de Profesionales.

### Paciente
Persona que recibe la atención y puede confirmar o cancelar asistencia.

### Horario de atención
Franja habitual en la que un profesional puede recibir turnos.

### Excepción
Bloqueo o alteración temporal del horario habitual por vacaciones, licencia, capacitación o contingencia.

### Feriado
Día no laborable o atípico que impacta en la agenda institucional.

---

## 9. Estados del turno

Los estados mínimos del turno serán:

- **Pendiente**: turno creado, todavía sin confirmación.
- **Confirmado**: asistencia confirmada por paciente o por recepción.
- **En espera**: paciente presente, aguardando atención.
- **Atendido**: atención efectivamente realizada.
- **Cancelado**: turno dado de baja antes de la atención.
- **No asistió**: paciente no se presentó.

### Reglas generales de transición
- Pendiente puede pasar a Confirmado, Cancelado o No asistió.
- Confirmado puede pasar a En espera, Atendido, Cancelado o No asistió.
- En espera puede pasar a Atendido o Cancelado en caso excepcional.
- Atendido es estado final operativo.
- Cancelado y No asistió deben conservarse para búsqueda, métricas e historial.

---

## 10. Requisitos funcionales

### P0 — Críticos

#### RF-TA-001 — Calendario con vista mensual
La agenda debe permitir una vista mensual para detectar carga general, días con alta ocupación, feriados y distribución de turnos.

**Criterio de aceptación**
- **Dado** que la recepción o coordinación necesita planificar el mes,
- **Cuando** ingresa a la vista mensual,
- **Entonces** el sistema muestra el calendario completo del período con indicadores de turnos por día, permitiendo navegar a meses anteriores y siguientes.

#### RF-TA-002 — Calendario con vista semanal
La agenda debe ofrecer una vista semanal para organizar carga operativa de corto plazo y comparar disponibilidad entre profesionales.

**Criterio de aceptación**
- **Dado** que el usuario necesita revisar la próxima semana,
- **Cuando** selecciona la vista semanal,
- **Entonces** el sistema muestra los días de la semana con sus turnos agrupados por día y profesional.

#### RF-TA-003 — Calendario con vista diaria
La agenda debe ofrecer una vista diaria centrada en la operación del consultorio, mostrando turnos por profesional y franja horaria.

**Criterio de aceptación**
- **Dado** que el profesional o recepción necesita operar el día actual,
- **Cuando** abre la vista diaria,
- **Entonces** el sistema muestra la agenda del día por franjas horarias y por profesional.

#### RF-TA-004 — Vista diaria extendida de 24 horas
La agenda debe permitir una vista diaria de 24 horas para contemplar horarios fuera de la franja habitual, guardias o casos especiales.

**Criterio de aceptación**
- **Dado** que existe actividad fuera del horario habitual,
- **Cuando** el usuario activa la opción de ver 24 horas,
- **Entonces** la agenda muestra el día completo desde las 00:00 hasta las 23:59.

#### RF-TA-005 — Alta de turno
El sistema debe permitir registrar un turno indicando al menos paciente, profesional, fecha, hora y duración prevista.

**Criterio de aceptación**
- **Dado** que la recepción tiene disponibles los datos mínimos del turno,
- **Cuando** completa la información obligatoria y guarda,
- **Entonces** el sistema registra el turno y lo refleja en la agenda correspondiente.

#### RF-TA-006 — Detección de conflictos
El sistema debe advertir conflictos cuando un turno se superpone con otro turno activo del mismo profesional.

**Criterio de aceptación**
- **Dado** que ya existe un turno activo para un profesional en una franja determinada,
- **Cuando** el usuario intenta reservar otra atención superpuesta,
- **Entonces** el sistema informa el conflicto antes de confirmar el alta.

#### RF-TA-007 — Reglas de horario habitual
La creación y edición de turnos debe respetar los horarios habituales de atención configurados para cada profesional.

**Criterio de aceptación**
- **Dado** que un profesional tiene definido un horario de atención,
- **Cuando** se intenta reservar un turno fuera de ese horario,
- **Entonces** el sistema advierte que la franja no corresponde a su disponibilidad habitual.

#### RF-TA-008 — Gestión de feriados
El sistema debe identificar feriados y contemplarlos al operar la agenda.

**Criterio de aceptación**
- **Dado** que una fecha está marcada como feriado fijo o móvil,
- **Cuando** el usuario visualiza esa fecha o intenta asignar un turno,
- **Entonces** el sistema señala la condición de feriado y aplica la regla definida por la clínica para esa fecha.

#### RF-TA-009 — Gestión de excepciones
La agenda debe contemplar excepciones por profesional, como vacaciones, congresos, licencias o bloqueos especiales.

**Criterio de aceptación**
- **Dado** que un profesional tiene una excepción cargada para un período,
- **Cuando** el usuario intenta reservar un turno dentro de ese rango,
- **Entonces** el sistema informa la excepción y evita confirmar el turno según la política definida.

#### RF-TA-010 — Búsqueda avanzada de turnos
La clínica debe poder encontrar turnos mediante filtros por paciente, profesional, fecha, estado, mutual y rango horario.

**Criterio de aceptación**
- **Dado** que el usuario necesita localizar un turno existente,
- **Cuando** combina filtros de búsqueda,
- **Entonces** el sistema devuelve únicamente los turnos que cumplen esos criterios.

### P1 — Importantes

#### RF-TA-011 — Confirmación de asistencia
El sistema debe permitir que la clínica gestione confirmación de asistencia con una regla horaria configurable.

**Criterio de aceptación**
- **Dado** que la clínica definió una anticipación para confirmar asistencia,
- **Cuando** el turno entra en esa ventana,
- **Entonces** el sistema habilita el mecanismo de confirmación previsto para el paciente.

#### RF-TA-012 — Recordatorios de turno
La agenda debe permitir el envío de recordatorios para reducir olvidos y ausentismo.

**Criterio de aceptación**
- **Dado** que un turno próximo necesita recordatorio,
- **Cuando** el usuario ejecuta la acción de recordar o se dispara la regla prevista,
- **Entonces** el sistema deja constancia del recordatorio y actualiza el seguimiento del turno.

#### RF-TA-013 — Cancelación de turno
El sistema debe permitir cancelar un turno sin perder el historial de su existencia.

**Criterio de aceptación**
- **Dado** que un turno ya fue asignado,
- **Cuando** recepción, el profesional o el paciente lo cancelan según corresponda,
- **Entonces** el turno cambia a estado Cancelado, libera la franja y conserva registro histórico.

#### RF-TA-014 — Visualización de cancelados
La agenda debe ofrecer una forma clara de mostrar u ocultar turnos cancelados.

**Criterio de aceptación**
- **Dado** que existen turnos cancelados en el período consultado,
- **Cuando** el usuario activa la vista de cancelados,
- **Entonces** el sistema los muestra diferenciados del resto de los estados.

#### RF-TA-015 — Edición y reagendado
El sistema debe permitir modificar fecha, hora, profesional, duración u observaciones del turno existente.

**Criterio de aceptación**
- **Dado** que existe un turno previamente cargado,
- **Cuando** el usuario modifica sus datos operativos,
- **Entonces** el sistema revalida disponibilidad y actualiza la agenda si no hay conflicto.

#### RF-TA-016 — Cambio de estado manual
La recepción y/o el profesional deben poder actualizar el estado del turno según lo ocurrido en la práctica.

**Criterio de aceptación**
- **Dado** que el turno avanza en su ciclo operativo,
- **Cuando** el usuario cambia su estado,
- **Entonces** el sistema registra la transición y refleja el nuevo estado en agenda y búsqueda.

#### RF-TA-017 — Vista operativa por profesional
La vista diaria debe permitir identificar rápidamente qué profesional atiende cada turno.

**Criterio de aceptación**
- **Dado** que la clínica trabaja con varios profesionales,
- **Cuando** el usuario consulta la vista diaria,
- **Entonces** puede distinguir claramente la agenda de cada profesional en forma separada.

#### RF-TA-018 — Filtro por especialidad
La agenda debe poder filtrarse por especialidad además de por profesional.

**Criterio de aceptación**
- **Dado** que la institución necesita revisar agenda por tipo de atención,
- **Cuando** aplica un filtro por especialidad,
- **Entonces** el sistema muestra solamente los turnos de esa especialidad.

### P2 — Deseables

#### RF-TA-019 — Creación rápida desde la grilla diaria
Desde la vista diaria, la recepción debería poder iniciar un turno haciendo clic sobre una franja vacía.

**Criterio de aceptación**
- **Dado** que el usuario está mirando una franja horaria libre,
- **Cuando** inicia el alta desde esa franja,
- **Entonces** el sistema precarga fecha, hora y profesional para acelerar la carga.

#### RF-TA-020 — Indicadores visuales por estado
Cada estado del turno debe tener una representación visual consistente.

**Criterio de aceptación**
- **Dado** que existen turnos en distintos estados,
- **Cuando** se muestran en la agenda,
- **Entonces** cada estado se distingue visualmente de forma inmediata.

#### RF-TA-021 — Navegación rápida entre períodos
El usuario debe poder volver a hoy y avanzar o retroceder fácilmente en la agenda.

**Criterio de aceptación**
- **Dado** que el usuario está consultando otro período,
- **Cuando** utiliza las acciones de anterior, siguiente u hoy,
- **Entonces** la agenda se reposiciona correctamente en el período solicitado.

#### RF-TA-022 — Observaciones operativas del turno
Cada turno debe admitir observaciones útiles para recepción o atención.

**Criterio de aceptación**
- **Dado** que el usuario necesita registrar una aclaración sobre el turno,
- **Cuando** guarda una observación,
- **Entonces** esa nota queda visible en el detalle operativo del turno.

---

## 11. Reglas de negocio

1. Un mismo profesional no debe tener dos turnos activos superpuestos en la misma franja.
2. Los horarios habituales funcionan como marco principal de disponibilidad.
3. Las excepciones prevalecen sobre el horario habitual.
4. Los feriados deben ser visibles en la agenda y condicionar la operación.
5. Un turno cancelado libera agenda, pero no se elimina del historial.
6. La confirmación de asistencia debe responder a una política configurable de anticipación.
7. La búsqueda tiene que incluir tanto turnos activos como no activos según filtro.
8. La vista diaria y la vista 24 horas deben reflejar el mismo dato base, solo cambia el encuadre visual.
9. Una institución excedida por downgrade no pierde automáticamente las agendas de profesionales ya activos.

---

## 12. Flujos principales

### Flujo 1 — Crear turno
1. Recepción identifica paciente y profesional.
2. Revisa disponibilidad en agenda.
3. Elige fecha, hora y duración.
4. El sistema valida horario, feriado, excepción y conflicto.
5. Si todo es válido, guarda el turno en estado Pendiente.
6. El turno aparece inmediatamente en la agenda.

### Flujo 2 — Confirmar asistencia
1. El turno entra en la ventana de confirmación definida.
2. La clínica o el paciente ejecutan la confirmación.
3. El sistema actualiza el estado a Confirmado.
4. La agenda refleja el nuevo estado.

### Flujo 3 — Cancelar turno
1. Se localiza el turno en agenda o búsqueda.
2. Se registra la cancelación.
3. El sistema cambia el estado a Cancelado.
4. La franja vuelve a quedar disponible.
5. El turno permanece accesible en historial y filtros.

### Flujo 4 — Reagendar turno
1. Se busca el turno original.
2. Se modifica fecha, hora, duración o profesional.
3. El sistema vuelve a validar reglas operativas.
4. Si no hay conflicto, actualiza agenda y conserva trazabilidad.

### Flujo 5 — Operar la agenda del día
1. Recepción o profesional abre la vista diaria.
2. Revisa estados, confirmaciones y cancelaciones.
3. Filtra si hace falta por profesional o especialidad.
4. Actúa sobre recordatorios, cambios o consultas rápidas.

---

## 13. Casos borde y manejo esperado

- Turno pedido en feriado: se debe advertir claramente la situación.
- Turno pedido fuera de horario: se debe advertir antes de confirmar.
- Profesional con excepción vigente: se debe bloquear o advertir según política.
- Paciente que cancela cerca del horario: debe quedar el antecedente.
- Turno no confirmado que igual se atiende: debe poder pasar a Atendido.
- Turno confirmado cuyo paciente no se presenta: debe poder cerrarse como No asistió.
- Necesidad de revisar jornada extendida: la vista 24 horas debe contemplarlo.

---

## 14. Requisitos no funcionales de negocio

- La agenda diaria debe ser legible y operable sin capacitación compleja.
- La creación o edición de un turno habitual debe resolverse en pocos pasos.
- La búsqueda tiene que responder con velocidad suficiente para atención telefónica y mostrador.
- La información mostrada en calendario y en búsqueda debe ser consistente.
- La vista de agenda debe soportar jornadas con alta densidad de turnos sin perder claridad.
- La continuidad de agenda de profesionales ya activos no debe depender de cambios de plan mientras el padrón existente siga vigente.

---

## 15. Métricas de éxito

- Reducción del porcentaje de turnos no asistidos.
- Aumento de la proporción de turnos confirmados antes de la atención.
- Reducción del tiempo promedio para dar un turno.
- Disminución de superposiciones o conflictos manuales.
- Mejor ocupación diaria por profesional.

---

## 16. Riesgos

| Riesgo | Impacto | Mitigación de negocio |
|---|---|---|
| Confirmaciones poco claras para el paciente | Alto | Definir mensajes simples y un estado visible para recepción |
| Excesivas excepciones mal cargadas | Alto | Ordenar responsabilidades y revisión periódica de agenda |
| Feriados desactualizados | Medio | Mantener calendario institucional revisado con anticipación |
| Búsquedas lentas en horas pico | Alto | Priorizar filtros operativos más usados y resultados claros |
| Sobrecarga visual en clínicas con muchos profesionales | Medio | Permitir filtros por profesional y especialidad |
| Interpretar el límite de plan como baja automática de agenda | Alto | Dejar explícito que el bloqueo aplica a altas/reactivaciones y no a agendas ya operativas |

---

## 17. Dependencias funcionales

- Pacientes
- Profesionales
- Configuración general
- Horarios y excepciones
- Mutuales, cuando el turno requiera ese dato operativo
- Autenticación y autorización para permisos de operación sobre agenda

---

## 18. Preguntas abiertas

- Qué canales usará la clínica para confirmación y recordatorios según su política comercial.
- Si la cancelación por parte del paciente debe tener límite mínimo de anticipación.
- Si algunas especialidades requerirán duraciones sugeridas distintas.
- Si habrá diferencias visibles entre turnos particulares y por mutual.

---

## 19. Criterios globales de aceptación del módulo

- **Dado** que una clínica trabaja con varios profesionales y múltiples turnos diarios,
- **Cuando** opera el módulo de Turnos y Agenda,
- **Entonces** puede visualizar, crear, buscar, confirmar, cancelar y reorganizar turnos sin perder trazabilidad ni generar superposiciones evitables.

- **Dado** que la recepción necesita controlar el día operativo,
- **Cuando** usa la vista diaria y la vista 24 horas,
- **Entonces** obtiene una lectura clara de horarios, estados, conflictos y disponibilidad.

- **Dado** que la clínica necesita reducir ausentismo,
- **Cuando** activa confirmación de asistencia y recordatorios,
- **Entonces** el módulo acompaña ese proceso y deja evidencia del seguimiento de cada turno.

- **Dado** que el tenant quedó excedido por una baja de plan,
- **Cuando** la clínica consulta las agendas de profesionales que ya estaban activos,
- **Entonces** el sistema mantiene su continuidad operativa y no cancela ni bloquea automáticamente esos turnos.
