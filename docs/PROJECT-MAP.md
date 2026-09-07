# Mapa del proyecto — Guillo Guambi

Actualizado: 2026-09-07

## Rutas

- `/`: landing comercial completa.
- `/api/health` `GET`: comprueba aplicación y PostgreSQL; responde `{ "status": "ok" }`.
- `/api/leads` `POST`: valida y guarda solicitudes; notifica por Resend si está configurado.
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`: descubrimiento y metadatos.

## Componentes

- `src/app/page.tsx`: contenido, secciones, servicios, proceso y FAQ.
- `src/components/Brand.tsx`: identidad tipográfica y monograma.
- `src/components/ContactForm.tsx`: formulario y estados de envío.
- `src/components/Reveal.tsx`: animación progresiva, accesible y tolerante a fallos de JS.
- `src/app/globals.css`: sistema visual responsive.

## Datos

Tabla `leads`: identidad de la solicitud, contacto, municipio, servicio, mensaje, consentimiento, origen, hash de IP, agente de usuario y fecha. La IP original nunca se guarda.

## Flujo de captación

1. El visitante identifica su situación o explora servicios.
2. Llega al formulario con CTA contextual.
3. El cliente valida campos; el servidor repite la validación, aplica honeypot, tiempo mínimo y rate limit.
4. PostgreSQL guarda la solicitud.
5. Si Resend está configurado, se envía aviso; un fallo de correo no elimina el lead.

## Infraestructura

- Repo: `Ferolicas/Guille`.
- VPS: `/var/www/guille`.
- PM2: `guille`, puerto `4011`.
- Dominio Caddy: `guilloguambi.com`, redirección de `www` al dominio canónico y rechazo en proxy de cabeceras `Next-Action` (la app no usa Server Actions).
- Deploy: push a `main` → GitHub Actions → SSH → `deploy.sh`.

## Variables

Obligatoria: `DATABASE_URL`. Recomendadas: `AUTH_SECRET`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE_DISPLAY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
