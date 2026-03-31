# PRD: Cuenta Corriente / Contabilidad

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: muy alta
> **Autor**: generado con prd-creator

---

## Problema

La clínica no puede administrar su operación económica con cobros aislados o planillas separadas de la práctica diaria. En este negocio, cada venta, cada cobro, cada pago, cada honorario, cada depósito y cada comisión tiene impacto directo en la rentabilidad, en la relación con los profesionales y en la trazabilidad frente a auditorías internas. Si la cuenta corriente está desconectada del trabajo clínico, aparecen cajas que no cierran, deudas que no se explican, liquidaciones discutibles y horas perdidas conciliando información.

Además, el contexto observado exige un nivel de orden superior al de un simple registro de caja: hay ventas de coseguros, descartables, estampillas y recetas; cobros a pacientes; pagos a proveedores; liquidaciones de honorarios; depósitos con vencimiento y reintegro; reportes de mayor, saldos, arqueo y centro de costos; y un modelo contable de partida doble que permite explicar cada movimiento. El producto tiene que sostener esa complejidad sin volverse opaco para quien lo usa todos los días.

**Situación actual**: la operación relevada ya muestra un módulo contable robusto con vender, cobrar, pagar, centro de costos, plan de cuentas, transacciones, órdenes, comisiones y reportes. El desafío de este PRD es dejar definido el alcance de negocio para una experiencia contable completa, auditable y entendible por recepción, administración, dirección y profesionales.

---

## Usuarios

### Usuario principal
- **Quién**: Administración / caja
- **Necesidad**: Registrar ventas, cobros, pagos y cierres de caja con trazabilidad completa y sin tener que reconstruir a mano qué pasó.
- **Dolor actual**: Cuando la registración financiera no está claramente conectada con pacientes, profesionales, órdenes y conceptos de negocio, el cierre diario y la explicación de saldos se vuelven lentos, discutibles y riesgosos.

### Usuarios secundarios
- **Profesional odontólogo**: Necesita entender qué se le vendió al paciente, cuánto se cobró, qué honorarios tiene pendientes y qué retiros o depósitos impactan en su cuenta.
- **Dirección / gestión**: Necesita visibilidad sobre ingresos, egresos, comisiones, centros de costos y evolución económica para tomar decisiones.
- **Recepción**: Necesita cobrar rápido al paciente, emitir recibos y consultar deuda o saldo sin fricción.
- **Proveedor**: Impacta indirectamente porque la clínica necesita registrar deudas y pagos con respaldo y orden.

---

## Objetivos

### Objetivos de negocio
- Lograr trazabilidad económica completa desde el hecho de negocio hasta su reflejo contable.
- Reducir diferencias de caja y tiempos de conciliación diaria.
- Tener una base confiable para liquidar honorarios, controlar comisiones y administrar proveedores.
- Permitir análisis de rentabilidad por concepto, profesional y centro de costos.
- Sostener un modelo contable por partida doble que explique cada movimiento sin ambigüedad.

### Objetivos de usuario
- La recepción puede vender o cobrar en pocos pasos y con contexto claro del paciente.
- Administración puede pagar honorarios, proveedores y retiros con respaldo y trazabilidad.
- Dirección puede revisar arqueo, mayor, saldos, reportes y centro de costos sin depender de planillas paralelas.
- El profesional puede entender por qué su cuenta cambia y qué movimientos la componen.

### No-objetivos (explícitos)
- No incluye presentación impositiva ante organismos externos en esta versión.
- No incluye gestión bancaria avanzada ni conciliación automática con extractos bancarios.
- No incluye nómina salarial general de empleados fuera de honorarios profesionales y pagos vinculados a la operación.
- No incluye presupuesto financiero anual de la institución.

---

## Alcance

### Incluido en esta versión
- Cuenta corriente vinculada a pacientes, profesionales, proveedores y conceptos de negocio.
- Registro de ventas de coseguros, descartables, estampillas y recetas.
- Registro de cobros a pacientes y otros ingresos definidos por la institución.
- Registro de pagos de honorarios, proveedores, retiros y egresos varios.
- Modelo contable por partida doble con plan de cuentas.
- Detalle de transacción con asientos de debe y haber.
- Centro de costos con resumen, movimientos y saldos.
- Arqueo de caja y control de cierre.
- Reportes de mayor, saldos de cuentas, transacciones, recibos y órdenes.
- Configuración de comisiones por defecto y por profesional.
- Gestión de proveedores.
- Gestión de órdenes y reportes por profesional o detalle.
- Trazabilidad completa entre movimiento, operador, profesional, paciente y concepto.
- Soporte para depósitos cobrados y su seguimiento dentro del circuito económico.

### Fuera de alcance (explícito)
- Facturación fiscal electrónica ante organismos externos — requiere definiciones regulatorias aparte.
- Pagos automáticos con pasarelas o débito recurrente — queda para una etapa posterior.
- Multi-moneda — esta versión se concentra en operación local en pesos.
- Gestión de stock físico detallado de insumos — solo se contempla su impacto económico cuando corresponde vender o pagar.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-601] Modelo contable por partida doble**
  Descripción: Todo movimiento económico debe registrarse mediante al menos dos impactos complementarios dentro del plan de cuentas para explicar origen y destino del valor.
  Criterio de aceptación: Dado que administración registra un movimiento económico, cuando confirma la operación, entonces el sistema deja trazados sus asientos correspondientes de debe y haber de forma equilibrada.

- **[RF-602] Plan de cuentas institucional**
  Descripción: La clínica debe disponer de un plan de cuentas organizado por grandes grupos como activo, pasivo, ingresos y egresos, con subcuentas que reflejen la realidad del negocio odontológico.
  Criterio de aceptación: Dado que dirección o administración consulta el plan de cuentas, cuando navega la estructura, entonces visualiza cuentas y subcuentas suficientes para representar caja, deudores, proveedores, honorarios, ingresos por servicios y otros conceptos de la clínica.

- **[RF-603] Venta de coseguros**
  Descripción: Debe poder registrarse la venta de coseguros vinculados a la atención del paciente para dejar constancia de la deuda o del cargo generado.
  Criterio de aceptación: Dado que un paciente recibe una práctica con coseguro, cuando el usuario registra la venta de coseguro, entonces la cuenta corriente refleja ese cargo y queda trazado el movimiento contable asociado.

- **[RF-604] Venta de descartables, estampillas y recetas**
  Descripción: La clínica debe poder registrar ventas administrativas adicionales al acto clínico principal, como descartables, estampillas y recetas.
  Criterio de aceptación: Dado que corresponde cobrar un concepto adicional al paciente, cuando el usuario selecciona el tipo de venta y la confirma, entonces el sistema registra el cargo correcto en la cuenta corriente y en contabilidad.

- **[RF-605] Cobro a paciente**
  Descripción: Debe ser posible registrar pagos recibidos de pacientes sobre conceptos adeudados o pagos generales vinculados a su cuenta corriente.
  Criterio de aceptación: Dado que un paciente realiza un pago, cuando recepción o administración lo registra, entonces la deuda o saldo del paciente se actualiza y la caja refleja el ingreso correspondiente.

- **[RF-606] Pago de honorarios al profesional**
  Descripción: Administración debe poder liquidar y registrar honorarios profesionales con impacto contable y trazabilidad del profesional involucrado.
  Criterio de aceptación: Dado que corresponde pagar honorarios a un profesional, cuando administración confirma el pago, entonces el sistema genera el egreso, actualiza la cuenta relacionada y deja identificado al profesional afectado.

- **[RF-607] Pago a proveedores**
  Descripción: La clínica debe poder registrar pagos a proveedores diferenciando conceptos como descartables, estampillas y otros proveedores.
  Criterio de aceptación: Dado que la institución realiza un pago a proveedor, cuando administración lo registra seleccionando el proveedor y el concepto, entonces el sistema deja asentado el egreso y reduce la obligación correspondiente.

- **[RF-608] Retiros de dinero**
  Descripción: Debe existir un flujo específico para registrar retiros de dinero con trazabilidad del responsable y del motivo económico.
  Criterio de aceptación: Dado que se realiza un retiro de dinero, cuando el usuario autorizado lo registra, entonces el movimiento queda impactado en la caja y en la cuenta contable correspondiente con su detalle identificable.

- **[RF-609] Arqueo de caja**
  Descripción: El módulo debe ofrecer un reporte de arqueo que permita verificar el estado de caja y revisar su consistencia frente a la operatoria registrada.
  Criterio de aceptación: Dado que administración realiza el cierre o control de caja, cuando consulta el arqueo, entonces obtiene el saldo y el detalle necesario para validar si la caja coincide con los movimientos del período.

- **[RF-610] Detalle de transacción con trazabilidad completa**
  Descripción: Cada transacción debe mostrar fecha, estado, operador, detalle, paciente, profesional y asientos contables involucrados.
  Criterio de aceptación: Dado que un usuario autorizado abre el detalle de una transacción, cuando la consulta, entonces ve toda la trazabilidad del movimiento y sus asientos en lenguaje entendible para control administrativo.

- **[RF-611] Mayor de cuentas**
  Descripción: Debe poder consultarse el mayor de cada cuenta para entender cómo se compone su saldo a lo largo del tiempo.
  Criterio de aceptación: Dado que administración revisa una cuenta contable, cuando accede al mayor, entonces ve los movimientos históricos asociados a esa cuenta con fecha, concepto y saldo resultante.

- **[RF-612] Saldos de cuentas**
  Descripción: El sistema debe mostrar saldos de cuentas para tener una visión resumida del estado económico por cuenta y por filtros relevantes.
  Criterio de aceptación: Dado que la dirección quiere revisar la posición económica, cuando consulta saldos de cuentas, entonces obtiene una vista resumida y filtrable de los saldos disponibles.

### P1 — Importantes

- **[RF-613] Centro de costos con resumen ejecutivo**
  Descripción: La clínica debe poder agrupar información económica en centros de costos para analizar ingresos, comisiones y desempeño por agrupación relevante.
  Criterio de aceptación: Dado que dirección ingresa al centro de costos, cuando consulta el resumen, entonces visualiza acumulados y valores diarios por los conceptos definidos por la institución.

- **[RF-614] Movimientos y saldos por centro de costos**
  Descripción: El centro de costos debe permitir profundizar desde el resumen hacia el detalle de movimientos y saldos según filtros de profesional, paciente, mutual, proveedor y período.
  Criterio de aceptación: Dado que el usuario necesita analizar un centro de costos específico, cuando aplica filtros y consulta movimientos o saldos, entonces obtiene el detalle correspondiente para ese recorte.

- **[RF-615] Reporte general de transacciones**
  Descripción: Debe existir una vista consolidada de transacciones para seguimiento operativo y auditoría interna.
  Criterio de aceptación: Dado que administración necesita revisar el movimiento general, cuando consulta el reporte de transacciones, entonces puede listar operaciones por rango de fechas y navegar a sus detalles.

- **[RF-616] Recibos asociados a cobros**
  Descripción: Los cobros deben poder dejar respaldo documental mediante recibos consultables.
  Criterio de aceptación: Dado que se registra un cobro, cuando el usuario revisa los recibos emitidos, entonces encuentra el comprobante correspondiente vinculado al movimiento.

- **[RF-617] Comisiones por defecto**
  Descripción: La institución debe poder definir reglas generales de comisión por tipo de operación para sostener un criterio uniforme de liquidación.
  Criterio de aceptación: Dado que administración consulta la configuración de comisiones, cuando revisa los valores por defecto, entonces encuentra las reglas base para coseguros, estampillas, recetas, depósitos u otros conceptos definidos.

- **[RF-618] Comisiones por profesional**
  Descripción: La clínica debe poder personalizar comisiones por profesional para reflejar acuerdos particulares.
  Criterio de aceptación: Dado que un profesional tiene una condición distinta a la general, cuando administración configura sus comisiones específicas, entonces los movimientos posteriores respetan esa parametrización individual.

- **[RF-619] Gestión de proveedores**
  Descripción: Debe existir un padrón de proveedores para asociar pagos y consultas económicas a un tercero identificado.
  Criterio de aceptación: Dado que administración necesita registrar o consultar operaciones con un proveedor, cuando accede al padrón, entonces puede ubicarlo y relacionarlo con sus pagos correspondientes.

- **[RF-620] Gestión de órdenes**
  Descripción: El módulo debe contemplar órdenes como entidad administrable y reportable, útil para seguimiento operativo y liquidación.
  Criterio de aceptación: Dado que administración revisa órdenes, cuando consulta el detalle o el reporte por profesional, entonces puede filtrar por período, tipo, estado, profesional, paciente y mutual.

- **[RF-621] Cuenta corriente por paciente**
  Descripción: Desde el contexto del paciente debe poder consultarse su mayor o detalle económico para revisar cargos, cobros y saldo.
  Criterio de aceptación: Dado que un usuario consulta la cuenta corriente de un paciente, cuando abre su detalle económico, entonces ve los movimientos vinculados a ese paciente con trazabilidad suficiente para explicarlos.

- **[RF-622] Registro de operador responsable**
  Descripción: Cada movimiento económico debe identificar quién lo cargó o ejecutó para sostener control interno.
  Criterio de aceptación: Dado que se registra una venta, cobro, pago o anulación, cuando luego se revisa ese movimiento, entonces se identifica el operador responsable de la acción.

### P2 — Deseables

- **[RF-623] Órdenes por profesional**
  Descripción: Debe existir un reporte específico para revisar órdenes agrupadas por profesional en un período.
  Criterio de aceptación: Dado que dirección quiere analizar la actividad de un profesional, cuando ejecuta el reporte de órdenes por profesional, entonces obtiene el detalle correspondiente para el rango seleccionado.

- **[RF-624] Comparativa diaria y acumulada en centro de costos**
  Descripción: El resumen del centro de costos debería mostrar valores del día y acumulados para lectura gerencial rápida.
  Criterio de aceptación: Dado que la dirección consulta el resumen del centro de costos, cuando abre el tablero, entonces puede comparar valores diarios con acumulados sin salir de la pantalla.

- **[RF-625] Seguimiento económico de depósitos**
  Descripción: Los depósitos cobrados y su evolución deben formar parte de la trazabilidad económica de la institución.
  Criterio de aceptación: Dado que la clínica registra depósitos a cuenta, cuando administración revisa transacciones o cuentas relacionadas, entonces puede identificar el movimiento de cobro y su impacto posterior.

- **[RF-626] Anulación controlada de transacciones**
  Descripción: La anulación de movimientos debe ser una acción explícita, restringida y trazable, preservando el historial económico.
  Criterio de aceptación: Dado que un usuario autorizado necesita dejar sin efecto una transacción, cuando ejecuta la anulación, entonces el sistema conserva la trazabilidad del hecho original y del acto de anularlo.

- **[RF-627] Atajos para acciones contables frecuentes**
  Descripción: Las acciones de vender, cobrar y pagar deberían tener accesos rápidos para acelerar tareas repetitivas de operación diaria.
  Criterio de aceptación: Dado que recepción o administración realiza muchas operaciones similares en la jornada, cuando utiliza un acceso rápido habilitado, entonces inicia la acción contable correspondiente sin recorrer menús extensos.

---

## Requisitos No Funcionales

- **Velocidad operativa**: vender, cobrar o pagar no debería demandar más de 1 minuto en una operación estándar con datos ya conocidos.
- **Confiabilidad**: el arqueo y los saldos deben poder explicarse siempre desde movimientos registrados, sin ajustes manuales invisibles.
- **Auditabilidad**: cada movimiento debe contar con suficiente contexto para ser entendido semanas o meses después.
- **Claridad**: recepción y administración deben comprender qué tipo de operación están registrando y a quién afecta.
- **Seguridad**: no todos los usuarios pueden registrar, anular o consultar la misma información económica.
- **Continuidad**: el cierre de caja y la liquidación de honorarios no deben depender de planillas externas para funcionar.

---

## Flujos

### Flujo principal — Vender, cobrar y cerrar trazabilidad del paciente

1. El paciente recibe una atención con un concepto cobrable.
2. Recepción o administración registra la venta correspondiente, por ejemplo un coseguro.
3. La cuenta corriente del paciente incorpora el cargo.
4. El paciente realiza el pago total o parcial.
5. El usuario registra el cobro.
6. El sistema actualiza caja, deuda o saldo del paciente y deja el comprobante correspondiente.
7. El movimiento queda disponible para consulta en transacciones, mayor y reportes.
8. Resultado: el hecho económico queda completamente explicado desde el origen hasta su reflejo contable.

### Flujo — Pago de honorarios al profesional

1. Administración identifica honorarios pendientes.
2. Selecciona el profesional y el concepto a liquidar.
3. Registra el pago de honorarios.
4. El sistema genera el egreso, actualiza cuentas relacionadas y deja trazabilidad del profesional y del operador.
5. La operación queda visible en transacciones, mayor y reportes.

### Flujo — Pago a proveedor

1. Administración consulta el padrón de proveedores o accede directamente desde la acción de pago.
2. Selecciona el proveedor y el tipo de gasto.
3. Registra el pago.
4. El sistema actualiza el egreso y las cuentas involucradas.
5. El pago queda trazado para futuras revisiones.

### Flujo — Arqueo de caja

1. Administración abre el reporte de arqueo en el período a controlar.
2. Revisa saldo, ingresos y egresos registrados.
3. Contrasta la información con la realidad operativa de caja.
4. Si detecta diferencias, profundiza en transacciones y mayor para explicarlas.
5. Resultado: la caja queda validada o se identifican desvíos concretos a revisar.

### Flujo — Análisis por centro de costos

1. Dirección abre el resumen de centro de costos.
2. Observa acumulados y valores diarios por concepto relevante.
3. Entra al detalle de movimientos o saldos para un centro específico.
4. Filtra por profesional, paciente, mutual, proveedor y período según necesidad.
5. Usa el resultado para controlar rendimiento y decisiones de negocio.

### Flujo — Consulta del detalle de una transacción

1. El usuario encuentra una transacción en el listado general, en el mayor o desde otro reporte.
2. Abre el detalle de la transacción.
3. Revisa fecha, estado, operador, detalle, paciente, profesional y asientos.
4. Si corresponde y tiene permiso, evalúa su anulación o seguimiento.
5. Resultado: el movimiento queda completamente entendible y auditable.

### Flujos alternativos

**Cobro sin venta inmediata previa visible**
Condición: el paciente paga sobre una deuda ya existente o un saldo previo.
1. El usuario busca la cuenta corriente del paciente.
2. Identifica el saldo o la deuda pendiente.
3. Registra el cobro correspondiente.
Resultado: la cuenta corriente se actualiza sin necesidad de duplicar el cargo original.

**Configuración de comisión diferencial por profesional**
Condición: un profesional tiene una regla económica distinta a la general.
1. Administración consulta comisiones por profesional.
2. Ajusta los valores específicos del profesional.
3. Guarda la configuración.
Resultado: las futuras operaciones relacionadas respetan esa regla especial.

### Flujos de error

**Movimiento sin trazabilidad suficiente**
Condición: falta paciente, profesional, proveedor o detalle clave para entender la operación.
Comportamiento esperado: el sistema impide confirmar la registración o advierte con claridad que faltan datos indispensables para sostener la trazabilidad.

**Caja que no cierra**
Condición: el arqueo detecta diferencia respecto de los movimientos registrados.
Comportamiento esperado: el sistema permite profundizar por transacciones, fechas y operadores para identificar la diferencia sin obligar a un ajuste invisible.

**Usuario sin permiso de anulación**
Condición: un usuario intenta anular una transacción sin autorización suficiente.
Comportamiento esperado: la acción se bloquea y el sistema informa que no cuenta con permisos para dejar sin efecto ese movimiento.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] Dado que administración registra una venta, cuando confirma la operación, entonces la cuenta corriente afectada y la registración contable quedan alineadas.
- [ ] Dado que recepción registra un cobro a paciente, cuando finaliza la acción, entonces la caja se actualiza y el paciente ve impactado su saldo o deuda.
- [ ] Dado que administración paga honorarios a un profesional, cuando consulta luego la transacción, entonces puede identificar profesional, operador, detalle y asientos del movimiento.
- [ ] Dado que la dirección consulta el arqueo de caja, cuando revisa el reporte, entonces obtiene un saldo explicable a partir de los movimientos registrados.
- [ ] Dado que un usuario autorizado abre el detalle de una transacción, cuando la inspecciona, entonces visualiza fecha, estado, operador, paciente, profesional y debe/haber.
- [ ] Dado que la clínica necesita analizar desempeño económico, cuando consulta centro de costos, entonces encuentra resumen, movimientos y saldos con filtros relevantes.
- [ ] Dado que administración configura comisiones por profesional, cuando luego revisa operaciones de ese profesional, entonces las liquidaciones respetan esa parametrización.

### Comportamientos críticos
- Ningún movimiento económico relevante debe existir sin su reflejo contable correspondiente.
- La caja debe poder explicarse desde ventas, cobros, pagos, retiros y anulaciones registradas.
- Debe ser posible seguir una operación desde el paciente o profesional impactado hasta el asiento contable que la representa.
- Los honorarios, proveedores y comisiones deben administrarse con reglas explícitas y consultables.

### Métricas de impacto
- Tiempo de registración de venta, cobro o pago estándar: objetivo menor a 1 minuto.
- Tiempo de investigación de una diferencia de caja: reducción sustancial respecto de un proceso basado en planillas o memoria operativa.
- Porcentaje de movimientos con trazabilidad completa (operador + detalle + actor afectado + asientos): objetivo 100%.
- Tiempo para liquidar honorarios de un período: reducción medible gracias a comisiones y movimientos ordenados.
- Cantidad de consultas manuales para explicar un saldo a profesional o dirección: disminución esperada por disponibilidad de mayor y reportes.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Registrar movimientos económicos sin suficiente contexto | Media | Alto | Exigir datos mínimos de trazabilidad y mostrar claramente a quién afecta cada acción. |
| Diferencias de caja por operatoria incompleta o mal clasificada | Alta | Alto | Unificar flujos de vender, cobrar y pagar con reportes de control y arqueo consistente. |
| Complejidad excesiva para usuarios de recepción | Media | Medio | Separar acciones frecuentes, nombres claros y accesos rápidos para tareas repetitivas. |
| Liquidación discutible de honorarios o comisiones | Media | Alto | Definir reglas por defecto y por profesional, más reportes transparentes de soporte. |
| Pérdida de auditabilidad al anular movimientos | Baja | Crítico | Hacer anulación controlada, restringida y siempre trazable. |
| Dependencia de planillas externas para análisis gerencial | Media | Medio | Fortalecer centro de costos, reportes de saldos y mayor de cuentas dentro del sistema. |

---

## Preguntas Abiertas

- [ ] ¿La institución necesita distinguir múltiples cajas o alcanza con una única caja operativa en esta etapa?
- [ ] ¿Los retiros de dinero deben clasificarse por motivo para mejorar control gerencial?
- [ ] ¿Las órdenes impactan automáticamente en liquidaciones o solo funcionan como respaldo/reportabilidad?
- [ ] ¿Qué reglas de anulación y autorización quiere imponer la institución según rol?
- [ ] ¿La clínica necesita recibos automáticos siempre o debe seguir siendo una configuración opcional?

---

*Generado por prd-creator · 2026-03-30*
