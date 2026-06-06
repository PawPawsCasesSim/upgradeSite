# CS2UPGRADE

Готовый статический сайт для Firebase Hosting + Realtime Database без CSFloat и без Blaze.

## Что внутри

- Синий дизайн под аватарку CS2UPGRADE.
- Локальный каталог `data/cs2-skins.json` со всеми скинами из архива `csapi-main.zip`.
- Цены генерируются внутри проекта, API-ключи не нужны.
- Реальный онлайн через Firebase Realtime Database `presence`.
- LIVE-DROPS последних успешных апгрейдов.
- Колесо не крутится, крутится только стрелка.
- Синий сектор колеса соответствует реальному шансу успеха.
- Кнопки `x2`, `x4`, `x8`, `35%`, `55%`, `75%` автоматически подбирают целевой скин под выбранный шанс.
- Продажа одного скина и продажа всех скинов в профиле за 100% цены.

## Деплой

```bash
firebase deploy --only hosting,database
```

## Важно

Перед деплоем проверь `js/firebase-config.js` и вставь свой Firebase config.
Правила базы находятся в `firebase-rules.json`.

## v11 changes

- Arrow spin slowed down to 8-11 seconds.
- Shop supports buying multiple copies of the selected skin at once using the quantity input near the Buy button.
- Upgrade supports selecting up to 5 inventory items at once. Their prices are summed and used as the total upgrade stake.
- Target skins are filtered by the total selected stake, so the target must still be more expensive and the chance stays capped at 75%.
