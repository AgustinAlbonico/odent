# Investigación de mercado: software de gestión odontológica en Argentina

**Fecha:** 30-03-2026  
**Objetivo:** construir una base sólida de conocimiento sobre el mercado argentino de software odontológico para detectar módulos, funcionalidades, problemas no resueltos y oportunidades de mejora antes de definir un futuro SaaS integral.  
**Enfoque:** Argentina primero; referencias internacionales o regionales solo como comparación secundaria útil.

---

## Cómo leer este documento

Para mantener rigor analítico, este informe diferencia tres niveles de certeza:

- **Observado:** aparece explícitamente en fuentes públicas consultadas.
- **Posible / inferida:** no está afirmado de forma literal, pero surge de evidencia pública razonable, estructura del producto, pricing, FAQ, tutoriales o claims consistentes.
- **Oportunidad:** no describe lo que hoy existe, sino un vacío o posibilidad detectada a partir del análisis.

---

## Metodología y alcance

### Universo investigado

Se relevaron **14 soluciones**:

- **11 con foco argentino o evidencia fuerte de operación local:** Benty, Bilog, OdontLux, Odontal Web, SIGO, Dentapp, OdonticLabs, DentalTec, OdontoCube, OdontoGRAMA, Hessy.
- **3 referencias secundarias útiles para comparar madurez funcional, pricing o ecosistema:** DENTIDESK, OdontoLog y Open Dental.

### Tipos de fuentes utilizadas

- Sitios oficiales
- Páginas de funcionalidades
- Páginas de pricing / planes
- FAQ
- Casos de éxito / testimonios
- Landing pages de producto
- Tutoriales y contenidos públicos
- Comparativas abiertas (por ejemplo ComparaSoftware y artículo comparativo de Akeito)

### Limitaciones metodológicas

- Algunas plataformas de reseñas o directorios devolvieron bloqueo parcial de acceso, por lo que el análisis de problemas del mercado se apoya fuertemente en:
  - evidencia oficial,
  - señales de producto,
  - pricing,
  - flujos públicos,
  - y lo que los competidores **no muestran**.
- Cuando no fue posible confirmar una funcionalidad con certeza, se la marca como **posible / inferida**.

### Criterios usados para evaluar relevancia

- claridad de propuesta de valor,
- profundidad funcional,
- orientación al mercado argentino,
- señales públicas de adopción,
- cobertura clínica + administrativa,
- capacidad de escalar de profesional individual a clínica,
- y resolución de particularidades locales como obras sociales, aranceles o facturación.

---

## Índice

- [1. Resumen ejecutivo](#1-resumen-ejecutivo)
- [2. Sistemas odontológicos investigados](#2-sistemas-odontológicos-investigados)
  - [2.1 Tabla comparativa general](#21-tabla-comparativa-general)
  - [2.2 Fichas detalladas por sistema](#22-fichas-detalladas-por-sistema)
- [3. Mapa general de módulos del mercado](#3-mapa-general-de-módulos-del-mercado)
- [4. Funcionalidades por módulo](#4-funcionalidades-por-módulo)
  - [4.1 Agenda y turnos](#41-agenda-y-turnos)
  - [4.2 Pacientes](#42-pacientes)
  - [4.3 Historia clínica odontológica y odontograma](#43-historia-clínica-odontológica-y-odontograma)
  - [4.4 Presupuestos y planes de tratamiento](#44-presupuestos-y-planes-de-tratamiento)
  - [4.5 Cobros, caja, finanzas y facturación](#45-cobros-caja-finanzas-y-facturación)
  - [4.6 Obras sociales, prepagas, nomencladores y auditoría](#46-obras-sociales-prepagas-nomencladores-y-auditoría)
  - [4.7 Comunicación y recordatorios](#47-comunicación-y-recordatorios)
  - [4.8 Reportes, dashboards y métricas](#48-reportes-dashboards-y-métricas)
  - [4.9 Multiusuario, roles, profesionales y sucursales](#49-multiusuario-roles-profesionales-y-sucursales)
  - [4.10 Laboratorios, proveedores, stock e insumos](#410-laboratorios-proveedores-stock-e-insumos)
  - [4.11 Documentos, formularios y PDFs](#411-documentos-formularios-y-pdfs)
  - [4.12 Integraciones](#412-integraciones)
  - [4.13 IA y automatización avanzada](#413-ia-y-automatización-avanzada)
- [5. Segmentación por tipo de cliente](#5-segmentación-por-tipo-de-cliente)
- [6. Patrones de pricing y monetización observables](#6-patrones-de-pricing-y-monetización-observables)
- [7. Problemas frecuentes del mercado y necesidades mal resueltas](#7-problemas-frecuentes-del-mercado-y-necesidades-mal-resueltas)
- [8. Oportunidades de mejora y ventaja competitiva](#8-oportunidades-de-mejora-y-ventaja-competitiva)
- [9. Top de ideas más valiosas detectadas](#9-top-de-ideas-más-valiosas-detectadas)
- [10. Conclusión final](#10-conclusión-final)
- [Anexo A. Fuentes consultadas](#anexo-a-fuentes-consultadas)
- [Anexo B. Sistemas detectados pero con evidencia insuficiente](#anexo-b-sistemas-detectados-pero-con-evidencia-insuficiente)

---

# 1. Resumen ejecutivo

## 1.1 Cómo es hoy el mercado argentino de software odontológico

El mercado argentino de software odontológico está **fragmentado**, y no aparece un líder único que domine con claridad todos los segmentos a la vez. En cambio, se observan tres grupos:

1. **SaaS para consultorio / clínica privada**  
   Ejemplos: Bilog, Benty, OdontLux, Odontal Web, SIGO, Dentapp, OdontoGRAMA, Hessy.

2. **Plataformas con foco institucional, auditoría u obras sociales**  
   Ejemplos: DentalTec, OdontoCube.

3. **Soluciones híbridas o de herencia más clásica (desktop + nube / local + web)**  
   Ejemplo claro: OdonticLabs.

## 1.2 Qué módulos son indispensables para competir

Los módulos que aparecen como base obligatoria para competir en Argentina son:

- agenda y turnos,
- pacientes,
- historia clínica odontológica,
- odontograma,
- presupuestos / planes de tratamiento,
- cobros / caja / cuentas corrientes,
- recordatorios,
- reportes básicos,
- soporte multiusuario al menos básico.

Para segmentos más complejos, pasan a ser casi obligatorios:

- obras sociales / prepagas,
- nomencladores,
- liquidaciones,
- roles y permisos,
- sucursales,
- auditoría,
- facturación electrónica local.

## 1.3 Patrones que se repiten en la mayoría de competidores

- La mayoría vende por **demo, contacto o WhatsApp**, no con onboarding totalmente autónomo.
- La **transparencia de precios** es baja.
- Casi todos resuelven lo esencial de consultorio, pero no siempre con la misma profundidad.
- Muchas propuestas son “todo en uno”, aunque en la práctica están más fuertes en algunas capas que en otras.
- El mercado todavía depende bastante de:
  - soporte humano,
  - configuración asistida,
  - y procesos paralelos fuera del software.

## 1.4 Debilidades o vacíos principales

Los vacíos más repetidos del mercado son:

- seguimiento comercial del tratamiento débil,
- reactivación de pacientes casi ausente,
- automatización de recepción todavía parcial,
- dashboards y métricas más operativas que estratégicas,
- integraciones abiertas escasas,
- stock / insumos / laboratorio poco desarrollados,
- baja madurez en multi-sucursal y permisos finos,
- poca unión real entre operación clínica, administración y crecimiento comercial.

## 1.5 Oportunidades más interesantes

Las oportunidades con más potencial parecen ser:

- WhatsApp como capa operativa real,
- seguimiento de tratamientos y cierres de presupuesto,
- recuperación de pacientes inactivos,
- BI real por profesional, sucursal y tratamiento,
- arquitectura multiusuario / multi-sede pensada desde el inicio,
- automatización administrativa e IA aplicada a recepción,
- pricing transparente y onboarding self-service,
- integración clínica + administrativa + comercial en un solo flujo.

---

# 2. Sistemas odontológicos investigados

## 2.1 Tabla comparativa general

| Sistema | País / mercado principal | Tipo de cliente | Propuesta de valor resumida | Módulos visibles o inferidos | ¿Muestra precios? | Orientación principal | Nivel de relevancia estimado |
|---|---|---|---|---|---|---|---|
| **Benty** | Argentina | Odontólogo, consultorio, clínica chica | SaaS cloud simple con foco clínico + administración + AFIP | Turnos, pacientes, HC, odontograma, obras sociales, comunicación, tratamientos, pagos, laboratorios, AFIP | No | Consultorio / clínica chica | Media |
| **Bilog** | Argentina + LatAm | Consultorio, clínica, grupos, auditoría | Plataforma fuerte en gestión odontológica, agenda online, reportes e IA | Agenda, pacientes, HC, odontograma, reportes, estadísticas, laboratorios, sucursales, auditoría, WhatsApp, IA | Sí | Consultorio a clínica mediana | Alta |
| **OdontLux** | Argentina (inferido) | Profesional individual / consultorio | Sistema simple con agenda, pacientes, finanzas y recordatorios | Agenda, HC, pacientes, finanzas, seguimiento, recordatorios, acceso multiplataforma | No | Profesional / consultorio | Media-baja |
| **Odontal Web** | Argentina | Odontólogos, consultorios, clínicas | Fuerte en agenda, obras sociales, presupuestos y cobranzas | Agenda, HC, odontograma, presupuestos, deudas, obras sociales, aranceles, recepcionista | No | Consultorio / clínica con OS | Media |
| **SIGO** | Argentina | Individual y clínicas | Core funcional + facturación electrónica + pricing público | Pacientes, odontogramas, turnos, tratamientos, presupuestos, cuentas corrientes, facturación electrónica | Sí | Individual / consultorio | Media |
| **Dentapp** | Argentina | Consultorio y clínica | Planes por sucursal/personal, foco en simpleza operativa | Turnos, prestaciones, pacientes, presupuestos, saldos, finanzas, personal, estadísticas | Sí | Consultorio / clínica | Media |
| **OdonticLabs** | Argentina | Consultorio, clínica, especialidades | Solución amplia con versión local y Pocket online | Pacientes, odontograma, turnos, OS, nomencladores, cobros, reportes, liquidaciones, insumos, laboratorios, agenda online | No (sin importe visible) | Consultorio / clínica con operatoria amplia | Media-alta |
| **DentalTec** | Argentina | Odontólogos, círculos, instituciones, obras sociales | Validación en tiempo real, facturación automática y auditoría institucional | Validación OS, odontograma, HC, agenda, WhatsApp, facturación ARCA, liquidaciones, roles, reportes, multi-entidad | No (salvo packs WhatsApp) | Institucional / obras sociales | Alta |
| **OdontoCube** | Argentina | Obras sociales, financiadores, prestadores | Gestión y auditoría odontológica B2B | Prestadores, odontograma web, autorizaciones, auditoría, liquidador, reportes | No | OS / auditoría | Media-alta en su nicho |
| **OdontoGRAMA** | Argentina | Consultorio y grupo chico | Solución cloud clásica con cuenta gratis | Agenda, pacientes, imágenes, tratamientos, diagnósticos, caja, facturación a prepagas/OS, estadísticas | No (planes sin importe visible) | Consultorio pequeño | Media-baja |
| **Hessy** | Posible Argentina / hispanohablante | Consultorio / clínica | Foco en diseño, administración simple y odontograma 3D | Agenda multi-doctor, caja, presupuestos, evolución, odontograma interactivo y 3D, sitio web de clínica | No | Consultorio / clínica | Media-baja |
| **DENTIDESK** *(referencia secundaria)* | Chile / LatAm | Clínica, multisucursal, dental schools | Referencia regional de mayor madurez funcional | Agenda, historial, stock, reportes, fichas especializadas, facturación local chilena, multisucursal, app | No | Clínica mediana/grande | Alta como benchmark |
| **OdontoLog** *(referencia secundaria)* | LatAm | Consultorio / clínica | Cloud simple con pricing transparente | Pacientes, citas, odontograma, pagos, cuotas, PDF, WhatsApp/email | Sí | Consultorio / clínica | Media como benchmark |
| **Open Dental** *(referencia secundaria)* | EEUU / global | Consultorio a gran escala | Referencia de ecosistema, extensibilidad e integraciones | PMS integral, patient portal, payment portal, web forms, texting, web sched, bridges, eServices | Parcial | Todo tamaño | Muy alta como benchmark técnico |

## 2.2 Fichas detalladas por sistema

### 2.2.1 Benty

- **Observado**
  - Se presenta como software odontológico cloud “simple, rápido y seguro”.
  - Muestra explícitamente: **turnos**, **pacientes**, **historias clínicas**, **antecedentes**, **imágenes**, **odontograma**, **obras sociales**, **comunicación**, **planes de tratamiento**, **pagos y deudas**, **laboratorios y proveedores**, **AFIP**.
  - Indica recordatorios de turnos por **WhatsApp, email y SMS**.
  - Ofrece “cobros integrados con cualquier tarjeta débito y crédito”.
  - Declara **320+ profesionales** y **100+ consultorios**.
  - Ofrece **1 mes gratis**.
- **Posible / inferida**
  - Parece orientado a consultorio y clínica chica/mediana más que a una estructura institucional compleja.
  - La mención de obras sociales, liquidaciones y reportes sugiere resolución administrativa intermedia, pero no institucional profunda al estilo DentalTec.
- **Pricing**
  - No visible públicamente.
- **Lectura estratégica**
  - Producto relativamente completo para práctica privada.
  - Fuerte como referencia de “todo en uno” para consultorio.

### 2.2.2 Bilog

- **Observado**
  - Claim fuerte: **+3000 clínicas y consultorios**, **+20.000 usuarios activos**, **+1M turnos gestionados al año**.
  - Cobertura funcional amplia:
    - agenda,
    - pacientes,
    - historia clínica,
    - odontograma,
    - presupuestos y pagos,
    - laboratorios,
    - estadísticas,
    - reportes,
    - administración,
    - liquidaciones a profesionales,
    - sucursales,
    - auditoría odontológica,
    - agenda online,
    - WhatsApp,
    - app.
  - Tiene una propuesta de IA explícita: **iAngela**, capaz de gestionar turnos, buscar pacientes, consultar información y operar por texto o voz con confirmación.
  - Pricing público:
    - **Freemium:** USD 0 / usuario / mes,
    - **Lite:** USD 25 / usuario / mes,
    - **Premium:** USD 40 / usuario / mes.
  - iAngela se vende aparte:
    - Free,
    - Lite USD 40 / mes,
    - Premium USD 70 / mes,
    - Enterprise a medida.
- **Posible / inferida**
  - Se perfila como uno de los jugadores más maduros del segmento consultorio/clínica privada.
  - La existencia de freemium y planes escalonados muestra una estrategia de entrada mucho más moderna que la media del mercado local.
- **Pricing**
  - Público y transparente.
- **Lectura estratégica**
  - Es probablemente uno de los benchmarks más importantes para un SaaS privado dental en Argentina.
  - La combinación de pricing claro, agenda online, sucursales e IA lo vuelve especialmente relevante.

### 2.2.3 OdontLux

- **Observado**
  - Posicionamiento: “gestión premium” pero simple.
  - Muestra explícitamente:
    - agenda,
    - historia clínica,
    - finanzas,
    - pacientes,
    - recordatorios automáticos,
    - confirmación de asistencia,
    - seguimiento de pacientes,
    - acceso desde cualquier dispositivo.
  - Claim comercial: reducir ausencias “hasta un 80%”.
- **Posible / inferida**
  - Apunta más a profesional individual o consultorio chico que a clínica compleja.
  - La profundidad administrativa parece moderada.
- **Pricing**
  - No visible.
- **Lectura estratégica**
  - Buen ejemplo de propuesta centrada en simplicidad + presentismo, pero con menor evidencia de profundidad diferencial.

### 2.2.4 Odontal Web

- **Observado**
  - Fuerte foco en consultorio / clínica y realidad argentina.
  - Declara:
    - agenda por profesional,
    - horarios, duración, vacaciones y feriados,
    - manejo por recepcionista,
    - historias clínicas,
    - antecedentes,
    - radiografías / fotos,
    - odontograma,
    - presupuestos desde odontograma,
    - control de deudas,
    - facturación con obras sociales,
    - actualización automática de aranceles,
    - seguimiento de liquidaciones,
    - integración con colegios profesionales.
  - Pone mucho énfasis en migración y asistencia.
- **Posible / inferida**
  - Tiene un posicionamiento bastante fuerte para consultorios que trabajan con obras sociales.
  - Parece más orientado a resolver fricción real de la práctica argentina que a vender una imagen “premium”.
- **Pricing**
  - No visible.
- **Lectura estratégica**
  - Muy relevante para entender la capa local de obras sociales, aranceles y cobranzas.

### 2.2.5 SIGO

- **Observado**
  - Muestra claramente:
    - pacientes,
    - odontogramas,
    - turnos,
    - tratamientos,
    - presupuestos,
    - cuentas corrientes,
    - facturación electrónica,
    - horarios personalizados,
    - recordatorios por email,
    - soporte técnico.
  - Pricing público:
    - **1 profesional:** ARS 25.000 / mes,
    - ARS 250.000 / año.
  - Ofrece **30 días gratis** sin tarjeta.
  - Tiene propuesta para clínicas/consultorios según cantidad de profesionales.
- **Posible / inferida**
  - Está más del lado “entry / mid-market” que institucional.
  - La resolución de obras sociales no aparece tan fuerte como en Odontal Web o DentalTec.
- **Lectura estratégica**
  - Uno de los productos locales más claros para entender pricing simple por profesional.

### 2.2.6 Dentapp

- **Observado**
  - Propone:
    - turnos,
    - prestaciones,
    - pacientes,
    - presupuestos,
    - saldos,
    - finanzas,
    - cajas diarias,
    - personal,
    - estadísticas.
  - Declara acceso móvil, seguridad y diseño intuitivo.
  - Pricing público:
    - Starter ARS 550 / mes,
    - Silver ARS 1250 / mes,
    - Gold ARS 2250 / mes,
    - Platinum ARS 4500 / mes,
    - Black ARS 8000 / mes.
  - Escala por **sucursal** y **personal**.
- **Posible / inferida**
  - Los precios visibles parecen muy bajos para 2026; es **posible** que estén desactualizados o que el sitio no refleje la política vigente real.
- **Lectura estratégica**
  - Muy útil como señal de cómo vender por sucursal y personal, aunque no necesariamente como pricing de referencia confiable.

### 2.2.7 OdonticLabs

- **Observado**
  - Producto con trayectoria larga y cobertura funcional amplia.
  - Módulos declarados:
    - pacientes,
    - historia clínica,
    - odontograma,
    - agenda por profesional y consultorio,
    - prestaciones,
    - obras sociales,
    - planes,
    - nomenclador general y por planes,
    - cuentas corrientes,
    - cobros y pagos,
    - liquidación por profesional,
    - presupuestos,
    - trabajos a laboratorio,
    - compra y uso de insumos,
    - bancos y sucursales,
    - listado de facturación a obras sociales,
    - email y WhatsApp,
    - reportes.
  - Tiene versión **Pocket 100% online** con:
    - turnos,
    - pacientes,
    - obras sociales,
    - WhatsApp,
    - confirmación/cancelación,
    - autogestión del paciente.
  - Modelo comercial:
    - **compra** o **alquiler**,
    - soporte post-venta opcional,
    - instalación gratis,
    - 1 licencia = 1 persona.
- **Posible / inferida**
  - Su propuesta es más robusta administrativamente que muchos SaaS de landing moderna.
  - Al mismo tiempo, su arquitectura y presentación pública transmiten un producto más clásico o híbrido.
- **Lectura estratégica**
  - Muy importante para entender un consultorio o clínica argentina que necesita bastante operatoria sin pasar por un SaaS súper moderno.

### 2.2.8 DentalTec

- **Observado**
  - Posicionamiento extremadamente específico para Argentina institucional.
  - Claims visibles:
    - **2000+ profesionales activos**,
    - **30+ instituciones**,
    - reducción de débitos,
    - reducción del tiempo administrativo,
    - reducción de ausentismo.
  - Módulos y fortalezas visibles:
    - validación de prácticas en tiempo real,
    - integración con **15+ obras sociales**,
    - odontograma,
    - historia clínica,
    - agenda,
    - WhatsApp,
    - facturación automática integrada con **ARCA**,
    - liquidaciones a prestadores,
    - dashboard,
    - reportes,
    - gestión jerárquica multi-entidad,
    - seguridad con roles y trazabilidad.
  - Casos públicos con:
    - CORA,
    - COSJ,
    - COM,
    - COE,
    - COSTG.
  - Publica paquetes de WhatsApp:
    - 50 mensajes USD 9,
    - 150 mensajes USD 25,
    - 300 mensajes USD 48.
- **Posible / inferida**
  - Es probablemente el jugador más fuerte del nicho institucional odontológico argentino.
  - No parece orientado al consultorio independiente como foco principal, aunque también lo atiende.
- **Lectura estratégica**
  - Benchmark central para obras sociales, validación, auditoría y facturación local compleja.

### 2.2.9 OdontoCube

- **Observado**
  - Es una plataforma de **gestión y auditoría odontológica**.
  - Tiene foco claro en financiadores y red de prestadores.
  - Módulos declarados:
    - prestadores,
    - odontograma web,
    - autorizaciones,
    - historial y diagnóstico,
    - documentación e imágenes,
    - auditoría,
    - reglas de negocio,
    - autorizaciones asincrónicas,
    - reportes y estadísticas,
    - liquidador,
    - pagos a profesionales,
    - recepción de facturas digitales.
  - Logos visibles de grandes financiadores / entidades.
- **Posible / inferida**
  - No es realmente un PMS clásico para consultorio privado; es otra capa del mercado.
- **Lectura estratégica**
  - Muy valioso para entender cómo se resuelve el lado financiador / auditoría del ecosistema argentino.

### 2.2.10 OdontoGRAMA

- **Observado**
  - Posicionamiento: “el consultorio en la nube”.
  - Declara:
    - agendas personalizables,
    - control de asistencia,
    - ficha de paciente con imágenes, tratamientos, diagnósticos y motivos de consulta,
    - caja,
    - cuentas corrientes,
    - facturación a prepagas / obras sociales,
    - gastos / egresos,
    - estadísticas.
  - Ofrece cuenta **gratis** y habla de planes y planes a medida, pero sin importe visible.
- **Posible / inferida**
  - Parece una solución más clásica, de baja fricción de entrada, para consultorio pequeño.
- **Lectura estratégica**
  - Útil como referencia de producto simple y tradicional con operatoria suficiente para pequeños usuarios.

### 2.2.11 Hessy

- **Observado**
  - Ofrece:
    - agenda fácil e intuitiva con varios doctores,
    - caja / ingresos y egresos,
    - presupuestos,
    - diagnóstico y evolución,
    - odontograma interactivo,
    - sitio web para la clínica,
    - plantillas / indicaciones postoperatorias personalizables,
    - diseño minimalista,
    - **odontograma 3D**,
    - soporte,
    - uso en la nube,
    - 7 días gratis.
  - Declara seguridad SSL y contacto/soporte por WhatsApp.
- **Posible / inferida**
  - Busca diferenciarse por experiencia visual y branding de consultorio, más que por complejidad institucional.
- **Lectura estratégica**
  - Muy interesante como señal de diferenciación por UX y comunicación clínica.

### 2.2.12 DENTIDESK *(referencia secundaria)*

- **Observado**
  - Cobertura funcional amplia:
    - agenda avanzada,
    - historial médico,
    - insumos y stock,
    - reportes,
    - facturación,
    - fichas especializadas,
    - integraciones,
    - multisucursal,
    - agendamiento online,
    - app mobile,
    - fichas avanzadas,
    - demo de 15 días.
- **Lectura estratégica**
  - Es un benchmark regional fuerte de madurez clínica + administrativa + mobile.

### 2.2.13 OdontoLog *(referencia secundaria)*

- **Observado**
  - Pricing simple y transparente:
    - Free,
    - Profesional USD 30 / mes,
    - Clínica USD 80 / mes.
  - Declara:
    - pacientes,
    - citas,
    - odontograma,
    - pagos,
    - planes de cuotas,
    - PDF,
    - reportes,
    - WhatsApp y email.
- **Lectura estratégica**
  - Benchmark útil de claridad comercial y empaquetado por nivel de complejidad.

### 2.2.14 Open Dental *(referencia secundaria)*

- **Observado**
  - Fuerte ecosistema de integraciones:
    - patient portal,
    - payment portal,
    - web forms,
    - web sched,
    - integrated texting,
    - automated messaging,
    - mobile apps,
    - cientos de bridges,
    - clearinghouses,
    - servicios adicionales.
- **Lectura estratégica**
  - No es benchmark de localización argentina, pero sí de **ecosistema**, extensibilidad e integraciones profundas.

---

# 3. Mapa general de módulos del mercado

| Módulo | Descripción | Objetivo de negocio | Cliente que más lo necesita | Presencia |
|---|---|---|---|---|
| Agenda y turnos | Gestión de citas, disponibilidad y asistencia | Ordenar ocupación, reducir ausentismo | Todos | Muy común |
| Pacientes | Ficha base con datos administrativos y de contacto | Centralizar información del paciente | Todos | Muy común |
| Historia clínica odontológica | Registro clínico y evolutivo | Soporte clínico y trazabilidad | Todos | Muy común |
| Odontograma | Visualización y registro por piezas/caras | Diagnóstico y seguimiento | Todos | Muy común |
| Presupuestos / planes de tratamiento | Propuesta económica y seguimiento del caso | Conversión comercial + orden clínico | Todos | Común |
| Cobros / caja / cuentas corrientes | Gestión de pagos, deudas y egresos | Control financiero operativo | Todos | Común |
| Facturación electrónica | Emisión fiscal / integración local | Formalización y reducción de doble carga | Consultorio / clínica | Poco común |
| Obras sociales / prepagas | Convenios, nomencladores, facturación | Resolver complejidad argentina | Consultorio con OS, clínica, institución | Común |
| Auditoría / autorizaciones | Reglas, validaciones, rechazos | Reducir débitos y controlar operatoria | Instituciones / OS | Poco común |
| Comunicación y recordatorios | Email, WhatsApp, SMS, mensajes | Mejorar presentismo y comunicación | Todos | Común |
| Reserva online / autogestión | Link, QR, widget o portal de paciente | Bajar fricción en recepción | Consultorio / clínica en crecimiento | Poco común |
| Gestión de profesionales / roles | Usuarios, recepcionistas, permisos | Escalar operación con orden | Clínica / multiusuario | Común |
| Sucursales / multi-sede | Varias sedes en una sola plataforma | Escalabilidad | Clínica grande / cadena | Poco común |
| Reportes y métricas | Reportes administrativos, financieros o clínicos | Toma de decisiones | Todos | Común |
| Stock / insumos / proveedores | Inventario y compras | Evitar faltantes y ordenar costos | Clínica mediana / grande | Poco común |
| Laboratorios | Órdenes, trabajos y trazabilidad | Coordinar prótesis y terceros | Consultorio / clínica | Poco común |
| Documentos / consentimientos / PDFs | Presupuestos, recibos, formularios | Formalización y trazabilidad | Todos | Poco común |
| Integraciones | WhatsApp, fiscal, OS, APIs | Reducir trabajo externo | Todos | Poco común |
| IA y automatización avanzada | Copilotos, dictado, automatizaciones | Ahorro de tiempo administrativo | Consultorio / clínica | Diferencial |

---

# 4. Funcionalidades por módulo

## 4.1 Agenda y turnos

- **Agenda diaria / semanal / mensual** — **Muy común**  
  Valor: ordenar ocupación y rutina clínica.  
  Mercado: presente en casi todos los jugadores.

- **Configuración por profesional, duración y horario** — **Muy común**  
  Valor: adaptar la agenda a especialidades, tiempos y disponibilidad reales.  
  Mercado: estándar funcional básico.

- **Agenda gestionada por recepcionista** — **Común**  
  Valor: baja carga al odontólogo.  
  Mercado: visible en Odontal Web, OdonticLabs, DentalTec.

- **Recordatorios automáticos por email** — **Común**  
  Valor: reducir ausencias básicas.  
  Mercado: frecuente, especialmente en productos de entrada.

- **Recordatorios automáticos por WhatsApp** — **Común**  
  Valor: mayor tasa de lectura y respuesta.  
  Mercado: visible en Benty, Bilog, OdontLux, DentalTec, OdonticLabs, Hessy parcial.

- **Confirmación / cancelación del turno desde el mensaje** — **Poco común**  
  Valor: mejora previsión operativa de recepción.  
  Mercado: aparece con más claridad en DentalTec y OdonticLabs Pocket.

- **Reserva online por parte del paciente** — **Poco común**  
  Valor: reduce trabajo manual y permite captar fuera de horario.  
  Mercado: Bilog Turnos, OdonticLabs Pocket, referencias como DENTIDESK.

- **Lista de espera inteligente / reubicación automática** — **Oportunidad**  
  Valor: un hueco claro; no apareció con evidencia fuerte en la muestra local.

## 4.2 Pacientes

- **Ficha base de paciente** — **Muy común**  
  Incluye datos personales, contacto, obra social, antecedentes.

- **Historial de prestaciones, presupuestos y cobros sobre la ficha** — **Común**  
  Valor: ver la relación completa con el paciente en un solo lugar.

- **Múltiples coberturas / obras sociales por paciente** — **Común**  
  Más importante en Argentina que en otros mercados.

- **Imágenes y adjuntos** — **Común**  
  Valor: soporte clínico y documental.

- **Autoregistro del paciente** — **Poco común**  
  Visible con mayor claridad en OdonticLabs Pocket.

- **Portal paciente** — **Oportunidad**  
  Muy poca evidencia local fuerte de portales completos de paciente.

## 4.3 Historia clínica odontológica y odontograma

- **Historia clínica digital** — **Muy común**  
  Es núcleo de la categoría.

- **Odontograma interactivo** — **Muy común**  
  Aparece como estándar competitivo.

- **Odontograma vinculado a prestaciones / tratamientos** — **Común**  
  Valor: evita doble carga y mejora coherencia entre diagnóstico y tratamiento.

- **Adjuntos clínicos, radiografías y fotos** — **Común**

- **Fichas clínicas especializadas** — **Poco común**  
  Más visible en referencias regionales como DENTIDESK.

- **Patologías estructuradas / CIE-10** — **Poco común**  
  Visible con más claridad en DentalTec.

- **Dictado por voz** — **Diferencial / innovadora**  
  Visible en Bilog Lite.

- **Odontograma 3D** — **Diferencial / innovadora**  
  Visible en Hessy.

## 4.4 Presupuestos y planes de tratamiento

- **Presupuestos** — **Muy común**
- **Planes de tratamiento** — **Común**
- **Generación de presupuestos desde odontograma** — **Común**
- **Envío del presupuesto al paciente** — **Común**
- **Seguimiento de estado y deuda del tratamiento** — **Común**
- **Planes de cuotas** — **Poco común / diferencial**  
  Más claro en referencias secundarias como OdontoLog.
- **Pipeline completo del tratamiento** — **Oportunidad**  
  Casi ningún jugador local lo muestra de manera robusta como workflow comercial + clínico.

## 4.5 Cobros, caja, finanzas y facturación

- **Cuentas corrientes / deuda del paciente** — **Muy común**
- **Caja diaria / ingresos y egresos** — **Común**
- **Cobros por distintos medios de pago** — **Común**
- **Recibos / comprobantes** — **Común**
- **Facturación electrónica local (AFIP / ARCA)** — **Poco común**  
  Visible en Benty, SIGO y DentalTec.
- **Reportes financieros básicos** — **Común**
- **Rentabilidad por profesional / tratamiento** — **Poco común**
- **Conciliación bancaria / agregación bancaria** — **Oportunidad**  
  No apareció como fortaleza clara del núcleo local investigado.

## 4.6 Obras sociales, prepagas, nomencladores y auditoría

- **Facturación a obras sociales / prepagas** — **Común**
- **Nomencladores por plan / convenio** — **Común**
- **Actualización automática de aranceles** — **Poco común**  
  Visible en Odontal Web.
- **Liquidación a profesionales / prestadores** — **Común**
- **Validación en tiempo real contra obra social** — **Diferencial / innovadora**  
  Fortaleza central de DentalTec.
- **Auditoría odontológica con reglas de negocio** — **Diferencial**  
  Visible en DentalTec, OdontoCube y Bilog auditoría.
- **Autorizaciones asincrónicas** — **Diferencial**  
  Visible en OdontoCube.
- **Facturación jerárquica multi-entidad** — **Diferencial / nicho institucional**  
  Muy propia del ecosistema argentino, visible en DentalTec.

## 4.7 Comunicación y recordatorios

- **Mensajes básicos al paciente** — **Común**
- **Recordatorios automáticos** — **Muy común**
- **WhatsApp integrado** — **Común**
- **SMS** — **Poco común**
- **Confirmación de asistencia** — **Poco común**
- **Campañas y reactivación automatizada** — **Oportunidad**  
  Aparece muy poco como módulo maduro en la muestra local.
- **Sitio web de clínica integrado** — **Diferencial**  
  Visible en Hessy.

## 4.8 Reportes, dashboards y métricas

- **Reportes operativos básicos** — **Muy común**
- **Reportes financieros** — **Común**
- **Reportes de deuda / antigüedad** — **Común**
- **Dashboard visual en tiempo real** — **Poco común**
- **Métricas por profesional** — **Común**
- **Métricas por obra social / débitos / rechazos** — **Diferencial**
- **Métricas comerciales de conversión y reactivación** — **Oportunidad**

## 4.9 Multiusuario, roles, profesionales y sucursales

- **Múltiples profesionales** — **Común**
- **Usuarios administrativos / recepcionistas** — **Común**
- **Licenciamiento por usuario / profesional** — **Común**
- **Sucursales** — **Poco común**
- **Roles y permisos detallados** — **Poco común**
- **Auditoría de acciones / trazabilidad** — **Diferencial**

## 4.10 Laboratorios, proveedores, stock e insumos

- **Trabajos con laboratorio** — **Poco común**
- **Proveedores** — **Poco común**
- **Stock / insumos** — **Poco común**
- **Compra y uso de insumos** — **Poco común**
- **Alertas de reposición / automatización de stock** — **Oportunidad**

## 4.11 Documentos, formularios y PDFs

- **Presupuestos PDF** — **Común**
- **Recibos PDF / imprimibles** — **Común**
- **Formularios o fichas digitales específicas** — **Poco común**
- **Consentimientos digitales** — **Poco común / oportunidad**
- **Recetas / órdenes médicas** — **Poco común / posible**

## 4.12 Integraciones

- **WhatsApp** — **Común**
- **ARCA / AFIP / fiscal local** — **Poco común**
- **Servicios web con obras sociales** — **Diferencial**
- **App mobile nativa** — **Poco común** en el núcleo local; sí visible en referencias como DENTIDESK.
- **APIs / webhooks / ecosistema abierto** — **Muy poco común**
- **Integraciones con terceros clínicos / radiología / pago** — **Oportunidad**

## 4.13 IA y automatización avanzada

- **Asistente IA para turnos y pacientes** — **Diferencial / innovadora**  
  Bilog iAngela es la evidencia más clara.

- **Dictado por voz** — **Diferencial**

- **Automatización basada en reglas** — **Diferencial**  
  Fuerte en DentalTec y OdontoCube, aunque no siempre vendida como “IA”.

- **IA para recepción y atención comercial** — **Oportunidad**  
  Todavía con poca madurez visible en el mercado argentino investigado.

---

# 5. Segmentación por tipo de cliente

## 5.1 Odontólogo independiente

- **Necesidades principales**
  - agenda clara,
  - historia clínica,
  - odontograma,
  - presupuesto,
  - cobro,
  - simplicidad.
- **Módulos más importantes**
  - turnos,
  - pacientes,
  - HC,
  - odontograma,
  - caja,
  - cuentas corrientes.
- **Funcionalidades críticas**
  - recordatorios,
  - presupuesto rápido,
  - deuda visible,
  - acceso móvil.
- **Complejidad operativa**: baja a media.
- **Problemas más probables**
  - exceso de tareas administrativas propias,
  - seguimiento manual,
  - uso combinado de WhatsApp, agenda externa y Excel.
- **Sensibilidad al precio**: alta.
- **Valor de un esquema por usuarios**: medio; funciona mejor un plan individual simple con add-ons opcionales.

## 5.2 Consultorio pequeño

- **Necesidades principales**
  - compartir agenda,
  - ordenar recepción,
  - separar profesionales,
  - controlar cobros y deudas,
  - comenzar a medir productividad.
- **Módulos más importantes**
  - turnos,
  - pacientes,
  - HC,
  - caja,
  - roles básicos,
  - reportes.
- **Funcionalidades críticas**
  - agenda multi-profesional,
  - confirmación de turnos,
  - presupuestos,
  - liquidación simple,
  - deuda por paciente.
- **Complejidad operativa**: media.
- **Problemas más probables**
  - reprogramación manual,
  - poca visibilidad de cobranza,
  - seguimiento flojo de tratamientos.
- **Sensibilidad al precio**: media-alta.
- **Valor de planes por usuarios**: alto.

## 5.3 Clínica odontológica

- **Necesidades principales**
  - varios profesionales,
  - control administrativo,
  - métricas,
  - liquidaciones,
  - permisos,
  - mejor integración entre recepción, clínica y dirección.
- **Módulos más importantes**
  - todos los core,
  - reportes,
  - roles,
  - finanzas,
  - obras sociales si aplica,
  - laboratorio/stock según operatoria.
- **Funcionalidades críticas**
  - productividad por profesional,
  - dashboard gerencial,
  - WhatsApp automatizado,
  - control de deuda,
  - trazabilidad.
- **Complejidad operativa**: media-alta.
- **Problemas más probables**
  - falta de visibilidad del negocio,
  - doble carga,
  - permisos insuficientes,
  - procesos fuera del sistema.
- **Sensibilidad al precio**: media.
- **Valor de planes por usuarios**: muy alto.

## 5.4 Estructura con varios usuarios, roles o sucursales

- **Necesidades principales**
  - control central,
  - permisos finos,
  - métricas consolidadas,
  - auditoría,
  - escalabilidad,
  - estandarización.
- **Módulos más importantes**
  - roles,
  - sucursales,
  - dashboards,
  - auditoría,
  - liquidaciones,
  - integraciones,
  - obras sociales si aplica.
- **Funcionalidades críticas**
  - tablero consolidado,
  - comparativa por sede,
  - trazabilidad de acciones,
  - workflow administrativo,
  - control de accesos.
- **Complejidad operativa**: alta.
- **Problemas más probables**
  - software de consultorio que se queda corto,
  - poca estandarización entre sedes,
  - baja calidad analítica,
  - dependencia de herramientas externas.
- **Sensibilidad al precio**: media a baja si el valor es claro.
- **Valor de planes por usuarios / sedes**: muy alto.

---

# 6. Patrones de pricing y monetización observables

## 6.1 Qué se observa con claridad

### Pricing público claro

- **Bilog**
  - Freemium USD 0 / usuario / mes
  - Lite USD 25 / usuario / mes
  - Premium USD 40 / usuario / mes
  - IA aparte

- **SIGO**
  - 1 profesional ARS 25.000 / mes
  - ARS 250.000 / año
  - clínicas según cantidad de profesionales

- **Dentapp**
  - ARS 550 a 8.000 / mes según sucursal/personal
  - *posible / probable desactualización del pricing visible*

- **OdontoLog** *(referencia secundaria)*
  - Free
  - Profesional USD 30 / mes
  - Clínica USD 80 / mes

### Pricing no público o parcialmente visible

- Benty
- OdontLux
- Odontal Web
- OdonticLabs
- DentalTec
- OdontoCube
- OdontoGRAMA
- Hessy
- DENTIDESK

## 6.2 Patrones comunes de monetización

### 1. Baja transparencia de precios

La mayoría del mercado argentino vende por:

- demo,
- formulario,
- WhatsApp,
- o contacto comercial.

Esto sugiere un mercado todavía poco comoditizado y muy apoyado en venta consultiva.

### 2. Cobro por profesional / usuario

Es el patrón más visible cuando hay pricing:

- Bilog,
- SIGO,
- OdonticLabs Pocket.

### 3. Cobro por sucursal o por escala operativa

Se observa en:

- Dentapp,
- Bilog Premium,
- referencias como OdontoLog.

### 4. Trials y freemium sí son aceptados

Se observan:

- 7 días,
- 15 días,
- 30 días,
- freemium,
- free forever en referencia secundaria.

Esto indica que el mercado sí tolera onboarding de prueba, aunque no siempre lo acompaña con pricing transparente.

### 5. Add-ons o módulos premium

Ejemplos visibles:

- Bilog iAngela,
- DentalTec packs de WhatsApp,
- Bilog servicios adicionales,
- modelos custom en institucionales.

## 6.3 Lectura de ticket por segmento

- **Ticket bajo / entrada**
  - Dentapp,
  - SIGO,
  - OdontoGRAMA,
  - Bilog Freemium.

- **Ticket medio**
  - Bilog Lite / Premium,
  - Benty probable,
  - Odontal Web probable,
  - OdontLux probable.

- **Ticket medio-alto / consultivo**
  - DentalTec,
  - OdontoCube,
  - DENTIDESK,
  - productos con auditoría, multi-entidad o institucional.

---

# 7. Problemas frecuentes del mercado y necesidades mal resueltas

## 7.1 Tareas que siguen siendo manuales

- reprogramación de agenda,
- seguimiento de presupuestos,
- recuperación de pacientes que no volvieron,
- limpieza operativa de turnos no confirmados,
- coordinación entre recepcionista y profesional,
- control de deuda con seguimiento comercial.

## 7.2 Fricciones para recepcionistas

- Saltar entre software, WhatsApp, llamadas y agenda mental.
- Falta de una consola operativa unificada para:
  - pacientes por confirmar,
  - huecos libres,
  - cancelaciones,
  - deudas,
  - presupuestos pendientes.
- Toma de turnos y alta de pacientes todavía demasiado manual en muchos escenarios.

## 7.3 Fricciones para odontólogos

- La capa clínica y la capa económica no siempre están bien conectadas.
- Carga de información todavía relativamente pesada.
- Poca visibilidad unificada del avance real del tratamiento.
- Menor evidencia de funciones que prioricen pacientes por riesgo de abandono o retraso.

## 7.4 Fricciones para dueños / administración

- Reportes sí, pero BI real no siempre.
- Dificultad para medir:
  - rentabilidad por tratamiento,
  - productividad por profesional,
  - tasa de aceptación de presupuestos,
  - recuperación de pacientes,
  - valor por canal o por sede.
- Muchas clínicas parecen depender de Excel u otras herramientas para análisis serio.

## 7.5 Problemas de comunicación con pacientes

- Mucho recordatorio, poco journey completo.
- Falta de automatizaciones contextuales como:
  - “presupuesto pendiente”,
  - “te toca control”,
  - “hace 6 meses no venís”,
  - “tenés saldo pendiente”,
  - “se liberó un turno antes”.

## 7.6 Seguimiento de tratamientos mal resuelto

El mercado suele resolver partes del problema:

- odontograma,
- evolución,
- presupuesto,
- deuda.

Pero no suele mostrar con fuerza un **flujo transversal de tratamiento** que conecte:

- diagnóstico,
- presupuesto,
- aceptación,
- ejecución,
- cobro,
- abandono,
- reactivación.

## 7.7 Integraciones ausentes o débiles

- APIs y webhooks casi ausentes.
- Integraciones de pago poco visibles.
- Integración fiscal local no homogénea.
- Poca evidencia de integración madura con herramientas externas de operación clínica o comercial.

## 7.8 Limitaciones para crecer

Muchos productos parecen funcionar bien en:

- profesional individual,
- consultorio chico,
- clínica simple.

Pero generan dudas al crecer en:

- roles y permisos finos,
- sucursales,
- auditoría,
- gobierno de datos,
- dashboards consolidados,
- estandarización operativa.

---

# 8. Oportunidades de mejora y ventaja competitiva

| Oportunidad | Problema que resuelve | Por qué parece real | Cliente que más la valoraría | Tipo | Complejidad | Impacto |
|---|---|---|---|---|---|---|
| WhatsApp operativo 360° | Recepción fragmentada y seguimiento manual | El canal ya existe, pero se usa poco en profundidad | Todos | Integración / automatización | Media | Alto |
| Pipeline de tratamiento y cierre | Se pierde continuidad entre diagnóstico, presupuesto y ejecución | Vacío muy visible en la muestra local | Consultorio y clínica | Feature diferencial | Media | Alto |
| Motor de reactivación de pacientes | Pacientes inactivos se pierden sin seguimiento | Casi ausente públicamente | Todos | Automatización / ventaja comercial | Media | Alto |
| Recordatorios inteligentes y reprogramación asistida | La agenda sigue generando mucho trabajo manual | El mercado está en recordatorio, no en optimización | Consultorio y clínica | UX / automatización | Media | Alto |
| BI real de clínica | Reportes sin profundidad estratégica | Poca visibilidad real del negocio en la oferta local | Clínica / multi-sucursal | Ventaja operativa | Media | Alto |
| Integración nativa ARCA/AFIP + cobros | Doble carga administrativa y fiscal | Muy pocos lo muestran bien resuelto | Consultorio y clínica | Integración | Media | Alto |
| Roles, permisos y auditoría finos | El software se queda corto al crecer | Debilidad frecuente en mid-market | Clínica / multiusuario | Ventaja operativa | Media | Alto |
| Multi-sucursal con dashboard consolidado | La expansión rompe visibilidad | Muy poca evidencia madura local | Cadena / grupo | Módulo nuevo | Alta | Alto |
| Stock + insumos + laboratorio integrados | Se usan planillas o sistemas externos | Módulo poco resuelto en general | Clínica mediana / grande | Módulo nuevo | Media | Medio-alto |
| Portal paciente / autogestión real | Recepción absorbe demasiadas tareas | Solo aparece de forma parcial | Consultorio y clínica | UX / integración | Media | Medio-alto |
| Consentimientos y documentos digitales | Trazabilidad legal débil y papeles externos | Baja presencia visible | Clínica / multiusuario | Feature diferencial | Media | Medio |
| API abierta / webhooks / ecosistema | Software aislado sin integraciones | Vacío estratégico claro | Clínica madura / partners | Integración | Alta | Alto |
| IA para recepción y administración | Repetición de tareas y consultas | Muy temprano en el nicho | Todos | Automatización / diferencial | Media-alta | Alto |
| Pricing transparente + onboarding self-service | Fricción comercial innecesaria | La opacidad del mercado abre espacio | Independiente / consultorio | Ventaja comercial | Baja-media | Alto |
| Módulo de obras sociales escalable | No todos necesitan la misma complejidad | Permite vender simple y expandir a profundidad | Consultorio con OS / clínica / institución | Módulo / comercial | Alta | Alto |

---

# 9. Top de ideas más valiosas detectadas

1. **Agenda + confirmación + reprogramación por WhatsApp**  
   Básica para competir y diferencial si está realmente bien resuelta.

2. **Historia clínica + odontograma + presupuesto + deuda en un solo flujo**  
   Fundamental para unir clínica y negocio.

3. **Pipeline de tratamiento**  
   Diferencial clave para no perder tratamientos en el medio del proceso.

4. **BI real de clínica**  
   Diferencial estratégico para dueños y cadenas.

5. **Reactivación de pacientes inactivos**  
   Potencial comercial alto y poco resuelto.

6. **Facturación local integrada con cobros**  
   Muy valiosa en Argentina por reducción de doble carga.

7. **Roles, permisos y trazabilidad serios**  
   Crítico para escalar de consultorio a clínica.

8. **Módulo de obras sociales escalable**  
   Muy importante para adaptarse a la complejidad local sin sobrecargar al usuario simple.

9. **Portal paciente y autogestión**  
   Reduce trabajo manual y mejora experiencia.

10. **Stock / insumos / laboratorio integrado**  
   Un gran hueco en muchos competidores.

11. **Pricing transparente por complejidad**  
   Puede ser una ventaja comercial fuerte frente a un mercado opaco.

12. **Onboarding self-service real**  
   Permite bajar fricción, acelerar adopción y escalar captación.

13. **IA copiloto para recepción**  
   Potencial alto en operación diaria.

14. **Documentos y consentimientos digitales**  
   Aporta trazabilidad y menos dependencia de procesos externos.

15. **Ecosistema abierto de integraciones**  
   Ventaja estratégica de largo plazo frente a jugadores más cerrados.

---

# 10. Conclusión final

## 10.1 Qué debería tener sí o sí un sistema odontológico integral competitivo en Argentina

Como base mínima:

- agenda,
- pacientes,
- historia clínica,
- odontograma,
- presupuestos,
- cobros / caja,
- recordatorios,
- reportes básicos,
- soporte multiusuario básico.

Como capa competitiva real para Argentina:

- obras sociales / prepagas,
- facturación local,
- roles y permisos,
- dashboards gerenciales,
- WhatsApp integrado de verdad,
- seguimiento de tratamientos,
- escalabilidad por sucursales,
- trazabilidad y auditoría.

## 10.2 Dónde hay más saturación

La saturación está sobre todo en el core clásico:

- agenda,
- ficha del paciente,
- historia clínica,
- odontograma,
- presupuesto,
- cobro básico.

Es decir: hay muchos competidores resolviendo “la base”.

## 10.3 Dónde hay más margen para diferenciarse

El mayor margen está en:

- automatización real de recepción,
- WhatsApp bidireccional y operacional,
- seguimiento y cierre de tratamientos,
- reactivación,
- métricas y BI,
- multiusuario / sucursales / auditoría,
- integraciones,
- stock y laboratorios,
- IA aplicada a trabajo administrativo,
- pricing claro y onboarding autónomo.

## 10.4 Aprendizaje principal para diseño de producto

El mercado argentino sí tiene oferta, pero no muestra de forma consistente una solución que combine con profundidad:

- operación clínica,
- administración,
- fiscalidad local,
- comunicación,
- crecimiento comercial,
- y escalabilidad organizacional.

El espacio más interesante no parece estar en “hacer otro software con agenda y odontograma”, sino en construir una solución que:

- sea simple para el odontólogo independiente,
- útil para el consultorio pequeño,
- sólida para la clínica,
- y escalable para estructuras con varios usuarios o sucursales,

sin obligar al cliente a vivir saltando entre múltiples herramientas externas.

---

## Anexo A. Fuentes consultadas

### Sitios oficiales principales

- https://benty.com.ar/
- https://www.bilog.com.ar/
- https://www.bilog.com.ar/payments
- https://ai.bilog.com.ar/
- https://odontlux.com/
- https://odontalweb.com.ar/
- https://sigo.com.ar/
- https://dentapp.com.ar/
- https://odonticlabs.com/Planes.aspx
- https://odonticlabs.com/Pocket.aspx
- https://odonticlabs.com/PreguntasFrecuentes.aspx
- https://web.dentaltec.com.ar/
- https://web.dentaltec.com.ar/funcionalidades
- https://web.dentaltec.com.ar/casos-de-exito
- https://web.dentaltec.com.ar/preguntas-frecuentes
- https://www.odontocube.com/
- https://www.odontocube.com/acceso-a-prestadores/
- https://odontograma.com.ar/
- https://www.hessydental.com/

### Referencias secundarias útiles

- https://www.dentidesk.com/
- https://www.odontolog.lat/
- https://www.opendental.com/

### Comparativas y fuentes secundarias de mercado

- https://www.comparasoftware.com.ar/odontologia
- https://www.akeito.com/blog/softwares-clinicas-dentales-argentina/

---

## Anexo B. Sistemas detectados pero con evidencia insuficiente

Durante la investigación aparecieron menciones adicionales a soluciones como **F&G Dental / fgkpsoft** y **Odontosys**, pero no fue posible validar suficiente información pública actual y confiable como para integrarlos en el análisis comparativo principal.

Por rigor metodológico, se los deja fuera del cuerpo central del informe.
