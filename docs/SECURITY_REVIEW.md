> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Revisión de seguridad del diseño

Fecha: 2026-10-02 · Revisor: security_auditor, independiente del diseño de arquitectura. Alcance: blueprint documental; no código, escaneo de dependencias, pruebas de runtime ni certificación de release.

## Veredicto

**Approve — diseño**. SEC-01 cerrado tras relectura de los contratos actualizados; sin hallazgos de diseño abiertos. Los controles son adecuados como propuesta; su eficacia debe verificarse durante implementación. Esta revisión no sustituye la aprobación del propietario ni la revisión de seguridad de la aplicación implementada.

## Hallazgos

| ID / severidad | Evidencia y riesgo original | Resolución verificada en diseño |
|---|---|---|
| SEC-01 / High / CLOSED (diseño) | El campo original `notes` genérico no concordaba con customerNotes/internalNotes y podía inducir exposición de notas privadas en PDF. | DATABASE_DESIGN tabla quote_revision (línea 87) y contrato de notas (línea 130) separan `customer_notes`/`internal_notes`, mapean DTOs explícitos y congelan ambos en snapshot. API_DESIGN contrato PDF (línea 90) exige allowlist comercial, prohíbe pasar QuoteResult completo al renderer y aplica la separación también al preview. Cliente ausente se etiqueta «Sin cliente»; los datos privados/componentes/ganancias/costos quedan excluidos. Coherente con UX_PLAN §9. Prueba de sentinela interna ausente y estabilidad del snapshot queda obligatoria en T11/T17/T18. |

## Controles aceptados en diseño

- ARCHITECTURE §Acceso y ADR-003: bootstrap CLI privado, signup público cerrado desde inicio, hash oficial/schema fijados antes del scaffold y una transacción con advisory lock para organización, identidad/account, membership y configuración. Login/rollback/concurrencia previstos; ninguna credencial predeterminada ni instalación web.
- ARCHITECTURE §Acceso y API_DESIGN §HTTP: membership activa gobierna negocio. Alta normal auth→membership reconoce commits separados y compensación; una identidad huérfana no accede. Último administrador serializado; desactivación revoca sesiones y deniega por membership; endpoints auth genéricos no pueden eludir política e impersonación deshabilitada. Recuperación privada auditada; proveedor email aplazado conforme al alcance.
- ARCHITECTURE §Concurrencia, API_DESIGN §Interfaces: permiso en cada comando/query/acción/PDF, IDs ligados a empresa, actor/org/rol derivados en servidor y DTOs por permiso. Operador accede a precios/costos del pedido necesarios para operar, sin detalle de pagos, caja ni agregados financieros. Middleware/UI no son autoridad.
- ARCHITECTURE §Seguridad: secretos server-only, DB/secretos de preview separados y datos ficticios; logs mínimos sin contraseñas/tokens/cookies/cuerpos PII; queries parametrizadas y rol runtime sin migraciones. Cookies seguras, trusted origins exactos, CSRF/origen y rate limit persistente previstos.
- API_DESIGN §HTTP y UX_PLAN §9: PDF privado, IDs/revisión autorizados, snapshot, recursos locales, textos acotados, nombre de archivo saneado y private/no-store. Cliente es opcional en cotización; campos ausentes no requieren identidad inventada.
- DATABASE_DESIGN §Pagos y UX_PLAN §Abonos: correcciones administrativas con motivo/confirmación, original preservado, saldo/caja bajo locks y auditoría; sin devoluciones ni pagos negativos. Borrados restringidos, histórico financiero preservado y acciones destructivas confirmadas.

## Verificación obligatoria posterior

T04/T06/T07/T11/T17/T18 y M1–M5 deben aportar evidencia sobre: hash/account con versión fijada; rollback y bootstrap concurrente; signup/impersonación/admin auth directos denegados; último admin concurrente; identidad huérfana y usuario inactivo; revocación de sesiones tras desactivar/restablecer/cambiar permisos; autorización por llamadas directas y campos DTO en ambos roles; IDOR/PDF y notas privadas; CSRF/trusted origins/rate limits; secretos/logs/preview; límites numéricos/textos y correcciones financieras atómicas. Examinar lockfile y dependencias reales antes de release. Ninguna de estas pruebas está ejecutada en blueprint.

No hay bloqueo de diseño por ausencia de email ni necesidad de contratar un servicio adicional. La aprobación del blueprint no declara la aplicación segura ni autoriza deployment productivo.
