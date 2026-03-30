# Frontend deployment (test_deploy)

## Trigger

- Workflow runs on push to `test_deploy`
- Workflow file: `.github/workflows/deploy-frontend-test.yml`

## Required GitHub Secrets

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_SSH_PORT`
- `FRONTEND_DIST_PATH` — абсолютный путь на VPS, куда SCP кладёт файлы из `dist/`; **должен совпадать** с `root` в Caddy для основного сайта (в эталоне: `/opt/interhub/frontend-dist/dist`)

Секрет **`FRONTEND_MINIAPP_DIST_PATH`** нужен только для workflow miniapp (ветка `test_deploy_miniapp`), см. раздел ниже.

**Не путать с Caddy:** строка `email …` в Caddyfile на VPS (ACME) **не** добавляется в GitHub Secrets.

## Required GitHub Variables

- `VITE_API_BASE_URL` - API origin only, e.g. `https://app.example.com` (no trailing `/api`; routes in code already use `/api/...`)

## Output target on VPS

- Frontend build artifacts are uploaded to:
  - `${FRONTEND_DIST_PATH}`

This path must match `root` path in your Caddy site config.

---

# Telegram Mini App (`miniapp.interhub.online`)

## Как уходит код на VPS (GitHub CI/CD)

Пайплайн **только через GitHub Actions** — локальный скрипт деплоя не нужен.

1. Событие: push в ветку `test_deploy_miniapp` или кнопка **Run workflow** для `Deploy Frontend Mini App`.
2. Работает раннер **ubuntu-latest** (инфраструктура GitHub): ставит Node 22, собирает проект, получает каталог `dist/`.
3. **SCP по SSH** на ваш VPS: содержимое `dist/*` записывается в каталог из секрета **`FRONTEND_MINIAPP_DIST_PATH`** (тот же путь, что `root` в Caddy для miniapp).
4. **SSH** на тот же VPS: `systemctl reload caddy`, чтобы отдать новые файлы.

Без корректно заданных секретов `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` и пути `FRONTEND_MINIAPP_DIST_PATH` шаги 3–4 не выполнятся — в Actions будет ошибка подключения или записи.

## DNS

- Создайте **A-запись**: `miniapp` → публичный IP вашего VPS (часто тот же, что у `interhub.online`).

## Trigger

- Push в ветку `test_deploy_miniapp` или **Run workflow** вручную.
- Файл: `.github/workflows/deploy-frontend-miniapp.yml`

## GitHub Secrets (дополнительно к VPS_*)

- **`FRONTEND_MINIAPP_DIST_PATH`** — единственный обязательный «путевой» секрет для этого пайплайна (остальные пути основного фронта задаёте в **`FRONTEND_DIST_PATH`** для `test_deploy`).  
  Значение = `root` в Caddy для `miniapp.interhub.online`, в эталоне: **`/opt/interhub/frontend-dist-miniapp`**.  
  На VPS: `mkdir -p /opt/interhub/frontend-dist-miniapp` и права на пользователя из `VPS_USER`.

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
- Полный пример с двумя доменами и портом `18080`: `interhubdev/deploy/caddy/Caddyfile.vps.example`.  
- Узкий шаблон только miniapp: `interhubdev/deploy/caddy/Caddyfile.miniapp.template`  
  (подставьте порт бэкенда и путь `root` = значению секрета `FRONTEND_MINIAPP_DIST_PATH`).
- После правок: `sudo systemctl reload caddy`.

## Бэкенд (CORS / cookies)

- В `JWT_CORS_ALLOWED_ORIGINS` (или аналог в Spring) добавьте `https://miniapp.interhub.online`, иначе браузер/Telegram WebView заблокирует запросы к API на другом origin.
- Для cookie-сессий проверьте `SameSite` и домен cookie: при API на том же поддомене, что и фронт, проще.

## Если в Actions падает `drone-scp` / «create folder» / exit status 1

Чаще всего **нет каталога на VPS** или **нет прав** у пользователя из `VPS_USER` писать в `/opt/...`.

1. Зайдите на сервер по SSH и выполните (подставьте свой путь из секрета):  
   `sudo mkdir -p /opt/interhub/frontend-dist-miniapp`  
   `sudo chown -R ВАШ_DEPLOY_USER:ВАШ_DEPLOY_USER /opt/interhub/frontend-dist-miniapp`
2. Для основного фронта то же для `FRONTEND_DIST_PATH`, например:  
   `sudo mkdir -p /opt/interhub/frontend-dist/dist` и `chown` на того же пользователя.
3. Проверьте секрет **`FRONTEND_MINIAPP_DIST_PATH`**: без лишних пробелов и переносов строк, путь как в Caddy `root` (без кавычек в значении секрета).
4. Ключ **`VPS_SSH_KEY`**: полный приватный ключ OpenSSH (включая строки `BEGIN` / `END`), как в файле `id_rsa` / `id_ed25519`.
5. В workflow перед SCP добавлен шаг **Ensure … directory exists** — если падает он, в логе будет явная подсказка; если падает только SCP — смотрите диск, квоту и `sshd` логи на VPS.
