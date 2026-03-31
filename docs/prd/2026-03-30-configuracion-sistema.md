# PRD: Configuración del Sistema

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P3 — parametrización y adopción
> **Complejidad**: alta
> **Autor**: generado para documentación funcional

---

## Problema

La operación diaria de una clínica o asociación odontológica depende de una base de configuración estable, consistente y entendible. Si los datos institucionales, los parámetros por defecto y los catálogos operativos están incompletos, desactualizados o dispersos, el sistema entero pierde confiabilidad: los turnos heredan duraciones incorrectas, los profesionales trabajan con mutuales o consultorios mal definidos, las recetas se emiten con catálogos incompletos y la administración pierde trazabilidad sobre proveedores, órdenes y prácticas.

En el relevamiento se observó que la configuración no es un apéndice menor: concentra datos fiscales e institucionales, defaults operativos, consultorios, asistentes, profesionales, catálogos estructurados de diagnósticos y medicamentos, tipos de órdenes, grupos de prácticas, proveedores y reglas de parametrización que impactan en atención, facturación, recetas, agenda y reportes. También se observó una arquitectura multi-tenant, donde cada institución opera en su propio subdominio y necesita mantener su configuración aislada del resto.

El problema de negocio es claro: sin una capa de configuración robusta, el sistema no escala de forma ordenada entre instituciones ni permite adaptar la operación a la realidad de cada clínica. La configuración del sistema tiene que funcionar como la "sala de máquinas" del negocio: no es lo más visible, pero si está mal, TODO lo demás empieza a fallar.

---

## Usuarios

### Usuario principal
- **Quién**: Administrador institucional
- **Necesidad**: Definir y mantener la configuración operativa, clínica y administrativa de la institución sin depender de soporte externo para cada ajuste.
- **Dolor actual**: Si la configuración está fragmentada o no deja claro el impacto de cada cambio, corre el riesgo de afectar agenda, recetas, mutuales, órdenes, cobros o reportes sin darse cuenta.

### Usuarios secundarios
- **Dirección / dueños / comisión administrativa**: Necesitan asegurar que la institución tenga datos fiscales correctos, defaults operativos coherentes y catálogos consistentes entre áreas.
- **Asistentes / recepción**: Necesitan que consultorios, asistentes, turnos y parámetros por defecto estén bien configurados para trabajar sin fricción.
- **Profesionales**: Necesitan operar con diagnósticos, medicamentos, consultorios, tipos de órdenes y grupos de prácticas correctos para no perder tiempo ni cometer errores administrativos.

---

## Objetivos

### Objetivos de negocio
- Centralizar la configuración institucional en un único módulo gobernable.
- Reducir errores operativos causados por defaults inconsistentes o catálogos incompletos.
- Permitir que cada institución adapte el sistema a su propia realidad operativa sin afectar a otras instituciones.
- Sostener el crecimiento multi-tenant con aislamiento, autonomía y trazabilidad por institución.

### Objetivos de usuario
- El administrador puede revisar y ajustar la configuración crítica de la institución desde un único espacio.
- Cada cambio de configuración deja claro qué parte de la operación impacta.
- Los catálogos operativos se pueden mantener sin ambigüedad y con criterios uniformes.
- Los usuarios de la clínica trabajan con parámetros, catálogos y entidades actualizadas y confiables.

### No-objetivos (explícitos)
- No incluye parametrización contable profunda del plan de cuentas ni comisiones detalladas por profesional — eso pertenece al PRD específico de cuenta corriente / contabilidad.
- No incluye gestión de permisos o seguridad por rol — corresponde al módulo de autenticación y autorización.
- No incluye configuración técnica de infraestructura, dominios, integraciones o servidores.
- No incluye migraciones masivas de datos entre instituciones en esta etapa.

---

## Alcance

### Incluido en esta versión
- Datos institucionales y fiscales de la clínica o asociación.
- Parámetros por defecto de operación general.
- Visibilidad administrativa del plan mensual vigente del tenant y su estado de cupo profesional.
- Gestión de asistentes.
- Gestión de consultorios.
- Catálogo de diagnósticos.
- Catálogo de medicamentos.
- Catálogo de tipos de órdenes.
- Gestión de grupos de prácticas.
- Gestión de proveedores.
- Alcance y reglas de aislamiento multi-tenant.
- Reglas de visibilidad y mantenimiento por institución.
- Mensajes de impacto y validaciones de cambios sensibles.

### Fuera de alcance (explícito)
- Motor de facturación electrónica.
- Integraciones regulatorias automáticas con terceros.
- Gestión detallada de stock o inventario.
- Liquidación de honorarios o pagos automáticos a profesionales.
- Configuración clínica específica por paciente.
- Autoservicio comercial complejo de upgrade, downgrade o facturación del plan.

---

## Principios del módulo

- **Una institución, una configuración propia**: cada clínica administra su información sin contaminar a otras.
- **Defaults claros y revisables**: todo parámetro por defecto debe ser visible, entendible y modificable por un responsable.
- **Catálogos vivos, no decorativos**: diagnósticos, medicamentos, órdenes y grupos de prácticas deben sostener trabajo real, no ser listas estáticas sin mantenimiento.
- **Impacto explícito**: si un cambio puede alterar la operación diaria, el sistema debe advertirlo antes de guardar.
- **Gobierno operativo**: la configuración debe permitir autonomía con control, no improvisación.
- **Visibilidad comercial mínima, no subsistema comercial**: la institución debe entender su cupo vigente sin que este módulo invente todavía un backoffice comercial no definido.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-001] Editar datos institucionales**
  **Descripción**: El sistema debe permitir configurar el perfil institucional de la clínica, incluyendo nombre, razón social, CUIT, domicilio, localidad, provincia, teléfono, email, sitio web y logo.
  **Criterio de aceptación**: Dado que un administrador institucional accede a "Configuración → Sistema", cuando actualiza la razón social, el CUIT y el domicilio y presiona "Guardar", entonces el sistema persiste esos datos y los deja disponibles para los procesos administrativos de la institución.

- **[RF-002] Validar obligatoriedad de datos institucionales críticos**
  **Descripción**: Los datos mínimos que identifican a la institución deben ser obligatorios para evitar operación incompleta.
  **Criterio de aceptación**: Dado que la institución intenta guardar la configuración sin nombre, razón social o CUIT, cuando confirma la acción, entonces el sistema bloquea el guardado e indica qué campos obligatorios faltan completar.

- **[RF-003] Configurar parámetros por defecto operativos**
  **Descripción**: El sistema debe permitir definir parámetros base de funcionamiento general, como recibos automáticos, filas visibles de turnos, coseguro por defecto, depósito por defecto, duración estándar de turno, horas de confirmación de asistencia y días no laborables.
  **Criterio de aceptación**: Dado que un administrador modifica la duración de turno a 30 minutos y marca sábado y domingo como no laborables, cuando guarda los cambios, entonces esos valores quedan definidos como defaults institucionales para la agenda y los flujos que dependan de ellos.

- **[RF-004] Mostrar impacto de cambios sensibles en parámetros**
  **Descripción**: Cuando un cambio de configuración puede alterar la operación diaria, el sistema debe explicitar su impacto antes de confirmar.
  **Criterio de aceptación**: Dado que un administrador cambia la duración por defecto del turno o las horas de confirmación de asistencia, cuando intenta guardar, entonces el sistema muestra una advertencia indicando que el cambio puede afectar agendas nuevas y comunicaciones futuras antes de confirmar la actualización.

- **[RF-005] Gestionar asistentes de la institución**
  **Descripción**: La institución debe poder dar de alta, listar, editar y desactivar asistentes o personal administrativo vinculado a la operación.
  **Criterio de aceptación**: Dado que un administrador accede a "Configuración → Asistentes", cuando registra un nuevo asistente con nombre, apellido, usuario y email, entonces el sistema lo incorpora al listado de asistentes de esa institución.

- **[RF-006] Gestionar consultorios**
  **Descripción**: El sistema debe permitir administrar los consultorios físicos u operativos disponibles para atención, llamados y asignación de trabajo.
  **Criterio de aceptación**: Dado que la institución necesita agregar un nuevo consultorio, cuando el administrador crea el registro con nombre y descripción y guarda, entonces el consultorio queda disponible para los flujos que requieran identificar lugar de atención.

- **[RF-007] Mantener catálogo de diagnósticos**
  **Descripción**: La institución debe poder consultar y utilizar un catálogo amplio y estructurado de diagnósticos para sostener recetas, fichas y otros procesos clínicos.
  **Criterio de aceptación**: Dado que un usuario autorizado busca un diagnóstico por código o nombre, cuando ingresa el criterio de búsqueda, entonces el sistema devuelve diagnósticos coincidentes del catálogo disponible para la institución.

- **[RF-008] Mantener catálogo de medicamentos**
  **Descripción**: El sistema debe ofrecer un catálogo de medicamentos consultable y gobernable para sostener prescripciones y búsquedas operativas.
  **Criterio de aceptación**: Dado que un profesional o administrador busca un medicamento por acción terapéutica, nombre comercial o laboratorio, cuando ejecuta la búsqueda, entonces el sistema muestra los medicamentos coincidentes con su presentación y referencia comercial.

- **[RF-009] Gestionar tipos de órdenes**
  **Descripción**: La institución debe poder mantener un catálogo de tipos de órdenes activas, con abreviatura, descripción y estado.
  **Criterio de aceptación**: Dado que un administrador crea un tipo de orden con abreviatura "CONS" y descripción "Orden de consulta médica", cuando lo guarda como activo, entonces ese tipo queda disponible para los flujos que requieran clasificar órdenes.

- **[RF-010] Gestionar grupos de prácticas**
  **Descripción**: El sistema debe permitir crear y mantener grupos de prácticas para ordenar conjuntos frecuentes o relacionados dentro de la operación clínica y administrativa.
  **Criterio de aceptación**: Dado que un administrador crea un grupo de prácticas con título y subtítulo, cuando guarda el registro, entonces el grupo queda disponible para su uso institucional en los módulos que correspondan.

- **[RF-011] Gestionar proveedores**
  **Descripción**: La institución debe poder administrar su padrón de proveedores para sostener compras, pagos y trazabilidad administrativa.
  **Criterio de aceptación**: Dado que un administrador registra un proveedor con nombre y correo de contacto, cuando guarda el alta, entonces el proveedor aparece en el listado institucional de proveedores.

- **[RF-012] Aislamiento multi-tenant de configuración**
  **Descripción**: Toda configuración institucional debe pertenecer exclusivamente a la institución que la creó o editó. Ninguna clínica debe ver ni usar la configuración privada de otra.
  **Criterio de aceptación**: Dado que un administrador de la Institución A crea un consultorio o modifica sus parámetros por defecto, cuando un usuario de la Institución B opera el sistema, entonces no ve ni puede usar esos cambios en su propia configuración.

- **[RF-012A] Mostrar plan vigente y estado de cupo profesional**
  **Descripción**: La pantalla de configuración institucional debe informar el plan mensual vigente del tenant y su situación actual respecto del cupo de profesionales activos.
  **Criterio de aceptación**: Dado que un administrador entra a la vista institucional, cuando consulta el bloque de plan, entonces ve el plan actual, el máximo de profesionales activos, el cupo utilizado, el disponible y, si existe, el exceso vigente.

- **[RF-012B] Mostrar período de gracia por exceso post-downgrade**
  **Descripción**: Si el tenant quedó excedido luego de una baja de plan, la configuración debe informar la ventana de gracia para regularizar la situación.
  **Criterio de aceptación**: Dado que la institución quedó excedida por una baja de plan, cuando administración revisa configuración, entonces el sistema muestra fecha de inicio de gracia, fecha estimada de vencimiento y mensaje de regularización.

- **[RF-012C] Explicar alcance real de la restricción por plan**
  **Descripción**: La vista administrativa debe aclarar que la restricción actual impacta sobre nuevas altas y reactivaciones de profesionales, no sobre módulos ni sobre profesionales ya activos.
  **Criterio de aceptación**: Dado que el tenant está al límite o excedido, cuando el administrador revisa su estado de plan, entonces entiende que la operación actual continúa para profesionales ya activos y que el bloqueo aplica solo al crecimiento del padrón profesional.

### P1 — Importantes

- **[RF-013] Mostrar resumen integral de configuración**
  **Descripción**: El sistema debe ofrecer una vista resumen que permita entender el estado general de la configuración institucional antes de entrar a cada catálogo.
  **Criterio de aceptación**: Dado que un administrador entra al módulo de configuración, cuando visualiza la pantalla principal, entonces ve accesos claros a sistema, plan institucional, asistentes, consultorios, diagnósticos, medicamentos, tipos de órdenes, grupos de prácticas y proveedores.

- **[RF-014] Desactivar registros sin borrado destructivo**
  **Descripción**: Para preservar consistencia operativa, los catálogos estructurales deben poder desactivarse sin perder historial.
  **Criterio de aceptación**: Dado que un tipo de orden ya fue utilizado por la institución, cuando el administrador decide retirarlo de uso, entonces puede marcarlo como inactivo y el sistema evita su uso nuevo sin borrar su referencia histórica.

- **[RF-015] Prevenir duplicados evidentes en catálogos administrativos**
  **Descripción**: El sistema debe ayudar a evitar altas duplicadas en asistentes, consultorios, proveedores, tipos de órdenes y grupos de prácticas.
  **Criterio de aceptación**: Dado que un administrador intenta crear un proveedor con el mismo nombre que uno ya existente en la institución, cuando confirma el alta, entonces el sistema advierte la posible duplicación y solicita revisión antes de continuar.

- **[RF-016] Buscar y filtrar dentro de cada catálogo**
  **Descripción**: Cada listado de configuración debe tener búsqueda simple y filtros acordes al tipo de entidad para facilitar mantenimiento.
  **Criterio de aceptación**: Dado que el administrador accede al listado de medicamentos o diagnósticos, cuando ingresa un término de búsqueda, entonces el sistema devuelve los resultados relevantes sin obligarlo a recorrer páginas manualmente.

- **[RF-017] Registrar estado de vigencia de entidades configurables**
  **Descripción**: Los registros administrativos deben poder indicar si están activos, inactivos o fuera de uso.
  **Criterio de aceptación**: Dado que un administrador visualiza el listado de tipos de órdenes, cuando revisa la tabla, entonces puede distinguir cuáles están activas y cuáles no, y filtrar por ese estado.

- **[RF-018] Asociar logo institucional**
  **Descripción**: La institución debe poder mantener una imagen identificatoria para reforzar su identidad en documentos y pantallas institucionales.
  **Criterio de aceptación**: Dado que un administrador carga un logo válido en la configuración institucional, cuando guarda los cambios, entonces el sistema conserva esa imagen como logo de la institución.

- **[RF-019] Definir días no laborables institucionales**
  **Descripción**: La institución debe poder definir qué días no atiende por defecto para reflejar la realidad operativa de la agenda.
  **Criterio de aceptación**: Dado que la clínica no atiende sábados y domingos, cuando el administrador marca ambos días como no laborables y guarda, entonces esos días quedan identificados como inhábiles a nivel institucional.

- **[RF-020] Parametrizar confirmación de asistencia**
  **Descripción**: La institución debe poder definir cuántas horas antes del turno se habilita o informa la confirmación de asistencia.
  **Criterio de aceptación**: Dado que el administrador fija 4 horas para confirmar asistencia, cuando guarda la configuración, entonces ese valor queda establecido como referencia institucional para la gestión de asistencia.

### P2 — Deseables

- **[RF-021] Mostrar última actualización por sección**
  **Descripción**: El sistema puede informar cuándo se modificó por última vez cada bloque de configuración para facilitar control administrativo.
  **Criterio de aceptación**: Dado que el administrador revisa la pantalla de configuración, cuando observa el bloque de proveedores o consultorios, entonces ve la fecha de última actualización visible para esa sección.

- **[RF-022] Checklist de configuración inicial**
  **Descripción**: Para instituciones nuevas, el sistema puede ofrecer una guía de completitud de configuración mínima.
  **Criterio de aceptación**: Dado que una institución inicia su operación por primera vez, cuando entra a configuración, entonces ve un checklist con estado de completitud de datos institucionales, parámetros, consultorios, asistentes y catálogos básicos.

- **[RF-023] Resumen de completitud multi-tenant para soporte interno**
  **Descripción**: Un actor global de administración del producto puede necesitar ver el nivel de completitud de cada tenant sin entrar al detalle operativo de cada institución.
  **Criterio de aceptación**: Dado que un administrador global revisa el estado de adopción de varias instituciones, cuando consulta el resumen general, entonces puede identificar qué tenants tienen configuración mínima completa y cuáles no.

---

## Entidades y Parámetros Clave

### Datos institucionales
| Campo | Obligatorio | Observaciones |
|------|:-----------:|---------------|
| Nombre institucional | ✅ | Nombre comercial o institucional visible |
| Razón social | ✅ | Identificación formal de la entidad |
| CUIT | ✅ | Identidad fiscal |
| Domicilio | ✅ | Domicilio principal de la institución |
| Localidad | ✅ | Ubicación operativa |
| Provincia | ✅ | Jurisdicción |
| Teléfono | ❌ | Contacto institucional |
| Email | ❌ | Contacto administrativo |
| Website | ❌ | Presencia pública institucional |
| Logo | ❌ | Identidad visual |

### Parámetros operativos por defecto
| Parámetro | Ejemplo observado | Impacto de negocio |
|----------|-------------------|--------------------|
| Recibos automáticos | Activado / desactivado | Afecta automatización administrativa |
| Filas de turnos | 30 | Orden de visualización operativa |
| Coseguro default | $0,00 | Base económica inicial |
| Depósito default | $0,00 | Base de pagos a cuenta |
| Duración de turno | 30 min | Organización de agenda |
| Horas para confirmar asistencia | 0 / 1 / más de 1 | Lógica de asistencia |
| Días no atienden | Sábado, domingo | Calendario institucional |

### Estado institucional del plan
| Dato visible | Propósito de negocio |
|-------------|----------------------|
| Plan mensual vigente | Identificar la capacidad contratada actual |
| Cupo máximo de profesionales activos | Entender el límite operativo del padrón profesional |
| Cupo utilizado | Saber cuántos profesionales activos ya consumen capacidad |
| Cupo disponible | Anticipar si todavía pueden darse altas o reactivaciones |
| Exceso actual | Entender cuántos profesionales activos superan el límite vigente |
| Inicio de gracia | Ubicar desde cuándo corre la regularización |
| Vencimiento de gracia | Saber hasta cuándo la institución puede regularizarse |

### Catálogos estructurales incluidos
- Asistentes
- Consultorios
- Diagnósticos
- Medicamentos
- Tipos de órdenes
- Grupos de prácticas
- Proveedores

---

## Requisitos No Funcionales

- **Aislamiento institucional**: ningún dato de configuración de una institución puede ser visible o utilizable por otra.
- **Claridad operativa**: cada parámetro debe tener nombre entendible, ayuda breve y efecto esperable.
- **Trazabilidad administrativa**: los cambios relevantes deben poder atribuirse a una institución y a un usuario responsable.
- **Escalabilidad funcional**: los catálogos masivos, como diagnósticos y medicamentos, deben seguir siendo consultables aun con gran volumen.
- **Consistencia**: los catálogos estructurales deben reutilizarse en todos los módulos que dependen de ellos, evitando definiciones paralelas o contradictorias.
- **Seguridad de operación**: cambios sensibles deben requerir confirmación explícita y mostrar impacto antes de persistirse.

---

## Flujos

### Flujo principal: Configuración inicial de una institución

1. El administrador entra al módulo de configuración.
2. Completa datos institucionales y fiscales mínimos.
3. Define defaults operativos generales.
4. Revisa el bloque institucional de plan y cupo profesional.
5. Registra consultorios y asistentes.
6. Revisa catálogos disponibles de diagnósticos y medicamentos.
7. Ajusta tipos de órdenes, grupos de prácticas y proveedores según su operación.
8. Guarda los cambios.
9. El sistema deja la institución lista para operar con parámetros propios.

### Flujo: Actualizar un parámetro operativo sensible

1. El administrador accede a "Sistema".
2. Modifica un parámetro sensible, por ejemplo duración de turno.
3. Presiona guardar.
4. El sistema muestra una advertencia de impacto.
5. El administrador confirma o cancela.
6. Si confirma, el cambio queda aplicado a la institución.

### Flujo: Alta de proveedor

1. El administrador entra a "Proveedores".
2. Busca si el proveedor ya existe.
3. Si no existe, crea uno nuevo.
4. Completa datos básicos.
5. Guarda el registro.
6. El proveedor queda disponible para procesos administrativos futuros.

### Flujo: Revisión de configuración multi-tenant

1. Un actor con alcance global revisa instituciones activas.
2. Consulta el estado de completitud de cada tenant.
3. Detecta instituciones sin datos mínimos, con configuración incompleta o con situación excedida de cupo profesional.
4. Define acciones de acompañamiento o soporte.

### Flujo: Revisión administrativa de plan y cupo

1. El administrador entra a configuración institucional.
2. Consulta el bloque de plan mensual vigente.
3. Revisa cupo máximo, usado, disponible y exceso si aplica.
4. Si existe una gracia abierta, visualiza su inicio, vencimiento y mensaje de regularización.
5. Usa esa información para decidir si debe desactivar profesionales, reordenar padrón o escalar una gestión comercial fuera del producto.

### Flujos alternativos

- **Dato institucional incompleto**: si falta información crítica, el sistema no deja cerrar configuración base como completa.
- **Intento de duplicado**: si se detecta coincidencia evidente en asistentes, proveedores o consultorios, el sistema advierte antes de confirmar.
- **Entidad ya usada en operación**: si un tipo de orden o proveedor tiene uso previo, se privilegia desactivación por sobre eliminación.

### Flujos de error

- Si el administrador intenta guardar sin permisos, el sistema informa que no tiene autorización para modificar configuración.
- Si se produce un conflicto de edición, el sistema informa que la configuración fue actualizada por otro usuario y solicita revisar antes de guardar otra vez.
- Si un catálogo no puede consultarse temporalmente, el sistema debe mostrar un mensaje entendible y permitir reintentar.
- Si la institución está excedida de cupo, la configuración debe informar la situación sin sugerir que los módulos quedarán deshabilitados automáticamente.

---

## Dependencias con Otros Módulos

- **Turnos y Agenda**: duración por defecto, días no laborables, consultorios y asistentes.
- **Recetas**: diagnósticos, medicamentos y datos institucionales.
- **Odontología / prácticas**: grupos de prácticas y parametrización operativa relacionada.
- **Órdenes**: tipos de órdenes vigentes.
- **Cuenta corriente / administración**: proveedores y datos fiscales institucionales.
- **Autenticación y autorización**: define quién puede ver o editar configuración, pero no forma parte de este PRD.
- **Profesionales**: define cuándo una alta, activación o reactivación consume cupo y cuándo se libera.
- **Ayuda y Onboarding**: reutiliza el lenguaje administrativo para explicar bloqueos legítimos por plan.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] Dado que una institución configura sus datos básicos, cuando guarda la ficha institucional, entonces su perfil queda completo y utilizable en el resto del sistema.
- [ ] Dado que un administrador cambia parámetros operativos por defecto, cuando confirma el guardado, entonces esos valores quedan vigentes para su institución y no para otras.
- [ ] Dado que la clínica necesita mantener asistentes, consultorios, proveedores y tipos de órdenes, cuando opera esos catálogos, entonces puede crear, editar, buscar y desactivar registros de forma controlada.
- [ ] Dado que diagnósticos y medicamentos son catálogos amplios, cuando un usuario los consulta, entonces encuentra resultados relevantes sin recorrer listados completos manualmente.
- [ ] Dado que una institución comparte plataforma con otras, cuando modifica cualquier parte de su configuración, entonces ninguna otra institución ve ni recibe ese cambio.
- [ ] Dado que un administrador necesita entender por qué no puede dar de alta o reactivar otro profesional, cuando entra a configuración institucional, entonces encuentra plan vigente, cupo máximo, cupo usado, disponible, exceso y gracia si corresponde.
- [ ] Dado que la institución está excedida luego de una baja de plan, cuando revisa su estado administrativo, entonces entiende que los profesionales ya activos siguen operativos y que la restricción aplica sobre nuevas altas o reactivaciones.

### Comportamientos críticos
- La configuración siempre es por institución.
- Los parámetros por defecto no deben impactar retroactivamente en forma silenciosa sin advertencia cuando el negocio necesite controlarlo.
- Los catálogos estructurales deben sostener operación real y no quedar desacoplados del uso diario.
- La eliminación destructiva debe evitarse cuando exista historial asociado.
- La vista de configuración debe explicar el estado del plan sin convertirse en un módulo de billing ni sugerir feature gating por plan.

### Métricas de impacto
- Tiempo de puesta a punto de una institución nueva con configuración mínima completa.
- Porcentaje de instituciones con configuración base completa.
- Cantidad de incidencias operativas originadas por defaults mal configurados.
- Cantidad de registros duplicados detectados en catálogos administrativos.
- Tiempo promedio para encontrar y actualizar un registro de configuración.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Cambios sensibles sin entender impacto | Alta | Alto | Advertencias previas al guardado y ayuda contextual por parámetro |
| Configuración incompleta al iniciar una institución | Alta | Alto | Checklist de configuración mínima y validaciones obligatorias |
| Duplicados en proveedores, consultorios o asistentes | Media | Medio | Búsqueda previa y detección de coincidencias evidentes |
| Inconsistencia entre catálogos y operación real | Media | Alto | Reutilización obligatoria de catálogos institucionales en módulos dependientes |
| Fuga de configuración entre tenants | Baja | Crítico | Aislamiento estricto por institución en toda lectura y edición |
| Eliminación de registros con uso histórico | Media | Alto | Desactivación lógica en lugar de borrado destructivo |
| Lectura confusa del plan institucional | Media | Alto | Mostrar cupo, uso, disponible, exceso y gracia en lenguaje administrativo simple |

---

## Preguntas Abiertas

- [ ] ¿Qué campos exactos deben ser obligatorios para considerar "completa" la configuración institucional?
- [ ] ¿Qué cambios de parámetros deben impactar solo a operaciones futuras y cuáles pueden recalcularse sobre operaciones pendientes?
- [ ] ¿Quién puede administrar catálogos estructurales: solo administración institucional o también perfiles clínicos avanzados?
- [ ] ¿Los catálogos de diagnósticos y medicamentos son compartidos entre tenants o pueden tener extensiones propias por institución?
- [ ] ¿Qué nivel de soporte central necesita el modelo multi-tenant para acompañar instituciones nuevas sin intervenir manualmente en cada caso?
- [ ] ¿Quién actualiza fuera del producto el plan vigente del tenant mientras no exista autoservicio comercial definido?

---

## Roadmap Sugerido

### Quick wins
- Datos institucionales completos
- Defaults operativos visibles y editables
- CRUD de consultorios, asistentes y proveedores
- Búsqueda y estado en tipos de órdenes

### Mediano plazo
- Checklist de configuración inicial
- Resumen integral de completitud
- Desactivación segura con trazabilidad administrativa
- Ayudas contextuales por parámetro y catálogo

### Estratégicas
- Gobierno multi-tenant con métricas de adopción por institución
- Políticas de configuración avanzada por tipo de clínica
- Extensiones institucionales controladas sobre catálogos estructurales
