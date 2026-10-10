> Nota de vigencia (2026-10-09): documento de diseño o evidencia de una etapa anterior. Sus propuestas, estados y resultados conservan su fecha y alcance. Para reglas actuales, consultar [índice vigente](README.md), [estado](PROJECT_STATUS.md) y [mejoras pendientes](IMPROVEMENTS.md). No usar afirmaciones históricas de falta de código/publicación o costos reales obligatorios como descripción de la aplicación actual.

# Riesgos

Estado: revisión de blueprint, antes de código. Severidad indica efecto; probabilidad es cualitativa y no un resultado estadístico.

| ID | Tipo / riesgo | Impacto | Probabilidad | Mitigación y evidencia de cierre |
|---|---|---|---|---|
| R01 | Negocio: confundir ventas, anticipos y caja | Alto: decisiones sobre dinero incorrectas | Media | FINANCIAL_RULES con bases/cohortes; etiquetas UX y pruebas de anticipos antes/después de entrega |
| R02 | Datos: compras/consumo/fallos contados dos veces | Alto: utilidad/caja falsas | Media | Origen único de egresos, clasificación excluyente, reserva no real; casos compra→consumo→fallo→reimpresión |
| R03 | Seguridad: primer registro toma empresa | Crítico: acceso no autorizado | Media | Provisionamiento inicial privado; signup público cerrado; singleton/tx y usuario sin membership sin acceso; pruebas rollback/concurrencia |
| R04 | Seguridad: permisos solo en UI o sesiones de desactivados | Crítico: acceso a finanzas/PII | Media | Autorización en cada servicio/PDF; verificar membresía activa en server; revocar sesiones; E2E operador/admin |
| R05 | Datos: doble conversión o sobrepago concurrente | Alto: pedidos/saldos corruptos | Media | Locks, unique, idempotencia, transacciones reales PostgreSQL; tests de solicitudes paralelas |
| R06 | Técnico: release/adaptador Better Auth/Drizzle cambia | Alto: auth/esquema incompatible | Media | Fuentes oficiales; pin estable conjunto, schema generado revisado y smoke auth/migraciones antes scaffold funcional |
| R07 | Operación: costos reales incompletos | Alto: rentabilidad sobreestimada | Alta al inicio | Estado de completitud/provisional; no inferir cero; checklist de cierre, exclusión del equilibrio cuando falta base |
| R08 | Coste: Vercel Hobby no permite uso comercial | Alto: deployment elegido requiere plan pagado | Alta | Pro propuesto; precio/condiciones en TECHNOLOGY_STACK; no contratación automática, gate de coste/deployment |
| R09 | Dependencia: Neon/cuentas/secretos no disponibles | Alto: integración/deployment pendientes | Media | Desarrollo PostgreSQL real separado; env.example sin secretos, deployment listo antes solicitar credenciales; nunca afirmar pruebas remotas no ejecutadas |
| R10 | Operación: pérdida de acceso único admin o de DB | Alto | Media | Último admin protegido, provisionamiento/reset privado documentado; backup/export y restore verificados antes producción |
| R11 | UX/PDF: textos largos, nombres Unicode, móvil | Medio: cotización ilegible o flujo bloqueado | Media | PDF medido/paginado, fuente Unicode controlada si se requiere; QA tildes/ñ/nombres/notas; UI 360px, teclado y targets |
| R12 | Seguridad/operación: previews usan DB real o logs exponen PII | Alto | Media | Entornos/DB separados, secretos server-only, no logs de passwords/tokens/client payloads; roles BD limitados |
| R13 | Alcance: incorporar contabilidad fiscal/stock avanzado | Medio: sobrecarga y fórmulas inválidas | Media | MVP/NEXT/FUTURE trazados; sin impuestos confirmado; ninguna integración máquina/slicing; cambios comerciales vuelven a gate |
| R14 | Framework: placeholders compartidos incompletos | Alto: contratos inaccesibles | Confirmado, reparado para recursos usados | FRAMEWORK_REPAIR registra 118 hashes iguales por destino; verificar cada skill adicional antes activarla |

## Gate de release

Los riesgos anteriores son hipótesis de diseño, excepto el defecto de empaquetado y restricción de plan verificados. Las mitigaciones se comprueban durante implementación/review; un documento no prueba seguridad del código. No entregar con hallazgos críticos/importantes abiertos. No afirmar COMPLETE antes de cerrar los checks del framework; deployment productivo y gastos externos conservan el control del propietario.
