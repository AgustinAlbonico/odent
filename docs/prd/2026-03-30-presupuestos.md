# PRD: Presupuestos

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: media
> **Autor**: generado con prd-creator

---

## Problema

Antes de iniciar muchos tratamientos odontológicos, la clínica necesita presentar al paciente una propuesta económica clara. Sin un módulo de presupuestos, esa propuesta queda dispersa entre conversaciones, notas informales y prácticas todavía no aprobadas. Eso genera malentendidos sobre qué se va a hacer, cuánto va a costar, qué parte corresponde a cada práctica y hasta cuándo la propuesta sigue vigente.

El presupuesto no es solo un precio. Es un puente entre diagnóstico, plan de tratamiento, aceptación del paciente y ejecución clínica. Si ese puente no está bien resuelto, aparecen retrabajos, pérdida de oportunidades de cierre, discusiones por montos desactualizados y dificultad para transformar una intención de tratamiento en acciones concretas. El sistema necesita ordenar el armado de la propuesta, sus estados, su vencimiento y su relación con las prácticas y tratamientos que luego se van a ejecutar.

---

## Usuarios

### Usuario principal
- **Quién**: Profesional odontológico
- **Necesidad**: Armar una propuesta económica profesional y entendible para el paciente a partir del plan de tratamiento.
- **Dolor actual**: Puede terminar explicando varias veces lo mismo, recalculando valores o perdiendo control de qué prácticas fueron realmente aprobadas.

### Usuarios secundarios
- **Recepción / administración**: Necesita consultar si un presupuesto fue aprobado, venció o sigue pendiente antes de coordinar próximos pasos.
- **Dirección de la clínica / asociación**: Necesita trazabilidad comercial y operativa de las propuestas emitidas.
- **Paciente**: Necesita entender qué tratamiento se propone, cuánto cuesta y hasta cuándo vale esa propuesta.

---

## Objetivos

### Objetivos de negocio
- Estandarizar cómo se presentan propuestas económicas dentro de la institución.
- Mejorar la conversión de presupuestos en tratamientos efectivamente iniciados.
- Reducir conflictos por montos ambiguos o presupuestos vencidos.
- Dar trazabilidad al vínculo entre presupuesto aprobado y prácticas/tratamientos posteriores.

### Objetivos de usuario
- El profesional arma un presupuesto sin rehacer manualmente el detalle del tratamiento.
- La administración identifica rápidamente si un presupuesto está pendiente, aprobado, rechazado o vencido.
- El paciente recibe una propuesta clara, ordenada y con vigencia explícita.

### No-objetivos (explícitos)
- No incluye firma digital avanzada del paciente en esta etapa.
- No incluye financiación compleja con múltiples cuotas automáticas.
- No incluye negociación colaborativa en línea entre paciente y clínica.
- No incluye facturación automática del tratamiento completo al aprobar el presupuesto.
- No incluye simulador financiero avanzado con intereses o promociones.

---

## Alcance

### Incluido en esta versión
- Búsqueda y listado de presupuestos por profesional, paciente y fecha.
- Creación de un nuevo presupuesto para un paciente.
- Armado de propuesta económica a partir de prácticas y/o tratamientos.
- Visualización de detalle por ítems de la propuesta.
- Cálculo del monto total presupuestado.
- Gestión de estados del presupuesto.
- Registro de aprobación o rechazo por parte del paciente.
- Registro de fecha de vencimiento.
- Identificación de presupuestos vencidos.
- Trazabilidad entre presupuesto y prácticas/tratamientos involucrados.
- Consulta histórica de presupuestos por paciente.

### Fuera de alcance (explícito)
- Pago online del presupuesto.
- Planes de cuotas automatizados.
- Gestión contractual legal más allá de la aceptación del presupuesto.
- Envío automático por canales externos en esta versión.
- Reajuste automático por inflación una vez emitido.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-001] Buscar presupuestos**
  **Descripción**: El sistema permite consultar presupuestos por profesional, paciente y rango de fechas.
  **Criterio de aceptación**: **Dado** que existen presupuestos emitidos, **cuando** el usuario aplica filtros de profesional, paciente o fecha, **entonces** el sistema muestra solo los presupuestos que cumplen esos criterios.

- **[RF-002] Crear nuevo presupuesto**
  **Descripción**: El profesional puede iniciar un nuevo presupuesto para un paciente.
  **Criterio de aceptación**: **Dado** que el profesional atiende a un paciente que requiere propuesta económica, **cuando** elige crear un presupuesto, **entonces** el sistema abre un nuevo presupuesto asociado a ese paciente.

- **[RF-003] Vincular presupuesto con paciente y profesional**
  **Descripción**: Todo presupuesto debe quedar identificado con el paciente y el profesional responsable.
  **Criterio de aceptación**: **Dado** que se crea un presupuesto, **cuando** se guarda la propuesta, **entonces** el sistema deja registrada la relación con el paciente y con el profesional emisor.

- **[RF-004] Armar propuesta con prácticas o tratamientos**
  **Descripción**: El presupuesto debe poder construirse como una propuesta compuesta por prácticas individuales, grupos de prácticas o tratamientos definidos por el profesional.
  **Criterio de aceptación**: **Dado** que el profesional está armando un presupuesto, **cuando** agrega prácticas o tratamientos, **entonces** el sistema incorpora esos ítems al detalle del presupuesto.

- **[RF-005] Mostrar detalle de la propuesta**
  **Descripción**: El paciente y la clínica deben poder entender qué incluye el presupuesto y cómo se compone.
  **Criterio de aceptación**: **Dado** que un presupuesto tiene ítems cargados, **cuando** se visualiza, **entonces** el sistema muestra el detalle de prácticas o tratamientos incluidos.

- **[RF-006] Calcular monto total del presupuesto**
  **Descripción**: El sistema consolida el valor total de la propuesta a partir de sus ítems.
  **Criterio de aceptación**: **Dado** que el profesional agregó uno o más ítems al presupuesto, **cuando** revisa el resumen económico, **entonces** el sistema muestra el total presupuestado resultante.

- **[RF-007] Gestionar estados del presupuesto**
  **Descripción**: El presupuesto debe tener estados operativos claros para seguimiento.
  **Criterio de aceptación**: **Dado** que un presupuesto existe, **cuando** se consulta o actualiza, **entonces** el sistema lo identifica dentro de un estado visible y consistente.

- **[RF-008] Estados mínimos del presupuesto**
  **Descripción**: La operación necesita como mínimo estados de borrador, pendiente de respuesta, aprobado, rechazado, vencido y anulado.
  **Criterio de aceptación**: **Dado** que la clínica gestiona el ciclo de vida del presupuesto, **cuando** el presupuesto cambia de situación, **entonces** el sistema permite ubicarlo en uno de esos estados operativos.

- **[RF-009] Registrar aprobación del presupuesto**
  **Descripción**: La clínica debe poder registrar que el paciente aceptó la propuesta.
  **Criterio de aceptación**: **Dado** que el paciente acepta el tratamiento propuesto, **cuando** el usuario registra esa decisión, **entonces** el sistema marca el presupuesto como aprobado y conserva la fecha de aprobación.

- **[RF-010] Registrar rechazo del presupuesto**
  **Descripción**: También debe poder dejarse constancia cuando el paciente decide no avanzar.
  **Criterio de aceptación**: **Dado** que el paciente rechaza la propuesta, **cuando** el usuario registra esa decisión, **entonces** el sistema marca el presupuesto como rechazado.

- **[RF-011] Definir vencimiento del presupuesto**
  **Descripción**: Toda propuesta debe tener vigencia para evitar uso de valores fuera de término.
  **Criterio de aceptación**: **Dado** que el profesional emite un presupuesto, **cuando** lo deja listo para presentar, **entonces** el sistema exige una fecha de vencimiento o una regla equivalente de vigencia.

- **[RF-012] Marcar presupuesto vencido**
  **Descripción**: Cuando pasa la vigencia sin aprobación, el presupuesto debe reflejarlo claramente.
  **Criterio de aceptación**: **Dado** que un presupuesto no fue aprobado dentro de su vigencia, **cuando** se supera la fecha de vencimiento, **entonces** el sistema lo identifica como vencido.

- **[RF-013] Vincular presupuesto aprobado con prácticas o tratamientos a ejecutar**
  **Descripción**: Un presupuesto aprobado debe servir como referencia operativa del trabajo que luego se realizará.
  **Criterio de aceptación**: **Dado** que un presupuesto fue aprobado, **cuando** se consulta desde el contexto clínico u operativo, **entonces** el sistema muestra qué prácticas o tratamientos quedaron respaldados por esa aprobación.

- **[RF-014] Consultar histórico de presupuestos del paciente**
  **Descripción**: La institución necesita revisar propuestas anteriores para contexto comercial y clínico.
  **Criterio de aceptación**: **Dado** que un paciente tuvo presupuestos previos, **cuando** el usuario consulta su historial, **entonces** el sistema muestra esos presupuestos con su estado y vigencia.

### P1 — Importantes

- **[RF-015] Guardar presupuesto en borrador**
  **Descripción**: El profesional debe poder dejar una propuesta incompleta para retomarla después.
  **Criterio de aceptación**: **Dado** que el profesional todavía no terminó de definir la propuesta, **cuando** decide guardar sin presentar, **entonces** el sistema conserva el presupuesto en estado borrador.

- **[RF-016] Duplicar o reutilizar una propuesta previa**
  **Descripción**: Para tratamientos parecidos, el sistema puede ahorrar tiempo reutilizando una estructura anterior.
  **Criterio de aceptación**: **Dado** que existe un presupuesto previo relevante, **cuando** el profesional decide reutilizarlo, **entonces** el sistema crea una nueva propuesta basada en ese antecedente.

- **[RF-017] Mostrar claramente vigencia y estado en listados**
  **Descripción**: Administración y recepción deben reconocer rápido si un presupuesto sigue utilizable.
  **Criterio de aceptación**: **Dado** que el usuario consulta el listado de presupuestos, **cuando** visualiza los resultados, **entonces** identifica fácilmente el estado y la fecha de vencimiento de cada uno.

- **[RF-018] Diferenciar aprobación parcial o total**
  **Descripción**: Algunos pacientes pueden aceptar solo parte del tratamiento propuesto.
  **Criterio de aceptación**: **Dado** que el paciente acepta solo una parte de la propuesta, **cuando** la clínica registra esa respuesta, **entonces** el sistema permite dejar trazado qué ítems quedaron aprobados y cuáles no.

- **[RF-019] Relacionar presupuesto con plan de tratamiento**
  **Descripción**: El presupuesto debe poder leerse como traducción económica del plan clínico.
  **Criterio de aceptación**: **Dado** que un tratamiento tiene sustento clínico previo, **cuando** el profesional arma el presupuesto, **entonces** puede relacionarlo con ese contexto terapéutico.

- **[RF-020] Permitir actualización de presupuesto antes de aprobación**
  **Descripción**: Mientras no haya sido aprobado o vencido, la propuesta puede requerir ajustes.
  **Criterio de aceptación**: **Dado** que un presupuesto sigue en borrador o pendiente, **cuando** el profesional modifica sus ítems o valores, **entonces** el sistema guarda la nueva versión operativa de la propuesta.

### P2 — Deseables

- **[RF-021] Priorizar presupuestos próximos a vencer**
  **Descripción**: La clínica puede necesitar actuar sobre propuestas cerca del vencimiento.
  **Criterio de aceptación**: **Dado** que hay presupuestos con vencimiento próximo, **cuando** el usuario consulta el listado, **entonces** el sistema los destaca para facilitar el seguimiento.

- **[RF-022] Indicar conversión de presupuesto a tratamiento activo**
  **Descripción**: La institución quiere saber si la aprobación efectivamente se transformó en trabajo clínico realizado.
  **Criterio de aceptación**: **Dado** que un presupuesto aprobado ya generó prácticas o tratamiento iniciado, **cuando** se revisa el presupuesto, **entonces** el sistema muestra esa relación.

- **[RF-023] Registrar motivo de rechazo o no avance**
  **Descripción**: Conocer por qué no cerró una propuesta puede aportar aprendizaje comercial y operativo.
  **Criterio de aceptación**: **Dado** que un presupuesto es rechazado o pierde vigencia, **cuando** el usuario registra el resultado, **entonces** el sistema permite dejar asentado un motivo opcional.

---

## Estados del Presupuesto

| Estado | Significado de negocio |
|--------|-------------------------|
| **Borrador** | La propuesta todavía se está armando y no fue presentada formalmente. |
| **Pendiente** | La propuesta fue emitida y está a la espera de respuesta del paciente. |
| **Aprobado** | El paciente aceptó la propuesta total o parcialmente. |
| **Rechazado** | El paciente decidió no avanzar con la propuesta. |
| **Vencido** | La propuesta perdió vigencia sin aprobación dentro del plazo definido. |
| **Anulado** | La clínica dejó sin efecto la propuesta por decisión interna o reemplazo. |

---

## Requisitos No Funcionales

- **Claridad comercial**: El presupuesto debe entenderse fácilmente por clínica y paciente.
- **Trazabilidad**: Debe poder reconstruirse qué se propuso, cuándo, por quién y con qué resultado.
- **Velocidad**: Armar un presupuesto habitual no debería interrumpir la consulta ni exigir recarga excesiva de datos.
- **Consistencia**: El estado del presupuesto y su vigencia no deben prestarse a interpretaciones ambiguas.
- **Continuidad operativa**: Un presupuesto aprobado debe servir de referencia concreta para el trabajo posterior.

---

## Flujos

### Flujo principal: Armado y presentación de presupuesto

1. El profesional identifica al paciente.
2. Inicia un nuevo presupuesto.
3. Agrega prácticas y/o tratamientos a la propuesta.
4. El sistema muestra el detalle y el monto total.
5. Se define la vigencia del presupuesto.
6. La propuesta se deja en estado pendiente para presentarla al paciente.

### Flujo: Aprobación del presupuesto

1. El paciente recibe la propuesta.
2. La clínica registra la respuesta.
3. Si acepta, el presupuesto pasa a aprobado.
4. Las prácticas o tratamientos aprobados quedan vinculados como referencia operativa.

### Flujo: Vencimiento del presupuesto

1. El presupuesto queda pendiente con una fecha de vencimiento.
2. Transcurre la vigencia sin aprobación.
3. El sistema lo marca como vencido.
4. La clínica decide si lo reemplaza, actualiza o descarta.

### Flujo: Rechazo del presupuesto

1. La clínica consulta el presupuesto pendiente.
2. Registra que el paciente no avanza.
3. El presupuesto pasa a rechazado.
4. El antecedente queda disponible para futuras consultas.

### Flujos alternativos

- **Presupuesto parcial**: el paciente aprueba solo algunas prácticas y eso debe quedar explícito.
- **Presupuesto reemplazado**: una nueva propuesta deja obsoleta a la anterior y la clínica necesita marcarla como anulada.
- **Presupuesto vencido con interés del paciente**: se requiere emitir uno nuevo con nueva vigencia.

### Flujos de error

- No se puede dejar pendiente un presupuesto sin paciente asociado.
- No se puede presentar un presupuesto sin ítems.
- No se puede considerar vigente un presupuesto sin fecha de vencimiento definida.
- No se debe permitir ejecutar como aprobada una propuesta vencida sin revisión previa.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** que el profesional arma una propuesta con varias prácticas, **cuando** la guarda, **entonces** el sistema calcula y muestra el total del presupuesto.
- [ ] **Dado** que un presupuesto fue presentado al paciente, **cuando** la clínica registra la respuesta positiva, **entonces** el sistema lo marca como aprobado.
- [ ] **Dado** que un presupuesto no fue aprobado antes de su fecha de vencimiento, **cuando** se supera esa fecha, **entonces** el sistema lo identifica como vencido.
- [ ] **Dado** que un presupuesto aprobado tiene prácticas asociadas, **cuando** se consulta su detalle, **entonces** el sistema muestra qué prácticas o tratamientos quedaron respaldados.
- [ ] **Dado** que un paciente tiene antecedentes de presupuestos, **cuando** el usuario busca su historial, **entonces** puede revisar estados, fechas y resultados previos.

### Comportamientos críticos
- Ningún presupuesto debe quedar sin estado operativo claro.
- Ningún presupuesto pendiente debe seguir tratándose como vigente una vez vencido.
- La aprobación del presupuesto debe poder rastrearse hasta las prácticas o tratamientos comprometidos.
- La clínica debe poder diferenciar una propuesta en preparación de una presentada al paciente.

### Métricas de impacto
- Porcentaje de presupuestos que pasan de pendiente a aprobado.
- Tiempo promedio entre emisión y respuesta del paciente.
- Cantidad de presupuestos vencidos sin seguimiento.
- Porcentaje de tratamientos iniciados que tienen presupuesto aprobado vinculado.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Presupuestos ambiguos o poco claros | Media | Alto | Detalle explícito de prácticas/tratamientos y total visible. |
| Uso de presupuestos vencidos | Alta | Medio | Estado de vencido visible y regla clara de vigencia. |
| Desalineación entre propuesta económica y tratamiento real | Media | Alto | Relación obligatoria entre presupuesto y prácticas/tratamientos. |
| Pérdida de seguimiento comercial | Alta | Medio | Estados consistentes y listado filtrable por paciente, profesional y fecha. |
| Rechazos sin aprendizaje posterior | Media | Bajo | Posibilidad de registrar motivo de no avance en una etapa deseable. |

---

## Dependencias del Negocio

- Registro confiable de pacientes.
- Catálogo o referencia de prácticas/tratamientos.
- Contexto clínico que justifique la propuesta.
- Circuito operativo capaz de consultar presupuestos antes de iniciar tratamientos.

---

## Preguntas Abiertas

- [ ] ¿La clínica necesita que el presupuesto refleje cobertura de mutual y aporte del paciente en una versión posterior?
- [ ] ¿La aprobación parcial debe transformarse automáticamente en una nueva propuesta recortada o solo dejar trazabilidad?
- [ ] ¿Hace falta distinguir presupuestos de ortodoncia, prótesis u otras líneas de tratamiento con reglas propias?
- [ ] ¿La institución quiere medir tasa de aprobación por profesional o por tipo de tratamiento?
- [ ] ¿Conviene conservar historial de versiones cuando se actualiza un presupuesto pendiente?
