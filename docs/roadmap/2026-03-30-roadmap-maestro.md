# Roadmap maestro del producto — Sistema Odontológico

> **Fecha**: 2026-03-30  
> **Estado**: propuesta consolidada para planificación

---

## 1. Objetivo del roadmap

Ordenar el desarrollo del producto a partir de los PRDs existentes, priorizando valor de negocio, dependencia real entre módulos y una salida a mercado que sea operable de verdad.

Este roadmap no busca listar todo lo que el sistema podría tener, sino definir **en qué orden conviene construirlo** para evitar arrancar por módulos vistosos pero todavía apoyados sobre bases flojas.

También incorpora la decisión ya aprobada sobre **planes por tenant**, con una regla muy clara para esta etapa: el plan mensual **solo limita la cantidad de profesionales activos** por institución y **no habilita ni bloquea funcionalidades**.

---

## 2. Principios de priorización

1. **Primero la base institucional, después la sofisticación funcional**. Si identidad, tenant, padrón profesional y configuración mínima no están cerrados, el resto nace inestable.
2. **Primero operación diaria transversal, después profundidad clínica o económica**. Pacientes y agenda ordenan la clínica entera antes que módulos especializados.
3. **Primero continuidad operativa, después optimización**. Lo que permite trabajar todos los días entra antes que lo que mejora una parte puntual del flujo.
4. **Primero datos maestros y reglas compartidas, después módulos que los consumen**. Profesionales, pacientes, mutuales y configuración tienen que existir antes que recetas, odontograma o contabilidad robusta.
5. **Primero MVP realista, después producto maduro**. La primera meta no es replicar todo CLINICUS; es lanzar una versión que una clínica pueda entender, configurar y usar sin romperse.
6. **El plan por tenant se trata como restricción administrativa, no como feature gating**. La prioridad es controlar capacidad de crecimiento del padrón profesional, no segmentar módulos por plan.

---

## 3. Dependencias maestras entre módulos

### Cadena fundacional

- **Autenticación y Autorización** → condiciona acceso, permisos, sesiones, auditoría y alcance para todos los módulos.
- **Planes por tenant** → impactan sobre altas, activaciones y reactivaciones de profesionales.
- **Profesionales** → ordena quién atiende, con qué agenda, con qué mutuales, con qué requisitos regulatorios y bajo qué restricción de plan.
- **Configuración del Sistema** → define datos institucionales, parámetros base, consultorios, catálogos y visibilidad administrativa mínima del tenant.

### Cadena operativa

- **Pacientes** depende de auth y habilita historia clínica, odontograma, recetas, mutuales, presupuestos, depósitos y cuenta corriente.
- **Turnos y Agenda** depende de profesionales, configuración, pacientes y reglas de visibilidad.
- **Mutuales y Obras Sociales** depende de pacientes y profesionales; además alimenta odontograma, recetas, cobros y presupuestos.

### Cadena clínica

- **Historia Clínica** depende de pacientes, profesionales, permisos y contexto clínico.
- **Recetas** depende de historia clínica o contexto paciente, profesionales, REFEPS, dirección de atención, diagnósticos y mutuales.
- **Odontograma** depende de pacientes, profesionales, mutuales y, por valor de uso, conviene convivir con historia clínica antes que nacer aislado.

### Cadena económica

- **Presupuestos** depende de pacientes, profesionales y criterio terapéutico/comercial.
- **Depósitos** depende de pacientes, profesionales y trazabilidad económica mínima.
- **Cuenta Corriente / Contabilidad** depende de pacientes, profesionales, mutuales, depósitos, recetas, presupuestos y reglas institucionales más maduras.

### Cadena de adopción y operación extendida

- **Ayuda y Onboarding** acompaña varias releases, pero su primer valor aparece cuando ya existe una base mínima para guiar a la institución.
- **Llamador de Pacientes** depende de turnos, consultorios y flujo real de atención; no conviene antes de estabilizar agenda.

---

## 4. Definición de Release 0, Release 1, Release 2, Release 3, Release 4

## Release 0 — Fundaciones del sistema

### Objetivo

Dejar resuelta la base institucional y de gobierno del producto para que una clínica pueda entrar, entender quién puede operar, configurar lo mínimo y administrar su padrón profesional sin inconsistencias.

### Módulos incluidos

- Autenticación y Autorización
- Profesionales
- Configuración del Sistema (**mínima operativa**) 
- Representación transversal de **planes por tenant** en auth + profesionales + configuración + ayuda contextual mínima

### Alcance real de la release

- identidad, login, sesión, permisos y auditoría base;
- administración de profesionales con estados, activación, reactivación y baja administrativa;
- enforcement del cupo de profesionales activos por tenant;
- visibilidad administrativa del plan vigente, cupo usado, cupo disponible y gracia;
- configuración mínima institucional: datos fiscales/institucionales, consultorios, parámetros operativos básicos y checklist de puesta en marcha.

### Por qué arranca acá

Porque sin esta base todavía no existe una institución operable. Si hoy se arranca por odontograma o contabilidad, se construye encima de preguntas que todavía no están cerradas: quién accede, bajo qué alcance, qué profesional está realmente habilitado, cómo se parametriza la clínica y qué límite comercial tiene el tenant para crecer.

---

## Release 1 — Operación diaria mínima vendible

### Objetivo

Permitir la operación diaria administrativa más frecuente: identificar pacientes, ordenar agenda y trabajar con cobertura básica sin depender de memoria o circuitos paralelos.

### Módulos incluidos

- Pacientes
- Turnos y Agenda
- Mutuales y Obras Sociales
- Ayuda y Onboarding (**primer tramo orientado a adopción**) 

### Alcance real de la release

- padrón único de pacientes, búsqueda rápida y ficha central;
- agenda diaria/semanal/mensual, alta y reprogramación de turnos, conflictos y excepciones;
- vínculo paciente-mutual, planes, afiliado, mutuales habilitadas por profesional y cálculo visible de cobertura/coseguro;
- onboarding inicial para institución nueva y ayuda contextual sobre configuración, profesionales, pacientes y agenda.

### Resultado de negocio esperado

Con Release 0 + Release 1 ya existe un **MVP administrativo-operativo** que una clínica puede empezar a usar para acceso, padrón profesional, configuración básica, pacientes, coberturas y agenda.

---

## Release 2 — Núcleo clínico documentado

### Objetivo

Agregar capacidad clínica trazable sin saltar todavía al módulo visual más complejo. La prioridad acá es documentar la atención y emitir recetas con sustento regulatorio y operativo.

### Módulos incluidos

- Historia Clínica
- Recetas
- Presupuestos

### Alcance real de la release

- historia clínica integral con timeline, antecedentes, notas, adjuntos y audio;
- emisión de recetas de medicamentos y prácticas con requisitos regulatorios claros;
- presupuestos como puente entre plan terapéutico y propuesta económica.

### Por qué entra antes que odontograma

Porque historia clínica y recetas ordenan primero el **relato clínico y documental** del paciente. El odontograma es valiosísimo, pero también es uno de los módulos más complejos y más sensibles a dependencias previas: paciente correcto, profesional correcto, cobertura correcta, contexto clínico claro y trazabilidad histórica consistente.

---

## Release 3 — Profundidad odontológica y optimización operativa

### Objetivo

Expandir el producto hacia el corazón odontológico específico y mejorar el flujo fino de atención en clínica.

### Módulos incluidos

- Odontograma
- Llamador de Pacientes
- Depósitos

### Alcance real de la release

- odontograma con piezas, caras, prácticas, preexistencias, mutuales y coseguro;
- llamador en tiempo real para conectar agenda y atención efectiva;
- depósitos para tratamientos prolongados con reintegro, vencimientos y trazabilidad.

### Justificación de orden

- El **odontograma** entra cuando ya existe paciente, agenda, profesional, mutual, historia clínica y una base documental clínica madura.
- El **llamador** entra cuando la agenda ya está estabilizada y hay consultorios configurados.
- Los **depósitos** suman mucho valor, pero conviene incorporarlos cuando el circuito paciente-profesional-cobertura ya está claro y no antes.

---

## Release 4 — Columna económica integral

### Objetivo

Cerrar la evolución hacia un producto con trazabilidad financiera robusta y lectura gerencial real.

### Módulos incluidos

- Cuenta Corriente / Contabilidad

### Alcance real de la release

- ventas, cobros, pagos, honorarios, proveedores y retiros;
- partida doble, plan de cuentas, mayores, saldos, arqueo y centro de costos;
- integración con movimientos que ya nacen en recetas, depósitos, pacientes, mutuales y profesionales.

### Por qué queda al final

Porque contabilidad no es “otro módulo más”: es la capa que exige más consistencia transversal. Si se la construye antes de estabilizar pacientes, profesionales, cobertura, depósitos y documentos cobrables, se corre el riesgo de modelar una economía desconectada de la operación real y después pagar el costo de rehacerla.

---

## 5. Tabla resumen por release

| Release | Objetivo | Módulos incluidos | Dependencia clave | Valor esperado |
|---|---|---|---|---|
| **R0** | Fundar el producto | Auth, Profesionales, Configuración mínima, Planes por tenant | Base institucional y reglas de acceso | Clínica lista para darse de alta, configurar lo mínimo y gobernar su padrón profesional |
| **R1** | Hacer operable el día a día | Pacientes, Turnos y Agenda, Mutuales, Ayuda/Onboarding inicial | R0 estable | MVP administrativo-operativo para agenda, pacientes y coberturas |
| **R2** | Dar soporte clínico documentado | Historia Clínica, Recetas, Presupuestos | Pacientes + Profesionales + Mutuales + Configuración | Atención documentada, recetas válidas y propuesta económica trazable |
| **R3** | Profundizar odontología y flujo de atención | Odontograma, Llamador, Depósitos | R1 + R2 consolidados | Diferencial odontológico fuerte y mejor coordinación diaria |
| **R4** | Completar el back-office económico | Cuenta Corriente / Contabilidad | Todo el circuito previo maduro | Trazabilidad financiera integral y lectura gerencial confiable |

---

## 6. Qué entra en MVP y qué queda fuera

## MVP realista

El MVP realista no es “todo lo importante”. Es **Release 0 + Release 1**.

### Lo que sí entra en MVP

- acceso institucional con roles, sesiones y permisos;
- administración de profesionales con control por plan;
- configuración mínima de la clínica;
- visibilidad del plan vigente y cupo de profesionales activos;
- padrón de pacientes con búsqueda rápida;
- agenda y turnos con reglas operativas básicas;
- mutuales y afiliación del paciente;
- ayuda inicial para adopción administrativa.

### Qué tipo de MVP es

Es un **MVP administrativo-operativo**, no todavía un MVP clínico profundo ni un MVP financiero integral.

### Lo que queda fuera del MVP

- historia clínica avanzada;
- recetas con validación regulatoria completa;
- odontograma;
- presupuestos profundos;
- depósitos;
- llamador;
- cuenta corriente / contabilidad.

### Por qué conviene este recorte

Porque permite salir con una propuesta más simple de vender, probar e implantar: “te ordenamos acceso, estructura institucional, pacientes, agenda y cobertura”. Si se intenta meter clínica profunda y contabilidad en el primer salto, el MVP deja de ser MVP y pasa a ser una versión inmadura de un producto enorme.

---

## 7. Riesgos de secuencia

1. **Arrancar por odontograma demasiado temprano**  
   Riesgo: construir un módulo clínico muy complejo antes de estabilizar paciente, profesional, cobertura, permisos e historia documental.  
   Consecuencia: retrabajo alto, inconsistencias clínicas y mala adopción.

2. **Arrancar por contabilidad demasiado temprano**  
   Riesgo: modelar asientos, movimientos y reportes antes de consolidar los hechos de negocio que los originan.  
   Consecuencia: economía desconectada de la operación real, cierres difíciles de explicar y mucho rediseño posterior.

3. **Confundir límite de plan con bloqueo funcional**  
   Riesgo: transmitir que un tenant paga menos y por eso pierde módulos.  
   Consecuencia: contradicción con la decisión aprobada y ruido comercial innecesario.

4. **Subestimar la importancia de configuración mínima**  
   Riesgo: querer lanzar agenda o recetas sin defaults, consultorios, catálogos o parámetros básicos.  
   Consecuencia: la clínica entra, pero no logra operar de forma consistente.

5. **Dejar ayuda y onboarding demasiado para el final**  
   Riesgo: tener módulos funcionales pero difíciles de adoptar.  
   Consecuencia: más soporte manual, más fricción y menor velocidad de implantación.

6. **Meter demasiados módulos en el MVP**  
   Riesgo: dispersar foco entre clínica, operación y finanzas al mismo tiempo.  
   Consecuencia: releases lentas, calidad desigual y menos aprendizaje real con usuarios.

---

## 8. Decisiones fundacionales ya cerradas

1. **Autenticación y autorización es la base transversal del producto**.
2. **La institución/tenant es el límite operativo base**.
3. **Cada tenant tiene un plan mensual vigente**.
4. **El plan por tenant, en esta etapa, solo limita la cantidad de profesionales activos**.
5. **Asistentes, administradores y supervisores no consumen cupo del plan**.
6. **Si se alcanza el cupo, se bloquean nuevas altas y reactivaciones de profesionales**.
7. **Si hay downgrade y exceso, existe una gracia de 30 días**.
8. **Al terminar la gracia, los profesionales ya activos siguen operando; lo que se bloquea es el crecimiento del padrón**.
9. **Los planes hoy no controlan módulos ni funcionalidades**.
10. **Pacientes es la entidad central de la operación diaria y puente del resto del producto**.
11. **Profesionales y configuración no son módulos tardíos en roadmap aunque en el set original aparezcan más abajo por prioridad documental; en producto pasan a la base porque sostienen agenda, reglas y tenant plan**.

---

## 9. Preguntas abiertas para la siguiente etapa

1. ¿El MVP comercial se va a vender explícitamente como **operativo-administrativo**, o se necesita incluir alguna capacidad clínica mínima adicional para la primera salida?
2. ¿Qué subset exacto de **Configuración del Sistema** forma parte de la configuración mínima de Release 0 y qué queda para etapas posteriores?
3. ¿Presupuestos conviene entrar completo en Release 2 o dividirlo en un tramo básico y otro posterior?
4. ¿La primera versión de mutuales debe resolver solo cobertura visible y validaciones simples, o también una matriz más completa por práctica desde el arranque?
5. ¿El módulo de depósitos debe esperar a Release 3 o hay clínicas objetivo donde ese circuito sea tan crítico que justifique adelantarlo?
6. ¿La salida a mercado inicial apunta a clínicas chicas, asociaciones o instituciones medianas? Esa definición puede mover el peso relativo de agenda, mutuales y contabilidad.
7. ¿Qué hitos comerciales acompañan el modelo de planes por tenant si todavía no existe autoservicio de upgrade/downgrade dentro del producto?

---

## Cierre ejecutivo

La lectura maestra es simple: **primero fundación, después operación, después clínica profunda, después optimización odontológica, y recién al final contabilidad integral**.

No conviene arrancar por odontograma ni por contabilidad porque ambos dependen de demasiadas decisiones previas ya sea de identidad, padrón, cobertura, configuración, pacientes o trazabilidad. Si se respeta este orden, el producto puede salir antes, aprender más rápido y crecer con menos retrabajo.
