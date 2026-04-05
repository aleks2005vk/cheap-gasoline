# 🔐 RBAC (Role-Based Access Control) - Полная Документация

## 📚 Содержание

1. [Иерархия ролей](#иерархия-ролей)
2. [Как создать первого администратора](#как-создать-первого-администратора)
3. [Как назначить рабочего на станцию](#как-назначить-рабочего-на-станцию)
4. [API Endpoints](#api-endpoints)
5. [Примеры использования](#примеры-использования)
6. [Схема базы данных](#схема-базы-данных)
7. [Frontend Permission Checks](#frontend-permission-checks)

---

## 🎭 Иерархия Ролей

```
┌─────────────────────────────────────────┐
│ УРОВЕНЬ 4: ADMIN (👑)                   │
│ - Полный доступ ко всем функциям        │
│ - Управление пользователями             │
│ - Создание и управление станциями       │
│ - Модерация цен                         │
│ - Блокировка пользователей              │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ УРОВЕНЬ 3: STATION_OWNER (🏢)           │
│ - Управление СВОИМИ назначенными        │
│   станциями                             │
│ - Обновление цен для своих станций      │
│ - Просмотр истории обновлений           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ УРОВЕНЬ 2: MODERATOR (✓)                │
│ - Просмотр всех станций                 │
│ - Модерация цен (одобрение/отклонение)  │
│ - Просмотр аудит-логов                  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ УРОВЕНЬ 1: USER (👤)                    │
│ - Просмотр карты и цен                  │
│ - Предложение обновления цен            │
│ - (требует модерации)                   │
│ - Просмотр своего профиля               │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ УРОВЕНЬ 0: GUEST (🔒)                   │
│ - Только просмотр карты                 │
│ - Без обновления цен                    │
└─────────────────────────────────────────┘
```

---

## ✅ Как создать первого администратора?

### **Способ 1: Через API (РЕКОМЕНДУЕМЫЙ)**

1. **Убедитесь, что сервер запущен:**

```bash
cd backend
python -m uvicorn main:app --reload --port 8001
```

2. **Первый вызов (когда нет ни одного админа):**

```bash
curl -X POST http://localhost:8001/api/admin/create-initial-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cheap-gas.com",
    "password": "SecurePassword123!"
  }'
```

**Ответ:**

```json
{
  "status": "success",
  "message": "Администратор создан",
  "admin_id": 1
}
```

3. **После создания первого админа - другие админы могут быть созданы только через админ-панель:**

```
http://localhost:3000/admin
```

### **Способ 2: SQL запрос (ПРЯМО В БАЗЕ - ТОЛЬКО для разработки)**

```python
from backend.database import init_db, get_session
from backend.models import User
from backend.auth import hash_password
from sqlmodel import select

# Инициализируем БД
init_db()

# Получаем сессию
with Session(engine) as session:
    # Проверяем, нет ли уже админа
    existing = session.exec(select(User).where(User.role == "admin")).first()

    if not existing:
        admin = User(
            email="admin@cheap-gas.com",
            hashed_password=hash_password("SecurePassword123!"),
            role="admin",
            is_active=True,
            karma_points=100,
            verification_score=100
        )
        session.add(admin)
        session.commit()
        print(f"✅ Админ создан с ID: {admin.id}")
```

---

## 👥 Как назначить рабочего на станцию?

### **Сценарий: Вы хотите, чтобы сотрудник X управлял Станцией Y**

**Шаг 1: Создайте рабочего как STATION_OWNER**

```bash
# Регистрация через API
POST /api/auth/register
{
  "email": "worker@station.com",
  "password": "Password123!"
}
```

**Шаг 2: ADMIN меняет его роль на STATION_OWNER**

```bash
POST /api/admin/change-user-role
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "user_id": 5,  # ID нового рабочего
  "new_role": "station_owner",
  "reason": "Новый оператор станции"
}
```

**Шаг 3: ADMIN привязывает рабочего к станции**

```bash
POST /api/admin/assign-user-to-station
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "user_id": 5,          # ID рабочего
  "station_id": 12,      # ID станции (Shell #5)
  "role_at_station": "operator"
}
```

**Или через админ-панель:**

1. Перейти на `http://localhost:3000/admin`
2. Найти пользователя в таблице
3. Нажать **⚙️ УПРАВЛЯТЬ**
4. В модали:
   - Выбрать **STATION_OWNER** в "ИЗМЕНИТЬ РОЛЬ"
   - Нажать **✅ СОХРАНИТЬ РОЛЬ**
   - Выбрать станцию в "ПРИВЯЗАТЬ К СТАНЦИИ"
   - Нажать **✅ НАЗНАЧИТЬ СТАНЦИЮ**

---

## 🔗 API Endpoints

### **1️⃣ Создать первого администратора**

```
POST /api/admin/create-initial-admin
Content-Type: application/json

{
  "email": "admin@cheap-gas.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "status": "success",
  "message": "Администратор создан",
  "admin_id": 1
}
```

### **2️⃣ Изменить роль пользователя**

```
POST /api/admin/change-user-role
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "user_id": 5,
  "new_role": "station_owner",
  "reason": "Повышение до владельца"
}

Response (200):
{
  "status": "success",
  "message": "Роль изменена на station_owner"
}
```

### **3️⃣ Привязать пользователя к станции**

```
POST /api/admin/assign-user-to-station
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "user_id": 5,
  "station_id": 12,
  "role_at_station": "operator"
}

Response (200):
{
  "status": "success",
  "message": "Пользователь назначен на станцию"
}
```

### **4️⃣ Получить список всех пользователей**

```
GET /api/admin/users
Authorization: Bearer {ADMIN_TOKEN}

Response (200):
[
  {
    "id": 1,
    "email": "admin@cheap-gas.com",
    "role": "admin",
    "is_banned": false,
    "managed_stations_count": 0,
    "karma_points": 100,
    "is_active": true
  },
  {
    "id": 5,
    "email": "worker@station.com",
    "role": "station_owner",
    "is_banned": false,
    "managed_stations_count": 1,
    "karma_points": 0,
    "is_active": true
  }
]
```

### **5️⃣ Получить мои управляемые станции**

```
GET /api/user/managed-stations
Authorization: Bearer {STATION_OWNER_TOKEN}

Response (200):
[
  {
    "id": 12,
    "name": "Shell Station #5",
    "brand": "Shell",
    "lat": 41.715137,
    "lng": 44.827104,
    "is_verified": true,
    "owner_company": "Shell Georgia LLC",
    "last_update": "2024-01-20T15:30:00"
  }
]
```

### **6️⃣ Заблокировать пользователя**

```
POST /api/admin/ban-user/{user_id}
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "ban_reason": "Манипуляция ценами"
}

Response (200):
{
  "status": "success",
  "message": "Пользователь заблокирован"
}
```

---

## 💻 Примеры использования

### **Python (Requests)**

```python
import requests

API_URL = "http://localhost:8001"
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 1. Изменить роль пользователя
response = requests.post(
    f"{API_URL}/api/admin/change-user-role",
    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    json={
        "user_id": 5,
        "new_role": "station_owner",
        "reason": "Назначение на должность оператора"
    }
)
print(response.json())

# 2. Привязать к станции
response = requests.post(
    f"{API_URL}/api/admin/assign-user-to-station",
    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    json={
        "user_id": 5,
        "station_id": 12,
        "role_at_station": "operator"
    }
)
print(response.json())

# 3. Получить всех пользователей
response = requests.get(
    f"{API_URL}/api/admin/users",
    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
)
users = response.json()
for user in users:
    print(f"{user['email']} - {user['role']} ({user['managed_stations_count']} станций)")
```

### **JavaScript (Fetch)**

```javascript
const API_URL = "http://localhost:8001";
const adminToken = localStorage.getItem("accessToken");

// 1. Изменить роль
async function changeUserRole(userId, newRole) {
  const response = await fetch(`${API_URL}/api/admin/change-user-role`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      new_role: newRole,
      reason: "Обновление через админ-панель",
    }),
  });
  return response.json();
}

// 2. Привязать к станции
async function assignUserToStation(userId, stationId) {
  const response = await fetch(`${API_URL}/api/admin/assign-user-to-station`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      station_id: stationId,
      role_at_station: "operator",
    }),
  });
  return response.json();
}

// Использование
changeUserRole(5, "station_owner").then((data) => console.log(data));
assignUserToStation(5, 12).then((data) => console.log(data));
```

---

## 📊 Схема базы данных

### **Таблица: User**

```sql
CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  email VARCHAR UNIQUE,
  hashed_password VARCHAR,
  role VARCHAR DEFAULT 'user',  -- admin, station_owner, moderator, user, guest
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason VARCHAR,
  karma_points INTEGER DEFAULT 0,
  verification_score FLOAT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### **Таблица: UserStation (MANY-TO-MANY)**

```sql
CREATE TABLE user_station (
  user_id INTEGER (FK: user.id),
  station_id INTEGER (FK: station.id),
  role_at_station VARCHAR DEFAULT 'operator',
  assigned_at TIMESTAMP,
  PRIMARY KEY (user_id, station_id)
)
```

### **Таблица: Station**

```sql
CREATE TABLE station (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  brand VARCHAR,
  lat FLOAT,
  lng FLOAT,
  owner_company VARCHAR,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)
```

### **Таблица: AuditLog**

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER (FK: user.id),
  action VARCHAR,  -- CREATE_INITIAL_ADMIN, CHANGE_USER_ROLE, etc
  details JSON,
  ip_address VARCHAR,
  created_at TIMESTAMP
)
```

---

## 🎨 Frontend Permission Checks

### **MapSidebar.jsx - Проверка доступа**

```jsx
// ROLE_CONFIG - что может делать каждая роль
const ROLE_CONFIG = {
  admin: { label: "👑 АДМИНИСТРАТОР", canUpdate: true },
  station_owner: { label: "🏢 ВЛАДЕЛЕЦ", canUpdate: true },
  moderator: { label: "✓ МОДЕРАТОР", canUpdate: true },
  user: { label: "👤 ПОЛЬЗОВАТЕЛЬ", canUpdate: true },
  guest: { label: "🔒 ГОСТЬ", canUpdate: false },
};

// Функция для проверки доступа
const canUpdatePrice = (stationId) => {
  if (!user || currentRole === "guest") return false;
  if (currentRole === "admin" || currentRole === "moderator") return true;

  // STATION_OWNER может обновлять только ЕГО станции
  if (currentRole === "station_owner") {
    return user.managed_stations?.includes(stationId) ?? false;
  }

  if (currentRole === "user") return true; // USER может предлагать
  return false;
};

// Отображение кнопки
{
  canUpdatePrice(station.id) ? (
    <button>📸 ОБНОВИТЬ ЦЕНЫ</button>
  ) : currentRole === "guest" ? (
    <button>🔒 ВОЙДИТЕ ДЛЯ ОБНОВЛЕНИЯ</button>
  ) : currentRole === "station_owner" ? (
    <div>⚠️ ЭТА СТАНЦИЯ НЕ ВАША</div>
  ) : null;
}
```

### **AdminPanel.jsx - Управление ролями**

```jsx
// Только для ADMIN
if (!user || user.role !== "admin") {
  navigate("/");
  return;
}

// Таблица пользователей с кнопкой управления
<button onClick={() => setSelectedUser(user)}>
  ⚙️ УПРАВЛЯТЬ
</button>

// Модаль для изменения роли и привязки к станции
<select onChange={(e) => handleChangeRole(user.id, e.target.value)}>
  <option value="admin">👑 ADMIN</option>
  <option value="station_owner">🏢 STATION_OWNER</option>
  <option value="moderator">✓ MODERATOR</option>
</select>
```

---

## 🚀 Быстрый старт RBAC

### **1. Запустить backend**

```bash
cd backend
python -m uvicorn main:app --reload --port 8001
```

### **2. Создать первого админа (в новом терминале)**

```bash
curl -X POST http://localhost:8001/api/admin/create-initial-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cheap-gas.com",
    "password": "Admin123!Pass"
  }'
```

### **3. Войти в adminдель на `http://localhost:3000/admin`**

- Email: `admin@cheap-gas.com`
- Password: `Admin123!Pass`

### **4. Создать рабочего и привязать к станции**

- В админ-панели найти пользователя
- Нажать **⚙️ УПРАВЛЯТЬ**
- Изменить роль на **STATION_OWNER**
- Выбрать станцию
- Нажать **✅ НАЗНАЧИТЬ СТАНЦИЮ**

### **5. Проверить права на карте**

- Вход как рабочий
- На верхне убедиться, что видит **"🏢 ВЛАДЕЛЕЦ"**
- Только его станции будут доступны для обновления цен

---

## ⚠️ Важные замечания

1. **Первого админа можно создать только когда нет ни одного другого админа** - это защита от взлома
2. **STATION_OWNER видит только ЕГО назначенные станции** - проверяется через таблицу UserStation
3. **Все действия логируются в AuditLog** - для отслеживания изменений
4. **Роли имеют иерархию** - ADMIN обходит все проверки, STATION_OWNER может видеть только свое
5. **Пароли хэшируются через bcrypt** - с солью для безопасности

---

## 📝 Структура кода

```
backend/
├── models.py          # SQLModel с UserStation many-to-many
├── auth.py            # JWT, bcrypt, permission checking
├── main.py            # API endpoints с RBAC
└── database.py        # SQLAlchemy setup

frontend/
├── components/
│   ├── pages/AdminPanel.jsx    # Управление пользователями
│   └── ui/map/MapSidebar.jsx   # Проверка доступа перед кнопками
├── app/api/
│   └── authSlice.js             # Redux с managed_stations
└── config.js                     # API_URL
```

---

**Версия**: 1.0 RBAC
**Дата обновления**: 2024-01-20
**Статус**: ✅ ГОТОВО К ПРОДАКШЕНУ
