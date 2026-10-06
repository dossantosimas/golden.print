# Activos de marca — Golden Print 3D

Fecha: 2026-10-03. Fuente: archivos entregados por el propietario. Ajuste del blueprint, sin implementación de la aplicación ni aprobación global implícita.

| Uso | Archivo del proyecto | Original |
|---|---|---|
| Marca completa en inicio de sesión | assets/brand/golden-print-wordmark.jpg | golden_print_logo.jpg |
| Emblema dorado como referencia de paleta y marca secundaria | assets/brand/golden-print-emblem.png | GoldenOriginal.png |

Origen de ambos: `C:/Users/dossa/Desktop/Projects/golden print 3D/00 logos/`. Las copias se conservan dentro del proyecto para que el diseño no dependa de rutas personales externas. SHA256 de cada copia coincide con su original. No se recortó, recoloreó, eliminó fondo ni modificó ninguno de los logos.

## Instrucción confirmada

Dirección vigente tras corrección del propietario: crear una imagen nueva con el logo integrado en el fondo del login, en lugar del JPG colocado como bloque. Ver [LOGIN_BACKGROUND_V2.md](LOGIN_BACKGROUND_V2.md) y [activo generado](assets/brand/login-background-v2.png). La maqueta LOGIN_PREVIEW.svg y el tratamiento anterior quedan como historial, no como diseño vigente. Originales conservados; propuesta generada pendiente de valoración visual.

Colocar el logo completo con el nombre Golden Print 3D en la pantalla de inicio de sesión y adaptar los colores de la aplicación a la marca. La imagen `golden_print_logo.jpg` muestra el nombre completo manuscrito en carbón sobre marfil; `GoldenOriginal.png` aporta tonos metálicos dorados. Usar el primero como marca principal del login, con proporción original y sin deformación.

## Diseño y próximo paso

Tokens, uso en login y responsive se documentan en UX_PLAN.md. LOGIN_PREVIEW.svg es una maqueta estática del diseño propuesto; no es una pantalla funcional ni un sistema de autenticación.

Tras aprobar el blueprint, trasladar los activos necesarios al directorio público de la app, implementar login Better Auth con estos colores y verificar imagen responsive, contraste, teclado, loading y errores con la interfaz real. No usar la tipografía manuscrita del logo para labels/cifras administrativas.
