# PRD: Depósitos

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: alta
> **Autor**: generado con prd-creator

---

## Problema

En odontología hay tratamientos que no se cobran de una sola vez, especialmente ortodoncia, prótesis y planes prolongados. En esos casos el paciente suele dejar pagos a cuenta antes de que el profesional cobre su parte. Si ese circuito no está ordenado, la clínica pierde trazabilidad, se atrasan reintegros, aparecen discusiones sobre montos ya entregados y se vuelve difícil saber qué plata sigue pendiente, qué ya venció y qué ya fue reintegrado.

Hoy el negocio necesita un módulo que ordene todo el ciclo del depósito: ingreso del pago a cuenta, identificación del tratamiento o motivo, fecha límite de reintegro, estado operativo, vencimiento automático y trazabilidad completa hasta su cierre. El objetivo no es solo “anotar plata”, sino sostener confianza entre paciente, administración y profesional con reglas claras y visibles.

**Situación actual**: se observó un flujo de depósitos con montos altos, detalles libres, fecha de depósito y fecha límite de reintegro, estados visibles y acción de reintegro. También hay evidencia de movimientos automáticos de vencimiento, pero el comportamiento completo todavía no está formalizado desde negocio.

---

## Usuarios

### Usuario principal
- **Quién**: Administración / recepción de caja.
- **Necesidad**: Registrar depósitos de pacientes, controlar vencimientos y ejecutar reintegros sin perder trazabilidad.
- **Dolor actual**: Si el seguimiento depende de memoria o revisión manual, se mezclan pagos pendientes, reintegros vencidos y depósitos ya liquidados.

### Usuarios secundarios
- **Profesional**: Necesita saber qué depósitos tiene asociados, cuáles ya están disponibles para reintegro y cuáles siguen pendientes.
- **Paciente**: Necesita que su pago a cuenta quede correctamente imputado al tratamiento acordado y que no se duplique ni se pierda.
- **Dirección / administración central**: Necesita auditar el circuito completo, controlar tiempos de reintegro y evitar diferencias de caja o conflictos internos.

---

## Objetivos

### Objetivos de negocio
- Formalizar un circuito único para depósitos a cuenta de tratamientos.
- Reducir a menos de 5 minutos el tiempo necesario para verificar el estado de un depósito frente a una consulta de paciente o profesional.
- Evitar depósitos sin fecha límite, sin detalle o sin responsable asociado.
- Disminuir reintegros fuera de plazo mediante alertas y vencimientos automáticos.
- Garantizar trazabilidad completa desde el cobro del depósito hasta su cierre por reintegro o vencimiento.

### Objetivos de usuario
- La recepción puede registrar un depósito en menos de 1 minuto con la información mínima indispensable.
- La administración puede ver rápidamente qué depósitos están pendientes, próximos a vencer o ya vencidos.
- El profesional puede entender por qué un depósito está en determinado estado sin depender de una explicación informal.

### No-objetivos (explícitos)
- No incluye financiamiento bancario ni cuotas con tarjeta emitidas por terceros.
- No incluye conciliación automática con extractos bancarios externos en esta versión.
- No incluye firma digital del paciente sobre el recibo del depósito.
- No incluye liquidación completa de honorarios del profesional, que pertenece a un circuito administrativo más amplio.

---

## Alcance

### Incluido en esta versión
- Registro de depósitos como pagos a cuenta de tratamientos.
- Asociación obligatoria del depósito a paciente, profesional y detalle de negocio.
- Definición de fecha de depósito y fecha límite de reintegro.
- Registro de medios de pago simples y combinados.
- Estados operativos del depósito durante todo su ciclo de vida.
- Acción de reintegro con cierre del depósito.
- Vencimiento automático al llegar la fecha límite según regla institucional.
- Búsqueda y filtros por profesional, paciente, estado, detalle y rango de fechas.
- Historial y trazabilidad de eventos del depósito.
- Visualización del total pendiente por profesional y por paciente.

### Fuera de alcance (explícito)
- Gestión de cheques rechazados o contracargos complejos — requiere reglas financieras específicas.
- Cálculo de intereses por mora del paciente — no forma parte del circuito observado.
- Facturación fiscal externa del depósito — corresponde a procesos administrativos complementarios.
- Reglas de comisiones avanzadas por convenio o sucursal — se analizarán en una etapa posterior.

---

## Definiciones de negocio

- **Depósito**: pago a cuenta que deja el paciente antes del cierre total del tratamiento.
- **Fecha límite de reintegro**: último día en que ese depósito puede quedar pendiente antes de que el sistema lo trate como vencido.
- **Reintegro**: entrega o imputación del monto al circuito correspondiente del profesional según la política de la institución.
- **Vencido**: depósito que alcanzó su plazo sin haber sido reintegrado o regularizado.
- **Trazabilidad**: registro entendible de quién hizo cada acción, cuándo la hizo y con qué resultado.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-701] Registrar depósito a cuenta**
  Descripción: La recepción o administración debe poder registrar un depósito asociado a un paciente y a un profesional, indicando detalle, importe, fecha del depósito y fecha límite de reintegro.
  Criterio de aceptación: **Dado** que un paciente deja un pago a cuenta de su tratamiento, **cuando** el usuario registra el depósito con paciente, profesional, detalle, importe y fechas obligatorias, **entonces** el depósito queda guardado en estado pendiente y visible en el listado general.

- **[RF-702] Exigir datos mínimos obligatorios**
  Descripción: No se puede registrar un depósito sin paciente, profesional, importe, detalle y fecha límite de reintegro.
  Criterio de aceptación: **Dado** que el usuario intenta guardar un depósito incompleto, **cuando** falta alguno de los datos obligatorios, **entonces** el sistema impide el alta y muestra qué información falta completar.

- **[RF-703] Manejar estados del depósito**
  Descripción: Todo depósito debe tener un estado claro y visible como mínimo entre Pendiente, Reintegrado, Vencido y Anulado.
  Criterio de aceptación: **Dado** que un depósito fue creado, **cuando** el usuario consulta su ficha o el listado, **entonces** puede ver el estado actual del depósito y ese estado coincide con la última acción válida realizada.

- **[RF-704] Registrar fecha límite de reintegro**
  Descripción: Cada depósito debe mostrar la fecha del pago y la fecha tope para su reintegro, ya que el plazo es parte central de la regla de negocio.
  Criterio de aceptación: **Dado** que un depósito fue cargado, **cuando** el usuario lo visualiza en el listado, **entonces** ve el rango formado por fecha de depósito y fecha límite de reintegro.

- **[RF-705] Ejecutar reintegro del depósito**
  Descripción: La administración debe poder marcar un depósito como reintegrado, dejando constancia de la fecha y del responsable de la acción.
  Criterio de aceptación: **Dado** que existe un depósito pendiente, **cuando** un usuario autorizado ejecuta la acción de reintegro, **entonces** el depósito cambia a estado reintegrado, deja registro del evento y deja de aparecer como pendiente.

- **[RF-706] Vencimiento automático**
  Descripción: Al llegar la fecha límite sin reintegro, el depósito debe pasar automáticamente a vencido o al estado que la institución defina como equivalente de cierre por plazo.
  Criterio de aceptación: **Dado** que un depósito alcanzó su fecha límite y no fue reintegrado, **cuando** se cumple la regla de vencimiento institucional, **entonces** el sistema actualiza su estado de forma automática y deja trazabilidad del cambio.

- **[RF-707] Soportar múltiples medios de pago**
  Descripción: El depósito debe poder registrarse con efectivo, cheque, transferencia, tarjeta u otra combinación simple que la clínica necesite documentar.
  Criterio de aceptación: **Dado** que el paciente paga con dos medios distintos, **cuando** el usuario registra el depósito detallando ambos medios y sus montos, **entonces** el depósito conserva el total y la composición del pago queda visible para consulta posterior.

- **[RF-708] Trazabilidad completa del depósito**
  Descripción: Cada depósito debe conservar historial de alta, cambios, reintegro, vencimiento, anulación y observaciones relevantes.
  Criterio de aceptación: **Dado** que un depósito tuvo movimientos durante su ciclo de vida, **cuando** un usuario autorizado consulta su historial, **entonces** puede ver la secuencia de eventos con fecha, responsable, acción y resultado.

### P1 — Importantes

- **[RF-709] Buscar y filtrar depósitos**
  Descripción: El módulo debe permitir encontrar depósitos por profesional, paciente, estado, texto del detalle y rango de fechas.
  Criterio de aceptación: **Dado** que la clínica tiene cientos de depósitos registrados, **cuando** el usuario filtra por profesional y estado pendiente, **entonces** el sistema muestra solo los depósitos que cumplen ambos criterios.

- **[RF-710] Detalle libre orientado a negocio**
  Descripción: El depósito debe permitir un detalle descriptivo que explique claramente el motivo del pago, por ejemplo ortodoncia, prótesis o anticipo de honorarios.
  Criterio de aceptación: **Dado** que la recepción registra un depósito, **cuando** escribe una descripción de negocio entendible, **entonces** ese detalle queda visible en listados, búsquedas y comprobantes internos.

- **[RF-711] Visualizar próximos vencimientos**
  Descripción: La administración debe poder identificar qué depósitos vencen dentro de un rango próximo definido por la institución.
  Criterio de aceptación: **Dado** que existen depósitos con vencimiento en los próximos días, **cuando** el usuario consulta la vista de control, **entonces** el sistema resalta cuáles requieren atención prioritaria.

- **[RF-712] Mostrar resumen por profesional**
  Descripción: El sistema debe informar cuánto dinero tiene cada profesional en depósitos pendientes, reintegrados y vencidos para facilitar seguimiento.
  Criterio de aceptación: **Dado** que un profesional tiene varios depósitos activos, **cuando** administración filtra por ese profesional, **entonces** puede ver el total acumulado por estado sin revisar caso por caso.

- **[RF-713] Mostrar resumen por paciente**
  Descripción: Debe poder verse si un paciente tiene depósitos activos, vencidos o ya reintegrados como parte de su relación financiera con la clínica.
  Criterio de aceptación: **Dado** que un paciente realizó varios pagos a cuenta, **cuando** el usuario consulta sus depósitos, **entonces** puede ver el historial completo y los montos agrupados por estado.

- **[RF-714] Anular depósito con motivo**
  Descripción: Si un depósito fue cargado por error, debe poder anularse sin borrar el historial y dejando explicación obligatoria.
  Criterio de aceptación: **Dado** que un usuario detecta un depósito ingresado incorrectamente, **cuando** selecciona anular e informa el motivo, **entonces** el depósito pasa a anulado y el historial conserva la causa de esa decisión.

- **[RF-715] Evitar doble reintegro**
  Descripción: Un depósito ya reintegrado, vencido o anulado no puede volver a reintegrarse.
  Criterio de aceptación: **Dado** que un depósito ya está cerrado, **cuando** un usuario intenta reintegrarlo nuevamente, **entonces** el sistema bloquea la acción y explica que ese depósito ya no admite reintegro.

### P2 — Deseables

- **[RF-716] Alertas internas por vencimiento**
  Descripción: El sistema puede emitir avisos internos para ayudar a la administración a actuar antes del vencimiento.
  Criterio de aceptación: **Dado** que un depósito vence dentro del umbral configurado, **cuando** el usuario ingresa al módulo, **entonces** visualiza una alerta o señal destacada sobre ese depósito.

- **[RF-717] Adjuntar referencia del comprobante**
  Descripción: Debe ser posible guardar una referencia corta del comprobante o del instrumento de pago para facilitar auditoría.
  Criterio de aceptación: **Dado** que el depósito se hizo por cheque o transferencia, **cuando** el usuario ingresa la referencia correspondiente, **entonces** esa referencia queda disponible para consulta posterior.

- **[RF-718] Distinguir depósitos por categoría de tratamiento**
  Descripción: La clínica puede clasificar depósitos por categorías como ortodoncia, prótesis, cirugía o varios para análisis operativo.
  Criterio de aceptación: **Dado** que la institución quiere separar depósitos por rubro, **cuando** el usuario elige una categoría al registrar el depósito, **entonces** el depósito queda disponible para filtros y reportes por categoría.

---

## Requisitos No Funcionales

- **Velocidad operativa**: El listado filtrado de depósitos debe abrirse en menos de 2 segundos en horario de trabajo habitual.
- **Claridad**: El usuario debe entender el estado de un depósito sin tener que abrir varias pantallas.
- **Confiabilidad**: Ningún depósito debe desaparecer del historial por haber sido anulado o vencido.
- **Auditabilidad**: Cualquier revisión administrativa debe poder reconstruir el ciclo de vida del depósito en pocos minutos.
- **Consistencia**: Los importes deben mostrarse siempre en moneda local, con fechas en formato argentino y estado visible en cada vista relevante.

---

## Flujos

### Flujo principal — Registrar un depósito
1. La recepción identifica al paciente y al profesional vinculado al tratamiento.
2. Registra el importe, el detalle del pago a cuenta y la fecha límite de reintegro.
3. Indica el medio de pago o combinación de medios.
4. Guarda el depósito.
5. El sistema lo deja en estado pendiente y lo incorpora al seguimiento operativo.

### Flujo — Reintegrar un depósito
1. La administración filtra depósitos pendientes.
2. Selecciona el depósito correspondiente.
3. Ejecuta la acción de reintegro.
4. El sistema registra fecha, responsable y cierre del depósito.
5. El depósito deja de formar parte de los pendientes.

### Flujo — Vencimiento automático
1. El depósito permanece pendiente hasta su fecha límite.
2. Si no se reintegró a tiempo, se activa la regla de vencimiento institucional.
3. El sistema cambia el estado a vencido.
4. Se deja trazabilidad del evento para revisión posterior.

### Flujo alternativo — Pago con medios combinados
1. El paciente paga parte en efectivo y parte en cheque o transferencia.
2. La recepción carga ambos componentes del pago.
3. El sistema conserva el total y el desglose.
4. El detalle queda disponible para auditoría y consultas futuras.

### Flujos de error
**Intento de reintegrar un depósito cerrado**
Condición: El depósito ya está reintegrado, vencido o anulado.
Comportamiento esperado: El sistema bloquea la acción y explica por qué no corresponde continuar.

**Alta con datos incompletos**
Condición: Faltan datos obligatorios del depósito.
Comportamiento esperado: El sistema no guarda el depósito y señala claramente qué falta completar.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** un paciente que deja un pago a cuenta, **cuando** administración registra el depósito completo, **entonces** queda visible en estado pendiente con su fecha límite.
- [ ] **Dado** un depósito pendiente, **cuando** se ejecuta el reintegro, **entonces** cambia a reintegrado y conserva trazabilidad del evento.
- [ ] **Dado** un depósito cuyo plazo venció, **cuando** se cumple la regla institucional, **entonces** el estado cambia automáticamente a vencido.
- [ ] **Dado** un depósito con pago mixto, **cuando** el usuario consulta el detalle, **entonces** puede ver la composición del importe por medio de pago.
- [ ] **Dado** una auditoría interna, **cuando** se revisa un depósito, **entonces** se puede reconstruir todo su historial de acciones.

### Comportamientos críticos
- Ningún depósito puede quedar sin estado visible.
- Ningún depósito cerrado puede reintegrarse dos veces.
- La fecha límite de reintegro debe estar siempre presente y ser operativamente útil.
- El historial del depósito debe sobrevivir a anulaciones, reintegros y vencimientos.

### Métricas de impacto
- **Depósitos con estado ambiguo**: situación actual no formalizada → objetivo 0 casos.
- **Tiempo para responder una consulta sobre un depósito**: estimado actual 10-15 minutos → objetivo menor a 5 minutos.
- **Depósitos vencidos sin seguimiento**: baseline a validar → objetivo reducción del 80%.
- **Diferencias administrativas por falta de trazabilidad**: baseline a validar → objetivo reducción sostenida mes a mes.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cargar depósitos con detalle poco claro | Media | Alto | Estandarizar reglas mínimas de descripción y capacitación operativa |
| Ejecutar reintegros fuera de plazo sin visibilidad | Media | Alto | Resaltar próximos vencimientos y estados críticos |
| Confusión entre depósito, cobro y liquidación final | Alta | Alto | Separar claramente conceptos y estados en el lenguaje del módulo |
| Uso inconsistente de medios de pago | Media | Medio | Definir catálogo simple y validaciones básicas al alta |

---

## Preguntas Abiertas

- [ ] ¿La fecha límite de reintegro será fija por institución, configurable por depósito o derivada del tipo de tratamiento?
- [ ] ¿Un depósito vencido puede regularizarse manualmente o debe quedar cerrado de forma definitiva?
- [ ] ¿La clínica necesita distinguir reintegro parcial vs. reintegro total en una versión futura?
- [ ] ¿Hace falta emitir un comprobante interno específico de depósito para entregar al paciente?

---

*Generado por prd-creator · 2026-03-30*
