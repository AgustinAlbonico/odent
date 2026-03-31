# PRD: Mutuales y Obras Sociales

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: alta
> **Autor**: generado con prd-creator

---

## Problema

La operatoria odontológica con mutuales y obras sociales es uno de los puntos más sensibles del negocio porque define quién cubre qué práctica, cuánto paga el paciente, qué profesional puede atender bajo cada convenio y qué datos administrativos hacen falta para no generar rechazos, demoras o discusiones en caja. Si esta información está dispersa o incompleta, la recepción pierde tiempo, el profesional atiende con incertidumbre y el paciente descubre demasiado tarde que su cobertura no aplica como esperaba.

La clínica necesita un módulo que centralice catálogo de mutuales, vínculo paciente-mutual, habilitación de mutuales por profesional, cobertura por práctica y lógica de cálculo entre cobertura y coseguro. Además, varias mutuales trabajan con autogestión, por lo que el negocio necesita dejar claro cuándo la responsabilidad operativa recae en la institución, en el profesional o en el propio paciente.

**Situación actual**: se observaron aproximadamente 50 mutuales cargadas, vínculo por paciente con número de afiliado y plan, catálogo general con indicador de autogestión y referencias a relación entre prácticas y mutuales. También se observó que los profesionales tienen una sección específica de mutuales habilitadas.

---

## Usuarios

### Usuario principal
- **Quién**: Recepción / administración de atención.
- **Necesidad**: Saber rápidamente qué mutual tiene el paciente, qué plan posee, qué cobertura aplica y qué debe pagar en el momento.
- **Dolor actual**: Cuando la información no está consolidada, se genera retrabajo, se demora la atención y aparecen errores en la cobranza del coseguro.

### Usuarios secundarios
- **Profesional**: Necesita saber con qué mutuales puede trabajar y qué prácticas están cubiertas para evitar registrar atenciones inviables.
- **Paciente**: Necesita claridad sobre su afiliación, su plan y cuánto debe pagar de su bolsillo.
- **Administrador**: Necesita mantener vigente el catálogo, ordenar reglas de cobertura y auditar rechazos o inconsistencias.

---

## Objetivos

### Objetivos de negocio
- Consolidar en un único módulo toda la información comercial y operativa de mutuales y obras sociales.
- Reducir errores de cobertura y de cobro al momento de registrar una práctica.
- Disminuir rechazos administrativos causados por afiliaciones incompletas o planes mal vinculados.
- Permitir que cada profesional opere solo con las mutuales que efectivamente tiene habilitadas.
- Transparentar el cálculo entre cobertura y coseguro antes de cerrar la atención.

### Objetivos de usuario
- La recepción identifica en menos de 30 segundos qué cobertura corresponde a un paciente.
- El profesional sabe antes de atender si una práctica aplica para esa mutual y ese plan.
- El paciente entiende cuánto cubre su mutual y cuánto le corresponde pagar.

### No-objetivos (explícitos)
- No incluye integración automática con padrones externos o validadores de terceros en esta versión.
- No incluye facturación fiscal a financiadores externos.
- No incluye gestión de débitos automáticos o cobranzas a la mutual fuera del circuito asistencial.
- No incluye liquidación avanzada por convenio capitado o contratos especiales institucionales.

---

## Alcance

### Incluido en esta versión
- Catálogo centralizado de mutuales y obras sociales.
- Alta, edición y baja lógica del catálogo.
- Indicador de autogestión por mutual.
- Vinculación de una o varias mutuales a cada paciente.
- Registro de número de afiliado y plan por paciente-mutual.
- Habilitación de mutuales por profesional.
- Reglas de cobertura por práctica.
- Cálculo visible de cobertura y coseguro.
- Consulta rápida de cobertura antes y durante la atención.
- Señales operativas cuando una mutual requiera autogestión.

### Fuera de alcance (explícito)
- Autorizaciones electrónicas en línea con financiadores — requiere convenios y validaciones externas.
- Presentación automática de prestaciones a la mutual — corresponde a un proceso administrativo posterior.
- Gestión documental avanzada de credenciales, carnets o imágenes adjuntas.
- Reglas complejas por copago diferenciado según antigüedad del afiliado — se evaluará en otra etapa.

---

## Definiciones de negocio

- **Mutual / obra social**: entidad que cubre total o parcialmente prestaciones del paciente.
- **Plan**: variante comercial o administrativa de la mutual que condiciona cobertura.
- **Autogestión**: modalidad en la que parte de la operatoria o validación no la resuelve directamente la clínica.
- **Cobertura**: monto o porcentaje que reconoce la mutual para una práctica.
- **Coseguro**: monto que debe afrontar el paciente cuando la cobertura no alcanza el total.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-801] Mantener catálogo de mutuales**
  Descripción: La institución debe poder administrar un catálogo único de mutuales y obras sociales con nombre, código, estado y marca de autogestión.
  Criterio de aceptación: **Dado** que administración necesita incorporar una mutual nueva, **cuando** registra su nombre, código e indicador de autogestión, **entonces** la mutual queda disponible en el catálogo general para su uso operativo.

- **[RF-802] Vincular mutuales al paciente**
  Descripción: Un paciente debe poder tener una o varias mutuales activas asociadas con número de afiliado y plan.
  Criterio de aceptación: **Dado** que un paciente presenta su cobertura, **cuando** recepción lo vincula a una mutual y completa afiliado y plan, **entonces** la relación queda guardada y visible en su ficha.

- **[RF-803] Permitir múltiples mutuales por paciente**
  Descripción: El negocio debe contemplar pacientes con más de una cobertura vigente.
  Criterio de aceptación: **Dado** que un paciente ya tiene una mutual registrada, **cuando** el usuario agrega una segunda mutual con datos distintos, **entonces** ambas quedan activas y diferenciadas dentro de la ficha del paciente.

- **[RF-804] Gestionar mutuales habilitadas por profesional**
  Descripción: Cada profesional debe tener definido con qué mutuales puede atender para evitar errores operativos.
  Criterio de aceptación: **Dado** que administración configura el perfil de un profesional, **cuando** selecciona sus mutuales habilitadas, **entonces** el sistema usa esa configuración al momento de atender y registrar prácticas.

- **[RF-805] Definir cobertura por práctica**
  Descripción: La clínica debe poder establecer qué prácticas cubre cada mutual y bajo qué condición general.
  Criterio de aceptación: **Dado** que una mutual cubre solo determinadas prácticas, **cuando** administración consulta o actualiza la matriz de cobertura, **entonces** cada práctica queda claramente marcada como cubierta, no cubierta o sujeta a validación.

- **[RF-806] Calcular cobertura y coseguro**
  Descripción: Antes de cerrar la atención, el sistema debe informar cuánto cubre la mutual y cuánto corresponde cobrar al paciente como coseguro.
  Criterio de aceptación: **Dado** que una práctica tiene una cobertura definida y un valor de referencia, **cuando** el usuario la selecciona para un paciente con mutual vigente, **entonces** el sistema informa el monto cubierto y el coseguro a cobrar.

- **[RF-807] Identificar mutuales de autogestión**
  Descripción: La operación debe distinguir cuándo una mutual requiere autogestión para que el usuario sepa que hay pasos adicionales o responsabilidades distintas.
  Criterio de aceptación: **Dado** que el usuario consulta una mutual marcada como autogestión, **cuando** la selecciona en una atención o en la ficha del paciente, **entonces** el sistema lo señala de forma visible para evitar errores de proceso.

- **[RF-808] Evitar uso de mutual no habilitada para el profesional**
  Descripción: Si un profesional no trabaja con determinada mutual, el sistema debe prevenir su selección operativa.
  Criterio de aceptación: **Dado** que un profesional no tiene habilitada una mutual específica, **cuando** el usuario intenta asociarla a una práctica con ese profesional, **entonces** el sistema bloquea o advierte la inconsistencia antes de continuar.

### P1 — Importantes

- **[RF-809] Buscar mutuales por nombre o código**
  Descripción: El catálogo debe poder filtrarse rápidamente para uso administrativo y operativo.
  Criterio de aceptación: **Dado** que existen decenas de mutuales cargadas, **cuando** el usuario busca por nombre o código, **entonces** el sistema devuelve las coincidencias relevantes en forma inmediata.

- **[RF-810] Actualizar datos de afiliación del paciente**
  Descripción: La recepción debe poder modificar plan, número de afiliado o estado de una vinculación sin rehacer toda la relación.
  Criterio de aceptación: **Dado** que un paciente cambia de plan o credencial, **cuando** el usuario actualiza esos datos, **entonces** la ficha refleja la versión vigente sin perder trazabilidad operativa.

- **[RF-811] Dar de baja lógica una mutual del paciente**
  Descripción: Si una cobertura deja de estar vigente, debe poder inactivarse sin borrar el historial previo.
  Criterio de aceptación: **Dado** que un paciente ya no pertenece a una mutual, **cuando** el usuario la marca como inactiva, **entonces** deja de aparecer como cobertura vigente pero permanece en el historial.

- **[RF-812] Consultar cobertura desde la atención**
  Descripción: El usuario debe poder revisar cobertura y coseguro sin salir del flujo de atención del paciente.
  Criterio de aceptación: **Dado** que el profesional o la recepción están registrando una práctica, **cuando** consultan la cobertura de la mutual elegida, **entonces** obtienen la respuesta necesaria para decidir cómo continuar con el cobro y la carga.

- **[RF-813] Mostrar resumen de cobertura al paciente**
  Descripción: El sistema debe permitir una visualización simple de qué cubre la mutual seleccionada y qué queda a cargo del paciente.
  Criterio de aceptación: **Dado** que se está preparando el cobro de una práctica, **cuando** el usuario abre el resumen de cobertura, **entonces** puede explicarle al paciente el monto cubierto y el coseguro con lenguaje claro.

- **[RF-814] Gestionar mutual particular**
  Descripción: Debe existir la opción de atención particular para pacientes sin cobertura o que decidan atenderse fuera de convenio.
  Criterio de aceptación: **Dado** que un paciente no presenta mutual válida, **cuando** el usuario selecciona la opción particular, **entonces** el sistema considera cobertura cero y calcula el monto a cargo del paciente.

- **[RF-815] Señalar inconsistencias de datos**
  Descripción: El sistema debe alertar cuando una afiliación está incompleta, vencida o carece de plan.
  Criterio de aceptación: **Dado** que un paciente tiene una mutual vinculada sin número de afiliado o sin plan, **cuando** el usuario intenta usarla en una atención, **entonces** el sistema advierte que la cobertura no está lista para operar.

### P2 — Deseables

- **[RF-816] Priorizar mutual principal del paciente**
  Descripción: Si el paciente tiene varias mutuales, el sistema puede permitir marcar una como principal para reducir errores de selección.
  Criterio de aceptación: **Dado** que un paciente tiene dos mutuales activas, **cuando** recepción marca una como principal, **entonces** esa cobertura aparece preseleccionada en los flujos operativos.

- **[RF-817] Clasificar mutuales por tipo de operación**
  Descripción: Administración puede agrupar mutuales por tipo de convenio o comportamiento operativo para análisis interno.
  Criterio de aceptación: **Dado** que la clínica quiere segmentar mutuales, **cuando** asigna una clasificación interna, **entonces** puede filtrar y reportar por ese criterio.

- **[RF-818] Registrar observaciones operativas por mutual**
  Descripción: La institución puede guardar notas breves sobre particularidades de una mutual, por ejemplo requisitos de presentación o aclaraciones frecuentes.
  Criterio de aceptación: **Dado** que una mutual tiene condiciones especiales de uso, **cuando** administración registra una observación, **entonces** esa nota queda visible para los usuarios autorizados al operar con esa mutual.

---

## Requisitos No Funcionales

- **Velocidad operativa**: La búsqueda de mutuales y la consulta de cobertura deben resolverse en menos de 2 segundos durante la atención.
- **Claridad comercial**: El paciente debe poder entender el resultado de cobertura y coseguro sin lenguaje técnico.
- **Confiabilidad**: La información de afiliado, plan y cobertura debe mantenerse consistente entre ficha del paciente y atención.
- **Auditabilidad**: La institución debe poder revisar por qué se aplicó determinada cobertura ante un reclamo.
- **Usabilidad**: La vinculación de una mutual al paciente debe completarse en pocos pasos y sin duplicar carga.

---

## Flujos

### Flujo principal — Vincular mutual a paciente
1. Recepción busca al paciente.
2. Ingresa al apartado de mutuales.
3. Selecciona una mutual del catálogo.
4. Completa número de afiliado y plan.
5. Guarda la relación.
6. La cobertura queda disponible para próximas atenciones.

### Flujo — Definir mutuales por profesional
1. Administración accede a la ficha del profesional.
2. Selecciona las mutuales con las que ese profesional trabaja.
3. Guarda la configuración.
4. El sistema usa esa habilitación en la operatoria diaria.

### Flujo — Calcular cobertura y coseguro
1. Durante la atención se elige la mutual del paciente.
2. Se selecciona la práctica a realizar.
3. El sistema consulta la regla de cobertura.
4. Informa cuánto cubre la mutual y cuánto debe pagar el paciente.
5. El usuario continúa con el circuito de atención y cobro.

### Flujo alternativo — Paciente particular
1. La recepción detecta que el paciente no tiene mutual válida.
2. Selecciona la opción particular.
3. El sistema asume cobertura cero.
4. El total queda a cargo del paciente.

### Flujos de error
**Mutual no habilitada para el profesional**
Condición: El usuario intenta trabajar con una mutual no configurada para ese profesional.
Comportamiento esperado: El sistema bloquea o advierte antes de que la atención siga su curso.

**Afiliación incompleta**
Condición: Falta afiliado, plan u otro dato mínimo para operar.
Comportamiento esperado: El sistema informa que la cobertura no está lista y evita errores posteriores.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** un paciente con cobertura vigente, **cuando** recepción vincula mutual, afiliado y plan, **entonces** esos datos quedan disponibles para la atención.
- [ ] **Dado** una práctica con regla de cobertura definida, **cuando** se atiende al paciente con esa mutual, **entonces** el sistema muestra cobertura y coseguro en forma clara.
- [ ] **Dado** un profesional sin habilitación para una mutual, **cuando** se intenta operar con ella, **entonces** el sistema previene la inconsistencia.
- [ ] **Dado** una mutual marcada como autogestión, **cuando** el usuario la selecciona, **entonces** el sistema lo deja explícitamente indicado.
- [ ] **Dado** un paciente con múltiples mutuales, **cuando** el usuario consulta su ficha, **entonces** puede distinguir cada cobertura, su plan y su estado.

### Comportamientos críticos
- Ninguna atención con mutual debe avanzar con afiliación incompleta sin advertencia.
- El cálculo de cobertura y coseguro debe ser visible antes de cerrar el cobro.
- La habilitación de mutuales por profesional debe respetarse en la operación diaria.
- La condición de autogestión no puede quedar oculta.

### Métricas de impacto
- **Errores de cobertura detectados en caja**: baseline a validar → objetivo reducción del 70%.
- **Tiempo promedio para verificar mutual y plan**: estimado actual 5-10 minutos → objetivo menor a 2 minutos.
- **Atenciones con coseguro mal calculado**: baseline a validar → objetivo reducción sostenida mes a mes.
- **Reclamos por información de cobertura poco clara**: baseline a validar → objetivo reducción significativa.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Reglas de cobertura incompletas por práctica | Alta | Alto | Cargar primero mutuales prioritarias y validar con operación real |
| Cambios frecuentes de planes o condiciones | Media | Alto | Facilitar actualización rápida de afiliación y plan |
| Interpretación ambigua del concepto autogestión | Media | Medio | Definir criterio institucional claro y reflejarlo en el lenguaje del módulo |
| Uso operativo de mutuales no habilitadas | Media | Alto | Aplicar validaciones visibles antes de registrar prácticas |

---

## Preguntas Abiertas

- [ ] ¿La cobertura por práctica será monto fijo, porcentaje o combinación según convenio?
- [ ] ¿La autogestión debe disparar tareas internas específicas o solo una advertencia visible?
- [ ] ¿Hace falta manejar vigencia con fecha desde/hasta para cada afiliación del paciente?
- [ ] ¿Cómo se resolverán prácticas sujetas a autorización previa en una etapa posterior?

---

*Generado por prd-creator · 2026-03-30*
