# Guillo Guambi

Web comercial de reformas y restauración para `guilloguambi.com`.

## Desarrollo

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

## Verificación

```bash
pnpm check
```

El formulario guarda cada solicitud en PostgreSQL y envía una notificación por Resend cuando sus variables están configuradas. Consulta `AGENTS.md` y `docs/PROJECT-MAP.md` para la arquitectura y el despliegue.
