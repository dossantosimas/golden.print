# ADR-004 — Dominio financiero decimal y evidencia contractual estable

Fecha: 2026-10-02 · Decisores: propietario/equipo técnico (pendiente).

## Status

Proposed; seguimiento un mes tras aceptación por nuevo registro. No afirmar exactitud runtime sin tests posteriores.

## Context

Usuario confirmó PP dentro del costo antes de multiplicar 2/2.5/3 y contingencia solo material. Variables editables y fallos de impresión exigen separar estimación, costo económico real y caja. Cambiar tarifa actual no debe reescribir una oferta enviada; distintos cálculos en pantallas/PDF pueden crear evidencia contradictoria.

## Decision

Centralizar reglas de FINANCIAL_RULES en funciones puras decimal.js con precisión 80 y transporte string. Guardar inputs, versión de fórmula, componentes y precio final de revisión publicada; publicadas inmutables, modificaciones generan otra revisión. Calcular precio cobrable desde precisión completa y half-up a COP entero antes de cuantizar componentes numeric(18,6). Costos reales y ledger/caja tienen registros distintos con origen exclusivo y auditoría.

## Alternatives Considered

| Opción | Pros | Cons | Resolución |
|---|---|---|---|
| Dominio decimal común + snapshots tipados | Igualdad de fórmula entre superficies; preserva contrato y trazabilidad | Mantener versión/revisiones y tests; precisión/escala deben coordinarse | Elegida: corrige principal riesgo estructural |
| number JS y fórmula repetida en cada pantalla | Menos código inicial; UI fácil | Redondeo binario, divergencia y precios históricos variables | Rechazada: inadecuada para dinero y oferta contractual |
| Todo cálculo SQL con catálogo actual | Autoridad servidor y consultas centralizadas | Recalcular históricos altera contrato; UI preview necesita duplicación o red | Rechazada para cotizador; SQL sí agrega ledger leído por dominio |
| Event sourcing completo y cierres inmutables | Reconstrucción histórica como se conocía, auditoría profunda | Infraestructura conceptual y operativa desproporcionada al MVP | Rechazada: ledger/correcciones auditadas y reportes reexpresados cubren alcance |

## Consequences

Positivo: costos/precios/PDF trazables; reimpresión no duplica pérdida; compra/consumo no duplica caja. Negativo: versiones y snapshots ocupan datos y requieren disciplina; reportes históricos pueden cambiar tras corrección legítima y deben decirlo. Neutral: revisión comercial inmutable difiere de reporte MVP current_restated, que usa datos válidos actuales por fecha efectiva; no hay cierre fiscal certificado ni stock.

## Implementation Plan

Crear financial-core y sus fixtures antes de CRUD financiero. Persistir decimal como numeric y serializar string; ratios sin denominador dan null. Publicar congela snapshot, convertir referencia revisión; registrar todos los intentos bajo mismo pedido. Consultas de resultados usan cohorte entrega/corte y costos completos/provisionales; pérdida intento ya incluida no vuelve a deducirse. Correcciones admin con razón anulan/reemplazan conservando evidencia. Rollback de nueva fórmula conserva calculador anterior por formula_version y snapshots; no recalcular ofertas antiguas.

## Fitness checks

Fixtures PP antes de multiplicador, contingencia solo material, varios filamentos, h/m/s, cero y márgenes; caso límite 1 segundo, tarifa máquina 1799.999999, multiplicador3 debe dar 1 COP, sin redondear componentes antes. Cambiar catálogo/settings no cambia precio/PDF publicado. Dos intentos fallido/exitoso acumulan costo una vez; compra y consumo solo un egreso. Reportes coinciden entre dashboard/finanzas por período/cohorte; incompletitud produce provisional. Propiedades: suma materiales independiente del orden, escalado coherente antes de redondeo y misma entrada/version misma salida.

## References

[FINANCIAL_RULES](../FINANCIAL_RULES.md), [REQUIREMENTS](../REQUIREMENTS.md), [DATABASE_DESIGN](../DATABASE_DESIGN.md), [API_DESIGN](../API_DESIGN.md), [decimal.js](https://mikemcl.github.io/decimal.js/). Fuentes oficiales y compatibilidad en TECHNOLOGY_STACK.
