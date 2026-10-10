# Mejoras pendientes

Propuestas al 2026-10-09. No son funcionalidades implementadas por esta actualización.

| ID / prioridad | Trabajo | Finalización verificable |
|---|---|---|
| GP-SEC-01 / P0 | Revisar y rotar secretos expuestos | Revocación, dependientes actualizados y acceso comprobado sin valores en logs |
| GP-OPS-01 / P0 | Ensayar respaldo/restauración | Recuperación en base aislada, reconciliación y runbook con evidencia |
| GP-TEST-01 / P1 | Base desechable reproducible de integración | Suites/migraciones independientes de producción |
| GP-FIN-01 / P1 | Conciliación de venta, cobro, cartera y caja | Casos de fecha, archivo, corrección y pago parcial sin doble conteo |
| GP-DOMAIN-01 / P1 | Regresiones de cantidad y compras repetidas | Cantidad 1/2, edición/duplicado sin doble multiplicación; reintento único y compra nueva distinta |
| GP-AUTH-01 / P1 | Verificar política de 8 horas | Definir absoluto/inactividad y probar página abierta, renovación y rechazo de API |
| GP-PAY-01 / P1 | Cierre pagado bajo concurrencia | Cierre impago rechazado y pagos sin sobrepago; versión y auditoría comprobados |
| GP-ENV-01 / P1 | Verificar separación runtime/migrador/previews | Permisos mínimos y datos aislados documentados con evidencia |
| GP-UX-01 / P1 | Matriz completa de formularios/filtros | Éxito/error/reapertura, opcionales, teclado, atrás y cero recarga de documento donde aplica |
| GP-RELEASE-01 / P1 | Automatizar trazabilidad de entrega | CI con pruebas apropiadas, SHA/deployment/alias y smoke test |
| GP-OBS-01 / P2 | Observabilidad y paginación de caja | Diagnóstico sin datos sensibles; pantalla útil con volúmenes grandes |
| GP-UI-01 / P2 | Auditoría de accesibilidad y tokens | Contraste, foco, tipografía y estados consistentes en tamaños solicitados |
| GP-DOC-01 / P2 | Mantener trazabilidad actual | IDs de requisitos/ledger vinculados a cambios y evidencia posteriores al blueprint |

Responsables se asignan al iniciar cada tarea; no se presume que un agente histórico siga activo. P0 prioriza seguridad/recuperación; P1 confiabilidad; P2 mantenimiento. No iniciar cambios de producción por la sola presencia de esta lista.
