# UX Plan — Golden Print 3D

Fecha inicial: 2026-10-02. Branding actualizado: 2026-10-03. Autor: uiux_designer. Estado: propuesta de blueprint para revisión, sin UI implementada ni pruebas de usabilidad ejecutadas.

## 1. Propósito, fuentes y decisiones

Herramienta administrativa interna para una empresa de impresión 3D. La tarea principal es cotizar, convertir una oferta en pedido y seguir producción, costos reales y cobros con historial verificable. El propietario solicita ahora una imagen generada para integrar el logo en el fondo del login: [LOGIN_BACKGROUND_V2.md](LOGIN_BACKGROUND_V2.md) sustituye las indicaciones anteriores de presentar el JPG como imagen independiente y la maqueta LOGIN_PREVIEW.svg. El formulario seguirá siendo HTML/shadcn sobre una zona legible del fondo.

Fuentes: [REQUIREMENTS.md](REQUIREMENTS.md), [PRD.md](PRD.md), [FINANCIAL_RULES.md](FINANCIAL_RULES.md), [DATABASE_DESIGN.md](DATABASE_DESIGN.md) y [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md). La fórmula financiera y las bases temporales pertenecen a FINANCIAL_RULES; la interfaz no mantiene reglas alternativas. Roles, reconocimiento por entrega y eliminación conservadora son propuestas para aprobación del blueprint.

Se aplicó frontend-design-pro y su búsqueda design-intelligence mediante Python, sin instalar paquetes ni generar código. Consultas: `internal manufacturing finance dashboard dense tables accessible ivory gold` (design-system), `financial dashboard comparison distribution evolution bars line chart` (chart), `table forms keyboard modal touch focus accessibility` (ux). Evidencia útil: alto contraste, foco visible, navegación por teclado, teclado numérico móvil y barras con valores. La sugerencia de landing del buscador no corresponde al producto. La propuesta visual deriva del negocio y conserva los controles administrativos requeridos.

## 2. Dirección visual y tokens propuestos

Marfil para el espacio de trabajo, carbón para información y acciones, dorado latón para selección y firma Golden Print 3D. La dirección incorpora los dos originales entregados por el propietario el 2026-10-03: la marca manuscrita completa aporta marfil/carbón y el emblema aporta el dorado. Los tokens son interpretación accesible de la paleta visual, no una extracción cromática exacta del bitmap. Predominan filas alineadas, espacios claros y encabezados compactos. Detalle propio: una regla dorada delgada identifica el documento y el total elegido en el cotizador/PDF. No se distribuye el acento por cada métrica.

Originales preservados: [marca con nombre](assets/brand/golden-print-wordmark.jpg), 976×547, y [emblema](assets/brand/golden-print-emblem.png), 469×469. Login usa obligatoriamente la primera imagen completa con el nombre Golden Print 3D; el emblema solo puede actuar como firma secundaria, nunca sustituirla allí. Mantener bitmap, proporción, textura y fondo original: `contain`, sin recorte, filtros, recoloración, deformación ni eliminación de fondo. El texto alternativo será «Golden Print 3D». La imagen no sustituye etiquetas del formulario.

| Rol | Valor propuesto | Uso |
|---|---|---|
| Fondo | `#F4F1E8` | Lienzo marfil derivado de la marca |
| Superficie | `#FFFFFF` | Formularios, tablas y paneles |
| Texto/primario | `#393A32` | Carbón de la marca; texto y navegación |
| Texto secundario | `#625E54` | Etiquetas auxiliares y unidades |
| Dorado/acción | `#785B26` | Latón oscuro; CTA con blanco, selección, texto de acento |
| Dorado decorativo | `#B49A60` | Regla/firma; nunca texto pequeño sobre blanco |
| Dorado suave | `#EEE3C8` | Fondo de selección con texto carbón |
| Borde funcional | `#817969` | Inputs/controles y separaciones necesarias |
| Borde decorativo | `#DDD7CA` | Separaciones sin función de identificación |
| Éxito | `#17613D` sobre `#E9F3EC` | Pagado, terminado, mensajes positivos |
| Advertencia | `#755000` sobre `#FFF0CE` | Pendiente, provisional, costos incompletos |
| Error | `#A12024` sobre `#FDEDEE` | Dañado, errores, pérdida |
| Información/foco | `#245A83` | Imprimiendo, anillo de foco visible |

Ratios calculados documentalmente con luminancia sRGB: blanco sobre acción `#785B26` 6,32:1; carbón sobre marfil 10,19:1; secundario sobre blanco 6,46:1; borde funcional sobre blanco 4,31:1; acción sobre marfil 5,60:1. Verificar contrastes de combinaciones reales y estados en implementación: texto normal ≥4.5:1, texto grande y bordes de controles/foco ≥3:1. El dorado claro no se usa como texto ni como borde funcional sobre blanco. Ningún estado depende solo del color.

### Login con identidad original — propuesta revisable

[LOGIN_PREVIEW.svg](LOGIN_PREVIEW.svg) es una **maqueta visual estática de diseño**, 1600×1000, con la marca JPG original embebida íntegra para portabilidad. No contiene autenticación, scripts ni conexión a datos; no es scaffold ni pantalla implementada. El ajuste de branding no constituye aprobación del blueprint.

Desktop: lienzo marfil, panel editorial izquierdo con marca completa centrada y separación dorada fina; panel derecho blanco con título «Iniciar sesión», correo electrónico, contraseña, control para mostrar contraseña y botón latón oscuro «Iniciar sesión». Labels visibles, bordes funcionales legibles y error próximo al campo en la implementación posterior. Mantener un solo CTA; asistencia al administrador como texto discreto, sin registro público ni recuperación por correo simulada. Marca muestra a 700×392,315 px aproximadamente, proporción original 976:547; SVG usa preserveAspectRatio y no recorta. No repetir el emblema en gran tamaño ni agregar mensajes publicitarios.

Móvil 360 px: una columna con márgenes 16 px, marca completa arriba con ancho máximo de 328 px y alto proporcional ≈184 px; formulario debajo en ancho disponible, sin panel lateral ni altura fija de viewport. Inputs y botón ≥48 px, correo con teclado email y contraseña con botón accesible separado; teclado virtual no tapa CTA y el usuario puede desplazar la página. A 768 px mantener una columna si dos paneles estrechan formulario; adoptar paneles desde 1024 px. El foco de implementación usa `#245A83` de 3 px separado de controles; error y loading siguen §7. Revisar con login real después de autorización de implementación.

Tipografía: Source Sans 3 para controles, párrafos y tablas; Lexend solo para títulos breves, con fallback de sistema. Si no se dispone de fuente local al implementar, usar la familia de sistema sin bloquear tareas. Cifras tabulares en precios, duraciones, porcentajes y tablas. Escala: título 24/30 px, sección 20/26, cuerpo e inputs 16/24, metadatos 14/20; labels legibles, sin mayúsculas prolongadas. Separaciones 4/8/12/16/24/32 px; radio 8 px; elevación solo en overlays. Iconos de una sola biblioteca del proyecto, sin emoji.

## 3. Arquitectura de navegación y permisos

Desktop: barra lateral de 232 px, marca, navegación y usuario al pie; área de contenido con máximo aproximado de 1240 px. Cabecera de cada módulo: título, acción principal y controles contextualizados. Breadcrumb solo en documentos/detalles. Móvil: barra superior con título y botón «Menú», drawer de navegación y acceso al usuario; cerrar menú tras navegar y devolver foco. No ocultar módulos detrás de gestos.

| Grupo | Destino | Trabajo y acción principal |
|---|---|---|
| Inicio | Dashboard | Revisar situación; acceso a nuevo pedido o cotización |
| Operación | Pedidos | Buscar/seguir trabajo; «Nuevo pedido» |
| Operación | Clientes | Identificar cliente/historial; «Nuevo cliente» |
| Cotizaciones | Cotizador | Preparar cálculo; «Guardar cotización» |
| Cotizaciones | Historial de cotizaciones | Recuperar documento/revisión; «Nueva cotización» |
| Gestión | Finanzas | Revisar resultados, caja, pérdidas y equilibrio |
| Gestión | Gastos | Registrar egreso clasificado; «Nuevo gasto» |
| Catálogo | Filamentos | Mantener ficha y costo/g; «Nuevo filamento» |
| Administración | Usuarios | Autorizar equipo; «Crear usuario» |
| Administración | Ajustes | Guardar valores futuros y datos del negocio |

Admin ve todos los destinos. Operador ve clientes, cotizaciones, pedidos, producción y catálogo; no ve pagos, gastos, finanzas, usuarios ni ajustes. Dashboard del operador contiene estados de producción y acceso a trabajo; las métricas financieras globales requieren admin. En el pedido, operador conserva precios/costos necesarios para cotizar y producción, según política propuesta REQ-003; los cobros requieren admin. Los permisos se aplican en servidor además de navegación. Ruta denegada: «No tienes acceso a esta sección» con regreso a Pedidos, sin datos restringidos.

No existe signup público ni pantalla que permita reclamar primer administrador. El primer acceso se provisiona por procedimiento privado según stack. Login con email/contraseña, mostrar contraseña opcional y errores genéricos sin revelar existencia de cuenta. «Solicita ayuda al administrador» para recuperación asistida; sin enlace que simule correo. Perfil permite cambio autenticado de contraseña y cierre de sesión. Usuarios muestra nombre, email, rol, activo/inactivo; alta y restablecimiento administrativos no exponen contraseña en listados/historial. Impedir desactivar o cambiar rol del último administrador con explicación próxima al control.

## 4. Flujos de negocio

### Cotizar → documento → pedido

1. Cotizador inicia un borrador: proyecto/nombre, cliente opcional, descripción. Combobox permite buscar cliente y «Crear cliente» mediante dialog breve; el nuevo cliente queda seleccionado al guardar.
2. Materiales: filas de filamento, gramos, COP/g editable para esta cotización y subtotal. Buscar por marca/modelo/material/color; nombre completo accesible. Agregar/quitar líneas sin cambiar precio del catálogo. Campos con unidades visibles y teclado decimal. Retirar una fila enfoca la siguiente o «Agregar material».
3. Tiempo: horas, minutos y segundos con labels separados; minutos/segundos 0–59, horas ≥0. Mostrar duración resultante. Potencia kW, COP/kWh, COP/h y contingencia % son editables en grupo «Variables del cálculo», con valores vigentes precargados.
4. Postprocesado: filas de concepto y costo COP; opciones lijado, pintura, armado y «Otro» editable. Cada línea se suma al costo antes de aplicar multiplicadores. Contingencia sigue solo sobre material.
5. Resumen interno: material, energía, máquina, contingencia, postprocesado y costo de producción estimado. Tres opciones mediante radios «Mínimo», «Medio», «Alto»: multiplicador editable, precio COP, diferencia COP, recargo sobre costo y margen sobre venta. No preseleccionar una oferta comercial en un nuevo borrador; requerir selección para documento enviado/conversión. Guardar borrador admite datos comerciales incompletos válidamente marcados.
6. Guardar confirma ID y abre detalle. «Marcar enviada» requiere oferta elegida y datos documentales válidos; cliente sigue opcional en cotización y el PDF omite campos ausentes. Registra el hecho, no afirma que se envió un correo. PDF se genera desde revisión guardada. Historial permite consultar revisión y duplicar como nuevo borrador; edición posterior de una enviada crea revisión, conservando snapshot anterior.
7. Aceptar oferta registra elección y confirmación comercial. «Crear pedido» exige cliente y lleva proyecto, descripción, precio y estimado de la revisión aceptada, con vínculo COT/PED visible. Si cotización no tiene cliente, pedir seleccionarlo/crearlo antes de confirmar. Un reintento devuelve el pedido existente; si ya se convirtió, acción «Abrir pedido». Los estados cotización, producción y pago son independientes.

Tooltip accesible sobre bases: «Multiplicador: precio dividido entre costo. Recargo: diferencia dividida entre costo. Margen sobre venta: diferencia dividida entre precio». Mostrar 2×, 2,5× y 3× con recargos 100/150/200% y márgenes 50/60/66,67%; nunca llamar 2× «margen 200%». Si costo o precio es cero, la razón correspondiente muestra «Sin base de cálculo». Advertencia junto a precio elegido inferior al costo estimado. La reserva de contingencia no se registra como pérdida real.

Desktop cotizador: formulario 2/3 y resumen 1/3; resumen sticky dentro del viewport sin tapar acciones. Móvil: grupos verticales y resumen al final, botón de guardado en zona visible con espacio inferior suficiente; ningún control queda cubierto al abrir teclado. Preservar borrador en memoria al abrir dialogs y advertir antes de navegación que lo descartaría; no afirmar autoguardado si no existe.

### Pedido → producción real → reimpresión

Detalle PED con cliente, proyecto, estado de cotización, estado de pedido y estado de pago en grupos separados. Pestañas «Resumen», «Producción y costos», «Pagos» (admin), «Historial». Resumen compara costo estimado y costo real, diferencia y margen, con etiqueta «Provisional: faltan costos» cuando corresponda. Nunca reemplazar desconocido por cero. Acciones según transición válida: iniciar, terminar, entregar o registrar fallo; entregar conserva abonos pendientes.

«Nuevo pedido» sin cotización crea intake provisional con cliente/proyecto y badge «Falta por cotizar». «Preparar cotización» vincula el cálculo a ese mismo PED; aceptar/confirmar reutiliza el registro provisional. Hasta confirmación no hay precio contractual, pagos ni producción habilitados: mostrar motivo y acción para cotizar. No presentar precio nulo como cero ni sumar intake a ventas.

Iniciar crea intento numerado. En Producción, cada intento tiene fechas, resultado, motivo de fallo y costos por categoría; postprocesado general puede asociarse al pedido. Marcar conocido/cerrado explícitamente, incluso si un componente conocido es cero. Antes de terminar/entregar, pedir revisión de completitud: registrar costos o conservar incompleto con estado provisional cuando la política permita continuar. No declarar resultado definitivo con costos abiertos.

«Registrar fallo» cierra intento y pide motivo/costos conocidos; pedido Dañado. «Reimprimir» crea el siguiente intento en el mismo PED y vuelve Imprimiendo; conserva venta, precio, pagos y costos previos. Mostrar subtotal de fallos como parte del costo real, con aclaración contextual «Incluido en costo real». No ofrecer «Registrar pérdida» por el mismo intento.

Al registrar costo real, distinguir costo económico y salida efectiva: categoría, importe, fecha, intento y clasificación variable/no variable. Control de origen de caja: «Sin nuevo desembolso», «Cubierto por gasto/compra registrado» o «Desembolso directo». Vincular fuente identificable; mostrar referencia para evitar electricidad/rollo/mantenimiento duplicado. Producción no genera caja por el simple registro de costo.

### Anticipo y abonos

Admin abre «Registrar pago» desde pedido confirmado: mostrar precio acordado, recibido y saldo; fecha efectiva Bogotá y valor COP obligatorios, medio/referencia/notas opcionales. «Completar saldo» precarga el importe, requiere guardar pago. Estado visible mantiene «Pendiente de pago» hasta saldo cero; detalle «Recibido $… · Saldo $…» comunica parcialidad.

Bloquear importe cero/negativo/superior a saldo con error junto al valor. Durante envío deshabilitar submit e indicar «Registrando…»; doble clic/reintento no crea otro pago. Si otro usuario cambió saldo, mantener captura, actualizar saldo y solicitar ajustar valor. Éxito: historial, saldo y caja se actualizan desde respuesta autoritativa. No hay botón de devolución ni edición/eliminación corriente de pago. «Corregir registro» solo admin, motivo obligatorio, confirmación con original/reemplazo y aviso de recálculo; evidencia original visible como anulada técnicamente. No sugiere devolución de efectivo.

### Egreso y pérdida independiente

Nuevo gasto: fecha, descripción, clasificación «Gasto operativo»/«Compra de materiales», categoría, COP, responsable y notas; si OPEX, fijo/variable. Etiquetas indican efecto: OPEX afecta resultado/caja; compra afecta caja y el consumo se registrará como costo real. No generar stock avanzado ni consumo automático del rollo. Desembolso directo de producción se registra desde el pedido, con origen enlazado, sin duplicarlo como OPEX.

Finanzas → Pérdidas permite costo económico independiente sin pedido: fecha, concepto, categoría, importe y origen. Aviso contextual: «Si pertenece a un intento, regístralo en el pedido». No sumar como segunda deducción un fallo ya incluido. Incobrables/condonaciones quedan NEXT: saldo pendiente no activa pérdida ni pago ficticio.

## 5. Vistas y jerarquía de información

| Pantalla | Información y comportamiento |
|---|---|
| Dashboard admin | Período/corte común; total y conteos de estados; Ventas (entregadas), Recaudo del período, Cartera global al cierre y Utilidad operativa provisional/definitiva; distribución de estados en barras; pedidos que requieren atención y enlaces filtrados |
| Pedidos | ID, proyecto/cliente, tres estados, fecha pedido/entrega, precio, estimado/real y margen COP/% etiquetado. Vista tabla/cards equivalente; abrir detalle para observaciones, cotización y desgloses. Estado pago no editable manualmente |
| Clientes | Nombre/contacto, último pedido, cantidad, valor confirmado y saldo; detalle con pedidos/cotizaciones e indicadores. Ranking por cantidad/valor con selector explícito; no confundir valor comercial confirmado con ventas reconocidas por entrega |
| Finanzas | Pestañas Resultados, Caja, Cartera y Pérdidas; misma selección de fechas. Resultados: ventas, costo real, bruto COP/%, OPEX, pérdidas independientes y utilidad; Caja: entradas/salidas/neto; Cartera global y cohorte claramente separadas; equilibrio con motivos si no estimable |
| Gastos | Tabla de fecha, concepto, clasificación, categoría, importe y responsable; barras por categoría/responsable y evolución; separar OPEX y compra de materiales en totales |
| Filamentos | Marca/modelo, material, color textual con muestra opcional, compra COP, peso g, COP/g calculado. No afirmar disponibilidad/stock; campos avanzados pertenecen NEXT/FUTURE |
| Historial cotizaciones | Código, revisión, proyecto, cliente o «Sin cliente», fecha, estado, nivel y precio seleccionado; filtros, consultar, duplicar, PDF, convertir cuando proceda |
| Ajustes | Datos de empresa y defaults del cotizador con unidades y multiplicadores; guardar una versión futura. Mensaje tras guardar: «Los nuevos valores se aplican a nuevas cotizaciones»; documentos anteriores conservan snapshot |

Tablas con encabezados semánticos, importes alineados a derecha y acciones al final. Ordenar anuncia columna/dirección; paginación con conteo real, sin cargar todas las filas. Búsqueda por código/proyecto/cliente y filtros separados de estado de cotización, producción y pago. Filtros activos como chips removibles y «Limpiar filtros». Alternar tabla/cards conserva filtros, orden y página en URL. Cards presentan los mismos registros y acciones, con detalle expandible para columnas secundarias; no cambia la lógica de selección.

## 6. Fechas, métricas y gráficos

Locale `es-CO`, moneda COP explícita en cabeceras; ejemplo `$ 30.164 COP`. Precio cobrable/pagos enteros; costos estimados hasta dos decimales, cálculos desde valores originales. Entrada decimal debe interpretar formato local consistentemente, sin analizar cadenas de precio formateadas. Fecha visible `02 oct 2026`; date input de negocio sin desplazamiento de día por UTC. Auditoría incluye hora Colombia; timestamps persistidos no cambian por el equipo del usuario.

Filtro compartido: últimos 7 días, mes móvil, 3 meses móviles, año actual, histórico y rango personalizado inclusivo, según FINANCIAL_RULES. Mostrar rango exacto y cierre usado; rechazar inicio posterior a fin y cierre futuro. Conservar en URL y al volver del detalle. Cada bloque muestra su base cuando cambia la interpretación: «Por fecha de entrega», «Por fecha de pago», «Saldo al cierre». Distribución operativa filtra fecha de pedido en el rango y muestra su estado actual, con etiqueta «Estado actual · pedidos del período»; no promete reconstrucción histórica de estado ni deriva conteos de ventas entregadas. Dashboard y Finanzas consumen la misma métrica para una misma base/período.

Distribución: barras horizontales con estado escrito, conteo y porcentaje; orden de flujo No iniciado/Imprimiendo/Terminado/Entregado/Dañado, no reordenar de manera impredecible. Categorías de gastos/ranking: barras ordenadas por importe con valor visible. Evolución: líneas con series tituladas y unidad COP; separar gráfico «Ventas y costos reconocidos» de «Entradas y salidas de caja». No juntar venta comprometida, reconocida y cobro como una serie «Ingresos». Eje temporal y granularidad visibles; sin suavizado que invente eventos. Tasa de cobro usa pagos acumulados de la misma cohorte, no entradas de caja de otra fecha.

Todos los gráficos tienen resumen textual y tabla accesible de datos, leyendas con nombre/patrón además de color, tooltip alcanzable por teclado y valores exactos. Sin 3D, gauges ni pie con múltiples estados difíciles de comparar. Datos faltantes no se grafican como cero; período válido sin eventos sí muestra cero. Punto de equilibrio: progreso numérico puede superar 100%, barra visual limitada; mostrar «No estimable: faltan costos», «Sin ventas», «Contribución no positiva» o «Sin costos fijos que cubrir», según dominio. No inventar meta ante denominador cero.

## 7. Componentes, feedback y accesibilidad

Combobox de cliente/filamento: label visible, búsqueda, opciones identificables, arrows/Enter/Escape, rol apropiado, anuncio de resultados; «Sin coincidencias» y crear cuando autorizado. Inputs con unidad, instrucciones solo donde evitan error y validación próxima. No usar placeholder como label. Botón principal único por tarea; acciones secundarias de guardar borrador/consultar se diferencian de enviar/aceptar.

Dialogs para cliente, pago, gasto, confirmación y correcciones breves; detalle de pedido/cotización en ruta para formularios largos. Desktop drawer para edición contextual; móvil sheet completo con cabecera y cierre accesible. Dialog/sheet con título, descripción pertinente, foco inicial lógico, Tab contenido, Escape en acciones reversibles y restauración al disparador. Confirmaciones destructivas enfocan acción segura y nombran entidad/efecto. Bloqueo por relaciones explica «Este cliente tiene pedidos; puedes desactivarlo»; no borrar trazabilidad financiera para resolver una restricción.

| Estado | Respuesta especificada |
|---|---|
| Primera visita vacía | «Aún no hay pedidos» y «Nuevo pedido»; catálogo vacío ofrece crear filamento antes de seleccionar; no datos de muestra presentados como reales |
| Búsqueda sin resultados | «No hay pedidos con estos filtros» y «Limpiar filtros» |
| Loading inicial | Skeleton de geometría estable, región busy y texto breve; sin métricas falsas |
| Actualización con filtro | Conservar datos previos con indicador «Actualizando…» y selección visible; no presentar datos anteriores como definitivos del nuevo período |
| Error lectura | Mensaje específico recuperable «No pudimos cargar los pedidos» + «Reintentar»; no reemplazar falla por lista vacía |
| Error formulario | Mantener valores, error junto al campo y resumen enlazado si hay varios; foco en primer error tras submit |
| Saving | Botón con progreso y prevención de reenvío; resultado accesible mediante status |
| Save incierto por red | «No pudimos confirmar el guardado»; reintentar la misma operación/idempotencia o consultar resultado, sin crear nuevo pago/conversión |
| Conflicto de versión | «Otro usuario modificó este registro»; recargar/contrastar antes de guardar, sin perder captura ni sobrescribir silenciosamente |
| Sesión vencida | Login con retorno a ruta autorizada; no enviar mutación pendiente automáticamente tras autenticar ni perder borrador no sensible cuando sea viable |
| Error PDF | Cotización permanece guardada; «No pudimos generar el PDF» + reintento sobre la misma revisión |

Teclado completo, enlace saltar al contenido, regiones/encabezados coherentes, foco 3 px visible sin quedar tapado por sticky/footer. Objetivo 44×44 px mínimo en controles táctiles, preferir 48 px en móvil; espaciado entre acciones. Labels y nombres accesibles incluyen contexto en iconos «Editar cliente …». Badges con texto y símbolo opcional; semáforo económico positivo/provisional/pérdida siempre escrito. Tooltips no contienen información imprescindible exclusiva al hover. Anunciar guardado/error sin mover foco innecesariamente. Transiciones 120–180 ms de opacidad/transform con reduced-motion; sin animación necesaria para comprender resultado.

## 8. Composición responsive

| Tamaño | Composición |
|---|---|
| 360 px | Margen 16 px; una columna; cards por defecto en listados; toolbar envuelve con búsqueda en ancho completo y botón Filtros; formularios secuenciales; navegación drawer; resumen cotizador debajo; diálogos fullscreen cuando el contenido lo requiera |
| 768 px | Dos columnas cuando contenido lo admite; menú colapsable; finanzas/gráficas apiladas si labels compiten; sin comprimir h/m/s ni importes |
| 1024–1440 px | Sidebar estable; tablas y split del cotizador; métricas en grupos limitados, dos gráficas por fila solo si siguen legibles |

A 1440 px: `sidebar | título + acción / filtros / métricas / gráfica + atención / listado`. A 360 px: `cabecera / acción / filtro / métricas apiladas / gráfica / cards`. Preferir wrap y detalle expandible frente a truncado; largos nombres/observaciones tienen lectura completa en detalle. Tabla opcional móvil puede desplazarse dentro de su región indicada, pero página completa sin overflow; cards completan la alternativa. Zoom 200% y texto ampliado conservan navegación, precio y submit. No fijar alturas que corten contenido traducido/variable.

## 9. Cotización PDF y límites de exposición

Documento cliente desde snapshot de revisión guardada: A4, márgenes 18–20 mm, carbón/blanco y regla dorada, marca Golden Print 3D textual, código/revisión, fecha, cliente y contacto pertinente, proyecto, descripción, precio elegido COP, validez (`valid_until` si existe) y notas para cliente. Si no existe validez, omitir campo sin inventar días. Snapshot conserva nombres/contactos/precio/notas aplicados a esa revisión; cambios en cliente o ajustes no alteran un PDF anterior. Revisión se identifica sin confundir COT con PED.

Título 20–24 pt, texto 10–11 pt, total 16–18 pt y números alineados. Wrapping medido y paginación para nombres/descripciones/notas largas, encabezado breve y número de página en documentos multipágina; nunca separar total de su label. Tildes y ñ verificadas; caracteres adicionales necesitan fuente compatible controlada. PDF cliente no incluye costo de material, energía, máquina, contingencia, PP interno, multiplicadores, markup, margen, pagos, notas internas ni costos reales. «Vista interna» es la pantalla administrativa con desglose, claramente separada de «Vista previa cliente»; no crear export interno accidental con el mismo botón. Marcar enviada no representa email automático.

## 10. Handoff y verificación posterior a aprobación

Implementar con Tailwind/shadcn y formularios RHF/Zod del stack; Recharts usa datos del dominio, jamás fórmulas paralelas. Entregar estados e interacciones junto a cada módulo. No generar assets ni mocks como sustitución del flujo real.

Confirmación del propietario 2026-10-03: usar shadcn/ui como sistema de componentes obligatorio y la skill oficial incorporada al framework. [SHADCN_UI_PLAN.md](SHADCN_UI_PLAN.md) define @shadcn, Base UI, composición de login/formularios/modales/tablas, tokens de marca y responsabilidades de frontend_developer/uiux_designer. Mantener logo completo y paleta actual; la inicialización y los componentes reales se generan solo después de aprobación.

| Validación pendiente | Evidencia de aceptación |
|---|---|
| REQ-017–025 / AC-POST-021 | C_base 10000 + PP 2000 → costo 12000; opciones 24000/30000/36000, PP antes de multiplicar; documento cliente sin costos internos |
| REQ-005–007, 026–027 | Mismo PED después de fallo/reimpresión; costos acumulados una vez; abonos y estado pago independientes; tabla/cards conservan acciones |
| REQ-010–015 / CFR-003 | Dashboard/Finanzas con igual período/base coinciden; caja y ventas distintas; compra/consumo/pérdidas sin duplicación; equilibrio cero/incompleto legible |
| REQ-001–003 / CFR-001 | Sin registro público; operador denegado por URL/API; último admin protegido; login/expiración recuperables |
| REQ-029 / CFR-002 | Flujo cotización→pedido→pago por teclado; 360/768/1440 px, zoom 200%, contraste, lector de pantalla, foco y targets verificados con pantallas reales |
| REQ-031 / CFR-004 | Reenvío/conflicto/conversión concurrente no duplican; errores mantienen entradas y estado autoritativo |
| REQ-025 / AC-PDF-025 | PDF simple y multipágina con nombres/notas largos, tildes/ñ, validez opcional y snapshots estables |

Estado actual: revisión documental y cálculo sRGB de pares base realizados; maqueta SVG de login con originales disponibles. No UI funcional, prototipo interactivo, pruebas de lector de pantalla, auditoría de todos los estados de contraste ni tests de runtime ejecutados. El blueprint define criterios, no afirma cumplimiento implementado. Roles y políticas financieras propuestas quedan en el gate general del blueprint, sin preguntas adicionales de UX bloqueantes.
