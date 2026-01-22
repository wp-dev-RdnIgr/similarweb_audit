# SimilarWeb Cookie Refresh for Browse.ai

Автоматическое обновление cookies SimilarWeb для робота Browse.ai через GitHub Actions.

## Как это работает

1. GitHub Actions запускается по расписанию (ежедневно в 09:00 по Киеву)
2. Puppeteer открывает браузер и логинится в SimilarWeb
3. Извлекаются все cookies
4. Cookies отправляются в Browse.ai API для обновления робота

## Установка

### Шаг 1: Создать приватный репозиторий на GitHub

1. Зайди на [github.com/new](https://github.com/new)
2. Название: `similarweb-cookie-refresh`
3. **ВАЖНО:** Выбери **Private** (приватный)
4. Нажми "Create repository"

### Шаг 2: Загрузить файлы

```bash
cd github-actions-cookies
git init
git add .
git commit -m "Initial commit: SimilarWeb cookie refresh automation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/similarweb-cookie-refresh.git
git push -u origin main
```

### Шаг 3: Настроить Secrets

1. Открой репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Нажми "New repository secret" и добавь:

| Secret Name | Value |
|------------|-------|
| `SIMILARWEB_EMAIL` | Твой email для SimilarWeb |
| `SIMILARWEB_PASSWORD` | Твой пароль от SimilarWeb |
| `BROWSE_AI_API_KEY` | `c8d94bb5-9cb7-466a-94dc-e3c21cbfe797:89e5dc61-e88d-456e-abf1-40d7b3993778` |
| `BROWSE_AI_ROBOT_ID` | `019b7e18-760a-73cf-8d7c-237ef5fa0d2a` |

### Шаг 4: Проверить работу

1. Перейди в Actions → "Refresh SimilarWeb Cookies"
2. Нажми "Run workflow" → "Run workflow"
3. Дождись выполнения и проверь логи

## Расписание

По умолчанию скрипт запускается **каждый день в 06:00 UTC** (09:00 по Киеву).

Изменить расписание можно в файле `.github/workflows/refresh-cookies.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'  # Формат: минуты часы день месяц день_недели
```

Примеры:
- `'0 6 * * *'` - каждый день в 06:00 UTC
- `'0 */12 * * *'` - каждые 12 часов
- `'0 6 * * 1-5'` - пн-пт в 06:00 UTC

## Локальный запуск (для тестирования)

```bash
# Установить зависимости
npm install

# Создать .env файл
cat > .env << EOF
SIMILARWEB_EMAIL=your-email@example.com
SIMILARWEB_PASSWORD=your-password
BROWSE_AI_API_KEY=c8d94bb5-9cb7-466a-94dc-e3c21cbfe797:89e5dc61-e88d-456e-abf1-40d7b3993778
BROWSE_AI_ROBOT_ID=019b7e18-760a-73cf-8d7c-237ef5fa0d2a
EOF

# Загрузить переменные и запустить
export $(cat .env | xargs) && npm run refresh
```

## Troubleshooting

### Login failed
- Проверь правильность email и пароля
- Возможно SimilarWeb изменил форму логина - нужно обновить селекторы

### No cookies extracted
- Логин мог не пройти
- Проверь скриншоты в логах (если добавлены)

### Browse.ai API error
- Проверь правильность API ключа
- Проверь правильность Robot ID
