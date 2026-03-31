# PRD: Profesionales

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P2 — soporte clínico y administrativo de alto valor
> **Complejidad**: alta
> **Autor**: generado con prd-creator

---

## Problema

En una clínica o asociación odontológica con múltiples profesionales, el módulo de profesionales no es un simple padrón. Es la base que ordena quién atiende, en qué horarios, con qué especialidades, bajo qué mutuales, con qué validación regulatoria y con qué condiciones económicas trabaja dentro de la institución. Si esa información está incompleta o desordenada, el impacto se derrama sobre toda la operación: turnos mal asignados, recetas inválidas, coberturas incorrectas, honorarios mal liquidados y confusión administrativa.

Además, el perfil del profesional concentra reglas sensibles. Debe contemplar identidad, matrícula y especialidad, disponibilidad habitual y excepciones temporales, mutuales con las que atiende o no atiende, comisiones específicas, estado regulatorio REFEPS, dirección aplicable a recetas, recuperación de acceso y consulta de honorarios adeudados. El sistema necesita tratar este módulo como una pieza central de gobierno operativo y no como una ficha aislada.

---

## Usuarios

### Usuario principal
- **Quién**: Administrador institucional
- **Necesidad**: Gestionar correctamente a cada profesional para que la operación clínica, regulatoria y económica funcione sin fricciones.
- **Dolor actual**: Si faltan datos o están mal configurados, se rompen varios flujos al mismo tiempo: agenda, recetas, mutuales, comisiones y honorarios.

### Usuarios secundarios
- **Profesional odontológico**: Necesita mantener su perfil, especialidades, horarios, excepciones y datos regulatorios al día.
- **Recepción / secretaría**: Necesita saber cuándo atiende el profesional, qué mutuales admite y qué excepciones tiene activas.
- **Administración**: Necesita consultar comisiones, honorarios adeudados y datos de facturación del profesional.

---

## Objetivos

### Objetivos de negocio
- Centralizar la gestión operativa, regulatoria y económica de cada profesional.
- Reducir errores en agenda, recetas, mutuales y liquidaciones por configuración incompleta.
- Dar trazabilidad a comisiones, honorarios adeudados y restricciones por profesional.
- Asegurar que cada profesional opere con datos consistentes y actualizados.

### Objetivos de usuario
- El administrador puede consultar y ajustar la ficha integral del profesional desde un solo módulo.
- El profesional puede mantener sus datos de trabajo y disponibilidad sin depender de procesos paralelos.
- La recepción puede verificar rápidamente horarios, excepciones y mutuales aplicables antes de agendar o atender.

### No-objetivos (explícitos)
- No incluye liquidación impositiva completa del profesional.
- No incluye firma de contratos o legajo laboral extendido.
- No incluye gestión documental avanzada de títulos o certificados adjuntos en esta versión.
- No incluye evaluación de desempeño o productividad avanzada.
- No incluye nómina salarial general del personal no profesional.

---

## Alcance

### Incluido en esta versión
- Perfil completo del profesional.
- Alta, edición, consulta y baja administrativa de profesionales.
- Gestión de estados operativos del profesional.
- Enforcement del cupo de profesionales activos por plan mensual del tenant.
- Gestión de especialidades y matrícula.
- Gestión de horarios habituales.
- Gestión de excepciones temporales al horario habitual.
- Gestión de mutuales deshabilitadas / alcance de atención por profesional.
- Configuración y consulta de comisiones por profesional.
- Consulta de honorarios adeudados.
- Registro de código REFEPS y estado de validación.
- Gestión de dirección del lugar de atención para recetas.
- Forzado de reseteo de contraseña.
- Consulta de datos de facturación y contacto del profesional.

### Fuera de alcance (explícito)
- Pago automático de honorarios.
- Firma digital avanzada de documentos del profesional.
- Gestión de ausentismo del personal auxiliar.
- Portal externo del profesional con autoliquidación completa.
- Cálculo impositivo integral sobre ingresos del profesional.
- Habilitación o bloqueo de módulos por plan comercial.

---

## Reglas de negocio del padrón profesional

### Profesional activo

Para este PRD, un profesional activo es aquel que integra el padrón operativo de la institución y puede seguir sosteniendo agenda, atención y demás procesos permitidos para su rol o función.

### Estados mínimos del profesional

- **Activo**: cuenta para el cupo del plan y puede sostener operación.
- **Inactivo**: no cuenta para el cupo y libera capacidad para otra alta o reactivación.
- **Suspendido**: no cuenta para el cupo y libera capacidad mientras permanezca fuera de operación.
- **Baja administrativa**: deja de integrar el padrón operativo nuevo, preservando trazabilidad histórica.

### Regla institucional de cupo por plan mensual

- Cada tenant tiene un plan mensual vigente.
- El plan define la cantidad máxima de profesionales activos.
- Solo cuentan los profesionales activos.
- Asistentes, administradores y supervisores no consumen cupo.
- Si se alcanza el cupo, no se puede crear ni reactivar otro profesional.
- Si un profesional pasa a inactivo, suspendido o equivalente, libera cupo.
- Si el tenant baja de plan y queda excedido, dispone de 30 días de gracia para regularizarse.
- Durante y después de la gracia, los profesionales ya activos no se bloquean automáticamente.
- Al terminar la gracia, si sigue excedido, solo se bloquean nuevas altas y reactivaciones.

Este PRD es el dueño funcional de esa validación. Auth define quién puede intentar la acción y Configuración expone el estado del plan, pero el enforcement sobre alta, activación, reactivación y liberación de cupo pertenece a Profesionales.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-001] Registrar perfil de profesional**
  **Descripción**: El sistema debe permitir crear y mantener la ficha principal del profesional con sus datos identificatorios, de contacto y de facturación.
  **Criterio de aceptación**: **Dado** que la institución incorpora o actualiza un profesional, **cuando** carga o edita su ficha, **entonces** el sistema guarda nombre, apellido, número de socio, CUIT, dirección, teléfono, email y condición de facturación del profesional; y si el alta lo deja activo, valida antes el cupo disponible del plan vigente.

- **[RF-001A] Diferenciar estados operativos del profesional**
  **Descripción**: El padrón debe distinguir con claridad cuándo un profesional está activo, inactivo, suspendido o de baja administrativa.
  **Criterio de aceptación**: **Dado** que administración consulta o edita un profesional, **cuando** revisa su estado operativo, **entonces** el sistema muestra y permite gestionar esos estados de forma explícita para sostener agenda, trazabilidad y reglas de cupo.

- **[RF-001B] Validar cupo al crear un profesional activo**
  **Descripción**: La creación de un profesional que vaya a quedar activo debe respetar el máximo de profesionales activos definido por el plan del tenant.
  **Criterio de aceptación**: **Dado** que la institución alcanzó el cupo de profesionales activos, **cuando** administración intenta crear un nuevo profesional activo, **entonces** el sistema bloquea la operación y comunica que el límite del plan fue alcanzado.

- **[RF-001C] Validar cupo al activar o reactivar un profesional**
  **Descripción**: Cambiar a activo a un profesional inactivo o suspendido debe consumir cupo y respetar la situación vigente del tenant.
  **Criterio de aceptación**: **Dado** que un profesional está inactivo o suspendido, **cuando** administración intenta activarlo o reactivarlo, **entonces** el sistema solo permite la acción si existe cupo disponible o si el tenant no se encuentra excedido luego de su gracia.

- **[RF-001D] Liberar cupo al sacar de activo a un profesional**
  **Descripción**: Cuando un profesional deja de estar activo, el sistema debe reflejar que ese cupo vuelve a quedar disponible para el tenant.
  **Criterio de aceptación**: **Dado** que un profesional pasa de activo a inactivo, suspendido o baja administrativa, **cuando** se confirma el cambio de estado, **entonces** el sistema actualiza el uso del cupo institucional liberando esa posición.

- **[RF-001E] Sostener continuidad operativa en exceso post-downgrade**
  **Descripción**: Si el tenant queda excedido por una baja de plan, los profesionales ya activos no deben perder automáticamente su operatividad.
  **Criterio de aceptación**: **Dado** que la institución quedó excedida y terminó la gracia sin regularizarse, **cuando** administración consulta el padrón existente, **entonces** los profesionales que ya estaban activos siguen operativos y solo quedan bloqueadas nuevas altas o reactivaciones.

- **[RF-002] Consultar listado de profesionales**
  **Descripción**: La institución necesita un listado operativo de profesionales con sus datos clave.
  **Criterio de aceptación**: **Dado** que existen profesionales cargados, **cuando** el administrador consulta el listado, **entonces** el sistema muestra la nómina con datos esenciales y acciones disponibles.

- **[RF-003] Gestionar especialidades del profesional**
  **Descripción**: Cada profesional debe poder quedar vinculado a sus especialidades y matrículas correspondientes.
  **Criterio de aceptación**: **Dado** que un profesional atiende en una o más especialidades, **cuando** se consulta o actualiza su ficha profesional, **entonces** el sistema permite registrar y visualizar esas especialidades con su matrícula asociada.

- **[RF-004] Configurar horarios habituales de atención**
  **Descripción**: El profesional debe tener una grilla semanal que defina sus rangos normales de atención.
  **Criterio de aceptación**: **Dado** que un profesional atiende en horarios recurrentes, **cuando** el usuario configura su agenda habitual, **entonces** el sistema guarda esos bloques por día y franja horaria.

- **[RF-005] Registrar excepciones al horario habitual**
  **Descripción**: La operación necesita contemplar vacaciones, licencias, ausencias puntuales o cortes temporales de agenda.
  **Criterio de aceptación**: **Dado** que un profesional no atenderá en un período específico, **cuando** se registra una excepción con rango de fechas y horario, **entonces** el sistema deja asentada esa excepción para ese profesional.

- **[RF-006] Mostrar detalle o aviso de excepción para secretaría**
  **Descripción**: Las excepciones deben incluir una referencia operativa entendible para recepción.
  **Criterio de aceptación**: **Dado** que una excepción fue registrada, **cuando** secretaría consulta la agenda o el detalle del profesional, **entonces** puede ver el aviso asociado a esa excepción.

- **[RF-007] Gestionar mutuales que el profesional no atiende**
  **Descripción**: El sistema debe permitir restringir mutuales por profesional para evitar asignaciones incorrectas.
  **Criterio de aceptación**: **Dado** que un profesional no trabaja con determinadas mutuales, **cuando** administración las marca como deshabilitadas para ese profesional, **entonces** el sistema conserva esa restricción.

- **[RF-008] Consultar mutuales deshabilitadas del profesional**
  **Descripción**: La clínica debe ver con claridad qué mutuales están excluidas para cada profesional.
  **Criterio de aceptación**: **Dado** que un profesional tiene mutuales deshabilitadas, **cuando** se consulta su configuración, **entonces** el sistema muestra esa lista de forma explícita.

- **[RF-009] Gestionar comisiones por profesional**
  **Descripción**: La institución necesita definir o revisar comisiones específicas por profesional en rubros relevantes.
  **Criterio de aceptación**: **Dado** que la clínica define comisiones de coseguro, estampilla, receta o depósitos, **cuando** consulta o edita el esquema del profesional, **entonces** el sistema muestra y permite ajustar esos porcentajes.

- **[RF-010] Consultar honorarios adeudados**
  **Descripción**: La administración necesita acceder a la deuda de honorarios pendiente para cada profesional.
  **Criterio de aceptación**: **Dado** que un profesional tiene importes pendientes, **cuando** el usuario entra a la opción de honorarios adeudados, **entonces** el sistema muestra la deuda correspondiente para su seguimiento.

- **[RF-011] Registrar código REFEPS del profesional**
  **Descripción**: El perfil debe contemplar el código REFEPS del profesional como requisito regulatorio relevante.
  **Criterio de aceptación**: **Dado** que el profesional necesita emitir recetas, **cuando** se completa su perfil regulatorio, **entonces** el sistema permite cargar su código REFEPS.

- **[RF-012] Validar estado REFEPS del profesional**
  **Descripción**: La institución necesita distinguir si el profesional tiene su REFEPS validado o pendiente.
  **Criterio de aceptación**: **Dado** que el código REFEPS fue informado, **cuando** el usuario ejecuta la validación o consulta su estado, **entonces** el sistema refleja si el profesional quedó validado o no.

- **[RF-013] Gestionar dirección del lugar de atención para recetas**
  **Descripción**: La dirección utilizada en recetas debe poder administrarse de forma específica y separada del resto del perfil general.
  **Criterio de aceptación**: **Dado** que el profesional necesita emitir recetas válidas, **cuando** se consulta o edita la dirección para recetas, **entonces** el sistema guarda y muestra esa dirección específica del lugar de atención.

- **[RF-014] Forzar reseteo de contraseña del profesional**
  **Descripción**: El administrador debe poder obligar al profesional a generar un nuevo acceso cuando sea necesario.
  **Criterio de aceptación**: **Dado** que el administrador decide forzar nueva contraseña para un profesional, **cuando** confirma la acción, **entonces** el sistema deja al profesional marcado para restablecer su contraseña en el próximo ingreso.

- **[RF-015] Eliminar o dar de baja administrativa a un profesional**
  **Descripción**: La institución necesita cerrar la vigencia operativa de un profesional cuando deja de atender.
  **Criterio de aceptación**: **Dado** que un profesional deja de formar parte de la clínica, **cuando** el administrador ejecuta la baja administrativa, **entonces** el sistema retira su operatividad preservando trazabilidad histórica y, si estaba activo, libera el cupo correspondiente.

### P1 — Importantes

- **[RF-016] Diferenciar estado de turno por profesional**
  **Descripción**: El perfil contempla un estado operativo por defecto para la agenda del profesional.
  **Criterio de aceptación**: **Dado** que el profesional trabaja con un estado operativo determinado, **cuando** se consulta o edita su perfil, **entonces** el sistema permite definir ese estado de turno por defecto.

- **[RF-017] Identificar visualmente al profesional en agenda**
  **Descripción**: La agenda necesita un atributo visual que permita distinguir profesionales.
  **Criterio de aceptación**: **Dado** que varios profesionales comparten agenda institucional, **cuando** se visualiza el calendario, **entonces** el sistema puede identificar a cada uno mediante su configuración visual.

- **[RF-018] Consultar ficha rápida del profesional desde otros flujos**
  **Descripción**: Turnos y otras pantallas operativas deben poder abrir contexto del profesional sin salir del trabajo actual.
  **Criterio de aceptación**: **Dado** que secretaría está en un flujo como turnos, **cuando** necesita revisar datos del profesional, **entonces** el sistema le ofrece acceso rápido a su contexto operativo.

- **[RF-019] Mantener información de contacto actualizada**
  **Descripción**: Los datos de dirección, teléfono y email deben ser editables y consultables para soporte operativo.
  **Criterio de aceptación**: **Dado** que cambia un dato de contacto del profesional, **cuando** se actualiza su ficha, **entonces** el sistema refleja la nueva información.

- **[RF-020] Distinguir la condición de facturación del profesional**
  **Descripción**: El sistema debe conservar cómo factura el profesional dentro de la institución.
  **Criterio de aceptación**: **Dado** que el profesional tiene una modalidad de facturación definida, **cuando** se consulta su perfil, **entonces** el sistema muestra esa condición de manera explícita.

- **[RF-021] Consultar combinación de restricciones y habilitaciones antes de asignar turnos**
  **Descripción**: Recepción debe verificar disponibilidad y mutuales aplicables antes de comprometer una atención.
  **Criterio de aceptación**: **Dado** que secretaría está asignando un turno, **cuando** revisa al profesional, **entonces** el sistema le permite conocer horarios, excepciones y mutuales restringidas para evitar errores.

### P2 — Deseables

- **[RF-022] Alertar sobre perfil incompleto del profesional**
  **Descripción**: El sistema puede anticipar riesgos cuando faltan datos clave para operar.
  **Criterio de aceptación**: **Dado** que un profesional no tiene completos datos críticos como REFEPS, dirección para recetas u horarios, **cuando** se consulta su ficha, **entonces** el sistema destaca esos faltantes.

- **[RF-023] Resumen integral del profesional**
  **Descripción**: Administración puede necesitar una vista unificada con perfil, agenda, mutuales, comisiones y estado regulatorio.
  **Criterio de aceptación**: **Dado** que el administrador abre el resumen del profesional, **cuando** lo visualiza, **entonces** encuentra en un solo lugar la información operativa más importante.

- **[RF-024] Historial de cambios relevantes del profesional**
  **Descripción**: Para auditoría interna futura, la institución puede requerir trazabilidad de cambios importantes en la configuración del profesional.
  **Criterio de aceptación**: **Dado** que se modificó una condición sensible del profesional, **cuando** la clínica revisa antecedentes, **entonces** el sistema permite reconstruir ese cambio en una etapa posterior.

---

## Datos Clave del Profesional

| Grupo | Datos de negocio |
|------|-------------------|
| **Identidad** | Nombre, apellido, número de socio |
| **Fiscal / facturación** | CUIT, condición o modalidad de facturación |
| **Contacto** | Dirección, teléfono, email |
| **Operación** | Estado de turno, color o identificación visual |
| **Estado del padrón** | Activo, inactivo, suspendido, baja administrativa |
| **Regulatorio** | Código REFEPS, estado de validación |
| **Recetas** | Dirección del lugar de atención para recetas |
| **Agenda** | Horarios habituales, excepciones |
| **Cobertura** | Mutuales restringidas o deshabilitadas |
| **Economía** | Comisiones y honorarios adeudados |
| **Acceso** | Forzado de reseteo de contraseña |

---

## Requisitos No Funcionales

- **Confiabilidad operativa**: Los datos del profesional deben ser suficientemente completos para no romper turnos, recetas ni liquidaciones.
- **Claridad administrativa**: Secretarías y administración deben interpretar fácilmente restricciones, horarios y estado regulatorio.
- **Trazabilidad**: La institución debe poder rastrear configuraciones sensibles por profesional.
- **Consistencia transversal**: Cambios en el profesional deben reflejarse de manera coherente en agenda, recetas y circuitos económicos.
- **Velocidad de consulta**: El acceso a la información clave del profesional debe ser inmediato en contexto de operación diaria.

---

## Flujos

### Flujo principal: Alta o actualización integral de profesional

1. El administrador abre el módulo de profesionales.
2. Crea o edita la ficha del profesional.
3. Completa datos identificatorios, fiscales y de contacto.
4. Define el estado operativo inicial del profesional.
5. Define especialidades y matrícula.
6. Configura horarios habituales.
7. Registra excepciones si corresponde.
8. Ajusta mutuales restringidas.
9. Revisa comisiones y estado de honorarios adeudados.
10. Completa datos regulatorios y dirección para recetas.
11. Si el profesional debe quedar activo, el sistema valida cupo disponible según el plan vigente.
12. Guarda la configuración operativa del profesional.

### Flujo: Configuración de agenda del profesional

1. El usuario entra a horarios del profesional.
2. Carga bloques semanales habituales.
3. Registra excepciones temporales cuando haga falta.
4. La agenda futura respeta la combinación entre horario base y excepciones activas.

### Flujo: Preparación regulatoria para recetas

1. El profesional o el administrador carga el código REFEPS.
2. Verifica su validación.
3. Completa la dirección del lugar de atención para recetas.
4. El profesional queda en condiciones operativas de emitir recetas.

### Flujo: Seguimiento económico del profesional

1. Administración consulta la configuración de comisiones.
2. Revisa honorarios adeudados.
3. Toma decisiones de liquidación o control según esa información.

### Flujo: Reactivación de profesional

1. Administración ubica un profesional inactivo o suspendido.
2. Revisa si necesita volver a estado activo.
3. El sistema valida cupo disponible o situación de exceso y gracia del tenant.
4. Si la validación es correcta, reactiva al profesional.
5. Si no lo es, bloquea la acción y explica el motivo institucional.

### Flujos alternativos

- **Profesional con agenda habitual pero excepción puntual**: la excepción prevalece sobre el horario base en el período afectado.
- **Profesional que deja de atender una mutual**: se actualiza la restricción sin alterar su historial previo.
- **Profesional sin REFEPS validado**: puede permanecer en el padrón, pero no queda listo para ciertos actos regulatorios como recetas.
- **Tenant excedido por downgrade**: la institución debe regularizarse dentro de la gracia, pero los profesionales ya activos siguen operativos.

### Flujos de error

- No debería considerarse completo un profesional sin datos mínimos de identidad y contacto.
- No debería habilitarse una receta si falta la dirección específica para recetas o el REFEPS validado.
- No debería asignarse agenda ignorando excepciones activas.
- No debería interpretarse como habilitada una mutual que figura entre las deshabilitadas del profesional.
- No debería permitirse crear, activar o reactivar un profesional cuando el tenant no dispone de cupo activo según su plan.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** que el administrador completa la ficha del profesional, **cuando** guarda la información, **entonces** el sistema conserva perfil, especialidades, horarios y datos regulatorios del profesional.
- [ ] **Dado** que un profesional tiene excepción de agenda registrada, **cuando** secretaría revisa su disponibilidad, **entonces** el sistema refleja esa excepción.
- [ ] **Dado** que el profesional tiene mutuales deshabilitadas, **cuando** se consulta su configuración, **entonces** la clínica puede reconocer claramente esas restricciones.
- [ ] **Dado** que el profesional necesita emitir recetas, **cuando** su REFEPS está validado y la dirección de recetas está cargada, **entonces** queda operativo para ese flujo.
- [ ] **Dado** que administración necesita revisar deuda con un profesional, **cuando** accede a honorarios adeudados, **entonces** el sistema muestra la información correspondiente.
- [ ] **Dado** que el administrador fuerza nueva contraseña, **cuando** el profesional vuelve a ingresar, **entonces** debe restablecer su acceso.
- [ ] **Dado** que el tenant alcanzó su cupo de profesionales activos, **cuando** administración intenta crear o reactivar otro profesional, **entonces** el sistema bloquea la acción con un mensaje administrativo claro.
- [ ] **Dado** que un profesional pasa de activo a inactivo o suspendido, **cuando** se confirma el cambio, **entonces** el sistema libera ese cupo institucional.
- [ ] **Dado** que el tenant sigue excedido luego de su gracia, **cuando** se consulta el padrón actual, **entonces** los profesionales que ya estaban activos continúan operativos y solo se bloquean nuevas altas o reactivaciones.

### Comportamientos críticos
- La agenda del profesional siempre debe contemplar horarios base y excepciones activas.
- Las restricciones de mutuales deben ser visibles y utilizables por recepción.
- El estado regulatorio del profesional no puede quedar ambiguo para el flujo de recetas.
- Comisiones y honorarios adeudados deben poder consultarse por profesional sin mezclar información.
- El módulo debe ser la fuente funcional de verdad para cuándo una alta, activación o reactivación consume cupo y cuándo una salida de estado activo lo libera.

### Métricas de impacto
- Reducción de errores de asignación de turnos por horario o excepción mal resuelta.
- Reducción de intentos fallidos de emisión de recetas por perfil profesional incompleto.
- Porcentaje de profesionales con perfil operativo completo.
- Tiempo promedio de consulta administrativa del estado de un profesional.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Perfil profesional incompleto que bloquea otros flujos | Alta | Alto | Alertas de faltantes y checklist de datos críticos. |
| Turnos mal asignados por horarios o excepciones mal cargadas | Media | Alto | Separar claramente horario base y excepciones con visibilidad para secretaría. |
| Recetas inválidas por falta de dirección o REFEPS | Media | Alto | Validación explícita del estado regulatorio y de dirección específica para recetas. |
| Error de cobertura por mutuales mal configuradas | Media | Medio | Gestión explícita de mutuales deshabilitadas y consulta rápida antes de agendar. |
| Liquidaciones confusas por comisiones u honorarios no visibles | Media | Alto | Acceso claro a comisiones por profesional y honorarios adeudados. |
| Bloqueos administrativos confusos por límite de plan | Media | Alto | Separar en UI y ayuda la falta de cupo del problema de permisos o de error técnico. |

---

## Dependencias del Negocio

- Módulo de turnos y agenda.
- Módulo de recetas.
- Gestión de mutuales / obras sociales.
- Circuito económico para comisiones y honorarios.
- Gestión de acceso y contraseñas.
- Configuración del sistema para visibilidad de plan, cupo, exceso y gracia.

---

## Preguntas Abiertas

- [ ] ¿La clínica quiere distinguir más de un domicilio de atención por profesional para recetas futuras?
- [ ] ¿Las comisiones deben heredarse desde una configuración general y luego personalizarse por profesional, o siempre definirse individualmente?
- [ ] ¿Los honorarios adeudados deben mostrarse como resumen o con detalle transaccional en una etapa siguiente?
- [ ] ¿Hace falta distinguir además un estado transitorio como reemplazo o pendiente, sin que eso altere la regla principal de cupo sobre profesionales activos?
- [ ] ¿La institución quiere medir ocupación, disponibilidad y productividad del profesional desde este mismo módulo en una fase posterior?
