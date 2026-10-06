# Reparación de dependencias del framework

Fecha: 2026-10-02. Alcance: restauración local de recursos existentes; no se crean agentes ni skills.

## Defecto y acción

Los archivos `agents/management/nexus/_common`, `agents/product/scribe/_common` y `agents/architecture/atlas/_common` contenían literalmente `../_common` y no funcionaban como directorios en Windows. Sus contratos referenciados eran inaccesibles.

Se reemplazaron solamente esos tres archivos placeholder por directorios con copia íntegra de `codex-framework/_sources/agent-skills/_common`. La fuente original no se modificó. La reparación reutiliza los contratos existentes, sin reescribir instrucciones, workflow, agentes ni skills.

## Evidencia

- Origen: ruta local resuelta antes de copiar.
- Destinos: rutas absolutas comprobadas dentro de `codex-framework/framework`.
- Copia: 118 archivos por destino.
- Verificación SHA256: los 118 archivos de cada destino coinciden con el origen.
- HANDOFF.md y TRACEABILITY.md: existen en los tres destinos después de la copia.
- Comando PowerShell de reparación y comparación terminó con exit code 0.

## Límite

No se repararon preventivamente otros placeholders. Si una skill adicional necesita archivos compartidos, se comprobará su disponibilidad antes de usarla. Esta reparación resuelve los bloqueos específicos registrados en el intake; no prueba todos los recursos del framework.

## Reversión

Antes de revertir, comprobar que los directorios restaurados siguen coincidiendo con el origen. Retirar únicamente las copias verificadas y restaurar en cada destino el archivo de texto original `../_common`. No eliminar ni modificar la fuente `_sources`.
