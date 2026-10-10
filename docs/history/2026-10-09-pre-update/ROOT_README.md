# Golden Print 3D

> Regla vigente (2026-10-05, corrección del usuario): el costo del pedido se obtiene directamente del costo de producción de la revisión aceptada de la cotización, o de su ajuste explícito en el pedido. No se registra ni confirma otro costo real; la ganancia es precio acordado menos ese costo. Los registros anteriores de costos se conservan como historial y no se suman nuevamente. Los apartados históricos que exigen registro/completitud de costos quedan sustituidos por esta regla. El costo de producción no crea un movimiento de caja.

Aplicación interna para cotizar trabajos de impresión 3D, gestionar clientes, filamentos, pedidos, producción, pagos y finanzas. Interfaz en español con shadcn/ui y marca Golden Print. Moneda COP, zona horaria America/Bogota y sin impuestos.

Stack: Next.js 16, React 19, TypeScript, Better Auth, Drizzle y PostgreSQL. La fórmula usa aritmética decimal y conserva las variables de cada revisión comercial; el costo del pedido se consulta directamente de la cotización vinculada.

## Arranque local

Requisitos: Node compatible con `package.json`, npm y PostgreSQL de Docker disponible. El entorno de desarrollo usa PostgreSQL local; Neon y la publicación productiva requieren configuración y autorización separadas.

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Configura `.env.local` de forma privada con `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `TEST_DATABASE_URL`, `BETTER_AUTH_URL=http://localhost:3000` y `BETTER_AUTH_SECRET` aleatorio de al menos 32 caracteres. Usa bases distintas para desarrollo y pruebas. No copies sobre un `.env.local` ya configurado.

```powershell
npm run db:migrate
npm run bootstrap
npm run dev
```

`bootstrap` solicita nombre, correo y contraseña oculta para crear una sola vez el administrador de la empresa. No hay registro público. Si la empresa ya existe, no sobrescribe sus datos. Abre http://localhost:3000/login. El administrador crea los siguientes usuarios desde Usuarios; cada usuario puede cambiar su contraseña desde Perfil.

## Validación

```powershell
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Las pruebas de integración usan PostgreSQL real y vacían exclusivamente bases desechables. E2E usa una base separada y el puerto 3001. No ejecutes pruebas sobre datos del negocio. Consulta los resultados y límites observados en [VALIDATION_REPORT](docs/VALIDATION_REPORT.md).

## Documentación

- [Operación, acceso, backups y recuperación](docs/OPERATIONS.md).
- [Reglas financieras](docs/FINANCIAL_RULES.md).
- [Arquitectura](docs/ARCHITECTURE.md) y [modelo de datos](docs/DATABASE_DESIGN.md).
- [Estado](docs/PROJECT_STATUS.md), [tareas](docs/TASKS.md) y [requisitos](docs/REQUIREMENTS.md).

La aplicación registra anticipos y abonos con fecha y valor. Una impresión fallida se reimprime en el mismo pedido y conserva su historial de intentos. Las correcciones auditadas corrigen errores de registro; no representan devoluciones. Las ventas se reconocen al entregar y el recaudo según la fecha efectiva del pago. La ganancia usa el costo de producción de la cotización, sin registro adicional.
