# Mantenimiento y continuidad

Actualizado: 2026-10-09.

Antes de editar, leer [estado](PROJECT_STATUS.md), [requisitos](REQUIREMENTS.md), [reglas financieras](FINANCIAL_RULES.md), instrucciones del repositorio y diff existente. No reiniciar el blueprint para un ajuste acotado.

## Flujo de cambio

1. Reproducir el problema y seguir pantalla, petición, autorización, servicio, datos y respuesta.
2. Confirmar regla comercial cuando falte información material; no inferir fechas o pagos.
3. Asignar archivos y contratos si se autoriza delegación.
4. Implementar y ejecutar verificación proporcional: dominio, integración, navegador y build cuando corresponda.
5. Registrar resultados reales y limitaciones; las pruebas no ejecutadas permanecen como tales.
6. Si se publica dentro de autorización vigente, verificar commit, proyecto, despliegue y alias.
7. Actualizar el documento dueño de la regla, estado y changelog.

## Lecciones reutilizables

- Idempotencia de petición no impide otra compra del mismo producto.
- Cantidad necesita distinguir datos unitarios de columnas totales.
- Entrega, pago, cierre y archivo son acciones diferentes.
- Ventas, cobro y caja usan fechas y conjuntos diferentes.
- UI no reemplaza validaciones del servidor.
- Guardar con éxito no asegura visibilidad dentro del filtro seleccionado.
- Archivar no borra dinero recibido ni representa devolución.
- Evitar escritura paralela sobre archivos compartidos.
- Mantener secretos fuera de documentación y evidencia.
- Un push, un build o una revisión estática no prueban un recorrido productivo.

## Correcciones de producción

Alcance autorizado, organización e IDs exactos, estado esperado, transacción, motivo/auditoría y verificación posterior. Registrar evidencia privada sin copiar datos personales al repositorio. Si se necesita revertir, planificarlo con respaldo y verificar campos no afectados.

Prioridades y límites: [IMPROVEMENTS](IMPROVEMENTS.md) y [OPERATIONS](OPERATIONS.md).
