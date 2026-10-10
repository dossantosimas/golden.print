# Estado del proyecto

Actualizado: **2026-10-10**, America/Bogota.
Base anterior: `5cb394a`, rama `main`. La entrega del 10 de octubre agrega imágenes de cotización; consultar el historial Git para el SHA de publicación.

Current Phase: MAINTENANCE
Current Milestone: documentación de la aplicación implementada y mejoras continuas

## Estado vigente

La aplicación está implementada y se publicó previamente en Vercel, con PostgreSQL Neon para producción. URL conocida: [golden-print-3d.vercel.app](https://golden-print-3d.vercel.app). Repositorio: [golden.print](https://github.com/dossantosimas/golden.print).

El usuario autorizó la publicación y el uso del login de Golden Print en producción; la protección de previews es una configuración separada. Las credenciales y conexiones quedan en configuración privada. La entrega de imágenes incluye la migración aditiva 0009 en Neon y publicación autorizada en Vercel; comprobar el despliegue por su SHA en la plataforma.

## Capacidades implementadas

Clientes con teléfono opcional; filamentos con colores simples/combinados; cotización multimaterial con cantidad, hasta 10 imágenes con título, revisiones y PDF; pedidos repetidos desde una cotización; producción y reimpresión; entrega con una fecha real; pagos y cierre condicionado al saldo; eliminación administrativa mediante archivo; gastos, pérdidas, caja y reportes.

Inicio resume gramos/tiempo de pedidos recientes y muestra saldo de caja acumulado. Finanzas distingue ventas entregadas y cobros de su cohorte. Cerrado y entregado tienen colores distintos. Los filtros de cotizaciones usan navegación de aplicación con conservación de scroll.

El costo del pedido procede de la revisión aceptada o de su ajuste explícito. Los costos antiguos se conservan como historial y no se agregan nuevamente al costo del producto.

## Evidencia y límites

La entrega de imágenes pasó typecheck, build, 21 pruebas unitarias, prueba de persistencia/PDF con rollback y verificación de carga real desde navegador en escritorio/celular. ESLint: cero errores y 25 advertencias previas. No se ejecutó la suite completa de integración local por falta de PostgreSQL disponible. Evidencia y alcance en [VALIDATION_REPORT](VALIDATION_REPORT.md).

El repositorio incluye migraciones `0000`–`0009`; su presencia no certifica que estén aplicadas en cualquier entorno. Restauración de backups, separación de credenciales DB y aislamiento de previews necesitan verificación operativa.

La configuración de auth declara 8 horas y renovación por actividad; el guard del navegador no renueva por sí mismo. No afirmar un límite absoluto de 8 horas desde login sin revisar esa política. Ver [OPERATIONS](OPERATIONS.md).

## Próximo trabajo

Prioridades en [IMPROVEMENTS](IMPROVEMENTS.md): secretos, recuperación, base aislada de integración, conciliación financiera, contratos comerciales y expiración de sesiones. Antes de nuevos cambios, leer [requisitos](REQUIREMENTS.md), [reglas financieras](FINANCIAL_RULES.md) y el diff existente.

Los estados y asignaciones originales se conservan como historia; no indican que aquellos agentes continúen activos.
