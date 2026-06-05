# CS2 UPGRADE — Полное руководство по настройке

## Структура файлов

```
cs2-upgrade/
├── index.html              ← Главная страница
├── css/
│   └── style.css           ← Все стили
├── js/
│   ├── firebase-config.js  ← Настройки Firebase (РЕДАКТИРОВАТЬ!)
│   ├── auth.js             ← Авторизация
│   ├── db.js               ← Работа с базой данных
│   ├── items.js            ← Предметы и CSFloat API
│   ├── upgrade.js          ← Механика апгрейда + анимация
│   ├── ui.js               ← UI компоненты
│   ├── admin.js            ← Админ-панель
│   └── app.js              ← Главный модуль
└── firebase-rules.json     ← Правила безопасности БД
```

---

## ШАГ 1 — Создать проект Firebase

1. Открыть https://console.firebase.google.com
2. Нажать **"Создать проект"**
3. Название: например `cs2-upgrade`
4. Google Analytics — можно отключить
5. Нажать **"Создать проект"**

---

## ШАГ 2 — Настроить Authentication

1. В боковом меню: **Build → Authentication**
2. Нажать **"Get started"**
3. Во вкладке **Sign-in method** → Email/Password → Включить
4. Сохранить

---

## ШАГ 3 — Создать Realtime Database

1. В боковом меню: **Build → Realtime Database**
2. Нажать **"Create Database"**
3. Регион: выбрать ближайший (например `europe-west1`)
4. Режим: **Start in test mode** (потом обновим правила)
5. Нажать **"Enable"**

---

## ШАГ 4 — Получить конфиг Firebase

1. В боковом меню: нажать на шестерёнку ⚙️ → **Project settings**
2. Прокрутить вниз до **"Your apps"**
3. Нажать иконку **</>** (Web app)
4. Придумать название (например `cs2-upgrade-web`)
5. **НЕ ставить** галочку Firebase Hosting
6. Нажать **"Register app"**
7. Скопировать объект `firebaseConfig`

---

## ШАГ 5 — Вставить конфиг в код

Открыть файл `js/firebase-config.js` и заменить:

```javascript
const firebaseConfig = {
  apiKey: "ВСТАВИТЬ СЮДА",
  authDomain: "ВСТАВИТЬ СЮДА",
  databaseURL: "ВСТАВИТЬ СЮДА",
  projectId: "ВСТАВИТЬ СЮДА",
  storageBucket: "ВСТАВИТЬ СЮДА",
  messagingSenderId: "ВСТАВИТЬ СЮДА",
  appId: "ВСТАВИТЬ СЮДА"
};
```

---

## ШАГ 6 — Настроить правила безопасности БД

1. В Firebase Console: **Realtime Database → Rules**
2. Вставить содержимое файла `firebase-rules.json`
3. Нажать **"Publish"**

---

## ШАГ 7 — Создать аккаунт администратора

1. Запустить сайт локально (см. ШАГ 9)
2. Зарегистрировать первый аккаунт (это будет admin)
3. В Firebase Console: **Authentication → Users**
4. Найти свой email, скопировать **UID** (длинная строка типа `abc123...`)
5. Открыть `js/firebase-config.js`, найти:
```javascript
export const ADMIN_UIDS = [
  "ADMIN_UID_1",
];
```
6. Заменить `ADMIN_UID_1` на скопированный UID
7. Сохранить файл

---

## ШАГ 8 — Выложить на GitHub Pages

### 8.1 Создать репозиторий

1. Открыть https://github.com
2. Нажать **"New repository"** (зелёная кнопка)
3. Repository name: `cs2-upgrade`
4. Public (обязательно для бесплатного Pages)
5. Нажать **"Create repository"**

### 8.2 Загрузить файлы

**Способ 1 — через браузер (проще):**
1. В репозитории нажать **"Add file → Upload files"**
2. Перетащить все файлы проекта
3. Нажать **"Commit changes"**

**Способ 2 — через Git (правильнее):**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИКИ/cs2-upgrade.git
git push -u origin main
```

### 8.3 Включить GitHub Pages

1. В репозитории: **Settings** (вверху)
2. В боковом меню: **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Нажать **"Save"**
6. Через 1-2 минуты сайт будет доступен по адресу:
   `https://ВАШ_НИКИ.github.io/cs2-upgrade`

---

## ШАГ 9 — Запуск локально (для разработки)

Так как проект использует ES modules (`import/export`), нужен локальный сервер:

**Вариант 1 — VS Code + расширение:**
- Установить расширение **"Live Server"**
- Открыть `index.html` → правая кнопка → **"Open with Live Server"**

**Вариант 2 — Python:**
```bash
python -m http.server 8000
# Открыть http://localhost:8000
```

**Вариант 3 — Node.js:**
```bash
npx serve .
```

---

## ШАГ 10 — Добавить разрешённые домены в Firebase

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Нажать **"Add domain"**
3. Добавить: `ВАШ_НИКИ.github.io`
4. Сохранить

---

## Использование

### Как выдать баланс пользователю
1. Войти под аккаунтом администратора
2. Перейти в раздел **АДМИН** в боковом меню
3. Нажать **"Загрузить"** для списка пользователей
4. Найти нужного пользователя → **"💰 Баланс"**
5. Ввести сумму → **"ПОПОЛНИТЬ"**

### Как выдать предмет пользователю
Через Firebase Console:
1. **Realtime Database**
2. Найти `users → [uid] → inventory`
3. Нажать **"+"** и добавить объект:
```json
{
  "name": "AK-47 | Redline",
  "price": 15.20,
  "rarity": "Classified",
  "weapon": "AK-47",
  "image": "URL_ИЗОБРАЖЕНИЯ",
  "addedAt": 1700000000000
}
```

### Как добавить больше предметов
Открыть `js/items.js`, найти массив `MOCK_ITEMS` и добавить новые объекты.

---

## CSFloat API (реальная интеграция)

Для подключения реального CSFloat API:

1. Зарегистрироваться на https://csfloat.com
2. Получить API ключ в настройках
3. Так как браузер не может обращаться напрямую к API (CORS), нужен прокси.

**Вариант 1 — Firebase Functions:**
```javascript
// functions/index.js
const functions = require("firebase-functions");
const axios = require("axios");

exports.getCSFloatItems = functions.https.onCall(async (data, context) => {
  const response = await axios.get("https://csfloat.com/api/v1/listings", {
    headers: { "Authorization": "ВАШ_API_КЛЮЧ" }
  });
  return response.data;
});
```

**Вариант 2 — Собственный backend** (Node.js/Express на хостинге)

---

## Безопасность (важно!)

⚠️ В текущей реализации результат апгрейда определяется на клиенте.
Для продакшена необходимо перенести логику в **Firebase Functions**:

```javascript
// functions/index.js
exports.processUpgrade = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error("Unauthorized");
  
  const { sourceItemKey, targetItem, chancePercent } = data;
  const uid = context.auth.uid;
  
  // Проверяем предмет в БД
  // Генерируем roll на сервере
  const roll = Math.random() * 100;
  const won = roll < chancePercent;
  
  // Записываем результат
  // ...
  
  return { won };
});
```

---

## Часто задаваемые вопросы

**Q: Сайт не открывается после деплоя на GitHub Pages**
A: Подождите 2-5 минут. Также убедитесь что `index.html` в корне репозитория.

**Q: Ошибка "Firebase: Error (auth/...)"**
A: Проверьте что домен github.io добавлен в Authorized Domains Firebase.

**Q: Баланс не меняется**
A: Убедитесь что ваш UID добавлен в ADMIN_UIDS в firebase-config.js.

**Q: CORS ошибки при загрузке изображений**
A: Это нормально, изображения Steam могут блокироваться. Добавьте `onerror` обработчики (уже реализованы).
