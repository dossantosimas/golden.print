# Estado del proyecto

Actualizado: **2026-10-09**, America/Bogota.
Código inspeccionado: `5cb394ae259f5728df3779989843e8e342530b42`, rama `main`.

Current Phase: MAINTENANCE
Current Milestone: documentación de la aplicación implementada y mejoras continuas

## Estado vigente

La aplicación está implementada y se publicó previamente en Vercel, con PostgreSQL Neon para producción. URL conocida: [golden-print-3d.vercel.app](https://golden-print-3d.vercel.app). Repositorio: [golden.print](https://github.com/dossantosimas/golden.print).

El usuario autorizó la publicación y el uso del login de Golden Print en producción; la protección de previews es una configuración separada. Las credenciales y conexiones quedan en configuración privada. Esta tarea de documentación no modifica producción ni vuelve a verificar su despliegue.

## Capacidades implementadas

Clientes con teléfono opcional; filamentos con colores simples/combinados; cotización multimaterial con cantidad, revisiones y PDF; pedidos repetidos desde una cotización; producción y reimpresión; entrega con una fecha real; pagos y cierre condicionado al saldo; eliminación administrativa mediante archivo; gastos, pérdidas, caja y reportes.

Inicio resume gramos/tiempo de pedidos recientes y muestra saldo de caja acumulado. Finanzas distingue ventas entregadas y cobros de su cohorte. Cerrado y entregado tienen colores distintos. Los filtros de cotizaciones usan navegación de aplicación con conservación de scroll.

El costo del pedido procede de la revisión aceptada o de su ajuste explícito. Los costos antiguos se conservan como historial y no se agregan nuevamente al costo del producto.

## Evidencia y límites

La actualización documental se contrastó con código, configuración, migraciones y commits locales. Ver [RELEASES](RELEASES.md). No se repitieron suites de aplicación, auditoría de seguridad ni pruebas de producción durante este cambio de documentación. Los resultados anteriores se mantienen fechados en [VALIDATION_REPORT](VALIDATION_REPORT.md).

El repositorio incluye migraciones `0000`–`0008`; su presencia no certifica que estén aplicadas en cualquier entorno. Restauración de backups, separación de credenciales DB y aislamiento de previews necesitan verificación operativa.

La configuración de auth declara 8 horas y renovación por actividad; el guard del navegador no renueva por sí mismo. No afirmar un límite absoluto de 8 horas desde login sin revisar esa política. Ver [OPERATIONS](OPERATIONS.md).

## Próximo trabajo

Prioridades en [IMPROVEMENTS](IMPROVEMENTS.md): secretos, recuperación, base aislada de integración, conciliación financiera, contratos comerciales y expiración de sesiones. Antes de nuevos cambios, leer [requisitos](REQUIREMENTS.md), [reglas financieras](FINANCIAL_RULES.md) y el diff existente.

Los estados y asignaciones originales se conservan como historia; no indican que aquellos agentes continúen activos.
