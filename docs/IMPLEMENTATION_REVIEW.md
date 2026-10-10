> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Revisión de implementación

Fecha: 2026-10-03, America/Bogota. Estado: correcciones revalidadas estáticamente y siete pruebas de integración de reportes aprobadas; la entrega requiere la validación completa coordinada por el orquestador. Recursos aplicados: agentes existentes `code_reviewer` y `security_auditor`. No se certifica seguridad global de runtime.

## Hallazgos comunicados al orquestador

| ID | Severidad | Evidencia original | Problema y criterio de cierre |
|---|---|---|---|
| IMPL-01 | P1 | `src/lib/mutations.ts:14–16` | El wrapper revalida y bloquea membresía, pero no sesión. Un comando que obtuvo contexto antes de un reset/revocación puede ejecutarse después porque rol/active permanecen iguales. Revalidar sesión exacta, usuario, expiración y ausencia de impersonación dentro de la transacción antes de replay/handler; coordinar locks con revocación. QA: revocar sesión entre autenticación y mutate impide efectos y replay. |
| IMPL-02 | P1 | `src/lib/reporting.ts:34–35` | Punto de equilibrio contradice FINANCIAL_RULES: pérdidas independientes se agregan a costos fijos y quedan fuera de contribución. Debe usar MC=V-CV-OV-L y F=OF+CFdir, equilibrio=F/(MC/V). Caso V=1000,CV=400,OV=0,L=100,F=200 exige 400 COP; cálculo original da 500. QA: caso con pérdidas, contribución no positiva y costos incompletos. |
| IMPL-03 | P2 | `src/lib/app-service.ts:49–52` | Detalles de pedidos/cotizaciones y el historial de un cliente dependen de un listado global truncado a 100. Un registro anterior da NOT_FOUND aunque exista; el historial pierde entradas. Consultar detalles directamente por org/id y filtrar historia por cliente antes de paginar. El listado también necesita navegación real: no basta slice(0,100). QA: 101+ registros, detalle del más antiguo e historial de cliente cuyo registro queda fuera del primer lote global. |
| IMPL-04 | P2 | `src/lib/quote-service.ts:191–196` | revise admite revisionId histórico pero calcula revisionNumber+1 desde ese origen. Con revisión 2 existente y origen revisión 1, intenta número 2 duplicado. Calcular max+1 bajo el lock de cotización o rechazar expresamente revisar desde una revisión no actual. QA: tres revisiones secuenciales y revisión desde historial sin colisión ni modificación de evidencia publicada. |
| IMPL-05 | P2 | `src/lib/reporting.ts:37` | El ranking toma todos los pedidos confirmados sin corte temporal para cantidad, saldo y último pedido, mientras pagos sí se cortan. Una consulta histórica puede incluir saldo de pedidos confirmados después del corte. Aplicar el mismo límite de confirmación que cartera global y documentar bases de cantidad/ventas. QA: pedido confirmado después del corte no aporta al saldo histórico. |

Las referencias de línea identifican el código revisado antes de correcciones y pueden desplazarse.

## Revalidación y evidencia

- IMPL-01: corregido estáticamente. `mutate` comprueba sesión por ID/usuario/expiración dentro de la transacción y aplica lock share antes de replay/handler. Prueba específica de revocación corresponde a QA de acceso; no fue ejecutada por esta revisión.
- IMPL-02: corregido y probado: contribución incluye pérdidas independientes, costos fijos las excluyen; oráculo 400 COP pasa.
- IMPL-03: detalle e historial corregidos estáticamente con consultas directas por ID/cliente. La navegación de listados sobre 100 registros todavía requiere validación de implementación/UX del orquestador.
- IMPL-04: corregido estáticamente: número nuevo deriva de MAX bajo el lock de cotización. QA de revisiones se coordina en el suite de cotizaciones.
- IMPL-05: corregido y probado: pedidos confirmados después del corte quedan fuera del saldo/cantidad del ranking consultado.

Ejecutado el 2026-10-03: `node node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts tests/reporting.integration.test.ts` → **7/7 pasan**. PostgreSQL real de Docker, base dedicada `golden_print_reporting_test`, `getDb` real, sin mocks financieros ni mocks de acceso/conexión. El suite crea la base si no existe, rechaza una organización ajena y elimina únicamente sus fixtures por actor/IDs; no usa DROP/TRUNCATE. Las migraciones permanecen.

Oráculos comprobados: cohorte entregada contra recaudo por fecha, anticipo de otro período, costos de trabajo pendiente excluidos, costos fallidos descontados una vez, compra de filamento solo en caja, equilibrio con pérdidas, fronteras UTC/Bogota, cartera histórica, corrección de costo 100→120, costos incompletos, salida sin datos financieros para operador, ausencia de ventas, contribución negativa y conservación de ventas archivadas. Sin costos fijos: equilibrio cero, progreso indefinido.

`node node_modules/typescript/bin/tsc --noEmit` también pasó durante esta revisión. No se infiere build/E2E global de estos resultados.

## Controles observados

- Autenticación pública tiene lista explícita de rutas permitidas; las rutas genéricas del plugin admin no se exponen por HTTP.
- Gestión de usuarios revisa sesión administrativa y conserva al menos un administrador activo. Cambios de membresía y revocación de sesiones se confirman juntos.
- Mutaciones comerciales usan transacciones, hash de entrada y advisory lock de idempotencia; los resultados previos se consultan antes de escribir efectos nuevos.
- Handler PDF selecciona una lista comercial explícita y no pasa costos, fórmula o notas internas al renderer. IDs están unidos a empresa/cotización; respuesta private/no-store.
- Cotizador decimal calcula precios cobrables antes de cuantizar subtotales; postprocesado se incluye antes de aplicar multiplicadores.
- Reportes usan cohorte de entrega para ventas/costos/cobro y caja por fecha efectiva; subtotal de intentos fallidos no se vuelve a descontar de utilidad.
- Corrección de costos conserva original anulado y reemplazo; migra referencias de desembolsos vigentes sin registrar nuevos egresos.

## Pendiente para aceptación

Completar QA de concurrencia, revocación, frontera COP y PDF, navegación de todos los registros y E2E. Typecheck/build no sustituyen estas comprobaciones. Actualizar PROJECT_STATUS para reflejar aprobación, implementación y validaciones ejecutadas; durante la revisión inicial aún contenía textos de espera/sin código dentro de In Progress.

## Cierre de QA local del orquestador — 2026-10-03

Después de las correcciones, pasan 30 pruebas PostgreSQL, 9 unitarias y 4 de navegador. IMPL-01 queda probado por access.integration.test.ts; IMPL-02/05 por reporting.integration.test.ts; IMPL-04 por quotes.integration.test.ts; IMPL-03 tiene consulta directa y navegación paginada SQL (400 páginas en carga). E2E cubre cotizar/convertir/fallar/reimprimir/costos/abonos/entregar. Rendimiento final: ver performance-results.json y VALIDATION_REPORT.md. Los cambios finales de agregación SQL fueron verificados por los oráculos financieros existentes; no recibieron una nueva revisión humana independiente.
