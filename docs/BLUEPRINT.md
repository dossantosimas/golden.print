# Golden Print 3D — Blueprint ejecutivo

Fecha: 2026-10-02. Estado: **BLUEPRINT READY FOR REVIEW**; implementación condicionada a aprobación del propietario. Las decisiones confirmadas derivan de la solicitud y respuestas; las propuestas técnicas y políticas restantes se aprueban mediante este gate. Arquitectura/seguridad/QA documental revisadas sin hallazgos materiales abiertos; no es aprobación de implementación ni evidencia de runtime.

## Project / Scope / MVP

`golden-print-3d-app`: aplicación interna para una sola empresa, Golden Print 3D, en español, COP y America/Bogota, sin cálculo de impuestos. Uso administrativo desktop/móvil. Se entrega como carpeta hermana de codex-framework.

MVP: autenticación y gestor de usuarios; dashboard; pedidos tabla/cards; clientes e historial/rankings; filamentos/costo por gramo; cotizador y cotizaciones versionadas; PDF comercial; intentos/reimpresiones y costos reales; anticipos/abonos; gastos, pérdidas y finanzas con caja/equilibrio. Todos los módulos centrales solicitados se conservan.

NEXT: nombres personalizados de niveles, incobrabilidad/castigos auditados, datos adicionales del filamento (proveedor/compra/diámetro/ubicación), recuperación por correo cuando exista proveedor autorizado. FUTURE: existencias/gramos restantes y movimientos avanzados de inventario. No hay devoluciones, SaaS multiempresa, integración física de impresora, tienda pública ni facturación fiscal en el MVP.

## Architecture / Technology Stack

Monolito modular Next.js App Router + TypeScript/React, con Server Actions delgadas y servicios por módulo; Route Handlers para Better Auth y PDF. Una base Neon PostgreSQL, Drizzle ORM y pg/TCP pooled en runtime Node, transacciones con locks e integridad respaldada por constraints. Sin microservicios, API REST duplicada, Redis ni gestor global de estado.

UI Tailwind/shadcn; Zod + React Hook Form; Recharts; decimal.js para el dominio financiero; pdf-lib para documento sencillo; Vitest/Playwright y PostgreSQL real para pruebas de dinero/concurrencia. npm/lockfile; Vercel comercial. Patches compatibles se fijan después de aprobación antes de scaffold, sin asumir versiones instaladas.

Confirmación UI del propietario, 2026-10-03: shadcn/ui es obligatorio. Se incorporó su skill oficial al framework, con fuente/revisión/licencia trazadas. Los agentes frontend_developer y uiux_designer la usarán junto con frontend-design-pro. Registro explícito @shadcn y primitivas Base UI para esta app nueva; componentes y tokens de marca en [SHADCN_UI_PLAN](SHADCN_UI_PLAN.md). Este ajuste no inicia implementación.

Primer administrador: provisionamiento privado único y atómico, sin endpoint público de instalación. Cuentas posteriores mediante gestor de usuarios. Propuesta de roles: administrador con acceso completo; operador con clientes, catálogo, cotizaciones, pedidos y producción. Pagos, egresos, finanzas globales, ajustes y usuarios requieren administrador. Último administrador protegido; sesiones revocadas al desactivar.

## Database overview

Tablas de Better Auth; empresa única/membresías/ajustes; clientes/filamentos; cotizaciones/revisiones/materiales/acabados/ofertas; pedidos/intentos/costos reales/eventos de estado; pagos/gastos/pérdidas independientes/movimientos de caja; auditoría e idempotencia.

IDs internos UUID y códigos COT/PED con contador transaccional y unique; sin MAX+1. Una cotización origina como máximo un pedido aunque haya varios intentos de conversión o revisiones. Cotizaciones publicadas conservan inputs/precio/notas/cliente por snapshot. Corregir pagos o costos preserva evidencia y suma únicamente filas válidas actuales.

## Quotation model confirmado

```text
t = horas + minutos/60 + segundos/3600
M = suma(gramos por material × COP/gramo)
E = t × 0.15 kW × 1100 COP/kWh
A = t × 2000 COP/h
K = M × 10%
C = M + E + A + K + suma(postprocesado)
Precios = C × 2; C × 2.5; C × 3
```

Variables editables. El postprocesado entra antes de multiplicar; contingencia solo sobre material. Son multiplicadores de costo: recargos 100/150/200%, márgenes sobre venta 50/60/66.67% antes de redondeo. Precio cobrable final redondeado a un peso; dinero calculado desde inputs decimales exactos, sin redondear subtotales antes del precio.

PDF cliente: marca/código/revisión, cliente o «Sin cliente», proyecto/descripción, precio elegido, fecha/validez y notas comerciales. Excluye desglose, tarifas, márgenes y notas internas. Cotizar sin cliente está permitido; confirmar un pedido requiere cliente.

## Financial model propuesto

- Ventas reconocidas al entregar; valor comprometido antes de entrega se distingue de ventas.
- Anticipos/abonos generan caja en su fecha y reducen saldo; pago derivado de ledger, nunca un badge manual que invente recaudo. Sin sobrepagos ni devoluciones.
- Costo real incluye todos los intentos del pedido. Fallar/reimprimir conserva el mismo pedido; costo fallido aparece como pérdida analítica incluida una sola vez.
- Comprar filamento afecta caja; consumirlo afecta costo. Compras de materiales no se suman como OPEX ni crean otra salida al consumir.
- Utilidad operativa neta = ventas entregadas − costos directos reales de esas entregas − OPEX del período − pérdidas independientes. Indicar provisional si faltan costos.
- Tasas de cobro/cartera usan una misma cohorte de pedidos y pagos acumulados al corte. Caja del período se muestra separadamente por fecha de movimiento.
- Equilibrio estimado = costos fijos / tasa de contribución ponderada del período; indicador por contribución cubierta, no recaudo. Sin ventas, margen positivo o costos completos, explicar por qué no es estimable.
- Históricos se recalculan con registros válidos/corregidos actuales por fecha efectiva; no ofrecen cierre contable inmutable. Conteos operativos muestran estado actual de pedidos del rango.

Una única fuente de funciones/normalizador de fechas abastece cotizador, PDF, pedidos, dashboard y finanzas. Fórmulas y oráculos completos en FINANCIAL_RULES/QA_PLAN.

## UX

Dirección marfil/carbón/dorado con contraste accesible, números alineados, estado con texto y color. Tablas/cards, filtros en URL, combobox, dialogs para cambios breves y rutas/drawers para detalles largos. Cotizador con materiales/acabados dinámicos y tres ofertas comparables. Barras para estados/categorías; evolución y caja en gráficos separados; equilibrio con progress. Móvil 360px y desktop 1440px, teclado, foco, errores y guardado incierto definidos.

Actualización de marca del propietario, 2026-10-03: logo completo con nombre en login, conservado sin recortes; paleta marfil `#F4F1E8`, carbón `#393A32` y acción dorada `#785B26`. [Maqueta del login](LOGIN_PREVIEW.svg) y [activos originales](BRAND_ASSETS.md) incorporados al diseño; todavía sin implementación.

## Milestones

M1 base/migraciones/acceso; M2 clientes/filamentos/cotizador/cotizaciones/PDF; M3 pedidos/producción/reimpresión/abonos; M4 gastos/caja/finanzas/dashboard; M5 pruebas/revisiones/build/documentación y entrega. 19 tareas con responsables/dependencias/criterios en TASKS. Implementación automática después de aprobar, sin permisos fase por fase.

## Risks y límites

La corrección del dinero y la concurrencia son riesgos principales; se mitigarán con función única, snapshots, ledger, locks y tests SQL reales. Costos reales incompletos producen resultados provisionales. Las cuentas/secretos Neon y acceso a deployment son dependencias externas; no se solicitan secretos en documentos.

Vercel Hobby limita su uso a proyectos personales no comerciales; se propone Pro desde USD20/mes, más consumo/costes aplicables. No se ha contratado. Fuentes y precio consultado en TECHNOLOGY_STACK. Node22 exige actualización antes de fin de soporte en abril 2027; Node24 es alternativa registrada para validación tras fijar versiones.

El blueprint no implica deployment productivo, contratación ni prueba de una aplicación todavía inexistente. El gate de aprobación aquí autoriza el diseño y lifecycle de implementación; coste/credenciales/despliegue conservan los gates pertinentes del framework.

## Lectura y evidencia

Requisitos y roadmap: [REQUIREMENTS](REQUIREMENTS.md), [PRD](PRD.md). Diseño: [stack](TECHNOLOGY_STACK.md), [arquitectura](ARCHITECTURE.md), [datos](DATABASE_DESIGN.md), [interfaces](API_DESIGN.md), [UX](UX_PLAN.md), [reglas financieras](FINANCIAL_RULES.md). Ejecución: [plan](IMPLEMENTATION_PLAN.md), [tareas](TASKS.md), [riesgos](RISKS.md). Revisión y estado: [REVIEW_REPORT](REVIEW_REPORT.md), [seguridad](SECURITY_REVIEW.md), [QA](QA_PLAN.md), [estado](PROJECT_STATUS.md). ADRs propuestos en adr/.
