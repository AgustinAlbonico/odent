# PRD: Autenticación y Autorización

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P0 — fundacional
> **Complejidad**: muy alta

---

## 1. Resumen ejecutivo

Este PRD define la capa fundacional de acceso del sistema odontológico. Su objetivo es asegurar que cada persona ingrese con una identidad verificable, opere dentro de una sesión controlada y solo pueda ver o hacer lo que su rol, sus permisos y su alcance le habilitan dentro de la institución.

El módulo debe resolver login con mail y contraseña, sesión basada en JWT almacenado en cookies seguras, recuperación y cambio de contraseña, expiración y renovación de sesión, cierre de sesión, auditoría de accesos, protección frente a abuso, asignación de roles y permisos granulares por módulo y acción.

También debe establecer una diferencia no negociable entre:

- lo que un usuario puede **ver**,
- lo que un usuario puede **hacer**,
- y sobre **qué universo de datos** puede hacerlo.

Este documento funciona como contrato transversal para el resto de los PRDs. Pacientes, turnos, odontograma, historia clínica, recetas, depósitos, presupuestos, profesionales, mutuales y cuenta corriente dependen de estas reglas para definir visibilidad, operaciones permitidas, menús disponibles y trazabilidad.

Además, debe contemplar una restricción institucional ya cerrada: cada tenant opera con un plan mensual vigente que define cuántos profesionales activos puede sostener. Esa política no altera permisos por rol ni habilita o bloquea módulos, pero sí puede impedir acciones administrativas de alta, activación o reactivación de profesionales cuando el cupo contratado está agotado o el tenant sigue excedido luego de su gracia.

---

## 2. Problema de negocio

La clínica trabaja con información clínica, personal, operativa y económica de alta sensibilidad. Si el sistema no distingue con precisión quién es cada usuario, cuánto dura su sesión y qué puede ver o ejecutar, aparecen tres riesgos graves al mismo tiempo:

- exposición indebida de datos de pacientes;
- acciones clínicas o económicas realizadas por personas sin atribución;
- imposibilidad de reconstruir responsabilidades ante incidentes, reclamos o auditorías.

Además, este problema no vive aislado. En un sistema odontológico real, recepción necesita buscar pacientes y mover turnos; profesionales necesitan atender y registrar prácticas; administración necesita cobrar, pagar y configurar; supervisión necesita visibilidad ampliada sin convertirse en administración total. Si todos comparten el mismo acceso, el producto pierde control. Si el acceso es demasiado rígido o confuso, la operación diaria se traba.

Por eso este PRD fija el modelo de identidad, sesión y permisos como base obligatoria para todos los módulos posteriores.

---

## 3. Oportunidad

Una política de acceso bien definida permite:

- reducir riesgo clínico, operativo y financiero;
- delegar tareas sin abrir información de más;
- adaptar menús, acciones y vistas al trabajo real de cada perfil;
- sostener auditoría y trazabilidad desde la primera versión;
- evitar que cada módulo invente su propia lógica de permisos.

En términos de negocio, esto convierte el acceso en una capacidad institucional administrable y no en una suma de excepciones informales.

---

## 4. Usuarios y actores

### Usuario principal

#### Administrador institucional
- Da de alta, baja o modifica usuarios.
- Asigna roles, permisos y alcances.
- Necesita controlar sesiones, accesos y trazabilidad sin depender de soporte.

### Usuarios secundarios

#### Profesional
- Necesita entrar rápido y operar durante su jornada sin fricción innecesaria.
- Debe ver solo sus pacientes, sus turnos y la información habilitada para su práctica o supervisión.

#### Asistente / recepción
- Necesita acceso operativo a agenda, pacientes, presupuestos, mutuales y cobros habilitados.
- No debe quedar expuesto por defecto a contenido clínico completo ni a administración general.

#### Profesional supervisor
- Necesita una mirada clínica ampliada y, cuando la institución lo defina, cierta visibilidad operativa o económica de supervisión.
- No equivale a administrador.

#### Dirección / auditoría interna
- Necesita revisar accesos, sesiones, incidentes y patrones de uso.
- Requiere evidencia clara sobre quién ingresó, qué intentó hacer y con qué resultado.

---

## 5. Objetivos

### Objetivos de negocio
- Establecer un modelo único y explícito de identidad, sesión y permisos para toda la institución.
- Reducir al mínimo la exposición indebida de información clínica y financiera.
- Permitir delegación operativa segura entre administración, recepción, profesionales y supervisión.
- Hacer auditables los eventos relevantes de acceso y control de sesión.
- Evitar contradicciones de permisos entre módulos del producto.

### Objetivos de usuario
- Ingresar con mail y contraseña de manera simple.
- Mantener continuidad de uso durante la jornada sin quedar conectado indefinidamente.
- Recuperar o cambiar contraseña sin depender de procesos manuales improvisados.
- Ver solo los módulos, pantallas y acciones realmente habilitadas para su función.
- Recibir mensajes claros cuando una credencial, sesión o permiso no permite continuar.

### Indicadores esperados
- 100% de usuarios activos con rol y alcance explícitos.
- 0 accesos exitosos a módulos fuera de permiso esperado.
- Reducción de incidentes internos por visibilidad excesiva.
- Menor dependencia de administración manual para recuperar acceso cotidiano.
- Trazabilidad completa de eventos críticos de autenticación y autorización.

---

## 6. Alcance

### Incluido en esta versión
- Login con mail y contraseña.
- Sesión basada en JWT almacenado en cookies seguras.
- Renovación de sesión bajo política controlada.
- Expiración por inactividad y por duración máxima.
- Cierre de sesión manual.
- Cierre de sesiones activas por seguridad o decisión administrativa.
- Recuperación de contraseña.
- Cambio de contraseña por iniciativa del usuario.
- Cambio obligatorio de contraseña impuesto por administración.
- Bloqueo temporal por abuso o intentos fallidos reiterados.
- Auditoría de eventos de acceso, sesión y autorización.
- Roles base predefinidos.
- Permisos granulares por módulo, acción y alcance.
- Diferenciación explícita entre permisos de ver y hacer.
- Menú, accesos rápidos, botones y acciones condicionados por permisos.
- Restricción efectiva de acceso incluso ante intento directo de entrar a una pantalla o acción.

### Fuera de alcance
- Portal de pacientes o acceso de terceros externos.
- Inicio de sesión con proveedores externos de identidad.
- Doble factor de autenticación como requisito de esta primera versión.
- Gobierno multiempresa por encima de la institución activa.
- Motor avanzado de políticas adaptativas basado en riesgo en tiempo real.

---

## 7. Principios de negocio

- **Una identidad, una responsabilidad**: toda acción debe quedar asociada a una persona identificable.
- **Ver no implica hacer**: visualizar un dato y operar sobre él son permisos distintos.
- **Hacer no implica ver todo**: una tarea puede autorizarse solo dentro de un subconjunto de información.
- **El alcance importa tanto como el permiso**: no alcanza con saber si alguien puede operar; hay que saber sobre qué universo puede hacerlo.
- **La interfaz acompaña, pero no reemplaza el control**: ocultar botones reduce error, pero la protección real debe aplicarse también al intentar entrar por acceso directo.
- **La sesión debe equilibrar continuidad y seguridad**: no cortar la jornada sin razón, pero tampoco permitir acceso indefinido.
- **La excepción debe ser explícita y auditable**: cualquier ampliación de permisos tiene que quedar definida y revisable.
- **La institución es el límite operativo base**: los permisos se ejercen dentro de la institución activa y nunca por fuera de ella.
- **La capacidad contratada no equivale a permisos**: un rol puede tener atribución para administrar profesionales y aun así quedar impedido de crear o reactivar uno nuevo por una restricción institucional de cupo.

---

## 8. Modelo fundacional de acceso

### 8.1 Modelo de identidad

Cada usuario operativo del sistema debe tener:

- una identidad única de acceso;
- un mail validado como credencial principal de ingreso;
- una contraseña vigente;
- pertenencia a una institución;
- un estado de cuenta;
- un rol base;
- permisos efectivos;
- un alcance de datos aplicable.

### 8.2 Estados de cuenta

Los estados mínimos de una cuenta serán:

- **Pendiente de activación**: existe la cuenta, pero todavía no quedó habilitada para operar.
- **Activa**: puede iniciar sesión y operar según permisos.
- **Bloqueada temporalmente**: no puede ingresar hasta que venza el bloqueo o se rehabilite por vía controlada.
- **Suspendida**: queda fuera de operación por decisión administrativa.
- **Baja**: deja de operar y no debe conservar acceso vigente.

### 8.3 Modelo de sesión

La sesión representa el período de acceso válido del usuario dentro de la institución. Debe cumplir estas reglas de negocio:

- se crea solo después de un login exitoso;
- se sostiene mediante JWT en cookies seguras;
- se renueva mientras exista actividad válida y la política lo permita;
- vence por inactividad;
- vence también por duración máxima de sesión, aunque haya actividad;
- puede cerrarse por el usuario, por administración o por eventos de seguridad;
- al finalizar, debe impedir reutilizar la continuidad anterior.

### 8.4 Modelo de autorización

La autorización se define por la combinación de tres capas:

1. **Rol base**: ubica al usuario en un marco general de trabajo.
2. **Permiso**: define qué puede ver o hacer en un módulo o acción.
3. **Alcance**: define sobre qué universo de datos aplica ese permiso.

Fórmula de negocio esperada:

**Acceso efectivo = identidad válida + sesión vigente + permiso habilitado + alcance aplicable**

Si falla cualquiera de esas condiciones, la acción debe bloquearse.

### 8.5 Restricción institucional por plan mensual

Además de identidad, sesión, permiso y alcance, ciertas acciones administrativas deben respetar una política institucional de capacidad contratada.

Reglas obligatorias:

- cada tenant tiene un plan mensual vigente;
- el plan define la cantidad máxima de profesionales activos permitidos;
- solo consumen cupo los profesionales activos;
- asistentes, administradores y supervisores no consumen cupo;
- si el cupo está agotado, no se puede crear, activar ni reactivar otro profesional;
- si un profesional pasa a inactivo, suspendido o equivalente, libera cupo;
- si el tenant baja de plan y queda excedido, se abre una gracia de 30 días;
- durante y después de la gracia no se bloquea el acceso ni la operación de profesionales ya activos;
- al terminar la gracia, si el tenant sigue excedido, solo se bloquean nuevas altas y reactivaciones.

Esta restricción institucional aplica sobre el padrón profesional y su administración. No funciona como feature gating y no debe apagar módulos del producto.

---

## 9. Modelo de alcance

### 9.1 Tipos de alcance

El sistema debe trabajar, como mínimo, con estos alcances:

| Alcance | Definición de negocio | Ejemplos típicos |
|---|---|---|
| **Propio** | Solo datos generados por el propio usuario o directamente asignados a él | agenda propia, pacientes propios, recetas emitidas por el profesional |
| **Asignado / habilitado** | Datos asignados al usuario por relación operativa definida por la institución | pacientes de un consultorio, agenda compartida, depósitos habilitados |
| **Operativo institucional** | Datos necesarios para una función administrativa transversal, sin habilitar gobierno total | recepción viendo agenda institucional, padrón de pacientes, presupuestos y mutuales |
| **Supervisión** | Visibilidad ampliada para control o continuidad clínica, sin administración global completa | profesional supervisor revisando actividad clínica de otros profesionales |
| **Institucional total** | Acceso completo dentro de la institución activa | administrador institucional |

### 9.2 Reglas de alcance por defecto

- **Admin**: institucional total.
- **Profesional**: propio o asignado/habilitado.
- **Asistente**: operativo institucional en módulos administrativos definidos, sin acceso clínico completo por defecto.
- **Profesional Supervisor**: supervisión clínica y operativa ampliada, sin gobierno administrativo total salvo permiso excepcional.

### 9.3 Regla crítica

Un rol puede tener permiso para operar un módulo y aun así no tener alcance sobre todos los registros de ese módulo. Esta distinción es obligatoria para pacientes, turnos, historia clínica, odontograma, recetas, depósitos y cuenta corriente.

---

## 10. Roles base

| Rol | Propósito principal | Qué puede ver por defecto | Qué no debe ver o hacer por defecto |
|---|---|---|---|
| **Admin** | Gobernar el acceso y la operación institucional | Todos los módulos habilitados para la institución, auditoría, usuarios, permisos, sesiones, configuración | Nada dentro de la institución salvo restricciones futuras especiales |
| **Profesional** | Atender pacientes y operar su práctica | agenda propia, pacientes propios o habilitados, historia clínica y odontograma dentro de su alcance, recetas y presupuestos habilitados | configuración institucional, usuarios, permisos, contabilidad global, auditoría general |
| **Asistente** | Sostener operación administrativa y de recepción | agenda, pacientes, mutuales, presupuestos, depósitos y cobros habilitados, datos operativos necesarios | historia clínica completa, odontograma clínico completo, recetas, permisos, configuración central, auditoría general |
| **Profesional Supervisor** | Supervisar continuidad clínica y parte de la operación | universo clínico ampliado, agenda supervisada, pacientes y actividad de supervisión, métricas o reportes habilitados | administración total de usuarios, permisos y configuración salvo excepción explícita |

---

## 11. Taxonomía de permisos

Para mantener consistencia entre módulos, el sistema debe usar una taxonomía común de permisos.

### 11.1 Permisos de visualización
- **Ver módulo**: acceder al menú o punto de entrada.
- **Ver listado**: consultar grillas, búsquedas o tableros.
- **Ver detalle**: abrir información completa de un registro.
- **Ver datos sensibles**: acceder a contenido clínico o económico que requiere resguardo especial.
- **Ver auditoría**: consultar historial de accesos, sesiones o eventos.

### 11.2 Permisos operativos
- **Crear**: dar de alta un registro.
- **Editar**: modificar un registro existente.
- **Cambiar estado**: confirmar, cancelar, bloquear, rehabilitar, cerrar, etc.
- **Emitir**: generar un documento o resultado operativo, por ejemplo receta.
- **Anular**: dejar sin efecto un acto conservando trazabilidad.
- **Cerrar sesión ajena**: finalizar sesiones activas de otros usuarios.

### 11.3 Permisos de administración
- **Administrar catálogo**: gestionar parámetros o maestros de un módulo.
- **Administrar usuarios**: alta, baja, activación, suspensión.
- **Administrar roles y permisos**: asignación y ajuste de control de acceso.
- **Administrar políticas**: reglas de sesión, bloqueo, recuperación y seguridad.

### 11.4 Regla transversal

Todo permiso debe evaluarse junto con el alcance. Ejemplo: “editar paciente” no significa “editar cualquier paciente”, sino “editar paciente dentro del alcance permitido”.

---

## 12. Catálogo robusto de permisos por módulo

### 12.1 Convenciones
- **Ver**: habilita acceso a menú, listado y detalle según el permiso específico.
- **Hacer**: habilita crear, editar, registrar, confirmar, emitir, cobrar o ejecutar acciones del módulo.
- **Administrar**: habilita parametrización, reglas globales o gobierno del módulo.
- **Alcance**: determina sobre qué registros aplica la capacidad.

### 12.2 Matriz de referencia fundacional

| Módulo | Qué se puede VER | Qué se puede HACER | Qué se puede ADMINISTRAR | Alcance esperado | Roles base típicos |
|---|---|---|---|---|---|
| **Inicio / dashboard** | home, indicadores y accesos rápidos del rol | usar accesos directos habilitados | personalizar reglas institucionales del tablero si aplica | según rol | Admin, Profesional, Asistente, Supervisor |
| **Pacientes** | padrón, ficha y vínculos del paciente | alta, edición, baja administrada, acciones rápidas habilitadas | reglas generales del padrón, duplicados, exportaciones habilitadas | propio, asignado, operativo institucional o total | Admin, Asistente, Profesional, Supervisor |
| **Turnos y agenda** | calendario, búsqueda, agenda diaria/semanal/mensual | crear, mover, confirmar, cancelar, marcar estados | reglas de agenda, feriados, excepciones y parámetros institucionales | propio, asignado, operativo institucional o supervisión | Admin, Asistente, Profesional, Supervisor |
| **Llamador** | cola y estado de atención | llamar siguiente, cambiar estado operativo, seleccionar consultorio si aplica | reglas de uso y parametrización del módulo | propio, asignado u operativo institucional | Admin, Asistente, Profesional, Supervisor |
| **Historia clínica** | antecedentes, timeline clínico y registros | cargar, editar, completar registros clínicos habilitados | plantillas, reglas clínicas globales si la institución lo define | propio, asignado o supervisión | Admin, Profesional, Supervisor |
| **Odontograma** | diagrama, historial y prácticas del paciente | registrar práctica nueva, registrar preexistente, anular según permiso | catálogos y reglas clínicas asociadas al módulo | propio, asignado o supervisión | Admin, Profesional, Supervisor |
| **Recetas** | listado, detalle y contexto del paciente | emitir, actualizar estados, consultar historial permitido | catálogos o parámetros regulatorios del módulo | propio, asignado o supervisión | Admin, Profesional, Supervisor |
| **Presupuestos** | listados y detalle de propuestas | crear, editar, aprobar, actualizar estado según permiso | reglas o catálogos del módulo si aplica | propio, asignado u operativo institucional | Admin, Profesional, Asistente, Supervisor |
| **Mutuales / obras sociales** | catálogo general, mutuales del paciente, condiciones visibles | vincular mutual a paciente, actualizar afiliado y plan | administrar catálogo institucional de mutuales y parámetros | operativo institucional o total; vínculo paciente según alcance | Admin, Asistente, Profesional, Supervisor |
| **Depósitos** | listado, detalle y estados | registrar, actualizar estado, reintegrar según permiso | políticas y reglas globales del circuito | propio, asignado, operativo institucional o supervisión | Admin, Asistente, Profesional, Supervisor |
| **Cuenta corriente del paciente** | deuda, saldo, movimientos y detalle permitido | vender, cobrar, imputar, registrar acciones habilitadas | reglas económicas del circuito paciente | propio, asignado, operativo institucional o supervisión | Admin, Asistente, Profesional, Supervisor |
| **Contabilidad general / reportes** | arqueo, mayor, saldos, transacciones, centro de costos, reportes | registrar pagos, retiros, ajustes y anulaciones controladas | plan de cuentas, comisiones, proveedores, órdenes y reglas generales | institucional o supervisión económica explícita | Admin, Supervisor excepcional |
| **Profesionales** | padrón, perfil, datos habilitados | editar perfil propio, horarios y datos permitidos; administrar otros si corresponde | alta, baja y parametrización de profesionales | propio para perfil; total para gestión | Admin, Profesional, Supervisor según permiso |
| **Asistentes** | padrón y detalle habilitado | alta, edición, activación o suspensión | gobierno del padrón de asistentes | institucional total | Admin |
| **Configuración del sistema** | parámetros institucionales | modificar configuración habilitada | administración completa de defaults y catálogos | institucional total | Admin |
| **Usuarios, roles y permisos** | padrón de usuarios, roles asignados, permisos efectivos | crear usuario, activar, suspender, asignar rol, ajustar permisos y alcances | políticas integrales de acceso | institucional total | Admin |
| **Auditoría de accesos** | eventos de login, logout, bloqueo, recuperación, cambios de contraseña, sesiones y rechazos | consultar, filtrar, exportar según permiso | definir retención y políticas del módulo | institucional total o propio historial | Admin; usuarios sobre su propio historial si se habilita |

### 12.3 Reglas de consistencia por módulo crítico

#### Pacientes
- Un profesional no debe ver por defecto todo el padrón institucional si su alcance es propio o asignado.
- Un asistente puede operar altas y datos administrativos del paciente si la institución lo habilita.
- Ver la ficha del paciente no habilita por sí mismo ver toda la historia clínica ni toda la cuenta corriente.

#### Turnos y agenda
- Recepción puede necesitar visión institucional operativa para coordinar turnos de varios profesionales.
- Profesional ve por defecto su agenda y la información necesaria para atender.
- Supervisor puede ver agenda ampliada para coordinación clínica.

#### Historia clínica y odontograma
- Son contenidos clínicos sensibles.
- Asistente no accede por defecto al detalle clínico completo.
- Profesional opera dentro de su alcance.
- Supervisor puede acceder a visibilidad ampliada cuando la institución lo defina para continuidad clínica.

#### Recetas
- Solo perfiles clínicos habilitados deben emitir o ver detalle completo.
- La recepción no debe emitir recetas por defecto.

#### Cuenta corriente y contabilidad
- La cuenta corriente del paciente puede requerir visibilidad operativa para recepción y administración.
- La contabilidad general, arqueo, mayor, saldos y reglas de comisiones no deben quedar abiertos por defecto a profesionales o asistentes.
- El supervisor económico solo accede si la institución lo define explícitamente.

---

## 13. Requisitos funcionales

### P0 — Críticos

#### RF-AA-001 — Login con mail y contraseña
El sistema debe permitir que un usuario activo ingrese con mail registrado y contraseña válida.

**Criterio de aceptación**
- **Dado** un usuario activo con credenciales vigentes,
- **Cuando** ingresa su mail y contraseña correctos,
- **Entonces** el sistema autentica su identidad y habilita una sesión válida.

#### RF-AA-002 — Sesión segura con JWT en cookies
La continuidad de acceso debe sostenerse mediante JWT almacenado en cookies seguras, sin exponer la sesión de manera innecesaria para el usuario.

**Criterio de aceptación**
- **Dado** un login exitoso,
- **Cuando** el sistema habilita el acceso,
- **Entonces** crea una sesión válida basada en JWT en cookies seguras y la usa para sostener la navegación autorizada.

#### RF-AA-003 — Identidad inequívoca por sesión
Cada sesión debe quedar asociada a una identidad, una institución, un rol y un conjunto de permisos efectivos.

**Criterio de aceptación**
- **Dado** un usuario autenticado,
- **Cuando** realiza acciones en el sistema,
- **Entonces** cada evento puede vincularse a su identidad, institución y permisos vigentes.

#### RF-AA-004 — Evaluación separada de ver y hacer
El sistema debe evaluar por separado permisos de visualización y permisos operativos.

**Criterio de aceptación**
- **Dado** un usuario con permiso para ver un módulo pero no para operar,
- **Cuando** accede al módulo,
- **Entonces** puede visualizar lo autorizado pero no ejecutar acciones no habilitadas.

#### RF-AA-005 — Restricción por alcance
Los permisos deben aplicarse sobre un alcance explícito de datos y no sobre la totalidad institucional por defecto.

**Criterio de aceptación**
- **Dado** un profesional con alcance propio,
- **Cuando** consulta pacientes, turnos, historia clínica, odontograma, recetas o cuenta corriente,
- **Entonces** solo accede al universo habilitado para ese alcance.

#### RF-AA-006 — Roles base obligatorios
La institución debe operar con los roles base Admin, Profesional, Asistente y Profesional Supervisor.

**Criterio de aceptación**
- **Dado** que se crea o actualiza un usuario,
- **Cuando** se asigna su rol base,
- **Entonces** el sistema permite elegir entre los roles fundacionales definidos.

#### RF-AA-007 — Asignación de permisos granulares
Además del rol base, el sistema debe permitir definir permisos por módulo y acción.

**Criterio de aceptación**
- **Dado** un usuario o perfil a configurar,
- **Cuando** administración revisa sus capacidades,
- **Entonces** puede definir permisos explícitos de ver, hacer y administrar por módulo.

#### RF-AA-008 — Menú y acciones condicionadas por permisos
La interfaz debe mostrar solo módulos, accesos y acciones disponibles para el usuario.

**Criterio de aceptación**
- **Dado** un usuario con permisos limitados,
- **Cuando** navega por el sistema,
- **Entonces** el menú, los accesos rápidos, los botones y las acciones de tabla reflejan solo lo habilitado.

#### RF-AA-009 — Bloqueo efectivo ante acceso no autorizado
El sistema debe rechazar intentos de acceso a pantallas o acciones no permitidas incluso si el usuario intenta llegar por una ruta directa.

**Criterio de aceptación**
- **Dado** un usuario sin permiso suficiente,
- **Cuando** intenta entrar a una pantalla o ejecutar una acción restringida,
- **Entonces** el sistema bloquea la operación y comunica el motivo de forma clara.

#### RF-AA-009A — Restricción institucional para crecimiento del padrón profesional
Cuando una acción administrativa implique crear, activar o reactivar un profesional, el sistema debe evaluar también la restricción institucional por plan mensual vigente del tenant.

**Criterio de aceptación**
- **Dado** un administrador con permiso suficiente para gestionar profesionales,
- **Cuando** intenta crear, activar o reactivar un profesional,
- **Entonces** el sistema también valida el cupo de profesionales activos definido por el plan vigente antes de permitir la acción.

#### RF-AA-010 — Recuperación de contraseña
Un usuario que olvidó su contraseña debe poder iniciar un proceso de recuperación controlado.

**Criterio de aceptación**
- **Dado** un usuario registrado que no recuerda su contraseña,
- **Cuando** solicita recuperarla y completa el proceso válido,
- **Entonces** puede definir una nueva contraseña y volver a ingresar.

#### RF-AA-011 — Cambio de contraseña por iniciativa propia
El usuario autenticado debe poder cambiar su contraseña desde su espacio de perfil o seguridad.

**Criterio de aceptación**
- **Dado** un usuario autenticado,
- **Cuando** solicita cambiar su contraseña y confirma una nueva válida,
- **Entonces** el sistema actualiza la credencial y conserva la política de seguridad definida.

#### RF-AA-012 — Cambio obligatorio de contraseña
Administración debe poder obligar a un usuario a redefinir su contraseña antes de continuar operando.

**Criterio de aceptación**
- **Dado** un usuario marcado para cambio obligatorio,
- **Cuando** inicia sesión,
- **Entonces** el sistema exige el cambio antes de habilitar el resto de la operación.

#### RF-AA-013 — Expiración por inactividad
La sesión debe vencer cuando no existe actividad durante el tiempo permitido.

**Criterio de aceptación**
- **Dado** un usuario con sesión iniciada,
- **Cuando** supera el umbral de inactividad definido,
- **Entonces** el sistema da por vencida la sesión y exige reautenticación.

#### RF-AA-014 — Expiración por duración máxima
La sesión también debe finalizar al alcanzar su tiempo máximo permitido aunque el usuario haya tenido actividad.

**Criterio de aceptación**
- **Dado** un usuario con sesión activa prolongada,
- **Cuando** alcanza la duración máxima definida,
- **Entonces** el sistema exige iniciar sesión nuevamente.

#### RF-AA-015 — Renovación controlada de sesión
Mientras la sesión siga siendo válida y haya actividad, el sistema debe poder renovarla bajo política controlada.

**Criterio de aceptación**
- **Dado** un usuario activo dentro de los límites permitidos,
- **Cuando** continúa operando durante su jornada,
- **Entonces** el sistema renueva la continuidad de la sesión sin obligar a relogueos innecesarios.

#### RF-AA-016 — Cierre de sesión manual
El usuario debe poder cerrar sesión en cualquier momento desde una acción visible.

**Criterio de aceptación**
- **Dado** un usuario autenticado,
- **Cuando** elige cerrar sesión,
- **Entonces** pierde acceso inmediato y debe volver a autenticarse para reingresar.

#### RF-AA-017 — Gestión de sesiones activas
Administración debe poder identificar sesiones activas y finalizarlas cuando corresponda.

**Criterio de aceptación**
- **Dado** un administrador con permiso suficiente,
- **Cuando** consulta sesiones activas,
- **Entonces** puede verlas y cerrar las que requieran intervención.

#### RF-AA-018 — Bloqueo temporal por abuso
El sistema debe aplicar bloqueo temporal ante intentos fallidos reiterados o patrones evidentes de abuso.

**Criterio de aceptación**
- **Dado** múltiples intentos fallidos sobre una cuenta o contexto de acceso,
- **Cuando** se supera el umbral permitido,
- **Entonces** el sistema bloquea temporalmente nuevos intentos y comunica la situación.

#### RF-AA-019 — Auditoría de eventos de acceso
El sistema debe registrar eventos críticos de autenticación, sesión y autorización.

**Criterio de aceptación**
- **Dado** un evento relevante de acceso o control,
- **Cuando** ocurre,
- **Entonces** queda un registro auditable con identidad, fecha, tipo de evento y resultado.

### P1 — Importantes

#### RF-AA-020 — Rehabilitación controlada de cuentas
Una cuenta bloqueada debe poder rehabilitarse por recuperación válida o por acción administrativa autorizada.

**Criterio de aceptación**
- **Dado** un usuario bloqueado temporalmente o suspendido según política rehabilitable,
- **Cuando** completa el proceso válido,
- **Entonces** recupera capacidad de ingreso según su estado final.

#### RF-AA-021 — Historial personal de accesos
El usuario puede consultar sus accesos recientes y cierres de sesión para detectar actividad inusual.

**Criterio de aceptación**
- **Dado** un usuario autenticado,
- **Cuando** consulta su historial,
- **Entonces** visualiza sus eventos recientes permitidos.

#### RF-AA-022 — Redirección inicial según contexto de trabajo
Luego del login, cada usuario debe aterrizar en una pantalla inicial coherente con su función.

**Criterio de aceptación**
- **Dado** un inicio de sesión exitoso,
- **Cuando** el sistema habilita el acceso,
- **Entonces** dirige al usuario a un punto de entrada alineado con su rol y permisos.

#### RF-AA-023 — Política institucional de sesión configurable dentro de límites seguros
La institución debe poder ajustar ciertos parámetros de sesión dentro de un marco permitido.

**Criterio de aceptación**
- **Dado** un administrador con permiso de políticas,
- **Cuando** modifica los parámetros habilitados,
- **Entonces** el sistema aplica la política resultante sin salir de los límites mínimos y máximos definidos por producto.

#### RF-AA-024 — Exportación controlada de auditoría
Usuarios habilitados deben poder exportar eventos de auditoría para revisión interna o respuesta ante incidentes.

**Criterio de aceptación**
- **Dado** un usuario con permiso de auditoría y exportación,
- **Cuando** solicita exportar un recorte válido,
- **Entonces** obtiene un resultado consistente con el universo autorizado.

### P2 — Deseables

#### RF-AA-025 — Aviso de acceso inusual
El sistema puede alertar al usuario o a administración cuando detecta un acceso fuera de patrón razonable.

#### RF-AA-026 — Revisión periódica de permisos sensibles
La institución puede revisar y confirmar permisos sensibles en ciclos definidos.

---

## 14. Eventos mínimos de auditoría

El sistema debe registrar como mínimo:

- login exitoso;
- login fallido;
- bloqueo temporal por abuso;
- desbloqueo o rehabilitación;
- inicio de recuperación de contraseña;
- cambio exitoso de contraseña;
- cambio obligatorio de contraseña cumplido;
- cierre de sesión manual;
- vencimiento de sesión por inactividad;
- vencimiento de sesión por duración máxima;
- renovación de sesión;
- cierre administrativo de sesión;
- alta, suspensión o baja de usuario;
- cambio de rol;
- cambio de permisos o alcance;
- intento de acceso no autorizado a módulo o acción.

---

## 15. Requisitos no funcionales

- **Seguridad**: el acceso debe ser compatible con la sensibilidad clínica, personal y económica del negocio.
- **Claridad**: credenciales inválidas, sesión vencida, bloqueo o permiso insuficiente deben comunicarse en lenguaje entendible.
- **Consistencia**: el mismo usuario no puede ver reglas contradictorias entre módulos.
- **Continuidad operativa**: la sesión debe acompañar la jornada sin exigir reingresos arbitrarios.
- **Auditabilidad**: los eventos críticos deben poder revisarse tiempo después sin perder contexto.
- **Privacidad por diseño**: las pantallas no deben mostrar más datos que los estrictamente necesarios para la función.
- **Administrabilidad**: la institución debe poder gestionar usuarios, permisos y sesiones sin soporte informal.

---

## 16. Flujos de negocio

### Flujo principal — Ingreso al sistema
1. El usuario abre la pantalla de login.
2. Ingresa mail y contraseña.
3. El sistema valida credenciales, estado de cuenta y política de acceso.
4. Si la validación es correcta, crea una sesión válida en cookies seguras.
5. Determina rol, permisos y alcance efectivos.
6. Muestra solo los módulos y acciones disponibles.
7. Redirige al punto de inicio coherente con el contexto del usuario.

### Flujo — Renovación de sesión durante la jornada
1. El usuario continúa operando dentro del tiempo permitido.
2. El sistema reconoce actividad válida.
3. Si la política lo permite, renueva la continuidad de la sesión.
4. El usuario sigue trabajando sin relogueo innecesario.
5. Si se alcanzó la duración máxima, la sesión no se renueva y deberá reiniciarse.

### Flujo — Recuperación de contraseña
1. El usuario indica que olvidó su contraseña.
2. El sistema inicia un proceso controlado de recuperación.
3. El usuario valida el proceso y define una nueva contraseña.
4. El sistema invalida continuidad previa según política.
5. El usuario vuelve a ingresar con su nueva credencial.

### Flujo — Cambio de contraseña desde perfil
1. El usuario autenticado ingresa a su espacio de seguridad.
2. Solicita cambiar su contraseña.
3. Confirma la nueva credencial válida.
4. El sistema actualiza la contraseña y registra el evento.

### Flujo — Cambio obligatorio de contraseña
1. Administración marca a un usuario con cambio obligatorio.
2. El usuario inicia sesión.
3. Antes de operar, el sistema exige redefinir su contraseña.
4. Una vez cumplido el cambio, recién se habilita el resto del acceso.

### Flujo — Cierre de sesión
1. El usuario elige cerrar sesión.
2. El sistema finaliza la continuidad vigente.
3. La interfaz vuelve al estado no autenticado.
4. Cualquier nueva acción requiere relogueo.

### Flujo — Gestión administrativa de sesiones activas
1. Un administrador entra al módulo de sesiones.
2. Consulta usuarios conectados y estado de sus sesiones.
3. Identifica una sesión que debe finalizarse.
4. Ejecuta el cierre administrativo.
5. El sistema registra el evento y deja sin efecto esa continuidad.

---

## 17. Flujos de error y excepción

### Error — Credenciales inválidas
1. El usuario ingresa mail o contraseña incorrectos.
2. El sistema rechaza el ingreso.
3. Informa que las credenciales no son válidas sin exponer datos sensibles.
4. Registra el intento fallido.

### Error — Cuenta bloqueada temporalmente
1. El usuario supera el umbral de intentos fallidos o un patrón abusivo.
2. El sistema bloquea temporalmente el acceso.
3. Muestra el mensaje correspondiente y orienta a recuperación o espera según política.
4. Registra el bloqueo.

### Error — Sesión vencida por inactividad
1. El usuario permanece inactivo más allá del tiempo permitido.
2. Intenta retomar una acción.
3. El sistema informa que la sesión venció por inactividad.
4. Exige reautenticación.

### Error — Sesión vencida por duración máxima
1. El usuario opera normalmente durante un período prolongado.
2. La sesión alcanza su duración máxima.
3. El sistema informa que debe volver a iniciar sesión.
4. Registra el vencimiento.

### Error — Permiso insuficiente
1. El usuario intenta abrir un módulo o ejecutar una acción no habilitada.
2. El sistema bloquea la operación.
3. Comunica que no tiene permiso suficiente para esa acción.
4. Conserva el resto de la sesión si corresponde.
5. Registra el intento cuando aplique.

### Error — Alcance insuficiente
1. El usuario tiene permiso sobre un módulo, pero intenta operar un registro fuera de su alcance.
2. El sistema rechaza la operación.
3. Informa que ese registro no está disponible para su perfil actual.
4. No expone información adicional del registro rechazado.

### Error — Alta o reactivación bloqueada por plan
1. Un usuario con permiso administrativo intenta crear, activar o reactivar un profesional.
2. El sistema detecta que el tenant alcanzó el cupo de profesionales activos o que sigue excedido tras la gracia.
3. La operación se bloquea sin afectar la sesión ni el resto de los permisos del usuario.
4. El mensaje explica que la restricción corresponde al plan institucional y orienta a revisar cupo, exceso y gracia vigente.

### Error — Sesión cerrada por administración o seguridad
1. El usuario intenta seguir operando con una continuidad ya invalidada.
2. El sistema informa que la sesión fue finalizada.
3. Exige nuevo login.

---

## 18. Criterios de aceptación generales

- [ ] **Dado** un usuario activo con credenciales válidas, **cuando** inicia sesión, **entonces** accede sin fricción innecesaria y bajo una sesión controlada.
- [ ] **Dado** un usuario con permiso para ver pero no para operar, **cuando** entra al módulo, **entonces** visualiza lo permitido sin poder ejecutar acciones restringidas.
- [ ] **Dado** un usuario con alcance propio, **cuando** consulta pacientes, turnos o registros clínicos, **entonces** no ve información fuera de su universo habilitado.
- [ ] **Dado** un asistente, **cuando** navega por el sistema, **entonces** no accede por defecto a historia clínica completa, odontograma clínico completo, recetas ni configuración institucional.
- [ ] **Dado** un profesional, **cuando** opera dentro de su práctica, **entonces** puede trabajar con continuidad de sesión razonable sin acceso a contabilidad global o gobierno institucional.
- [ ] **Dado** múltiples intentos fallidos, **cuando** se supera el umbral definido, **entonces** el sistema bloquea temporalmente nuevos intentos.
- [ ] **Dado** un evento crítico de autenticación o autorización, **cuando** ocurre, **entonces** queda un registro auditable suficiente para su revisión posterior.
- [ ] **Dado** un intento directo de entrar a una pantalla restringida, **cuando** el usuario no tiene permiso o alcance suficiente, **entonces** el sistema lo bloquea igual aunque el menú no la mostrara.
- [ ] **Dado** un administrador con permiso para gestionar profesionales, **cuando** intenta crear o reactivar un profesional y el tenant no dispone de cupo, **entonces** el sistema bloquea la operación por restricción institucional del plan sin convertir esa regla en bloqueo de módulos o sesión.

---

## 19. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Permisos demasiado amplios en la salida inicial | Media | Alto | Definir matriz fundacional por módulo, acción y alcance antes de liberar cada área del producto |
| Confusión entre permiso de ver y permiso de hacer | Alta | Alto | Taxonomía común de permisos y validación separada de visualización y operación |
| Alcances ambiguos entre propio, asignado e institucional | Alta | Alto | Modelo de alcance explícito y obligatorio en módulos sensibles |
| Fricción excesiva de seguridad que frene la jornada | Media | Alto | Política de renovación de sesión controlada y mensajes claros |
| Bloqueos o recuperaciones confusas | Media | Medio | Flujos simples, mensajes accionables y auditoría de todo el ciclo |
| Menú oculto pero protección real insuficiente | Media | Alto | Revalidación obligatoria en acceso directo y en cada acción sensible |
| Desalineación con módulos clínicos o contables | Media | Alto | Tomar este PRD como referencia fundacional para pacientes, turnos, odontograma, recetas y cuenta corriente |
| Confundir cupo contratado con permisos o feature gating | Media | Alto | Separar siempre permiso del rol versus restricción institucional sobre altas y reactivaciones de profesionales |

---

## 20. Dependencias con otros PRDs

- **Pacientes**: depende de alcance para definir padrón visible, ficha disponible y capacidad de alta/edición.
- **Turnos y Agenda**: depende de visibilidad por agenda propia, compartida, operativa institucional o supervisada.
- **Historia Clínica**: depende de permisos clínicos sensibles y alcance de supervisión.
- **Odontograma**: depende de permisos clínicos operativos y reglas de anulación controlada.
- **Recetas**: depende de autorización clínica para emitir y consultar.
- **Presupuestos**: depende de roles operativos y visibilidad sobre pacientes y práctica.
- **Mutuales / Obras Sociales**: depende de diferenciación entre administración de catálogo y operación sobre vínculo paciente-mutual.
- **Depósitos**: depende de separación entre registro operativo, seguimiento y reintegro.
- **Cuenta Corriente / Contabilidad**: depende de separación fuerte entre cuenta corriente del paciente y contabilidad institucional general.
- **Profesionales**: depende de acceso al perfil propio frente a administración del padrón completo.
- **Configuración del Sistema**: depende de permisos de administración total dentro de la institución.
- **Planes mensuales por tenant**: depende de la restricción institucional de cupo documentada funcionalmente en Profesionales y visible administrativamente en Configuración del Sistema.

---

## 21. Decisiones fundacionales cerradas

- El login base del producto será con **mail + contraseña**.
- La sesión base del producto será con **JWT en cookies seguras**.
- La institución administrará **roles base + permisos granulares + alcance**.
- El sistema distinguirá obligatoriamente entre **ver** y **hacer**.
- El sistema aplicará obligatoriamente restricciones por **alcance** y no solo por nombre de rol.
- La UI se adaptará a permisos, pero la protección real también se validará en acceso directo y en acciones.
- La auditoría de acceso será requisito desde la primera versión fundacional.
- La contabilidad general, la configuración institucional y la administración de permisos no quedarán abiertas por defecto a profesionales ni asistentes.
- Historia clínica, odontograma y recetas se tratarán como información clínica sensible con acceso más restringido que el padrón operativo de pacientes.
- La política de plan mensual solo restringirá crecimiento del padrón de profesionales activos y no bloqueará módulos, funcionalidades ni el acceso operativo de profesionales ya activos.

---

*Documento refinado como PRD fundacional del set · 2026-03-30*
