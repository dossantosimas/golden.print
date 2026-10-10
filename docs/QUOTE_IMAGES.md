# Imágenes de cotización

Entrega: 2026-10-10. Hasta 10 fotos por revisión, con título opcional de hasta 120 caracteres. Las fotos son referencias comerciales y aparecen en el PDF enviado al cliente.

## Flujo

La sección Imágenes permite seleccionar varias fotos, escribir títulos y quitar referencias antes de guardar. Los botones de guardado se deshabilitan durante la carga. La edición de borrador guarda las referencias actuales; una nueva revisión conserva el documento publicado anterior. Duplicar copia referencias y títulos a un borrador independiente.

Sin fotos, el PDF conserva su estructura anterior. Con fotos, agrega páginas de imágenes después del resumen comercial, dos por página, con proporciones originales, títulos y pies numerados. No descarga URLs externas.

## Almacenamiento y límites

El navegador admite JPG, PNG y WebP de hasta 20 MiB y 40 megapíxeles, y los redimensiona antes de enviar. El servidor vuelve a comprobar y normalizar los bytes: máximo 2 MiB de entrada, JPEG de hasta 1600 px y 300 KiB almacenados. Quita metadatos y aplana transparencias sobre blanco. No admite archivos animados.

Los archivos inmutables residen en `quote_image_asset` como datos base64 privados en PostgreSQL; no requieren otra cuenta de almacenamiento. Títulos y orden están en `quote_revision.images` y en el snapshot de entradas. El servidor valida hasta 10 IDs únicos de la misma organización y el máximo de 120 caracteres del título. Las lecturas requieren sesión y membresía activa; no se cachean públicamente. La carga tiene idempotencia y un límite de 100 archivos por usuario/hora.

## Operación

Aplicar la migración 0009 antes de publicar código que consulte `quote_revision.images`. Es aditiva y deja las cotizaciones anteriores sin fotos (`[]`). Revertir el código puede conservar tabla y columna; no borrar archivos que referencias históricas necesiten.

Quitar una foto del formulario elimina la referencia, no el archivo compartido con revisiones o duplicados. Una carga abandonada puede quedar sin referencias. A futuro, implementar limpieza con período de gracia que compruebe **todas** las revisiones y snapshots antes de borrar; conservar evidencia de auditoría según la política definida. Vigilar espacio de PostgreSQL y migrar a almacenamiento privado de objetos si crece el volumen, manteniendo IDs y autorización por organización.

## Verificación

Ver [VALIDATION_REPORT](VALIDATION_REPORT.md): límites, optimización, PDF de diez imágenes, persistencia con rollback y cargas reales temporales desde navegador. Las miniaturas usan lectura privada directa; no pasan por el optimizador público de Next Image.
