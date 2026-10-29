# SAICuMA — Información cultural de Misiones

Nueva versión de [saicuma.org](https://www.saicuma.org): el directorio de artistas, colectivos e instituciones
culturales de Misiones, Argentina. Hecha con **Next.js 16 + Tailwind CSS 4 + shadcn/ui**, con **pnpm**.

## Empezar

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Qué incluye

| Ruta | Qué muestra |
| --- | --- |
| `/` | Directorio con búsqueda instantánea y filtros por tipo, actividad y ciudad (quedan en la URL: `/?tipo=colectivo&ciudad=Oberá`) |
| `/users/<perfil>/` | Ficha: contacto directo (llamar, escribir, web, mapa, redes), bio, galería con visor y perfiles relacionados |
| `/acerca-de/` | Qué es SAICuMA y quiénes forman parte |
| `/contact/` | Formulario que arma el correo para `info@saicuma.com.ar` |

Las URLs de los perfiles son las mismas que en el sitio original. No incluye el registro ni el ingreso de usuarios.

## Contenido

- `content/profiles.json`: 216 perfiles. `content/taxonomies.json`: actividades y ciudades.
- Imágenes en `public/sites/...` con las mismas rutas que en Drupal.
- Para regenerar todo desde el sitio descargado en `_export/`:

```bash
pip install beautifulsoup4 pillow   # una sola vez
pnpm extract
pnpm optimize-images                # recomprime las fotos grandes de las galerías
```
