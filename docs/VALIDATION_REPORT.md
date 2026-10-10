## Imágenes de cotización — 2026-10-10

- PASS: typecheck y build Next.js, incluyendo rutas de carga y lectura privada.
- PASS: 21 pruebas unitarias en 5 archivos: reglas comerciales existentes, límite de diez imágenes, referencias únicas, títulos, normalización de PNG a JPEG y PDF de diez fotos.
- PASS: prueba PostgreSQL en una transacción revertida: carga idempotente, lectura por organización, edición de títulos, duplicado, conservación de revisión publicada, rechazo de referencias ajenas y PDF HTTP de seis páginas. No quedaron cotizaciones ni movimientos comerciales de prueba.
- PASS: navegador Edge con diez cargas reales, miniaturas privadas, título Unicode, límite, quitar imagen, escritorio 1440px y celular 390px sin desbordamiento; origen externo rechazado. Archivos, registros de prueba y sesión temporal eliminados.
- PASS: seis páginas del PDF renderizadas e inspeccionadas; referencias horizontales/verticales mantienen proporciones y títulos largos no invaden el pie.
- PASS: filtros de cotizaciones conservan el documento y no generan recarga completa.
- PASS: ESLint sin errores, con 25 advertencias existentes.
- PASS: migración 0009 aplicada y columna de imágenes verificada en Neon.
- Límite: la suite completa de integración local no se ejecutó porque PostgreSQL/Docker no estaba disponible; la prueba de persistencia indicada fue acotada y se revirtió.

La publicación debe verificarse por SHA/estado READY y alias de producción; la evidencia de despliegue se conserva en el registro de Vercel.

---

> Actualización documental 2026-10-09: se contrastaron guías con código, configuración, migraciones y commits hasta 5cb394a, y se comprobaron los enlaces de la nueva documentación. No se repitieron typecheck, lint, suites, build ni verificación de producción en esta tarea. Los resultados inferiores conservan su fecha y alcance; no se extrapolan a todos los cambios posteriores. Pendientes en [IMPROVEMENTS](IMPROVEMENTS.md).

## Verificación de documentación — 2026-10-09

- PASS: 115 enlaces locales de documentos/secciones actuales; no incluye los enlaces originales dentro de copias históricas.
- PASS: nueve entradas del journal tienen archivo SQL y los comandos npm documentados existen en package.json.
- PASS: siete documentos reemplazados se conservaron exactamente respecto de HEAD antes de esta actualización.
- PASS: cambios rastreados limitados a Markdown; `git diff --check` sin errores.
- PASS: ejemplos ficticios ejecutados con el calculador puro, sin conexión a base de datos: cantidad 1 → costo 12065.541667 y precios 24131/30164/36197; cantidad 2 → costo 24131.083333 y precios 48262/60328/72394 COP.

Las comprobaciones temporales se ejecutaron desde `.runtime/`, excluido de Git. No se ejecutaron suites de regresión de la aplicación ni un despliegue: este cambio es documental. Los informes de etapas anteriores continúan abajo con su alcance original.

---

## Evidencia anterior

# Validación de implementación

Fecha: 2026-10-03, America/Bogota. Entrega local implementada; cuenta real del administrador creada y acceso verificado.

| Verificación final | Resultado |
|---|---|
| TypeScript | PASS, cero errores |
| ESLint | PASS, cero errores, 22 advertencias de variables omitidas/import/config |
| Build Next.js | PASS, todas las rutas compiladas |
| Unitarias | 9 PASS: fórmula decimal, postprocesado, redondeo, duración, Bogota, rangos y presets |
| Integración PostgreSQL | 30 PASS en 5 archivos: comandos 11, cotizaciones/PDF 6, reporting 7, acceso 5, carga 1 |
| Navegador Microsoft Edge | 4 PASS: acceso/login/logout, móvil 360px, bloqueo signup/API admin y flujo comercial completo |
| Dependencias productivas | npm audit --omit=dev: 0 vulnerabilidades, comprobado al cierre |
| Dependencias de desarrollo | Auditoría anterior: 9 high por cadena braces 3.0.3; sin versión reparada observada. No se aplicaron cambios forzados |
| Backup/restauración | Guía escrita; simulacro no ejecutado |

El flujo completo de navegador creó cliente y filamento, cotizó con 1h30m30s/100g, publicó y aceptó la cotización, convirtió a pedido, inició/falló/reimprimió/terminó, registró 13000 COP de costo, confirmó completitud, recibió 10000 COP de abono y el saldo restante, entregó y verificó Finanzas. Usa exclusivamente golden_print_e2e y cuentas sintéticas.

Integración de acceso: Better Auth real y PostgreSQL real, revocación/reset invalidan sesión, no se desactiva/demueve último administrador, contexto revocado no produce efectos/replay y envío concurrente respeta idempotencia. Se adapta next/headers al contexto del test; no se simula la autenticación ni la base.

Revisión financiera: ventas por cohorte entregada; efectivo por fecha de pago; trabajo pendiente no aporta costo a entregas; fallos se descuentan una sola vez; compra de material aporta caja sin duplicar OPEX; pérdidas reducen contribución para equilibrio; oráculo de equilibrio 400 COP; cortes Bogota/cartera histórica; correcciones efectivas; resultados incompletos provisionales y ausencia de base explícita.

## Rendimiento

Evidencia final en performance-results.json: 10000 pedidos entregados, 10000 pagos, 10000 costos, 10000 movimientos de caja; 10 sesiones reales y 10 solicitudes concurrentes, tres oleadas. P95: pedidos 102 ms; Inicio 198 ms. Se mantienen límites de 2000 ms en las aserciones. PostgreSQL actualiza estadísticas ANALYZE tras cargar los fixtures, fuera del tramo medido.

Frontera de medición: servicio autenticado + Better Auth getSession + PostgreSQL local; adaptador de headers. No incluye HTTP, SSR ni navegador y no garantiza latencia productiva. La implementación usa paginación SQL para pedidos y agregación NUMERIC en PostgreSQL para métricas; no carga todos los pagos por cada pedido. El listado de caja de Finanzas aún devuelve todos los movimientos del período; no se probó su render con 10000 filas.

## Evidencia visual y límites

Capturas revisadas: screenshots/login-desktop.png, login-mobile.png y finance-desktop.png. Logo integrado al nuevo fondo, marca completa visible en 360px y sin desbordamiento del login. No se declara auditoría exhaustiva WCAG ni validación de todos los estados de todos los formularios.

.traceability.yaml conserva 40 criterios. Los enlaces señalan implementación y suites relacionadas; los escenarios BDD que no tienen comprobación individual conservan NOT_TESTED. Pasar una suite no implica certificar cada escenario original ni la preparación productiva.

Se corrigieron dirección de cliente, responsable/notas de gasto, precio comercial manual, presets temporales, estado de costos tratado como texto, revocación dentro de mutación, detalles directos por ID, consecutivos de revisión históricos, pérdidas en equilibrio y cartera al corte. Migraciones 0000 y 0001 aplicadas en desarrollo y bases de pruebas según cada suite.

No se publicó la aplicación, no se contrataron servicios y no se creó una cuenta permanente ficticia. La primera cuenta real fue creada con bootstrap privado tras recibir las credenciales del propietario; inicio de sesión y cierre de sesión comprobados. Configuración HTTPS productiva y backup/restauración real quedan pendientes de la fase de operación.

## Rediseño integral — 2026-10-03

TypeScript y build Next.js: PASS. ESLint: cero errores, 22 advertencias anteriores. Microsoft Edge/Playwright: 5 PASS (53,6 s), con acceso, bloqueo de registro público, flujo comercial completo y nueva regresión responsive. Esta última visita 12 módulos en 320, 360, 768 y 1440 px (48 combinaciones) y comprueba encabezado visible y ausencia de desbordamiento del documento. Los listados pueden desplazar su tabla dentro del contenedor.

Se revisaron capturas nuevas de Inicio, nuevo pedido, nueva cotización, clientes y Finanzas en desktop y móvil, disponibles como screenshots/redesign-*.png. Las capturas de pruebas contienen únicamente datos sintéticos de golden_print_e2e. También se revisó la aplicación real sin crear registros de negocio.

La ejecución E2E usa .next-e2e y una base aislada para evitar interferir con el servidor de desarrollo. Las 9 pruebas unitarias y las 30 PostgreSQL de la entrega anterior mantienen su evidencia histórica; no se ejecutaron de nuevo en esta revisión visual. No se certifica WCAG exhaustivo, lector de pantalla ni zoom al 200 %. Roles, cálculos y comandos de negocio conservan su comportamiento. DESIGN_REDESIGN.md registra guías y revisión de los subagentes.

## Amplitud de páginas y color de filamento

Después de la segunda revisión visual, build y TypeScript pasan. ESLint mantiene cero errores y las 22 advertencias existentes. Unitarias: 11 PASS, incluidas dos pruebas de nombres españoles, códigos hexadecimales y valores sin muestra. Las cuatro pruebas funcionales de navegador pasan; la regresión visual ampliada pasó en una ejecución posterior (49,5 s de test, 55,3 s total) después de corregir la contención de los filtros y esperar la navegación al detalle en el test.

La regresión visita 12 módulos a 320, 360, 768, 1440 y 1920 px (60 combinaciones), comprueba ancho disponible en desktop y ausencia de desbordamiento del documento, verifica alineación de búsqueda/vista, guarda un color personalizado y comprueba su muestra en tabla, tarjetas y detalle. Usa golden_print_e2e. La aplicación real conserva sus registros; su filamento Azul se revisó visualmente sin editarlo. La suite PostgreSQL de 30 pruebas no se repitió, porque no cambiaron comandos, esquema ni cálculos.

2026-10-04: sidebar de escritorio reducido a 224 px con opciones de 36 px de alto; acceso al perfil retirado del header y conservado en la cuenta inferior/menú móvil. Inicio utiliza el título del header y ubica Nuevo pedido junto al período del reporte. Build/TypeScript y lint de archivos modificados PASS. Regresión responsive ampliada PASS (44,3 s de prueba; 51,0 s total), con aserciones de ausencia del título repetido y perfil superior, y presencia de Nuevo pedido dentro del filtro de período. Capturas de Inicio desktop/móvil revisadas; sin cambios en datos de negocio.

Revisiones posteriores del 2026-10-04: barra superior eliminada, menú móvil conservado y comprobado al abrir/cerrar. Densidad compacta en workspace (tarjetas con 16 px de relleno, controles de escritorio de 36 px, controles móviles de 44 px y métricas móviles en dos columnas). Colores semánticos con etiquetas: utilidad/entregas/sin fallos en verde, pérdidas/fallos en rojo, pendientes/cartera en ámbar, impresión activa en azul; cero utilidad y ausencia de base permanecen neutrales. Los costos normales no se clasifican como fallos.

Validación actual: 15 unitarias PASS, con cuatro pruebas de semántica financiera y límites; build/TypeScript PASS; lint de archivos modificados sin errores ni advertencias. Regresión responsive y menú móvil PASS (40,6 s; 46,1 s total) en base E2E aislada. Capturas renovadas de Inicio y Finanzas revisadas. No se modificaron los cálculos ni los datos del negocio.

## Cotización y valores desde el pedido — 2026-10-04

El pedido provisional ofrece cotizaciones disponibles de su cliente, muestra costo estimado/precio y permite vincular una aceptada sin salir del pedido. Los borradores ofrecen acceso a edición. Una cotización ya utilizada en otro pedido se rechaza también en backend. El pedido confirmado muestra costo estimado, costo real y valores comerciales; el administrador puede ajustar costo estimado/precio con motivo y control de versión. Se conserva la cotización original y la auditoría antes/después. Un precio menor que los pagos activos recibidos se rechaza bajo bloqueo del pedido.

Migración aditiva 0002_sudden_network aplicada en PostgreSQL local: estimated_cost_override nullable, restricción no negativa. Los pedidos existentes toman inicialmente el costo de su revisión aceptada; no se alteraron importes reales del negocio durante el desarrollo.

Validación ejecutada: 33 pruebas PostgreSQL PASS (36,03 s), incluidas tres nuevas de auditoría/inmutabilidad/versiones, permisos/provisionales/pagos y cotización ya vinculada. Cinco pruebas E2E PASS (1,5 min), con selección desde pedido, ajuste, persistencia tras recarga y continuación del flujo comercial completo. Build/TypeScript PASS; lint cero errores y las 22 advertencias anteriores. Todas las operaciones de prueba se realizaron en bases aisladas. Las 15 unitarias conservan la evidencia de la revisión anterior.

## Cotizador con la referencia visual del propietario — 2026-10-04

Build/TypeScript PASS y lint de archivos modificados PASS. Cinco E2E PASS: revisión de 60 combinaciones ruta/ancho, acceso privado y flujo comercial ampliado. El flujo comprueba guardar borrador, abrir edición, conservar gramaje 100.0, guardar y emitir desde el resumen, aceptar, vincular al pedido, ajustar valores, reimprimir, registrar costos/pagos y entregar. Bases de prueba aisladas; no se crearon cotizaciones reales durante las pruebas. Se revisaron capturas de escritorio/móvil y quote-reference-filled-1440.png con datos de prueba. Las suites unitarias/PostgreSQL no se repitieron para este cambio; conservan evidencia anterior. El navegador registra avisos de FieldControl y atributos de hidratación en Finanzas durante las capturas, sin fallos de las pruebas.

Resumen compacto de cotización: TypeScript, lint del formulario y build PASS; cinco E2E PASS, con 60 combinaciones responsive y flujo de edición/emisión/vinculación/producción/pagos. Se revisaron capturas renovadas de Nueva cotización y edición con datos de prueba. La selección del precio queda fuera del resumen; la fila secundaria ofrece PDF de versión guardada cuando existe y copia de resumen público. El servidor temporal E2E se cerró después de terminar las pruebas; desarrollo 3000 conservado.

Selector de precios con utilidad — 2026-10-04: build y lint del formulario PASS; cinco E2E PASS (60 combinaciones responsive y flujo comercial). Prueba dirigida final adicional PASS con precio manual inválido sin ocultar controles, pérdida en rojo, total manual, deselección del nivel, limpieza del manual al elegir Medio, diseño sin desbordamiento a 360 px y guardado/emisión posterior. TypeScript final PASS. Capturas de opciones completas en escritorio y móvil revisadas. Fórmula/BD sin cambios; operaciones de prueba en base aislada.

Detalle de cotización rediseñado — 2026-10-04: build/TypeScript PASS, lint de QuoteDetail/ruta PASS. E2E dirigido PASS: precio final 30.164, tres escenarios guardados, vista móvil 360 px sin desbordamiento, guardar/editar/emitir/aceptar y vinculación/producción/costos/pagos/entrega. Capturas de escritorio y móvil revisadas. Se conservaron acciones de estado, versiones, snapshots y PDF. Sin cambios a datos reales, cálculos o BD; no se repitieron suites ajenas a esta modificación.

## PDF comercial basado en referencia — 2026-10-04

PDF A4 rediseñado con fondo marfil, línea dorada, logo oficial, marca serif, identificador/revisión/estado, tarjetas de cliente y emisión, tabla de proyecto/valor, descripción y notas públicas, bloque bronce de total y pie numerado. Mantiene COP sin impuestos. Solo usa el DTO comercial existente: no recibe notas internas, costos, márgenes ni fórmula. No agrega referencias inventadas, cantidades, anticipos del 50 %, garantías, bancos, firma o plazos del HTML de muestra. Encabezados y secciones de continuación conservados con textos extensos.

Build/TypeScript y lint del renderer PASS; nueve pruebas de cotización PostgreSQL PASS, incluidas paginación Unicode y aislamiento del DTO comercial. Muestra de una página y documento de estrés de cinco páginas renderizados con Poppler; todas las páginas inspeccionadas. Muestra con datos ficticios explícitos en output/pdf/cotizacion-ejemplo.pdf; captura en screenshots/quote-pdf-example.png. No se modificaron importes ni registros reales.

Listado /cotizaciones según referencia — 2026-10-04: build/TypeScript y lint dirigido PASS; cinco E2E PASS. Cobertura de 60 combinaciones ruta/ancho y capturas del listado a 1440/360 px revisadas. Flujo ampliado comprueba búsqueda por proyecto, filtro accepted, cuatro indicadores, enlace PDF correcto, cambio a tarjetas conservando filtros y vista móvil sin desbordamiento. Las métricas agregan el registro no archivado antes de filtrar/paginar. Detalle/editor/PDF conservados; no se modificaron importes del negocio ni esquema.
