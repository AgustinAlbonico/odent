# PRD: Pacientes

> **Fecha**: 2026-03-30
> **Status**: borrador
> **Complejidad**: alta
> **Autor**: generado con prd-creator

---

## Problema

La operación diaria de una clínica odontológica gira alrededor del paciente. En el relevamiento real se observó un universo de más de 3.000 pacientes, con búsquedas constantes por DNI, nombre y apellido, y con necesidad de navegar desde esa ficha hacia historia clínica, odontograma, cuenta corriente, turnos, depósitos, mutuales y recetas. Si el registro del paciente es lento, confuso o incompleto, toda la cadena operativa se resiente: recepción tarda más, el profesional pierde contexto y la administración trabaja con información fragmentada.

Además, el paciente no es solo una ficha demográfica. Es el punto de unión entre cobertura, atención clínica y movimiento económico. Por eso el módulo debe resolver tres cosas a la vez: identificación confiable (DNI como identificador principal), búsqueda rápida en una base numerosa y acceso integrado a todos los vínculos operativos relevantes.

**Situación actual**: el relevamiento muestra un listado paginado de pacientes con 3000+ registros, búsqueda por DNI/nombre/apellido, edición de datos personales, vínculos directos a ficha clínica, mutuales y cuenta corriente, y presencia de alta rápida desde otros contextos del sistema. El usuario pidió formalizar este comportamiento como PRD de negocio completo, sumando reglas claras de alcance, priorización y criterios de aceptación.

---

## Usuarios

### Usuario principal
- **Quién**: Asistente / recepción.
- **Necesidad**: identificar al paciente en segundos, crear nuevos registros sin fricción y llevarlo al módulo correcto según la tarea del momento.
- **Dolor actual**: cuando la búsqueda tarda, el dato está incompleto o la navegación está fragmentada, se pierde tiempo frente al paciente y aumenta el riesgo de errores administrativos.

### Usuarios secundarios
- **Profesional**: necesita entrar a la ficha correcta del paciente, entender rápidamente su contexto y saltar a odontograma, ficha clínica o recetas sin pasos innecesarios.
- **Administración**: necesita mantener la base ordenada, evitar duplicados, revisar vínculos con mutuales y asegurar consistencia del padrón.
- **Dirección / supervisión**: necesita una base de pacientes confiable como soporte del resto de la operación clínica y financiera.

---

## Objetivos

### Objetivos de negocio
- Consolidar un padrón único y confiable de pacientes por institución.
- Usar el DNI como identificador principal para reducir duplicados y errores de búsqueda.
- Permitir que un paciente concentre sus vínculos con mutuales, ficha clínica, odontograma, cuenta corriente, turnos, depósitos y recetas.
- Reducir el tiempo operativo necesario para encontrar o dar de alta un paciente.

### Objetivos de usuario
- Que recepción encuentre un paciente en pocos segundos desde cualquier pantalla relevante.
- Que el profesional acceda a la información correcta del paciente sin navegar a ciegas entre módulos.
- Que el alta de un paciente nuevo requiera el mínimo esfuerzo posible sin perder calidad básica de datos.
- Que un mismo paciente pueda tener múltiples mutuales con sus respectivos datos de afiliación y plan.

### No-objetivos (explícitos)
- No incluye portal de autogestión para pacientes.
- No incluye validación automática contra padrones externos de identidad o cobertura.
- No incluye migración masiva histórica desde otros sistemas en esta versión.
- No incluye funcionalidades de marketing, recordatorios o comunicación con pacientes como objetivo central del módulo.

---

## Alcance

### Incluido en esta versión
- Alta, consulta, edición y baja lógica/administrada de pacientes según permisos.
- DNI como identificador principal del paciente.
- Búsqueda por DNI, nombre y apellido.
- Búsqueda global rápida desde la navegación superior.
- Listado paginado apto para bases de 3000+ pacientes.
- Ficha del paciente con datos demográficos y accesos directos.
- Vínculo de múltiples mutuales por paciente, cada una con número de afiliado y plan.
- Accesos directos desde paciente hacia ficha clínica, odontograma, cuenta corriente, turnos, depósitos y recetas.
- Alta rápida de paciente desde flujos donde el dato todavía no existe.
- Prevención de duplicados basada en DNI dentro de la institución.

### Fuera de alcance (explícito)
- Portal del paciente y funcionalidades de acceso personal — requiere otra línea de producto.
- Integración automática con validadores externos de cobertura o identidad — se evaluará más adelante.
- Campañas, comunicación masiva o recordatorios automáticos — pertenecen a módulos de comunicaciones.
- Digitalización documental avanzada del paciente fuera de los vínculos ya definidos con ficha clínica y adjuntos — no es objetivo principal de este PRD.

---

## Requisitos Funcionales

### P0 — Críticos (sin estos no hay producto)

- **[RF-001] Alta de paciente con datos mínimos obligatorios**
  **Descripción**: el sistema debe permitir crear un paciente nuevo con un conjunto básico de datos obligatorios para no frenar la operación.
  **Criterio de aceptación**: **Dado** un usuario con permiso para operar pacientes, **cuando** completa los datos obligatorios y guarda, **entonces** el sistema crea el paciente y deja disponible su ficha para seguir trabajando.

- **[RF-002] DNI como identificador principal**
  **Descripción**: el DNI debe ser el identificador principal del paciente dentro de la institución.
  **Criterio de aceptación**: **Dado** un paciente nuevo o existente, **cuando** el usuario consulta su registro, **entonces** el DNI aparece como dato principal de identificación.

- **[RF-003] Prevención de duplicados por DNI**
  **Descripción**: no deben coexistir dos pacientes con el mismo DNI dentro de la misma institución.
  **Criterio de aceptación**: **Dado** un DNI ya registrado, **cuando** un usuario intenta crear otro paciente con ese mismo DNI, **entonces** el sistema bloquea el alta duplicada e informa que el paciente ya existe.

- **[RF-004] Búsqueda por DNI, apellido o nombre**
  **Descripción**: el sistema debe permitir encontrar pacientes por cualquiera de esos criterios sin depender del dato exacto completo.
  **Criterio de aceptación**: **Dado** un usuario en el módulo de pacientes, **cuando** busca por DNI, apellido o nombre, **entonces** obtiene resultados coincidentes y puede abrir la ficha correcta.

- **[RF-005] Búsqueda global rápida**
  **Descripción**: desde la navegación general debe existir un acceso rápido para buscar pacientes sin abandonar por completo el contexto operativo actual.
  **Criterio de aceptación**: **Dado** un usuario trabajando en cualquier módulo habilitado, **cuando** abre la búsqueda global e identifica un paciente, **entonces** puede saltar directamente a su ficha o contexto asociado.

- **[RF-006] Ficha única de paciente**
  **Descripción**: el sistema debe ofrecer una ficha central que reúna datos personales, mutuales vinculadas y accesos directos al resto de los módulos relacionados.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** el usuario abre su ficha, **entonces** visualiza sus datos principales y puede navegar a sus vínculos operativos desde ese mismo punto.

- **[RF-007] Edición de datos del paciente**
  **Descripción**: el usuario autorizado debe poder actualizar información demográfica y de contacto del paciente.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** un usuario autorizado modifica datos válidos y guarda, **entonces** la ficha queda actualizada y disponible con la nueva información.

- **[RF-008] Listado paginado para gran volumen**
  **Descripción**: el módulo debe soportar un listado navegable y ordenado para una base de 3000+ pacientes.
  **Criterio de aceptación**: **Dado** una institución con miles de pacientes, **cuando** el usuario abre el listado general, **entonces** puede recorrer resultados paginados sin perder contexto de navegación.

- **[RF-009] Vinculación obligatoria con módulos relacionados**
  **Descripción**: desde la ficha del paciente debe existir acceso directo a ficha clínica, odontograma, cuenta corriente, turnos, depósitos y recetas según permisos.
  **Criterio de aceptación**: **Dado** un paciente con información relacionada, **cuando** el usuario entra a su ficha, **entonces** puede abrir los módulos vinculados desde accesos visibles y coherentes.

- **[RF-010] Respeto de permisos y alcance**
  **Descripción**: el acceso al paciente debe obedecer las reglas de autenticación y autorización definidas para cada rol.
  **Criterio de aceptación**: **Dado** un usuario con visibilidad restringida, **cuando** consulta pacientes, **entonces** el sistema muestra solo el universo habilitado para su rol.

### P1 — Importantes (necesarios para una buena experiencia)

- **[RF-011] Múltiples mutuales por paciente**
  **Descripción**: un mismo paciente debe poder vincular más de una mutual u obra social dentro de la institución.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** se le agregan dos o más mutuales válidas, **entonces** el sistema conserva todas las vinculaciones activas del paciente.

- **[RF-012] Datos de afiliación por mutual**
  **Descripción**: cada mutual vinculada al paciente debe guardar como mínimo número de afiliado y plan.
  **Criterio de aceptación**: **Dado** una mutual asociada a un paciente, **cuando** el usuario completa afiliado y plan, **entonces** esos datos quedan visibles y reutilizables en los flujos posteriores.

- **[RF-013] Acceso a ficha clínica desde paciente**
  **Descripción**: desde la ficha del paciente se debe poder abrir su contexto clínico sin búsquedas intermedias.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** el usuario selecciona la opción de ficha clínica, **entonces** accede directamente al historial y antecedentes de ese paciente.

- **[RF-014] Acceso a odontograma desde paciente**
  **Descripción**: el vínculo con el odontograma debe ser directo para mantener continuidad clínica.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** el usuario selecciona la opción de odontograma, **entonces** accede al contexto odontológico del paciente correcto.

- **[RF-015] Acceso a cuenta corriente desde paciente**
  **Descripción**: el usuario autorizado debe poder ir desde la ficha a la situación económica del paciente.
  **Criterio de aceptación**: **Dado** un paciente existente, **cuando** el usuario selecciona la opción de cuenta corriente, **entonces** accede al detalle económico filtrado por ese paciente.

- **[RF-016] Alta rápida desde otros flujos**
  **Descripción**: cuando un paciente todavía no existe, el sistema debe permitir darlo de alta sin abandonar tareas como turnos u odontograma.
  **Criterio de aceptación**: **Dado** un usuario en un flujo operativo donde necesita un paciente inexistente, **cuando** elige crear uno nuevo desde ese contexto, **entonces** puede hacerlo y seguir con la tarea original sin rehacer el trabajo previo.

- **[RF-017] Visualización de datos demográficos completos**
  **Descripción**: la ficha debe incluir los campos observados como relevantes para la operación diaria.
  **Criterio de aceptación**: **Dado** un paciente con datos cargados, **cuando** el usuario abre su ficha, **entonces** ve DNI, apellido, nombre, sexo, fecha de nacimiento, edad, grupo y factor, domicilio, código postal, teléfono, email y notas.

- **[RF-018] Cálculo de edad visible**
  **Descripción**: la edad del paciente debe mostrarse como dato derivado útil para la operación clínica.
  **Criterio de aceptación**: **Dado** un paciente con fecha de nacimiento cargada, **cuando** el usuario ve su ficha o formulario, **entonces** el sistema muestra la edad calculada automáticamente.

### P2 — Deseables (mejoran la experiencia, pero pueden esperar)

- **[RF-019] Filtros avanzados del padrón**
  **Descripción**: el listado puede incorporar filtros adicionales útiles para operación y supervisión.
  **Criterio de aceptación**: **Dado** un usuario que necesita acotar el padrón, **cuando** aplica filtros avanzados habilitados, **entonces** el listado se ajusta sin perder coherencia de resultados.

- **[RF-020] Exportación del padrón según permisos**
  **Descripción**: usuarios habilitados pueden exportar listados de pacientes para tareas administrativas controladas.
  **Criterio de aceptación**: **Dado** un usuario con permiso de exportación, **cuando** solicita exportar el padrón o una búsqueda filtrada, **entonces** obtiene un archivo consistente con la información visible autorizada.

- **[RF-021] Indicadores de actividad del paciente**
  **Descripción**: el listado puede mostrar señales simples sobre actividad reciente para facilitar seguimiento.
  **Criterio de aceptación**: **Dado** un paciente con o sin actividad reciente definida por negocio, **cuando** aparece en el listado, **entonces** el sistema muestra un indicador de estado operativo entendible.

---

## Datos principales del paciente

### Campos esperados de la ficha
- DNI
- Apellido
- Nombre
- Sexo
- Fecha de nacimiento
- Edad calculada
- Grupo sanguíneo
- Factor RH
- Domicilio
- Código postal
- Teléfono
- Email
- Notas

### Datos vinculados visibles desde la ficha
- Tabla de mutuales del paciente
- Acceso a ficha clínica
- Acceso a odontograma
- Acceso a cuenta corriente
- Acceso a turnos
- Acceso a depósitos
- Acceso a recetas

---

## Relación del paciente con otros módulos

- **Ficha clínica**: reúne antecedentes, registros clínicos, adjuntos y continuidad de atención.
- **Odontograma**: concentra prácticas odontológicas y evolución clínica por pieza/cara.
- **Cuenta corriente**: refleja cobros, deudas y movimientos económicos vinculados al paciente.
- **Turnos**: ordena su agenda de atención y coordinación con profesionales.
- **Depósitos**: registra pagos a cuenta de tratamientos, especialmente relevantes para ortodoncia y tratamientos prolongados.
- **Recetas**: vincula prescripciones emitidas dentro del contexto asistencial.
- **Mutuales**: define cobertura, afiliación y plan para la atención del paciente.

---

## Requisitos No Funcionales

- **Velocidad de búsqueda**: encontrar un paciente no debe sentirse pesado aun con 3000+ registros cargados.
- **Usabilidad**: la búsqueda y el alta rápida deben poder resolverse por personal administrativo sin entrenamiento técnico.
- **Consistencia de datos**: no deben generarse duplicados por falta de validación del DNI.
- **Continuidad operativa**: el usuario debe poder pasar del paciente a sus módulos relacionados en uno o pocos clics.
- **Privacidad**: la visibilidad del padrón y de la ficha debe respetar estrictamente los permisos por rol y alcance.
- **Escalabilidad de negocio**: el módulo debe soportar crecimiento de pacientes por institución sin degradar la experiencia cotidiana.

---

## Flujos

### Flujo principal: búsqueda y acceso a ficha
1. El usuario ingresa al módulo de pacientes o abre la búsqueda global.
2. Busca por DNI, apellido o nombre.
3. El sistema devuelve coincidencias relevantes.
4. El usuario identifica al paciente correcto.
5. Abre su ficha.
6. Desde allí continúa hacia el módulo que necesita.

### Flujo principal: alta de paciente
1. El usuario indica que quiere crear un nuevo paciente.
2. Completa los datos obligatorios.
3. El sistema valida que el DNI no exista.
4. Si la validación es correcta, crea la ficha.
5. El usuario puede continuar con mutuales, turnos, ficha clínica u otra tarea.

### Flujo alternativo: alta rápida durante otra tarea
1. El usuario está creando un turno, una práctica o una atención.
2. Busca un paciente y no lo encuentra.
3. El sistema le ofrece crear un paciente sin abandonar el flujo.
4. El usuario completa datos mínimos.
5. El sistema lo crea y lo devuelve al flujo original ya seleccionado.

### Flujo alternativo: agregar mutuales a un paciente
1. El usuario abre la ficha del paciente.
2. Entra a la sección de mutuales.
3. Busca y selecciona una mutual.
4. Completa afiliado y plan.
5. Repite si necesita más de una mutual.
6. Guarda la vinculación.

### Flujo de error: intento de duplicado por DNI
1. El usuario intenta crear un paciente con un DNI ya existente.
2. El sistema frena la operación.
3. Informa que el paciente ya existe.
4. Ofrece continuar desde la ficha existente cuando aplique.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] **Dado** un padrón con más de 3000 pacientes, **cuando** recepción busca por DNI, nombre o apellido, **entonces** encuentra al paciente correcto en tiempo operativo razonable.
- [ ] **Dado** un DNI ya registrado, **cuando** un usuario intenta crear otro paciente con ese mismo DNI, **entonces** el sistema bloquea el duplicado.
- [ ] **Dado** un paciente con múltiples mutuales, **cuando** el usuario revisa su ficha, **entonces** visualiza todas las coberturas activas con su afiliado y plan.
- [ ] **Dado** un paciente existente, **cuando** el usuario abre su ficha, **entonces** puede saltar a ficha clínica, odontograma, cuenta corriente, turnos, depósitos y recetas según permisos.
- [ ] **Dado** un paciente inexistente en medio de otro flujo, **cuando** el usuario realiza el alta rápida, **entonces** puede retomar la tarea original sin reiniciar el proceso.
- [ ] **Dado** un usuario con visibilidad limitada, **cuando** busca pacientes, **entonces** solo ve el universo habilitado por su rol.

### Comportamientos críticos
- El DNI funciona como ancla principal de identificación del paciente.
- No pueden coexistir duplicados del mismo paciente por DNI dentro de la institución.
- La ficha del paciente es el punto de entrada central al resto de los módulos relacionados.
- Un paciente puede tener múltiples mutuales, no una sola cobertura rígida.

### Métricas de impacto
- Reducción del tiempo promedio para encontrar un paciente en tareas de recepción.
- Disminución sostenida de intentos de alta duplicada por DNI.
- Menor cantidad de pasos necesarios para pasar del padrón a una acción clínica o administrativa.
- Mayor completitud de fichas de pacientes usadas activamente en la operación diaria.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Duplicados por carga apresurada | Alta | Alto | Validar DNI obligatoriamente y ofrecer acceso directo al registro existente. |
| Búsqueda lenta en un padrón grande | Media | Alto | Diseñar experiencia de búsqueda orientada a volumen real y validar con base similar a producción. |
| Ficha fragmentada que obliga a demasiados pasos | Media | Alto | Definir al paciente como punto de entrada central a módulos relacionados. |
| Coberturas mal cargadas o incompletas | Media | Medio | Exigir estructura clara para mutual, afiliado y plan, y mostrarla de forma visible. |
| Exceso de campos obligatorios que frene la recepción | Alta | Medio | Mantener una política de datos mínimos para alta inicial y completar luego lo accesorio. |
| Exposición indebida del padrón completo | Baja | Alto | Aplicar estrictamente reglas de visibilidad por rol y alcance. |

---

## Preguntas Abiertas

- [ ] ¿Se permitirá registrar pacientes sin DNI en casos excepcionales, por ejemplo extranjeros o situaciones de urgencia?
- [ ] ¿Qué criterio exacto definirá “paciente visible” para un profesional: vínculo explícito, atención previa, turno asignado o combinación de estos?
- [ ] ¿La baja será siempre lógica/inactiva o existirá eliminación excepcional controlada?
- [ ] ¿La exportación del padrón incluirá siempre datos de mutuales o eso dependerá del caso de uso administrativo?
- [ ] ¿Qué filtros avanzados son realmente prioritarios para la primera salida del módulo?

---

*Generado por prd-creator · 2026-03-30*
