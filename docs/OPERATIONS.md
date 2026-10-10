# Operación, despliegue y recuperación

Actualizado 2026-10-09. Producción conocida: [Golden Print](https://golden-print-3d.vercel.app), publicada previamente en Vercel con Neon. La autorización anterior del propietario para despliegue y login de la aplicación se conserva dentro de su alcance; esta actualización no publica ni cambia configuración.

## Configuración privada

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Aplicación; conexión PostgreSQL |
| `MIGRATION_DATABASE_URL` | CLI migrador; preferir conexión directa |
| `BETTER_AUTH_URL` | Origen exacto del navegador; HTTPS en producción |
| `BETTER_AUTH_SECRET` | Aleatorio, al menos 32 caracteres |
| `TEST_DATABASE_URL` | Base desechable de integración cuando se ejecutan tests |
| `BOOTSTRAP_EMAIL/NAME/PASSWORD` | Solo inicialización privada; nunca build |

El migrador no consume automáticamente `DATABASE_URL_UNPOOLED`: mapear la conexión directa a `MIGRATION_DATABASE_URL`. No imprimir URLs, contraseñas o cookies.

`.env.local`, `.env.production.local` y `.runtime/` están excluidos de Git. Producción usa variables del hosting; un archivo local no demuestra que estén configuradas allí. Verificar TLS, rol mínimo runtime, rol migrador y aislamiento de previews; no asumir esas medidas instaladas.

## Desarrollo y pruebas

Seguir [README](../README.md). El entorno histórico local utiliza Docker `postgres-local`, PostgreSQL 17 y puerto 5432. Su Compose pertenece al equipo local, no se incluye en este repositorio. No borrar volúmenes para resolver conexión.

Integración usa bases desechables; E2E utiliza datos sintéticos, puerto 3001 y configuración de [playwright.config.ts](../playwright.config.ts). Revisar fixtures y variables antes de ejecutarlos. Nunca apuntarlos a producción o a datos de trabajo.

## Bootstrap y usuarios

`npm run bootstrap` se ejecuta una sola vez sobre instalación vacía. Crea empresa, cuenta/membresía administradora, ajustes y consecutivos bajo transacción. No volver a ejecutarlo para recuperar una cuenta.

No hay signup público. Administrador gestiona Usuarios; Perfil cambia contraseña propia. La última cuenta administradora activa no puede perder acceso/rol. Recuperación requiere intervención autorizada y auditable, no hashes editados arbitrariamente.

## Política de sesiones real

[auth.ts](../src/lib/auth.ts) declara `expiresIn = 8 horas`, `updateAge = 1 hora` y caché de cookies desactivada. La renovación normal por actividad puede mover `expiresAt`; esta configuración no es un límite absoluto garantizado desde el login.

[SessionGuard](../src/components/session-guard.tsx) consulta sesión con `disableRefresh=true`, programa comprobación al vencimiento y revalida cada 30 segundos/al volver a la pestaña. Si ya no existe sesión, redirige a login. Un fallo temporal de red no se trata como logout confirmado.

El servidor revalida expiración y membresía al mutar. Pendiente: comprobar si el requisito de “8 horas” debe ser duración absoluta o inactividad y verificarlo end-to-end antes de afirmar cumplimiento absoluto.

## Migraciones

Desarrollo carga `.env.local` mediante `npm run db:migrate`. Para un entorno productivo autorizado, con su archivo privado ya preparado:

```powershell
npx tsx --env-file=.env.production.local scripts/migrate.ts
```

Ese comando modifica la base configurada: revisar destino, respaldo y migración primero. Ejecutar desde la raíz de la aplicación. No hacer bootstrap ni migraciones de producción durante build.

El journal contiene `0000`–`0008`. `0007` agrega cantidad; `0008` permite repetir cotización/cliente. Verificar aplicación antes de usar código dependiente. Preferir expandir esquema compatible y retirar estructuras obsoletas después de estabilizar consumidores.

## Publicación y rollback

1. Revisar diff, commit, cuenta/proyecto destino y autorizaciones vigentes.
2. Ejecutar validaciones pertinentes y build; registrar resultados reales.
3. Aplicar migraciones revisadas con conexión directa cuando corresponda.
4. Publicar mediante el flujo configurado del proyecto. La CLI debe estar autenticada y vinculada antes de usarla.
5. Verificar SHA, despliegue listo, alias productivo y recorrido publicado.
6. Registrar versión y limitaciones; un push no demuestra publicación.

Login Golden Print y protección Vercel son controles distintos. Producción fue autorizada para usar el login propio; no extrapolar esa decisión a previews.

Rollback de código usa un despliegue anterior compatible con el esquema. No revertir migraciones destructivamente ni restaurar encima de producción sin respaldo y plan explícitos.

## Backup y restauración

Guardar respaldos en ubicación privada, con acceso controlado. Para el contenedor local existente, desde la raíz de la app:

```powershell
New-Item -ItemType Directory -Force .runtime/backups
docker exec postgres-local pg_dump -U postgres -d golden_print_dev -Fc -f /tmp/golden-print-backup.dump
docker cp postgres-local:/tmp/golden-print-backup.dump .runtime/backups/golden-print-backup.dump
docker exec postgres-local pg_restore --list /tmp/golden-print-backup.dump
```

Sustituir nombre de base solo tras verificar el destino. Restaurar primero en una base nueva y aislada; comprobar filas, relaciones, acceso, consecutivos y conciliación. Un dump exitoso no demuestra recuperación. Para Neon, revisar las capacidades disponibles de la cuenta y ensayar restauración sin tocar la base activa. No se certifica un ensayo actual ni RPO/RTO.

## Correcciones de datos

Confirmar organización, IDs exactos y estado esperado; ejecutar transacción acotada, motivo y auditoría; verificar campos afectados e invariantes después. No inferir pagos, clientes ni fechas. Un pedido cerrado se corrige solo mediante una intervención excepcional autorizada, no habilitando una ruta genérica que eluda cierre.

Eliminar desde UI archiva pedido y conserva movimientos financieros. Si el pago registrado era falso, su corrección es una operación distinta con evidencia; archivo no simula devolución.

## Diagnóstico y pendientes

- Gasto guardado no visible: revisar fechas y filtros antes de crear otro.
- Cartera inesperada: identificar pedido y pagos válidos al corte; no forzar etiqueta Pagado.
- Pedido faltante en Inicio: contrastar `order_date`, filtro y fecha futura.
- Sesión inválida: reautenticar y verificar membresía/origen; no debilitar autorización.
- Versión vieja en hosting: verificar SHA y alias.
- Error de entorno/sandbox: separar de fallo del código; conservar salida sin secretos.

Prioridades: [IMPROVEMENTS](IMPROVEMENTS.md). Si un secreto se expuso, revocarlo o rotarlo y actualizar dependientes mediante la cuenta autorizada.
