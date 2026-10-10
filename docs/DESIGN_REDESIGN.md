> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Revisión y mejora de diseño — Golden Print 3D

Fecha: 2026-10-03, Colombia. Autor: subagente de auditoría UI/UX. Alcance: interfaces existentes; no modifica fórmulas, permisos, datos ni infraestructura.

## Dirección de diseño

Herramienta interna para cotizar, seguir impresión y registrar dinero de una sola empresa. La página debe destacar el trabajo siguiente: cotizar en el taller, resolver pedidos pendientes en Inicio y comparar ventas/utilidad/cartera/caja en Finanzas.

Identidad: carbón, marfil y latón oscuro. Conservar el fondo del login con el logo integrado, la marca y los componentes shadcn/Base UI. El acento dorado identifica acciones y selección; el color de estado siempre lleva texto. Mantener una jerarquía clara entre títulos, números, metadatos y controles. Evitar que cada cifra tenga el mismo peso o que una pantalla operativa se transforme en una página promocional.

Desktop: navegación agrupada, superficie de lectura amplia, tablas y comparaciones densas pero legibles. Móvil: menú accesible, tarjetas por registro, controles que envuelven, formulario en secuencia y valores completos. Los totales conservan cifras tabulares y los importes usan COP. Mostrar porcentajes con precisión útil para lectura sin modificar los resultados exactos del servicio.

## Agentes y fuentes

| Responsable | Trabajo |
|---|---|
| Root | Coordina y modifica navegación, tokens, CSS y verificación final |
| redesign_forms | Mejora listados, formularios, documentos y feedback |
| redesign_reports | Mejora Inicio, Finanzas, jerarquía de métricas y gráficas |
| frontend_app, rol auditor UI/UX | Inspecciona fuentes e imágenes; comunica hallazgos; mantiene este documento |

Se leyó el contrato existente [uiux_designer.toml](../../codex-framework/framework/agents/design/uiux_designer.toml). Las responsabilidades descritas arriba son subtareas reales de esta sesión, no agentes nuevos instalados.

Skills aplicadas:

- [frontend-design-pro](C:/Users/dossa/.agents/skills/frontend-design-pro/SKILL.md), incluida su referencia de accesibilidad y búsqueda de diseño. La búsqueda ofreció pautas útiles para controles táctiles, separación y teclado; su propuesta de landing/OLED no corresponde al producto ni sustituye la marca aprobada.
- [Skill oficial shadcn](../../codex-framework/framework/skills/design/shadcn/SKILL.md): composición Base UI, tokens y controles existentes.
- [web-design-guidelines oficial de Vercel](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md), versión declarada 1.0.0. Se consultó el 2026-10-03 y se leyó su [fuente vigente de revisión](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Aplicación: semántica, nombres accesibles, foco, recuperación de errores, estado en URL, movimiento reducido y comportamiento de formularios. Se usa como referencia consultada; este auditor no la instaló globalmente.

## Evidencia inicial y hallazgos

Se inspeccionaron fuentes actuales y [login desktop](screenshots/login-desktop.png), [login móvil](screenshots/login-mobile.png) y [Finanzas desktop](screenshots/finance-desktop.png). Las capturas son anteriores a algunos cambios de esta revisión; no acreditan el resultado final.

| ID | Prioridad | Evidencia y acción concreta | Estado |
|---|---|---|---|
| UI-01 | P1 | FinanceChart mostraba ejes sin barras en la captura. La fuente actual usa barras horizontales, 256 px, colores directos, animación desactivada y valores exactos en texto. | Cerrado; barras visibles en captura nueva de Finanzas |
| UI-02 | P1 | Finanzas daba igual peso a más de veinte cifras. La fuente actual prioriza cuatro KPI y agrupa rentabilidad, recaudo/caja y equilibrio/producción. | Cerrado por fuente y captura nueva de Finanzas |
| UI-03 | P2 | Login mostraba contraseña más baja que correo. InputGroup y sus tokens ya fijan 44 px. | Corregido en fuente; falta nueva captura específica del login |
| UI-04 | P2 | La búsqueda GET de EntityList descartaba estado, vista y orden. La fuente actual conserva esos tres valores en entradas ocultas y omite la página. | Cerrado por revisión de código |
| UI-05 | P2 | CommandForm conecta ayuda y errores mediante aria-describedby y programa foco al primer campo rechazado sin reiniciar sus valores. | Implementado en fuente; falta validar navegación con teclado y foco efectivo en controles compuestos |
| UI-06 | P2 | El cotizador agrupa proyecto, materiales, tiempo/variables, acabados y notas; presenta resumen y guardado en columna lateral desktop y secuencia móvil. | Cerrado por capturas a 1440 y 360 px; formulario largo conserva todos los controles |
| UI-07 | P2 | Conservar motivos, avisos y controles existentes para corregir/anular registros y cambiar acceso. La revisión de diseño no añade un paso de aprobación nuevo. | Alcance resuelto con root; conservar flujo autorizado |
| UI-08 | P2 | CSS define controles de 44 px; revisar también enlaces de detalle, menú y control de contraseña, además de los inputs. | Fuente revisada; medición exhaustiva de áreas táctiles y teclado pendiente |
| UI-09 | P2 | Perfil ahora tiene h1 visible y una sección separada para contraseña. | Cerrado por revisión de fuente actual |
| UI-10 | P1 | Durante edición, EntityList se escribió en codificación ANSI. Una nueva lectura estricta de todas las fuentes .ts/.tsx/.css confirmó UTF-8 válido y ausencia de caracteres de reemplazo. | Cerrado por lectura de fuentes |
| UI-11 | P1 | Token funcional input #B4B0A5 contra blanco tenía contraste 2.17:1. Se restauró #817969, cuyo contraste contra blanco es 4.31:1. | Cerrado por revisión de token |
| UI-12 | P2 | Navegación oscura #25261F heredaba anillo #245A83 con contraste 2.08:1. La fuente actual define anillo local #B49A60, cuyo contraste es 5.62:1. | Cerrado por revisión de token |
| UI-13 | P2 | La vista Tabla explícita se conserva en móvil dentro de una región desplazable; la selección coincide con el contenido. | Cerrado por fuente y captura nueva de Clientes a 360 px |
| UI-14 | P2 | El menú Sheet incluye enlace Mi perfil y cierra el menú al navegar. | Cerrado por revisión de fuente actual |

Hallazgos de fuente inicial: src/components/finance-chart.tsx:6; src/components/report-page.tsx:18; src/components/login-form.tsx:34; src/components/entity-list.tsx:18; src/components/command-form.tsx:17; src/components/quote-form.tsx:31; src/app/(workspace)/perfil/page.tsx:3. Las líneas cambian durante el rediseño; referirse también al ID y al comportamiento.

Fortalezas conservadas: enlaces reales para navegación, etiquetas de formulario, estados vacíos/errores, menú Sheet con título, sesión protegida, filtros/vista/página representados en URL, importes basados en datos reales y fondo móvil que conserva el logo completo. No introducir cifras o clientes ficticios para mejorar una captura.

Contrastes calculados en esta revisión mediante luminancia relativa sRGB: acción #785B26/blanco 6.32:1, texto secundario #625E54/blanco 6.46:1, texto #292A25/fondo #F6F5F0 13.25:1, texto secundario de navegación #C1BEAF/#25261F 8.18:1 y texto principal de navegación #F4F1E8/#25261F 13.52:1. Son pares de tokens comprobados, no una medición de todas las superficies y estados del DOM final.

## Cierre verificable

El auditor inspeccionó las nuevas capturas de [Inicio a 1440 px](screenshots/redesign-dashboard-1440.png), [Finanzas a 1440 px](screenshots/redesign-finanzas-1440.png), [Nuevo pedido a 1440 px](screenshots/redesign-pedidos-nuevo-1440.png), [Nueva cotización a 1440 px](screenshots/redesign-cotizaciones-nueva-1440.png), [Nueva cotización a 360 px](screenshots/redesign-cotizaciones-nueva-360.png) y [Clientes a 360 px](screenshots/redesign-clientes-360.png). La jerarquía de métricas, gráfica visible, navegación, agrupación de formularios y tabla móvil explícita resuelven los hallazgos visuales principales. Estas imágenes no muestran desbordamiento horizontal de la página completa; la tabla conserva desplazamiento propio.

Root comunicó cinco pruebas E2E finales aprobadas, incluida una comprobación responsiva de 48 combinaciones: 12 rutas a 320, 360, 768 y 1440 px, además de igualdad de altura de 44 px en los campos del login y el flujo funcional. Es evidencia de la ejecución coordinada por root; este auditor no ejecutó esa prueba ni atribuye a ella comprobaciones de lector de pantalla, zoom o todos los estados interactivos.

Se volvieron a inspeccionar las capturas regeneradas de Finanzas y cotización móvil: los porcentajes ya muestran dos decimales, las variables presentan valores compactos completos y los controles Horas/Minutos/Segundos alinean su base aunque las etiquetas envuelvan. Estos puntos de pulido visual quedan resueltos.

Verificación adicional no realizada por este auditor: zoom 200 %, lector de pantalla, recorrido completo con teclado, foco efectivo tras rechazo del servidor, apertura/cierre del menú y medición de cada área táctil. Tampoco se ensayaron todos los estados de validación y operaciones sensibles mediante interacción manual.

Este documento registra una auditoría de código y capturas, no una certificación de accesibilidad. No acredita investigación con usuarios ni contraste de todas las combinaciones finales. Los resultados históricos del proyecto no prueban automáticamente el rediseño actual.

## Ajuste posterior: ancho disponible y colores de filamento

Se eliminó el límite de 1440 px del contenido del workspace y los límites locales de Ajustes y Mi perfil. Las páginas conservan un margen de trabajo y ocupan el ancho disponible junto a la navegación. Los formularios de catálogo tienen una columna de 400 px en escritorio; los filtros y la búsqueda comparten una fila cuando caben. Se desactivó la contención de tamaño del FieldGroup de filtros, que reducía su ancho intrínseco a cero al colocarlo en una fila flex.

Filamentos muestra muestras de color junto al texto en tabla, tarjetas y detalle. El selector visual guarda un código hexadecimal en el campo de color existente; los nombres españoles anteriores siguen siendo válidos. Las muestras por nombre son aproximadas. Valores desconocidos o multicolor conservan su texto y una muestra rayada en lugar de inventar un tono. No requiere migración ni modifica registros existentes.

El pedido provisional ahora explica cómo vincular una cotización aceptada y ofrece acceso a Cotizaciones. Las variables del cotizador se distribuyen en cuatro columnas en escritorio, dos en tablet y una en móvil; Mi perfil utiliza dos columnas para las contraseñas cuando hay espacio.

Evidencia adicional: screenshots/full-width-filamentos-1920.png contiene datos de pruebas; screenshots/full-width-filamentos-real.png muestra la ficha Azul existente sin modificaciones del catálogo real.

## Cotizador: distribución del espacio — 2026-10-04

Nueva cotización y edición comparten una columna principal flexible y un resumen lateral de 320 px en escritorio. Nombre, cliente y fechas ocupan una fila desde 1400 px; descripción y materiales aprovechan todo el ancho principal. Tiempo y postprocesado comparten una fila, las notas se distribuyen en dos columnas y los botones para añadir elementos tienen ancho ajustado. Las variables/multiplicadores se conservan en un desplegable, con los valores registrados aunque esté cerrado. Por debajo de 1024 px el resumen pasa al final; en móvil los campos conservan controles táctiles de 44 px.

Build/TypeScript y lint del cotizador PASS. Cinco pruebas E2E PASS (1,1 min), incluyendo 60 combinaciones responsive y el guardado completo con vinculación a pedido, ajustes comerciales, producción, pagos y entrega. Se revisaron las capturas regeneradas de cotización a 1440 y 360 px; no cambió la fórmula ni el esquema.

## Cotizador basado en la muestra del propietario — 2026-10-04

Se adaptó el HTML y la captura proporcionados: cabecera exclusiva del cotizador con breadcrumb y acciones, navegación carbón con acento dorado, proyecto en dos columnas, materiales con subtotal por línea, tiempo/postprocesado y notas agrupados. El resumen lateral ocupa 350 px en escritorio y pasa al final hasta 1250 px para evitar campos comprimidos. En móvil se conservan controles táctiles y campos apilados. Gramaje y COP/g conservan un decimal.

El resumen muestra cálculos reales, costo de producción, selección de nivel o precio manual, total sin impuestos y utilidad con semántica verde/roja. «Guardar borrador» mantiene el flujo existente; «Guardar y emitir cotización» guarda y publica usando comandos existentes con control de versión e idempotencia. «Copiar resumen para el cliente» copia nombre, precio y notas públicas, sin costos ni notas internas. El PDF sigue disponible desde la cotización guardada. No se añadieron datos ficticios de impresoras o reservas de inventario de la muestra.

### Resumen compacto según referencia — 2026-10-04

La selección de nivel y precio manual se trasladó a una tarjeta del formulario para mantener el resumen compacto. El resumen agrupa material con gramaje, impresión (energía y máquina) con duración, postprocesado, contingencia y utilidad porcentual con color semántico. Total destacado con COP y etiqueta Sin impuestos; emisión dorada, acciones secundarias en fila y nota inferior con costo de producción. El PDF de la versión guardada aparece únicamente en edición, con aviso explícito sobre cambios pendientes. Copiar resumen conserva los datos públicos actuales. No se muestran WhatsApp, inventario ni impresoras, que no están implementados.

### Elección de precio con utilidad por alternativa — 2026-10-04

El cuadro de precio presenta tres opciones seleccionables (mínimo, medio y alto) con importe, multiplicador, utilidad monetaria y margen sobre venta. Una cuarta zona contiene el precio manual y calcula su utilidad/margen en el mismo cuadro. Selección dorada con indicador y estado accesible aria-pressed; beneficios/pérdidas usan colores semánticos y texto. Escribir un manual sustituye visualmente la selección sugerida; elegir una opción limpia el manual para que exista un único precio efectivo. El manual sigue siendo alternativo, no obligatorio. Importes manuales inválidos no ocultan los controles ni muestran un total válido. Fórmula y esquema sin cambios.

## Detalle de cotización según referencia del propietario — 2026-10-04

La ruta /cotizaciones/[id] utiliza un componente específico con cabecera comercial, estado y fecha; proyecto/cliente desde snapshots de revisión; descripción y notas separadas; costo base destacado; material por línea con color, gramos, COP/g y subtotal; escenarios guardados y opción manual cuando existe; costos de impresión/acabados e historial de revisiones. Panel lateral oscuro con precio elegido, utilidad y margen, acciones según estado y descarga de PDF. Duplicación queda en el panel comercial sin repetirla en la cabecera. Se conserva la restricción existente de no crear revisión desde una aceptada. No se incorporaron WhatsApp ni sincronización de inventario del ejemplo. Datos monetarios de la revisión persistida, sin modificar fórmula o esquema.

Build/TypeScript y lint del componente/ruta PASS. Flujo E2E dirigido PASS (59,6 s total, incluyendo cierre manual del servidor temporal) con escenarios y precio elegido comprobados, captura de enviada a 1440/360 px, aceptación, vinculación al pedido y continuación de producción/costos/pagos/entrega. Capturas quote-detail-sent-1440.png y quote-detail-sent-360.png revisadas con datos de prueba aislados.

## Documento comercial PDF — 2026-10-04

El PDF sigue el estilo marfil/bronce/dorado de la referencia con emblema oficial, identificación de revisión y estado, cliente/emisión, proyecto y precio, notas públicas y total destacado. Mantiene el contrato comercial de datos y omite costos internos o términos no configurados. Paginación de texto largo con cabeceras de continuación y pies numerados. Evidencia y pruebas en VALIDATION_REPORT.md; muestra visual en screenshots/quote-pdf-example.png.

## Listado de cotizaciones según referencia — 2026-10-04

La referencia fe6a9096 corresponde al registro/listado /cotizaciones. Página específica con cabecera y acción Nueva cotización, cuatro indicadores del registro completo no archivado (mes por fecha comercial en Colombia, enviadas, aceptadas, promedio de cotizaciones con precio), filtros agrupados y tabla con proyecto/revisión, cliente, fecha/vigencia, estado, importe y PDF/detalle. Seguimiento cuenta borradores y enviadas. El total mensual incluye todos los estados con precio y no representa ventas; el promedio se calcula sobre cotizaciones, no pedidos cerrados. Los indicadores permanecen globales al filtrar; búsqueda/estado/orden/vista/paginación afectan los resultados. Vista de tarjetas manual y automática en móvil. Se omitieron exportación, comparativas, procesos FDM/SLA y tipos de cliente no implementados.

### Vista de tarjetas de cotizaciones
Adaptada a la referencia suministrada: franja y etiqueta por estado, cliente y revisión, vigencia real, filamento con muestra de color, gramos a un decimal, duración, fecha comercial, total COP y acciones PDF/detalle. Datos de materiales consultados por lote, filtrados por organización y revisión actual, sin modificar registros. Verificado con TypeScript, ESLint, build y navegador en 1440 y 360 px; sin desbordamiento horizontal. Capturas: docs/screenshots/quote-cards-desktop.png y quote-cards-mobile.png.

### Listado de pedidos
Tabla y tarjetas compactas adaptadas a la referencia: resumen de pedidos en curso, producción, listos para entrega y saldo global; materiales de la cotización aceptada con color y gramos, cliente, entrega vencida, precio, abonos y detalle. Sin funciones de exportación, WhatsApp o progreso ficticio. Indicadores filtrados por organización, pedidos no archivados y pagos no anulados; pruebas de integración independientes de búsqueda/paginación. Build, ESLint y ocho pruebas PostgreSQL pasaron; revisión visual 1440 y 360 px sin desbordamiento.

### Detalle del pedido
Vista dedicada basada en la referencia: cabecera con inicio/reimpresión, información y cliente, cotización aceptada con materiales y gramaje, costos/utilidad provisional o real, historial y correcciones conservadas; cuenta comercial oscura, abonos y edición en columna derecha. Sin controles ficticios de impresora/boquilla/WhatsApp/remisión. Móvil prioriza información. Validado build, ESLint y flujo E2E completo cotización-pedido-fallo-reimpresión-costos-abonos-entrega. Corregido orden cronológico de catálogos usando ISO para objetos Date. Capturas order-detail-confirmed-1440.png y order-detail-confirmed-360.png (datos de prueba aislados).

### Gestión unificada del pedido
Zona superior Estado del pedido con recorrido Sin empezar → Imprimiendo → Terminado → Entregado y acciones existentes según estado. Metadatos y ajustes comerciales unidos bajo Editar pedido y valores. Costos reales y confirmación de registro integrados en la tarjeta de utilidad; utilidad provisional usa ámbar. Abonos dentro del estado de cuenta y ocultos con saldo cero. Historial agrupado en desplegables. Build, ESLint y E2E completo con fallo/reimpresión/abonos/entrega pasaron. Capturas order-unified-1440.png y order-unified-360.png; datos del pedido del usuario no modificados.

## Entrega con fecha y cierre definitivo (2026-10-05)

El estado del pedido incluye fecha real de entrega al registrar la entrega. Se puede corregir hasta cerrar el pedido. El cierre exige confirmación explícita y un pedido entregado; conserva su historial en modo consulta, oculta formularios y bloquea comandos de modificación, costos, pagos y desembolsos bajo bloqueo de fila. La fecha se guarda a medianoche de Colombia para mantener el día comercial en reportes. La entrega prevista sigue siendo independiente. Migración 0003 añade closed_at y la restricción de cierre solo para entregados.

## Estado final Cerrado (2026-10-05)

Cerrado es el quinto estado persistido del pedido, posterior a Entregado. El cierre conserva delivered_at y registra closed_at y el evento de estado. Se muestra en hitos, tabla, tarjetas, filtros y conteos; no participa en trabajo activo y conserva sus resultados financieros por fecha de entrega. Migración 0004 adapta restricciones y convierte los pedidos con cierre previo al nuevo estado.

## Inicio según referencia (2026-10-05)

Dashboard dedicado con barra de períodos compacta, cuatro indicadores reales, ciclo de seis estados (incluido Cerrado y fallos), pedidos recientes con cliente/material/gramaje/valor y accesos rápidos laterales. No incluye porcentajes de crecimiento, disponibilidad de impresoras o carga de archivos sin funcionalidad real. Estilos limitados a Inicio; Finanzas conserva su diseño. El período de pedidos recientes se aplica en PostgreSQL antes del límite de ocho filas. Verificado a 1440 y 360 px con prueba de filtros y ausencia de desbordamiento; integración comprueba período antes de paginar.

## Costos reales confirmados desde cotización (2026-10-05)

Un administrador puede confirmar que el costo real coincide con la cotización vinculada cuando no existen costos registrados. Copia el desglose sin duplicados ni movimientos de caja y confirma costos completos con auditoría. Los pedidos cerrados siguen bloqueados. A petición explícita del propietario se corrigió una vez PED-000001, conservando su cierre, con costo 11793.066667 y precio 30000.
