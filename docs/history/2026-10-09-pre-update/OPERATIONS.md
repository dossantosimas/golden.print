# Operación local

> Regla vigente (2026-10-05, corrección del usuario): el costo del pedido se obtiene directamente del costo de producción de la revisión aceptada de la cotización, o de su ajuste explícito en el pedido. No se registra ni confirma otro costo real; la ganancia es precio acordado menos ese costo. Los registros anteriores de costos se conservan como historial y no se suman nuevamente. Los apartados históricos que exigen registro/completitud de costos quedan sustituidos por esta regla. El costo de producción no crea un movimiento de caja.

Fecha de referencia: 2026-10-03, America/Bogota. Desarrollo autorizado con PostgreSQL Docker existente. Esta guía no autoriza publicación productiva ni compra de servicios.

## Entorno y bases

`.env.local` y `.runtime/` están excluidos de Git. No pegues conexiones, contraseñas o secretos en tickets, capturas o mensajes. `DATABASE_URL` sirve a la aplicación; `MIGRATION_DATABASE_URL` sirve al migrador. En servicios remotos debe usar conexión directa para migraciones y TLS verificado para la aplicación. `BETTER_AUTH_SECRET` debe ser aleatorio, privado y estable entre reinicios; `BETTER_AUTH_URL` coincide con el origen del navegador.

| Base | Uso | Destructiva |
|---|---|---|
| Desarrollo, conexión `DATABASE_URL` | Datos de trabajo del propietario | No |
| Base `TEST_DATABASE_URL`, nombre terminado en `_test` | Integración de comandos y cotizaciones | Sí, fixtures sustituyen tablas |
| `golden_print_reporting_test` | Integración financiera | Sí |
| `golden_print_access_test` | Integración de accesos | Sí |
| `golden_print_load_test` | Rendimiento local dedicado | Sí, datos sintéticos |
| `golden_print_e2e` | Navegador E2E | Datos sintéticos separados |

Las suites financieras y de acceso crean sus bases mediante conexión local administrativa. E2E migra `golden_print_e2e`, que debe existir; escribe credenciales sintéticas privadas en `.runtime/e2e-credentials.json`, sin imprimirlas. Usa Microsoft Edge instalado y puerto 3001. El servidor de desarrollo del propietario permanece en 3000. Los usuarios E2E no son cuentas del negocio.

El Compose existente está en `C:/Users/dossa/Desktop/Projects/dockers/postgres-local/docker-compose.yml`. El contenedor verificado es `postgres-local`, PostgreSQL 17, puerto local 5432. El usuario autorizó iniciar este contenedor existente:

```powershell
docker start postgres-local
docker exec postgres-local pg_isready -U postgres -d postgres
```

Conserva los secretos y el volumen de ese Compose. No uses `down -v` ni borres volúmenes para solucionar un fallo de conexión. No levantes otros contenedores PostgreSQL del workspace.

## Primera cuenta y contraseñas

Desde el proyecto, ejecuta `npm run db:migrate` y luego `npm run bootstrap` en una terminal privada. Escribe tu nombre y correo; la contraseña se ingresa oculta y tiene entre 12 y 128 caracteres. El provisionador bloquea concurrentemente la inicialización y crea empresa, cuenta Better Auth, membresía administrativa, parámetros y consecutivos en una transacción.

El registro público permanece cerrado antes y después de inicializar. El administrador crea operadores u otros administradores desde Usuarios. Desactivar una cuenta o restablecer sus credenciales revoca sus sesiones; no se permite quitar el último administrador activo. El cambio propio de contraseña está en Perfil. Si nadie puede entrar, conserva una copia de la base y solicita recuperación administrativa específica; no repitas bootstrap ni cambies hashes manualmente.

## Flujo de trabajo

1. Crea clientes y filamentos. El precio por gramo sale de valor del rollo dividido por gramos positivos.
2. Cotiza material, h/m/s y acabados. Selecciona la oferta y guarda. Las notas internas no salen en el PDF.
3. Marca enviada, acepta y convierte a pedido. Una cotización solo produce un pedido confirmado.
4. Registra intentos, fallos y reimpresiones en el mismo pedido. El costo y la ganancia se calculan directamente desde la cotización vinculada.
5. Registra anticipos o abonos con fecha efectiva. El saldo se calcula; no se fuerza el badge Pagado.
6. Entrega el pedido. No hace falta confirmar costos para registrar la entrega.
7. Registra gastos y desembolsos. La compra de material mueve caja; el consumo productivo no crea otro egreso. Corrige errores con motivo y conserva el rastro original.

## Backup y recuperación

Ejemplos desde la raíz `ia`, para el contenedor anterior; reemplaza `golden_print_dev` por el nombre real de la base configurada. Los archivos pueden contener datos personales y deben guardarse en un directorio privado. Estos comandos evitan poner contraseñas en argumentos y evitan redirección binaria de PowerShell.

```powershell
New-Item -ItemType Directory -Force .\golden-print-3d-app\.runtime\backups
$backupContainer = "postgres-local"
docker exec $backupContainer pg_dump -U postgres -d golden_print_dev -Fc -f /tmp/golden-print-backup.dump
docker cp "${backupContainer}:/tmp/golden-print-backup.dump" .\golden-print-3d-app\.runtime\backups\golden-print-backup.dump
docker exec $backupContainer pg_restore --list /tmp/golden-print-backup.dump
```

Prueba recuperación en una base nueva, nunca sobre la base activa:

```powershell
docker exec $backupContainer createdb -U postgres golden_print_recovery
docker cp .\golden-print-3d-app\.runtime\backups\golden-print-backup.dump "${backupContainer}:/tmp/golden-print-recovery.dump"
docker exec $backupContainer pg_restore -U postgres -d golden_print_recovery --no-owner --no-acl --exit-on-error /tmp/golden-print-recovery.dump
```

Verifica conteos, relaciones, acceso, totales financieros y consecutivos en esa base antes de planificar un cambio de conexión. Respalda también el secreto de autenticación y la configuración privada mediante almacenamiento seguro separado. Un comando `pg_dump` exitoso no demuestra recuperación: debe probarse la restauración. La recuperación no se ejecutó durante esta entrega.

## Diagnóstico

- Conexión rechazada: verifica Docker, puerto, base creada y variables privadas; no imprimas la URL completa.
- Login denegado: verifica que bootstrap se ejecutó en la base correcta y que la cuenta está activa. No uses credenciales E2E en desarrollo.
- Conflicto al guardar: recarga el registro y repite sobre la versión vigente; no dupliques pagos manualmente.
- Test de integración bloqueado: configura una base desechable terminada en `_test`; la protección evita sustituir datos de desarrollo.
- Errores de build: conserva la salida y corrige antes de publicar. `npm start` requiere `npm run build`.

## Publicación

Neon/Vercel no se configuraron ni publicaron. Antes del despliegue autorizado: separa roles runtime/migración, configura conexiones/secretos/origen HTTPS privados, respalda datos, aplica migraciones, inicializa la cuenta real si corresponde y repite verificación de acceso y flujo financiero. Contratación, costos y publicación mantienen aprobación independiente del propietario.
