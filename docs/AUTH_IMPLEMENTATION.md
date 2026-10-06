# Acceso privado y administración de usuarios

Implementación: Better Auth 1.7.7, adaptador Drizzle/PostgreSQL, plugin oficial admin y cliente React de mismo origen. `getAuth()` y `getDb()` son lazy: importar el módulo durante build no requiere secretos ni conexión. IDs auth se generan mediante función oficial `generateId: () => randomUUID()`; el shortcut `"uuid"` delega en defaults SQL y no corresponde a tablas auth con id text sin default.

## Contratos

- `requireAccess(requiredRole?)` valida sesión en BD, rechaza impersonación y comprueba membership activa. Devuelve identidad, empresa, rol y sessionId derivados exclusivamente del servidor. No usa caché de cookies para autorización.
- `listUsers`, `createUser`, `changeRole`, `deactivate`, `reactivate`, `resetCredential` comprueban administrator internamente. IDs/version/key se validan con Zod estricto; respuestas no incluyen contraseñas, hashes ni sesiones.
- Mutaciones de usuarios toman el mismo advisory lock transaccional que bootstrap y revalidan sesión/membership al obtenerlo. Último administrador protegido, edición optimista y auditoría/idempotencia persistentes; cambios de rol/acceso/contraseña revocan todas las sesiones del destinatario dentro de la misma transacción.
- Alta usa `auth.api.createUser` del plugin oficial. La identidad se crea en conexión propia del adaptador; membership/auditoría/key se comprometen en la transacción empresarial. No se afirma atomicidad entre ambas. Un fallo de asociación deja la identidad sin membership, intenta ban/revoke compensatorio y devuelve fallo que exige reparación administrativa. Un correo huérfano no se reasigna silenciosamente.
- Contraseñas de recuperación usan `hashPassword` oficial de `better-auth/crypto`; jamás un almacén paralelo. El hash de idempotencia usa HMAC con el secreto privado, evitando un hash simple de contraseña persistido. Rotar el secreto invalida sesiones y puede requerir claves nuevas para reintentos de operaciones de usuarios anteriores.

## Superficie HTTP y seguridad

El handler permite únicamente login, logout, consulta de sesión, cambio de contraseña propia y consulta/revocación de sesiones propias, con método explícito. Todos los endpoints genéricos `/admin/*`, signup, impersonación, modificación de email y recuperación anónima permanecen bloqueados. Se conserva protección de origen/CSRF de Better Auth. Trusted origin único exacto; HTTPS obligatorio en producción; cookies seguras en HTTPS y cache-control private/no-store. Rate limits PostgreSQL: 5 intentos/minuto para login y contraseña, 100/minuto general. No proveedor email ni credenciales predeterminadas.

## Bootstrap privado

Ejecutar migraciones y luego `npm run bootstrap` desde entorno privado con `.env.local`. El CLI pide nombre/correo y contraseña sin eco. En una sola conexión y transacción crea empresa singleton, identidad, account credential compatible con Better Auth, administrador, parámetros y contadores, más auditoría. Una segunda instalación se rechaza; cualquier error revierte. No se ejecuta durante build ni desde rutas web.

Para automatización privada de pruebas, admite `BOOTSTRAP_NAME`, `BOOTSTRAP_EMAIL`, `BOOTSTRAP_PASSWORD` como variables temporales del proceso; borra la última del entorno tras leerla. Nunca guardar esas variables en archivos versionados, cuerpos de requests públicos o argumentos CLI. Conexión remota usa TLS con verificación de certificado. El CLI nunca imprime hashes, contraseñas ni detalles SQL.

## Verificación

Typecheck global pasa. Smoke real del handler Better Auth con credenciales privadas de la base E2E aislada reconoció el bootstrap y retornó HTTP 200. El primer smoke detectó id NULL de rate_limit (23502), corregido usando el generador UUID por función. Los errores del handler registran exclusivamente clase y código PostgreSQL saneado, sin SQL/params. La validación de último-admin/concurrencia y revisión independiente deben completarse antes de declarar el acceso terminado; seguir el registro central de pruebas para su resultado actualizado.

Fuentes oficiales consultadas: [Next.js](https://better-auth.com/docs/integrations/next), [admin](https://better-auth.com/docs/plugins/admin), [rate limits](https://better-auth.com/docs/concepts/rate-limit), paquete instalado 1.7.7 (crypto, esquema core/admin y routes).
