# Integración con Obras Sociales Argentinas — Investigación Completa

> **Fecha**: 2026-04-01
> **Propósito**: Guía técnica y de negocio para integrar validación SOAP con obras sociales en nuestro sistema odontológico
> **Autor**: Investigación interna — SDD Explore
> **Estado**: borrador — basado en investigación web, documentación oficial y análisis de DentalTec

---

## Tabla de Contenidos

1. [Cómo funciona el sistema de salud odontológico argentino](#1-cómo-funciona-el-sistema-de-salud-odontológico-argentino)
2. [El flujo de facturación a obras sociales](#2-el-flujo-de-facturación-a-obras-sociales)
3. [Servicios web SOAP de obras sociales](#3-servicios-web-soap-de-obras-sociales)
4. [Investigación por Obra Social](#4-investigación-por-obra-social)
5. [Acceso y Credenciales](#5-acceso-y-credenciales)
6. [Implementación Técnica](#6-implementación-técnica)
7. [Marco Legal y Regulatorio](#7-marco-legal-y-regulatorio)
8. [Enfoques Alternativos](#8-enfoques-alternativos)
9. [Roadmap de implementación sugerido](#9-roadmap-de-implementación-sugerido)
10. [Conclusiones y recomendaciones](#10-conclusiones-y-recomendaciones)

---

## 1. Cómo funciona el sistema de salud odontológico argentino

### 1.1 Actores principales

```
┌──────────────────────────────────────────────────────────────┐
│                   ECOSISTEMA DE SALUD ARGENTINO               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    fiscaliza    ┌──────────────────────┐    │
│  │   SSSalud   │◄───────────────│  Obras Sociales      │    │
│  │ (Superint.) │───────────────►│  (OSDE, Swiss, etc.)  │    │
│  └─────────────┘                 └──────────┬───────────┘    │
│        │                                   │                 │
│        │ padrón nacional                   │ convenios       │
│        ▼                                   ▼                 │
│  ┌─────────────┐                 ┌──────────────────────┐    │
│  │  AFIP/ARCA  │                 │  Prestadores         │    │
│  │ (fact.elec.)│                 │  (odontólogos)       │    │
│  └─────────────┘                 └──────────┬───────────┘    │
│                                              │                 │
│                                              │ atiende         │
│                                              ▼                 │
│                                         ┌──────────┐         │
│                                         │ Pacientes│         │
│                                         │(afiliados)│        │
│                                         └──────────┘         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Estructura jerárquica odontológica:                │     │
│  │  Odontólogo → Círculo → Federación → CORA          │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

#### SSSalud — Superintendencia de Servicios de Salud
- **URL**: https://www.argentina.gob.ar/sssalud / https://www.sssalud.gob.ar
- **Rol**: Órgano de control y fiscalización del Sistema Nacional del Seguro de Salud
- **Dirección**: Bartolomé Mitre 434, CABA — Tel: 0800-222-72583 (SALUD)
- **Funciones**:
  - Fiscaliza obras sociales nacionales y entidades de medicina prepaga
  - Mantiene el **Padrón Nacional de Beneficiarios**
  - Administra el **Mecanismo de Integración** (redistribución de fondos entre OS)
  - Registra prestadores profesionales y establecimientos
  - Publica resoluciones que norman la facturación y prestaciones

#### AFIP / ARCA
- Regula la **facturación electrónica** obligatoria
- Los prestadores deben emitir comprobantes electrónicos (facturas) por sus prestaciones
- Resolución 1415/18 AFIP: obligatoriedad de facturación electrónica para prestadores de salud

#### Obras Sociales (Agentes del Seguro)
- Entidades que administran la cobertura de salud de los trabajadores
- Hay ~300 obras sociales nacionales, provinciales y sindicales
- Las más relevantes para odontología: OSDE, Swiss Medical, Jerárquicos, Sancor, OSSEG, etc.

#### Círculos Odontológicos
- Asociaciones profesionales a nivel local/provincial (ej: Círculo de Mendoza, Círculo de San Juan)
- Actúan como intermediarios entre prestadores individuales y las obras sociales
- Facilitan la facturación colectiva y la negociación de aranceles
- Muchos tienen sus propios portales de validación

#### Federaciones
- Agrupan varios círculos odontológicos a nivel regional
- Consolidan facturación y liquidaciones

#### CORA — Confederación Odontológica de la República Argentina
- Máximo nivel jerárquico de la odontología argentina
- Agrupa federaciones de todo el país
- Negocia a nivel nacional con obras sociales y el Estado

### 1.2 El nomenclador dental

#### ¿Qué es?
El **nomenclador** es un catálogo codificado de prestaciones odontológicas donde cada práctica tiene:
- Un **código numérico** (ej: 10.01.01 para una limpieza dental)
- Una **descripción** (ej: "Tartrectomía — Limpieza bucal")
- Un **arancel base** o valor de referencia
- Reglas de **frecuencia** (ej: 1 vez por año)
- Indicadores de **autorización previa** (si la necesitan)

#### Nomencladores relevantes

| Nomenclador | Emisor | Cobertura | Notas |
|-------------|--------|-----------|-------|
| **Nomenclador Nacional COMRA** | Confederación Médica República Argentina | Nivel 1-7 por complejidad | El más usado como referencia nacional |
| **Nomenclador Nacional de Prestaciones Odontológicas** | Circulo Odontológico de Mendoza | Prácticas dentales específicas | Usado como referencia por círculos |
| **PMO — Programa Médico Obligatorio** | Ministerio de Salud / SSSalud | Prestaciones mínimas obligatorias | Define qué DEBEN cubrir las OS |
| **Nomenclador PAMI** | INSSJP (PAMI) | Jubilados y pensionados | Específico para PAMI |
| **Nomenclador por OS** | Cada obra social | Prácticas y aranceles propios | **CADA OS TIENE SU PROPIO NOMENCLADOR** |

#### Códigos de ejemplo (Nomenclador Nacional Odontológico)

| Código | Descripción | Nivel | Autorización |
|--------|-------------|-------|-------------|
| 10.01.01 | Tartrectomía — Limpieza bucal | 1 | No |
| 10.01.02 | Profilaxis — Aplicación de flúor | 1 | No |
| 10.02.01 | Operatoria dental — Obturación simple | 2 | No |
| 10.02.02 | Operatoria dental — Obturación compuesta | 3 | No |
| 10.03.01 | Endodoncia — Pulpectomía | 5 | Sí |
| 10.04.01 | Exodoncia simple | 2 | No |
| 10.04.02 | Exodoncia quirúrgica | 4 | Sí |
| 10.05.01 | Prótesis total superior | 6 | Sí |
| 10.06.01 | Ortodoncia — Diagnóstico | 4 | Sí |
| 10.07.01 | Implante osteointegrado | 7 | Sí |

> **NOTA CRÍTICA**: Los códigos anteriores son orientativos. Cada obra social puede usar su propia codificación y sus propios valores. No hay un estándar único universal — de ahí la necesidad de integración individual por OS.

### 1.3 ¿Qué es una "práctica"?

En el contexto de la facturación a obras sociales:

- **Práctica** = una prestación odontológica específica realizada a un paciente afiliado
- Se identifica por su código de nomenclador
- Se factura individualmente o agrupada en una planilla
- Puede estar sujeta a:
  - **Topes** (máximo de veces por período)
  - **Autorización previa** (la OS debe autorizarla antes de realizarla)
  - **Vigencia del afiliado** (el paciente debe estar activo al momento de la práctica)
  - **Grupos etarios** (algunas prácticas son solo para adultos o solo para niños)

### 1.4 ¿Qué son los "débitos"?

Los **débitos** son prácticas facturadas por el prestador que la obra social **rechaza** o **no reconoce**. Causas comunes:

| Causa de débito | Descripción |
|----------------|-------------|
| **Afiliado no legible** | El paciente no está activo o no corresponde a esa OS |
| **Práctica no cubierta** | El nomenclador de esa OS no incluye la práctica |
| **Tope excedido** | El paciente ya usó su cupo para esa práctica en el período |
| **Sin autorización** | La práctica requería autorización previa y no se obtuvo |
| **Error de código** | Código de nomenclador incorrecto o inexistente |
| **Datos incompletos** | Faltan datos en la planilla de facturación |
| **Duplicado** | La práctica ya fue facturada previamente |
| **Profesional no habilitado** | El odontólogo no está registrado como prestador de esa OS |

> DentalTec reporta una **reducción del 64% en débitos** mediante validación preventiva en tiempo real. Este es el valor diferencial principal de una buena integración.

### 1.5 El rol de Círculos, Federaciones y CORA

```
Odontólogo Individual
        │
        │ Presenta prácticas al
        ▼
   ┌─────────┐
   │ Círculo │  ← Audita, consolida, y factura a la OS
   └────┬────┘
        │
        │ Transmite consolidado al
        ▼
 ┌────────────┐
 │ Federación │  ← Re-consolida múltiples círculos
 └─────┬──────┘
       │
       │ Transmite al
       ▼
   ┌───────┐
   │ CORA  │  ← Nivel nacional, negocia con OS y Estado
   └───────┘
```

- Los **odontólogos individuales** cargan prácticas en el sistema
- El **círculo** audita, valida, consolida y envía planillas a la obra social
- La **federación** agrupa varios círculos y re-consolida
- **CORA** opera a nivel nacional y negocia convenios

Para nuestro sistema, si el cliente es un odontólogo individual, la integración puede ser directa. Si es un círculo o federación, necesitamos soportar facturación multinivel.

---

## 2. El flujo de facturación a obras sociales

### 2.1 Flujo completo de una prestación

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO DE FACTURACIÓN COMPLETO                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. VALIDACIÓN PREVIA                                            │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────────────┐  │
│  │ Paciente     │───►│ Verificar     │───►│ Resultado:       │  │
│  │ presenta     │    │ afiliado en   │    │ ✓ Legible         │  │
│  │ credencial   │    │ OS (web svc) │    │ ✗ No legible      │  │
│  └──────────────┘    └───────────────┘    │ ? Pendiente       │  │
│                                           └───────────────────┘  │
│                                                                  │
│  2. ATENCIÓN                                                     │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────────────┐  │
│  │ Registrar    │───►│ Verificar     │───►│ Resultado:       │  │
│  │ práctica     │    │ práctica en   │    │ ✓ Cubierta        │  │
│  │ (nomenclador)│    │ nomenclador   │    │ ✗ No cubierta     │  │
│  └──────────────┘    │ OS (web svc) │    │ ⚠ Requiere autor. │  │
│                      └───────────────┘    └───────────────────┘  │
│                                                                  │
│  3. FACTURACIÓN                                                  │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────────────┐  │
│  │ Cierre       │───►│ Generar       │───►│ Generar factura   │  │
│  │ período      │    │ planilla      │    │ electrónica AFIP  │  │
│  └──────────────┘    └───────────────┘    └───────────────────┘  │
│                                                                  │
│  4. PRESENTACIÓN A OS                                           │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────────────┐  │
│  │ Enviar       │───►│ OS recibe     │───►│ OS audita y       │  │
│  │ planilla     │    │ y procesa     │    │ liquida/paga      │  │
│  └──────────────┘    └───────────────┘    └───────────────────┘  │
│                                                                  │
│  5. RESULTADO                                                    │
│  ┌──────────────┐    ┌───────────────┐                           │
│  │ Recibir      │───►│ Créditos:     │                           │
│  │ liquidación  │    │ Prácticas     │                           │
│  │              │    │ reconocidas   │                           │
│  │              │    │ Débitos:      │                           │
│  │              │    │ Prácticas     │                           │
│  │              │    │ rechazadas    │                           │
│  └──────────────┘    └───────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Detalle de cada etapa

#### Etapa 1: Validación previa del afiliado
- El prestador verifica que el paciente esté afiliado y sea **legible** (con cobertura vigente)
- Esto se hace consultando el padrón de la obra social
- En sistemas modernos, se hace vía web service SOAP en tiempo real
- En sistemas tradicionales, se hace por teléfono o portal web manual

#### Etapa 2: Verificación de la práctica
- Antes de realizar la práctica, se verifica si:
  - La práctica está cubierta por esa OS y ese plan
  - El paciente no ha excedido el tope de frecuencia
  - No requiere autorización previa (o se obtiene la autorización)
- **DentalTec hace esto en tiempo real** — es su diferencial principal

#### Etapa 3: Facturación
- Se genera una **planilla** con todas las prácticas del período (generalmente mensual)
- Cada práctica tiene: código, descripción, fecha, profesional, afiliado, plan
- Se genera la **factura electrónica** ante AFIP/ARCA

#### Etapa 4: Presentación a la OS
- La planilla se envía a la obra social
- Algunas OS aceptan envío electrónico (web service, FTP, portal)
- Otras requieren presentación física o en formato específico

#### Etapa 5: Liquidación
- La OS audita las prácticas presentadas
- **Créditos**: prácticas reconocidas y pagadas
- **Débitos**: prácticas rechazadas (con código de motivo)
- El pago puede tardar 30-90 días según la OS

### 2.3 Mecanismo de Integración (SSSalud)

La SSSalud administra el **Mecanismo de Integración**, que es un sistema de redistribución financiera entre obras sociales. En el portal de la SSSalud (sssalud.gob.ar) existe:

- **Consulta de Integración**: Permite verificar el estado de comprobantes (facturas, recibos) presentados
- Se consulta por CUIT, tipo de comprobante, punto de venta y número
- URL: https://www.sssalud.gob.ar/index.php?page=integracion
- **NO es un web service SOAP público** — es una consulta web manual

---

## 3. Servicios web SOAP de obras sociales

### 3.1 Panorama general

#### Estado actual del ecosistema

| Aspecto | Estado |
|---------|--------|
| **Protocolo dominante** | SOAP (XML sobre HTTP/HTTPS) |
| **Estándar** | No hay estándar único — cada OS implementa su propio servicio |
| **WSDLs públicos** | NO — la mayoría son privados, se obtienen al registrarse como prestador |
| **Documentación pública** | Muy limitada — generalmente solo disponible para prestadores registrados |
| **Autenticación** | Generalmente Basic Auth, WSSecurity o tokens personalizados |
| **Entornos de testing** | Raramente disponibles — la mayoría opera solo en producción |
| **API REST** | Muy raro — el estándar de la industria es SOAP |

#### ¿Por qué SOAP y no REST?

- Las obras sociales argentinas implementaron sus sistemas web en la era de SOAP (~2005-2015)
- El ecosistema está consolidado en SOAP — cambiar a REST sería un esfuerzo enorme para OS que no tienen incentivo
- SOAP ofrece tipado fuerte (WSDL/XSD) que es útil para transacciones financieras
- El middleware existente (DentalTec y similares) ya funciona con SOAP

### 3.2 Protocolos y estándares

#### SOAP 1.1 vs SOAP 1.2

La mayoría de las OS argentinas usan **SOAP 1.1** (sobre HTTP). Algunas las más modernas pueden usar SOAP 1.2.

```xml
<!-- Ejemplo genérico de Request SOAP 1.1 para validación de afiliado -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>CUIT_DEL_PRESTADOR</wsse:Username>
        <wsse:Password>CLAVE</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <ns1:ValidarAfiliado xmlns:ns1="http://www.obrasocial.com.ar/servicios">
      <ns1:TipoDocumento>DNI</ns1:TipoDocumento>
      <ns1:NroDocumento>12345678</ns1:NroDocumento>
      <ns1:CodigoPlan>210</ns1:CodigoPlan>
    </ns1:ValidarAfiliado>
  </soap:Body>
</soap:Envelope>
```

```xml
<!-- Ejemplo genérico de Response SOAP 1.1 -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns1:ValidarAfiliadoResponse xmlns:ns1="http://www.obrasocial.com.ar/servicios">
      <ns1:Estado>ACTIVO</ns1:Estado>
      <ns1:Nombre>APELLIDO NOMBRE</ns1:Nombre>
      <ns1:Plan>OSDE 210</ns1:Plan>
      <ns1:FechaVigencia>2026-12-31</ns1:FechaVigencia>
      <ns1:GrupoFamiliar>
        <ns1:Integrante>
          <ns1:Parentesco>TITULAR</ns1:Parentesco>
          <ns1:Nombre>APELLIDO NOMBRE</ns1:Nombre>
          <ns1:Documento>12345678</ns1:Documento>
        </ns1:Integrante>
      </ns1:GrupoFamiliar>
    </ns1:ValidarAfiliadoResponse>
  </soap:Body>
</soap:Envelope>
```

#### Operaciones típicas por web service

| Operación | Descripción | Frecuencia de uso |
|-----------|-------------|-------------------|
| `ValidarAfiliado` | Verificar que un paciente es afiliado vigente | Por cada atención |
| `ConsultarPractica` | Verificar si una práctica está cubierta | Por cada práctica |
| `ConsultarNomenclador` | Obtener nomenclador completo o parcial | Mensual / al inicio |
| `ConsultarTopes` | Verificar topes de frecuencia por afiliado | Por cada práctica |
| `SolicitarAutorizacion` | Pedir autorización para prácticas que la requieren | Cuando corresponde |
| `ConsultarEstadoFacturacion` | Verificar estado de planillas presentadas | Post-facturación |
| `ConsultarDebitos` | Obtener detalle de prácticas debitadas | Post-facturación |
| `ConsultarLiquidaciones` | Ver estado de pagos | Periódica |

#### Métodos de autenticación observados

| Método | Descripción | Dónde se observa |
|--------|-------------|-----------------|
| **Basic Auth** | Usuario/contraseña en header HTTP | Algunas OS provinciales |
| **WS-Security UsernameToken** | Credenciales en header SOAP con PasswordText o PasswordDigest | OSDE, Swiss Medical (probable) |
| **WS-Security Certificate** | Certificado X.509 + firma digital | OS que manejan datos sensibles |
| **Token personalizado** | Token en header HTTP o SOAP | Algunas OS con sistemas propios |
| **IP whitelisting** | Solo permiten requests desde IPs registradas | Práctica común |

### 3.3 Estructura típica de los servicios

#### Modelo de datos común

```typescript
// Interfaces típicas que abstraen las respuestas de cualquier OS
interface AfiliadoValidado {
  documento: string;
  nombreCompleto: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  plan: string;
  codigoPlan: string;
  fechaVigencia?: string;
  grupoFamiliar?: IntegranteFamiliar[];
  errores?: ErrorValidacion[];
}

interface PracticaValidada {
  codigoPractica: string;
  descripcion: string;
  cubierta: boolean;
  requiereAutorizacion: boolean;
  topeRestante: number; // veces que puede hacerse aún
  arancel?: number;
  errores?: ErrorValidacion[];
}

interface ErrorValidacion {
  codigo: string;
  mensaje: string;
  severidad: 'ERROR' | 'WARNING';
}
```

---

## 4. Investigación por Obra Social

> **NOTA**: La información específica por obra social es extremadamente difícil de obtener públicamente. La mayoría de las OS no publican documentación técnica de sus web services. Los WSDLs y credenciales se obtienen exclusivamente a través de los portales de prestadores, generalmente requiriendo registro previo como prestador habilitado. La información que sigue se basa en lo que se pudo verificar públicamente.

### 4.1 OSDE

| Aspecto | Información |
|---------|------------|
| **Web** | https://www.osde.com.ar |
| **Portal prestadores** | Existe (no verificado públicamente) |
| **Web service SOAP** | **Muy probable que exista** — DentalTec lo integra |
| **WSDL público** | **NO encontrado públicamente** |
| **Documentación** | No disponible públicamente |
| **Contacto** | 0800-OSDE (6733) |
| **Notas** | OSDE es la obra social más grande de Argentina (~2.2M afiliados). Su portal de prestadores es probablemente el más sofisticado. Es casi seguro que ofrecen servicios web para validación, dado que DentalTec lo integra. |

### 4.2 Swiss Medical Group

| Aspecto | Información |
|---------|------------|
| **Web** | https://www.swissmedical.com.ar |
| **Portal prestadores** | Existe — https://www.swissmedical.com.ar/prestadores |
| **Web service SOAP** | **Probable** — DentalTec lo integra |
| **WSDL público** | **NO encontrado públicamente** |
| **Documentación** | Página de "Ser Prestador" disponible con instrucciones generales |
| **Notas** | Swiss Medical tiene una sección para prestadores en su web. Para acceder a servicios web, es necesario registrarse como prestador. Su sistema se llama "SMG". |

### 4.3 Jerárquicos

| Aspecto | Información |
|---------|------------|
| **Web** | Información limitada públicamente |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social del sindicato de trabajadores jerárquicos. Los servicios web probablemente se acceden a través del registro como prestador. |

### 4.4 Sancor

| Aspecto | Información |
|---------|------------|
| **Web** | Información limitada públicamente |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social de la cooperativa sanitaria Sancor (Santa Fe). |

### 4.5 OSSEG

| Aspecto | Información |
|---------|------------|
| **Web** | Información limitada públicamente |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra Social de la Seguridad (gobierno). |

### 4.6 IOSEP

| Aspecto | Información |
|---------|------------|
| **Tipo** | Obra Social Provincial — Entre Ríos |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Las OS provinciales suelen tener sistemas menos estandarizados que las nacionales. |

### 4.7 Hamburgo

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social nacional. |

### 4.8 OSM Santiago del Estero

| Aspecto | Información |
|---------|------------|
| **Tipo** | Obra Social Provincial |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | El Círculo Odontológico de Santiago del Estero (COSTG) es cliente de DentalTec, lo que sugiere fuerte integración local. |

### 4.9 Policía Federal

| Aspecto | Información |
|---------|------------|
| **Tipo** | Obra Social de Fuerzas de Seguridad |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Sistema posiblemente más cerrado por naturaleza institucional. |

### 4.10 NOBIS

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social nacional. |

### 4.11 OSMATA / Sanitas

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social de la actividad de taxis y afines. |

### 4.12 Prevención Salud

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social nacional. |

### 4.13 COLMED

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social del personal de la educación. |

### 4.14 Federada Salud

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social del sindicato de trabajadores de la salud. |

### 4.15 Staff / Brindar

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social nacional. |

### 4.16 Traditum

| Aspecto | Información |
|---------|------------|
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Obra social de jubilados y pensionados. |

### 4.17 OSP San Juan

| Aspecto | Información |
|---------|------------|
| **Tipo** | Obra Social Provincial — San Juan |
| **Web service SOAP** | **Sí** — DentalTec lo integra |
| **Notas** | Al ser de San Juan (donde está Tándem Digital, creadora de DentalTec), probablemente sea una de las mejor integradas. |

### Resumen de hallazgos por OS

| OS | Web Service Confirmado | WSDL Público | Portal Prestadores | Dificultad Estimada |
|----|----------------------|-------------|-------------------|-------------------|
| OSDE | Indirecto (via DentalTec) | NO | Probablemente sí | Media |
| Swiss Medical | Indirecto (via DentalTec) | NO | Sí | Media |
| Jerárquicos | Indirecto (via DentalTec) | NO | Desconocido | Media-Alta |
| Sancor | Indirecto (via DentalTec) | NO | Desconocido | Media |
| OSSEG | Indirecto (via DentalTec) | NO | Desconocido | Media |
| IOSEP | Indirecto (via DentalTec) | NO | Desconocido | Alta |
| Hamburgo | Indirecto (via DentalTec) | NO | Desconocido | Media |
| OSM Santiago | Indirecto (via DentalTec) | NO | Desconocido | Alta |
| Policía Federal | Indirecto (via DentalTec) | NO | Desconocido | Alta |
| NOBIS | Indirecto (via DentalTec) | NO | Desconocido | Media-Alta |
| OSMATA/Sanitas | Indirecto (via DentalTec) | NO | Desconocido | Media |
| Prevención Salud | Indirecto (via DentalTec) | NO | Desconocido | Media |
| COLMED | Indirecto (via DentalTec) | NO | Desconocido | Media |
| Federada Salud | Indirecto (via DentalTec) | NO | Desconocido | Media-Alta |
| Staff/Brindar | Indirecto (via DentalTec) | NO | Desconocido | Media |
| Traditum | Indirecto (via DentalTec) | NO | Desconocido | Media |
| OSP San Juan | Indirecto (via DentalTec) | NO | Desconocido | Media |

---

## 5. Acceso y Credenciales

### 5.1 Cómo obtener credenciales

El proceso general para obtener acceso a los web services de una obra social es:

```
1. SER PRESTADOR
   └── El odontólogo debe estar inscripto como prestador de esa OS
       ├── Inscripción ante la SSSalud (requisito previo)
       ├── Inscripción específica ante cada OS
       └── Matrícula profesional vigente

2. REGISTRARSE EN EL PORTAL
   └── Acceder al portal de prestadores de la OS
       ├── Generalmente requiere CUIT
       ├── Número de prestador otorgado por la OS
       └── Alta de usuario y contraseña

3. SOLICITAR ACCESO A SERVICIOS WEB
   └── Una vez registrado como prestador
       ├── Contactar al área de sistemas de la OS
       ├── Especificar necesidad de integración por software
       ├── Posiblemente firmar convenio o acuerdo de confidencialidad
       └── Recibir credenciales (usuario, contraseña, WSDL)

4. CONFIGURACIÓN TÉCNICA
   └── Con las credenciales y WSDL
       ├── Configurar el cliente SOAP
       ├── Probar en producción (rara vez hay sandbox)
       └── Comenzar la integración
```

### 5.2 Entornos de testing

> **DESCUBRIMIENTO IMPORTANTE**: La gran mayoría de las obras sociales argentinas **NO ofrecen entornos de testing/sandbox** para sus web services. Esto significa que:

- Las pruebas se deben hacer contra el ambiente de **producción**
- Los datos de prueba deben ser afiliados reales (generalmente los del propio prestador)
- Es fundamental tener un manejo cuidadoso para no generar facturaciones o registros reales por error
- Se recomienda validar primero con prácticas simples (consultas) antes de intentar operaciones que generen registros

### 5.3 Proceso por OS

Dado que no hay información pública detallada sobre el proceso de cada OS, el enfoque práctico recomendado es:

1. **Priorizar las OS más relevantes** para el primer cliente (generalmente OSDE y Swiss Medical)
2. **Contactar directamente** a cada OS como prestador o a través del prestador cliente
3. **Solicitar formalmente** acceso a los servicios web
4. **Obtener los WSDLs** y documentación técnica específica
5. **Desarrollar el adaptador** para esa OS
6. **Repetir** para cada OS adicional

### 5.4 Credenciales para software providers

> **NO hay un programa de "developer access"** estandarizado. No existen "API keys" públicas ni developer portals como en Stripe, Twilio, etc.

Para un **proveedor de software** (como nosotros), las opciones son:

1. **A través de un prestador cliente**: El odontólogo/clínica que use nuestro sistema ya tiene credenciales como prestador. Nosotros usamos esas credenciales en nombre del prestador.

2. **Registro como prestador colectivo**: Algunos círculos odontológicos se registran como prestadores y obtienen credenciales colectivas que usan para todos sus miembros.

3. **Convenio institucional**: Negociar directamente con la OS un convenio que permita a nuestro software operar en nombre de múltiples prestadores. Esto es complejo pero es lo que hace DentalTec a gran escala.

---

## 6. Implementación Técnica

### 6.1 Stack recomendado (Node.js + NestJS)

#### Librería SOAP: `strong-soap`

| Aspecto | Detalle |
|---------|---------|
| **Paquete** | `strong-soap` v5.0.8 |
| **Repo** | https://github.com/loopbackio/strong-soap |
| **Mantenimiento** | Activo — publicado hace 23 días (marzo 2026) |
| **Downloads** | ~53K semanales |
| **Licencia** | MIT |
| **Soporte** | SOAP 1.1, SOAP 1.2, WS-Security, Basic Auth, SSL, X.509 |
| **Alternativa** | `soap` (npm) — menos mantenido pero más descargado |

#### ¿Por qué strong-soap?

1. **Mantenido por LoopBack (IBM)** — equipo con track record en enterprise
2. **Soporta WSSecurity** — necesario para la mayoría de las OS argentinas
3. **API Promise-ready** — se integra bien con async/await de TypeScript
4. **WSDL parsing completo** — genera tipos y estructuras automáticamente
5. **SOAP Server + Client** — permite tanto consumir como exponer servicios
6. ** soap-stub incluido** — facilita testing

#### Instalación

```bash
pnpm add strong-soap
pnpm add -D @types/strong-soap
```

### 6.2 Patrón Adapter

Dado que cada obra social tiene su propio WSDL, estructura de datos y comportamiento, necesitamos un **patrón Adapter** que normalice la interfaz.

#### Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    APLICACIÓN (NestJS)                    │
│                                                          │
│  ┌─────────────┐                                        │
│  │   Módulo    │  Usa la interfaz                       │
│  │  Paciente   │  ObraSocialService (normalizada)       │
│  │  /Turno     │                                        │
│  └──────┬──────┘                                        │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────┐           │
│  │     OBRA SOCIAL MODULE (NestJS)          │           │
│  │                                          │           │
│  │  ┌────────────────────────────────────┐  │           │
│  │  │  ObraSocialService                │  │           │
│  │  │  (Facade / Orchestration)          │  │           │
│  │  │                                    │  │           │
│  │  │  validateAfiliado()                │  │           │
│  │  │  validatePractica()                │  │           │
│  │  │  getNomenclador()                  │  │           │
│  │  └──────────┬─────────────────────────┘  │           │
│  │             │                            │           │
│  │             ▼                            │           │
│  │  ┌────────────────────────────────────┐  │           │
│  │  │  ObraSocialAdapterFactory          │  │           │
│  │  │  (Factory + Registry)              │  │           │
│  │  │                                    │  │           │
│  │  │  getAdapter(osId: string)          │  │           │
│  │  │  registerAdapter(osId, adapter)    │  │           │
│  │  └──────────┬─────────────────────────┘  │           │
│  │             │                            │           │
│  │     ┌───────┴────────┐                  │           │
│  │     ▼                ▼                  │           │
│  │  ┌────────┐    ┌──────────┐            │           │
│  │  │  OSDE  │    │  Swiss   │  ...       │           │
│  │  │Adapter │    │ Adapter  │            │           │
│  │  └───┬────┘    └────┬─────┘            │           │
│  │      │              │                   │           │
│  │      ▼              ▼                   │           │
│  │  ┌──────────────────────────────┐       │           │
│  │  │  SOAP Client (strong-soap)   │       │           │
│  │  │  + Config por OS             │       │           │
│  │  │  + Retry / Timeout           │       │           │
│  │  │  + Circuit Breaker           │       │           │
│  │  └──────────────────────────────┘       │           │
│  └──────────────────────────────────────────┘           │
│         │            │           │                      │
│         ▼            ▼           ▼                      │
│     ┌───────┐    ┌────────┐  ┌──────┐                  │
│     │ OSDE  │    │ Swiss  │  │ Jerá.│   (SOAP servers) │
│     │  WS   │    │   WS   │  │  WS  │                  │
│     └───────┘    └────────┘  └──────┘                  │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Código de ejemplo

#### Interfaz base del Adapter

```typescript
// libs/obra-social/interfaces/obra-social-adapter.interface.ts

export enum ObraSocialId {
  OSDE = 'osde',
  SWISS_MEDICAL = 'swiss_medical',
  JERARQUICOS = 'jerarquicos',
  SANCOR = 'sancor',
  OSSEG = 'osseg',
  IOSEP = 'iosep',
  HAMBURGO = 'hamburgo',
  OSM_SANTIAGO = 'osm_santiago',
  POLICIA_FEDERAL = 'policia_federal',
  NOBIS = 'nobis',
  OSMATA_SANITAS = 'osmata_sanitas',
  PREVENCION_SALUD = 'prevencion_salud',
  COLMED = 'colmed',
  FEDERADA_SALUD = 'federada_salud',
  STAFF_BRINDAR = 'staff_brindar',
  TRADITUM = 'traditum',
  OSP_SAN_JUAN = 'osp_san_juan',
}

export interface Afiliado {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'DESCONOCIDO';
  plan: string;
  codigoPlan: string;
  fechaVigencia?: Date;
  grupoFamiliar?: IntegranteFamiliar[];
}

export interface IntegranteFamiliar {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  parentesco: string;
  fechaNacimiento?: Date;
}

export interface Practica {
  codigo: string;
  descripcion: string;
  arancel?: number;
  requiereAutorizacion: boolean;
  frecuenciaMaxima?: number; // por período
  nivelComplejidad?: number;
}

export interface ValidacionPractica {
  cubierta: boolean;
  codigoPractica: string;
  descripcion: string;
  arancelReconocido?: number;
  topeRestante?: number;
  requiereAutorizacion: boolean;
  autorizacionNumero?: string;
  errores: ErrorValidacion[];
  advertencias: ErrorValidacion[];
}

export interface ErrorValidacion {
  codigo: string;
  mensaje: string;
  severidad: 'ERROR' | 'WARNING';
}

export interface ResultadoValidacionAfiliado {
  exitoso: boolean;
  afiliado?: Afiliado;
  errores: ErrorValidacion[];
}

export interface ConfiguracionObraSocial {
  wsdlUrl: string;
  endpointUrl?: string;
  username: string;
  password: string;
  timeout?: number; // ms
  retries?: number;
  certPath?: string; // para WS-Security con certificado
  keyPath?: string;
}
```

#### Interfaz del Adapter abstracto

```typescript
// libs/obra-social/interfaces/obra-social-adapter.interface.ts (continuación)

export interface IObraSocialAdapter {
  readonly id: ObraSocialId;
  readonly nombre: string;

  /**
   * Valida si un afiliado es legible (activo) en esta obra social
   */
  validarAfiliado(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPlan?: string,
  ): Promise<ResultadoValidacionAfiliado>;

  /**
   * Valida si una práctica está cubierta para un afiliado
   */
  validarPractica(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    fechaPractica: Date,
  ): Promise<ValidacionPractica>;

  /**
   * Obtiene el nomenclador de prácticas de esta obra social
   * (o las prácticas cubiertas para un plan específico)
   */
  getNomenclador(
    codigoPlan?: string,
  ): Promise<Practica[]>;

  /**
   * Consulta topes restantes para un afiliado y práctica
   */
  consultarTopes(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    periodo: string, // formato: 'YYYY-MM'
  ): Promise<{ topeTotal: number; utilizado: number; restante: number }>;

  /**
   * Solicita autorización para una práctica que la requiere
   */
  solicitarAutorizacion(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    diagnostico: string,
  ): Promise<{ autorizado: boolean; numeroAutorizacion?: string; motivo?: string }>;
}
```

#### Adapter base abstracto

```typescript
// libs/obra-social/adapters/base.adapter.ts

import { Logger } from '@nestjs/common';
import { IObraSocialAdapter, ConfiguracionObraSocial, ObraSocialId } from '../interfaces';
import * as soap from 'strong-soap';

export abstract class BaseObraSocialAdapter implements IObraSocialAdapter {
  protected readonly logger = new Logger(this.nombre);
  protected client: soap.Client | null = null;
  protected wsdlCache: soap.WSDL | null = null;

  constructor(
    protected readonly config: ConfiguracionObraSocial,
  ) {}

  abstract readonly id: ObraSocialId;
  abstract readonly nombre: string;

  /**
   * Inicializa el cliente SOAP. Se llama lazy (solo cuando se necesita).
   */
  protected async initClient(): Promise<soap.Client> {
    if (this.client) return this.client;

    return new Promise((resolve, reject) => {
      soap.createClient(
        this.config.wsdlUrl,
        {
          endpoint: this.config.endpointUrl,
          wsdl_options: {
            timeout: this.config.timeout ?? 30000,
          },
        },
        (err, client) => {
          if (err) {
            this.logger.error(`Error creando cliente SOAP para ${this.nombre}: ${err.message}`);
            reject(err);
            return;
          }

          this.client = client;

          // Configurar seguridad según la OS
          this.configureSecurity(client);

          // Si se especificó endpoint custom, sobreescribir
          if (this.config.endpointUrl) {
            client.setEndpoint(this.config.endpointUrl);
          }

          resolve(client);
        },
      );
    });
  }

  /**
   * Configura la seguridad (autenticación) del cliente SOAP.
   * Cada adapter puede sobreescribir este método.
   */
  protected configureSecurity(client: soap.Client): void {
    const { username, password } = this.config;

    if (username && password) {
      // Por defecto, WS-Security con PasswordText
      const security = new soap.WSSecurity(username, password, {
        passwordType: 'PasswordText',
        hasTimeStamp: true,
      });
      client.setSecurity(security);
    }
  }

  /**
   * Ejecuta un método SOAP con retry y timeout
   */
  protected async callSoap<T>(
    serviceName: string,
    methodName: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const maxRetries = this.config.retries ?? 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.initClient();
        const service = client[serviceName];
        const port = Object.keys(service)[0]; // Primer puerto disponible
        const method = service[port][methodName];

        if (!method) {
          throw new Error(`Método ${serviceName}.${port}.${methodName} no encontrado en WSDL`);
        }

        const result = await method(args);
        return result as T;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Intento ${attempt + 1}/${maxRetries + 1} falló para ${this.nombre}.${methodName}: ${(error as Error).message}`,
        );

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  // Métodos abstractos que cada OS debe implementar
  abstract validarAfiliado(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPlan?: string,
  ): Promise<import('../interfaces').ResultadoValidacionAfiliado>;

  abstract validarPractica(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    fechaPractica: Date,
  ): Promise<import('../interfaces').ValidacionPractica>;

  abstract getNomenclador(codigoPlan?: string): Promise<import('../interfaces').Practica[]>;

  abstract consultarTopes(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    periodo: string,
  ): Promise<{ topeTotal: number; utilizado: number; restante: number }>;

  abstract solicitarAutorizacion(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    diagnostico: string,
  ): Promise<{ autorizado: boolean; numeroAutorizacion?: string; motivo?: string }>;
}
```

#### Ejemplo de Adapter concreto (OSDE — esqueleto)

```typescript
// libs/obra-social/adapters/osde.adapter.ts

import { Injectable } from '@nestjs/common';
import { BaseObraSocialAdapter } from './base.adapter';
import {
  ObraSocialId,
  ResultadoValidacionAfiliado,
  ValidacionPractica,
  Practica,
  ErrorValidacion,
} from '../interfaces';

@Injectable()
export class OsdeAdapter extends BaseObraSocialAdapter {
  readonly id = ObraSocialId.OSDE;
  readonly nombre = 'OSDE';

  async validarAfiliado(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPlan?: string,
  ): Promise<ResultadoValidacionAfiliado> {
    try {
      // NOTA: Los nombres de servicio/método son EJEMPLO.
      // Deben reemplazarse con los reales del WSDL de OSDE.
      const response = await this.callSoap<any>(
        'AfiliadoService',
        'ConsultarAfiliado',
        {
          TipoDocumento: tipoDocumentoto,
          NroDocumento: numeroDocumento,
          CodigoPlan: codigoPlan,
        },
      );

      // Mapear respuesta específica de OSDE a nuestra interfaz estándar
      const afiliadoResponse = response?.ConsultarAfiliadoResult;

      if (!afiliadoResponse) {
        return {
          exitoso: false,
          errores: [{
            codigo: 'NO_ENCONTRADO',
            mensaje: 'Afiliado no encontrado',
            severidad: 'ERROR',
          }],
        };
      }

      return {
        exitoso: afiliadoResponse.Estado === 'ACTIVO',
        afiliado: {
          tipoDocumento,
          numeroDocumento,
          nombreCompleto: afiliadoResponse.NombreCompleto,
          estado: this.mapEstado(afiliadoResponse.Estado),
          plan: afiliadoResponse.PlanDescripcion,
          codigoPlan: afiliadoResponse.CodigoPlan,
          fechaVigencia: afiliadoResponse.FechaVigencia
            ? new Date(afiliadoResponse.FechaVigencia)
            : undefined,
        },
        errores: [],
      };
    } catch (error) {
      this.logger.error(`Error validando afiliado en OSDE: ${(error as Error).message}`);
      return {
        exitoso: false,
        errores: [{
          codigo: 'ERROR_CONEXION',
          mensaje: 'Error de conexión con OSDE',
          severidad: 'ERROR',
        }],
      };
    }
  }

  async validarPractica(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    fechaPractica: Date,
  ): Promise<ValidacionPractica> {
    // Implementación similar — mapear request/response de OSDE
    // a nuestra interfaz estándar
    throw new Error('Método no implementado — requiere WSDL real de OSDE');
  }

  async getNomenclador(codigoPlan?: string): Promise<Practica[]> {
    throw new Error('Método no implementado — requiere WSDL real de OSDE');
  }

  async consultarTopes(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    periodo: string,
  ): Promise<{ topeTotal: number; utilizado: number; restante: number }> {
    throw new Error('Método no implementado — requiere WSDL real de OSDE');
  }

  async solicitarAutorizacion(
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    diagnostico: string,
  ): Promise<{ autorizado: boolean; numeroAutorizacion?: string; motivo?: string }> {
    throw new Error('Método no implementado — requiere WSDL real de OSDE');
  }

  private mapEstado(estadoOSDE: string): 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'DESCONOCIDO' {
    const map: Record<string, 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'DESCONOCIDO'> = {
      'A': 'ACTIVO',
      'I': 'INACTIVO',
      'S': 'SUSPENDIDO',
    };
    return map[estadoOSDE] ?? 'DESCONOCIDO';
  }
}
```

#### Factory y Service de orquestación

```typescript
// libs/obra-social/obra-social.factory.ts

import { Injectable, Logger } from '@nestjs/common';
import { IObraSocialAdapter, ObraSocialId, ConfiguracionObraSocial } from './interfaces';

@Injectable()
export class ObraSocialAdapterFactory {
  private readonly logger = new Logger(ObraSocialAdapterFactory.name);
  private readonly adapters = new Map<ObraSocialId, IObraSocialAdapter>();

  registerAdapter(adapter: IObraSocialAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.logger.log(`Adapter registrado: ${adapter.nombre} (${adapter.id})`);
  }

  getAdapter(id: ObraSocialId): IObraSocialAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`No hay adapter registrado para la obra social: ${id}`);
    }
    return adapter;
  }

  hasAdapter(id: ObraSocialId): boolean {
    return this.adapters.has(id);
  }

  getRegisteredIds(): ObraSocialId[] {
    return Array.from(this.adapters.keys());
  }
}
```

```typescript
// libs/obra-social/obra-social.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ObraSocialAdapterFactory } from './obra-social.factory';
import {
  IObraSocialAdapter,
  ObraSocialId,
  ResultadoValidacionAfiliado,
  ValidacionPractica,
  Practica,
} from './interfaces';

@Injectable()
export class ObraSocialService {
  private readonly logger = new Logger(ObraSocialService.name);

  constructor(private readonly factory: ObraSocialAdapterFactory) {}

  /**
   * Valida un afiliado en una obra social específica
   */
  async validarAfiliado(
    obraSocialId: ObraSocialId,
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPlan?: string,
  ): Promise<ResultadoValidacionAfiliado> {
    const adapter = this.getAdapterOrFail(obraSocialId);
    return adapter.validarAfiliado(tipoDocumento, numeroDocumento, codigoPlan);
  }

  /**
   * Valida una práctica para un afiliado en una obra social específica
   */
  async validarPractica(
    obraSocialId: ObraSocialId,
    tipoDocumento: string,
    numeroDocumento: string,
    codigoPractica: string,
    fechaPractica: Date = new Date(),
  ): Promise<ValidacionPractica> {
    const adapter = this.getAdapterOrFail(obraSocialId);
    return adapter.validarPractica(tipoDocumento, numeroDocumento, codigoPractica, fechaPractica);
  }

  /**
   * Obtiene el nomenclador de una obra social
   */
  async getNomenclador(
    obraSocialId: ObraSocialId,
    codigoPlan?: string,
  ): Promise<Practica[]> {
    const adapter = this.getAdapterOrFail(obraSocialId);
    return adapter.getNomenclador(codigoPlan);
  }

  private getAdapterOrFail(id: ObraSocialId): IObraSocialAdapter {
    try {
      return this.factory.getAdapter(id);
    } catch {
      throw new NotFoundException(
        `La obra social "${id}" no está disponible. ` +
        `Obra sociales configuradas: ${this.factory.getRegisteredIds().join(', ')}`,
      );
    }
  }
}
```

#### Módulo NestJS

```typescript
// libs/obra-social/obra-social.module.ts

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObraSocialService } from './obra-social.service';
import { ObraSocialAdapterFactory } from './obra-social.factory';
import { ObraSocialId } from './interfaces';

// Adapter implementations (lazy-loaded)
// import { OsdeAdapter } from './adapters/osde.adapter';
// import { SwissMedicalAdapter } from './adapters/swiss-medical.adapter';

@Module({})
export class ObraSocialModule {
  static forRoot(): DynamicModule {
    return {
      module: ObraSocialModule,
      imports: [ConfigModule],
      providers: [
        ObraSocialAdapterFactory,
        ObraSocialService,
        // Los adapters se registran dinámicamente según la configuración
        {
          provide: 'OBRA_SOCIAL_ADAPTERS',
          useFactory: (configService: ConfigService) => {
            const adapters: Provider[] = [];
            const enabledOS = configService.get<string[]>('OBRA_SOCIALES_HABILITADAS') ?? [];

            // Registrar adapters según configuración
            // Ejemplo:
            // if (enabledOS.includes('osde')) {
            //   adapters.push({
            //     provide: OsdeAdapter,
            //     useFactory: () => new OsdeAdapter({
            //       wsdlUrl: configService.get('OSDE_WSDL_URL')!,
            //       username: configService.get('OSDE_USERNAME')!,
            //       password: configService.get('OSDE_PASSWORD')!,
            //     }),
            //   });
            // }

            return adapters;
          },
          inject: [ConfigService],
        },
      ],
      exports: [ObraSocialService, ObraSocialAdapterFactory],
    };
  }
}
```

### 6.4 Manejo de errores

```typescript
// libs/obra-social/interceptors/soap-error.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ObraSocialError } from '../errors/obra-social.error';

export enum ObraSocialErrorCode {
  CONEXION = 'OBRA_SOCIAL.CONEXION',
  TIMEOUT = 'OBRA_SOCIAL.TIMEOUT',
  AUTENTICACION = 'OBRA_SOCIAL.AUTENTICACION',
  AFILIADO_NO_ENCONTRADO = 'OBRA_SOCIAL.AFILIADO_NO_ENCONTRADO',
  PRACTICA_NO_CUBIERTA = 'OBRA_SOCIAL.PRACTICA_NO_CUBIERTA',
  TOPE_EXCEDIDO = 'OBRA_SOCIAL.TOPE_EXCEDIDO',
  SIN_AUTORIZACION = 'OBRA_SOCIAL.SIN_AUTORIZACION',
  WSDL_INVALIDO = 'OBRA_SOCIAL.WSDL_INVALIDO',
  RESPUESTA_INESPERADA = 'OBRA_SOCIAL.RESPUESTA_INESPERADA',
  OS_NO_CONFIGURADA = 'OBRA_SOCIAL.OS_NO_CONFIGURADA',
}

export class ObraSocialError extends Error {
  constructor(
    public readonly code: ObraSocialErrorCode,
    message: string,
    public readonly obraSocialId?: string,
    public readonly originalError?: Error,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ObraSocialError';
  }
}

@Injectable()
export class SoapErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SoapErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        this.logger.error(`SOAP Error: ${error.message}`, error.stack);

        // Mapear errores SOAP conocidos
        if (error.root?.Envelope?.Body?.Fault) {
          const fault = error.root.Envelope.Body.Fault;
          return throwError(() => new ObraSocialError(
            ObraSocialErrorCode.RESPUESTA_INESPERADA,
            `Error SOAP: ${fault.faultstring}`,
            undefined,
            error,
            { faultCode: fault.faultcode, detail: fault.detail },
          ));
        }

        // Timeout
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
          return throwError(() => new ObraSocialError(
            ObraSocialErrorCode.TIMEOUT,
            'Timeout al conectar con la obra social',
            undefined,
            error,
          ));
        }

        // Conexión
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return throwError(() => new ObraSocialError(
            ObraSocialErrorCode.CONEXION,
            'Error de conexión con la obra social',
            undefined,
            error,
          ));
        }

        return throwError(() => new ObraSocialError(
          ObraSocialErrorCode.RESPUESTA_INESPERADA,
          error.message,
          undefined,
          error,
        ));
      }),
    );
  }
}
```

### 6.5 Caché y performance

```typescript
// libs/obra-social/cache/nomenclador.cache.ts

import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class NomencladorCacheService {
  private readonly logger = new Logger(NomencladorCacheService.name);
  private readonly CACHE_PREFIX = 'nomenclador:';
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 horas

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async get(obraSocialId: string, codigoPlan?: string): Promise<any[] | null> {
    const key = this.buildKey(obraSocialId, codigoPlan);
    try {
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache HIT para ${key}`);
        return cached as any[];
      }
      this.logger.debug(`Cache MISS para ${key}`);
      return null;
    } catch {
      return null;
    }
  }

  async set(obraSocialId: string, practicas: any[], codigoPlan?: string): Promise<void> {
    const key = this.buildKey(obraSocialId, codigoPlan);
    try {
      await this.cacheManager.set(key, practicas, this.CACHE_TTL);
      this.logger.log(`Nomenclador cacheado para ${key} (${practicas.length} prácticas)`);
    } catch (error) {
      this.logger.warn(`Error cacheando nomenclador: ${(error as Error).message}`);
    }
  }

  async invalidate(obraSocialId: string, codigoPlan?: string): Promise<void> {
    const key = this.buildKey(obraSocialId, codigoPlan);
    try {
      await this.cacheManager.del(key);
    } catch {
      // Silenciar errores de cache
    }
  }

  private buildKey(obraSocialId: string, codigoPlan?: string): string {
    return `${this.CACHE_PREFIX}${obraSocialId}:${codigoPlan ?? 'todos'}`;
  }
}
```

#### Estrategia de caché recomendada

| Dato | TTL | Estrategia | Justificación |
|------|-----|------------|---------------|
| **Nomenclador completo** | 24h | Cache en memoria + Redis | Cambia muy poco — quizás mensual |
| **Validación de afiliado** | 5min | No cachear (siempre fresco) | El estado puede cambiar por baja/alta |
| **Topes de prácticas** | 1h | Cache por afiliado + práctica | Se consumen durante el mes |
| **Planes disponibles** | 24h | Cache estático | Cambian raramente |
| **WSDL parseado** | Infinito (solo re-parsear al iniciar) | Cache en memoria | No cambia en runtime |

### 6.6 Rate limiting y circuit breaker

```typescript
// libs/obra-social/guards/circuit-breaker.ts

@Injectable()
export class CircuitBreaker {
  private failures = new Map<string, { count: number; lastFailure: Date }>();
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT = 60_000; // 1 minuto

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const state = this.getState(key);

    if (state === 'OPEN') {
      throw new Error(`Circuit breaker OPEN para ${key}`);
    }

    try {
      const result = await fn();
      this.reset(key);
      return result;
    } catch (error) {
      this.recordFailure(key);
      throw error;
    }
  }

  private getState(key: string): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    const state = this.failures.get(key);
    if (!state) return 'CLOSED';

    if (state.count >= this.FAILURE_THRESHOLD) {
      const elapsed = Date.now() - state.lastFailure.getTime();
      return elapsed >= this.RESET_TIMEOUT ? 'HALF_OPEN' : 'OPEN';
    }

    return 'CLOSED';
  }

  private recordFailure(key: string): void {
    const current = this.failures.get(key);
    this.failures.set(key, {
      count: (current?.count ?? 0) + 1,
      lastFailure: new Date(),
    });
  }

  private reset(key: string): void {
    this.failures.delete(key);
  }
}
```

### 6.7 Variables de entorno

```env
# .env — Configuración de Obras Sociales

# Obra Social — OSDE
OSDE_ENABLED=true
OSDE_WSDL_URL=https://ws.osde.com.ar/prestadores?wsdl
OSDE_ENDPOINT_URL=https://ws.osde.com.ar/prestadores
OSDE_USERNAME=cuit_del_prestador
OSDE_PASSWORD=clave_del_prestador
OSDE_TIMEOUT=30000

# Obra Social — Swiss Medical
SWISS_ENABLED=true
SWISS_WSDL_URL=https://ws.swissmedical.com.ar/prestadores?wsdl
SWISS_USERNAME=cuit_del_prestador
SWISS_PASSWORD=clave_del_prestador

# Credenciales por tenant (multi-tenancy)
# Cada clínica puede tener credenciales distintas para la misma OS
TENANT_{TENANT_ID}_OSDE_USERNAME=cuit_prestador_tenant
TENANT_{TENANT_ID}_OSDE_PASSWORD=clave_prestador_tenant
```

---

## 7. Marco Legal y Regulatorio

### 7.1 Leyes principales

| Ley | Descripción | Relevancia |
|-----|-------------|------------|
| **Ley 23.660** | Creación del Sistema Nacional del Seguro de Salud | Marco legal de las obras sociales |
| **Ley 23.661** | Consolidación del sistema — define obras sociales como agentes del seguro | Define la obligatoriedad de cobertura |
| **Ley 26.682** | Regulación de Medicina Prepaga | Regula a OSDE, Swiss Medical como prepaga |
| **Ley 24.754** | Creación de la SSSalud | Establece el órgano de control |
| **Ley 25.649** | Derecho de opción de obra social | Permite al trabajador elegir OS |
| **Res. SSS N°887/17** | Mecanismo de integración — facturación prestadores | Regula cómo facturar a OS |
| **Resolución AFIP 1415/18** | Facturación electrónica obligatoria | Obliga a emitir factura electrónica |
| **Ley 25.326** | Protección de datos personales | Regula manejo de datos de pacientes |

### 7.2 Regulaciones sobre servicios web

> **No existe una regulación específica** que obligue a las obras sociales a proveer servicios web o APIs públicas. Sin embargo:

1. **Resolución SSS**: Puede emitir resoluciones que fomenten la digitalización
2. **Ley de Acceso a la Información Pública**: Podría argumentarse que la información de padrones es pública
3. **Facturación electrónica AFIP**: Impulsa la digitalización del circuito completo
4. **En la práctica**: Las OS que tienen web services lo hacen por eficiencia propia, no por obligación legal

### 7.3 Privacidad de datos (pacientes)

Al integrar con obras sociales, nuestro sistema manejará datos sensibles de pacientes:

| Dato | Sensibilidad | Regulación |
|------|-------------|------------|
| DNI del paciente | Alta | Ley 25.326 |
| Nombre completo | Media | Ley 25.326 |
| Estado de afiliación | Media | Protegido por la OS |
| Historial de prácticas | Alta | Ley 25.326 + secreto médico |
| Datos de grupo familiar | Alta | Ley 25.326 |

#### Medidas de compliance necesarias

1. **Cifrado en tránsito (TLS)**: Todas las conexiones SOAP deben ser HTTPS
2. **Cifrado en reposo**: Las credenciales de OS y datos de afiliados deben estar encriptados
3. **No almacenar datos sensibles innecesarios**: Validar y descartar, no persistir
4. **Logs sanitizados**: No loguear DNIs completos ni datos de salud
5. **Consentimiento del paciente**: Informar que se validará su afiliación electrónicamente
6. **Registro ante la AAIP**: Si almacenamos datos personales, evaluar registro

### 7.4 Requisitos para ser software provider

No existe un registro formal de "proveedores de software para obras sociales". Sin embargo:

1. **Inscripción como prestador**: A través de un círculo odontológico o directamente
2. **Convenios con OS**: Si se opera a escala, negociar convenios formales
3. **Seguridad**: Demostrar medidas de seguridad adecuadas
4. **Auditoría**: Estar preparado para auditorías de las OS
5. **Disponibilidad**: Garantizar uptime razonable (99%+)

---

## 8. Enfoques Alternativos

### 8.1 Middleware / Gateway de agregación

> **NO se encontró un gateway público** que unifique las APIs de todas las obras sociales. Las razones:

1. Cada OS tiene su propio sistema, nomenclador y reglas
2. No hay incentivo económico para que un tercero construya y mantenga un gateway
3. Los datos de autenticación son privados por prestador
4. DentalTec ha construido efectivamente un gateway privado, pero es parte de su producto

### 8.2 SSS como API unificada

La SSSalud ofrece:

| Servicio | Tipo | Acceso programático |
|----------|------|-------------------|
| Padrón de Beneficiarios | Web (formulario) | **NO** — solo consulta manual |
| Padrón de Opciones | Web (formulario) | **NO** — solo consulta manual |
| Padrón de Monotributo | Web (formulario) | **NO** — solo consulta manual |
| Consulta de Integración | Web (formulario) | **NO** — solo consulta manual |
| Mi SSSalud | Portal con Clave Fiscal | **NO** — para trámites humanos |

> **No hay API pública de la SSSalud**. Todo es a través de formularios web que requieren Clave Fiscal (AFIP) nivel 3.

### 8.3 Padrones (bases de datos de afiliados)

Los padrones son consultables a través de:

1. **SSSalud** — Padrón Nacional de Beneficiarios (solo web manual)
2. **Cada OS** — A través de sus portales de prestadores o web services
3. **AFIP** — Datos de monotributistas y empleados

No hay un padrón único y accesible programáticamente.

### 8.4 Servicios comerciales de terceros

| Servicio | Descripción | Viabilidad |
|----------|-------------|-----------|
| **DentalTec** | Software completo con integración SOAP | **Competidor**, no proveedor de servicios |
| **Círculos odontológicos** | Algunos ofrecen validación a sus matriculados | **Parcial** — solo para miembros del círculo |
| **Consultoras de salud** | Pueden facilitar contactos con OS | **Bajo nivel** — no dan acceso técnico |
| **AFIP (ARCA)** | Facturación electrónica | **Complementario** — no reemplaza validación OS |

### 8.5 Web scraping como alternativa (no recomendado)

Algunos sistemas intentan hacer scraping de los portales web de las OS para validar afiliados. **Esto NO es recomendable** porque:

1. **Legalmente cuestionable**: Puede violar términos de servicio
2. **Fragil**: Cambios en el portal rompen el scraper
3. **Lento**: Mucho más lento que un web service
4. **No confiable**: Sin garantía de que los datos sean correctos
5. **Sin soporte**: No hay nadie a quien recurrir si falla

### 8.6 Recomendación de enfoque

```
ENFOQUE RECOMENDADO: Patrón Adapter directo (como DentalTec)

1. Construir el framework de adapters (inversión única)
2. Implementar adapters para cada OS según demanda de clientes
3. Usar credenciales de los prestadores (nuestros clientes)
4. No depender de gateways externos
5. Cachear nomencladores para reducir llamadas
6. Implementar validación preventiva (el diferencial de DentalTec)
```

---

## 9. Roadmap de implementación sugerido

### Fase 0: Preparación (2-4 semanas)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Obtener credenciales de al menos 1 OS (idealmente OSDE o Swiss Medical) | Alto | P0 |
| Obtener WSDL real de esa OS | Medio | P0 |
| Documentar WSDL (operaciones, tipos, errores) | Medio | P0 |
| Definir estructura de datos estándar (interfaces) | Bajo | P0 |
| Configurar infraestructura de credenciales seguras | Medio | P0 |

### Fase 1: Framework base (3-4 semanas)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Implementar `BaseObraSocialAdapter` | Medio | P0 |
| Implementar `ObraSocialAdapterFactory` | Bajo | P0 |
| Implementar `ObraSocialService` (facade) | Medio | P0 |
| Implementar manejo de errores robusto | Medio | P0 |
| Implementar caché de nomencladores | Medio | P1 |
| Implementar circuit breaker | Medio | P1 |
| Implementar logging y auditoría | Medio | P1 |
| Tests unitarios del framework | Alto | P0 |

### Fase 2: Primer adapter funcional (4-6 semanas)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Implementar primer adapter concreto (ej: OSDE) | Alto | P0 |
| Mapear WSDL a interfaces estándar | Alto | P0 |
| Probar con datos reales (producción) | Medio | P0 |
| Implementar validación de afiliado | Alto | P0 |
| Implementar validación de práctica | Alto | P0 |
| Implementar consulta de nomenclador | Medio | P1 |
| Integrar con módulo de pacientes existente | Medio | P0 |
| Tests de integración | Alto | P0 |

### Fase 3: UI e integración (3-4 semanas)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Botón "Validar Afiliado" en ficha del paciente | Medio | P0 |
| Indicador de cobertura en tiempo real | Medio | P0 |
| Alertas de errores de validación | Bajo | P0 |
| Pantalla de configuración de OS por tenant | Medio | P0 |
| Historial de validaciones | Bajo | P2 |

### Fase 4: Escalar a más OS (2-4 semanas por OS)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Implementar adapter Swiss Medical | Alto | P1 |
| Implementar adapter Jerárquicos | Alto | P1 |
| Implementar adapter Sancor | Alto | P1 |
| Implementar adapter para OS provinciales | Alto | P2 |
| Optimizar rendimiento con múltiples OS | Medio | P2 |

### Fase 5: Funcionalidades avanzadas (4-6 semanas)

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| Validación de topes de frecuencia | Medio | P1 |
| Solicitud de autorizaciones | Alto | P1 |
| Generación de planillas de facturación | Alto | P1 |
| Integración con facturación electrónica AFIP | Alto | P1 |
| Dashboard de débitos | Medio | P2 |
| Re-facturación de prácticas rechazadas | Medio | P2 |

### Estimación total

| Fase | Tiempo | Acumulado |
|------|--------|-----------|
| Fase 0 | 2-4 sem | 2-4 sem |
| Fase 1 | 3-4 sem | 5-8 sem |
| Fase 2 | 4-6 sem | 9-14 sem |
| Fase 3 | 3-4 sem | 12-18 sem |
| Fase 4 | 2-4 sem/OS | Variable |
| Fase 5 | 4-6 sem | 16-24 sem |

**Estimación realista para un MVP (1 OS, validación básica)**: **3-4 meses** con un desarrollador senior dedicado.

**Estimación para cobertura completa (17 OS, todas las funcionalidades)**: **12-18 meses** con equipo.

---

## 10. Conclusiones y recomendaciones

### Hallazgos principales

1. **No hay estándar único**: Cada obra social es un mundo propio. No hay un WSDL universal ni una API unificada. Esto requiere un **patrón Adapter** sólido.

2. **SOAP es el rey**: Todo el ecosistema usa SOAP. No hay escape. `strong-soap` es la mejor opción en Node.js.

3. **La información técnica es cerrada**: Los WSDLs, documentación y credenciales no son públicos. Se obtienen a través del registro como prestador. Esto es el mayor barrier to entry.

4. **DentalTec es la referencia**: Es el único sistema que integra 17+ OS con validación preventiva en tiempo real. Su arquitectura de adaptadores SOAP es el modelo a seguir.

5. **El diferencial es la validación preventiva**: El 64% de reducción en débitos no viene de facturar mejor, sino de **validar antes de facturar**. Esto es lo que hace que la integración valga la pena.

6. **No hay sandbox**: Las pruebas son contra producción. Hay que ser cuidadosos.

7. **El modelo de negocio funciona**: DentalTec tiene 2.000+ profesionales activos pagando por el servicio. El ROI está en los débitos evitados y el tiempo administrativo ahorrado.

### Recomendaciones

#### Para nuestro sistema:

1. **Priorizar OSDE y Swiss Medical** como primeras integraciones — son las más grandes y probablemente las más solicitadas.

2. **Construir el framework de adapters primero** — es la inversión que se amortiza con cada nueva OS.

3. **Obtener credenciales reales ANTES de codificar** — no tiene sentido escribir código sin un WSDL real contra el cual probar.

4. **No intentar integrar las 17 OS de golpe** — empezar con 1-2 y escalar según demanda de clientes.

5. **La validación preventiva es el MVP correcto** — antes de facturación electrónica, antes de planillas, lo primero es validar que el afiliado es legible y la práctica está cubierta.

6. **El módulo de mutuales que ya existe (PRD)** es complementario — nuestro PRD actual maneja la información LOCAL de mutuales. La integración SOAP agrega la capacidad de VALIDAR EN TIEMPO REAL contra la OS.

7. **Multi-tenancy es clave** — cada clínica/tenant tiene credenciales distintas para cada OS. El sistema debe soportar esto desde el inicio.

#### Para la estrategia comercial:

1. **Vender la reducción de débitos** como el valor principal — "cada débito evitado es dinero que no se pierde"
2. **El primer cliente que integre** una OS real será el caso de uso que valide todo el sistema
3. **Considerar alianzas con círculos odontológicos** — ellos tienen credenciales y pueden facilitar el acceso

---

## Apéndice A: Fuentes consultadas

| Fuente | URL | Fecha |
|--------|-----|-------|
| SSSalud — Portal principal | https://www.argentina.gob.ar/sssalud | 2026-04-01 |
| SSSalud — Padrón de beneficiarios | https://www.sssalud.gob.ar/?cat=consultas&page=padron | 2026-04-01 |
| SSSalud — Consulta de integración | https://www.sssalud.gob.ar/index.php?page=integracion | 2026-04-01 |
| SSSalud — Prestadores | https://www.argentina.gob.ar/sssalud/prestadores | 2026-04-01 |
| COMRA — Nomenclador Nacional | https://comra.org.ar (PDF nomenclador) | 2026-04-01 |
| Círculo Odontológico Mendoza — Nomenclador | https://circulo.com.org.ar (PDF nomenclador) | 2026-04-01 |
| PAMI — Nomenclador Único | https://prestadores.pami.org.ar/bot_nomenclador_unico.php | 2026-04-01 |
| Swiss Medical — Ser Prestador | https://www.swissmedical.com.ar/prestadores/informacionutil/ser-prestador | 2026-04-01 |
| strong-soap — npm | https://www.npmjs.com/package/strong-soap | 2026-04-01 |
| AFIP/ARCA — Facturación electrónica | https://www.afip.gob.ar/fe | 2026-04-01 |
| DentalTec — Funcionalidades | https://web.dentaltec.com.ar/funcionalidades | 2026-04-01 |
| Tándem Digital (DentalTec) | https://tandemdigital.net | 2026-04-01 |
| OSSECAC — Portal prestadores | https://prestadores.osecac.org.ar | 2026-04-01 |
| OSPM — Portal prestadores | https://www.prestadores.ospm.org.ar | 2026-04-01 |
| Apross — Nomencladores | https://www.apross.gov.ar/prestadores/nomencladores | 2026-04-01 |
| CSS — Nomenclador odontológico | https://css.gov.ar/detalle-de-nomenclador-odontologico | 2026-04-01 |
| ISSN — Consulta Nomenclador | https://www.issn.gov.ar/prestadores/consulta-nomenclador | 2026-04-01 |
| Legisalud — Nomenclador prestaciones | http://www.legisalud.gov.ar/pdf (Nomenclador) | 2026-04-01 |
| Referencia DentalTec (interna) | docs/investigacion/referencia-dentaltec.md | 2026-04-01 |
| PRD Mutuales y Obras Sociales (interna) | docs/prd/2026-03-30-mutuales-obras-sociales.md | 2026-04-01 |

---

## Apéndice B: Glosario

| Término | Definición |
|---------|-----------|
| **Afiliado** | Persona cubierta por una obra social (paciente) |
| **Afiliado legible** | Afiliado con cobertura vigente y activa |
| **Coseguro** | Parte del costo de una práctica que paga el paciente |
| **Cora** | Confederación Odontológica de la República Argentina |
| **Crédito** | Práctica facturada reconocida y pagada por la OS |
| **Débito** | Práctica facturada rechazada por la OS |
| **Federación** | Agrupación de círculos odontológicos a nivel regional |
| **Integrante** | Miembro del grupo familiar de un afiliado |
| **Nomenclador** | Catálogo codificado de prestaciones con aranceles |
| **Padrón** | Base de datos de afiliados de una obra social |
| **Planilla** | Conjunto de prácticas facturadas en un período |
| **Práctica** | Prestación odontológica facturada a una obra social |
| **Prestador** | Profesional de la salud inscripto para atender afiliados |
| **SSSalud** | Superintendencia de Servicios de Salud — órgano regulador |
| **Tope** | Límite máximo de veces que se puede realizar una práctica |
| **Validación preventiva** | Verificar que una práctica será reconocida ANTES de facturarla |
| **WSDL** | Web Services Description Language — describe la interfaz de un servicio SOAP |
| **SOAP** | Simple Object Access Protocol — protocolo de servicios web basado en XML |

---

## Apéndice C: Diagramas de flujo

### C.1 Flujo de validación de afiliado

```
[Recepción/Paciente]
        │
        ▼
[Ingresar DNI del paciente]
        │
        ▼
[Seleccionar Obra Social]
        │
        ▼
[Llamar: validarAfiliado(dni, os)]
        │
        ├──► [SOAP Request a OS] ──► [OS consulta padrón]
        │                                    │
        │◄─── [SOAP Response] ◄────────────┘
        │
        ▼
[¿Afiliado ACTIVO?]
        │
   SÍ   │   NO
   ▼    │    ▼
[Mostrar datos]  [Mostrar error]
[Plan, vigencia] [Motivo del rechazo]
        │
        ▼
[Continuar atención]
```

### C.2 Flujo de validación de práctica

```
[Odontólogo carga práctica]
        │
        ▼
[Llamar: validarPractica(dni, codigoPractica, fecha)]
        │
        ├──► [SOAP Request a OS]
        │    ├── ¿Afiliado legible?
        │    ├── ¿Práctica cubierta?
        │    ├── ¿Tope disponible?
        │    └── ¿Autorización vigente?
        │
        │◄─── [SOAP Response]
        │
        ▼
[¿Práctica válida?]
        │
   SÍ   │   NO
   ▼    │    ▼
[Registrar]  [Mostrar error con código]
[Práctica]   [Ej: "Tope excedido"]
        │    [Ej: "Requiere autorización"]
        ▼
[Continuar con atención]
```

### C.3 Flujo de facturación

```
[Fin de período (mes)]
        │
        ▼
[Cerrar planilla del mes]
        │
        ▼
[Auditoría interna]
[Verificar datos completos]
[Verificar afiliaciones vigentes]
[Verificar prácticas cubiertas]
        │
        ▼
[Generar planilla]
        │
        ▼
[Presentar a Obra Social]
[vía SOAP, portal o FTP]
        │
        ▼
[Generar factura electrónica AFIP]
        │
        ▼
[Esperar liquidación (30-90 días)]
        │
        ▼
[Recibir resultado]
        │
   ┌────┴────┐
   ▼         ▼
[Créditos] [Débitos]
[Prácticas [Prácticas
 reconocidas] rechazadas]
   │         │
   ▼         ▼
[Registrar  [Analizar
 pago]      motivos]
            │
            ▼
       [Re-facturar
        si aplica]
```

---

*Documento generado como parte de la investigación SDD Explore para el sistema odontológico. La información sobre web services específicos de cada obra social está basada en investigación pública y puede requerir verificación directa con cada OS para obtener detalles técnicos exactos.*
