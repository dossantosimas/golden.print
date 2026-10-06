# Arquitectura — Golden Print 3D

Fecha: 2026-10-02 · Autor: atlas · Estado: propuesta de blueprint, revisión independiente pendiente. Audiencia: implementadores, reviewers y propietario. No hay código ni runtime validado.

## Contexto y decisión

Aplicación interna para una sola empresa, responsive desktop/móvil. El riesgo estructural principal es permitir que cada pantalla implemente su propia interpretación de precio, costo real, pérdida y caja. Se centralizan esas reglas en un dominio financiero puro con snapshots y transacciones cortas. Requisitos autoritativos: [REQUIREMENTS](REQUIREMENTS.md), [PRD](PRD.md), [FINANCIAL_RULES](FINANCIAL_RULES.md). Persistencia: [DATABASE_DESIGN](DATABASE_DESIGN.md); productos y fuentes oficiales: [TECHNOLOGY_STACK](TECHNOLOGY_STACK.md).

Se propone un monolito modular Next.js 16/React 19/TypeScript, organizado por funcionalidades, desplegado en Vercel con runtime Node 22, Neon PostgreSQL, Drizzle y pg pooled TLS. Auth, lecturas, CRUD y PDF se ejecutan en Node. Frente al default híbrido de atlas (edge/container/serverless), el mismo proceso Node evita tres despliegues, traducción de sesiones y transporte distribuido; no hay escala independiente ni trabajos largos que justifiquen containers o Edge. CDN sirve recursos estáticos. Cualquier middleware de redirección es conveniencia; el control efectivo de acceso ocurre dentro del servidor.

## Límites y dependencias

| Módulo propuesto | Responsabilidad | Dependencias autorizadas |
|---|---|---|
| app | Rutas, layouts, Server Components, acciones delgadas | APIs públicas de features, componentes UI |
| features/access | Sesión, membership, autorización, ciclo de usuarios | Better Auth, DB, auditoría |
| features/customers | Clientes, historial y ranking | DB, access, contratos de reporting |
| features/filaments | Catálogo y precio/gramo | DB, access, financial-core |
| features/quotes | Cotizador, revisiones, estados y publicación | DB, access, financial-core, contratos de catálogos |
| features/orders | Intake, conversión, estados y precio contractual | DB, access, quotes public API, financial-core |
| features/production | Intentos, fallos, reimpresiones y costos reales | DB, access, orders public API, financial-core |
| features/payments | Abonos y correcciones auditadas | DB, access, orders public API, financial-core |
| features/expenses | OPEX, compras, pérdidas independientes y egresos | DB, access, financial-core |
| features/reporting | Dashboard, finanzas, cohortes y períodos | DB read models, access, financial-core |
| features/settings | Fórmula editable y configuración de empresa | DB, access, financial-core |
| features/quote-pdf | PDF comercial desde revisión guardada | quotes public query, access, pdf-lib |
| domain/financial-core | Funciones puras, validación matemática, períodos y DTOs decimal | decimal.js, tipos y utilidades temporales puras |
| infrastructure | Cliente pg, transacciones, auth adapter, logger, auditoría | Librerías externas; nunca importa app ni UI |

Cada feature contiene sus schemas, comandos, consultas, repositorio y UI cuando corresponde. No crear carpetas globales controllers/services/repositories ni interfaces vacías por cada tabla. `financial-core` no importa Next, React, ORM ni features; el cliente puede usar únicamente sus funciones puras. Repositorios/auth son server-only y no se exportan a bundles cliente. Un comando no importa repositorios privados de otra feature: usa contrato público que admite el transaction context ya abierto. Reporting tiene consultas SQL explícitas de lectura para evitar ciclos entre módulos.

No hay bus de eventos, microservicios, cola, cron, stock avanzado ni almacenamiento de PDFs en MVP. Auditoría y movimientos asociados se insertan en la misma transacción; un PDF se regenera desde revisión estable. No invocar red externa dentro de transacciones.

## Componentes y flujo

Navegador → página/acción Next → sesión y membership → Zod → comando de feature → transaction pg/Drizzle → Neon. Lecturas vuelven como DTO serializable; UI usa RHF, shadcn/Tailwind y Recharts. Route Handlers se reservan a Better Auth y descarga PDF. Los servicios son reutilizables por acciones y handlers; no hacer fetch HTTP desde Server Components al mismo servidor.

Cotizador: entradas normalizadas → cálculo decimal puro con precisión de 80 dígitos → vista previa → recálculo obligatorio en servidor → snapshot publicado. Postprocesado se suma antes de multiplicadores; contingencia solo material. La configuración nueva afecta borradores nuevos o recalculados explícitamente, nunca revisiones publicadas. Precio final se redondea half-up a COP entero desde precisión de cálculo completa; cuantizar componentes numeric(18,6) ocurre después, y no se vuelve a derivar el precio contractual desde componentes cuantizados. Duración canónica en segundos; numeric/bigint viajan como string. FINANCIAL_RULES es la fuente matemática única.

Cotización aceptada → conversión bajo lock quote → pedido confirmado con precio y revisión referenciada → intentos y costos reales → entrega. Anticipos generan caja en fecha del pago, ventas se reconocen al entregar. Intentos fallidos conservan costo dentro del pedido y se muestran como pérdida analítica sin segunda deducción. Compras de material afectan caja y su consumo afecta costo; no se registra otra salida por consumir lo comprado.

## Acceso y matriz propuesta

Roles empresariales canónicos `administrator` y `operator`; Better Auth usa respectivamente `admin` y `user`. La autoridad de negocio siempre depende de membership activa y rol empresarial leído de BD, nunca de un rol enviado por UI. Esta matriz es propuesta técnica para aprobación.

| Operación | administrator | operator |
|---|---|---|
| Clientes y filamentos: leer/crear/editar/archivar conservando historial | Sí | Sí |
| Cotizar, ver costos estimados, publicar PDF, aceptar/rechazar/duplicar | Sí | Sí |
| Pedidos, producción, intentos, costos reales y declarar completitud | Sí | Sí |
| Leer precio, estimación/costo real del pedido, saldo y badge de pago | Sí | Sí |
| Ver detalle de pagos, registrar/corregir pagos y egresos | Sí | No |
| Dashboard operativo: conteos, estado, lista y pendientes | Sí | Sí |
| KPIs financieros agregados, cartera global, rankings monetarios, Finanzas | Sí | No |
| Gastos, pérdidas independientes y movimientos de caja | Sí | No |
| Modificar fórmula/configuración, administrar usuarios, exportar auditoría | Sí | No |

Operador ve historial comercial y ranking por cantidad; ranking monetario se limita al administrador. Su dashboard omite componentes restringidos y sus DTOs no contienen importes financieros agregados. Costos de un pedido y estimación son necesarios para operar el cotizador; no otorgan acceso a caja general. Ambos usuarios pueden cambiar su propia contraseña con autenticación vigente.

Bootstrap privado por CLI: recibir credenciales de forma privada, calcular hash mediante export oficial de la versión fijada Better Auth y validar el schema auth generado con plugin admin. Abrir un solo cliente pg; BEGIN; `pg_advisory_xact_lock` de clave fija; comprobar instalación vacía; crear empresa singleton, user, account credential, membership administrator, settings y counters; marcar bootstrap_completed_at; COMMIT. Cualquier fallo revierte todas las filas; segundo intento se rechaza. El advisory lock es transaccional compatible con pooling, nunca session lock. No llamar auth.api dentro de esa transacción; login posterior debe demostrar compatibilidad del hash/account. Signup público desactivado desde inicio; no endpoint de instalación.

Altas normales: servidor verifica administrator; Better Auth admin crea identidad; en transacción de negocio crea membership y auditoría. Si falla la asociación, la identidad queda sin acceso a negocio y el flujo devuelve fallo, revoca sesiones y permite reparar/reintentar por admin o eliminar la identidad huérfana. No declarar atomicidad entre auth.api y DB independiente. Roles Better Auth no se exponen como operaciones genéricas al cliente; wrappers validan transiciones y el último administrador. Promoción/desactivación se serializan con lock común de memberships; la desactivación revoca sesiones y membership inactiva deniega de inmediato. Prohibir impersonación y signup público, incluso mediante endpoint auth directo. Verificar que los endpoints genéricos de cambio de rol/ban no eludan esta política antes de habilitar plugin admin.

No proveedor email en MVP; contraseña inicial y recuperación asistida por admin. Recuperación del último admin: operación privada por personal autorizado con acceso al entorno, hash oficial, auditoría y revocación de sesiones; nunca endpoint anónimo o credencial por defecto.

## Concurrencia e integridad

Todas las mutaciones verifican sesión, membership, permiso, Zod, pertenencia de IDs a empresa y version esperado. org_id se obtiene del servidor. Transacciones READ COMMITTED con locks explícitos y constraints; pg usa el mismo cliente para BEGIN y COMMIT y libera en finally. El wrapper Drizzle transmite ese tx a operaciones colaboradoras. Pool por instancia pequeño, timeout finito y sin conexiones por consulta; migraciones usan conexión directa y rol separado.

| Comando | Unidad atómica / lock | Garantía |
|---|---|---|
| Publicar revisión | quote/revision + version + snapshot + auditoría | Importes servidor, revisión estable |
| Convertir | quote → pedido existente/provisional → counter PED | Una fuente, un pedido; UNIQUE source_quote_id |
| Abono/corrección | order → payment → movement + auditoría | Saldo no negativo, ledger y caja coherentes |
| Reimpresión/costos | order → intento → costos + eventos | Intento único; historial preservado |
| Gasto/corrección | expense → movement + auditoría | Una salida por fuente |
| Usuarios | lock global memberships | Al menos un administrador activo |

Orden de locks fijo por tipo y UUID; contador se toma al final. No descargar PDF ni hashear contraseña durante locks. Creaciones repetibles usan idempotency key ligada a actor/org/operación y hash de payload normalizado. Pagos la persisten; conversiones usan además unicidad source_quote_id; para intentos/costos/gastos implementar registro `mutation_request` con UNIQUE(org_id, actor_id, operation, idempotency_key), input_hash y result_entity_id dentro de transacción. Reintento idéntico reautoriza y devuelve resultado anterior; las claves se conservan mientras exista la entidad, sin expiración automática; key reutilizada con otra entrada devuelve conflicto. Error de red ambiguo no autoriza repetir sin la misma key.

Version evita lost updates; conflictos devuelven currentVersion. Deadlock/serialization failure permite hasta dos reintentos internos con misma key y jitter corto; al agotar devuelve error reintentable, sin afirmar éxito. Confirmar commit antes de revalidar vistas.

Correcciones financieras son append-only con motivo, actor y timestamp; no son devoluciones. Los reportes históricos MVP usan registros válidos/corregidos actuales, filtrados por fecha efectiva hasta el corte solicitado: temporalMode=current_restated. Una corrección administrativa con motivo puede reexpresar reportes anteriores; conservar original anulado y before/after en auditoría. No se reconstruye lo conocido en una fecha pasada ni se ofrece cierre contable inmutable. Este reporte mutable se distingue explícitamente de la evidencia contractual inmutable de una cotización publicada. Historial de estados preserva delivered_at y cambios auditados; las métricas no infieren fechas de entrega desde status actual.

## Seguridad, observabilidad y operación

Cookies secure/httpOnly y sameSite, trusted origins exactos, rate limits persistentes en PostgreSQL y secreto fuerte. Validar origen/CSRF según contrato Next/Better Auth; ninguna mutación GET. No confiar en middleware/UI como autorización. Queries parametrizadas; recursos PDF locales y textos limitados; descarga privada no cache compartida. No registrar contraseñas, cookies, tokens ni cuerpos completos con datos personales. DB runtime carece de permisos de migración.

Logger estructurado con requestId, operation, entityId, duración y errorCode; auditoría de negocio atómica con actor y cambios mínimos. PDF conserva cliente y revisión autorizados; no incluye costo, margen, pagos internos ni observaciones privadas. Finanzas y panel admin usan no-store; cualquier cache futura deberá segmentar empresa/rol y revalidar tras commit.

Entornos: dev local y Neon dev; preview aislado con datos ficticios; producción en Vercel y Neon independientes. Variables previstas: DATABASE_URL pooled, DATABASE_MIGRATION_URL directa solo CLI, BETTER_AUTH_SECRET, BETTER_AUTH_URL/trusted origins. Nunca usar secretos productivos en preview ni ejecutar bootstrap automáticamente en build. La cuenta comercial/coste y deployment productivo se aprueban por propietario antes de contratar/desplegar.

Plan operativo tras implementación: migraciones revisadas y smoke en branch antes de producción; backup/restore usando capacidad contratada Neon y prueba de recuperación antes de operar con dinero real; mantener release anterior compatible para rollback Vercel. Schema destructivo exige backup verificado y expand/migrate/contract. DB caída devuelve SERVICE_UNAVAILABLE y preserva formulario; PDF fallido puede regenerarse; commit de pago incierto se resuelve consultando idempotency key. No prometer RPO/RTO sin plan/restore medidos. Operador responsable: administrador de Golden Print 3D; implementador entrega runbook de bootstrap, recuperación admin, migración, restauración y rollback.

## Fitness y validación pendientes

No existe baseline de imports, complejidad, latencia ni pruebas. En CI, bloquear imports cliente→DB/auth, financial-core→framework/features y ciclos entre features (AST/dep graph); reportar Ce<10 y profundidad<5 como diagnóstico inicial, sin fabricar scores. Vitest verifica fórmula, PP antes multiplicador, contingencia material, redondeo/cero/cohortes; integración PostgreSQL real verifica locks, rollback, sobrepago, último admin y pertenencia; Playwright verifica roles por petición directa y flujo completo; PDF smoke comprueba español, precios y páginas sin datos internos. Objetivos de rendimiento se validan con datos representativos, no como mediciones ya obtenidas.

Implementación incremental: auth/datos → catálogos/settings/core → cotizaciones/PDF → pedidos/producción → pagos/gastos → reporting. Cada etapa pasa review y checks antes de abrir siguiente. Nueva aplicación sin legado: rollback de código por release anterior; no destruir datos para revertir funcionalidad. ADRs proposed [001](adr/001-modular-monolith-node.md), [002](adr/002-postgres-transactions.md), [003](adr/003-private-auth-bootstrap.md), [004](adr/004-financial-core-snapshots.md) se aceptan solo después del gate del blueprint. Revisión de resultados un mes después de aceptación; registrar seguimiento sin reescribir ADR aceptado.


