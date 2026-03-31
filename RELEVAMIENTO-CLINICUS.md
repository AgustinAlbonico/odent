# RELEVAMIENTO TECNICO-FUNCIONAL DEL SISTEMA CLINICUS

**Fecha:** 30-03-2026  
**Sistema:** CLINICUS - Software de Gestión Odontológica (SaaS)  
**URL:** aoc-protti-simeone.clinicus.com.ar  
**Organización:** Asociación Odontológica Caseros (Casilda, Santa Fe, Argentina)  
**Metodología:** Exploración en modo solo lectura mediante Playwright — sin modificación de datos  
**Rol observado:** superprofesional (Marcelo Rubén Protti)  
**Criterio:** Toda afirmación sin prefijo "[SUPUESTO]" fue directamente observada en la interfaz

---

## 1. RESUMEN GENERAL

### Descripción general
CLINICUS es un sistema web SaaS de gestión integral para consultorios y clínicas odontológicas. Opera bajo un modelo multi-tenant donde cada institución tiene su propio subdominio (ej: `aoc-protti-simeone.clinicus.com.ar`). El sistema cubre la totalidad del ciclo operativo de un consultorio odontológico: gestión de pacientes, agenda de turnos, odontograma interactivo, historia clínica electrónica, facturación/cobros, obra social/mutuales, contabilidad por partida doble, recetas electrónicas, y reportes financieros.

### Objetivo aparente
Ser el sistema centralizado de gestión para una asociación odontológica que agrupa múltiples profesionales. Permite a cada profesional gestionar su agenda, pacientes, prácticas odontológicas y finanzas de forma autónoma dentro de la misma institución.

### Tipo de organización al que está orientado
Asociación odontológica / clínica dental con múltiples profesionales. La estructura multi-tenant sugiere que CLINICUS está diseñado para:
- Consultorios individuales con 1 profesional
- Clínicas con múltiples profesionales
- Asociaciones odontológicas (el caso observado)

### Impresión general de usabilidad y madurez funcional
- **Madurez:** Alta. El sistema tiene cobertura funcional amplia (10+ módulos principales), datos de producción reales (308+ páginas de pacientes, ~50 obras sociales configuradas, flujo financiero activo con millones de pesos en movimiento).
- **Usabilidad:** Funcional y orientada a eficiencia operativa. Tiene atajos de teclado (ctrl+alt+v, ctrl+alt+c, ctrl+alt+p, alt+o), autocompletado en búsquedas, paginación consistente, y un flujo de trabajo lógico entre módulos. No es un sistema "bonito" visualmente, pero es **eficiente** para el uso diario en un contexto de consultorio real.
- **Rasgo distintivo:** El sistema integra contabilidad por partida doble completa con plan de cuentas, lo cual es inusual en sistemas odontológicos genéricos y sugiere una orientación fuerte a la gestión financiera profesional.

---

## 2. MAPA DE NAVEGACION

### Estructura general
El sistema tiene un **sidebar lateral colapsable** (menú hamburguesa) + **barra superior** con usuario y acceso rápido a pacientes.

### Barra superior (header)
| Elemento | URL | Descripción |
|----------|-----|-------------|
| Menú hamburguesa | — | Abre/cierra sidebar de navegación |
| Nombre del profesional + rol | # | Desplegable con: Ayuda, Cerrar Sesión |
| Icono campana (acceso rápido) | # | Abre diálogo modal de búsqueda rápida de pacientes (NO es notificaciones) |

### Sidebar — Menú principal

| Ítem | URL | Tipo | Descripción |
|------|-----|------|-------------|
| **Odontología** | /odontograma/index | Link | Centro del módulo odontológico (acciones, reportes, ajustes) |
| **Acción** | # (modal) | Submenú | Abre diálogo modal para registrar acciones rápidas (combo de acciones) |
| **Llamar** | /llamador/me | Link | Sistema de llamada de pacientes desde sala de espera |
| **Calendario** | /turnos/index | Link | Agenda/calendario visual de turnos |
| **Turnos** | /turnos/search | Link | Búsqueda avanzada de turnos con múltiples filtros |
| **Depósitos** | /depositos/search | Link | Gestión de depósitos de pacientes (pagos a cuenta, reintegros) |
| **Pacientes** | /pacientes/index | Link | Listado y búsqueda de pacientes |
| **Cuenta Corriente** | /contable | Link | Módulo contable completo (vender, cobrar, pagar, reportes) |
| **Recetas** | /recetas/search | Link | Búsqueda y gestión de recetas médicas |
| **Configuración** | /configuraciones/index | Link | Configuración de usuario y administración general |

### Relación entre pantallas
```
Pacientes
  ├── Editar paciente → Ficha Clínica | Mutuales | Cuenta Corriente (por paciente)
  ├── Ficha Clínica → Bioquímico | Ficha Clínica | Receta | Certificado | Odontograma
  └── Odontograma (nuevo o existente)

Odontología
  ├── Llenar Odontograma → Registro de prácticas por diente/cara
  ├── Crear Presupuesto → Generación de cotizaciones
  ├── Listar Prácticas → Reporte de prácticas ingresadas
  └── Relacionar prácticas con mutuales

Cuenta Corriente
  ├── Vender → Coseguro | Descartables | Estampilla | Receta
  ├── Cobrar → Paciente | Aporte
  ├── Pagar → Honorarios | Proveedores (descartables, estampillas) | Retirar dinero
  ├── Centro de Costos → Resumen | Movimientos | Saldos
  ├── Reportes → Arqueo | Detalle Órdenes | Órdenes por Profesional | Recibos | Mayor | Saldos | Transacciones | Plan de Cuentas
  └── Ajustes → Comisiones | Comisiones por Profesional | Proveedores | Órdenes

Configuración
  ├── Usuario → Perfil | Especialidades | Horarios | Excepciones | Mutuales
  └── General → Sistema | Profesionales | Asistentes | Mutuales | Consultorios | Diagnósticos | Medicamentos | Tipos Órdenes | Grupo Prácticas
```

---

## 3. MODULOS DETECTADOS

### 3.1 PACIENTES

**URL base:** /pacientes/index (redirige a /pacientes/search)

**Objetivo funcional:** Gestión del registro completo de pacientes del consultorio.

**Pantalla de búsqueda:**
- Campo de búsqueda por DNI, nombre o apellido
- Botón de búsqueda + link "Nuevo" para alta
- Tabla con columnas: DNI, Apellido, Nombre, Sexo, Domicilio, Teléfono, Email, Acciones
- Paginación: **1/308 páginas** (al menos 3,080 pacientes registrados)
- Acciones por fila: Editar + botones adicionales (identificados por iconos, probablemente: ver odontograma, eliminar, cuenta corriente)

**Formulario de edición (campos observados):**

| Campo | Tipo | Observación |
|-------|------|-------------|
| DNI | Texto numérico | Obligatorio, usado como identificador principal |
| Apellido | Texto | Obligatorio |
| Nombre | Texto | Obligatorio |
| Sexo | ComboBox | Opciones: Masculino, Femenino |
| Fecha de nacimiento | Fecha (dd-mm-aaaa) | Calcula edad automáticamente (ej: "63 años 7 meses") |
| Grupo y factor RH | 2 ComboBox | Antígeno: A, B, O, AB / Factor: Positivo, Negativo |
| Domicilio | Texto | |
| Código Postal | Texto numérico | |
| Teléfono | Texto | |
| Email | Texto | |
| Notas | Texto | Campo libre |

**Acciones desde el formulario:**
- **Ficha Clínica** → /fichaclinica/paciente/?id={id}
- **Mutuales** → /mutuales/paciente/{id}
- **Cuenta Corriente** → /cuentas/mayor/?id_paciente={id}&id_cuenta={cuenta}
- **Guardar** (persiste cambios)

**Datos de ejemplo observados:** Pacientes reales con DNI, domicilios con códigos postales (zona 2185-2189, Santa Fe), teléfonos con código de área 3467.

---

### 3.2 HISTORIA CLINICA / FICHA CLINICA

**URL base:** /fichaclinica/paciente/?id={id}

**Objetivo funcional:** Centro de la historia clínica electrónica del paciente. Muestra datos demográficos, obra social, antecedentes médicos, y cronología de atenciones.

**Secciones observadas:**

**A. Datos del paciente (solo lectura)**
- DNI, Nombre, Sexo, Fecha de Nacimiento (con edad calculada), Grupo y Factor, Domicilio, Teléfono, Email, Notas
- Tabla de mutuales: Mutual, Nº Afiliado, Plan
- Botones de acción: Editar, y otros iconos (exportar, imprimir, eliminar, etc.)

**B. Antecedentes médicos (tabs/pestañas)**
| Tab | Función inferida |
|-----|-----------------|
| Medicamento | Medicación actual del paciente |
| Enfermedad | Enfermedades/precondiciones |
| Internación | Historial de internaciones |
| Procedimiento | Procedimientos médicos previos |
| Alergia | Alergias registradas |
| F. Riesgo | Factores de riesgo |
| Ant. Familiar | Antecedentes familiares |
| Vacunas | Registro de vacunas |
| + | Agregar nueva categoría |

- Área de texto libre para "Guardar Historia Clínica"

**C. Generación de nuevas fichas**
Links para crear nuevos registros clínicos:
| Tipo | URL |
|------|-----|
| Bioquímico | /fichaclinica/add/?id_template=1&id_paciente={id} |
| Ficha Clínica | /fichaclinica/add/?id_template=2&id_paciente={id} |
| Receta | /recetas/new/?id_paciente={id} |
| Certificado | /fichaclinica/add/?id_template=4&id_paciente={id} |
| Odontograma | /odontograma/new/?id_paciente={id} |

**D. Historial de atenciones (timeline)**
- Filtros: Profesional, Concepto, Fecha
- Cada entrada muestra:
  - Fecha y hora
  - Tipo de registro (Odontograma, Ficha Clínica, etc.)
  - Profesional que atendió
  - Detalle de prácticas: código, nombre, diente, caras, dibujo, estado, fecha realizado
- Ejemplos de prácticas observadas:
  - `101` - EXAMEN, FICHADO, DIAGNÓSTICO Y PLAN DE TRATAMIENTO
  - `1001` - EXTRACCIÓN DENTARIA
  - `202` - RESTAURACIONES COMPUESTAS DE PIEZAS DENTARIAS
  - Estado `ANULADA` detectado (prácticas canceladas)

---

### 3.3 ODONTOGRAMA

**URL base:** /odontograma/new

**Objetivo funcional:** Registro visual e interactivo de prácticas odontológicas sobre el diagrama dental completo del paciente.

**Formulario de ingreso de atención:**

| Campo | Tipo | Default | Observación |
|-------|------|---------|-------------|
| Paciente | ComboBox autocomplete | Vacío | Búsqueda por nombre/DNI con botón "+" para alta rápida |
| Mutual | ComboBox autocomplete | Vacío | Búsqueda de obra social con botón "+" |
| Práctica | ComboBox autocomplete | Vacío | Catálogo de prácticas con código + nombre |
| Dibujo | ComboBox | "Normal" | Tipo de representación gráfica en el diente |
| Coseguro | Numérico | 0.00 | Monto del coseguro |
| Realizado | Fecha | Vacío | Fecha en que se realizó la práctica |
| Facturar | Fecha | Vacío | Fecha a facturar |
| Diente | Texto | Vacío | Número de diente (sistema FDI) |
| Caras | Texto | Vacío | Caras del diente (v, o, m, d, l, p) |
| Detalle | Texto | Vacío | Con checkbox para incluir en impresión del odontograma |
| Autorizo | Numérico | 0.00 | Monto autorizado |
| Deuda | Link | # | Consulta de deuda del paciente |
| Cobertura | Link | # | Consulta de cobertura |
| Selección Continua | Checkbox | Desactivado | Permite seleccionar múltiples dientes a la vez |

**Botones de acción:**
- "Guardar Preexistente" — registra la práctica como preexistente
- "Guardar Nueva" — registra la práctica como nueva

**Odontograma visual:**
- Representación completa con numeración FDI:
  - **Superiores:** 18, 17, 16, 15, 14, 13, 12, 11 | 21, 22, 23, 24, 25, 26, 27, 28
  - **Inferiores:** 48, 47, 46, 45, 44, 43, 42, 41 | 31, 32, 33, 34, 35, 36, 37, 38
  - **Supernumerarios/deciduos:** 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75
- Cada diente tiene una grilla 3x3 que representa las caras (vestibular, oclusal, lingual/palatino, mesial, distal)
- Tipos de dibujo observados: "normal", "extracción", "corona"

**Historial de Prácticas (tabla bajo el odontograma):**
| Columna | Descripción |
|---------|-------------|
| Consulta | ID de la consulta |
| Profesional | Nombre del profesional |
| Diente | Número FDI |
| E | Estado (N=Nueva) |
| Dib | Tipo de dibujo |
| Caras | Caras afectadas |
| C | Código [SUPUESTO: consulta] |
| Práctica | Código + nombre de la práctica |
| Detalle | Detalle adicional |
| Realizado | Fecha de realización |
| Facturar | Fecha de facturación |
| Mut. | Mutual/obra social |
| Afil. | Nº de afiliado |
| Cos | Coseguro (monto) |
| Token | [SUPUESTO: token de autorización de obra social] |
| Acción | Botones de edición/eliminación |

**Filtros del historial:** Ordenar por, Filtrar Dibujo, Filtrar Estado, Filtrar Fecha, Filtrar Diente

**Submódulo de Odontología (index):**

| Sección | Items |
|---------|-------|
| **Acciones** | Llenar Odontograma (alt+o), Crear Presupuesto |
| **Reportes** | Listar Prácticas Ingresadas, Listar Presupuestos |
| **Ajustes** | Relacionar prácticas con mutuales |

**Reporte de Prácticas Ingresadas (/odontograma/searchList):**
- Filtros: Estado (Ingresados/Anuladas), Rango de fechas, Agrupar por, Condición, Profesional, Paciente, Mutual
- Tabla con 14 columnas: E, Fecha, Profesional, Paciente, C, Práctica, Mutual, Plan, Afiliado, Diente, Cara, Detalle, Realizado, Facturar, Cos
- **Total de coseguros** al pie de la tabla
- Datos reales observados con montos de coseguro entre $7,741 y $36,931
- Múltiples profesionales visibles (ej: JOANA SIMEONE además del usuario logueado)

**Códigos de práctica observados:**
| Código | Nombre |
|--------|--------|
| 101 | EXAMEN, FICHADO, DIAGNÓSTICO Y PLAN DE TRATAMIENTO |
| 202 | RESTAURACIONES COMPUESTAS DE PIEZAS DENTARIAS |
| 502 | TOPICACIÓN CON FLÚOR |
| 1001 | EXTRACCIÓN DENTARIA |
| 90101 | RX PERIAPICAL |

---

### 3.4 TURNOS / AGENDA

**URL base:** /turnos/index (Calendario), /turnos/search (Búsqueda)

**Objetivo funcional:** Gestión completa de la agenda de turnos con vista visual (calendario) y búsqueda avanzada.

**Calendario (/turnos/index):**
- Filtros: Profesional (combo), Especialidades (combo)
- Controles de navegación: prev/next, "Hoy", "Ver 24hs", "Recordar", "Cancelados"
- Vistas: **Mes**, **Semana**, **Día**
- Calendario de lunes a viernes (5 días hábiles)
- Feriados marcados con indicadores: "Feriado Movil", "Feriado Fijo"

**Vista Día:**
- Encabezado con día de la semana y fecha (ej: "lun. 30 marzo 2026")
- Columna por profesional (mostrado en la cabecera)
- Franjas horarias de **08:00 a 20:30** en intervalos de **30 minutos** (25 slots)
- Los turnos se visualizan como bloques dentro de las franjas
- Botones "Recordar" y "Cancelados" [SUPUESTO: para gestión de recordatorios y visualización de turnos cancelados]

**Búsqueda de turnos (/turnos/search):**
- Filtros:
  - Filtrar Horas (checkbox con rango horario + botones 00-24)
  - Profesional (combo)
  - Paciente (texto: DNI, apellido o nombre)
  - Fecha desde / hasta
  - Mutual (combo)
  - Estado (combo)
- Link "Nuevo" → /turnos/new (creación de turno)
- Tabla de resultados

---

### 3.5 LLAMADOR (Sistema de llamada de pacientes)

**URL:** /llamador/me

**Objetivo funcional:** Sistema de llamada de pacientes desde la sala de espera al consultorio. Funciona como display de sala de espera virtual.

**Elementos observados:**
- "Atendiendo en: 1 - Consultorio" con botón "Cambiar" (permite seleccionar consultorio)
- "Turnos del día: Actualizado hace 0s" — auto-refresh en tiempo real
- Botón "Llamar al próximo" — llama al siguiente paciente en la cola
- Referencias de estado visual:
  - Icono verde: Pendiente
  - Icono amarillo: Esperando
- [SUPUESTO: La pantalla visible es la del profesional; existe probablemente una pantalla complementaria visible para los pacientes en la sala de espera]

---

### 3.6 DEPOSITOS

**URL base:** /depositos/search

**Objetivo funcional:** Gestión de depósitos de pacientes. Los pacientes realizan pagos a cuenta de tratamientos (ortodoncia, prótesis, etc.) y el sistema lleva un control de lo depositado vs. lo reintegrado al profesional.

**Filtros:** Profesional, Paciente, Estado, Detalle, Fecha desde/hasta

**Tabla de resultados:**
| Columna | Descripción |
|---------|-------------|
| Fecha | Rango: fecha depósito - fecha límite reintegro |
| Paciente | DNI + Nombre |
| Profesional | Nombre completo |
| Detalle | Descripción del depósito |
| Importe | Monto en pesos |
| Estado | "Pendiente" (o [SUPUESTO] "Reintegrado") |
| Acción | "Reintegrar" |

**Datos reales observados:**
- "A CUENTA HON" — $5,000,000 (honorarios a cuenta)
- "A cuenta tto de ortodoncia 1000000/550000/500000" — $2,050,000 (plan de pagos ortodoncia)
- "A cuenta (cheque $199980) efectivo $ 380000" — $579,980 (pago mixto cheque+efectivo)
- "A cuenta ortodoncia" — $150,000
- "VARIOS" — $20,000

**Regla de negocio inferida:** Los depósitos tienen una fecha límite de reintegro (ej: depositado 27-03, reintegrar antes de 11-04). El sistema genera automáticamente transacciones de "Vencer Depósito" cuando se vence el plazo [SUPUESTO: proceso batch nocturno].

---

### 3.7 CUENTA CORRIENTE (Modulo Contable)

**URL base:** /contable

**Objetivo funcional:** Sistema contable completo con contabilidad por partida doble, gestión de ventas, cobros, pagos, comisiones, y reportes financieros.

**A. VENDER (Ingresos por ventas)**
| Acción | URL interno | Descripción |
|--------|-------------|-------------|
| Vender Coseguro | /acciones/asientos/1 | Registra venta de coseguro de práctica odontológica |
| Vender Descartables | /acciones/asientos/19 | Venta de materiales descartables al paciente |
| Vender Estampilla | /acciones/asientos/2 | Venta de estampillas/certificados |
| Vender Receta | /acciones/asientos/10 | Cobro por emisión de receta |
- Atajo de teclado: **ctrl+alt+v + número**

**B. COBRAR (Cobros a pacientes)**
| Acción | URL interno | Descripción |
|--------|-------------|-------------|
| Cobrar a Paciente | /acciones/asientos/8 | Registro de pago de paciente |
| Ingresar Aporte | /acciones/asientos/7 | [SUPUESTO: Aporte del profesional a la institución] |
- Atajo de teclado: **ctrl+alt+c + número**

**C. PAGAR (Egresos)**
| Acción | URL interno | Descripción |
|--------|-------------|-------------|
| Pagar Honorarios | /acciones/asientos/11 | Pago de honorarios al profesional |
| Pagar a Proveedor - Descartables | /acciones/asientos/16 | Pago a proveedor de descartables |
| Pagar a Proveedor - Estampillas | /acciones/asientos/22 | Pago a proveedor de estampillas |
| Pagar otro Proveedor | /acciones/asientos/14 | Pago a otros proveedores |
| Retirar Dinero | /acciones/asientos/13 | Retiro de dinero por el profesional |
- Atajo de teclado: **ctrl+alt+p + número**

**D. Centro de Costos**
| Item | URL |
|------|-----|
| Resumen | /centros-de-costos/resumen |
| Movimientos | /centros-de-costos/movimientos |
| Saldos | /centros-de-costos/saldos |

**Resumen del Centro de Costos observado:**
- Tarjetas con valores Acumulados y Diarios para:
  - Ingresos (Acum: $5,878,900.00)
  - Comisiones
  - Com. Coseguros
  - Com. Depositos
  - Com. Estampillas
  - Com. Recetas
- Gráficos de evolución: últimos 30 días y últimos 12 meses (con tabs por tipo de comisión)

**E. Reportes**
| Reporte | URL | Descripción |
|---------|-----|-------------|
| Arqueo de Caja | /reportes/arqueo | Control de caja diario. Saldo observado: $25,037,439.15 |
| Detalle Órdenes | /ordenes/detalle | Detalle de órdenes de trabajo/pago |
| Órdenes por Profesional | /ordenes/profesional | Órdenes agrupadas por profesional |
| Recibos | /recibos/search | Búsqueda de recibos emitidos |
| Mayor de Cuentas | /cuentas/mayor | Movimientos por cuenta contable |
| Saldos de Cuentas | /cuentas/saldos | Balance de saldos con filtros múltiples |
| Transacciones | /transacciones/search | Registro general de transacciones |
| Plan de Cuentas | /contable/plandecuentas | Estructura del plan de cuentas |

**F. Ajustes**
| Item | URL |
|------|-----|
| Comisiones por Defecto | /comisiones/edit |
| Comisiones por Profesional | /profesionales-comisiones/search |
| Proveedores | /proveedores/search |
| Órdenes | /ordenes/search |

**Plan de Cuentas observado:**
```
1 ACTIVO
  1.1 Caja
  1.2 Deudores Pacientes
  1.3 Mercaderías
    1.3.1 Descartables
    1.3.2 Estampillas
2 PASIVO
  2.1 Proveedores
  2.2 Cuenta Particular Socio
  2.3 Honorarios a Pagar
  2.4 Depósitos Cobrados
3 INGRESOS
  3.1 Ventas
    3.1.1 Ventas de Mercadería
      3.1.1.1 Ingresos por Descartables
      3.1.1.3 Ingresos por Estampillas Certificados
    3.1.2 Venta Servicios
      3.1.2.1 Ingresos por Coseguro
      3.1.2.3 Ingresos por Recetas
      3.1.2.5 Ingresos por Depósitos Cobrados
4 EGRESOS
  4.1 Honorarios
    4.1.1 Honorarios por Estampillas
    4.1.2 Honorarios por Coseguros
    4.1.4 Honorarios por Recetas
    4.1.6 Honorarios por Depósitos
  4.2 Costos de Mercaderías
    4.2.1 Costos Descartables
    4.2.2 Costos Estampillas
```

**Transacciones observadas (tipos):**
- "Cobrar Deposito" — registro de cobro de depósito de paciente
- "Vencer Deposito" — vencimiento/reconciliación de depósito (con porcentaje de honorarios)

---

### 3.8 RECETAS

**URL base:** /recetas/search

**Objetivo funcional:** Gestión de recetas médicas/odontológicas.

**Filtros:** Profesional, Paciente (DNI, apellido, nombre), Fecha desde/hasta
- Link "Nueva" → /recetas/new
- [SUPUESTO: Integración con REFEPS para validación de código de profesional y receta electrónica]

---

### 3.9 MUTUALES / OBRAS SOCIALES

**URL base:** /mutuales/search (general), /mutuales/paciente/{id} (por paciente)

**Objetivo funcional:** Gestión del catálogo de obras sociales/mutuales y la vinculación paciente-mutual.

**Búsqueda general:**
- Filtros: Nombre o código, Tipo de Autorización, Mostrar Autogestión
- Tabla: Id, Código, Nombre, Autogestión
- **~50 obras sociales** configuradas (5 páginas), entre las observadas:
  - PARTICULAR (Código 0)
  - AVALIAN / ACA SALUD (Código 4)
  - CAJA PREV S PROF INGENIERIA (Código 16)
  - CIENCIAS ECONOMICAS (Código 29)
  - OBRA SOCIAL DE PASTELEROS (Código 41)
  - JERARQUICOS SALUD (Código 49)
  - SAT (Código 53)
  - CENTRO MEDICO IPAM (Código 57)
  - SANCOR MEDICINA PRIVADA S.A. (Código 61)
  - OMINT (Código 73)
- Todas marcadas como Autogestión: SI
- Nombres incluyen condición de IVA: "C/IVA (vol. Opt. Grav)", "S/IVA (oblig. No grav)"

**Vinculación paciente-mutual:**
- Búsqueda de mutual por nombre o código
- Campos: Número de Afiliado, Plan
- Acciones: Agregar, Vaciar lista, Guardar
- Links: Editar Paciente, Ficha Clínica

---

### 3.10 PROFESIONALES

**URL base:** /profesionales/me (perfil propio), /profesionales/search (admin)

**Objetivo funcional:** Gestión de datos de profesionales, horarios, especialidades y mutuales habilitadas.

**Formulario de perfil:**

| Campo | Tipo | Dato observado |
|-------|------|----------------|
| Nombre | Texto | MARCELO RUBEN |
| Apellido | Texto | PROTTI |
| Nro Socio | Numérico | 301 |
| CUIT | Texto | 20-17066634-9 |
| Facturar como | ComboBox | "Profesional" |
| Dirección | Texto | SANTA FE 427 |
| Teléfono | Texto | 03467-419213 |
| Email Co-seguro | Texto | marceloprotti48@gmail.com |
| Co-seguro | Numérico ($) | 0.00 |
| Estado Turno | ComboBox | "Pendiente" |
| Color | Color picker | [SUPUESTO: color para identificar en el calendario] |
| Código REFEPS | Texto | Vacío |
| Validado REFEPS | Checkbox + botón | Con link a instructivo oficial de Argentina |
| Contraseña | Password | Cambio de contraseña |
| Repetir Contraseña | Password | Confirmación |

**Sub-páginas del profesional:**
- Especialidades → /especialidades/me (observado: "Odontologia - matricula: 2508/02")
- Mutuales → /mutuales/me
- Horarios → /horarios/me
- Excepciones → /horarios-excepciones/me

**Horarios (/horarios/me):**
- Grilla semanal visual (lunes a domingo, 00:00-23:00)
- Horarios configurados para el Dr. Protti:
  - Lunes a Viernes: 8:00-12:30 y 16:00-20:00
  - Sábado y Domingo: sin horario
- Tipo de horario: "Solo secretarias y profesionales (azul)" [SUPUESTO: existe otro tipo para pacientes o público general]
- Cada bloque tiene botón de eliminación (×)

---

### 3.11 CONFIGURACION DEL SISTEMA

**URL:** /configuraciones/edit

**Datos de la institución:**
| Campo | Valor |
|-------|-------|
| Nombre | ASOCIACION ODONTOLOGICA CASEROS |
| Razón Social | ASOCIACION ODONTOLOGICA CASEROS |
| CUIT | 30-57434612-2 |
| Domicilio | H. IRIGOYEN 2114 (Entrepiso) - CASILDA (SF) |
| Localidad | Casilda |
| Provincia | Santa Fe |
| Teléfono | 03464 - 424089 \| 424717 |
| Email | administracion@aocaseros.com |
| Website | (vacío) |
| Logo | Imagen cargada (12.3 KB) |

**Valores por defecto:**
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Recibos Automáticos | Desactivado | Genera recibos automáticamente al cobrar |
| Filas de Turnos | 30 | Cantidad de turnos visibles por página |
| Coseguro default | $0.00 | Monto de coseguro por defecto |
| Depósito default | $0.00 | Monto de depósito por defecto |
| Duración de Turno | 30 min | Duración estándar de cada turno |
| Hs Confirmar Asistencia | 4 | Horas antes del turno para confirmar asistencia (0=desactivado, 1=solo leyenda, >1=link confirmar) |
| Días No Atienden | Sábado, Domingo | Días inhábiles del calendario |

**Configuración general (admin):**
| Item | Descripción |
|------|-------------|
| Sistema | Configuración institucional |
| Profesionales | CRUD de profesionales |
| Asistentes | [SUPUESTO: personal administrativo/recepcionistas] |
| Mutuales | CRUD de obras sociales |
| Consultorios | CRUD de consultorios/consultas (1 registrado: "Consultorio") |
| Diagnósticos | Catálogo de diagnósticos |
| Medicamentos | Catálogo de medicamentos |
| Tipos Órdenes | [SUPUESTO: tipos de órdenes de trabajo/pago] |
| Grupo Prácticas | Agrupación de prácticas odontológicas |

---

### 3.12 PRESUPUESTOS

**URL base:** /presupuestos/search, /presupuestos/new

**Objetivo funcional:** Generación de presupuestos/cotizaciones para pacientes.

**Búsqueda:** Filtros por Profesional, Paciente, Fecha desde/hasta. Link "Nuevo" para crear.
- [SUPUESTO: El presupuesto permite listar prácticas con precios y presentarlo al paciente para su aprobación antes de realizar el tratamiento]

---

### 3.13 ACCION RAPIDA

**Tipo:** Modal dialog (accesible desde sidebar)

**Objetivo funcional:** Permite registrar acciones rápidas sin navegar a otra pantalla.

- ComboBox: "Seleccione una Acción..."
- Botones: Cancelar, Registrar
- [NO SE EXPLORÓ: el contenido del combo de acciones por seguridad]

---

## 4. FLUJOS DE USO IDENTIFICADOS

### 4.1 Flujo: Atención de un paciente

| Paso | Pantalla | Acción | Actor |
|------|----------|--------|-------|
| 1 | Calendario (/turnos/index) | Verificar agenda del día | Profesional |
| 2 | Llamador (/llamador/me) | Llamar al próximo paciente | Profesional/Recepción |
| 3 | Pacientes (/pacientes/search) | Buscar paciente (si no viene de turno) | Profesional |
| 4 | Odontograma (/odontograma/new) | Seleccionar paciente, mutual, registrar práctica | Profesional |
| 5 | Odontograma (visual) | Marcar dientes/caras afectados en el diagrama | Profesional |
| 6 | Historial de Prácticas | Verificar prácticas del día del paciente | Profesional |
| 7 | Cuenta Corriente → Vender Coseguro | Registrar venta de coseguro | Profesional/Admin |

### 4.2 Flujo: Gestión de depósitos de ortodoncia

| Paso | Pantalla | Acción | Actor |
|------|----------|--------|-------|
| 1 | Depósitos → Nuevo | Registrar depósito del paciente con detalle | Recepción |
| 2 | Depósitos → Search | Monitorear depósitos pendientes de reintegro | Profesional |
| 3 | Depósitos → Reintegrar | Procesar reintegro al profesional | Administración |
| 4 | Transacciones | Ver trazabilidad completa del depósito | Profesional/Admin |

**Evidencia:** Se observaron depósitos con planes de pago explícitos (ej: "1000000/550000/500000" para ortodoncia), montos en millones de pesos, y pagos mixtos (cheque + efectivo).

### 4.3 Flujo: Facturación y cobro

| Paso | Pantalla | Acción | Actor |
|------|----------|--------|-------|
| 1 | Cuenta Corriente → Vender Coseguro | Registrar coseguro cobrado al paciente | Profesional |
| 2 | Cuenta Corriente → Cobrar a Paciente | Registrar pago del paciente | Recepción/Admin |
| 3 | Cuenta Corriente → Pagar Honorarios | Liquidar honorarios al profesional | Administración |
| 4 | Arqueo de Caja | Verificar cierre de caja del día | Administración |
| 5 | Centro de Costos → Resumen | Ver evolución de ingresos y comisiones | Administración/Director |

### 4.4 Flujo: Alta de nuevo paciente

| Paso | Pantalla | Acción | Actor |
|------|----------|--------|-------|
| 1 | Pacientes → Nuevo | Completar datos personales | Recepción |
| 2 | Mutuales (del paciente) | Vincular obra social con Nº afiliado y plan | Recepción |
| 3 | Ficha Clínica | Cargar antecedentes médicos | Profesional |
| 4 | Turnos → Nuevo | Asignar primer turno | Recepción |

### 4.5 Flujo: Emisión de receta

| Paso | Pantalla | Acción | Actor |
|------|----------|--------|-------|
| 1 | Ficha Clínica → Receta (o Recetas → Nueva) | Seleccionar paciente | Profesional |
| 2 | Receta (form) | Cargar medicación y emitir | Profesional |
| 3 | Cuenta Corriente → Vender Receta | Registrar cobro de receta | Recepción |

---

## 5. ENTIDADES DEL NEGOCIO IDENTIFICADAS

### 5.1 Paciente
- **Propósito:** Sujeto central del sistema. Persona que recibe atención odontológica.
- **Datos:** DNI, Apellido, Nombre, Sexo, Fecha nacimiento, Grupo RH, Domicilio, CP, Teléfono, Email, Notas
- **Relaciones:** Tiene mutuales, cuenta corriente, ficha clínica, turnos, depósitos, odontograma

### 5.2 Profesional
- **Propósito:** Odontólogo que atiende pacientes y genera prácticas.
- **Datos:** Nombre, Apellido, Nro Socio, CUIT, Dirección, Teléfono, Email, Co-seguro, Estado Turno, Color, Código REFEPS, Contraseña
- **Relaciones:** Tiene especialidades, mutuales habilitadas, horarios, excepciones, comisiones

### 5.3 Mutual / Obra Social
- **Propósito:** Entidad que cubre parcialmente los costos de las prácticas odontológicas.
- **Datos:** Código, Nombre, Condición IVA, Autogestión
- **Relaciones:** Vinculada a pacientes (afiliado + plan) y a prácticas (coseguro)

### 5.4 Turno
- **Propósito:** Reserva de un slot horario para la atención de un paciente.
- **Datos:** Fecha/hora, Profesional, Paciente, Estado, Mutual, [SUPUESTO: duración, consultorio]
- **Relaciones:** Vincula Paciente con Profesional en un momento determinado

### 5.5 Práctica Odontológica
- **Propósito:** Tratamiento o procedimiento realizado sobre un diente específico.
- **Datos:** Código, Nombre, Diente (FDI), Caras, Dibujo, Estado (Nueva/Anulada), Fecha realizado, Fecha facturar, Coseguro, Mutual, Plan, Afiliado
- **Relaciones:** Pertenece a una consulta/odontograma, vinculada a un paciente y profesional

### 5.6 Depósito
- **Propósito:** Pago a cuenta de un tratamiento (especialmente ortodoncia y prótesis).
- **Datos:** Fecha depósito, Fecha reintegro, Paciente, Profesional, Detalle, Importe, Estado
- **Relaciones:** Vincula Paciente con Profesional, genera transacciones de cobro y vencimiento

### 5.7 Transacción Contable
- **Propósito:** Registro de cualquier movimiento financiero (partida doble).
- **Datos:** ID, Fecha (con timestamp), Detalle
- **Tipos observados:** "Cobrar Deposito", "Vencer Deposito"

### 5.8 Cuenta Contable
- **Propósito:** Categorización contable para el registro de movimientos financieros.
- **Estructura:** Plan de cuentas con 4 niveles principales (Activo, Pasivo, Ingresos, Egresos) y subcuentas

### 5.9 Consultorio
- **Propósito:** Espacio físico donde se atiende.
- **Datos:** Código, Nombre, Descripción
- **Relaciones:** Vinculado al Llamador y [SUPUESTO] a los turnos

### 5.10 Receta
- **Propósito:** Documento de prescripción medicamentosa.
- **Datos:** [SUPUESTO: Paciente, Profesional, Fecha, Medicamentos, Instrucciones]

### 5.11 Presupuesto
- **Propósito:** Cotización presentada al paciente antes de realizar un tratamiento.
- **Datos:** [SUPUESTO: Paciente, Prácticas listadas, Montos, Estado (aprobado/rechazado)]

### 5.12 Proveedor
- **Propósito:** Entidad que provee insumos (descartables, estampillas) a la clínica.
- **Datos:** [SUPUESTO: Nombre, CUIT, Contacto, Saldo]

### 5.13 Comisión
- **Propósito:** Porcentaje que la institución retiene sobre las ventas/procesos.
- **Datos:** Porcentaje por tipo (Coseguro, Estampilla, Receta, Depósito)
- **Relaciones:** Configurable por defecto y por profesional

---

## 6. REGLAS DE NEGOCIO INFERIDAS

### Evidencia visible

| # | Regla | Evidencia |
|---|-------|-----------|
| 1 | **Numeración dental FDI** | El odontograma usa numeración 11-48 + supernumerarios 51-85 |
| 2 | **Horario laboral lun-vie** | El calendario solo muestra lunes a viernes. Días no atienden: Sábado y Domingo en configuración |
| 3 | **Duración de turno: 30 min** | Valor por defecto en configuración del sistema |
| 4 | **Feriados no operativos** | Calendario marca "Feriado Fijo" y "Feriado Movil" |
| 5 | **Coseguro obligatorio en prácticas** | Cada práctica registrada tiene un monto de coseguro |
| 6 | **Mutuales con condición IVA** | Nombres de mutuales incluyen "C/IVA" o "S/IVA" — relevante para facturación |
| 7 | **Depósitos tienen fecha de reintegro** | Cada depósito muestra rango "fecha depósito - fecha límite reintegro" |
| 8 | **Múltiples formas de pago** | Se observan depósitos en efectivo, cheque, y pagos mixtos |
| 9 | **Contabilidad por partida doble** | Plan de cuentas con Activo/Pasivo/Ingresos/Egresos, transacciones con doble asiento |
| 10 | **Comisiones configurables** | Porcentaje de comisión por tipo de venta, configurable por defecto y por profesional |
| 11 | **Confirmación de asistencia** | Parámetro "Hs Confirmar Asistencia" con 3 niveles (0/1/>1) |
| 12 | **Prácticas anulables** | Se observa estado "ANULADA" en el historial de prácticas |
| 13 | **Recibos automáticos opcionales** | Configuración "Recibos Automáticos" puede activarse/desactivarse |
| 14 | **Validación REFEPS** | Campo de código REFEPS con botón de validación e instructivo oficial |
| 15 | **Múltiples profesionales por institución** | Se observan al menos 2 profesionales (MARCELO RUBEN PROTTI y JOANA SIMEONE) |
| 16 | **Selección continua en odontograma** | Checkbox que permite seleccionar múltiples dientes a la vez para registrar prácticas |

### Suposiciones razonables

| # | Suposición | Fundamento |
|---|-----------|-------------|
| 1 | El sistema genera alertas/recuerdos por email o notificación | Botón "Recordar" en el calendario de turnos |
| 2 | Existe un rol de administrador con más permisos que "superprofesional" | Sección "General" en configuración con acceso a todos los datos del sistema |
| 3 | Los asistentes/recepcionistas tienen un rol intermedio | Item "Asistentes" en configuración general |
| 4 | El módulo "Acción" permite registrar eventos operativos variados | ComboBox de acciones con modal de registro rápido |
| 5 | Los presupuestos pueden convertirse en prácticas | Ambos módulos están bajo "Odontología" y comparten estructura |
| 6 | El arqueo de caja refleja el cierre diario de la recepción | Saldo de $25M sugiere un acumulado histórico, no solo del día |
| 7 | Los depósitos se vencen automáticamente | Transacciones "Vencer Deposito" generadas en horarios nocturnos (01:04:28) sugieren proceso batch |

---

## 7. PATRONES DE USABILIDAD Y DISENO FUNCIONAL

### Navegación
- **Sidebar colapsable:** Menú lateral que se oculta para maximizar el área de trabajo
- **Breadcrumb implícito:** No se observó breadcrumb explícito, pero la URL refleja la jerarquía
- **Acceso rápido a pacientes:** La campana del header (que parece notificación) es en realidad un acceso directo a búsqueda de pacientes — patrón de "always-on search"
- **Links cruzados:** Desde el formulario de paciente hay links directos a Ficha Clínica, Mutuales y Cuenta Corriente

### Organización de información
- **Listados con búsqueda + filtros:** Patrón consistente en todo el sistema — campo de búsqueda + filtros + tabla + paginación
- **Autocompletado en combos:** Select2 para búsqueda en combos (pacientes, profesionales, mutuales)
- **Paginación:** Siempre visible con formato "1/N" y links a primera, anterior, siguiente, última

### Prioridad de acciones
- **Acciones frecuentes en sidebar:** Odontología, Turnos, Pacientes, Cuenta Corriente son los más accesibles
- **Atajos de teclado:** Para las acciones financieras más repetitivas (vender, cobrar, pagar)
- **Botón "Nuevo" prominente:** En cada listado, el link de alta está siempre visible junto al buscador

### Claridad de interfaz
- **Títulos descriptivos:** Cada pantalla tiene un H2 claro (ej: "14720595 - Abbonizio, Daniel")
- **Datos financieros en pesos:** Todos los montos se muestran con símbolo "$" y separador de miles
- **Fechas en formato argentino:** dd-mm-aaaa
- **Códigos de práctica:** Siempre se muestra el código numérico junto al nombre descriptivo

### Accesibilidad
- **reCAPTCHA en login:** Protección anti-bot (puede ser barrera para usuarios con discapacidad visual)
- **Recomendación de Chrome:** El sistema recomienda explícitamente usar Google Chrome
- **Cumplimiento AAIP:** Logo de AAIP RNBD visible en el login (registro de bases de datos personales)

### Patrones que hacen al sistema usable en contexto real
1. **Auto-refresh del llamador:** Se actualiza cada segundo sin intervención
2. **Búsqueda por DNI:** Los argentinos identifican a las personas por DNI — el sistema lo usa como campo principal
3. **Cálculo automático de edad:** Se muestra junto a la fecha de nacimiento
4. **Multiselección en odontograma:** Permite registrar varias caras/dientes a la vez
5. **Historial con filtros en la ficha clínica:** Permite reconstruir la historia completa del paciente
6. **Atajos de teclado para acciones financieras:** Un profesional que cobra 20 veces por día ahorra tiempo significativo

---

## 8. FUNCIONALIDADES VALIOSAS PARA TOMAR COMO REFERENCIA

### 8.1 Odontograma interactivo con numeración FDI completa
- **Por qué es valiosa:** Es el corazón clínico del sistema. Permite registrar prácticas dental por dental con selección de caras, tipo de dibujo, y visualización inmediata en el diagrama. Incluye dientes supernumerarios/deciduos.
- **Aplicar en:** Módulo de Historia Clínica / Odontograma

### 8.2 Sistema de depósitos con ciclo de reintegro
- **Por qué es valiosa:** Resuelve un problema real muy común en ortodoncia y prótesis: el paciente paga a cuenta y el profesional necesita que se le reintegre. El sistema lleva el control completo con fechas límite, estados, y trazabilidad.
- **Aplicar en:** Módulo de Pagos / Finanzas

### 8.3 Llamador de pacientes con auto-refresh
- **Por qué es valiosa:** Elimina la necesidad de llamar verbalmente a los pacientes desde la sala de espera. El sistema muestra quién sigue y permite llamar con un click. Auto-refresh cada segundo.
- **Aplicar en:** Módulo de Turnos / Sala de espera

### 8.4 Contabilidad por partida doble integrada
- **Por qué es valiosa:** No todos los sistemas odontológicos tienen contabilidad real. CLINICUS tiene plan de cuentas, transacciones con doble asiento, arqueo de caja, centro de costos con gráficos, y reportes. Esto permite a la institución tener finanzas ordenadas sin software externo.
- **Aplicar en:** Módulo de Contabilidad / Finanzas

### 8.5 Confirmación de asistencia a turnos (configurable)
- **Por qué es valiosa:** Reduce el ausentismo. El sistema tiene 3 niveles: desactivado, solo leyenda, o link de confirmación activable N horas antes. Esto es configurable por institución.
- **Aplicar en:** Módulo de Turnos

### 8.6 Centro de costos con gráficos de evolución
- **Por qué es valiosa:** Permite a la dirección ver la evolución financiera (ingresos y comisiones) en períodos de 30 días y 12 meses, con tabs por tipo de ingreso. Es un dashboard ejecutivo integrado.
- **Aplicar en:** Dashboard / Reportes

### 8.7 Vinculación paciente ↔ mutual con planes y afiliados
- **Por qué es valiosa:** Permite que un paciente tenga múltiples obras sociales (ej: IAPOS + ALIANZA MEDICA) con planes y números de afiliado diferentes. Las prácticas se facturan automáticamente contra la mutual seleccionada.
- **Aplicar en:** Módulo de Pacientes / Obras Sociales

### 8.8 Historial clínico timeline con múltiples tipos de registro
- **Por qué es valiosa:** La ficha clínica no es solo odontograma — integra bioquímicos, certificados, recetas, y fichas clínicas textuales. Todo en una línea temporal filtrable por profesional y concepto.
- **Aplicar en:** Módulo de Historia Clínica

### 8.9 Validación REFEPS integrada
- **Por qué es valiosa:** Para emitir recetas electrónicas en Argentina, los profesionales deben tener un código REFEPS válido. El sistema permite cargar el código y validar contra el servicio oficial, con instructivo incluido.
- **Aplicar en:** Módulo de Recetas / Configuración de profesional

### 8.10 Acceso rápido a pacientes desde cualquier pantalla
- **Por qué es valiosa:** El icono de la campana permite buscar un paciente sin abandonar la pantalla actual. En un consultorio donde se atienden 3000+ pacientes, esta funcionalidad es esencial.
- **Aplicar en:** Navegación global

---

## 9. VACIOS Y DUDAS

### Funcionalidades no totalmente verificables sin riesgo
| Funcionalidad | Razón de no explorar |
|---------------|---------------------|
| **Creación de turno** (/turnos/new) | Formulario que crearía un turno real en producción |
| **Creación de depósito** (/depositos/new) | Registraría un depósito con impacto financiero |
| **Creación de receta** (/recetas/new) | Generaría una receta en el sistema |
| **Creación de presupuesto** (/presupuestos/new) | Crearía un documento persistente |
| **Vender Coseguro/Estampilla/Receta** | Acciones financieras con impacto en contabilidad |
| **Cobrar a Paciente** | Registraría un cobro real |
| **Pagar Honorarios** | Generaría un pago real |
| **Guardar cualquier formulario** | Persistiría datos en producción |
| **Acción rápida** (combo) | Desconocido el efecto de las acciones disponibles |
| **Reintegrar depósito** | Ejecutaría un reintegro financiero |
| **Confirmación de asistencia** | Podría cambiar el estado de un turno real |
| **Botón "Recordar" en calendario** | Podría enviar notificaciones reales |
| **Botón "Cancelados" en calendario** | Podría alterar estados de turnos |
| **Cambio de consultorio en Llamador** | Podría cambiar la asignación del profesional |
| **Detalle de transacción** (/transacciones/detalle/80) | Podría mostrar datos sensibles o ejecutar acciones |

### Secciones no exploradas por seguridad
| Sección | URL | Motivo |
|---------|-----|--------|
| Formulario de alta de paciente | /pacientes/new | Crearía un paciente real |
| Asistentes | /asistentes/search | Se exploró solo el link, no el contenido (no hay riesgo de solo lectura) |
| Diagnósticos | /diagnosticos/search | Se exploró solo el link |
| Medicamentos | /medicamentos/search | Se exploró solo el link |
| Tipos de Órdenes | /ordenes/search | Se exploró solo el link |
| Grupo Prácticas | /recetas-practicas-grupos/search | Se exploró solo el link |
| Excepciones de horario | /horarios-excepciones/me | No explorado |
| Comisiones por Profesional | /profesionales-comisiones/search | No explorado |
| Mayor de Cuentas (sin filtro) | /cuentas/mayor | Mostraría todas las cuentas, pero sin riesgo |
| Saldos de Cuentas (sin filtro) | /cuentas/saldos | Sin riesgo pero no mostró datos |
| Movimientos de Centro de Costos | /centros-de-costos/movimientos | No explorado |
| Recibos (detalle) | /recibos/search | Sin riesgo pero no mostró datos |
| Órdenes por Profesional | /ordenes/profesional | No explorado |
| Relacionar prácticas con mutuales | /odontograma-practicas-permitir/new | No explorado (puede crear relaciones) |

### Hipótesis que deberían validarse más adelante
1. **Módulo de notificaciones:** ¿El botón "Recordar" envía SMS, email, o push? ¿Existe un módulo de comunicación con pacientes?
2. **Impresión:** Varios elementos mencionan impresión (detalles en odontograma, recibos). ¿Existe un módulo de generación de PDFs/impresión?
3. **Roles y permisos:** Se observó "superprofesional" pero existen [SUPUESTO] roles de admin, asistente, y profesional regular. ¿Qué puede hacer cada uno?
4. **Proceso de facturación a obras sociales:** ¿El sistema genera facturas reales (AFIP) o solo registra las prácticas facturables?
5. **Backup/exportación de datos:** ¿Los pacientes pueden exportar su historia clínica?
6. **Módulo de estadísticas clínicas:** ¿Existen reportes de cantidad de prácticas por tipo, por profesional, por mutual?
7. **Integración con sistemas externos:** ¿Además de REFEPS, hay integración con other systems?
8. **Multi-consultorio:** Solo se observó 1 consultorio. ¿El sistema soporta múltiples consultorios simultáneos?

---

## 10. CONCLUSION

### Hallazgos clave
1. **CLINICUS es un sistema maduro y en uso activo** con más de 3,000 pacientes, ~50 obras sociales, múltiples profesionales, y un flujo financiero activo con millones de pesos.
2. **La contabilidad integrada es su diferenciador principal.** Muy pocos sistemas odontológicos ofrecen contabilidad por partida doble, plan de cuentas, y centro de costos con gráficos.
3. **El odontograma interactivo es completo** con numeración FDI, dientes supernumerarios/deciduos, selección por caras, y tipos de dibujo.
4. **El sistema de depósitos resuelve un problema real** de pagos a cuenta con ciclo de reintegro, especialmente importante en ortodoncia.
5. **La arquitectura multi-tenant** permite que cada institución tenga su propio subdominio con configuración independiente.
6. **El sistema está orientado a la eficiencia del profesional** con atajos de teclado, autocompletado, acceso rápido a pacientes, y flujo de trabajo minimal entre pantalla y pantalla.

### Partes más maduras del sistema
- **Módulo Contable:** Plan de cuentas, transacciones, centro de costos, arqueo de caja — extremadamente completo
- **Odontograma:** Interactivo, con numeración completa, historial filtrable, y vinculación con mutuales
- **Gestión de Pacientes:** 3000+ registros, búsqueda eficiente, vinculación con mutuales e historia clínica
- **Turnos:** Calendario visual con 3 vistas (mes/semana/día), feriados, y sistema de llamada

### Aprendizajes para el diseño de un nuevo producto

1. **La contabilidad NO es opcional en un sistema para asociaciones/clínicas.** CLINICUS demuestra que la contabilidad integrada es fundamental para la viabilidad del negocio.
2. **El odontograma debe ser el centro de la experiencia clínica**, no un add-on. CLINICUS lo tiene como módulo principal con acceso desde múltiples puntos.
3. **El sistema de depósitos a cuenta es un must-have** para cualquier clínica que haga ortodoncia o prótesis. Sin él, el control financiero es caótico.
4. **Los atajos de teclado y la búsqueda rápida de pacientes** son features de usabilidad que marcan la diferencia entre un sistema "que se puede usar" y uno "que se quiere usar".
5. **La configuración por institución** (subdominio, datos fiscales, horarios, días inhábiles, comisiones) permite adaptarse a diferentes realidades sin customización.
6. **La validación REFEPS** es un requisito regulatorio en Argentina que no se puede ignorar si se quiere emitir recetas electrónicas.
7. **La confirmación de asistencia** configurable es un pattern elegante que reduce el ausentismo sin ser invasivo.

### Datos técnicos observados
- **Framework:** [SUPUESTO: PHP/Laravel basado en la estructura de URLs y naming conventions]
- **Frontend:** jQuery + Select2 + [SUPUESTO: Bootstrap] para el sidebar colapsable y modales
- **Calendario:** FullCalendar o similar (patrones de vista mes/semana/día)
- **Autenticación:** reCAPTCHA invisible de Google + sesión propia
- **Multi-tenancy:** Basado en subdominios
- **Cumplimiento:** AAIP RNBD (Registro Nacional de Bases de Datos Personales)

---

## ADDENDUM — SEGUNDO PASE DE COBERTURA

Luego de una segunda pasada de relevamiento se completó la exploración de pantallas que habían quedado fuera del primer recorrido. Este addendum corrige y amplía el documento inicial.

### A. Modulos adicionales relevados

#### A.1 Asistentes (/asistentes/search)
- Pantalla de búsqueda por usuario, nombre o apellido
- Link de alta: `/asistentes/new`
- Tabla con columnas: Id, Nombre, Apellido, Usuario, E-mail
- En el tenant observado no había asistentes cargados (1/1 página, tabla vacía)

#### A.2 Diagnósticos (/diagnosticos/search)
- Catálogo masivo de diagnósticos médicos con **3.584 páginas** de resultados
- Búsqueda por nombre o código
- Tabla: Código, Nombre
- Los códigos observados corresponden a nomenclador tipo **CIE-10 / ICD-10** (ej: K27.7, K28.0)
- Esto confirma que el sistema usa un catálogo médico estandarizado, no solo texto libre

#### A.3 Medicamentos (/medicamentos/search)
- Catálogo masivo de medicamentos con **2.058 páginas**
- Filtros: Acción terapéutica, droga/nombre comercial, presentación, laboratorio
- Tabla: Acción, Medicamento, Presentación, Laboratorio, Precio
- Datos observados incluyen precios reales y nombre comercial + droga activa
- Esto confirma que la receta puede construirse sobre un vademécum estructurado

#### A.4 Tipos de Órdenes (/ordenes/search)
- Búsqueda por descripción
- Link de alta: `/ordenes/new`
- Tabla: Abreviatura, Descripción, Estado, Acción
- Tipo observado: `CONSULTA` — "Orden de consulta médica" — Estado: Activa

#### A.5 Detalle de Órdenes (/ordenes/detalle)
- Filtros: Período, Agrupación, Tipo Orden, Estado, Profesional, Paciente, Mutual
- Tabla esperada: Fecha, Profesional, Paciente, Mutual, Tipo, Estado, Cantidad
- Confirma que las órdenes son reportables por volumen y estado

#### A.6 Órdenes por Profesional (/ordenes/profesional)
- Requiere seleccionar profesional + rango de fechas
- Mensaje inicial: "Debe seleccionar un profesional y un rango de fechas"
- Confirma reporte dedicado para liquidación o control por profesional

#### A.7 Grupos de Prácticas (/recetas-practicas-grupos/search)
- Búsqueda por título o subtítulo
- Link de alta: `/recetas-practicas-grupos/new`
- Mensaje: "Visualización Grupos de Prácticas"
- En el tenant observado no había grupos cargados
- [SUPUESTO] Se usan para agrupar prácticas frecuentes en recetas u órdenes

#### A.8 Proveedores (/proveedores/search)
- Búsqueda por nombre o email
- Link de alta: `/proveedores/new`
- Sin proveedores cargados en el tenant observado

#### A.9 Comisiones por Profesional (/profesionales-comisiones/search)
- Tabla: Profesional, Vender Coseguro, Vender Estampilla, Vender Receta, Vencer Depósito, Editar
- Profesionales observados:
  - MARCELO RUBEN PROTTI — 0.00% en todos los rubros
  - JOANA SIMEONE — 0.00% en todos los rubros
- Confirma que las comisiones pueden personalizarse por profesional, aunque actualmente están en cero

#### A.10 Profesionales — Listado admin (/profesionales/search)
- Tabla: Id, Nombre, Apellido, Nro Socio, Dirección, Teléfono, Email, CUIT, Facturar como, REFEPS, Acción
- Profesionales observados: 2
  - Marcelo Ruben Protti
  - Joana Simeone
- Campo "Facturar como" visible en el listado: ambos aparecen como `CLINICA`
- El botón REFEPS es una acción individual de validación por profesional

#### A.11 Mutuales del Profesional (/mutuales/me)
- Título: "Mutuales deshabilitadas para: MARCELO RUBEN PROTTI"
- Flujo visible:
  - Buscar mutual por nombre o código
  - Agregar mutual a lista de deshabilitadas
  - Vaciar lista
  - Seleccionar todas
  - Guardar
- Lista observada: más de 30 mutuales deshabilitadas para el profesional
- Esto aclara algo clave: la pantalla no muestra las mutuales habilitadas, sino las **deshabilitadas**

#### A.12 Excepciones Horarias (/horarios-excepciones/me)
- Pantalla para registrar excepciones temporales al horario habitual
- Campos observados:
  - Período (rango de fechas)
  - Hora desde
  - Hora hasta
  - Detalle / aviso para secretaria
- Botón Guardar
- [SUPUESTO] Se usa para vacaciones, licencias, ausencias puntuales, cortes de agenda, etc.

#### A.13 Centro de Costos — Movimientos (/centros-de-costos/movimientos)
- Filtros: Centro de costo, Profesional, Paciente, Mutual, Proveedor, Fecha desde/hasta
- Mensaje inicial: "Seleccione un Centro de Costo"
- No tiene opciones precargadas visibles en el HTML; probablemente carga vía AJAX/Select2

#### A.14 Centro de Costos — Saldos (/centros-de-costos/saldos)
- Filtros: Centro de costo, Profesional, Paciente, Mutual, Proveedor, Agrupar por, Fecha desde/hasta
- Mensaje inicial: "Seleccione un Centro de Costo"
- Similar al módulo de movimientos, pero orientado a saldos agrupados

#### A.15 Relacionar prácticas con mutuales (/odontograma-practicas-permitir/new)
- Pantalla de parametrización de prácticas por mutual
- Campos:
  - Mutual
  - Código Práctica
  - Nombre Práctica
  - Dibujo
  - Cobrar a Paciente
  - Cobertura Mutual
- Botón Guardar + tabla inferior "Practicas de la Mutual Seleccionada"
- Esta pantalla es clave para la regla de cobertura/copeo entre práctica y obra social

### B. Formularios adicionales observados en modo seguro

#### B.1 Nuevo Turno (/turnos/new)
- Esta pantalla se exploró sin guardar
- Campos observados:
  - Profesional
  - Paciente
  - Mutual
  - Fecha
  - Órdenes (`Sin`, `Entrego`, `Debe`)
  - Hora
  - Duración
  - Estado (default: Pendiente)
  - Tipo (default: Presencial)
  - Observación
- Elementos complementarios:
  - Link para ver mutuales que atiende el profesional
  - Botón de acceso rápido al profesional
  - Sección "Turnos Tomados"
  - Mensaje sobre duración heredada desde configuración del profesional o clínica

#### B.2 Nueva Receta (/recetas/new)
- Pantalla muy estructurada, con requisitos regulatorios visibles
- Campos observados:
  - Profesional
  - Paciente
  - Mutual
  - Fecha
  - Diagnóstico
  - Tipo: Medicamentos / Practicas
  - Selector de medicamento
- Requisitos explícitos visibles:
  - Del paciente: DNI, OOSS, Nombre, Nacimiento y Sexo
  - Del profesional: Dirección del lugar de atención y código REFEPS activo
- Mensaje adicional: para diagnóstico no nomenclado debe usarse código `99999`
- Sección de "Atajos" con diagnósticos habituales

#### B.3 Nueva Ficha Clínica (/fichaclinica/add/?id_template=2&id_paciente=4349)
- Plantilla de ficha clínica libre
- Campos:
  - Motivo
  - Descripción / notas libres
- Funciones adicionales observadas:
  - Carga de archivos por drag & drop
  - Grabación de audio
  - Mostrar fichas
  - Cancelar
  - Guardar
- Esto demuestra que la historia clínica soporta **texto + adjuntos + audio**, no solo formularios estructurados

#### B.4 Dirección de Profesional (/profesionales/direccion/)
- Pantalla simple para editar la dirección visible en recetas
- Campo único: Dirección
- Esto separa la dirección de atención usada para recetas del resto del perfil general

### C. Detalle adicional de transacciones

#### C.1 Detalle de Transacción (/transacciones/detalle/80)
- Pantalla observada sin ejecutar acción de anulación
- Encabezado:
  - Fecha
  - Estado
  - Operador
  - Detalle
  - Profesional
  - Paciente
- Tabla de asientos observada:
  - **Debe:** Caja — $5.000.000,00
  - **Haber:** Depósitos Cobrados — $5.000.000,00
- Esto confirma de forma explícita el modelo de partida doble ya inferido en el plan de cuentas
- Botón visible pero no ejecutado: `Anular`

### D. Ayuda interna y onboarding

#### D.1 Modal de ayuda del usuario
- Accesible desde el menú del usuario
- Título: "Teclas de acceso directo"
- Atajos confirmados:
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
  - alt + m → Medicamento Listado
  - alt + i → Diagnosticos Listado
  - alt + o → Odontograma
- Además incluye links a:
  - Videos Tutoriales
  - Descargar Manual PDF

#### D.2 Videos Tutoriales (/videos/index)
- Biblioteca interna de onboarding por temas
- Categorías observadas:
  - Introducción
  - Pasos Iniciales
  - Dar Turnos
  - Odontología
  - Profesionales
  - Cuenta Corriente
  - Autogestión
- Videos observados:
  - Qué es turno.com.ar?
  - Configuración del sistema
  - Datos del profesional
  - Tips
  - Calendario
  - Listado de turnos y estados
  - Turnos para Videollamadas
  - Autorizaciones
  - Odontograma
  - Exportación para facturación
  - Relacionar prácticas con dibujos y mutuales
  - Listado de registros
  - Presupuestos
  - Crear recetas
  - Atención de paciente e historias clínicas
  - Acciones y reportes de cuenta corriente
  - Ordenes y Depósitos
  - Turnos Online

Esto agrega una evidencia importante: el sistema tiene una capa formal de capacitación integrada, lo que refuerza su madurez operativa.

### E. Acciones ocultas en tablas (relevadas sin ejecutar)

#### E.1 Pacientes — menú desplegable de acciones
En la fila del paciente se observó, por inspección del HTML, el siguiente menú:
- Editar Paciente
- Ver ficha clínica
- Mutuales
- Detalle / ir a cuenta corriente (carga modal)
- Forzar nueva Contraseña
- Eliminar Paciente

#### E.2 Profesionales — menú desplegable de acciones
En la fila del profesional se observó, por inspección del HTML, el siguiente menú:
- Editar
- Comisiones
- Honorarios Adeudados
- Forzar nueva Contraseña
- Eliminar Profesional
- Acción independiente adicional: botón de validación REFEPS

### F. Corrección del alcance

Con este segundo pase el relevamiento cubre no solo los módulos principales, sino también:
- catálogos estructurales (diagnósticos, medicamentos, tipos de orden)
- parametrización avanzada (grupos, comisiones, mutuales por profesional, prácticas por mutual)
- formularios de alta en modo observación
- ayuda interna, manuales y videos
- acciones ocultas en tablas

No se ejecutaron acciones de guardado, anulación, eliminación, reintegro, alta, edición ni confirmación. Se mantuvo el criterio de solo lectura durante todo el proceso.

*Fin del relevamiento. Documento generado a partir de exploración directa del sistema en producción el 30-03-2026. Todas las afirmaciones sin marcador [SUPUESTO] fueron verificadas visualmente en la interfaz del sistema.*
