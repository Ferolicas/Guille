# Mapa del proyecto — Guillo Guambi

Actualizado: 2026-09-08 · Commit funcional: `129e748`

## Identidad y stack

Web comercial mobile first para captar reformas y restauraciones en Barcelona y su área metropolitana. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL 17 y Drizzle ORM. SMTP2GO envía el correo transaccional con Resend como respaldo. Sharp y FFmpeg comprimen archivos. PM2 sirve Node 22 en el puerto 4011 detrás de Caddy en `guilloguambi.com`.

## Mapa de rutas

| Ruta | Archivo | Qué muestra | Auth | Datos |
| --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing, servicios, proceso, galería de trabajos y contacto | No | `gallery_videos`, `gallery_slots` |
| `/panel` | `src/app/panel/page.tsx` | Login o panel con vídeos importados, seis tarjetas manuales y leads | Cookie firmada | `gallery_videos`, `gallery_slots`, `leads`, `lead_files` |
| `/panel/restablecer` | `src/app/panel/restablecer/page.tsx` | Formulario de contraseña nueva | Token mágico | `password_reset_tokens` |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | `src/app/*` | Descubrimiento y metadatos | No | Ninguno |

## Endpoints API

| Método y ruta | Archivo | Responsabilidad | Consumidor | Tablas |
| --- | --- | --- | --- | --- |
| `GET /api/health` | `src/app/api/health/route.ts` | Salud de app y PostgreSQL | CI, PM2, monitor | — |
| `POST /api/leads` | `src/app/api/leads/route.ts` | Valida multipart, comprime, guarda y envía dos correos | Modal público | `leads`, `lead_files` |
| `GET /api/gallery-media/[name]` | `src/app/api/gallery-media/[name]/route.ts` | Sirve imagen/vídeo público con rangos y caché | Galería home | Archivos de galería |
| `POST /api/panel/login` | `src/app/api/panel/login/route.ts` | Verifica scrypt y crea cookie HttpOnly | Login | `admin_credentials` |
| `POST /api/panel/logout` | `src/app/api/panel/logout/route.ts` | Elimina cookie | Panel | — |
| `POST /api/panel/password` | `src/app/api/panel/password/route.ts` | Cambia hash y renueva sesión | Seguridad panel | `admin_credentials` |
| `POST /api/panel/recovery` | `src/app/api/panel/recovery/route.ts` | Crea token y envía enlace mágico | Login | `admin_credentials`, `password_reset_tokens` |
| `POST /api/panel/reset` | `src/app/api/panel/reset/route.ts` | Consume token, cambia clave y hace login | Restablecer | `admin_credentials`, `password_reset_tokens` |
| `POST /api/panel/gallery/[slot]` | `src/app/api/panel/gallery/[slot]/route.ts` | Comprime y actualiza uno de seis slots | Panel | `gallery_slots` |
| `DELETE /api/panel/gallery-videos/[id]` | `src/app/api/panel/gallery-videos/[id]/route.ts` | Retira un vídeo importado y sus archivos persistentes | Panel | `gallery_videos` |
| `GET /api/panel/files/[id]` | `src/app/api/panel/files/[id]/route.ts` | Lee archivo privado del lead con sesión | Panel | `lead_files` |

## Modelo de datos

- `leads`: contacto, población, servicio, mensaje, consentimiento, origen, hash de IP, agente y fecha.
- `lead_files`: archivo comprimido ligado a un lead; guarda nombre visible, nombre físico, MIME, tipo y bytes.
- `gallery_slots`: slots 1–6, título, descripción y hasta dos medios etiquetados como antes/después/único.
- `gallery_videos`: vídeos importados, portada WebP, copy público, enlace de origen, orden y fecha; el ID externo de TikTok impide duplicados.
- `admin_credentials`: singleton `owner`, hash scrypt, email de recuperación y fecha de cambio.
- `password_reset_tokens`: hash SHA-256 del token de un solo uso, caducidad y consumo.
- Esquema en `src/db/schema.ts`; migraciones versionadas en `drizzle/` y aplicadas por `deploy.sh`.

## Flujos clave

### Solicitud y archivos

1. Una tarjeta o CTA abre `QuoteDialog` con servicio y explicación ya seleccionados.
2. Paso 1 pide nombre, teléfono, email y población; paso 2 pide proyecto, consentimiento y hasta tres archivos.
3. `storage.ts:parseMultipartRequest` transmite cada archivo a temporal con límite individual de 200 MB.
4. `compressAndStore` convierte fotos a WebP, vídeos a H.264/MP4 y comprime documentos grandes con gzip.
5. `/api/leads` guarda lead y metadatos en una transacción y conserva los archivos fuera de `public`.
6. `email.ts:sendLeadEmails` envía por separado confirmación al cliente y aviso a Guillo, con un presupuesto conjunto de adjuntos de 15 MB; cualquier resto continúa disponible en `/panel`.

### Galería

1. `getPublicGalleryItems` presenta primero los vídeos importados, añade los slots manuales con contenido y solo usa seis reservas cuando no existe ningún trabajo.
2. `PortfolioGallery` muestra dos tarjetas en móvil y carga las portadas sin descargar cada MP4. Al pulsar reproducir abre un visor modal con controles, título y navegación circular Anterior/Siguiente; las piezas dobles conservan la alternancia automática y manual de Antes/Después.
3. El panel permite reproducir y eliminar individualmente los vídeos importados; la confirmación aclara que la publicación original de TikTok no se altera.
4. Las seis tarjetas manuales siguen admitiendo título, descripción y uno o dos medios. La API comprime el reemplazo, hace upsert y después retira el archivo anterior.
5. `scripts/import-tiktok-gallery.mjs` valida el manifiesto y los archivos antes de hacer una importación transaccional con deduplicación por ID externo.

### Auth y recuperación

1. Login sin email; `panel-auth.ts` verifica un hash scrypt y firma una sesión HMAC de 12 horas en cookie HttpOnly, Secure y SameSite Strict.
2. Recuperación compara el email configurado sin revelar si coincide, guarda solo el hash del token y envía un enlace de 30 minutos.
3. El enlace cambia la contraseña, consume el token y establece sesión automática.

## Dependencias compartidas

- `src/app/layout.tsx`: metadatos, fuentes y estilos de todas las rutas.
- `src/app/globals.css`: tokens y reglas mobile first; el viewport de referencia es 390×844.
- `src/lib/service-catalog.ts`: copy, imágenes y contexto automático de todas las tarjetas y modales.
- `src/components/ContactForm.tsx`: modal, formulario en dos pasos y acciones flotantes.
- `src/lib/storage.ts`: contrato de límites, rutas privadas y compresión usado por leads y galería.
- `src/lib/gallery.ts`: combina los vídeos importados con los slots manuales y genera las URLs públicas de medios y portadas.
- `src/lib/panel-auth.ts`: hash, sesión y recuperación usados por todas las APIs privadas.
- `src/lib/email.ts`: plantillas y transporte SMTP2GO/Resend para leads y recuperación.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | PostgreSQL de la app |
| `APP_URL` | Base de enlaces mágicos |
| `AUTH_SECRET` | Firma de sesión y hash de IP |
| `PANEL_RECOVERY_EMAIL` | Email autorizado para recuperar el panel; por defecto Guillo |
| `UPLOAD_ROOT` | Raíz persistente privada; producción usa `/var/www/guille-data/uploads` |
| `SMTP2GO_API_KEY` | Proveedor de correo principal |
| `SMTP2GO_API_URL` | Endpoint regional SMTP2GO UE |
| `RESEND_API_KEY` | Respaldo cuando SMTP2GO no está configurado |
| `CONTACT_TO_EMAIL` | Avisos internos; por defecto `guilloguambi@gmail.com` |
| `CONTACT_FROM_EMAIL` | Remitente verificado; por defecto `contacto@guilloguambi.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp público; fallback solicitado `34662569563` |
| `NEXT_PUBLIC_PHONE_DISPLAY` | Teléfono visible; fallback solicitado `662 569 563` |

## Infraestructura

- Repo `Ferolicas/Guille`, rama `main`; push activa `.github/workflows/deploy.yml`.
- VPS `/var/www/guille`; PM2 `guille`; puerto `4011`; Caddy `guilloguambi.com`.
- `deploy.sh` crea las carpetas persistentes, migra, compila, recarga y ejecuta healthcheck.

## Lecciones y gotchas

- 2026-09-08: en móvil, `.hero` más `.proof-band` suman exactamente `100svh`; cambiar una altura exige captura 390×844.
- 2026-09-08: los logos del nav y del footer conservan el PNG original; cada enlace actúa como marco con `overflow: hidden` para recortar la línea negra inferior.
- 2026-09-08: los medios administrables no pueden vivir en `public`, porque un pull o deploy los perdería.
- 2026-09-08: los vídeos importados usan portada WebP y `preload="none"`; así una galería extensa no descarga decenas de MP4 al abrir la home.
- 2026-09-08: SMTP2GO responde HTTP 200 incluso si el payload informa fallos; `email.ts` comprueba también `data.failed`.
- 2026-09-08: los documentos privados potencialmente activos se fuerzan a descarga con `nosniff`; solo WebP, MP4 y PDF pueden abrirse inline.
