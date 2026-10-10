# Golden Print 3D

Aplicación interna para cotizar impresión 3D y gestionar clientes, filamentos, pedidos, producción, pagos, gastos y finanzas. Interfaz en español; COP, zona `America/Bogota`, sin impuestos ni devoluciones.

Documentación actualizada el **2026-10-10**. Producción: [Golden Print](https://golden-print-3d.vercel.app). La trazabilidad y el alcance de las comprobaciones se describen en [VALIDATION_REPORT](docs/VALIDATION_REPORT.md).

## Funcionamiento actual

- Una cotización aceptada puede crear tantos pedidos como se necesiten, para el mismo cliente o distintos clientes.
- Hasta 10 imágenes por cotización, cada una con título editable; se conservan en revisiones/duplicados y aparecen en el PDF. Ver [imágenes](docs/QUOTE_IMAGES.md).
- Cantidad de piezas: gramos, tiempo, postprocesado y precio manual se ingresan por pieza; el cotizador multiplica por cantidad.
- El costo del producto es el de la revisión aceptada, o su ajuste explícito en el pedido. No se exige registrar otro costo real.
- Los abonos reducen el saldo; el pedido solo puede cerrarse después de entregarlo y pagarlo completamente.
- Eliminar un pedido desde la interfaz lo archiva con motivo y conserva pagos e historial.
- Ventas, cobros, cartera y caja tienen bases distintas; ver [reglas financieras](docs/FINANCIAL_RULES.md).

## Desarrollo local

Requisitos: Node `>=22.22.0 <25`, npm y PostgreSQL. Versiones fijadas en [package.json](package.json) y `package-lock.json`.

```powershell
npm ci
```

Si todavía no existe configuración local:

```powershell
Copy-Item .env.example .env.local
```

Completar privadamente `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000` y `BETTER_AUTH_SECRET` aleatorio de al menos 32 caracteres. No sobrescribir archivos configurados.

```powershell
npm run db:migrate
npm run bootstrap
npm run dev
```

Bootstrap se ejecuta una sola vez sobre una instalación vacía, nunca durante build. Solicita credenciales privadas para el primer administrador. No hay registro público. Abrir [login local](http://localhost:3000/login).

## Validación

```powershell
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Las pruebas de integración y E2E requieren bases desechables separadas; pueden sustituir datos de prueba. Nunca usar producción. `TEST_DATABASE_URL` se configura privadamente cuando corresponda. Ver [operación](docs/OPERATIONS.md) y [evidencia de validación](docs/VALIDATION_REPORT.md).

## Documentación

Empezar por el [índice documental](docs/README.md).

- [Guía de uso](docs/USER_GUIDE.md).
- [Estado y continuidad](docs/PROJECT_STATUS.md), [cambios](docs/RELEASES.md) y [tareas](docs/TASKS.md).
- [Reglas financieras](docs/FINANCIAL_RULES.md) y [requisitos](docs/REQUIREMENTS.md).
- [Arquitectura](docs/ARCHITECTURE.md), [datos](docs/DATABASE_DESIGN.md) y [contratos](docs/API_DESIGN.md).
- [Operación y recuperación](docs/OPERATIONS.md), [equipo](docs/ORCHESTRATION.md) y [mejoras](docs/IMPROVEMENTS.md).

La documentación de blueprint y los informes anteriores conservan sus fechas y evidencias. Las reglas actuales prevalecen sobre propuestas históricas.
