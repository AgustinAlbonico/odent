# PRD: Odontograma

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P1 — operación diaria crítica
> **Complejidad**: muy alta

---

## 1. Resumen ejecutivo

Este PRD define el módulo de Odontograma como núcleo clínico del sistema odontológico. Debe permitir registrar y consultar prácticas sobre piezas dentarias con numeración FDI completa, selección por diente y caras, distinción entre registros preexistentes y nuevos, vinculación con mutuales y coseguro, y trazabilidad histórica para consulta clínica, control administrativo y reportes.

El odontograma no es solo un dibujo dental: es una forma estructurada de representar el estado bucal del paciente, las prácticas realizadas, su condición de facturación, su vínculo con cobertura y su evolución en el tiempo. Por eso este documento lo trata como pieza central de la continuidad clínica y administrativa.

---

## 2. Problema de negocio

En odontología, registrar una práctica sin dejar claro qué pieza fue intervenida, en qué cara, con qué condición y con qué cobertura genera errores clínicos, reclamos administrativos y pérdida de trazabilidad. Si además no se distingue entre una condición previa y una intervención nueva, el historial del paciente se vuelve ambiguo.

La clínica necesita un odontograma que permita ver y cargar información de forma visual, rápida y consistente, sin perder detalle. Tiene que servir tanto para la atención profesional como para la relación con mutuales, coseguros, auditorías internas y reportes posteriores.

---

## 3. Oportunidad

Un odontograma bien resuelto permite:

- ordenar la historia clínica odontológica del paciente;
- evitar ambigüedades sobre pieza y caras tratadas;
- distinguir claramente lo preexistente de lo nuevo;
- asociar prácticas con mutuales, afiliación y coseguro;
- mejorar la calidad del registro y de la consulta posterior;
- sostener reportes útiles para control clínico y administrativo.

---

## 4. Usuarios y actores

### Usuario principal

#### Profesional odontólogo
- Selecciona piezas y caras.
- Registra prácticas nuevas o preexistentes.
- Consulta historial y evolución del paciente.

### Usuarios secundarios

#### Recepción / administración
- Consulta información necesaria para seguimiento operativo.
- Revisa mutual, afiliado, cobertura y coseguro asociado a prácticas.

#### Auditoría / facturación
- Usa reportes y filtros para controlar prácticas ingresadas, anuladas y montos de coseguro.

#### Coordinación clínica
- Necesita visibilidad histórica y consistencia del registro.

---

## 5. Objetivos

### Objetivos de negocio
- Contar con un registro odontológico trazable por paciente, pieza y práctica.
- Reducir errores de carga clínica y administrativa.
- Dar soporte al vínculo entre práctica, mutual y coseguro.
- Permitir explotación posterior mediante filtros y reportes.

### Objetivos de usuario
- Registrar una práctica de forma clara sobre diente y caras.
- Diferenciar de inmediato si algo es preexistente o nuevo.
- Consultar historial sin perder contexto clínico.
- Encontrar rápidamente prácticas anuladas, por pieza, por fecha o por mutual.

### Indicadores esperados
- Menor cantidad de rectificaciones de carga.
- Mayor consistencia entre práctica registrada y práctica reportada.
- Menor tiempo de consulta del historial de un paciente.
- Mejor control de coseguros y coberturas.

---

## 6. Alcance

### Incluido en esta versión
- Numeración FDI completa.
- Selección de pieza dental.
- Selección de caras del diente.
- Registro de práctica como preexistente o nueva.
- Asociación con mutual, plan y afiliado.
- Registro y visualización de coseguro.
- Historial clínico del odontograma.
- Anulación de prácticas.
- Filtros del historial.
- Reportes de prácticas.

### Fuera de alcance
- Plan automático de tratamiento.
- Interpretación diagnóstica asistida.
- Integración con imágenes o equipos externos.
- Firma digital clínica del registro.
- Dibujo libre fuera de las representaciones predefinidas.

---

## 7. Principios de negocio

- El odontograma debe hablar el lenguaje real del consultorio.
- Toda práctica tiene que quedar ligada a una pieza y, cuando corresponda, a sus caras.
- Lo preexistente y lo nuevo no pueden confundirse.
- Una anulación debe preservar historial, no borrar evidencia.
- El vínculo con mutual y coseguro debe estar disponible para control posterior.
- Los reportes tienen que salir del mismo dato clínico, sin recarga manual innecesaria.

---

## 8. Entidades de negocio involucradas

### Pieza dental
Elemento clínico individual identificado por numeración FDI.

### Cara dental
Superficie específica de la pieza sobre la que puede registrarse una práctica.

### Práctica odontológica
Acto clínico o condición registrada sobre una pieza y eventualmente sobre una o más caras.

### Condición preexistente
Situación que el paciente ya presentaba antes del nuevo registro clínico.

### Registro nuevo
Práctica o situación ingresada como novedad en el proceso asistencial actual.

### Mutual / obra social
Cobertura vinculada al paciente y utilizada para control administrativo de la práctica.

### Coseguro
Monto asociado a la práctica a cargo del paciente o en control administrativo.

---

## 9. Modelo clínico esperado

El módulo debe contemplar la numeración FDI completa, incluyendo:

- dentición permanente;
- dentición temporaria;
- piezas necesarias para cobertura completa del registro observado en el relevamiento.

Cada pieza debe admitir selección visual. Cada pieza debe permitir además la identificación de caras para registrar el alcance exacto de una práctica.

---

## 10. Requisitos funcionales

### P0 — Críticos

#### RF-OD-001 — Numeración FDI completa
El odontograma debe representar la dentición utilizando numeración FDI completa, acorde al estándar de trabajo odontológico observado.

**Criterio de aceptación**
- **Dado** que el profesional abre el odontograma de un paciente,
- **Cuando** visualiza el esquema dental,
- **Entonces** el sistema muestra todas las piezas contempladas por la numeración FDI completa que correspondan al alcance definido para el módulo.

#### RF-OD-002 — Selección de pieza dental
El usuario debe poder seleccionar una pieza concreta para registrar o consultar información asociada.

**Criterio de aceptación**
- **Dado** que el profesional necesita cargar una práctica,
- **Cuando** selecciona una pieza del odontograma,
- **Entonces** el sistema la toma como referencia activa para el registro o consulta.

#### RF-OD-003 — Selección de caras
El odontograma debe permitir seleccionar una o varias caras del diente cuando la práctica requiera mayor precisión.

**Criterio de aceptación**
- **Dado** que una práctica afecta solo parte de una pieza,
- **Cuando** el profesional selecciona las caras correspondientes,
- **Entonces** el sistema registra esa práctica asociada a esas caras específicas.

#### RF-OD-004 — Registro de práctica nueva
El profesional debe poder ingresar una práctica nueva vinculada a pieza, caras, práctica y fecha.

**Criterio de aceptación**
- **Dado** que el paciente recibe una intervención actual,
- **Cuando** el profesional completa los datos obligatorios y guarda como nueva,
- **Entonces** el sistema registra la práctica como novedad en el historial del odontograma.

#### RF-OD-005 — Registro de condición preexistente
El profesional debe poder registrar una condición o situación previa del paciente como preexistente.

**Criterio de aceptación**
- **Dado** que el profesional detecta una condición previa del paciente,
- **Cuando** la registra como preexistente,
- **Entonces** el sistema la guarda diferenciada de las prácticas nuevas.

#### RF-OD-006 — Diferenciación visual entre preexistente y nueva
El odontograma y el historial deben distinguir claramente entre registros preexistentes y registros nuevos.

**Criterio de aceptación**
- **Dado** que un paciente tiene registros de ambos tipos,
- **Cuando** el profesional consulta el odontograma o el historial,
- **Entonces** puede reconocer visualmente cuáles son preexistentes y cuáles son nuevos sin ambigüedad.

#### RF-OD-007 — Asociación con mutual
Cada práctica debe poder asociarse a la mutual u obra social correspondiente del paciente.

**Criterio de aceptación**
- **Dado** que el paciente tiene una mutual vinculada,
- **Cuando** el profesional registra la práctica,
- **Entonces** el sistema permite relacionarla con la mutual seleccionada para ese caso.

#### RF-OD-008 — Registro de coseguro
El módulo debe permitir registrar el coseguro asociado a la práctica para control administrativo y reporte.

**Criterio de aceptación**
- **Dado** que una práctica genera coseguro,
- **Cuando** el profesional o el operador completa ese dato,
- **Entonces** el monto queda asociado a la práctica en el historial y en los reportes.

#### RF-OD-009 — Relación con mutuales y coberturas
El sistema debe contemplar la relación entre práctica, mutual, afiliado, plan y condiciones de cobertura que impactan el registro.

**Criterio de aceptación**
- **Dado** que una práctica requiere control frente a cobertura,
- **Cuando** se consulta o registra con mutual asociada,
- **Entonces** el sistema conserva visibles los datos necesarios para la revisión administrativa posterior.

#### RF-OD-010 — Historial del odontograma
Cada paciente debe contar con historial completo de prácticas registradas en el odontograma.

**Criterio de aceptación**
- **Dado** que el paciente tiene registros previos,
- **Cuando** el profesional consulta el historial,
- **Entonces** el sistema muestra las prácticas registradas con contexto suficiente para entender su evolución.

#### RF-OD-011 — Anulación de práctica
Una práctica debe poder anularse sin eliminar su rastro histórico.

**Criterio de aceptación**
- **Dado** que una práctica fue cargada y luego debe invalidarse,
- **Cuando** el usuario autorizado la anula,
- **Entonces** el sistema conserva el registro, cambia su estado y la identifica como anulada.

#### RF-OD-012 — Filtros del historial
El historial debe poder filtrarse por estado, fecha, diente, tipo de dibujo o representación, paciente, profesional y mutual según corresponda al alcance del reporte.

**Criterio de aceptación**
- **Dado** que el usuario necesita revisar un subconjunto de prácticas,
- **Cuando** aplica uno o más filtros,
- **Entonces** el sistema muestra únicamente los registros que cumplen esos criterios.

### P1 — Importantes

#### RF-OD-013 — Búsqueda de práctica por código o nombre
El registro de práctica debe permitir ubicar la práctica clínica de manera rápida dentro del catálogo disponible.

**Criterio de aceptación**
- **Dado** que el profesional conoce el código o el nombre de una práctica,
- **Cuando** la busca al registrar,
- **Entonces** el sistema ofrece coincidencias que facilitan su selección correcta.

#### RF-OD-014 — Visualización de afiliado y plan
Cuando la práctica se asocia a una mutual, el sistema debe conservar visible el afiliado y el plan del paciente relacionados con esa cobertura.

**Criterio de aceptación**
- **Dado** que una práctica queda vinculada a una mutual,
- **Cuando** se consulta el historial o el reporte,
- **Entonces** también se pueden ver los datos de afiliado y plan que correspondan.

#### RF-OD-015 — Fechas de realizado y facturación
El registro debe permitir distinguir la fecha de realización clínica de la fecha prevista para facturación o gestión posterior.

**Criterio de aceptación**
- **Dado** que una práctica se realiza en una fecha y se procesa administrativamente en otra,
- **Cuando** el usuario registra ambas,
- **Entonces** el sistema conserva esa diferencia en el historial y reportes.

#### RF-OD-016 — Selección continua
El profesional debe poder registrar una misma práctica en múltiples piezas consecutivas sin recomenzar la carga desde cero cada vez.

**Criterio de aceptación**
- **Dado** que una práctica se repite sobre varias piezas,
- **Cuando** el usuario activa la modalidad de selección continua,
- **Entonces** el sistema facilita la carga sucesiva manteniendo el contexto de la práctica.

#### RF-OD-017 — Reporte de prácticas ingresadas
El módulo debe ofrecer un reporte de prácticas ingresadas para control clínico y administrativo.

**Criterio de aceptación**
- **Dado** que el usuario necesita revisar prácticas cargadas en un período,
- **Cuando** genera el reporte con filtros,
- **Entonces** el sistema muestra el listado resultante con el nivel de detalle definido para control.

#### RF-OD-018 — Totalización de coseguros en reportes
Los reportes deben poder totalizar coseguros sobre las prácticas incluidas.

**Criterio de aceptación**
- **Dado** que el usuario genera un reporte con prácticas que tienen coseguro,
- **Cuando** consulta el resultado,
- **Entonces** el sistema muestra el total de coseguros correspondiente al universo filtrado.

### P2 — Deseables

#### RF-OD-019 — Filtro específico de anuladas
El usuario debería poder revisar con facilidad solo las prácticas anuladas.

**Criterio de aceptación**
- **Dado** que el usuario necesita auditar anulaciones,
- **Cuando** filtra por estado anulada,
- **Entonces** el sistema devuelve exclusivamente esos registros.

#### RF-OD-020 — Filtro por pieza dental
La consulta histórica debería poder centrarse en una pieza concreta.

**Criterio de aceptación**
- **Dado** que el profesional quiere revisar la historia del diente 36,
- **Cuando** aplica el filtro por pieza,
- **Entonces** el sistema muestra solo las prácticas asociadas a esa pieza.

#### RF-OD-021 — Filtro por mutual
El control administrativo debería poder revisar prácticas según la mutual interviniente.

**Criterio de aceptación**
- **Dado** que administración necesita revisar un conjunto por cobertura,
- **Cuando** filtra por mutual,
- **Entonces** el sistema muestra solo las prácticas asociadas a esa mutual.

#### RF-OD-022 — Detalle imprimible
El odontograma debería permitir que ciertos detalles queden marcados para impresión o salida documental.

**Criterio de aceptación**
- **Dado** que una práctica tiene un detalle relevante para emitir,
- **Cuando** el usuario la marca para impresión,
- **Entonces** el sistema la conserva identificada para ese uso posterior.

---

## 11. Reglas de negocio

1. Toda práctica debe quedar asociada al menos a una pieza.
2. Cuando aplique, la práctica también debe registrar caras.
3. Preexistente y nueva son categorías distintas y visibles.
4. Una práctica anulada no debe desaparecer del historial.
5. Las anuladas no deben confundirse con prácticas activas al consultar o reportar.
6. La información de mutual y coseguro debe quedar vinculada a la práctica registrada.
7. El historial del paciente debe poder leerse cronológicamente y también filtrarse por necesidad operativa.

---

## 12. Flujos principales

### Flujo 1 — Registrar práctica nueva
1. El profesional abre el odontograma del paciente.
2. Selecciona la pieza.
3. Selecciona las caras si corresponde.
4. Elige la práctica.
5. Completa mutual, coseguro, fechas y detalle según necesidad.
6. Guarda como nueva.
7. El sistema actualiza visualización e historial.

### Flujo 2 — Registrar condición preexistente
1. El profesional identifica una condición previa.
2. Selecciona pieza y caras.
3. Completa la práctica o condición.
4. Guarda como preexistente.
5. El sistema la diferencia del resto de los registros nuevos.

### Flujo 3 — Consultar historial
1. El profesional abre el historial del odontograma.
2. Revisa cronología o aplica filtros.
3. Consulta pieza, caras, práctica, mutual, coseguro y estado.

### Flujo 4 — Anular práctica
1. El usuario localiza la práctica en historial.
2. Ejecuta la anulación.
3. El sistema la marca como anulada y la preserva para trazabilidad.

### Flujo 5 — Generar reporte
1. El usuario elige filtros.
2. El sistema reúne prácticas del período o universo definido.
3. Muestra el listado y totalizaciones correspondientes.

---

## 13. Casos borde y manejo esperado

- Práctica registrada sin mutual: debe seguir existiendo como registro clínico.
- Paciente con múltiples mutuales: debe quedar claro cuál aplica a la práctica.
- Pieza con múltiples antecedentes: el historial debe conservar orden y legibilidad.
- Error de carga detectado después: debe anularse, no borrarse sin rastro.
- Varias prácticas sobre una misma pieza: deben convivir con trazabilidad histórica.
- Consulta específica por pieza: debe poder resolverse con filtro directo.

---

## 14. Requisitos no funcionales de negocio

- La lectura del odontograma debe ser clara para el profesional en contexto de atención.
- La carga clínica habitual no debe exigir pasos innecesarios.
- La distinción visual entre estados y tipos de registro debe ser inequívoca.
- La consulta del historial debe responder con velocidad operativa suficiente para atención en consultorio.
- Los reportes deben ser comprensibles para clínica y administración.

---

## 15. Métricas de éxito

- Menor tiempo de carga por práctica.
- Menor cantidad de correcciones administrativas por piezas o mutual mal asignadas.
- Mayor uso efectivo del historial para seguimiento clínico.
- Coherencia entre coseguros informados y reportados.
- Reducción de ambigüedades entre registros previos y nuevos.

---

## 16. Riesgos

| Riesgo | Impacto | Mitigación de negocio |
|---|---|---|
| Confusión entre preexistente y nueva | Alto | Diferenciación visual y semántica obligatoria |
| Carga incompleta de pieza o caras | Alto | Reforzar obligatoriedad según tipo de práctica |
| Asignación incorrecta de mutual | Alto | Mostrar claramente cobertura, afiliado y plan al registrar |
| Anulación sin trazabilidad clara | Medio | Mantener historial visible con estado explícito |
| Reportes poco confiables por filtros ambiguos | Alto | Diseñar filtros precisos y consistentes con historial |

---

## 17. Dependencias funcionales

- Pacientes
- Mutuales / obras sociales
- Catálogo de prácticas
- Historia clínica
- Reportes operativos y administrativos

---

## 18. Preguntas abiertas

- Si algunas prácticas requerirán obligatoriedad de caras y otras no.
- Qué nivel de detalle visual se espera para representar tipos de dibujo o intervención.
- Si habrá reglas institucionales para limitar quién puede anular determinados registros.
- Qué formato de salida requerirán los reportes para mutuales o control interno.

---

## 19. Criterios globales de aceptación del módulo

- **Dado** que la clínica necesita registrar y consultar prácticas odontológicas con precisión,
- **Cuando** utiliza el módulo de Odontograma,
- **Entonces** puede identificar piezas por numeración FDI completa, seleccionar caras, registrar prácticas nuevas o preexistentes y mantener trazabilidad histórica.

- **Dado** que administración y clínica necesitan controlar cobertura y coseguro,
- **Cuando** consultan historial o reportes,
- **Entonces** disponen de la relación entre práctica, mutual, afiliado, plan y coseguro sin rearmar la información manualmente.

- **Dado** que un registro puede quedar invalidado,
- **Cuando** se anula una práctica,
- **Entonces** el sistema conserva el antecedente, la identifica como anulada y evita confundirla con prácticas activas.
