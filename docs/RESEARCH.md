> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Research — Golden Print 3D

Fecha de consulta: 2026-10-02, America/Bogota. Autor: research_agent. Alcance: viabilidad y selección tecnológica para blueprint. No se instalaron paquetes ni se implementaron/ejecutaron pruebas.

## Entradas y trazabilidad

Se leyeron framework/AGENTS.md, docs/INVENTORY.md, agents/architecture/research_agent.toml; solicitud original adjunta; PROJECT_BRIEF, DISCOVERY, PROJECT_STATUS; respuestas del propietario y skill local better-auth-best-practices. Contrato delegado limita escritura a TECHNOLOGY_STACK.md y RESEARCH.md.

Las respuestas posteriores tienen prioridad: empresa única, primer usuario administra usuarios; COP/Bogotá sin impuestos; pagos parciales fechados sin devoluciones; costos reales e impresiones repetidas; duración con segundos y fórmula material+energía+máquina+10% material, precios ×2/×2.5/×3 con variables editables. Investigación no modifica esa fórmula ni agrega servicios comerciales.

## Hallazgos verificables y decisión inferida

| Evidencia primaria | Hallazgo | Decisión del equipo / aceptación requerida |
|---|---|---|
| [Next instalación](https://nextjs.org/docs/app/getting-started/installation), [Next 16](https://nextjs.org/blog/next-16) | App Router, TS, React19 y Node>=20.9; release estable Next16 documentada | App Router monolítico Node22, sin features experimentales necesarias |
| [Node releases](https://nodejs.org/en/about/previous-releases), [Node schedule](https://github.com/nodejs/Release#release-schedule), [Vercel versiones](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) | Node22/24 siguen LTS, Vercel admite ambas; Node20 figura EOL | Node22 conservador; verificar maintenance en schedule al fijar versión y probar bundle |
| [Drizzle Neon](https://orm.drizzle.team/docs/connect-neon), [Neon driver](https://github.com/neondatabase/serverless) | HTTP/WebSocket son transportes distintos; transacción interactiva requiere soporte de conexión/sesión | Drizzle + pg/TCP pooled en Node; no usar neon-http para lectura condicional + escrituras |
| [Drizzle transactions](https://orm.drizzle.team/docs/transactions), [pg transactions](https://node-postgres.com/features/transactions), [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html) | Transaction APIs, conexión compartida y bloqueos SQL disponibles | Locks/unique/idempotencia para bootstrap, conversiones y pagos; probar concurrencia/rollback |
| [Better Auth Drizzle](https://better-auth.com/docs/adapters/drizzle), [Admin](https://better-auth.com/docs/plugins/admin) | Adaptador pg y plugin administración oficiales; import actual y relaciones difieren de skill local | Seguir docs/export versión fijada; verificar atomicidad conjunta user/account/claim |
| [Better Auth email/password](https://better-auth.com/docs/authentication/email-password) | Reset requiere callback envío; cambio autenticado y revocación soportados | Recuperación asistida en MVP; email automático NEXT sin contratar proveedor |
| [Prisma Neon](https://www.prisma.io/docs/orm/overview/databases/neon) | Prisma es viable sobre Neon; URL consultada redirige a docs v6 | Comparativa válida, pero no asumir que doc v6 describe cualquier major |
| [shadcn RHF](https://ui.shadcn.com/docs/forms/react-hook-form), [Zod](https://zod.dev/) | Integración schema/forms y arrays dinámicos documentada | RHF/resolvers/Zod para cotizador; validación server ineludible |
| [Recharts](https://recharts.github.io/en-US/), [decimal.js](https://mikemcl.github.io/decimal.js/) | Gráficas React y aritmética decimal disponibles | Recharts para tendencias/estados; decimal.js para motor financiero; sin cálculo monetario IEEE754 ordinario |
| [pdf-lib](https://pdf-lib.js.org/), [react-pdf compatibility](https://react-pdf.org/compatibility), [Node API](https://react-pdf.org/node) | pdf-lib es JS sin native deps; react-pdf admite React19 con restricciones documentales de matriz Node | pdf-lib elegido; paginación y tipografía se prueban con contenido largo y español |
| [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro) | Unit/integración y E2E tienen herramientas mantenidas | Separar casos financieros puros, integración real PostgreSQL y E2E |
| [Vercel pricing](https://vercel.com/pricing), [Hobby](https://vercel.com/docs/plans/hobby) | Pro USD20/mes base; Hobby no comercial | Pro propuesto sin compra; costes/credenciales gate antes de producción |

Todos los enlaces anteriores son fuentes oficiales de mantenedores y se consultaron 2026-10-02. Las páginas Neon `neon.com/docs/serverless/serverless-driver` y `neon.com/docs/connect/connection-pooling` devolvieron content-type markdown no soportado por el navegador de investigación; se contrastó transporte con README oficial del driver y docs oficiales Drizzle, y pooling con guía Prisma/pg. No se declara que esas páginas fallidas fueron leídas.

## Riesgos y criterios de cierre

1. **Bootstrap y API auth**: transporte transaccional no garantiza que API auth comparta conexión con tx de aplicación. Se elige script privado explícito con hashing Better Auth soportado y escrituras empresa singleton/user/account/membership admin dentro de la misma tx bajo advisory lock; esquema generado revisado y signup público cerrado desde inicio. Prueba dos inicializaciones concurrentes y error entre escrituras. Ningún usuario no autorizado obtiene admin; ningún partial commit queda autenticable.
2. **Version drift**: docs actuales indican @rc Drizzle, adaptador separado Better Auth y relaciones v2; skill local contiene APIs anteriores. Cerrar con releases estables, export/peer verification y lockfile; no instalar @latest sin registrar versión.
3. **Dinero y snapshots**: stringify decimals, constraints nonnegative y funciones puras comunes. Persistir variables/versiones por cotización para que cambio de tarifa no altere cotizaciones enviadas ni costos históricos; no doble contabilización de fallos/compra material.
4. **Pool/serverless**: límite de conexiones global vs pools por instancia, cold starts Neon y transacciones largas. Pool pequeño, TLS, colocación regional compatible, timeout y locks cortos; un fallo de red se devuelve con reintento idempotente.
5. **PDF**: librería estable no sustituye QA visual. Fuente, wrapping, salto de página, español y autorización requieren casos reales; evitar fetch remoto arbitrario y secretos internos en PDF.
6. **Empresa/coste**: Vercel Pro requerido por uso; confirmar cuenta y pago antes de producción. No publicar por asumir plan gratuito; avanzar desarrollo local postaprobación sin servicios extra.
7. **Correo/recuperación**: emailAndPassword no constituye proveedor email. Mantener operación admin privada verificable; no prometer reset automático sin proveedor configurado.
8. **Rate limit y permisos**: memoria serverless no es contador compartido. Rate limit persistente; controles server para todo módulo, PDF y API; desactivación invalida sesiones y administración no permite eliminar último admin.

## Estado de investigación

Selecciones justificadas en TECHNOLOGY_STACK.md. No hay decisiones de producto tecnológico marcadas TBD. Exact patches y compatibilidad efectiva se verifican en TECHNOLOGY_FINALIZATION después de aprobación, antes de scaffold. Arquitectura y base de datos deben revisar concurrencia auth, permisos, precisión y coste; esta investigación no constituye arquitectura validada ni prueba de deployment.
