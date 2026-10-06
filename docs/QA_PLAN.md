# Plan de QA y auditoría de cálculos

Fecha: 2026-10-02 · Revisor: test_generator existente del framework. Estado: diseño revisado; pruebas planificadas **NOT_EXECUTED**. No se ha creado código, ejecutado una suite ni validado un runtime. Este documento no aprueba implementación ni modifica requisitos o reglas monetarias.

## Autoridad y veredicto documental

Fuentes: REQUIREMENTS.md (35 REQ + 5 CFR, 40 AC/SC), .traceability.yaml, FINANCIAL_RULES.md, DATABASE_DESIGN.md, API_DESIGN.md, ARCHITECTURE.md, UX_PLAN.md, IMPLEMENTATION_PLAN.md y ADR-003. Se han leído framework/AGENTS.md, docs/INVENTORY.md y agents/quality/test_generator.toml. La revisión evalúa si un implementador puede construir y comprobar las reglas sin inventar nuevas decisiones monetarias.

**Accept design**, sujeto al gate de aprobación del propietario y a cerrar las validaciones de implementación siguientes. Las reglas de precisión, costo estimado/real, postprocesado, reimpresión, caja, cohortes y correcciones tienen resultados observables. Los AC felices por sí solos no prueban errores, concurrencia o filtración: la matriz siguiente amplía los casos necesarios sin cambiar su autoridad. Todos los verdicts del ledger permanecen NOT_TESTED; tests/impl vacíos son correctos en esta fase.

Observación documental QA-D01 **cerrada**: FINANCIAL_RULES fija semana hoy−6..hoy, mes/3 meses mediante resta de meses calendario ajustando fin de mes y sumando un día, año desde 1 de enero e histórico hasta hoy; custom inclusivo no futuro. El día actual usa corte instantáneo actual para timestamps, sin admitir instantes futuros. Son reglas propuestas del blueprint, con ejemplos verificables; no quedan brechas materiales de verificabilidad documental.

## Estrategia y evidencia

Unitarias del dominio puro: oráculos numéricos derivados manualmente, strings decimales de entrada y salidas esperadas literales; no obtener el esperado llamando otra vez a la función productiva. Usar Decimal de 80 dígitos; confirmar escalas/rangos antes del cálculo y precio antes de cuantizar componentes. Invariantes complementan los ejemplos: incremento de PP aumenta precios exactos en PP×factor; ninguna reimpresión añade una venta; ningún costo genera caja por sí solo; coste desconocido mantiene provisionalidad.

Integración: PostgreSQL real aislado (Neon de desarrollo o PostgreSQL local), schema/adapter/versiones fijados, conexiones independientes y barrera para concurrencia. SQLite o mocks no demuestran locks, unicidad, FK ni atomicidad. Verificar estado final de tablas y auditoría, además de respuesta. Inyectar fallos entre pasos para demostrar rollback; cleanup exclusivo del entorno de pruebas. Mockear solamente servicios externos al dominio cuando haga falta, sin sustituir DB en pruebas de integridad.

E2E: Playwright contra servidor real y DB aislada; recorrido comercial y operativo, permisos mediante peticiones directas, PDF y accesibilidad. Mantener tests independientes y fixtures deterministas, reloj fijo donde se evalúan períodos. No exigir tests de getters ni CRUD triviales que espejen implementación. La prueba de cada frontera financiera se concentra en el dominio y se comprueba una integración representativa hasta persistencia/DTO.

Después de aprobación, configurar y ejecutar según hito: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`. Son comandos previstos por IMPLEMENTATION_PLAN, todavía no scripts existentes. Las pruebas de carga CFR-005 requieren runner/entorno documentado al implementar; no se atribuye rendimiento a un build local.

## Matriz financiera: oráculos manuales

Todas las filas están NOT_EXECUTED. Costo informativo guardado nunca es fuente para recalcular precio.

| Caso / trazabilidad | Entrada y acción | Resultado esperado |
|---|---|---|
| F01 · REQ-016–020/022/031, CFR-003 | 1h30m30s, 100g×80; defaults; PP=0 | H=181/120; material 8000; energía 248.875; máquina 3016.666666…; contingencia 800; C=12065.541666…; precios exactos 24131.083333…/30163.854166…/36196.625; cobrables **24131/30164/36197** |
| F02 · REQ-020/021/022 | Mismo caso + PP=1000 | C=13065.541666…; cobrables **26131/32664/39197**; aumentos exactos 2000/2500/3000; contingencia permanece 800 |
| F03 · REQ-017/018/019/020 | 10g×80 + 20g×100; 1h30m; PP=0 | material 2800; energía 247.5; máquina 3000; contingencia 280; C=6327.5; quitar segunda línea deja material 800 y contingencia 80 |
| F04 · REQ-022, CFR-003 | C=10000; factores 2/2.5/3 | precios 20000/25000/30000; markup 100/150/200%; margen venta 50/60/66.666666…%; bases etiquetadas |
| F05 · REQ-028/030/031, CFR-003 | 1s; máquina 1799.999999; resto 0; factores 1/2/3, elegir alto | C=1799.999999/3600; precio alto=1.499999999166… → **1 COP**. Costo informativo 0.500000 no puede producir 2 COP |
| F06 · CFR-003 | C=0, precio 0 o precio manual positivo | Razones con denominador 0 devuelven null/«Sin base de cálculo»; no NaN/Infinity; precio manual inferior a costo muestra advertencia, no rentabilidad inventada |
| F07 · REQ-016/018/028, CFR-003 | Peso 0/negativo; minuto/segundo 60; gramos/costo negativos; factor 0/desordenado; escala/rango excedido; NaN/Infinity; payload excesivo | VALIDATION_ERROR; ninguna escritura parcial ni truncamiento. Límites exactos se derivan de numeric y bigint documentados; probar máximo admisible y siguiente valor |
| F08 · REQ-026, CFR-004 | Pedido 100000, pagos 30000 y 20000 con fechas distintas | recibido 50000; saldo **50000**; pendiente; dos pagos y dos ingresos de caja de importe/fecha respectivos |
| F09 · REQ-026 | Completar saldo de F08 por 50000 | recibido 100000; saldo 0; pagado; producción/entrega independientes; pago cero/negativo o exceso se rechaza |
| F10 · REQ-013/027/010 | Pedido entregado precio 100000; fallo costo 10000, éxito costo 20000; OPEX 5000; pérdida independiente 1000 | C=30000; indicador fallos=10000 incluido en C; bruto 70000; utilidad **64000**; un PED/venta, sin segunda deducción de fallo |
| F11 · REQ-014/027/010 | Compra rollo 80000; consumo de pedido 100g a 80 | caja out 80000 una vez; consumo C=8000; OPEX compra=0; registrar catálogo no genera compra y consumir no crea egreso nuevo |
| F12 · REQ-014/027/030 | Corregir costo 100 a 120 | original anulado, reemplazo válido 120; agregado **120**, nunca 220; motivo/actor y referencias conservados |
| F13 · REQ-027/030 | Costo 100 con efectivo asociado 100; intentar reemplazo 80 | DEPENDENCY_CONFLICT y rollback; costo/caja originales válidos; corregir un error de caja exige operación técnica explícita previa, no devolución |
| F14 · REQ-010/012 | V=100000, CV=30000, OV=10000, L=0, OF=20000, CFdir=10000 | MC=60000; r=0.6; F=30000; ventasEquilibrio=50000; progreso **200%**, barra 100%; faltantes 0 |
| F15 · REQ-012, CFR-003 | V=0; r≤0; costos incompletos; F=0 con MC≥0 o MC<0 | «No estimable» con motivo en primeros casos; sin costo fijo que cubrir o contribución negativa para F=0; razones null donde falta base, sin meta artificial ni beneficio definitivo con costo incompleto |

## Integración, seguridad y períodos

| Caso / trazabilidad | Verificación planificada y cierre |
|---|---|
| I01 · REQ-002, CFR-004 | Dos CLI bootstrap simultáneos en DB vacía: exactamente una empresa/admin/settings/counters; segunda instalación rechazada. Fallo después de user/account revierte todas las filas; login Better Auth acepta hash oficial. Ninguna contraseña en argumentos/logs/DTO |
| I02 · REQ-001/003, CFR-001 | Signup directo denegado; operador no administra usuarios/finanzas ni endpoints auth alternativos. Identidad huérfana/inactiva y sesión expirada/revocada no lee ni muta. Logout invalida acceso; cambio rol/desactivación revoca permisos sin cache de autoridad obsoleto |
| I03 · REQ-003, CFR-004 | Último admin no puede degradarse/desactivarse; dos admins intentan quitarse simultáneamente: queda ≥1 activo. Endpoints genéricos Better Auth no esquivan guardia |
| I04 · REQ-024/030, CFR-004 | Conversión simultánea, con keys iguales y distintas: único order/source_quote_id/accepted_revision_id; resultado existente para reintento autorizado. Fallo intermedio no deja counter/documento financiero parcial. Intentar otra revisión no crea segundo pedido |
| I05 · REQ-026, CFR-004 | Dos conexiones abonan **60000** cada una sobre saldo 100000: exactamente una operación exitosa y otra PAYMENT_EXCEEDS_BALANCE; recibido 60000, saldo 40000. Verificar payment+cash+audit atómicos. Misma key/payload retorna único pago; key distinta/payload distinto no puede duplicar por carreras |
| I06 · REQ-026/030 | Misma key con payload cambiado retorna IDEMPOTENCY_CONFLICT; respuesta previa se reautoriza. Corrección pago 30000→20000 deja recaudo/caja 20000, original auditado y ningún ingreso negativo; falla de reemplazo revierte anulación |
| I07 · REQ-023/028/030 | Settings/catalogo/cliente cambian después de publicar: snapshot/precio/PDF anteriores estables. Duplicar tiene IDs nuevos/borrador; editar publicada crea revisión. Precio/totales falsificados del navegador no son autoridad; version vieja genera conflicto sin sobrescritura |
| I08 · REQ-011/010/012 | Rango local 2026-10-01–2026-10-02 usa **[2026-10-01T05:00Z, 2026-10-03T05:00Z)** si corte admisible. Evento justo al inicio incluido y justo al fin excluido; start>end/futuro inválidos. Reloj de prueba fijado después del rango. Con hoy 2026-10-02: semana 09-26..10-02, mes 09-03..10-02, tres meses 07-03..10-02; mes desde 2026-03-31 empieza 03-01. Para hoy, cortar timestamps en now; fechas efectivas incluyen hoy |
| I09 · REQ-010/011/026/027 | Pedido entregado septiembre 100000; pago septiembre 20000 y octubre 30000: ventas octubre 0, caja octubre +30000; cohorte septiembre al cierre septiembre recaudo 20000/saldo 80000/tasa20%; cartera global al cierre octubre 50000. Costos de otro pedido en producción se presentan en proceso, no contra la venta entregada |
| I10 · REQ-010/011/014/027 | Costo efectivo septiembre 100 corregido en octubre a 120 conserva fecha efectiva septiembre: reporte septiembre actual usa 120 aunque auditoría se creó octubre. Original anulado excluido. No ofrecer reconstrucción de conocimiento histórico; entregado reabierto cambia reportes actuales con auditoría |
| I11 · REQ-007/013/027 | Fallar y reimprimir conserva PED/precio/abonos, crea intento siguiente, un activo; no duplicar pérdida/caja/venta. Intento de otro pedido o ID ajeno falla. Entrega incompleta conserva provisionalidad; pagar no entrega, entregar no paga |
| I12 · REQ-008/014/030 | Borrado con dependencias rechazado; archive preserva saldos/historial. Corregir costo con caja migra referencias válidas sin nuevo movimiento. Restricciones FK/origen único y rollback impiden mezclar empresa/pedido/intento o imputar dos veces origen |
| I13 · REQ-025/003, CFR-001 | PDF privado exige sesión, relación quote/revision válida y autorización. DTO allowlist contiene solo campos comerciales. Plantar marcadores únicos en internalNotes/costos/márgenes y extraer texto PDF: ninguno aparece; customerNotes sí aparece. DTO/preview tampoco filtran campos internos; Cache-Control private,no-store |

## E2E, presentación y gates de cierre

REQ-004–009/015/029 y CFR-002: crear cliente/filamento/cotización con PP, publicar/aceptar, convertir intake al mismo PED, anticipo, fallo/reimpresión, costos, entregar y completar saldo. Tabla/cards mantienen filtros/acciones/registros; listados y gráficos reconciliados con fixtures. Recorrer 360/390/768/1440 px y zoom 200%, teclado completo, combobox/dialog foco/escape/restauración, validación asociada y mensajes de estado. En móvil teclado virtual no tapa guardar ni total. Contraste y lector de pantalla requieren revisión real adicional al análisis automatizado.

REQ-025: PDF simple/multipágina con nombres/notas de longitud máxima, tildes/ñ, validez ausente/presente; inspección visual de cada página además de texto/allowlist. Total/label juntos, wrapping y fuente legibles, página/código/revisión correctos. Falla PDF conserva revisión guardada y permite reintento sin publicar ni mutar. Rutas privadas no sirven PDF cacheado a otro actor.

CFR-005: dataset 10000 pedidos, 10 sesiones concurrentes, consultas representativas paginadas/dashboard, P95≤2s; registrar hosting/región/DB, versiones, distribución/volumen de datos, calentamiento, duración, número de muestras, latencias y errores. Meta se acepta solo con condiciones y evidencia reproducible; carga no usa producción.

REQ-032–035 se validan documentalmente: requisitos aplazados permanecen en roadmap con fuente; decisiones/ADRs alineadas; sin scaffold previo a aprobación; lifecycle y checks pertinentes posteriores. No crear tests runtime para una política documental de aprobación.

Cada AC conserva su SC canónico. Al implementar, asociar uno o varios tests reales y archivo/línea de implementación en el ledger; las filas F/I se vinculan a esos AC y pueden alimentar escenarios adicionales trazables. Un test planificado nunca cambia NOT_TESTED. Registrar commit, comando, entorno, fecha, resultado y limitaciones cuando exista evidencia. M1 cierra acceso/transacciones básicas; M2 fórmula/snapshot/PDF; M3 integridad pagos/intentos; M4 reconciliación financiera/períodos/equilibrio; M5 completa AC críticos, seguridad, code review y build sin hallazgos críticos/importantes abiertos. Accept design significa criterios suficientes para construir y validar, no software aceptado ni evidencia de funcionamiento.
