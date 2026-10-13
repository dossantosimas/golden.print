# Guía de uso

Versión documental: 2026-10-10. Español, COP y fechas civiles de Colombia.

## Inicio

El período filtra pedidos por fecha del pedido y su estado actual. “Todo” conserva un corte hasta la fecha actual; un pedido con fecha futura puede no contarse todavía. La pestaña Pedidos puede mostrar otro conjunto si sus filtros difieren.

Saldo de caja actual es el acumulado de entradas menos salidas registradas hasta hoy, no la utilidad. Cartera global es saldo por cobrar de pedidos confirmados al corte. Un saldo negativo de caja describe más salidas registradas que entradas; no prueba por sí solo una deuda bancaria.

Pedidos recientes muestran proyecto, cliente, total de gramos y tiempo, estado, entrega y precio acordado. Consultar el detalle para ver cada material.

## Clientes y filamentos

En Clientes, solo el nombre es obligatorio en el servicio actual; teléfono, correo y demás datos son opcionales. Los formularios de creación se limpian tras guardar correctamente y conservan datos ante error.

Filamentos exige marca, modelo, material, color, precio y peso del rollo positivo. El costo por gramo es precio dividido por peso. Se reconocen nombres de colores como Piel, Verde limón y Madera; combinaciones como `Negro/Dorado/Rojo` se muestran con franjas. El color visual ayuda a seleccionar; el nombre identifica el registro.

Los selectores de cliente y filamento de cotización permiten búsqueda. Cambiar el precio por gramo en una cotización no modifica el catálogo.

## Cotizaciones

1. Crear proyecto y escoger cliente si ya se conoce.
2. Indicar cantidad de piezas iguales. Ingresar gramos, tiempo, postprocesado y precio manual **por pieza**: cantidad 2 multiplica todo por 2.
3. Revisar total, elegir precio y guardar borrador o emitir.
4. Aceptar la cotización antes de crear pedido.
5. Pulsar **Crear pedido**: el modal permite buscar el cliente y confirmar una compra nueva.

Puede crearse otro pedido desde la misma cotización para el mismo cliente o para otro. Vincular a un provisional solo se ofrece si existe uno del cliente seleccionado y evita duplicar un trabajo ya registrado.

Duplicar cotización crea un borrador editable para cambiar filamentos o condiciones. La aceptación no se copia. La opción Eliminar conserva evidencia mediante archivo cuando corresponde; el borrado físico se reserva a borradores sin evidencia publicada ni pedidos vinculados.

En **Imágenes de la cotización**, pulsa **Agregar imágenes** para elegir fotos JPG, PNG o WebP (hasta 10). Cada miniatura permite escribir un título o quitar la imagen. Espera que finalice la carga y guarda el borrador o emite la cotización para conservarlas. También puedes agregarlas al editar un borrador o crear una nueva revisión.

Duplicar conserva fotos y títulos, que pueden cambiarse en el nuevo borrador. Una revisión publicada mantiene las imágenes y títulos que tenía al emitirse.

El PDF contiene datos comerciales, cantidad y precio, sin costos, márgenes ni notas internas. Las fotos y sus títulos aparecen en páginas adicionales; las imágenes sin título se identifican como Imagen 1, Imagen 2, etc.

## Pedidos, entrega y cierre

Secuencia principal: Sin empezar → Imprimiendo → Terminado → Entregado → Cerrado. Un fallo permite reimprimir dentro del mismo pedido conservando intentos.

La fecha real de entrega se registra al entregar; puede corregirse antes de cerrar. Terminado no exige una segunda fecha de entrega. En listados, un pedido entregado/cerrado muestra su entrega real; en pendientes se muestra la prevista cuando existe.

**Entregar no significa pagar.** Abrir el detalle y registrar el abono o el saldo completo con fecha efectiva y medio de pago. Las opciones son Efectivo, Transferencia bancaria, Nequi, Daviplata, Tarjeta débito, Tarjeta crédito y Otro. Valores históricos diferentes pueden conservarse.

El saldo se calcula a partir de pagos válidos. Cerrar requiere pedido entregado, saldo cero y confirmación; el servidor también lo valida. Cerrado bloquea cambios ordinarios. La acción administrativa Eliminar archiva incluso pedidos cerrados con motivo, conservando auditoría y pagos.

## Gastos y finanzas

Registrar gasto con su fecha real, clasificación, categoría, valor y responsable. Si aparece “Guardado correctamente” y no se ve en la lista, revisar período, búsqueda y filtros antes de repetirlo.

Compra de material afecta caja; no vuelve a sumar costo del producto. Un gasto operativo afecta caja y utilidad del período. Una pérdida independiente no debe repetir un costo ya registrado.

Finanzas compara Ventas, Cobrado, Costo del producto, Operativos y Utilidad neta. Cobrado pertenece a los pedidos entregados seleccionados, acumulado hasta el corte; no equivale a todas las entradas del período. La cartera global puede incluir pedidos de otra cohorte. Ver [reglas financieras](FINANCIAL_RULES.md).

## Accesos

El administrador crea usuarios y gestiona roles. No puede quitar el último administrador activo. Perfil permite cambiar contraseña propia; usuarios y detalle permiten las acciones autorizadas del rol.

Cuando la sesión real expira o se revoca, el guard redirige a login. Mantener una pestaña abierta no renueva la sesión mediante el guard; ver la política exacta en [operación](OPERATIONS.md).

## Elegir quién paga un gasto

En Gastos → Registrar gasto, elige **Origen del dinero**. **Empresa** descuenta caja y permite identificar al responsable del registro. **Dinero de un usuario** solicita el usuario que pagó y no descuenta caja. Los gastos operativos siguen afectando la utilidad. El listado muestra **Pagado por** y el detalle muestra el origen y la salida de caja correspondiente.

Si el origen de un gasto anterior es incorrecto, abre su detalle y usa la corrección con motivo. Los gastos existentes mantienen su contabilización hasta corregirlos.

Actualización 2026-10-12: el selector Origen del dinero muestra Empresa y cada usuario por nombre, en una única selección. Elegir un usuario envía fundingSource=user y su responsibleUserId; Empresa conserva al responsable del registro internamente. No cambia la regla de caja ni los registros anteriores.

## Ficha del cliente

La ficha agrupa contacto y notas, pagos recibidos y saldo por cobrar. El resumen considera pedidos no archivados y pagos no anulados, sin filtro por período. Las pestañas Pedidos y Cotizaciones abren el detalle de cada registro. Editar ficha lleva al formulario con los datos actuales; teléfono sigue siendo opcional. WhatsApp y llamada aparecen cuando existe teléfono. Archivar conserva el historial.

## Comparar meses en Finanzas

Este mes toma el día 1 hasta hoy en Colombia. Mes pasado toma el mes calendario completo anterior. Se conservan los rangos móviles 1 mes y 3 meses. En Comparación mensual elige Mes base y Mes a comparar; la gráfica contrasta ventas, recaudo, utilidad neta y caja neta. La tabla añade costos, gastos, pérdidas, entradas/salidas y cartera. Diferencia = mes a comparar menos mes base; variación porcentual solo tiene base cuando el valor base es positivo.

El mes actual se identifica como incompleto. Ventas y costos corresponden a entregas, recaudo a fecha de pago, caja a fecha de movimiento y cartera al saldo acumulado al corte. Son registros vigentes recalculados; no snapshots históricos inmutables.
