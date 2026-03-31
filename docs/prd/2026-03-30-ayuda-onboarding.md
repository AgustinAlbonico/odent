# PRD: Ayuda y Onboarding

> **Fecha**: 2026-03-30
> **Estado**: borrador
> **Prioridad**: P3 — parametrización y adopción
> **Complejidad**: media-alta
> **Autor**: generado para documentación funcional

---

## Problema

Un sistema odontológico maduro y con muchos módulos puede ser funcionalmente potente, pero si no ayuda a descubrir su valor desde el primer día termina dependiendo de memoria, transmisión oral entre colegas y prueba y error. En el relevamiento se observó una señal clarísima: el producto ya incluye atajos de teclado, videos tutoriales, manual descargable y ayuda accesible desde el menú del usuario. Eso confirma que la adopción no es un tema accesorio sino un problema real del negocio.

La clínica necesita que asistentes, profesionales y administradores aprendan rápido, recuerden cómo operar y encuentren ayuda en contexto sin frenar la atención. Si una recepcionista no descubre los atajos clave, si un profesional no entiende cómo emitir una receta o registrar una práctica, o si una institución nueva no sabe por dónde empezar, el costo aparece enseguida: más tiempo por tarea, más dependencia de soporte, más errores y menor adopción del sistema.

El objetivo de este módulo es resolver la primera experiencia de uso, la capacitación continua y la ayuda contextual de manera integrada, para que el sistema no solo sea poderoso sino también APRENDIBLE, descubrible y sostenible en el tiempo.

---

## Usuarios

### Usuario principal
- **Quién**: Asistente / recepcionista en etapa de adopción o uso diario
- **Necesidad**: Aprender rápido los flujos básicos y encontrar ayuda sin cortar la atención al paciente.
- **Dolor actual**: Depende de otra persona para saber dónde está cada función o cómo completar un proceso infrecuente.

### Usuarios secundarios
- **Profesional**: Necesita ayuda rápida sobre tareas clínicas y atajos que mejoren su velocidad diaria.
- **Administrador institucional**: Necesita guiar a usuarios nuevos y reducir el costo de capacitación interna.
- **Institución nueva**: Necesita un recorrido inicial para entender configuración, agenda, pacientes, odontograma, recetas y circuitos administrativos.

---

## Objetivos

### Objetivos de negocio
- Reducir el tiempo de adopción de una institución nueva.
- Bajar la dependencia de soporte informal o capacitación uno a uno.
- Aumentar el uso efectivo de funcionalidades de alto valor ya disponibles.
- Mejorar consistencia operativa entre usuarios y áreas.

### Objetivos de usuario
- Encontrar ayuda contextual sin abandonar el flujo actual.
- Descubrir atajos y mejores prácticas sin tener que memorizar todo desde el inicio.
- Acceder a videos y manuales adecuados al momento de necesidad.
- Tener una primera experiencia guiada que ordene el aprendizaje inicial.

### No-objetivos (explícitos)
- No incluye mesa de ayuda humana en vivo ni chat con operador.
- No incluye academia certificada externa ni exámenes formales.
- No incluye documentación técnica o de desarrollo.
- No reemplaza reglas de permisos o capacitación interna propia de cada institución.

---

## Alcance

### Incluido en esta versión
- Modal o espacio de ayuda rápida accesible desde el usuario.
- Biblioteca de atajos de teclado.
- Acceso a videos tutoriales organizados por tema.
- Descarga de manual general en PDF.
- Ayuda contextual dentro de pantallas y procesos.
- Ayuda administrativa sobre cupo de profesionales activos por plan mensual del tenant.
- Descubribilidad de funciones poco obvias o de alto valor.
- Primera experiencia de uso para instituciones y usuarios nuevos.
- Recomendaciones progresivas según rol y etapa de adopción.

### Fuera de alcance (explícito)
- Centro de tickets o incidentes.
- Personalización avanzada del contenido por cliente con edición libre de manuales.
- Comunidad de usuarios o foros.
- Analítica externa de aprendizaje fuera del producto.

---

## Principios del módulo

- **Ayuda sin fricción**: el usuario debe poder pedir ayuda sin perder contexto.
- **Descubrir antes que memorizar**: el sistema debe enseñar activamente, no esperar que el usuario adivine.
- **Primera experiencia guiada**: el producto tiene que acompañar al usuario nuevo en sus primeros pasos.
- **Capacitación continua**: la ayuda no termina en el onboarding inicial; debe aparecer también en tareas infrecuentes.
- **Orientación por rol**: no todos necesitan aprender lo mismo al mismo tiempo.
- **Bloqueos legítimos bien explicados**: cuando una acción administrativa se frena por reglas de plan, la ayuda debe evitar que se interprete como un error técnico o de permisos.

---

## Requisitos Funcionales

### P0 — Críticos

- **[RF-001] Mostrar ayuda rápida desde el menú del usuario**
  **Descripción**: El sistema debe ofrecer un punto de acceso estable a la ayuda general desde la identidad del usuario.
  **Criterio de aceptación**: Dado que un usuario abre el menú de su perfil, cuando selecciona "Ayuda", entonces el sistema muestra un espacio de ayuda rápida con accesos a atajos, videos y manual.

- **[RF-002] Publicar listado de atajos de teclado**
  **Descripción**: El sistema debe exponer en forma visible los atajos disponibles para navegación y acciones frecuentes.
  **Criterio de aceptación**: Dado que el usuario abre la ayuda rápida, cuando revisa la sección de atajos, entonces ve una lista clara de combinaciones y su acción asociada, incluyendo accesos a pacientes, turnos, odontograma, recetas, profesionales, medicamentos y diagnósticos.

- **[RF-003] Mantener biblioteca de videos tutoriales por temática**
  **Descripción**: El sistema debe ofrecer videos agrupados por categorías funcionales para acompañar aprendizaje y repaso.
  **Criterio de aceptación**: Dado que el usuario entra a "Videos Tutoriales", cuando explora la biblioteca, entonces puede navegar categorías como introducción, pasos iniciales, turnos, odontología, profesionales, cuenta corriente y autogestión.

- **[RF-004] Ofrecer manual descargable**
  **Descripción**: El sistema debe permitir descargar un manual general de uso para consulta offline o capacitación interna.
  **Criterio de aceptación**: Dado que el usuario abre la ayuda rápida, cuando hace clic en "Descargar Manual PDF", entonces el sistema inicia la descarga del manual disponible para esa versión funcional.

- **[RF-005] Brindar ayuda contextual en pantallas clave**
  **Descripción**: Las pantallas críticas deben mostrar orientación breve y accionable en el momento de uso.
  **Criterio de aceptación**: Dado que un usuario entra por primera vez a una pantalla compleja como odontograma, configuración o recetas, cuando visualiza la pantalla, entonces el sistema le muestra una ayuda breve con qué puede hacer ahí y cómo empezar.

- **[RF-006] Diseñar primera experiencia guiada para usuarios nuevos**
  **Descripción**: Un usuario que ingresa por primera vez debe recibir una guía inicial que lo oriente sobre los recorridos más importantes según su rol.
  **Criterio de aceptación**: Dado que un usuario inicia sesión por primera vez, cuando accede al sistema, entonces se le presenta un recorrido inicial con los módulos fundamentales que necesita conocer para empezar a trabajar.

- **[RF-007] Diseñar primera experiencia institucional**
  **Descripción**: Una institución nueva debe contar con un onboarding que la ayude a dejar el sistema operativo en sus primeras etapas.
  **Criterio de aceptación**: Dado que una institución está en etapa de puesta en marcha, cuando su administrador entra por primera vez, entonces el sistema le propone un recorrido de configuración y operación inicial con prioridades claras.

- **[RF-008] Mejorar descubribilidad de funciones de alto valor**
  **Descripción**: Las funcionalidades valiosas pero poco obvias, como atajos, ayuda, videos o accesos rápidos, deben ser más fáciles de descubrir.
  **Criterio de aceptación**: Dado que un usuario nuevo usa el sistema durante sus primeros días, cuando navega por módulos principales, entonces recibe señales visibles que le permiten descubrir ayuda, atajos y recorridos recomendados sin buscarlos activamente.

- **[RF-009] Recomendar contenido según contexto de uso**
  **Descripción**: La ayuda debe poder sugerir el recurso más útil según la pantalla o tarea en la que se encuentra el usuario.
  **Criterio de aceptación**: Dado que un usuario está en recetas, cuando solicita ayuda contextual, entonces el sistema prioriza contenidos relacionados con recetas, diagnósticos, medicamentos y requisitos del flujo correspondiente.

- **[RF-010] Mantener consistencia entre ayuda, videos y manual**
  **Descripción**: Los distintos formatos de ayuda deben responder a una misma narrativa operativa para no confundir al usuario.
  **Criterio de aceptación**: Dado que un usuario consulta una ayuda breve, luego un video y luego el manual sobre un mismo tema, cuando compara el contenido, entonces encuentra consistencia conceptual y terminológica entre los tres recursos.

- **[RF-010A] Explicar la regla de cupo profesional por plan**
  **Descripción**: La ayuda debe explicar con lenguaje de negocio qué cuenta como profesional activo y por qué una alta o reactivación puede quedar bloqueada.
  **Criterio de aceptación**: Dado que un administrador consulta ayuda sobre profesionales o configuración, cuando revisa el contenido correspondiente, entonces entiende que el plan mensual limita solo la cantidad de profesionales activos y que asistentes, administradores y supervisores no consumen cupo.

- **[RF-010B] Explicar la gracia de 30 días y la continuidad operativa**
  **Descripción**: La ayuda debe evitar interpretaciones erróneas sobre bloqueos masivos cuando una institución queda excedida por downgrade.
  **Criterio de aceptación**: Dado que el tenant quedó excedido por una baja de plan, cuando el administrador abre la ayuda relacionada, entonces entiende que existe una gracia de 30 días, que los profesionales ya activos no se bloquean automáticamente y que la restricción posterior aplica solo a nuevas altas o reactivaciones.

### P1 — Importantes

- **[RF-011] Onboarding diferenciado por rol**
  **Descripción**: El sistema debe adaptar el recorrido inicial según si el usuario es asistente, profesional o administrador.
  **Criterio de aceptación**: Dado que un profesional entra por primera vez, cuando inicia el onboarding, entonces el sistema prioriza pacientes, odontograma, recetas y agenda; y no el mismo recorrido que usaría administración.

- **[RF-012] Reanudar onboarding pendiente**
  **Descripción**: El usuario debe poder retomar un recorrido de aprendizaje sin volver a empezar desde cero.
  **Criterio de aceptación**: Dado que un usuario interrumpe el onboarding inicial, cuando vuelve a ingresar más tarde, entonces el sistema le ofrece continuar desde el último paso pendiente.

- **[RF-013] Marcar contenido como visto**
  **Descripción**: Los recursos de onboarding y ayuda pueden marcarse como vistos para ordenar el aprendizaje y evitar saturación.
  **Criterio de aceptación**: Dado que un usuario completa un paso del recorrido inicial o ve un tutorial recomendado, cuando finaliza ese recurso, entonces el sistema lo marca como visto y actualiza su progreso.

- **[RF-014] Mostrar tips breves en momentos oportunos**
  **Descripción**: El sistema puede mostrar recomendaciones cortas de uso cuando detecta tareas donde un atajo o ayuda podría ahorrar tiempo.
  **Criterio de aceptación**: Dado que un usuario usa frecuentemente el listado de pacientes sin emplear atajos, cuando permanece en ese módulo durante varios usos, entonces el sistema puede sugerir el atajo correspondiente en un mensaje breve y no invasivo.

- **[RF-015] Enlazar videos desde módulos relacionados**
  **Descripción**: Los tutoriales deben poder descubrirse desde las pantallas que explican.
  **Criterio de aceptación**: Dado que un usuario está en el módulo de turnos, cuando abre la ayuda contextual, entonces el sistema le ofrece acceso a videos relacionados con calendario, listado de turnos y estados.

- **[RF-016] Organizar ayuda por tareas y no solo por módulos**
  **Descripción**: La ayuda debe poder encontrarse por problema a resolver, no únicamente por nombre de pantalla.
  **Criterio de aceptación**: Dado que un usuario necesita "dar un turno" o "reactivar un profesional" y no sabe en qué pantalla buscar, cuando entra al centro de ayuda, entonces encuentra ese tema como tarea concreta dentro de los contenidos disponibles.

- **[RF-017] Mantener accesibilidad básica del contenido de ayuda**
  **Descripción**: El contenido de ayuda debe ser fácil de leer, escanear y comprender para distintos perfiles de usuario.
  **Criterio de aceptación**: Dado que un usuario abre una ayuda breve o el listado de atajos, cuando revisa el contenido, entonces encuentra títulos claros, texto corto y acciones concretas para seguir.

### P2 — Deseables

- **[RF-018] Checklist de primeros logros**
  **Descripción**: El sistema puede mostrar logros iniciales de adopción para ordenar el avance del usuario o institución.
  **Criterio de aceptación**: Dado que una institución nueva comienza a operar, cuando completa hitos como configurar sistema, crear profesional o registrar primer paciente, entonces el sistema marca esos logros en un checklist visible.

- **[RF-019] Recomendar "siguiente mejor paso"**
  **Descripción**: Tras completar una acción inicial importante, el sistema puede sugerir el siguiente paso lógico para avanzar en adopción.
  **Criterio de aceptación**: Dado que el administrador termina la configuración del sistema, cuando vuelve al panel inicial, entonces el sistema le sugiere continuar con profesionales, consultorios o agenda según corresponda.

- **[RF-020] Biblioteca de ayuda destacada por frecuencia**
  **Descripción**: El centro de ayuda puede destacar los temas más usados o más relevantes para cada etapa de adopción.
  **Criterio de aceptación**: Dado que una asistente recién comienza a usar el sistema, cuando entra al centro de ayuda, entonces ve primero contenidos prioritarios como pacientes, turnos, llamados y cobros frecuentes.

---

## Contenidos Base Observados

### Atajos confirmados en ayuda rápida
- alt + z → Resumen de Paciente
- alt + a → Cuenta Corriente
- alt + t → Turnos Listado
- alt + c → Turnos Calendario
- alt + n → Turnos Nuevo
- alt + l → Turnos Llamar
- alt + p → Pacientes Listado
- alt + shift + p → Pacientes Nuevo
- alt + r → Recetas Listado
- alt + shift + r → Recetas Nueva
- alt + f → Profesionales Listado
- alt + shift + f → Profesionales Nuevo
- alt + m → Medicamentos Listado
- alt + i → Diagnósticos Listado
- alt + o → Odontograma

### Categorías de videos observadas
- Introducción
- Pasos Iniciales
- Dar Turnos
- Odontología
- Profesionales
- Cuenta Corriente
- Autogestión

### Temas de videos observados
- Configuración del sistema
- Datos del profesional
- Cupo de profesionales por plan
- Tips
- Calendario
- Listado de turnos y estados
- Turnos para videollamadas
- Autorizaciones
- Odontograma
- Exportación para facturación
- Relacionar prácticas con dibujos y mutuales
- Listado de registros
- Presupuestos
- Crear recetas
- Atención de paciente e historias clínicas
- Acciones y reportes de cuenta corriente
- Órdenes y depósitos
- Turnos online

---

## Requisitos No Funcionales

- **Baja fricción**: acceder a ayuda no debe cortar ni romper el flujo de trabajo.
- **Claridad comunicacional**: el contenido debe estar escrito en lenguaje operativo, simple y orientado a la acción.
- **Pertinencia**: la ayuda contextual debe ser relevante para la pantalla o tarea activa.
- **Consistencia editorial**: atajos, videos, manual y ayudas breves deben usar el mismo vocabulario del negocio.
- **Descubribilidad**: funciones de ayuda y aprendizaje deben ser visibles sin esfuerzo excesivo.
- **Mantenimiento**: el contenido debe poder actualizarse a medida que evolucionan los flujos del producto.

---

## Flujos

### Flujo principal: Primera sesión de un usuario nuevo

1. El usuario inicia sesión por primera vez.
2. El sistema identifica su rol.
3. Presenta un onboarding breve con los módulos prioritarios.
4. El usuario recorre los primeros pasos sugeridos.
5. El sistema muestra cómo volver a la ayuda, dónde están los atajos y qué recursos existen.
6. El usuario puede cerrar, continuar o retomar luego.

### Flujo: Ayuda durante una tarea real

1. El usuario está trabajando en una pantalla específica.
2. Surge una duda.
3. Abre la ayuda contextual o el menú de ayuda.
4. El sistema prioriza contenido relacionado con esa tarea.
5. El usuario elige una ayuda breve, un video o el manual.
6. Cierra la ayuda y continúa sin perder el contexto operativo.

### Flujo: Bloqueo administrativo por cupo de plan

1. Un administrador intenta crear o reactivar un profesional.
2. El sistema bloquea la acción por límite de plan o exceso sin regularizar.
3. El usuario abre ayuda contextual desde el mensaje o desde el centro de ayuda.
4. La ayuda explica qué cuenta como profesional activo, qué acciones consumen o liberan cupo y cómo funciona la gracia de 30 días.
5. El usuario entiende que no se trata de un error técnico ni de permisos y puede revisar configuración o regularizar el padrón.

### Flujo: Descubrimiento de atajos

1. El usuario entra al sistema o a la ayuda rápida.
2. Ve la lista de atajos disponibles.
3. El sistema destaca los más útiles según el rol o módulo frecuente.
4. El usuario incorpora los accesos que le ahorran tiempo en tareas repetitivas.

### Flujo: Onboarding institucional

1. El administrador de una institución nueva ingresa al sistema.
2. El producto le propone un recorrido inicial.
3. El recorrido prioriza configuración, profesionales, consultorios, agenda y pacientes.
4. El administrador puede marcar avances y retomar pasos pendientes.
5. La institución llega a un estado operativo mínimo guiado por el producto.

### Flujos alternativos

- **Usuario experto**: puede saltear onboarding inicial y seguir usando el sistema con ayuda bajo demanda.
- **Usuario intermedio**: puede usar ayuda contextual solo en módulos que aún no domina.
- **Institución ya operativa**: puede aprovechar videos, atajos y manual sin pasar por un recorrido de configuración inicial.
- **Institución excedida por downgrade**: puede consultar ayuda específica para entender la gracia y los bloqueos administrativos legítimos.

### Flujos de error

- Si un recurso de ayuda no está disponible temporalmente, el sistema debe informar el problema sin dejar al usuario sin alternativas.
- Si un video no puede reproducirse, el sistema debe ofrecer otro formato relacionado, como ayuda breve o manual.
- Si el onboarding no puede continuar por falta de permisos o contexto, el sistema debe explicarlo y sugerir el siguiente paso posible.
- Si una acción se bloquea por cupo de plan, la ayuda debe explicarlo sin mezclarlo con un error de autenticación o autorización.

---

## Dependencias con Otros Módulos

- **Configuración del Sistema**: la primera experiencia institucional debe orientar sobre esta puesta a punto.
- **Pacientes**: uno de los recorridos básicos de adopción.
- **Turnos y Agenda**: flujo crítico para recepción y profesionales.
- **Profesionales**: fuente funcional para la regla de cupo sobre profesionales activos.
- **Autenticación y Autorización**: diferencia entre falta de permiso y restricción institucional por plan.
- **Odontograma**: módulo central de aprendizaje clínico.
- **Recetas**: requiere acompañamiento por su complejidad operativa.
- **Cuenta Corriente / Administración**: necesita tutoriales y ayudas para procesos sensibles.

---

## Criterios de Éxito

### Criterios de aceptación generales
- [ ] Dado que un usuario nuevo entra por primera vez, cuando inicia sesión, entonces recibe un recorrido inicial acorde a su rol.
- [ ] Dado que el usuario necesita recordar un atajo, cuando abre la ayuda rápida, entonces encuentra las combinaciones disponibles en una lista clara.
- [ ] Dado que un usuario busca aprender una tarea concreta, cuando entra al centro de ayuda, entonces encuentra recursos por tema y por tarea.
- [ ] Dado que el usuario está en una pantalla compleja, cuando solicita ayuda contextual, entonces recibe orientación relevante para esa pantalla.
- [ ] Dado que una institución nueva necesita arrancar operación, cuando su administrador inicia el onboarding institucional, entonces el sistema le ordena los pasos prioritarios para quedar operativa.
- [ ] Dado que administración no puede crear o reactivar un profesional por límite de plan, cuando consulta la ayuda, entonces entiende la regla de cupo, la diferencia entre roles que consumen o no consumen cupo y la lógica de gracia sin interpretarlo como error técnico.

### Comportamientos críticos
- La ayuda debe poder abrirse sin obligar al usuario a abandonar lo que está haciendo.
- El contenido recomendado debe ser pertinente al contexto y al rol.
- Las funciones de alto valor, como atajos y videos, deben ser fáciles de descubrir.
- El onboarding no debe sentirse como una traba; debe poder pausarse, retomarse o saltearse según experiencia del usuario.
- La ayuda sobre cupos y gracia debe usar el mismo lenguaje que Profesionales, Configuración y Auth para evitar contradicciones.

### Métricas de impacto
- Tiempo promedio hasta completar onboarding básico por rol.
- Porcentaje de usuarios nuevos que completan el recorrido inicial.
- Uso de ayuda rápida, videos y manual en las primeras semanas.
- Reducción de consultas repetitivas internas sobre tareas básicas.
- Incremento en uso de atajos de teclado y funcionalidades descubiertas durante onboarding.

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Exceso de información al usuario nuevo | Alta | Medio | Onboarding por etapas, por rol y con posibilidad de retomar |
| Ayuda desactualizada respecto del producto | Media | Alto | Gobernanza editorial y revisión periódica de contenidos |
| Baja descubribilidad del centro de ayuda | Media | Alto | Acceso visible desde menú de usuario y señales contextuales |
| Tutoriales poco relevantes para la tarea actual | Media | Medio | Recomendación por pantalla, rol y flujo operativo |
| Usuarios expertos perciben el onboarding como molestia | Media | Bajo | Permitir saltear, minimizar y no volver a insistir sin necesidad |
| Dependencia excesiva de videos para tareas urgentes | Media | Medio | Complementar con ayuda breve y manual descargable |
| Confundir bloqueo por plan con error técnico o de permisos | Media | Alto | Explicar en ayuda y onboarding qué consume cupo, qué lo libera y cuándo aplican los bloqueos administrativos |

---

## Preguntas Abiertas

- [ ] ¿Qué eventos definen exactamente que un usuario o una institución son "nuevos" para disparar onboarding?
- [ ] ¿Qué ayudas contextuales deben ser obligatorias en módulos complejos y cuáles conviene dejar solo bajo demanda?
- [ ] ¿Qué orden de prioridades debe tener el onboarding por rol en una institución odontológica típica?
- [ ] ¿Cómo se medirá el éxito del aprendizaje: por visualización de contenidos, por finalización de recorridos o por uso efectivo posterior?
- [ ] ¿Qué grado de personalización necesita cada institución sobre la ayuda general sin perder consistencia del producto?

---

## Roadmap Sugerido

### Quick wins
- Modal de ayuda rápida consistente
- Biblioteca ordenada de atajos
- Acceso visible a videos y manual
- Ayuda contextual breve en pantallas complejas

### Mediano plazo
- Onboarding por rol con progreso retomable
- Recomendaciones contextuales de contenido
- Descubribilidad activa de funciones valiosas
- Biblioteca de ayuda orientada por tareas

### Estratégicas
- Onboarding institucional completo con checklist de puesta en marcha
- Métricas de adopción y aprendizaje por perfil
- Recomendación progresiva de "siguiente mejor paso" según madurez de uso
