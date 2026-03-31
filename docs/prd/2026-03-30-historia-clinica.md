# PRD: Historia Clínica

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: muy alta
> **Autor**: generado con prd-creator

---

## Problema

La clínica necesita una historia clínica electrónica que concentre de verdad el recorrido completo del paciente y no apenas un conjunto de notas sueltas. Hoy el trabajo clínico cruza antecedentes, observaciones, recetas, certificados, prácticas odontológicas, adjuntos y decisiones tomadas en distintas consultas. Si esa información queda dispersa o cuesta reconstruirla, aumenta el riesgo de error, se pierde tiempo en consulta y se debilita la continuidad de atención.

En odontología esto pega el doble: el profesional no solo necesita leer texto, también necesita conectar lo que pasó con lo que está dibujado en el odontograma, con lo que se indicó al paciente y con los documentos que respaldan la atención. La historia clínica tiene que servir para atender mejor, para documentar mejor y para defender mejor las decisiones clínicas frente a auditorías, reclamos o seguimiento longitudinal.

**Situación actual**: la operación observada ya muestra antecedentes por categorías, una ficha libre con notas, adjuntos y audio, accesos a receta y certificado, y una línea de tiempo filtrable. El problema no es partir de cero, sino convertir esa base en un producto claramente definido, trazable y consistente para el trabajo diario.

---

## Usuarios

### Usuario principal
- **Quién**: Profesional odontólogo
- **Necesidad**: Registrar y consultar la historia clínica completa del paciente durante la atención, sin perder contexto ni cambiar de pantalla mentalmente todo el tiempo.
- **Dolor actual**: Tiene que reconstruir el caso mezclando antecedentes, notas, prácticas y documentos. Si la relación entre texto clínico, odontograma y documentos no es clara, se vuelve más lenta la consulta y más frágil la toma de decisiones.

### Usuarios secundarios
- **Asistente / recepción**: Necesita ubicar rápidamente certificados, recetas o antecedentes relevantes cuando prepara una atención o responde una consulta administrativa.
- **Dirección clínica**: Necesita trazabilidad, consistencia documental y capacidad de revisión ante reclamos, auditorías o derivaciones.
- **Paciente (indirectamente)**: Se beneficia cuando el profesional recuerda contexto, restricciones, alergias, tratamientos previos e indicaciones sin depender de memoria informal.

---

## Objetivos

### Objetivos de negocio
- Consolidar en una sola historia clínica el contexto médico-odontológico del paciente y su evolución en el tiempo.
- Reducir el tiempo de reconstrucción de antecedentes y atenciones previas antes de una consulta a menos de 2 minutos.
- Mejorar la calidad documental de la institución para seguimiento clínico, auditoría y respaldo profesional.
- Evitar que información crítica quede escondida en archivos sueltos, notas aisladas o recuerdos del profesional.

### Objetivos de usuario
- El profesional puede entender el estado clínico actual y el recorrido previo del paciente desde una única vista.
- El profesional puede registrar una nota clínica completa, sumar adjuntos o audio y dejarla disponible en la cronología sin pasos innecesarios.
- El profesional puede pasar desde la historia clínica al odontograma, receta o certificado sin perder el contexto del paciente.
- La recepción puede ubicar documentos clínicos emitidos sin depender de preguntar al profesional que atendió.

### No-objetivos (explícitos)
- No incluye portal de autogestión del paciente para ver o descargar su historia clínica.
- No incluye diagnóstico asistido ni sugerencias automáticas de tratamiento.
- No incluye teleconsulta ni videollamada dentro de la historia clínica.
- No incluye firma biométrica del paciente en esta versión.

---

## Alcance

### Incluido en esta versión
- Vista integral de historia clínica por paciente.
- Antecedentes organizados por categorías clínicas.
- Posibilidad de crear nuevas categorías cuando la institución lo necesite.
- Notas libres estructuradas por motivo y descripción.
- Adjuntos clínicos incorporados a la historia.
- Grabación y consulta de audio asociado a una ficha.
- Línea de tiempo clínica filtrable por profesional, concepto y fecha.
- Plantillas de registro clínico para distintos tipos de ficha.
- Emisión y consulta de certificados desde el contexto del paciente.
- Emisión y consulta de recetas desde el contexto del paciente.
- Cruce explícito entre historia clínica y odontograma.
- Acceso a datos demográficos y mutuales del paciente dentro de la ficha clínica.
- Registro de quién generó cada elemento clínico y cuándo lo hizo.

### Fuera de alcance (explícito)
- Interpretación automática de estudios o imágenes — queda para una etapa futura de apoyo clínico.
- Mensajería directa con el paciente desde la historia clínica — corresponde a un módulo de comunicaciones.
- Edición colaborativa simultánea por múltiples profesionales sobre la misma ficha clínica.
- Intercambio de historia clínica con otras instituciones en esta fase.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-501] Vista integral de historia clínica por paciente**
  Descripción: La historia clínica debe mostrar en una única vista el resumen del paciente, sus mutuales, antecedentes, accesos clínicos y la cronología completa de atenciones y documentos.
  Criterio de aceptación: Dado que el profesional abre la historia clínica de un paciente, cuando ingresa a la ficha, entonces visualiza datos identificatorios, mutuales vigentes, antecedentes por categorías, accesos a nuevas acciones clínicas y la línea de tiempo del paciente en la misma experiencia.

- **[RF-502] Antecedentes organizados por categorías**
  Descripción: La historia clínica debe permitir registrar y consultar antecedentes en categorías diferenciadas como medicación, enfermedad, internación, procedimiento, alergia, factores de riesgo, antecedentes familiares y vacunas.
  Criterio de aceptación: Dado que el paciente tiene información clínica relevante, cuando el profesional consulta la sección de antecedentes, entonces encuentra cada dato clasificado en su categoría correspondiente sin mezclarlo con notas libres ni prácticas odontológicas.

- **[RF-503] Alta de nuevas categorías de antecedentes**
  Descripción: La clínica debe poder incorporar nuevas categorías de antecedentes para contemplar necesidades documentales no previstas al inicio.
  Criterio de aceptación: Dado que la institución necesita registrar un tipo de antecedente no contemplado, cuando un usuario autorizado agrega una nueva categoría, entonces esa categoría queda disponible para futuras cargas en la historia clínica del paciente.

- **[RF-504] Notas clínicas libres por consulta**
  Descripción: El profesional debe poder registrar notas libres con motivo y descripción para documentar observaciones, decisiones, evolución y acuerdos con el paciente.
  Criterio de aceptación: Dado que el profesional termina una consulta, cuando completa el motivo y la descripción de la ficha clínica y guarda, entonces la nota queda incorporada a la historia del paciente con fecha, hora y profesional responsable.

- **[RF-505] Adjuntos clínicos dentro de la ficha**
  Descripción: Cada ficha clínica debe aceptar archivos adjuntos para respaldar diagnósticos, indicaciones o documentación complementaria del paciente.
  Criterio de aceptación: Dado que el profesional está cargando una ficha clínica, cuando adjunta uno o más archivos y guarda la ficha, entonces los archivos quedan visibles y consultables desde esa ficha dentro de la historia clínica del paciente.

- **[RF-506] Audio asociado a la ficha clínica**
  Descripción: La ficha clínica debe permitir grabar y conservar audio como complemento documental de la atención.
  Criterio de aceptación: Dado que el profesional necesita dictar observaciones durante o después de la consulta, cuando graba un audio y guarda la ficha, entonces el audio queda asociado a ese registro clínico y disponible para su reproducción posterior.

- **[RF-507] Línea de tiempo clínica unificada**
  Descripción: La historia clínica debe reunir en una cronología única las fichas clínicas, odontogramas, recetas, certificados y demás registros relevantes del paciente.
  Criterio de aceptación: Dado que un paciente tiene múltiples atenciones registradas, cuando el profesional consulta la línea de tiempo, entonces ve los eventos ordenados cronológicamente con su tipo, fecha, profesional y detalle principal.

- **[RF-508] Filtros en timeline por profesional, concepto y fecha**
  Descripción: La línea de tiempo debe poder filtrarse para reducir ruido y permitir revisión focalizada.
  Criterio de aceptación: Dado que el profesional quiere revisar solo un período o un tipo de registro, cuando aplica filtros por profesional, concepto y fecha, entonces la línea de tiempo muestra únicamente los eventos que cumplen esos criterios.

- **[RF-509] Cruce entre historia clínica y odontograma**
  Descripción: La historia clínica debe mostrar claramente cuándo una atención está vinculada a prácticas odontológicas y permitir navegar al detalle correspondiente del odontograma.
  Criterio de aceptación: Dado que una atención incluye prácticas sobre piezas dentarias, cuando el profesional visualiza ese evento en la cronología, entonces identifica las prácticas registradas y puede pasar al detalle odontológico del mismo paciente sin perder contexto.

- **[RF-510] Creación de fichas desde plantillas**
  Descripción: La clínica debe poder generar nuevas fichas clínicas a partir de plantillas para ordenar la carga según el tipo de atención.
  Criterio de aceptación: Dado que el profesional inicia un nuevo registro clínico, cuando elige una plantilla disponible, entonces la nueva ficha se crea respetando esa estructura de trabajo para facilitar una documentación consistente.

- **[RF-511] Emisión de certificados desde la historia clínica**
  Descripción: El profesional debe poder generar certificados desde el contexto del paciente y dejar trazabilidad de su emisión dentro de la historia clínica.
  Criterio de aceptación: Dado que el paciente necesita un certificado, cuando el profesional lo genera desde la ficha clínica, entonces el certificado queda registrado como un evento de la historia clínica con fecha, profesional y acceso al documento.

- **[RF-512] Emisión de recetas desde la historia clínica**
  Descripción: El profesional debe poder generar recetas desde el contexto del paciente y dejar constancia de esa indicación en la historia clínica.
  Criterio de aceptación: Dado que el paciente requiere una receta, cuando el profesional la emite desde la historia clínica, entonces la receta queda asociada al paciente y visible en la cronología como parte de su atención.

### P1 — Importantes

- **[RF-513] Resumen clínico inicial del paciente**
  Descripción: La cabecera de la historia clínica debe mostrar datos identificatorios, edad, contacto, notas generales y mutuales vigentes para que el profesional entienda rápido con quién está trabajando.
  Criterio de aceptación: Dado que el profesional ingresa a la historia clínica, cuando se abre la ficha del paciente, entonces dispone de un resumen inicial con la información administrativa y de cobertura necesaria para atender sin navegar a otras pantallas.

- **[RF-514] Visualización de prácticas dentro del timeline**
  Descripción: Los eventos odontológicos de la cronología deben detallar código, nombre de práctica, pieza, caras, estado y fecha realizada para poder reconstruir el tratamiento.
  Criterio de aceptación: Dado que existe un evento odontológico en la historia clínica, cuando el profesional lo despliega, entonces visualiza las prácticas vinculadas con suficiente detalle para entender qué se hizo y en qué estado quedó.

- **[RF-515] Distinción entre registro clínico libre y registro odontológico**
  Descripción: La historia clínica debe diferenciar visualmente las fichas textuales, los documentos y las prácticas odontológicas para no confundir tipos de información.
  Criterio de aceptación: Dado que la cronología contiene distintos tipos de eventos, cuando el usuario la recorre, entonces puede distinguir rápidamente si está viendo una nota clínica, un certificado, una receta o una práctica odontológica.

- **[RF-516] Consulta histórica por profesional tratante**
  Descripción: Debe ser posible revisar la historia clínica filtrando las intervenciones realizadas por un profesional específico.
  Criterio de aceptación: Dado que un paciente fue atendido por más de un profesional, cuando el usuario filtra por uno de ellos, entonces la historia clínica muestra solo los registros generados por ese profesional.

- **[RF-517] Registro de fecha y hora real del evento**
  Descripción: Todos los elementos de la historia clínica deben mostrar fecha y hora para sostener la trazabilidad cronológica.
  Criterio de aceptación: Dado que el usuario revisa cualquier elemento de la historia clínica, cuando consulta su detalle, entonces ve la fecha y hora exactas de creación del registro.

- **[RF-518] Consulta de múltiples tipos de ficha en la misma cronología**
  Descripción: La historia clínica debe admitir distintos tipos de registro, no solo la ficha clínica libre, para acompañar distintos momentos de atención.
  Criterio de aceptación: Dado que el paciente tiene registros de distintos tipos, cuando el profesional consulta la cronología completa, entonces encuentra fichas clínicas, certificados, recetas y eventos odontológicos conviviendo en el mismo orden temporal.

- **[RF-519] Persistencia de contexto del paciente al cambiar de acción**
  Descripción: Cuando el usuario pasa de historia clínica a receta, certificado u odontograma, el sistema debe mantener al mismo paciente seleccionado.
  Criterio de aceptación: Dado que el profesional está en la historia clínica de un paciente, cuando elige crear una receta, un certificado o abrir el odontograma, entonces la nueva acción se inicia ya vinculada a ese paciente.

- **[RF-520] Visualización de archivos y audios desde el historial**
  Descripción: Los registros con adjuntos o audio deben indicar claramente que tienen material asociado para facilitar su consulta posterior.
  Criterio de aceptación: Dado que una ficha clínica tiene adjuntos o audio, cuando aparece en la cronología, entonces el usuario identifica desde la lista que ese evento contiene material complementario y puede abrirlo.

### P2 — Deseables

- **[RF-521] Plantillas diferenciadas por tipo de atención**
  Descripción: La institución debe poder disponer de plantillas específicas para atención general, certificados, controles o evoluciones frecuentes.
  Criterio de aceptación: Dado que el profesional crea una nueva ficha, cuando despliega las plantillas disponibles, entonces encuentra opciones claramente identificadas por tipo de atención para elegir la más adecuada.

- **[RF-522] Resumen de antecedentes críticos siempre visible**
  Descripción: Alergias, medicación actual y factores de riesgo deben tener alta visibilidad para evitar omisiones durante la atención.
  Criterio de aceptación: Dado que el paciente tiene datos clínicos críticos cargados, cuando el profesional abre la historia clínica, entonces esos antecedentes aparecen destacados en la parte superior o en un bloque de rápida consulta.

- **[RF-523] Búsqueda por palabra dentro de notas clínicas**
  Descripción: El usuario debe poder localizar rápidamente menciones dentro del historial textual del paciente.
  Criterio de aceptación: Dado que el paciente tiene múltiples notas clínicas, cuando el profesional busca una palabra clave dentro de la historia clínica, entonces el sistema devuelve los registros en los que aparece esa referencia.

- **[RF-524] Indicador de registros anulados o invalidados**
  Descripción: Si un evento clínico o una práctica relacionada fue dejado sin efecto, la historia clínica debe mostrarlo sin borrarlo del relato longitudinal.
  Criterio de aceptación: Dado que un evento de la cronología quedó invalidado, cuando el usuario consulta la historia clínica, entonces ve ese evento marcado como anulado sin perder la trazabilidad del caso.

---

## Requisitos No Funcionales

- **Velocidad de consulta**: el profesional no debería esperar más de 2 segundos para abrir la historia clínica completa de un paciente con alto volumen de registros.
- **Comprensión**: la cronología debe ser lo suficientemente clara como para distinguir tipos de evento sin capacitación extensa.
- **Continuidad de atención**: la historia clínica debe permitir reconstruir el caso incluso si atiende otro profesional distinto al habitual.
- **Privacidad**: solo los usuarios autorizados pueden consultar o generar información clínica de un paciente.
- **Trazabilidad**: ningún documento clínico debe aparecer sin identificar fecha, hora y profesional responsable.
- **Consistencia documental**: los adjuntos, audios, recetas y certificados deben quedar vinculados al paciente y al evento clínico que los originó.

---

## Flujos

### Flujo principal — Registrar una consulta clínica completa

1. El profesional abre la historia clínica del paciente desde su ficha o desde el contexto de atención.
2. Revisa el resumen inicial del paciente y sus antecedentes críticos.
3. Consulta la cronología para entender atenciones previas, documentos emitidos y prácticas odontológicas relacionadas.
4. Crea una nueva ficha clínica a partir de una plantilla o en formato libre.
5. Completa motivo y descripción de la consulta.
6. Adjunta archivos y, si lo necesita, graba audio para complementar el registro.
7. Guarda la ficha clínica.
8. El nuevo registro aparece en la línea de tiempo con fecha, hora, profesional y señales de material adjunto.
9. Si la atención requiere un certificado, receta u odontograma, accede a esa acción sin perder el contexto del paciente.
10. Resultado: la atención queda documentada en forma integral y recuperable.

### Flujo — Actualizar antecedentes del paciente

1. El profesional entra a la sección de antecedentes.
2. Revisa categorías existentes como alergias, medicación, enfermedades y factores de riesgo.
3. Agrega o actualiza información en la categoría correspondiente.
4. Si la clínica necesita una categoría nueva, un usuario autorizado la incorpora.
5. El contenido actualizado queda visible dentro de la historia clínica general del paciente.

### Flujo — Emitir receta desde la historia clínica

1. El profesional abre la historia clínica del paciente.
2. Revisa antecedentes relevantes para la indicación.
3. Elige la acción de receta desde el contexto del paciente.
4. Genera la receta.
5. La receta queda vinculada al paciente y registrada como evento en la cronología.

### Flujo — Emitir certificado desde la historia clínica

1. El profesional abre la historia clínica del paciente.
2. Selecciona la acción de certificado.
3. Genera el documento desde el contexto clínico del paciente.
4. El certificado queda disponible en la historia clínica como parte del recorrido documental.

### Flujo — Revisar la evolución odontológica desde la historia clínica

1. El profesional abre la cronología del paciente.
2. Identifica un evento odontológico relevante.
3. Consulta el detalle de prácticas, piezas y caras comprometidas.
4. Navega al odontograma si necesita profundizar la revisión.
5. Regresa a la historia clínica manteniendo el mismo contexto del paciente.

### Flujos alternativos

**Carga rápida con audio y sin adjuntos**
Condición: el profesional necesita documentar la consulta con voz y observaciones breves.
1. Crea una nueva ficha.
2. Registra motivo y descripción resumida.
3. Graba audio.
4. Guarda sin adjuntar archivos.
Resultado: la ficha queda disponible con su audio asociado.

**Atención con múltiples documentos en la misma jornada**
Condición: en una misma atención se genera nota clínica, receta y certificado.
1. El profesional crea la ficha clínica base.
2. Emite receta desde el mismo contexto.
3. Emite certificado desde el mismo contexto.
4. La cronología ordena todos los eventos con sus marcas de tiempo.
Resultado: la jornada queda documentada sin fragmentación del caso.

### Flujos de error

**Adjunto no válido o incompleto**
Condición: el archivo no puede incorporarse correctamente.
Comportamiento esperado: el sistema avisa que el adjunto no pudo sumarse, mantiene la ficha en edición y permite reintentar sin perder el texto cargado.

**Audio interrumpido**
Condición: la grabación se corta o no se guarda correctamente.
Comportamiento esperado: el sistema informa que el audio no quedó asociado, permite descartarlo o volver a grabarlo, y evita que el usuario crea que quedó guardado cuando no fue así.

**Falta de autorización para ver historia clínica**
Condición: el usuario no tiene permiso para acceder a información clínica.
Comportamiento esperado: el sistema bloquea el acceso y comunica con claridad que no cuenta con autorización para consultar esa historia clínica.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] Dado que el profesional abre la historia clínica de un paciente, cuando la vista se carga, entonces encuentra resumen del paciente, antecedentes, acciones clínicas y cronología en una sola experiencia.
- [ ] Dado que el paciente tiene alergias, medicación y antecedentes familiares registrados, cuando el usuario consulta antecedentes, entonces la información aparece ordenada por categorías y no mezclada en notas libres.
- [ ] Dado que el profesional registra una nueva ficha clínica, cuando completa motivo, descripción, adjuntos y audio, entonces todo queda asociado al paciente y visible en la línea de tiempo.
- [ ] Dado que existe una atención odontológica previa, cuando el usuario consulta ese evento desde la cronología, entonces puede entender qué práctica se hizo, en qué pieza y con qué estado.
- [ ] Dado que el profesional emite una receta o un certificado desde la historia clínica, cuando finaliza la acción, entonces el documento queda registrado como parte del historial del paciente.
- [ ] Dado que el usuario filtra la cronología por profesional y fecha, cuando aplica los filtros, entonces solo visualiza los eventos que responden a esos criterios.
- [ ] Dado que el profesional cambia desde historia clínica al odontograma del paciente, cuando navega entre ambos, entonces el contexto del paciente se mantiene.

### Comportamientos críticos
- La historia clínica debe sostener un relato longitudinal coherente del paciente.
- Los antecedentes críticos deben poder verse rápido antes de atender.
- Ninguna receta, certificado, nota, audio o adjunto debe quedar huérfano de paciente o profesional responsable.
- La relación entre atención textual y práctica odontológica debe ser entendible para cualquier profesional autorizado que tome el caso.

### Métricas de impacto
- Tiempo para reconstruir antecedentes relevantes antes de atender: estimado actual disperso → objetivo menor a 2 minutos.
- Tiempo para registrar una consulta clínica estándar: objetivo menor a 3 minutos con plantilla o ficha libre.
- Porcentaje de atenciones con respaldo documental completo (nota + documento o evidencia cuando aplica): objetivo mayor al 90%.
- Consultas internas resueltas sin pedir contexto a otro profesional: aumento esperado medible en recepción y dirección clínica.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Notas clínicas desordenadas o demasiado libres | Alta | Alto | Usar plantillas, categorías y estructura de motivo + descripción para ordenar la documentación. |
| Información crítica escondida entre muchos eventos | Media | Alto | Destacar antecedentes críticos y ofrecer filtros efectivos en la cronología. |
| Fragmentación entre historia clínica y odontograma | Media | Alto | Hacer explícito el cruce entre ambos módulos y mantener navegación contextual. |
| Exceso de archivos o audios difíciles de revisar | Media | Medio | Señalizar material adjunto y ordenar siempre por fecha, tipo y profesional. |
| Acceso no autorizado a información clínica sensible | Baja | Crítico | Restringir consulta y generación según permisos institucionales. |
| Diferentes estilos de documentación entre profesionales | Alta | Medio | Definir plantillas mínimas y criterios de registro comunes por institución. |

---

## Preguntas Abiertas

- [ ] ¿La institución quiere obligar categorías mínimas de antecedentes antes de cerrar la primera consulta?
- [ ] ¿Los certificados deben clasificarse por tipo para facilitar búsqueda administrativa posterior?
- [ ] ¿La cronología debe permitir destacar eventos “relevantes” o basta con filtros y orden temporal?
- [ ] ¿Hay política institucional sobre cuánto tiempo conservar audios y adjuntos dentro de la historia clínica?
- [ ] ¿Las plantillas deben administrarse a nivel institución, por especialidad o por profesional?

---

*Generado por prd-creator · 2026-03-30*
