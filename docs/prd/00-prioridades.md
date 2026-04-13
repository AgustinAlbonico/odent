# Prioridades de PRDs — Sistema Odontológico

> **Fecha**: 2026-03-30
> **Estado**: en preparación

---

## Orden de prioridad definido

Este orden se definió a partir del relevamiento funcional de CLINICUS y del pedido del usuario.

### P0 — Fundacional

1. **Autenticación y Autorización**
   - Base de acceso al sistema.
   - Define identidad, sesiones, recuperación de acceso y permisos granulares por rol.
   - Condiciona qué puede ver y hacer cada actor en todos los módulos restantes.

### P1 — Operación diaria crítica

2. **Pacientes**
   - Entidad central del negocio.
   - Conecta historia clínica, turnos, mutuales, cuenta corriente, recetas y depósitos.

3. **Turnos y Agenda**
   - Organiza la disponibilidad operativa de la clínica.
   - Impacta en recepción, profesionales, asistencia y ausentismo.

4. **Odontograma**
   - Núcleo clínico de la atención odontológica.
   - Registra prácticas, piezas, caras, estados y trazabilidad clínica.

5. **Historia Clínica / Ficha Clínica**
   - Consolida antecedentes, notas, adjuntos, audio y cronología de atención.

6. **Cuenta Corriente / Contabilidad**
   - Sostiene la trazabilidad económica, cobros, pagos, comisiones y reportes.

### P2 — Soporte clínico y administrativo de alto valor

7. **Depósitos**
   - Clave para ortodoncia y tratamientos con pagos a cuenta.

8. **Mutuales / Obras Sociales**
   - Determina cobertura, afiliación, planes y reglas de facturación/coseguro.

9. **Llamador de Pacientes**
   - Mejora el flujo de sala de espera y coordinación operativa.

10. **Recetas**
    - Requiere trazabilidad clínica y reglas regulatorias.

11. **Presupuestos**
    - Ordena la propuesta económica previa al tratamiento y su aprobación.

12. **Profesionales**
    - Administra perfil, horarios, excepciones, mutuales y validaciones regulatorias.

### P3 — Parametrización y adopción

13. **Configuración del Sistema**
    - Reúne parámetros institucionales, catálogos y defaults operativos.

14. **Ayuda y Onboarding**
    - Facilita adopción, capacitación y uso consistente del sistema.

---

## Criterios usados para priorizar

- **Dependencia transversal**: si el módulo condiciona el funcionamiento de varios otros.
- **Impacto operativo diario**: si afecta tareas frecuentes de recepción, profesionales o administración.
- **Riesgo clínico o financiero**: si un error compromete trazabilidad, atención o caja.
- **Madurez observada en el relevamiento**: profundidad funcional realmente detectada en CLINICUS.
- **Valor para una futura etapa de implementación**: capacidad de transformar el PRD en roadmap o épica.

---

## Notas de alcance

- El módulo de **Autenticación y Autorización** no está exhaustivamente detallado en el relevamiento, por lo que su PRD se construye combinando:
  - evidencia indirecta del sistema actual,
  - roles inferidos/observados,
  - y el detalle adicional provisto por el usuario.
- El resto de los PRDs se apoya principalmente en evidencia observada en:
  - `docs/investigacion/relevamiento-clinicus.md`
  - `docs/investigacion/investigacion-mercado-software-odontologico-argentina.md`
