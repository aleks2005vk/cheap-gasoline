# Firebase Role Manager

Утилита для управления ролями пользователей через Firebase Custom Claims.

## Использование

### Показать всех пользователей

```bash
python set_role.py list
```

### Проверить роль пользователя

```bash
python set_role.py get <firebase_uid>
```

### Назначить роль пользователю

```bash
python set_role.py set <firebase_uid> <role>
```

## Доступные роли

- `admin` - Полный доступ, управление пользователями
- `moderator` - Модерация цен, одобрение изменений
- `station_owner` - Управление своей АЗС
- `user` - Обычный пользователь (по умолчанию)
- `guest` - Только просмотр

## Примеры

```bash
# Назначить админа
python set_role.py set abc123def456 admin

# Проверить роль
python set_role.py get abc123def456

# Сделать модератора
python set_role.py set def789ghi012 moderator

# Показать всех пользователей
python set_role.py list
```

## Как найти Firebase UID

1. Откройте [Firebase Console](https://console.firebase.google.com)
2. Перейдите в **Authentication** → **Users**
3. Нажмите на нужного пользователя
4. Скопируйте **UID** из поля "User UID"

## Требования

- Python 3.7+
- Файл `firebase-service-account.json` в папке `backend/`
- Правильные права сервисного аккаунта Firebase
