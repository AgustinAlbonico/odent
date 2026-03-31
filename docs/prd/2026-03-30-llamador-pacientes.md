# PRD: Llamador de Pacientes

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: alta
> **Autor**: generado con prd-creator

---

## Problema

En una clínica odontológica con varios turnos por día, la sala de espera puede convertirse en un punto de fricción silencioso: pacientes que no saben cuándo les toca, profesionales que pierden tiempo saliendo a buscar gente, recepción interrumpida para anunciar llamados y confusión sobre qué consultorio está atendiendo a quién. Aunque parezca un detalle operativo, este momento afecta percepción de orden, puntualidad y calidad del servicio.

La clínica necesita un llamador de pacientes en tiempo real que conecte la agenda del día con la atención efectiva. El módulo debe ordenar la cola de pacientes, indicar desde qué consultorio se llama, reflejar estados visibles y eventualmente alimentar una pantalla de sala de espera para que la comunicación no dependa de gritos, papeles o coordinación informal.

**Situación actual**: se observó una pantalla donde el profesional ve “Atendiendo en” con consultorio configurable, actualización automática del día, botón “Llamar al próximo” y referencias visuales de estados. También hay evidencia de una posible pantalla complementaria para pacientes, aunque no fue verificada directamente.

---

## Usuarios

### Usuario principal
- **Quién**: Profesional o asistente del consultorio.
- **Necesidad**: Llamar al próximo paciente de manera rápida, ordenada y visible, sin interrumpir innecesariamente la atención.
- **Dolor actual**: Si el llamado depende de coordinación manual, se generan demoras, confusión y tiempos muertos entre paciente y paciente.

### Usuarios secundarios
- **Recepción**: Necesita entender quién ya fue llamado, quién sigue esperando y si hay desvíos respecto de la agenda.
- **Paciente en sala de espera**: Necesita saber si ya fue convocado y a qué consultorio debe dirigirse.
- **Dirección / coordinación**: Necesita ordenar el flujo de atención y reducir interrupciones innecesarias.

---

## Objetivos

### Objetivos de negocio
- Reducir interrupciones operativas entre recepción y consultorios.
- Disminuir tiempos muertos entre una atención y la siguiente.
- Dar visibilidad en tiempo real del estado de la sala de espera.
- Mejorar la percepción de orden y profesionalismo frente al paciente.
- Sentar base para una futura pantalla pública de sala de espera.

### Objetivos de usuario
- El profesional puede llamar al próximo paciente con una sola acción.
- La recepción puede identificar rápidamente quién está pendiente, esperando, llamado o atendido.
- El paciente entiende claramente cuándo fue convocado y a qué consultorio debe dirigirse.

### No-objetivos (explícitos)
- No incluye gestión de audio por parlantes o síntesis de voz en esta versión.
- No incluye notificaciones al celular del paciente desde el llamador.
- No reemplaza el módulo de turnos ni la lógica de check-in completo del paciente.
- No incluye asignación inteligente automática de consultorios según carga de trabajo.

---

## Alcance

### Incluido en esta versión
- Cola del día basada en pacientes con turno operativo.
- Actualización en tiempo real del estado de la cola.
- Selección o cambio de consultorio desde donde se realiza el llamado.
- Acción directa para llamar al próximo paciente.
- Estados visibles para seguimiento operativo.
- Historial básico del último llamado y del consultorio asignado.
- Posibilidad de una vista pública de sala de espera como extensión del mismo flujo.

### Fuera de alcance (explícito)
- Pantallas de televisión multi-sede con branding avanzado — puede evaluarse luego.
- Integración con tótems de check-in autoservicio.
- Reglas automáticas de prioridad clínica compleja (urgencias, triage, derivaciones).
- Métricas avanzadas de puntualidad por profesional en tiempo real — se analizarán en otra etapa.

---

## Definiciones de negocio

- **Cola de pacientes**: orden operativo de personas pendientes de ser llamadas para atención.
- **Llamado**: acción mediante la cual un consultorio convoca al próximo paciente.
- **Consultorio**: espacio físico al que el paciente debe dirigirse cuando es llamado.
- **Pantalla de sala de espera**: vista visible para pacientes que muestra llamados vigentes y consultorio de destino.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-901] Mostrar cola de pacientes del día**
  Descripción: El llamador debe visualizar la cola de pacientes correspondiente al día y al contexto operativo del usuario.
  Criterio de aceptación: **Dado** que existen turnos programados para el día, **cuando** el profesional o asistente abre el llamador, **entonces** ve la cola actualizada de pacientes pendientes de atención.

- **[RF-902] Actualización en tiempo real**
  Descripción: La cola debe reflejar cambios operativos sin necesidad de recargar manualmente la pantalla.
  Criterio de aceptación: **Dado** que un paciente cambia de estado en la cola, **cuando** el usuario observa el llamador, **entonces** la información se actualiza en tiempo real o con refresco automático perceptiblemente inmediato.

- **[RF-903] Llamar al próximo paciente**
  Descripción: Debe existir una acción simple y directa para convocar al siguiente paciente de la cola.
  Criterio de aceptación: **Dado** que hay al menos un paciente pendiente, **cuando** el usuario presiona “Llamar al próximo”, **entonces** el primer paciente elegible pasa al estado de llamado o esperando consultorio y queda asociado al consultorio activo.

- **[RF-904] Seleccionar consultorio activo**
  Descripción: El usuario debe poder definir desde qué consultorio está llamando para que el destino sea claro.
  Criterio de aceptación: **Dado** que el usuario trabaja en un consultorio determinado, **cuando** selecciona o cambia el consultorio activo, **entonces** los próximos llamados quedan asociados a ese consultorio hasta que vuelva a cambiarlo.

- **[RF-905] Gestionar estados visibles del flujo**
  Descripción: La cola debe usar estados operativos visibles como mínimo entre Pendiente, Llamado/Esperando y Atendido o equivalente institucional.
  Criterio de aceptación: **Dado** que un paciente avanza por el proceso de atención, **cuando** su situación cambia, **entonces** el llamador muestra el nuevo estado con una señal visual clara y coherente.

- **[RF-906] Mostrar consultorio del llamado**
  Descripción: Todo paciente llamado debe quedar asociado visualmente al consultorio al que debe dirigirse.
  Criterio de aceptación: **Dado** que un paciente fue llamado, **cuando** el sistema muestra ese llamado, **entonces** se ve claramente a qué consultorio debe ir.

- **[RF-907] Evitar llamar sin pacientes elegibles**
  Descripción: El sistema no debe permitir llamados vacíos o inconsistentes cuando no hay pacientes pendientes.
  Criterio de aceptación: **Dado** que no hay pacientes pendientes en la cola, **cuando** el usuario intenta llamar al próximo, **entonces** el sistema informa que no hay pacientes disponibles para convocar.

- **[RF-908] Preparar vista para sala de espera**
  Descripción: El flujo debe poder alimentar una vista simplificada para pacientes, mostrando llamado vigente y consultorio, sin exponer información innecesaria.
  Criterio de aceptación: **Dado** que existe una pantalla visible en sala de espera, **cuando** un paciente es llamado, **entonces** la vista pública muestra el llamado y el consultorio correspondiente en formato claro.

### P1 — Importantes

- **[RF-909] Re-llamar al paciente**
  Descripción: Si el paciente no responde al primer llamado, el usuario debe poder reiterarlo sin desordenar la cola.
  Criterio de aceptación: **Dado** que un paciente ya fue llamado y no se presentó, **cuando** el usuario ejecuta un nuevo llamado sobre ese caso, **entonces** el sistema vuelve a mostrarlo como llamado activo manteniendo trazabilidad del intento.

- **[RF-910] Marcar paciente como atendido**
  Descripción: Una vez que el paciente entra al consultorio, debe poder reflejarse el cierre de esa etapa en la cola.
  Criterio de aceptación: **Dado** que el paciente ya ingresó al consultorio, **cuando** el usuario lo marca como atendido o equivalente, **entonces** deja de aparecer como pendiente de llamado.

- **[RF-911] Visualizar hora del último refresco**
  Descripción: El llamador debe indicar que la información está actualizada y cuándo fue la última actualización visible.
  Criterio de aceptación: **Dado** que el usuario consulta el llamador, **cuando** observa el encabezado operativo, **entonces** puede ver una referencia temporal reciente de actualización.

- **[RF-912] Priorizar pacientes ya presentes**
  Descripción: La cola debe contemplar el orden operativo de los pacientes efectivamente listos para ser llamados.
  Criterio de aceptación: **Dado** que hay pacientes del día pero no todos están presentes, **cuando** el profesional llama al próximo, **entonces** el sistema toma como elegible al siguiente paciente listo para atención según la regla definida por la institución.

- **[RF-913] Permitir cambio manual de orden en casos excepcionales**
  Descripción: En situaciones justificadas, recepción o el profesional autorizado puede alterar el orden de atención.
  Criterio de aceptación: **Dado** que se presenta una urgencia o una necesidad operativa especial, **cuando** un usuario autorizado reordena la cola, **entonces** el sistema aplica el cambio y deja constancia de la intervención.

- **[RF-914] Diferenciar estados con señales visibles**
  Descripción: Cada estado debe identificarse visualmente para lectura rápida desde cierta distancia.
  Criterio de aceptación: **Dado** que el usuario mira la cola del llamador, **cuando** observa los pacientes listados, **entonces** puede distinguir de inmediato quién está pendiente, quién fue llamado y quién ya fue atendido.

- **[RF-915] Registrar historial breve de llamados**
  Descripción: Debe existir una referencia de últimos llamados para resolver dudas operativas del momento.
  Criterio de aceptación: **Dado** que hubo varios llamados recientes, **cuando** el usuario consulta el llamador, **entonces** puede ver al menos el último paciente llamado, el horario y el consultorio correspondiente.

### P2 — Deseables

- **[RF-916] Pantalla pública con visualización ampliada**
  Descripción: La vista de sala de espera puede mostrar varios llamados recientes además del actual para mejorar visibilidad.
  Criterio de aceptación: **Dado** que la institución usa una pantalla visible para pacientes, **cuando** se producen llamados sucesivos, **entonces** la vista pública puede mostrar el llamado actual y algunos recientes con su consultorio.

- **[RF-917] Mostrar estimación simple de espera**
  Descripción: La clínica puede informar una referencia orientativa de cuántos pacientes hay antes del siguiente llamado.
  Criterio de aceptación: **Dado** que un paciente consulta su lugar en la cola, **cuando** recepción revisa el llamador, **entonces** puede tener una referencia simple del orden de atención pendiente.

- **[RF-918] Motivo de salto de turno**
  Descripción: Si se salta a un paciente por ausencia o excepción, debe poder dejarse un motivo breve.
  Criterio de aceptación: **Dado** que un usuario decide no llamar al siguiente paciente de la cola, **cuando** registra el motivo, **entonces** la decisión queda documentada para control operativo posterior.

---

## Requisitos No Funcionales

- **Inmediatez**: El usuario debe percibir el cambio de estado prácticamente en el momento en que realiza la acción.
- **Legibilidad**: Los estados y consultorios deben poder leerse rápidamente desde una pantalla de uso diario.
- **Continuidad operativa**: El llamador debe sostenerse durante toda la jornada sin requerir recargas manuales constantes.
- **Simplicidad**: El llamado del próximo paciente no debe requerir más de una acción principal.
- **Privacidad**: La eventual pantalla pública debe mostrar solo la información mínima necesaria para orientar al paciente.

---

## Flujos

### Flujo principal — Llamar al próximo paciente
1. El profesional abre el llamador.
2. Verifica el consultorio activo.
3. Observa la cola del día actualizada.
4. Presiona “Llamar al próximo”.
5. El sistema selecciona al siguiente paciente elegible.
6. El llamado queda visible con su consultorio.
7. La cola actualiza estados en tiempo real.

### Flujo — Cambio de consultorio
1. El usuario detecta que atenderá desde otro consultorio.
2. Cambia el consultorio activo.
3. El sistema confirma el nuevo consultorio.
4. Los próximos llamados quedan asociados a ese destino.

### Flujo — Re-llamado
1. El paciente fue convocado pero no respondió.
2. El usuario selecciona re-llamar.
3. El sistema vuelve a mostrar el llamado vigente.
4. El historial conserva que hubo más de un intento.

### Flujo alternativo — Pantalla de sala de espera
1. Existe una vista visible para pacientes.
2. El profesional realiza un llamado.
3. La pantalla pública se actualiza.
4. El paciente ve a qué consultorio dirigirse.

### Flujos de error
**No hay pacientes para llamar**
Condición: La cola no tiene pacientes elegibles.
Comportamiento esperado: El sistema informa la situación y no ejecuta ninguna acción inconsistente.

**Consultorio no definido**
Condición: El usuario intenta llamar sin tener consultorio activo seleccionado.
Comportamiento esperado: El sistema solicita definir el consultorio antes de continuar.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** una cola con pacientes pendientes, **cuando** el profesional presiona “Llamar al próximo”, **entonces** el siguiente paciente elegible queda convocado con consultorio visible.
- [ ] **Dado** que cambia el estado de un paciente, **cuando** el usuario observa el llamador, **entonces** la pantalla refleja el cambio en tiempo real.
- [ ] **Dado** que no hay pacientes pendientes, **cuando** el usuario intenta llamar al próximo, **entonces** recibe un mensaje claro y no se genera un llamado vacío.
- [ ] **Dado** una pantalla pública de sala de espera, **cuando** se llama a un paciente, **entonces** la vista muestra información suficiente para orientarlo.
- [ ] **Dado** que un paciente no respondió al primer llamado, **cuando** el usuario lo re-llama, **entonces** el sistema conserva la consistencia de la cola y del historial.

### Comportamientos críticos
- El llamado del próximo paciente debe ser inmediato y fácil.
- El consultorio de destino debe quedar siempre visible.
- La cola no puede desordenarse por refrescos o llamados repetidos.
- La información pública debe ser útil sin exponer datos innecesarios.

### Métricas de impacto
- **Tiempo muerto entre pacientes**: baseline a validar → objetivo reducción del 30%.
- **Interrupciones de recepción para anunciar llamados**: baseline a validar → objetivo reducción significativa.
- **Pacientes confundidos sobre consultorio de destino**: baseline a validar → objetivo reducción sostenida.
- **Tiempo para convocar al siguiente paciente**: estimado actual manual 30-90 segundos → objetivo menor a 10 segundos.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cola desalineada con la realidad operativa del día | Media | Alto | Definir claramente qué pacientes son elegibles para ser llamados |
| Falta de claridad de estados para usuarios no entrenados | Media | Medio | Usar señales visibles y lenguaje simple |
| Exposición excesiva de datos en pantalla pública | Media | Alto | Limitar la información mostrada al mínimo necesario |
| Cambio frecuente de consultorio sin control | Baja | Medio | Hacer visible el consultorio activo antes de cada llamado |

---

## Preguntas Abiertas

- [ ] ¿La cola debe tomar solo pacientes presentes o también turnos programados aún no confirmados en recepción?
- [ ] ¿Qué dato del paciente puede mostrarse en sala de espera sin afectar privacidad: nombre completo, apellido e inicial, número de turno u otro identificador?
- [ ] ¿Hace falta contemplar varios consultorios llamando en simultáneo dentro de la misma pantalla pública?
- [ ] ¿El llamado debe vencer visualmente después de cierto tiempo si el paciente no responde?

---

*Generado por prd-creator · 2026-03-30*
