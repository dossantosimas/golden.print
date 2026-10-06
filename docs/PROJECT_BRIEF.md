# Project Brief — Golden Print 3D

Versión: 0.2 · Fecha: 2026-10-02 · Estado: borrador de blueprint para integración, no aprobado.
Autor: scribe. Revisor: Project Orchestrator; validación y aprobación: propietario.
Audiencia: propietario, producto, finanzas, arquitectura, UX, desarrollo y QA.

## Objetivo y fuentes

Golden Print 3D ofrece impresión 3D, figuras personalizadas, diseños dibujados mediante impresora y trabajos personalizados.
La aplicación centraliza pedidos, cotizaciones, clientes, filamentos, gastos y finanzas para operar desde desktop y móvil.
Proyecto: `C:/Users/dossa/Desktop/Projects/ia/golden-print-3d-app`, carpeta hermana de codex-framework.
Fuentes: solicitud inicial de 24 secciones en `Texto pegado.txt` adjunto y respuestas reales del propietario posteriores, transmitidas por el orquestador.
Relacionados: [DISCOVERY.md](DISCOVERY.md), [REQUIREMENTS.md](REQUIREMENTS.md), [PRD.md](PRD.md), [FINANCIAL_RULES.md](FINANCIAL_RULES.md).

## Decisiones de negocio confirmadas

- Aplicación exclusiva para Golden Print 3D; primer usuario administra usuarios.
- COP, America/Bogota, sin impuestos.
- Anticipos y abonos asociados a pedido con fecha y valor; sin devoluciones.
- Registrar costos reales; una impresión fallida se reimprime para el mismo pedido.
- Cotizador editable: horas/minutos/segundos, materiales múltiples, energía, máquina, contingencia material y postprocesado.
- Fórmula confirmada: `H=h+min/60+seg/3600`; `M=sum(g_i*p_i)`; `E=H*0.15*1100`; `A=H*2000`; `K=M*0.10`; `C=M+E+A+K+SUM(postprocesado)`.
- Tres precios iniciales `C*2`, `C*2.5`, `C*3`, variables editables. Markup 100/150/200%; margen sobre venta 50/60/66.6667%.
- Respuesta final: sumar postprocesado al costo **antes** de los multiplicadores; contingencia continúa únicamente sobre material.
- Los 20/50/100 iniciales y una tasa de fallo probabilística están reemplazados por la fórmula posterior. No quedan preguntas bloqueantes de negocio.

## Alcance de MVP propuesto

Todos los módulos solicitados: autenticación, usuarios autorizados, dashboard completo, pedidos tabla/cards y estados independientes, clientes/historial/ranking, finanzas y filtros, gastos/análisis, filamentos/costo por gramo, cotizador/precios, cotizaciones/historial/conversión, PDF, abonos y costos reales de reimpresión.
UX administrativa responsive con búsqueda/filtros, modales/drawers, combobox, tablas/cards, badges, feedback y confirmaciones.
Cálculos compartidos y auditables; documentación, tests financieros, seguridad, code review y build tras aprobación.
NEXT: nombres de niveles, metadatos de filamento, incobrabilidad/castigos auditados. FUTURE: inventario, gramos restantes y movimientos.
Estas etapas son propuestas para gate; ningún requisito de visión se elimina.

## Restricciones y propuestas distinguibles

Next.js/TypeScript, Better Auth, Neon PostgreSQL y Vercel son preferencias requeridas expresadas por el usuario.
El resto del stack y el modelo de datos requieren justificación por especialistas. La lista orientativa de entidades no es diseño definitivo.
Propuesto: bootstrap único atómico y roles propietario/admin y operador con mínimo privilegio. Que el primer usuario administre está confirmado; la división exacta de permisos es propuesta.
Reconocimiento de ventas al entregar, cohorte de cobro/cartera, caja por fecha de movimiento, OPEX separado y equilibrio por contribución son propuestas documentadas en FINANCIAL_RULES §§7–9 para aprobar.
No confundir costo estimado, reserva de contingencia, costo real y salida de caja; no duplicar pérdidas de intentos ni compra/consumo de material.

## Éxito verificable y límites

REQUIREMENTS define 35 requisitos funcionales, 5 CFR propuestos y criterios BDD canónicos; el ledger registra todo como NOT_TESTED.
Éxito previsto: conversiones trazables, abonos/costos reales conservados, resultados iguales entre pantallas, PDF comercial legible y flujos críticos móviles/desktop.
No hay código, scaffold, mediciones de rendimiento, tests ejecutados ni aprobación.
Fuera de alcance confirmado/no solicitado para MVP: impuestos, devoluciones, multiempresa, tienda pública, pagos en línea, CAD/slicing/control físico de impresora.

## Estado y siguientes acciones

Discovery tiene respuestas de negocio completas. Los contratos compartidos de scribe son accesibles como directorio restaurado; el defecto anterior se conserva como histórico en DISCOVERY.
El orquestador informó restauración byte a byte de 118 archivos SHA256 coincidentes desde fuente intacta; scribe verificó accesibilidad local de contratos.
Integración técnica/financiera/UX y revisión independiente completadas por el orquestador; ver BLUEPRINT.md y REVIEW_REPORT.md. Falta aprobación del propietario; no implementación autorizada todavía.
El proyecto no tiene repositorio Git inicializado; no se creó uno en fase de documentación.
Presupuesto, plazo y volumen real no fueron aportados; se documentan como no disponibles, sin convertirlos en nuevas preguntas bloqueantes.

## Historial

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-10-02 | 0.1 | Intake factual de las 24 secciones y preguntas iniciales |
| 2026-10-02 | 0.2 | Respuestas completas, fórmula autoritativa y PP antes de multiplicadores; borrador para integración |
