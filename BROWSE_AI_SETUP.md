# Настройка Browse.ai роботов для SimilarWeb

## Новые ID роботов

| Робот | ID | Назначение |
|-------|-----|------------|
| **Performance** | `019be626-b575-7d4b-a848-beee91c6d7aa` | Трафик по каналам (Direct, Organic, Paid, etc.) |
| **AI Traffic** | `019be633-e05e-757a-aced-1cb415907f85` | Данные AI Traffic |

## Шаблоны URL для роботов

### Performance Robot
```
https://pro.similarweb.com/#/digitalsuite/websiteanalysis/overview/website-performance/*/804/{period}?webSource=Total&key={sites}&qid={queueId}
```

### AI Traffic Robot
```
https://pro.similarweb.com/#/digitalsuite/ai-traffic/overview/*/804/{period}?webSource=Total&key={sites}&qid={queueId}
```

**Параметры:**
- `{period}` — период в формате `YYYY.MM-YYYY.MM` (например: `2024.10-2024.10`)
- `{sites}` — список сайтов через запятую (клиент + конкуренты)
- `{queueId}` — ID записи в очереди для отслеживания

---

## Структура таблицы результатов

**Google Sheets:** `Comparing SimilarWeb` → лист `Результаты`

| Колонка | Тип | Описание | Пример |
|---------|-----|----------|--------|
| `date` | date | Дата сбора данных | 2026-01-22 |
| `period` | string | Период данных (YYYY.MM) | 2024.10 |
| `client_site` | string | Сайт клиента | example.com |
| `competitors_site` | string | Анализируемый сайт | competitor.com |
| `type` | string | Тип записи | client / competitor |
| `Total Visit` | string | Общее количество визитов | 1,234,567 |
| `Direct` | string | Прямой трафик | 234,567 |
| `Organic Search` | string | Органический поиск | 456,789 |
| `Paid Search` | string | Платный поиск | 12,345 |
| `Display Ads` | string | Медийная реклама | 5,678 |
| `Social` | string | Социальные сети | 23,456 |
| `Email` | string | Email маркетинг | 1,234 |
| `AI Traffic` | string | AI трафик | 357 |
| `Task ID` | string | ID задачи Browse.ai | task_xxx |
| `Queue ID` | string | ID записи в очереди | queue_xxx |
| `key` | string | Уникальный ключ | 2024.10_example.com |

**Ключ** (`key`) используется для upsert — обновления существующих записей вместо создания дубликатов.

---

## Форматирование таблицы (рекомендации)

### Заголовки (строка 1)
- Шрифт: **Bold**
- Фон: светло-серый (#f3f3f3)
- Закрепить строку

### Условное форматирование

1. **Колонка "type":**
   - `client` → зеленый фон (#e6f4ea)
   - `competitor` → без фона

2. **Числовые колонки (Total Visit, Direct и т.д.):**
   - Выравнивание: по правому краю
   - Формат: числовой с разделителем тысяч

3. **Колонка "period":**
   - Формат: YYYY.MM

### Ширина колонок
- date: 100px
- period: 80px
- client_site: 150px
- competitors_site: 150px
- type: 80px
- Числовые колонки: 100px

---

## Настройка Webhooks в Browse.ai

### Webhook URLs

| Робот | Webhook URL |
|-------|-------------|
| Performance | `https://n8n.rnd.webpromo.tools/webhook/browse-ai-performance` |
| AI Traffic | `https://n8n.rnd.webpromo.tools/webhook/browse-ai-aitraffic` |

### Инструкция по настройке

1. **Откройте Browse.ai** → ваш робот → **Settings** → **Webhooks**

2. **Добавьте webhook:**
   - Click **"Add Webhook"**
   - URL: вставьте соответствующий URL из таблицы выше
   - Events: выберите **"Task Completed"** (или "Task Finished")
   - Save

3. **Проверьте:**
   - Запустите тестовую задачу
   - Проверьте логи n8n на получение данных

### Формат данных webhook

Browse.ai отправляет POST-запрос с JSON:
```json
{
  "robotId": "019be626-b575-7d4b-a848-beee91c6d7aa",
  "taskId": "...",
  "status": "successful",
  "task": {
    "id": "...",
    "status": "successful",
    "inputParameters": {
      "originUrl": "https://pro.similarweb.com/..."
    },
    "capturedTexts": [
      {"name": "Direct", "newText": "<html>..."},
      {"name": "Organic Search", "newText": "<html>..."},
      ...
    ]
  }
}
```

---

## Обновление cookies

Cookies обновляются автоматически через GitHub Actions каждые 13 дней.

**Репозиторий:** `similarweb-cookie-refresh` (приватный)

**Для ручного обновления:**
1. GitHub → Actions → "Refresh SimilarWeb Cookies"
2. "Run workflow" → "Run workflow"

**ВАЖНО:** Обновите `BROWSE_AI_ROBOT_ID` в секретах репозитория:
```
BROWSE_AI_ROBOT_ID=019be626-b575-7d4b-a848-beee91c6d7aa
```

---

## Проверка работы

1. **Тест Performance робота:**
   ```
   POST https://api.browse.ai/v2/robots/019be626-b575-7d4b-a848-beee91c6d7aa/tasks
   Authorization: Bearer YOUR_API_KEY
   Content-Type: application/json

   {
     "inputParameters": {
       "originUrl": "https://pro.similarweb.com/#/digitalsuite/websiteanalysis/overview/website-performance/*/804/2024.10-2024.10?webSource=Total&key=example.com,competitor1.com&qid=test123"
     }
   }
   ```

2. **Тест AI Traffic робота:**
   ```
   POST https://api.browse.ai/v2/robots/019be633-e05e-757a-aced-1cb415907f85/tasks
   Authorization: Bearer YOUR_API_KEY
   Content-Type: application/json

   {
     "inputParameters": {
       "originUrl": "https://pro.similarweb.com/#/digitalsuite/ai-traffic/overview/*/804/2024.10-2024.10?webSource=Total&key=example.com,competitor1.com&qid=test123"
     }
   }
   ```

---

## Troubleshooting

### Робот не парсит данные
- Проверьте cookies (запустите обновление вручную)
- Проверьте URL — он должен открывать страницу с данными

### Webhook не срабатывает
- Проверьте URL webhook в настройках робота
- Убедитесь, что n8n workflow активен
- Проверьте логи n8n

### Дубликаты в таблице
- Убедитесь, что ключ (`key`) уникален
- Проверьте настройку "Append or Update" в Google Sheets ноде
