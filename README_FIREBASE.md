# Настройка Firebase Auth

## ✅ Готово!

- Firebase ключ скопирован в `backend/firebase-service-account.json`
- Бэкенд настроен на Firebase Auth
- Фронтенд обновлен для использования Firebase SDK
- Установлены зависимости

## Тестирование

1. Запустите бэкенд: `python backend/main.py`
2. Запустите фронтенд: `npm run dev`
3. Зарегистрируйтесь через форму регистрации — пользователь создастся в Firebase и локальной БД
4. Войдите — получите ID token для API

## Если проблемы

- Проверьте Firebase Console: Authentication включен
- Ключ в `backend/` не в git
- Для миграции старых пользователей: `python backend/migrate_to_firebase.py` (после настройки)
