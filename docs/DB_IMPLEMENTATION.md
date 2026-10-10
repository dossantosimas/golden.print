> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Persistencia implementada

El schema Drizzle PostgreSQL representa autenticación Better Auth (incluido admin y rate-limit persistente), empresa singleton, membresías, configuración, contadores, catálogos, cotizaciones versionadas, producción, ledger positivo, caja, pérdidas independientes, auditoría e idempotencia.

Los negocios utilizan UUID; auth utiliza IDs string. Importes salen del driver como string; segundos y contadores como bigint. Fechas empresariales son date e instantes timestamptz. Se preservan notas comerciales/internas y snapshots. FK compuestas impiden cruzar empresa, cotización/revisión/opción, pedido/intento y corrección. Conversión fuente tiene UNIQUE. Caja tiene fuente exclusiva y unicidad parcial activa para pago/gasto.

`getDb()` / `getPool()` son lazy; importar no requiere secretos ni conexión. Runtime usa DATABASE_URL pooled. Generar migraciones no conecta. Aplicarlas requiere MIGRATION_DATABASE_URL directa; no existe fallback al rol runtime. La URL debe mantener TLS verificado (Neon sslmode=require y verificación del certificado por el driver); no se usa rejectUnauthorized:false.

Las reglas agregadas (saldo, último admin, caja <= costo, publicación inmutable, totales, membresía activa, idempotencia hash) requieren comandos transaccionales con locks y guardas; no pueden implementarse mediante CHECK entre filas. No se afirma que las constraints por sí solas proporcionen esas garantías. updated_at/version se modifican explícitamente por servicios.

Los campos core y admin se cotejaron con documentación oficial [database](https://better-auth.com/docs/concepts/database), [admin](https://www.better-auth.com/docs/plugins/admin) y [rate-limit](https://better-auth.com/docs/concepts/rate-limit), y los campos admin con el paquete instalado Better Auth 1.7.7. El cierre de acceso requiere bootstrap/login real.

La migración inicial `drizzle/0000_lyrical_anthem.sql` se generó y aplicó a PostgreSQL local de desarrollo y pruebas (26 tablas). Los UNIQUE compuestos referenciados son constraints emitidas en CREATE TABLE, antes de añadir FK circulares con ALTER TABLE. El default bigint del contador usa SQL `1` para evitar serialización JSON de bigint en Drizzle Kit.

`production-service.ts` ejecuta producción, pedidos, costos, pagos, gastos, pérdidas y correcciones dentro del transaction context suministrado por el orquestador. Este wrapper superior conserva responsabilidad de sesión, membership revalidada e idempotencia global; el servicio verifica rol, ownership, locks, versiones, saldo y clasificaciones. Cada registro financiero y sus movimientos/auditoría se escriben en la misma transacción. Reimpresión restablece completitud pendiente; cerrar producción no inventa costos.

Validación: typecheck aislado de persistencia/production-service correcto; `npm run test:integration` pasó 11 pruebas reales PostgreSQL de concurrencia, FK, unicidad, rollback de permisos, ciclo fallo/reimpresión, correcciones append-only y ausencia de doble caja/OPEX. Estas pruebas requieren TEST_DATABASE_URL hacia una base cuyo nombre termine `_test`, explícitamente desechable; nunca usar desarrollo o producción. La suite reinicia únicamente esa base aislada. No se crean credenciales predeterminadas de acceso productivo. Integración Neon, restauración y privilegios del rol productivo siguen pendientes del entorno externo.
