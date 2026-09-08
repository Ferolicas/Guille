#!/usr/bin/env bash
set -euo pipefail

APP="guille"
PORT="4011"
APP_DIR="/var/www/${APP}"

export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh" || true

cd "${APP_DIR}"
git fetch origin main
git pull --ff-only origin main
install -d -m 750 /var/www/guille-data/uploads/leads /var/www/guille-data/uploads/gallery
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

sleep 2
if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  echo "Deploy OK -> https://guilloguambi.com"
else
  echo "Healthcheck FALLÓ tras el deploy"
  pm2 logs "${APP}" --lines 30 --nostream || true
  exit 1
fi
