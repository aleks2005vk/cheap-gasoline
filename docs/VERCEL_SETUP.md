# Vercel Setup для cheap-gasoline

## Проблема: Environment Variable "VITE_API_URL" не существует

### Решение в 3 шага:

---

## 1️⃣ Перейти в Vercel Dashboard

```
https://vercel.com/dashboard
```

---

## 2️⃣ Выбрать проект и открыть Settings

1. Нажать на проект **cheap-gasoline**
2. Перейти в **Settings** (в меню сверху)
3. Выбрать **Environment Variables** (слева)

---

## 3️⃣ Добавить переменную VITE_API_URL

Нажать кнопку **Add new** и заполнить:

### Для разработки (Development):

```
Name:         VITE_API_URL
Value:        http://localhost:8001
Environments: ✓ Development
```

### Для production (Production):

```
Name:         VITE_API_URL
Value:        https://your-backend-url.com
Environments: ✓ Production
              ✓ Preview
```

**Примеры Backend URL:**

- Railway: `https://cheap-gasoline-api-production.up.railway.app`
- Render: `https://cheap-gasoline-api.onrender.com`
- Heroku: `https://cheap-gasoline-api.herokuapp.com`
- Собственный сервер: `https://api.yourdomain.com`

---

## 📝 Какие переменные добавить:

| Переменная       | Значение     | Обязательна               |
| ---------------- | ------------ | ------------------------- |
| `VITE_API_URL`   | Backend URL  | ✅ Да                     |
| `VITE_ENV`       | `production` | ⚠️ Опционально            |
| `VITE_MAP_TOKEN` | Mapbox token | ⚠️ Если используешь карты |

---

## ✅ После добавления:

1. Vercel автоматически **перезапустит deployment**
2. Переменные будут доступны во время build
3. Ошибка исчезнет через 2-3 минуты

---

## 🔧 Если backend ещё не развёрнут:

1. Раскомментируй в `src/api/client.js` mock-ответы
2. Или используй mock-сервер для тестирования
3. Позже обновишь `VITE_API_URL` когда backend будет готов

---

## 📱 Проверить на локальной машине:

```bash
# Создай .env файл
cp .env.example .env

# Обнови VITE_API_URL на нужный backend
# VITE_API_URL=http://localhost:8001

# Запусти dev сервер
npm run dev
```

---

## 🚨 Если ошибка остаётся:

1. Очистить Vercel cache:
   - Settings → Deployments → **Clear build cache**
2. Перезапустить deployment:
   - Redeploy
3. Проверить что переменная точно добавлена в нужном окружении
