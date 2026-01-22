# SimilarWeb Cookie Refresh for Browse.ai

Автоматическое обновление cookies SimilarWeb для робота Browse.ai через GitHub Actions.

## Как это работает

1. GitHub Actions запускается **раз в 13 дней** в 09:00 по Киеву
2. Puppeteer открывает браузер и логинится в SimilarWeb
3. Извлекаются все cookies
4. Cookies отправляются в Browse.ai API для обновления робота
5. Отправляется уведомление в Telegram

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
| `SIMILARWEB_EMAIL` | `fl.mykyta.l@web-promo.com.ua` |
| `SIMILARWEB_PASSWORD` | `k3de-Ress-m3So-TepZ-cm99-Kjf3` |
| `BROWSE_AI_API_KEY` | `c8d94bb5-9cb7-466a-94dc-e3c21cbfe797:89e5dc61-e88d-456e-abf1-40d7b3993778` |
| `BROWSE_AI_ROBOT_ID` | `019b7e18-760a-73cf-8d7c-237ef5fa0d2a` |
| `TELEGRAM_BOT_TOKEN` | `8472185729:AAF3XLXBHftkDxQfqA6yNSVgP5KaawR62cY` |
| `TELEGRAM_CHAT_ID` | `-1003503638426` |

### Шаг 4: Проверить работу

1. Перейди в Actions → "Refresh SimilarWeb Cookies"
2. Нажми "Run workflow" → "Run workflow"
3. Дождись выполнения и проверь логи
4. Ты получишь уведомление в Telegram

## Расписание

Скрипт запускается **раз в 13 дней** в 09:00 по Киеву.

Технически GitHub Actions запускается каждый день, но скрипт проверяет номер дня в году и выполняется только когда `день % 13 == 0`.

### Ручной запуск

Можно запустить вручную в любое время:
1. Actions → "Refresh SimilarWeb Cookies"
2. "Run workflow" → "Run workflow"

## Уведомления в Telegram

После каждого выполнения приходит уведомление:

**Успех:**
```
✅ SimilarWeb Cookie Refresh

🍪 Cookies обновлены успешно!

📊 Обновлено: 15 cookies
🤖 Robot ID: 019b7e18-760a-73cf-8d7c-237ef5fa0d2a
🕐 Время: 22.01.2026, 09:00:00
```

**Ошибка:**
```
❌ SimilarWeb Cookie Refresh

Ошибка обновления cookies!

❗ Login may have failed - still on login page
🕐 Время: 22.01.2026, 09:00:00
```

## Локальный запуск (для тестирования)

```bash
# Установить зависимости
npm install

# Создать .env файл
cat > .env << EOF
SIMILARWEB_EMAIL=fl.mykyta.l@web-promo.com.ua
SIMILARWEB_PASSWORD=k3de-Ress-m3So-TepZ-cm99-Kjf3
BROWSE_AI_API_KEY=c8d94bb5-9cb7-466a-94dc-e3c21cbfe797:89e5dc61-e88d-456e-abf1-40d7b3993778
BROWSE_AI_ROBOT_ID=019b7e18-760a-73cf-8d7c-237ef5fa0d2a
TELEGRAM_BOT_TOKEN=8472185729:AAF3XLXBHftkDxQfqA6yNSVgP5KaawR62cY
TELEGRAM_CHAT_ID=-1003503638426
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

### Telegram notification not received
- Проверь правильность токена бота и chat_id
- Убедись что бот добавлен в чат/группу
