# Frontend deployment (test_deploy)

## Trigger

- Workflow runs on push to `test_deploy`
- Workflow file: `.github/workflows/deploy-frontend-test.yml`

## Required GitHub Secrets

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_SSH_PORT`
- `FRONTEND_DIST_PATH` (absolute path for static files, e.g. `/opt/interhub/frontend-dist`)

## Required GitHub Variables

- `VITE_API_BASE_URL` - API origin only, e.g. `https://app.example.com` (no trailing `/api`; routes in code already use `/api/...`)

## Output target on VPS

- Frontend build artifacts are uploaded to:
  - `${FRONTEND_DIST_PATH}`

This path must match `root` path in your Caddy site config.

---

# Telegram Mini App (`miniapp.interhub.online`)

## DNS

- Создайте **A-запись**: `miniapp` → публичный IP вашего VPS (часто тот же, что у `interhub.online`).

## Trigger

- Push в ветку `test_deploy_miniapp` или **Run workflow** вручную.
- Файл: `.github/workflows/deploy-frontend-miniapp.yml`

## GitHub Secrets (дополнительно к VPS_*)

- `FRONTEND_MINIAPP_DIST_PATH` — каталог для статики мини-приложения, например `/opt/interhub/miniapp-dist`  
  (на сервере: `mkdir -p /opt/interhub/miniapp-dist` и права на пользователя деплоя).

## GitHub Variables

- `VITE_MINIAPP_API_BASE_URL` — рекомендуется, origin для `fetch` в бандле, например `https://miniapp.interhub.online`  
  если `/api` проксируется с того же хоста в Caddy.
- Если не задано, используется `VITE_API_BASE_URL` (как у основного фронта).

Локальный контракт переменных: [.env.miniapp.example](.env.miniapp.example) (в репозитории; реальный `.env.production` не коммитится).

## URL для BotFather

- `https://miniapp.interhub.online/index-mobile.html`

## Монорепозиторий

- Если корень Git — не `interhubfront`, а папка выше, GitHub не увидит `.github` внутри подпапки: перенесите workflow в корень репозитория и добавьте `working-directory: interhubfront` (или `defaults.run.working-directory`) для шагов `npm ci` / `npm run build`, а в SCP укажите `source: interhubfront/dist/*` и при необходимости `strip_components` по документации `appleboy/scp-action`.

## Caddy

- Добавьте **отдельный** `site` для поддомена; не смешивайте root с основным SPA.  
- Шаблон: в репозитории бэкенда `interhubdev/deploy/caddy/Caddyfile.miniapp.template`  
  (подставьте порт бэкенда и путь `root` = `FRONTEND_MINIAPP_DIST_PATH`).
- После правок: `sudo systemctl reload caddy`.

## Бэкенд (CORS / cookies)

- В `JWT_CORS_ALLOWED_ORIGINS` (или аналог в Spring) добавьте `https://miniapp.interhub.online`, иначе браузер/Telegram WebView заблокирует запросы к API на другом origin.
- Для cookie-сессий проверьте `SameSite` и домен cookie: при API на том же поддомене, что и фронт, проще.
