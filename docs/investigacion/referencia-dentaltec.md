# DentalTec — Mapa Completo de Funcionalidades

> **Fecha**: 2026-04-01
> **URL**: https://web.dentaltec.com.ar/
> **Empresa desarrolladora**: Tándem Digital (https://tandemdigital.net) — San Juan, Argentina
> **Contacto**: soporte.dentaltec@tandemdigital.net
> **Propósito**: Referencia para integración de funcionalidades en nuestro sistema odontológico

---

## 1. Resumen del Sistema

### Qué es
DentalTec es una plataforma 100% web de gestión odontológica diseñada **específicamente para el mercado argentino**. No es un software genérico adaptado a odontología — fue construido desde cero para manejar la complejidad del sistema de salud argentino: múltiples obras sociales, nomencladores con reglas distintas, y estructuras jerárquicas de círculos, federaciones y confederaciones.

### Para quién
- **Odontólogos individuales** — carga de prácticas, historia clínica, agenda
- **Consultorios y clínicas** — gestión multi-odontólogo con secretaria
- **Círculos odontológicos** — supervisión, facturación, liquidaciones
- **Federaciones** — consolidación multinivel
- **Confederaciones (CORA)** — control total, facturación multinivel
- **Obras sociales** — validación y auditoría

### Posicionamiento
- "La red que transforma la gestión odontológica"
- "Conecta, Agiliza y Transforma tu Gestión"
- Plataforma líder con más de 2.000 profesionales activos
- Calificación 5/5 (30 reseñas)
- Enfocado 100% en Argentina (sin versión internacional)

### Claims principales (métricas públicas)

| Métrica | Resultado |
|---------|-----------|
| Reducción de débitos | 64% |
| Reducción tiempo de gestión | 75% |
| Reducción tiempo administrativo | 80% |
| Trazabilidad de operaciones | 100% |
| Reducción ausentismo (WhatsApp) | 40% |
| Tasa de entrega WhatsApp | 98% |
| Profesionales activos | 2.000+ |
| Instituciones | 30+ |
| Obras sociales integradas | 15+ |
| Calificación usuarios | 5/5 |

### Características técnicas declaradas
- 100% web — sin instalación, funciona desde cualquier navegador
- Actualizaciones automáticas
- Soporte real 24/7
- Seguridad nivel empresarial (JWT + bcrypt + Helmet + CORS)
- 10 tipos de roles diferentes
- Auditoría completa del 100% de las operaciones

---

## 2. Módulos y Funcionalidades Detalladas

### 2.1 Validación de Prácticas en Tiempo Real

**"La joya de la corona"** — es la funcionalidad diferencial principal.

- **Validación automática e instantánea** contra la obra social antes de cargar cualquier práctica
- **Verificación del estado del afiliado** en tiempo real — sin llamadas manuales, sin esperas
- **Control inteligente de nomenclador** — topes, frecuencias y autorizaciones
- **Detección de errores antes de que se conviertan en débitos** con códigos claros
- **Soporte para prácticas vinculadas** y dependencias entre tratamientos
- **Validador automático** en consultorio — el odontólogo ve el error al cargar, no después de facturar
- **Flujo preventivo**: verifica → detecta error → informa con código claro → permite corregir antes de confirmar

**Resultado comprobado**: 64% de reducción en débitos medido en producción real.

### 2.2 Integración con Obras Sociales

Conexión directa mediante **servicios web SOAP** integrados.

**Obras sociales integradas (17 confirmadas):**

| # | Obra Social | Tipo |
|---|------------|------|
| 1 | Jerárquicos | Nacional |
| 2 | OSDE | Nacional |
| 3 | Swiss Medical | Nacional |
| 4 | Sancor | Nacional |
| 5 | OSSEG | Nacional |
| 6 | IOSEP | Provincial (Entre Ríos) |
| 7 | Hamburgo | Nacional |
| 8 | OSM Santiago del Estero | Provincial |
| 9 | Policía Federal | Nacional |
| 10 | NOBIS | Nacional |
| 11 | OSMATA / Sanitas | Nacional |
| 12 | Prevención Salud | Nacional |
| 13 | COLMED | Nacional |
| 14 | Federada Salud | Nacional |
| 15 | Staff / Brindar | Nacional |
| 16 | Traditum | Nacional |
| 17 | OSP San Juan | Provincial |

- **Sistema de adaptadores SOAP** para integrar nuevas obras sociales rápidamente
- Validación directa sin llamadas manuales ni esperas
- Verificación de legibilidad de afiliados
- Verificación de prácticas en tiempo real

### 2.3 Facturación Automática Integral

Automatización completa del proceso de facturación odontológica.

- **Generación automática de planillas** con integración directa a ARCA (ex AFIP)
- **Importación directa desde el módulo Consultorio**: sin doble carga, sin errores de transcripción
- **Cierre de facturación multinivel**: Círculo → Federación → Confederación
- **Re-facturación inteligente**: corregir y reenviar prácticas rechazadas sin empezar de cero
- **Auditoría de facturación antes del envío**: revisá todo antes de mandarlo
- **Integración ARCA (ex AFIP)** para facturación electrónica

**Resultado comprobado**: 80% de reducción en tiempo administrativo.

### 2.4 Gestión de Pacientes y Odontograma Digital

Historia clínica digital completa con odontograma interactivo.

- **Odontograma interactivo** con seguimiento de tratamientos
- **Múltiples obras sociales por paciente** sin límites, con búsqueda rápida e inteligente
- **Integración con patologías CIE-10** y soporte completo para todas las caras dentales
- **Imágenes y documentación adjunta** en el historial del paciente
- **Historia clínica digital** con registro temporal de cada intervención
- Accesible desde cualquier dispositivo

**Resultado comprobado**: 100% de la información del paciente centralizada y accesible.

### 2.5 Agenda Inteligente + Recordatorios WhatsApp

Agenda configurable con recordatorios automáticos por WhatsApp.

- **Turnos configurables** por odontólogo, día, horario e intervalos personalizables
- **Recordatorios automáticos por WhatsApp** vinculados a la agenda
- **Confirmación de asistencia desde WhatsApp**: el paciente responde y listo
- **98% de tasa de entrega** de mensajes
- **Flujo de confirmación**: Sistema envía recordatorio → Paciente responde "Confirmo mi turno!" → Sistema confirma y da hora de llegada
- **Vinculación directa agenda-WhatsApp**: sin configuraciones extra, sin plataformas adicionales

**Resultado comprobado**: 40% de reducción en ausentismo.

### 2.6 Liquidación a Prestadores

Automatización del proceso de liquidación a odontólogos.

- **Liquidaciones automáticas** basadas en planillas facturadas
- **Detalle por prestador** con descuentos automáticos configurables
- **Cuenta corriente del prestador** con historial completo
- **Generación de PDFs profesionales** para cada liquidación
- **Envío de liquidación por email** directamente desde el sistema

**Resultado comprobado**: 75% de reducción en tiempo de gestión.

### 2.7 Reportes, Estadísticas y Control Total

Dashboard visual con visibilidad completa.

- **Dashboard visual con gráficos interactivos**
- **Rendimiento por odontólogo** con métricas detalladas
- **Análisis por obra social** y control de cupo
- **Estadísticas por período**: prácticas, facturación, débitos, tendencias, rechazos
- **Exportación a PDF y Excel** de todos los reportes
- Datos en tiempo real

### 2.8 Gestión Jerárquica Multi-Entidad

Diseñado para la estructura institucional odontológica argentina.

- **Flujo de facturación jerárquico**: Círculo → Federación → CORA
- **Configuración independiente** por entidad
- **Comisiones configurables** por nivel jerárquico
- **Branding personalizable** para cada institución
- **Nomenclador inteligente** con vigencias versionadas y reglas por práctica

### 2.9 Seguridad de Nivel Empresarial

- **10 tipos de roles diferentes**: cada usuario ve solo lo que necesita
- **Autenticación JWT** + contraseñas encriptadas con bcrypt
- **Auditoría completa**: quién hizo qué, cuándo y dónde
- **Trazabilidad total** del 100% de las operaciones
- **Protección Helmet + CORS** + middleware de autorización
- Respaldo automático de datos

### 2.10 Módulo Consultorio (para Odontólogos)

Interfaz dedicada para el profesional en el consultorio.

- Carga de prácticas y validación instantánea
- Historia clínica digital y odontograma actualizado
- Agenda odontológica integrada
- Acceso inmediato a estadísticas y liquidaciones
- Automatización que elimina retrabajos y errores

---

## 3. Integraciones y Conectores

### Obras Sociales (17 confirmadas — SOAP)
Ver sección 2.2 para lista completa. Todas mediante servicios web SOAP con sistema de adaptadores.

### ARCA / AFIP
- Integración directa para facturación electrónica
- Generación automática de planillas para ARCA

### WhatsApp Business API
- Recordatorios automáticos de turnos
- Confirmación de asistencia bidireccional
- Tasa de entrega del 98%

### Nomencladores
- Integración de nomencladores por obra social
- Vigencias versionadas
- Reglas por práctica

### CIE-10
- Integración con patologías CIE-10 en historia clínica y odontograma

---

## 4. Casos de Éxito y Clientes

### Instituciones confirmadas (6)

| Institución | Sigla | Tipo | Testimonio |
|------------|-------|------|------------|
| Confederación Odontológica de la República Argentina | CORA | Confederación | Gabriel Saracco — "Sistema de facturación digital fácil de usar, predictivo, y con el mejor soporte técnico" |
| Círculo Odontológico de San Juan | COSJ | Círculo | Fernando Cano — "Muy predictivo, sencillo, agenda con recordatorios automáticos indispensable, auditoría excelente" |
| Círculo Odontológico de Mendoza | COM | Círculo | — |
| Círculo Odontológico de Entre Ríos | COE | Círculo | — |
| Círculo Odontológico de Santiago del Estero | COSTG | Círculo | Emanuel Santillán Doval — "Registro confiable y seguro de prestaciones, elimina débitos por errores" |
| Círculo Odontológico del Este | COE | Círculo | — |

### Resultados destacados por caso

**COSJ**: Enfocado en agenda + WhatsApp → 40% reducción ausentismo, 98% tasa entrega

**COSTG**: Enfocado en validación preventiva → 64% reducción débitos, 100% trazabilidad

**CORA**: Enfocado en facturación multinivel → 80% reducción tiempo admin, 75% reducción tiempo gestión

### Testimonios clave

1. **Fernando Cano (COSJ)**: "El sistema es muy predictivo, sencillo, la funcionalidad de la agenda con recordatorios automáticos para pacientes es una herramienta indispensable. La auditoría que realiza es excelente y muy buena la disposición de datos necesarios para la práctica diaria."

2. **Emanuel Santillán Doval (COSTG)**: "Con Tándem estamos reemplazando nuestro sistema anterior en el marco de un proceso sólido con un gran soporte. Nuestros profesionales pueden registrar de manera confiable y segura las prestaciones, lo que les brinda seguridad y tranquilidad de cobro preciso eliminando débitos por errores."

3. **Gabriel Saracco (CORA)**: "Un sistema de facturación digital de consultorio, fácil de usar, predictivo, y con el mejor soporte técnico al cliente que conozco."

---

## 5. Modelo Comercial y Pricing

### Forma de contratación
- **No publican precios** del software base en la web
- Modelo **SaaS** — se accede vía web, sin instalación
- Contratación por solicitud de demo (formulario de contacto)
- "Costo por odontólogo que se justifica desde el primer mes"

### Packs de WhatsApp (publicados)

| Plan | Mensajes | Precio (USD) | Precio por mensaje |
|------|----------|-------------|-------------------|
| Básico | 50 | $9 | $0.18 |
| Intermedio | 150 | $25 | $0.167 |
| Pro | 300 | $48 | $0.16 |

### Lo que se puede inferir
- El software principal tiene costo no publicado (presumiblemente por odontólogo/institución)
- Los packs de WhatsApp son un **addon/costo adicional**
- El argumento de venta principal es ROI: "el ahorro por débitos evitados supera la inversión"
- Orientado a contratos institucionales (círculos, federaciones) más que a individuales

---

## 6. Fortalezas Diferenciales

### Qué lo hace único vs competidores

1. **Validación preventiva en tiempo real** — EL diferencial principal. Ningún otro sistema argentino lo ofrece. Los demás solo generan archivos post-auditoría.

2. **Adaptadores SOAP para obras sociales** — Arquitectura que permite integrar nuevas OS rápidamente, no hardcodeado.

3. **Gestión jerárquica multi-entidad** — Único sistema que maneja el flujo Círculo → Federación → CORA.

4. **Facturación multinivel** — Cada nivel procesa y transmite automáticamente.

5. **Nomenclador inteligente versionado** — Vigencias y reglas por práctica, no un nomenclador estático.

6. **Enfoque 100% argentino** — No es una plataforma LATAM genérica adaptada. Entiende la complejidad específica del sistema de salud argentino.

7. **Resultados medidos en producción** — No son promesas: 64% menos débitos, 80% menos tiempo admin, etc.

8. **Red de instituciones** — La confianza de CORA y los principales círculos genera efecto red.

### Debilidades observadas (para nuestra estrategia)

1. **Sin versión internacional** — Solo Argentina
2. **Sin odontograma 3D** — Competidores lo ofrecen
3. **Precios no transparentes** — Genera fricción en la decisión de compra
4. **UI no showcaseada** — No hay screenshots ni demos del sistema en la web
5. **Sin app móvil nativa** — Solo web responsive

---

## 7. Funcionalidades por Módulo — Checklist de Integración

> **Estado**: `[ ]` No implementada | `[x]` Implementada | `[~]` Parcialmente implementada
>
> **Estado actual de nuestro sistema**: Backend con auth/tenancy/permissions/session-policy/audit. Frontend con auth pages, middleware, sidebar, header, dashboard, 5 admin pages, base UI components con design system tokens. Módulos de pacientes y profesionales existen en backend (controller/service/module scaffold) pero son mínimos. **NO tenemos**: agenda, historia clínica, odontograma, facturación, integración OS, WhatsApp, liquidaciones, reportes avanzados.

---

### 7.1 Agenda y Turnos

- [ ] Agenda visual con vista diaria/semanal/mensual
- [ ] Turnos configurables por odontólogo
- [ ] Configuración de días, horarios e intervalos personalizables
- [ ] Gestión de turnos por profesional
- [ ] Multi-odontólogo con secretaria compartiendo agenda
- [ ] Recordatorios automáticos por WhatsApp vinculados a agenda
- [ ] Confirmación de asistencia desde WhatsApp (bidireccional)
- [ ] Gestión de ausentismo y cancelaciones
- [ ] Control de cupo por obra social
- [ ] Asignación de consultorio/sala

### 7.2 Pacientes

- [~] Módulo de pacientes (backend scaffold existe — controller/service/module)
- [ ] Ficha de paciente completa (datos personales, contacto, documentos)
- [ ] Múltiples obras sociales por paciente sin límites
- [ ] Búsqueda rápida e inteligente de pacientes
- [ ] Historial de turnos por paciente
- [ ] Imágenes y documentación adjunta en historial
- [ ] Notas y observaciones del paciente
- [ ] Integración con historia clínica

### 7.3 Historia Clínica y Odontograma

- [ ] Historia clínica digital completa
- [ ] Registro temporal de cada intervención
- [ ] Odontograma interactivo (2D visual)
- [ ] Seguimiento de tratamientos en el odontograma
- [ ] Soporte completo para todas las caras dentales
- [ ] Integración con patologías CIE-10
- [ ] Marcado de tratamientos realizados y pendientes
- [ ] Evolución del estado dental por pieza
- [ ] Presupuestos de tratamiento
- [ ] Exportación/imágenes del odontograma

### 7.4 Obras Sociales y Validación

- [ ] Integración con servicios web SOAP de obras sociales
- [ ] Validación automática de estado del afiliado en tiempo real
- [ ] Control inteligente de nomenclador (topes, frecuencias, autorizaciones)
- [ ] Detección de errores antes de carga (códigos claros)
- [ ] Validación de prácticas vinculadas y dependencias entre tratamientos
- [ ] Nomenclador inteligente con vigencias versionadas
- [ ] Reglas por práctica y por obra social
- [ ] Búsqueda de afiliado por DNI/nro. de afiliado
- [ ] Verificación de legibilidad
- [ ] Sistema de adaptadores para agregar nuevas OS rápidamente
- [ ] Integración OSDE
- [ ] Integración Swiss Medical
- [ ] Integración Jerárquicos
- [ ] Integración Sancor
- [ ] Integración OSSEG
- [ ] Integración IOSEP
- [ ] Integración Hamburgo
- [ ] Integración Policía Federal
- [ ] Integración NOBIS
- [ ] Integración OSMATA/Sanitas
- [ ] Integración Prevención Salud
- [ ] Integración COLMED
- [ ] Integración Federada Salud
- [ ] Integración Staff/Brindar
- [ ] Integración Traditum
- [ ] Integración OSP San Juan
- [ ] Integración OSM Santiago del Estero

### 7.5 Facturación

- [ ] Generación automática de planillas de facturación
- [ ] Importación directa desde módulo consultorio (sin doble carga)
- [ ] Integración con ARCA (ex AFIP) para facturación electrónica
- [ ] Cierre de facturación multinivel (Círculo → Federación → Confederación)
- [ ] Re-facturación inteligente (corregir y reenviar rechazadas)
- [ ] Auditoría de facturación antes del envío
- [ ] Control de cupos facturados
- [ ] Gestión de rechazos y devoluciones

### 7.6 Comunicación (WhatsApp)

- [ ] Integración con WhatsApp Business API
- [ ] Recordatorios automáticos de turnos
- [ ] Confirmación de asistencia bidireccional
- [ ] Flujo de recordatorio → confirmación → respuesta automática
- [ ] Vinculación directa agenda-WhatsApp (sin config extra)
- [ ] Packs de mensajería (50/150/300 mensajes)
- [ ] Tracking de entregas y lecturas
- [ ] Recordatorio con datos del turno (fecha, hora, profesional, tratamiento)
- [ ] Mensaje de confirmación con instrucciones (llegar 10 min antes)

### 7.7 Reportes y Dashboard

- [~] Dashboard base (tenemos uno en el frontend)
- [ ] Dashboard visual con gráficos interactivos
- [ ] Rendimiento por odontólogo con métricas detalladas
- [ ] Análisis por obra social
- [ ] Control de cupo por OS
- [ ] Estadísticas por período: prácticas, facturación, débitos, tendencias, rechazos
- [ ] Exportación a PDF
- [ ] Exportación a Excel
- [ ] Reportes de ausentismo
- [ ] Reportes de liquidaciones

### 7.8 Multi-Entidad / Roles / Auditoría

- [x] Autenticación JWT (implementada)
- [x] Contraseñas encriptadas con bcrypt (implementada)
- [x] Middleware de autorización (implementado)
- [x] Protección Helmet + CORS (implementada)
- [x] Auditoría básica (módulo audit existe en backend)
- [~] Roles y permisos (módulo permissions existe — 10 tipos de roles declarados por DentalTec, verificar nuestro nivel)
- [ ] 10 tipos de roles específicos del dominio odontológico
- [ ] Trazabilidad del 100% de las operaciones (quién hizo qué, cuándo, dónde)
- [ ] Gestión jerárquica multi-entidad (Círculo → Federación → CORA)
- [ ] Configuración independiente por entidad
- [ ] Comisiones configurables por nivel jerárquico
- [ ] Branding personalizable por institución
- [ ] Panel administrativo para control de prestadores
- [ ] Gestión centralizada de obras sociales y aranceles por entidad

### 7.9 Liquidaciones

- [ ] Liquidaciones automáticas basadas en planillas facturadas
- [ ] Detalle por prestador con descuentos automáticos configurables
- [ ] Cuenta corriente del prestador con historial completo
- [ ] Generación de PDFs profesionales para cada liquidación
- [ ] Envío de liquidación por email desde el sistema
- [ ] Descuentos configurables (comisiones de círculo, retenciones, etc.)
- [ ] Resumen de cobros y pagos por período

### 7.10 Profesionales / Prestadores

- [~] Módulo de profesionales (backend scaffold existe — controller/service/module)
- [ ] Ficha completa del profesional (matrícula, especialidad, contacto)
- [ ] Asociación a institución/círculo
- [ ] Historial de prácticas por profesional
- [ ] Estadísticas de rendimiento individual
- [ ] Configuración de aranceles por profesional
- [ ] Cuenta corriente del prestador

### 7.11 Otros Módulos y Funcionalidades

- [ ] Módulo Consultorio (interfaz dedicada para el profesional)
- [ ] Carga rápida de prácticas desde consultorio
- [ ] Prácticas vinculadas con dependencias
- [ ] Módulo de aranceles y nomencladores por OS
- [ ] Módulo de tutoriales/videos integrados
- [ ] Configuración de intervalos de agenda por profesional
- [ ] Soporte multi-dispositivo (responsive completo)
- [ ] Actualizaciones automáticas (SaaS)
- [ ] Respaldo automático de datos

---

## 8. Observaciones y Notas para Implementación

### Complejidad estimada por módulo

| Módulo | Complejidad | Tiempo estimado | Dependencias | Prioridad sugerida |
|--------|------------|-----------------|-------------|-------------------|
| **Pacientes** | Media | 2-3 semanas | Auth existente | P0 — Base para todo |
| **Agenda y Turnos** | Alta | 3-4 semanas | Pacientes, Profesionales | P0 — Core del consultorio |
| **Historia Clínica y Odontograma** | Muy Alta | 4-6 semanas | Pacientes | P0 — Requerimiento clínico |
| **Obras Sociales y Validación** | Extrema | 6-10 semanas | Pacientes, Aranceles | P1 — Diferencial principal |
| **Facturación** | Extrema | 6-8 semanas | Validación OS, ARCA | P1 — Requerimiento institucional |
| **WhatsApp** | Media-Alta | 2-3 semanas | Agenda | P1 — ROI rápido |
| **Reportes y Dashboard** | Media | 2-3 semanas | Todos los módulos de datos | P1 |
| **Liquidaciones** | Alta | 3-4 semanas | Facturación | P2 — Requerimiento institucional |
| **Multi-Entidad Jerárquica** | Alta | 3-5 semanas | Facturación, Roles | P2 — Diferencial institucional |
| **Roles avanzados (10 tipos)** | Media | 1-2 semanas | Auth existente | P0 — Ya tenemos base |

### Dependencias entre módulos

```
Auth/Tenancy/Roles (✅ existente)
    └── Pacientes (base)
         ├── Historia Clínica / Odontograma
         ├── Agenda / Turnos
         │    └── WhatsApp (recordatorios)
         ├── Validación OS (afiliado)
         │    └── Facturación
         │         ├── Liquidaciones
         │         └── Cierre multinivel
         └── Profesionales
              └── Liquidaciones (cuenta corriente)

Multi-Entidad (Círculo → Federación → CORA)
    └── Depende de: Facturación, Roles, Aranceles

Reportes / Dashboard
    └── Depende de: Todos los módulos de datos
```

### Sugerencias de prioridad (roadmap sugerido)

**Fase 1 — Core del Consultorio (P0)**
1. Pacientes (CRUD completo, múltiples OS, búsqueda)
2. Profesionales (CRUD completo)
3. Agenda y Turnos (visual, configurable)
4. Historia Clínica + Odontograma digital
5. Roles avanzados (10 tipos específicos del dominio)

**Fase 2 — Diferencial vs Competencia (P1)**
6. Aranceles y nomencladores por OS
7. Validación en tiempo real contra OS (empezar con 2-3 OS clave)
8. Facturación automática + ARCA
9. WhatsApp (recordatorios + confirmación)
10. Reportes y Dashboard avanzados

**Fase 3 — Institucional (P2)**
11. Liquidaciones a prestadores
12. Multi-entidad jerárquica
13. Cierre multinivel (Círculo → Federación → CORA)
14. Branding por institución

**Fase 4 — Escalamiento (P3)**
15. Expandir integraciones OS (agregar más)
16. Re-facturación inteligente
17. Auditoría avanzada
18. Exportaciones avanzadas

### Observaciones clave sobre la arquitectura de DentalTec

1. **El diferencial NO es el odontograma ni la agenda** — es la **validación preventiva en tiempo real contra obras sociales**. Eso es lo que justifica el costo y lo que ningún competidor ofrece.

2. **El stack de integración OS es SOAP** — las obras sociales argentinas usan servicios web SOAP. Necesitamos un adaptador SOAP robusto con sistema de plugins/adaptadores para agregar nuevas OS.

3. **La facturación multinivel es el otro diferencial** — para el segmento institucional (círculos, federaciones, CORA), el cierre jerárquico es indispensable.

4. **WhatsApp como canal de comunicación** — no es solo un "nice to have", es un diferencial medible (40% menos ausentismo, 98% tasa entrega). La API de WhatsApp Business es costosa pero el ROI es claro.

5. **Los 10 tipos de roles** sugieren una granularidad fina de permisos que va más allá de admin/user. Probablemente incluyen: administrador de institución, secretaria, odontólogo, auditor, contador, gerente de facturación, etc.

6. **Tándem Digital (empresa desarrolladora)** está en San Juan. Los casos de éxito más fuertes son de provincias (San Juan, Mendoza, Entre Ríos, Santiago del Estero). CORA es el ancla a nivel nacional.

---

## Apéndice A: URLs analizadas

| URL | Estado | Contenido |
|-----|--------|-----------|
| https://web.dentaltec.com.ar/ | ✅ 200 | Home, claims, clientes, WhatsApp, testimonios |
| https://web.dentaltec.com.ar/funcionalidades | ✅ 200 | **Detalle completo de todos los módulos** |
| https://web.dentaltec.com.ar/casos-de-exito | ✅ 200 | COSJ, COSTG, CORA con datos medidos |
| https://web.dentaltec.com.ar/preguntas-frecuentes | ✅ 200 | 14 FAQs con detalles técnicos |
| https://web.dentaltec.com.ar/precios | ❌ 404 | No existe página de precios |
| https://web.dentaltec.com.ar/contacto | ❌ 404 | Contacto es sección dentro de home (#contacto) |
| https://web.dentaltec.com.ar/nosotros | ❌ 404 | No existe página dedicada |
| https://web.dentaltec.com.ar/guia-software-odontologico | ✅ 200 | Base de conocimiento (varios artículos "Próximamente") |
| https://web.dentaltec.com.ar/mejor-software-odontologico-argentina | ✅ 200 | Comparativa Top 5 software odontológico |
| https://web.dentaltec.com.ar/software-odontologos-argentina | ✅ 200 | Guía completa del mercado argentino |

## Apéndice B: Competidores mencionados

DentalTec menciona 4 categorías de competidores:

1. **Software tradicional de escritorio** — Trayectoria en mercado argentino, sin validación en tiempo real, sin WhatsApp
2. **Otras plataformas cloud** — Enfoque LATAM, sin integración OS argentinas específica (probablemente referenciando a Clinicus, Dentists, etc.)
3. **Plataformas con odontograma 3D** — Odontograma 3D innovador, pero sin facturación OS ni gestión jerárquica
4. **Sistemas gratuitos/genéricos** — Sin costo pero con costos ocultos (débitos, errores, sin soporte)

## Apéndice C: Tutoriales de YouTube

DentalTec tiene una playlist de tutoriales:
- Carga de Prácticas: https://www.youtube.com/watch?v=PSChigEmZ8U
- Uso del Odontograma: https://www.youtube.com/watch?v=3Y22c_MeUrE
- Envío de Facturación: https://www.youtube.com/watch?v=B7haNnzsR_E
- Playlist completa: https://youtube.com/playlist?list=PL4MN1RxFkCQqzCEsz2TGIlTROOwmLFdBG
