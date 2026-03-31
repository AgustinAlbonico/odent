# Representación de planes mensuales por tenant en los PRDs — Design

> **Fecha**: 2026-03-30
> **Estado**: borrador para revisión
> **Tema**: actualización transversal de PRDs por modelo de planes

---

## Goal

Incorporar en los PRDs existentes un modelo de planes mensuales por tenant que limite la cantidad de **profesionales activos** permitidos por institución, sin abrir todavía un subsistema completo de licenciamiento por funcionalidades.

## Contexto

Durante la revisión de consistencia de los PRDs apareció una necesidad comercial transversal que todavía no estaba representada: el sistema va a operar con **planes mensuales** y esos planes van a definir cuántos **profesionales activos** puede tener cada tenant.

Esta regla no aplica, por ahora, a asistentes, administradores ni supervisores. Tampoco aplica todavía a módulos habilitados o deshabilitados por plan. En esta etapa, el plan actúa únicamente como una restricción sobre el padrón de profesionales activos del tenant.

---

## Reglas de negocio cerradas

1. Cada tenant tiene un **plan mensual vigente**.
2. El plan define una **cantidad máxima de profesionales activos**.
3. Solo cuentan para el cupo los **profesionales activos**.
4. Asistentes, administradores, supervisores u otros usuarios internos **no consumen cupo**.
5. Si el tenant alcanza el cupo de profesionales activos, **no puede crear ni reactivar** otro profesional.
6. Si un profesional pasa a estado inactivo, suspendido o equivalente, **libera cupo**.
7. Si el tenant baja de plan y queda excedido, se abre un **período de gracia de 30 días**.
8. Durante la gracia, la clínica mantiene su operación actual, pero debe regularizar el exceso.
9. Al terminar la gracia, si sigue excedida, **no se bloquea a los profesionales ya activos**, pero sí se bloquean **nuevas altas y reactivaciones**.
10. Por ahora, los planes **no modifican funcionalidades** ni habilitan/bloquean módulos.

---

## Enfoque elegido

Se adopta una estrategia de **representación transversal liviana**.

Esto significa que no se va a crear todavía un PRD independiente de “planes y licenciamiento”, sino que la regla se va a documentar dentro de los PRDs donde realmente impacta el comportamiento del sistema.

### Por qué este enfoque

- evita agrandar innecesariamente el alcance actual;
- deja visible la regla donde realmente afecta decisiones del usuario y del sistema;
- mantiene el set documental liviano y orientado a operación real;
- permite evolucionar más adelante hacia un PRD específico de licenciamiento si el modelo comercial gana complejidad.

---

## PRDs a actualizar

### 1. `docs/prd/2026-03-30-autenticacion-y-autorizacion.md`

#### Objetivo del cambio
Representar que la elegibilidad operativa del tenant también puede condicionar ciertas acciones de administración de usuarios, sin convertir el plan en un sistema de feature gating.

#### Cambios propuestos
- Agregar la noción de **restricción institucional por plan** dentro del modelo fundacional.
- Aclarar que el plan **no bloquea el acceso general** del tenant ni la sesión de profesionales ya activos.
- Definir que el plan sí restringe acciones de crecimiento sobre el padrón profesional:
  - alta de profesional,
  - activación de profesional,
  - reactivación de profesional.
- Incorporar al menos un flujo de error relacionado con cupo excedido o gracia vencida.
- Agregar dependencia explícita con el PRD de Profesionales y Configuración del Sistema.

#### Resultado esperado
El PRD fundacional deja explícito que identidad, sesión y permisos no son lo único que condiciona ciertas acciones: también existe una política institucional de capacidad contratada aplicable al padrón profesional.

---

### 2. `docs/prd/2026-03-30-profesionales.md`

#### Objetivo del cambio
Convertir este PRD en el dueño funcional del enforcement del cupo de profesionales activos por tenant.

#### Cambios propuestos
- Incorporar definición explícita de **profesional activo**.
- Diferenciar claramente:
  - creación,
  - activación,
  - reactivación,
  - desactivación.
- Aclarar qué acciones consumen cupo y cuáles liberan cupo.
- Agregar reglas de downgrade con gracia de 30 días.
- Agregar reglas post-gracia:
  - no se bloquean profesionales ya activos,
  - sí se bloquean nuevas altas/reactivaciones.
- Agregar mensajes y criterios de negocio para administración cuando una acción no puede ejecutarse por límite de plan.

#### Resultado esperado
El módulo de profesionales pasa a expresar con claridad cuándo una clínica puede crecer, cuándo debe regularizarse y qué comportamientos administrativos están permitidos.

---

### 3. `docs/prd/2026-03-30-configuracion-sistema.md`

#### Objetivo del cambio
Representar la visibilidad administrativa del estado comercial/operativo del tenant respecto de su plan.

#### Cambios propuestos
- Agregar una sub-sección de configuración institucional sobre plan vigente.
- Incorporar visibilidad sobre:
  - plan actual,
  - cupo máximo de profesionales activos,
  - cupo utilizado,
  - cupo disponible,
  - exceso actual,
  - fecha de inicio y vencimiento de gracia si aplica.
- Incluir alertas administrativas y mensajes de regularización.
- Aclarar que esta vista informa y ayuda a gestionar el cupo, pero no habilita todavía gestión comercial compleja ni cambio de plan dentro del producto si eso no fue definido aún.

#### Resultado esperado
La institución entiende rápidamente por qué una alta/reactivación puede estar bloqueada y qué situación debe corregir.

---

### 4. `docs/prd/2026-03-30-turnos-y-agenda.md`

#### Objetivo del cambio
Evitar inconsistencias entre agenda operativa y padrón licenciado de profesionales.

#### Cambios propuestos
- Aclarar que solo profesionales activos pueden sostener agenda operativa.
- Aclarar que una restricción por cupo no invalida automáticamente la agenda de profesionales ya activos.
- Evitar que el modelo de planes sugiera cancelación masiva o baja operativa automática de agendas existentes.
- Agregar una dependencia breve con el PRD de Profesionales.

#### Resultado esperado
El módulo de turnos conserva continuidad operativa incluso cuando el tenant atraviesa un escenario comercial de exceso post-downgrade.

---

### 5. `docs/prd/2026-03-30-ayuda-onboarding.md`

#### Objetivo del cambio
Incorporar ayuda contextual para que administración entienda la regla del cupo y no la interprete como error técnico o de permisos.

#### Cambios propuestos
- Agregar contenido de ayuda para explicar:
  - qué cuenta como profesional activo,
  - qué acciones consumen cupo,
  - qué acciones liberan cupo,
  - cómo funciona la gracia de 30 días,
  - por qué una activación/reactivación puede quedar bloqueada.
- Alinear la ayuda con el lenguaje de negocio del resto del set.

#### Resultado esperado
La organización reduce confusión administrativa y soporte innecesario frente a bloqueos legítimos por plan.

---

## PRDs que NO se modifican en esta pasada

No se propone una actualización de fondo en:

- pacientes
- odontograma
- historia clínica
- recetas
- mutuales
- depósitos
- cuenta corriente
- presupuestos
- llamador

### Motivo

En esta etapa el plan no afecta funcionalidad clínica, financiera ni de atención directa. Su impacto real está concentrado en acceso administrativo, padrón profesional, configuración institucional, continuidad operativa y ayuda contextual.

---

## Normalización documental a aprovechar en la misma pasada

Ya que se va a tocar parte del set, se propone aprovechar esta ronda para mejorar consistencia documental en los archivos afectados.

### Ajustes de consistencia previstos

- agregar `Prioridad` en el header si falta;
- agregar `Dependencias` donde corresponda;
- alinear nombres de secciones para que el set se lea con menos fricción;
- evitar contradicciones entre auth, profesionales y configuración;
- mantener explícito que por ahora el plan **no** controla módulos ni features.

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Mezclar licenciamiento con permisos de acceso | Alto | Separar siempre “permiso del rol” de “límite comercial del tenant” |
| Introducir la falsa idea de que un exceso bloquea a los profesionales ya activos | Alto | Dejar explícita la continuidad operativa durante y después de la gracia |
| Sobre-documentar reglas comerciales todavía no definidas | Medio | Limitar esta pasada solo al cupo de profesionales activos |
| Generar inconsistencias entre PRDs afectados y no afectados | Medio | Añadir dependencias y referencias cruzadas mínimas donde haga falta |

---

## Criterios de validación de esta pasada

La actualización se considerará correcta si, después de editar los PRDs afectados:

1. el modelo de planes aparece de forma consistente en auth, profesionales y configuración;
2. turnos no contradice la continuidad operativa de profesionales ya activos;
3. ayuda/onboarding explica claramente el comportamiento del cupo;
4. no aparece ningún texto que sugiera feature gating por plan en esta etapa;
5. no aparece ningún texto que sugiera bloqueo automático de profesionales activos al terminar la gracia.

---

## Recomendación final

Implementar ahora la opción de **representación transversal liviana** y dejar documentado como siguiente escalón posible la creación futura de un PRD específico de licenciamiento si más adelante se suman:

- planes con funcionalidades diferenciadas,
- autoservicio comercial,
- upgrade/downgrade desde producto,
- trial,
- cobro y facturación del plan,
- suspensiones comerciales institucionales.

---

*Documento de diseño para actualización transversal de PRDs · 2026-03-30*
