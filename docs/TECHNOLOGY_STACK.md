# Stack del repositorio — actualización 2026-10-09

Fuente local: [package.json](../package.json) y package-lock.json. Node >=22.22.0 <25; npm@10.9.4. Producción conocida: Vercel + Neon. No se vuelve a comprobar compatibilidad con nuevas versiones externas en esta actualización.

| Paquete | Versión declarada en package.json |
|---|---|
| next | 16.3.8 |
| react | 19.3.0 |
| better-auth | 1.7.7 |
| drizzle-orm | 0.45.3 |
| pg | 8.23.1 |
| decimal.js | 10.6.0 |
| @base-ui/react | ^1.8.0 |
| recharts | ^3.8.0 |

Los servicios reales están en src/lib, no en las carpetas features del blueprint. Ver [arquitectura vigente](ARCHITECTURE.md). La tabla original inferior conserva decisiones y fuentes de aquella fecha.

---

## Investigación y decisión originales

# Technology Stack — Golden Print 3D

Fecha: 2026-10-02. Autor: research_agent. Estado: propuesta de blueprint para revisión; sin instalación, scaffold ni pruebas de runtime.

## Decisión

Monolito modular Next.js con PostgreSQL. Una empresa, varios usuarios internos y primer administrador. Todas las mutaciones pasan por autorización y validación del servidor. Cotizador y finanzas comparten funciones puras de cálculo decimal. COP, `es-CO`, zona `America/Bogota`; segundos enteros para duración; importes persistidos con precisión decimal y redondeo contractual de FINANCIAL_RULES.

| Área | Elección | Motivo y límite |
|---|---|---|
| Framework | Next.js App Router, TypeScript estricto, React | Stack requerido; Server Components para lecturas y Route Handlers/Server Actions como entrada al mismo servicio de dominio |
| Runtime | Node.js 22.x | Maintenance LTS hasta 2027-04-30 y admitido por Vercel; alternativa conservadora frente al default 24.x. No Edge para BD/auth/PDF |
| UI | Tailwind CSS + shadcn/ui obligatorio, primitives Base UI | Confirmado por propietario 2026-10-03; componentes locales del registro oficial @shadcn, paleta de marca por tokens semánticos; incorporar solo componentes usados |
| Auth | Better Auth, email/password, plugin admin | Sesiones en PostgreSQL; administrador gestiona usuarios internos; signup público cerrado |
| Persistencia | Neon PostgreSQL | Requerido; constraints, FK, índices, secuencias y transacciones son fuente de integridad |
| ORM | Drizzle ORM + Drizzle Kit | Esquema TypeScript, SQL explícito para bloqueos y métricas; migraciones SQL versionadas/revisadas |
| Transporte BD | `pg`, `drizzle-orm/node-postgres`, endpoint Neon pooled por TLS | Una conexión para cada transacción interactiva. Sin driver HTTP en el camino de escritura |
| Validación | Zod | Esquemas compartidos; validación server obligatoria incluso si cliente ya validó |
| Formularios | React Hook Form + `@hookform/resolvers` | Arrays dinámicos de materiales/postprocesado y estados de error; evita gestión manual compleja |
| Gráficas | Recharts | Barras de estados/categorías y líneas financieras; importar en componentes cliente y mostrar equivalente textual |
| Decimales | decimal.js | Gramos, COP/gramo, energía, contingencia y multiplicadores requieren aritmética decimal; transporte JSON como strings |
| PDF | pdf-lib | Documento cliente sencillo, generado en Route Handler Node desde cotización guardada y autorizada; sin dependencia de React ni navegador |
| Pruebas | Vitest + Playwright | Unitarias financieras y servicios; integración SQL real; E2E del flujo cotización→pedido→abonos→reimpresión |
| Calidad | ESLint + TypeScript | Lint, typecheck y build separados; no asumir que build ejecuta lint |
| Deployment | Vercel Pro, sujeto a cuenta/coste antes de producción | Vercel requerido; Hobby no cubre uso empresarial comercial |
| Estado | React local y parámetros URL | Filtros/paginación en URL; formularios en RHF; lecturas servidor y revalidación tras mutar. Sin Redux/Zustand/TanStack Query en MVP |
| Paquetes | npm y lockfile | Un gestor, instalación reproducible con `npm ci`; sin monorepo ni servicios extra |

Fuentes oficiales de Next.js [instalación](https://nextjs.org/docs/app/getting-started/installation), [Node en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [formularios shadcn](https://ui.shadcn.com/docs/forms/react-hook-form), [Zod](https://zod.dev/), [Recharts](https://recharts.github.io/en-US/), [decimal.js](https://mikemcl.github.io/decimal.js/) y [pdf-lib](https://pdf-lib.js.org/), consultadas 2026-10-02. Las elecciones son inferencias del equipo a partir de requisitos, no benchmarks realizados.

## Incorporación de shadcn/ui

Actualización UI 2026-10-03: se incorporó la skill oficial shadcn en `codex-framework/framework/skills/design/shadcn/`, fijada al commit `295a1f114a138f23b5dfee0e0c6812394dfeb90c`, con licencia y referencias. frontend_developer implementa y uiux_designer revisa con esa skill y frontend-design-pro; no se inventa un agente oficial separado. Registro elegido explícitamente: @shadcn. Primitivas Base UI para el proyecto nuevo, siguiendo [recomendación oficial vigente](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default); no mezclar APIs Radix asChild y Base render. El mismo contrato de formularios RHF/Zod y Chart/Recharts se conserva. Componentes exactos y mapping de tokens en SHADCN_UI_PLAN.md; generación de componentes y components.json solo después de aprobación.

## Drizzle versus Prisma

Comparación cualitativa para este proyecto; no atribuye superioridad absoluta.

| Criterio | Drizzle elegido | Prisma evaluado |
|---|---|---|
| Complexity | Un esquema TS y API próxima a SQL; requiere conocimiento SQL | DSL y cliente generado; ergonomía CRUD alta, más artefactos de generación |
| Maturity | Ecosistema activo; cambios v1/relaciones requieren fijar línea estable | Trayectoria amplia; distintas versiones principales y adaptadores requieren coordinación |
| Maintainability | Constraints y migraciones auditables; dominio no depende del ORM | Modelo central legible; SQL especial puede requerir raw queries |
| Scalability | Depende principalmente de consultas, índices y pooling | Mismo límite de PostgreSQL; tampoco elimina necesidad de pooling |
| Cost | Sin servicio ORM pagado; coste Neon/Vercel | ORM sin necesidad de servicio adicional; no requiere contratar Prisma comercial |
| DX | Tipos junto al código y SQL controlable | Cliente generado y tooling integrados; útil en modelos CRUD amplios |
| Ecosystem | Adaptador Better Auth oficial, drivers PostgreSQL | Adaptador Better Auth y guía oficial Neon también disponibles |
| Deployment | pg/TCP en Node, pocas capas | Driver adapter Neon/TCP viable; generación debe incluirse en build |
| Security | Queries parametrizadas, restricciones y migraciones revisadas; auth pertenece al servicio | Mismas obligaciones; ORM no reemplaza autorización ni constraints |
| Vendor lock-in | SQL PostgreSQL y repositorios acotan dependencia | PostgreSQL portable; DSL/API requieren adaptación al cambiar ORM |

Se elige Drizzle por los bloqueos explícitos, cálculos agregados y control SQL necesarios para dinero y concurrencia, con una base TypeScript pequeña. Prisma es viable: la [guía oficial Neon](https://www.prisma.io/docs/orm/overview/databases/neon) consultada redirige a documentación v6, por lo que no prueba por sí sola APIs de otra versión principal. [Drizzle Neon](https://orm.drizzle.team/docs/connect-neon) y [transacciones](https://orm.drizzle.team/docs/transactions) sustentan el transporte seleccionado. Consulta 2026-10-02.

## Compatibilidad y contrato transaccional

Better Auth ofrece [adaptador Drizzle PostgreSQL](https://better-auth.com/docs/adapters/drizzle). La página actual separa `@better-auth/drizzle-adapter` y distingue relaciones v1/v2; algunas skills locales aún documentan el import previo `better-auth/adapters/drizzle`. En TECHNOLOGY_FINALIZATION se verifica el export real de la versión fijada; generar el esquema auth con esa versión/plugin, revisar y migrar con Drizzle Kit. No copiar imports ni generación de una release distinta. Consulta 2026-10-02.

Se usa un pool `pg` pequeño por instancia, endpoint pooled Neon y TLS verificado. Tamaño/timeout se ajustan a conexiones permitidas y concurrencia observada; no abrir pools por consulta. Liberar clientes en `finally`. Las migraciones usan endpoint directo y rol autorizado separado de runtime. [node-postgres transacciones](https://node-postgres.com/features/transactions) exige el mismo cliente para BEGIN/lecturas/escrituras/COMMIT; [pool sizing](https://node-postgres.com/guides/pool-sizing) describe impacto de múltiples instancias. Consulta 2026-10-02.

Las siguientes operaciones deben ser atómicas, cortas y con constraints independientes del frontend:

- Bootstrap: creación de usuario, credencial y claim de primer administrador; bloqueo transaccional global o fila singleton. No permitir que dos registros simultáneos reclamen administración.
- Conversión: bloquear cotización, comprobar aceptada, crear pedido/snapshot y trazabilidad; unique en cotización origen e idempotencia.
- Pago: bloquear pedido, recalcular saldo desde pagos válidos, validar importe y registrar pago/auditoría/idempotencia; dos pagos paralelos no deben exceder saldo.
- Intento de impresión: costos reales y resultado se registran sin duplicar los componentes del intento fallido ni sustituir snapshots de cotización.

El transporte permite estos contratos; eso no prueba que una llamada Better Auth sobre un pool distinto participe en una transacción de aplicación. Se propone bootstrap mediante script privado de provisionamiento, sin endpoint público: recibe email/nombre/contraseña del operador sin persistirlos en logs, deriva hash con la utilidad soportada de Better Auth de la versión fijada, inicia una única transacción pg, adquiere `pg_advisory_xact_lock` sobre clave fija, comprueba que no existe empresa/administrador y escribe empresa singleton, user, account credential y membership admin conforme al esquema auth generado y al esquema de negocio; commit único. La empresa singleton/membership son datos internos, no requieren plugin organization ni SaaS multiempresa. Signup público deshabilitado desde inicio. No se ejecuta automáticamente en cada deployment. El script es inicialización excepcional, no sustituto del plugin admin para altas normales. Requisito de aceptación: rollback de empresa/usuario/credencial/membership y concurrencia de dos intentos. Un hook con `count(users)` seguido de creación independiente no es solución válida. La revisión auth debe verificar export del hash y columnas del esquema antes del scaffold; usar contraseña hash interna incompatible tampoco es aceptable.

El [driver oficial Neon](https://github.com/neondatabase/serverless) y Drizzle distinguen HTTP para consultas/lotes no interactivos de WebSocket para transacciones interactivas. WebSocket es alternativa técnica viable; pg/TCP simplifica este runtime Node sin `ws`/configuración adicional. Consulta 2026-10-02.

## Autenticación, usuarios y correo

Registro inicial privado, posteriormente altas realizadas por admin. Roles mínimos `admin`/`user`, permissions de negocio explícitos en servidor. Deshabilitar funcionalidades admin no requeridas, especialmente impersonación; mantener al menos un admin activo; revocar sesiones al desactivar usuario o restablecer credencial. No autorizar por presencia de cookie ni por UI oculta. [Admin](https://better-auth.com/docs/plugins/admin) y [email/password](https://better-auth.com/docs/authentication/email-password) consultados 2026-10-02.

El MVP no contrata proveedor email. Crear cuentas con contraseña inicial comunicada por el administrador mediante su procedimiento habitual y cambio autenticado; recuperación asistida por admin para usuarios. Recuperación del único admin se documenta como operación privada con acceso autorizado a entorno/BD. El reset automático por enlace requiere `sendResetPassword`, correo saliente, dominio y credenciales, por lo que queda NEXT hasta disponer de proveedor aprobado. No simular envíos ni exponer tokens en logs. Rate limiting persistente de Better Auth en PostgreSQL evita depender solo de memoria efímera; cookies seguras, secreto fuerte y trusted origins exactos.

## PDF y coste

Se evaluaron pdf-lib, `@react-pdf/renderer` y Chromium. pdf-lib evita renderer/React/Yoga y ejecutable navegador; exige implementar wrapping medido, paginación, cabecera y pie. Texto español soportado; caracteres fuera de fuente estándar se manejan con fuente Unicode embebida y `@pdf-lib/fontkit` solo si esa necesidad se confirma en diseño. Usar recursos locales controlados, sin fetch de imágenes/fuentes provistas por usuario. Validar tildes, ñ, nombres largos, notas largas, precio y documento multipágina; PDF no contiene costos internos. [pdf-lib](https://pdf-lib.js.org/), consulta 2026-10-02.

React-pdf permite layout declarativo y [React 19 desde v4.1](https://react-pdf.org/compatibility), pero su matriz Node publicada enumera 18/20/21. No afirmar soporte probado de Node 22/24 por esa página. Es alternativa futura si complejidad del documento justifica el renderer. Puppeteer añade navegador y complejidad serverless sin beneficio proporcional para esta cotización. La compatibilidad real de pdf-lib con el bundle de Next/Vercel requiere smoke test tras aprobación.

Vercel publica [Pro desde USD 20/mes](https://vercel.com/pricing) y [Hobby limitado a uso personal no comercial](https://vercel.com/docs/plans/hobby). El mínimo indicado no es coste total: puede haber consumo adicional, asientos, Neon, dominio y tributos del proveedor. Usuarios de la aplicación no equivalen a asientos developer Vercel. Se propone Pro sin contratarlo; cuenta/coste y deployment productivo conservan su gate. Consulta 2026-10-02.

## Versiones y cierre después de aprobación

Selección de productos cerrada; paquetes exactos se fijan en TECHNOLOGY_FINALIZATION, antes de scaffold, con evidencia de registry/release y peerDependencies. No existe package.json ni lockfile y no se declara ninguna versión instalada.

- Base propuesta verificable: Node 22.x, Next 16 estable, React/React DOM 19 compatibles entre sí, Zod 4, Vitest 4. [Next 16](https://nextjs.org/blog/next-16), [Zod 4](https://zod.dev/v4), [Vitest 4](https://vitest.dev/blog/vitest-4), consulta 2026-10-02.
- El [schedule oficial Node](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json) confirma Node22 Maintenance desde 2025-10-21 y EOL 2027-04-30; Node24 Active LTS hasta 2026-10-20 y EOL 2028-04-30. Planificar actualización a Node24 antes de EOL22 tras ejecutar los mismos checks; Node20 ya EOL y no se propone. Consulta 2026-10-02.
- Better Auth: página consultada muestra 1.7.7; no es pin aprobado ni evidencia de registry. Alinear paquete/adaptador/CLI/plugins de la misma línea estable y verificar API.
- Drizzle ORM/Kit: elegir releases estables compatibles; documentación actual muestra comandos `@rc`, que no autorizan instalar prereleases. Comprobar APIs de relaciones v1/v2 en esa línea.
- Tailwind/shadcn, TypeScript, RHF/resolvers, pg, Recharts, decimal.js, pdf-lib, ESLint y Playwright: fijar patches exactos compatibles, registrar en lockfile; no inventar versiones por recuerdo.
- Ejecutar smoke transaccional PostgreSQL, login/admin, PDF y build Node 22; revisar advisories de dependencias. Estos checks no se han ejecutado en blueprint.
