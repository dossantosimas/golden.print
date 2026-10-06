# Plan de incorporación shadcn/ui

Fecha: 2026-10-03 · Autor: frontend_developer · Estado: propuesta documental, pendiente de aprobación del blueprint.

## Decisiones y alcance

Usar **shadcn/ui del registro oficial `@shadcn`, con Base UI** para esta aplicación nueva. La documentación oficial recomienda Base UI y la establece como base predeterminada desde [julio de 2026](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default). Es una elección técnica del proyecto; no implica instalar componentes en esta fase. El código de componentes quedará dentro de la aplicación y se incorporará únicamente cuando un módulo lo necesite. No se añade un paquete universal de UI ni registros comunitarios.

Este documento complementa [UX_PLAN.md](UX_PLAN.md) y [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md): Next.js App Router, TypeScript, Tailwind, RHF/Zod, Recharts, npm y filtros/paginación en URL. Continúa `WAITING_FOR_BLUEPRINT_APPROVAL`; no se ejecutaron `init`, `add`, instalación, scaffold, build ni tests de aplicación.

## Marca y tokens

Actualización del propietario: el logo debe formar parte de una imagen de fondo nueva. Usar la propuesta [login-background-v2.png](assets/brand/login-background-v2.png), con lettering dorado integrado en la superficie, según [LOGIN_BACKGROUND_V2.md](LOGIN_BACKGROUND_V2.md). Sustituye la presentación del JPG como bloque independiente y la referencia visual LOGIN_PREVIEW.svg. Mantener el formulario como controles HTML/shadcn; adaptar composición responsive sin recortar el nombre. Los originales se conservan como referencia y el emblema es secundario.

| Token semántico propuesto | Color / finalidad |
|---|---|
| `background` / `foreground` | Marfil `#F4F1E8` / carbón `#393A32` |
| `card`, `popover` / sus foreground | Blanco / carbón |
| `primary` / `primary-foreground` | Dorado oscuro `#785B26` / blanco; CTA principal |
| `secondary`, `accent` / sus foreground | Dorado suave `#EEE3C8` / carbón; selección |
| `muted-foreground` | `#625E54`; unidades y ayuda |
| `input` / `border` | Borde funcional `#817969` / separación decorativa `#DDD7CA` |
| `ring` | `#245A83`; foco visible |
| `destructive` y estados | Paleta error/éxito/advertencia/información de UX_PLAN, con texto explícito |

Los valores se centralizan en el CSS global y se consumen mediante tokens, variantes y `cn()`. Evitar colores literales por componente y overrides manuales `dark:`. La primera entrega usa tema claro; no agregar selector oscuro por inferencia. Dorado decorativo `#B49A60` solo para la regla de marca. Verificar pares de contraste efectivos, incluyendo focus/hover/disabled; los ratios documentales del UX_PLAN no certifican UI implementada. `className` organiza layout con `gap-*`, sin reemplazar tipografía/colores internos de los componentes.

## Componentes por flujo

| Flujo autorizado | Composición prevista |
|---|---|
| Inicio de sesión | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`; `FieldGroup`, `Field`, `FieldLabel`; `Input` de email; contraseña con `InputGroupInput`, `InputGroupAddon` y botón mostrar/ocultar; `Button` + `Spinner` + disabled al enviar |
| Navegación | `Sidebar` desktop; `Sheet` móvil con título, cierre y retorno de foco; destinos por permisos; `Breadcrumb` en detalles |
| Pedidos, clientes, cotizaciones, filamentos, usuarios y gastos | `Table` y `Card`; `Badge` con texto para estados; `ToggleGroup` tabla/cards; `Pagination`; controles de búsqueda y filtros en URL |
| Altas/ediciones/pagos breves | `Dialog` + campos; confirmaciones de efectos sensibles con `AlertDialog`; detalle largo en ruta; filtros/edición contextual en `Sheet` |
| Cotizador | RHF/Zod y arrays dinámicos de materiales/postprocesado; `FieldGroup`, `Field`, `FieldError`; `Combobox` para cliente/filamento; `Select` para opciones cerradas; `InputGroup` para unidades; `Card` de resultados y `Button` de guardado |
| Finanzas/dashboard | `Tabs` con `TabsList`; `Chart` sobre Recharts, tabla y resumen accesibles; `Progress` para equilibrio con razón textual si no estimable |
| Feedback transversal | `Skeleton`, `Empty`, `Alert`, `Spinner` y `toast` compatible con Base UI; errores de campo persistentes, sin depender solo del toast |

Esta lista delimita los usos; no es una orden de instalar todos los componentes a la vez. Añadir subcomponentes/dependencias requeridos por la composición revisada. **Table es suficiente para el MVP**: búsqueda, orden y paginación se resuelven en servidor y URL; la vista cards reutiliza los mismos registros. El ejemplo Data Table puede incorporar TanStack Table, pero no obliga a añadirlo. Reconsiderarlo únicamente ante una necesidad concreta de selección masiva/columnas complejas, justificando la dependencia antes del cambio.

## Contratos de API y accesibilidad

Base UI usa `render` para componer triggers, no `asChild` de Radix; consultar la API exacta para `nativeButton={false}` cuando el elemento sea un enlace. Select requiere revisar `items`/placeholder y `SelectGroup`; ToggleGroup maneja la selección según API Base, sin copiar `type="single"` de Radix. No mezclar primitivas por memoria: si una pieza oficial necesaria exige Radix o no tiene equivalente Base, registrar el hallazgo y resolver el diseño antes de añadirla.

Cada Dialog/Sheet tiene Title; focus trap, Escape cuando corresponde y retorno al disparador. Sin z-index manual ni overlays anidados improvisados. Controles con label, error asociado, `data-invalid` en Field y `aria-invalid` en control; al fallar submit, conservar datos y enfocar primer error. Login no ofrece registro público. Permisos de navegación no sustituyen autorización servidor: operador sin pagos/finanzas/gastos/usuarios/ajustes; admin gestiona esos flujos según UX_PLAN.

El formulario no hace cálculos financieros alternativos: muestra las funciones canónicas y respuesta autoritativa; reenvíos mantienen idempotencia. Spinner no reemplaza texto de estado ni permite duplicar submit. Charts tienen datos equivalentes en texto/tabla; valores faltantes no se convierten en cero. Revisar teclado, lector de pantalla, 360/768/1440 px, zoom 200%, objetivos táctiles y login con teclado virtual.

## Agentes, skills y continuación

Se reutilizan agentes existentes: `uiux_designer` define/revisa marca, layout y accesibilidad; `frontend_developer` implementa y compone componentes; `code_reviewer` revisa independientemente y solicita correcciones. QA verifica los flujos críticos del QA_PLAN. La skill de diseño es [frontend-design-pro](C:/Users/dossa/.agents/skills/frontend-design-pro/SKILL.md); la incorporación técnica usa [shadcn oficial local](../../codex-framework/framework/skills/design/shadcn/SKILL.md), importada de `shadcn-ui/ui` en commit `295a1f114a138f23b5dfee0e0c6812394dfeb90c`.

Sus reglas [forms](../../codex-framework/framework/skills/design/shadcn/rules/forms.md), [composition](../../codex-framework/framework/skills/design/shadcn/rules/composition.md), [styling](../../codex-framework/framework/skills/design/shadcn/rules/styling.md) y [base-vs-radix](../../codex-framework/framework/skills/design/shadcn/rules/base-vs-radix.md) gobiernan el trabajo. `agents/openai.yml` de la skill contiene metadatos de interfaz; no representa un agente ejecutor adicional.

Después de aprobar el blueprint:

1. Finalizar versiones/peerDependencies, base y configuración; fijar dependencias compatibles y lockfile. Inicializar shadcn en el scaffold de la app, con registro oficial explícito y Base UI, sin sobrescribir assets de marca.
2. Consultar `npx shadcn@latest info` y comprobar `base`, aliases, RSC, iconLibrary, rutas y CSS global. Antes de generar/usar cada componente, ejecutar `docs <componente>` y leer las URLs de documentación/API resultantes, luego inspeccionar registro/código. Obtener primero las piezas ya instaladas; añadir solo las faltantes con npm.
3. Construir login y shell de navegación, validar marca y foco; continuar módulos según TASKS. Componentes interactivos cliente y lecturas servidor según App Router; revisión de archivos incorporados antes de cerrar cada flujo.
4. Revisiones UX/code reviewer, correcciones y QA; typecheck, lint, pruebas financieras/E2E pertinentes y build. Documentar la evidencia real y conservar los gates de credenciales, costes y despliegue productivo.

Fuentes oficiales consultadas 2026-10-03: [Introducción](https://ui.shadcn.com/docs), [Skills](https://ui.shadcn.com/docs/skills), [Theming](https://ui.shadcn.com/docs/theming), [React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form), [Toast Base](https://ui.shadcn.com/docs/components/base/toast). Las APIs de implementación se volverán a verificar tras aprobación.
