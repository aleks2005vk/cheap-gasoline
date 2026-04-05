# 🚀 Cheap Gasoline - Development Roadmap v1.5

**Последний обновлен:** 12 февраля 2026  
**Текущий статус:** Фаза v1.0 + v1.5 активна  
**Версия API:** 1.5

---

## 📊 Статус Проекта

### ✅ ЗАВЕРШЕНО (v1.0 + v1.5)

#### Backend (FastAPI)

- [x] **Обновленные модели SQLModel**
  - `User` с ролями (guest/user/moderator/admin), системой кармы
  - `UserProfile` с предпочтениями
  - `ContributionHistory` для отслеживания вкладов
  - `PriceConfirmation` для системы голосования
  - `FlaggedPrice` для модерации
  - `PriceHistory` для графиков (v1.5)
  - `Achievement` + `UserAchievement` для геймификации (v1.5)

- [x] **Модуль auth.py**
  - JWT токены (access 15min / refresh 7d)
  - Хеширование паролей через bcrypt
  - Проверка разрешений по ролям (RBAC)
  - Базовый Rate Limiter

- [x] **Новые API Endpoints (v1.0)**
  - `POST /api/auth/register` - регистрация с JWT
  - `POST /api/auth/login` - вход с JWT
  - `POST /api/auth/refresh` - обновление токена
  - `GET /api/user/profile` - профиль с кармой
  - `GET /api/user/contributions` - история вкладов пользователя
  - `POST /api/price/update` - обновление цены с логированием

- [x] **Умные фичи (v1.5)**
  - `POST /api/station/best-price` - поиск дешевой заправки в радиусе
    - Расчет Haversine расстояния
    - Фильтр "корона" для лучшей цены
    - Список ТОП-5 близких АЗС
  - `GET /api/station/{id}/price-history/{fuel}` - график цены за месяц
    - Ежедневные min/max/avg цены
    - Данные для построения линейного графика

- [x] **Админ-панель**
  - `GET /api/admin/moderation/recent` - список для модерации
  - Проверка на подозрительные признаки:
    - Цена < 10 руб (impossibly_low)
    - Спам (>10 обновлений в час)

- [x] **Безопасность v1.0**
  - JWT с refresh токеном
  - Rate Limiting (10 запросов/минуту)
  - Пример валидации Pydantic
  - Логирование всех действий (AuditLog)

#### Frontend (React + Redux)

- [x] **Обновленный apiSlice.js**
  - Автоматическая передача JWT в заголовках
  - Логика автоматического refresh токена при 401
  - RTK Query с кэшированием
  - Tag-based invalidation (Station, User, Profile, History)

- [x] **Новый authSlice.js**
  - Сохранение access/refresh токенов в Redux
  - Сохранение в localStorage для персистентности
  - Экшены logout, setUser, clearError
  - Extra reducers для интеграции с apiSlice

- [x] **priceService.js - Оптимистичное обновление**
  - `optimisticUpdatePrice()` - мгновенное обновление UI
  - `validatePrice()` - локальная валидация перед отправкой
  - `cachePrice()` - кэширование в localStorage
  - `calculatePriceChange()` - процент изменения
  - `formatPrice()` - форматирование для отображения
  - `getPriceColor()` - визуальный указатель цены
  - `syncPendingPrices()` - синхронизация при возврате интернета

#### Обновленные зависимости

- [x] **Backend requirements.txt**
  - FastAPI 0.104.1
  - SQLModel 0.0.14
  - PyJWT 2.8.1 (JWT токены)
  - bcrypt 4.1.2+ (хеширование паролей)
  - python-jose (OAuth поддержка)

---

## ⚙️ Архитектура

### Database Schema (SQLModel)

```
User (с ролями и кармой)
├── UserProfile (предпочтения)
├── ContributionHistory (вклады)
└── UserAchievement

Station
├── PriceUpdate (текущие цены)
└── PriceHistory (исторические данные)

RolePermission (справочник ролей)
AuditLog (логирование)
```

### API Структура

```
/api/auth/
  ├── register       [POST]   - Регистрация
  ├── login          [POST]   - Вход
  └── refresh        [POST]   - Обновить токен

/api/user/
  ├── profile        [GET]    - Получить профиль
  ├── profile        [PUT]    - Обновить профиль
  └── contributions  [GET]    - История вкладов

/api/price/
  ├── update         [POST]   - Обновить цену
  └── confirm        [POST]   - Подтвердить цену

/api/station/
  ├── [GET]          - Все АЗС
  ├── {id}           [GET]    - Деталь АЗС
  ├── best-price     [POST]   - Найти дешевую
  └── {id}/price-history/{fuel_type} [GET] - График

/api/admin/
  └── moderation/recent [GET] - Для модерации
```

### Frontend State

```
Redux Store
├── auth
│   ├── accessToken
│   ├── refreshToken
│   ├── user
│   ├── isAuthenticated
│   └── error
└── api (RTK Query)
    ├── getStations
    ├── getProfile
    ├── updatePrice (оптимистичное)
    └── ...
```

---

## 🎯 Использование Backend API

### 1. Регистрация

```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "name": "John"
  }'

# Ответ:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### 2. Вход

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### 3. Обновить цену (требует токена)

```bash
curl -X POST http://localhost:8001/api/price/update \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station_id": 1,
    "fuel_type": "95",
    "price": 145.50
  }'
```

### 4. Найти дешевую заправку

```bash
curl -X POST http://localhost:8001/api/station/best-price \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 41.7151,
    "longitude": 44.8271,
    "radius_km": 5,
    "fuel_type": "95"
  }'

# Ответ:
{
  "fuel_type": "95",
  "best_station": {
    "id": 123,
    "name": "АЗС Лукойл",
    "price": 142.50,
    "distance_km": 2.3,
    "crown": "👑"
  },
  "nearby": [...]
}
```

### 5. График цены за месяц

```bash
curl http://localhost:8001/api/station/1/price-history/95

# Ответ:
{
  "dates": ["2026-01-12", "2026-01-13", ...],
  "avg": [145.0, 146.5, ...],
  "min": [144.0, 145.5, ...],
  "max": [146.0, 147.5, ...]
}
```

---

## 🎨 Использование Frontend API

### 1. Логин в React

```jsx
import { useLoginMutation } from "app/api/apiSlice";
import { useDispatch } from "react-redux";
import { setTokens } from "app/api/authSlice";

function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const handleLogin = async (email, password) => {
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(
        setTokens({
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={(e) =>
        handleLogin(e.target.email.value, e.target.password.value)
      }
    >
      {/* form fields */}
    </form>
  );
}
```

### 2. Оптимистичное обновление цены

```jsx
import { useUpdatePriceMutation } from "app/api/apiSlice";
import { optimisticUpdatePrice, validatePrice } from "app/api/priceService";
import { useDispatch } from "react-redux";

function PriceInput({ stationId, fuelType }) {
  const [updatePrice, { isLoading }] = useUpdatePriceMutation();
  const dispatch = useDispatch();
  const [price, setPrice] = useState("");

  const handleSubmit = async () => {
    // Валидация
    const errors = validatePrice(parseFloat(price), fuelType);
    if (errors.length > 0) {
      console.error(errors);
      return;
    }

    // Оптимистично обновить UI
    const rollback = optimisticUpdatePrice(
      stationId,
      fuelType,
      parseFloat(price),
      dispatch,
    );

    try {
      await updatePrice({
        station_id: stationId,
        fuel_type: fuelType,
        price: parseFloat(price),
      }).unwrap();

      // Кэшировать цену
      cachePrice(stationId, fuelType, parseFloat(price));
    } catch (error) {
      // Откатить если ошибка
      rollback.undo();
      console.error(error);
    }
  };

  return (
    <input
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
    />
  );
}
```

### 3. Поиск дешевой заправки

```jsx
import { useGetBestPriceQuery } from "app/api/apiSlice";

function BestPriceFinder() {
  const [location, setLocation] = useState(null);

  const { data: bestPrice, isLoading } = useGetBestPriceQuery(
    {
      latitude: location?.lat,
      longitude: location?.lng,
      radius_km: 5,
      fuel_type: "95",
    },
    { skip: !location },
  );

  return (
    <div>
      {bestPrice?.best_station && (
        <div className="best-price-card">
          <span className="crown">{bestPrice.best_station.crown}</span>
          <h3>{bestPrice.best_station.name}</h3>
          <p>₽ {bestPrice.best_station.price}</p>
          <p>📍 {bestPrice.best_station.distance_km} км</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔐 Безопасность

### JWT Токены

- **Access Token**: 15 минут (для запросов)
- **Refresh Token**: 7 дней (для получения нового access)
- **Алгоритм**: HS256
- **Хранение на фронте**: localStorage

### Пароли

- **Алгоритм**: bcrypt
- **Rounds**: стандартные (обычно 12)

### Rate Limiting

- **10 обновлений/минуту** на IP адрес
- **429 Too Many Requests** при превышении

### CORS

- Разрешены запросы с любых источников (для тестирования)
- В продакшене ограничить на домен

---

## 📋 Что осталось сделать

### v2.0 (4 недели) - Геймификация и Модерация

- [ ] Система достижений (Скаут, Честный заправщик, Историк цен)
- [ ] Push-уведомления о дешевых ценах
- [ ] Dashboard админа для полной модерации
- [ ] Ban система с логированием

### v2.5 (2 недели) - OCR и Mobile

- [ ] OCR для распознавания цены со стелы заправки
- [ ] Нейросеть (Tesseract.js)
- [ ] API для мобильного приложения

### v3.0 (3 недели) - Аналитика

- [ ] Dashboard с графиками по городам
- [ ] Реферальная система
- [ ] Экспорт данных для исследователей

---

## 🛠️ Локальная разработка

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Запустить
python -m uvicorn main:app --reload --port 8001
```

### Frontend Setup

```bash
npm install
npm run dev
```

### Переменные окружения

**backend/.env**

```
SECRET_KEY=your-very-secret-key-change-in-prod
DATABASE_URL=sqlite:///cheap_gasoline.db
PORT=8001
```

**frontend/.env**

```
VITE_API_URL=http://localhost:8001
```

---

## 📈 Метрики и KPI

### Текущие метрики (v1.5)

- ✅ JWT авторизация (100% покрытие)
- ✅ Система кармы (прототип)
- ✅ Best-price алгоритм (работает)
- ✅ Price-history графики (готово)

### Target метрики для v3.0

- 1000+ зарегистрированных пользователей
- 10000+ АЗС в базе
- 50000+ обновлений цен в месяц
- 99.9% uptime

---

## 🚀 Развертывание

### Vercel (Frontend)

```bash
# package.json scripts уже настроены
npm run build
# Залить на Vercel
```

### Render/Railway (Backend)

```bash
git push  # Автодеплой при каждом push
```

---

## 📞 Контакты

- **API Documentation**: http://localhost:8001/docs (Swagger)
- **GitHub Issues**: используй для багов
- **Email**: admin@cheapgasoline.local

---

## 📝 Changelog

### v1.5 (текущая)

- ✅ JWT токены с refresh логикой
- ✅ RBAC по ролям (guest/user/moderator/admin)
- ✅ Best-price finder с расчетом расстояния
- ✅ Price history для графиков
- ✅ Оптимистичные обновления на фронте
- ✅ Rate limiting базовый

### v1.0

- ✅ Базовая карта с АЗС
- ✅ Обновление цен пользователями
- ✅ OCR для фото заправок

---

**Последний обновлено:** 12 февраля 2026, 10:30 UTC
