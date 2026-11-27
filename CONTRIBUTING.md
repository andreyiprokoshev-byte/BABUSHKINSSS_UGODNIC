# Гайд для разработки вдвоём (GitHub + Windows `.exe`)

Этот файл создан, чтобы вы с другом могли легко делить задачи, менять геймплей и автоматически получать свежий `.exe` после каждого коммита.

## Структура проекта — где что менять

| Что хотите поменять | Какой файл открывать |
|---|---|
| 3D-мир, бабушки, машины, питбайкер, закладчики, боулинг | `src/components/Village3DView.tsx` |
| Главный цикл игры, HUD, деньги/газява/кирики, события района | `src/App.tsx` |
| Магазин 24/7 (товары, цены, эффекты покупок) | `src/components/ShopModal.tsx` |
| Контора Петровича (сдача закладок, контракты) | `src/components/PetrovichModal.tsx` |
| Мини-игра угощения пирожком | `src/components/LipMinigame.tsx` |
| Пекарня | `src/components/BakeryModal.tsx` |
| Музыка из YouTube | `src/components/YouTubeSoundtrack.tsx` |
| Звуки и русская озвучка | `src/audio/soundEngine.ts` |
| Профили бабушек, фразы, константы | `src/constants.ts`, `src/types.ts` |
| Параметры окна Windows, иконка, название `.exe`, права CSP | `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs` |
| Автосборка `.exe` на GitHub Actions | `.github/workflows/desktop.yml` |

## Как удобно работать вдвоём в GitHub

1. **Перед началом работы** подтяните свежие правки:
   ```bash
   git pull origin main
   bun install --frozen-lockfile
   ```
2. **Создавайте отдельную ветку под фичу** (чтобы не конфликтовать, если правите одновременно):
   ```bash
   git checkout -b feature/new-cars
   ```
3. **Тестируйте локально**:
   - Для быстрых правок UI/3D: `npm run dev` (откроется на `http://localhost:3000`).
   - Для проверки именно в окне Windows: `npm run desktop`.
   - Перед пушем обязательно проверьте типы и сборку:
     ```bash
     npm run lint
     npm run build
     ```
4. **Отправьте ветку и откройте Pull Request**:
   ```bash
   git add .
   git commit -m "Добавил новые тачки"
   git push -u origin feature/new-cars
   ```
5. **Автоматический `.exe` для друга**:
   Как только вы сделаете push в `main` или откроете Pull Request, GitHub Actions сам запустит сборку под Windows (`windows-2025`) и прикрепит готовый `.exe` в разделе **Actions → Desktop EXE Build → Artifacts (`windows-exe-installer`)**. Другу даже не нужно ставить Rust, чтобы протестировать ваш билд!

## Советы, чтобы не ловить конфликты в Git
- Постарайтесь не править одновременно `src/components/Village3DView.tsx` — договаривайтесь, кто сейчас меняет 3D-сцену, а кто делает UI/магазин/звуки.
- Добавляйте зависимости через `bun add` и коммитьте обновлённый `bun.lock`.
- Не коммитьте папки `node_modules/`, `dist/` и `src-tauri/target/` — они уже исключены в `.gitignore`.
