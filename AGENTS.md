# Guillo Guambi — guía del proyecto

## Producto

Web comercial de captación para reformas y restauración en Barcelona y su área metropolitana. La información de servicios parte de los recorridos de obra entregados por el cliente; no inventar proyectos, reseñas, años de experiencia ni garantías.

## Stack

- Next.js 16 App Router, React 19, TypeScript y Tailwind CSS 4.
- PostgreSQL + Drizzle ORM para solicitudes, galería y credenciales del panel.
- SMTP2GO como correo principal y Resend como respaldo; el guardado en base de datos es la fuente de verdad.
- Sharp + FFmpeg para comprimir archivos en almacenamiento privado persistente.
- Node 22 sobre PM2, puerto 4011, Caddy en `guilloguambi.com`.
- Gestor obligatorio: pnpm.

## Comandos

- `pnpm dev`: desarrollo.
- `pnpm check`: lint, tipos, tests y build.
- `pnpm db:generate`: genera migraciones desde `src/db/schema.ts`.
- `pnpm db:migrate`: aplica migraciones.
- `pnpm start`: producción, respeta `PORT`.

## Reglas

- Nunca versionar `.env`; mantener `.env.example` sin secretos.
- Cada cambio de rutas, datos o flujo debe reflejarse en `docs/PROJECT-MAP.md`.
- La home debe seguir siendo visible si JavaScript falla. Las animaciones son mejora progresiva y respetan `prefers-reduced-motion`.
- No mostrar teléfono o WhatsApp si sus variables públicas están vacías.
- No romper `GET /api/health` ni el guardado de `/api/leads`.
- La interfaz se diseña mobile first para 390×844; escritorio es una adaptación y no puede degradar el flujo móvil.
- Los archivos de leads nunca se sirven públicamente; solo `/api/panel/files/[id]` con sesión válida puede leerlos.
- La galería pública siempre contiene seis slots y los medios subidos viven fuera del repositorio.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
