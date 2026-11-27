# Пирожковый Двор 3D

Настольная версия игры для Windows и Linux x86-64. Rust и Tauri запускают
оригинальный интерфейс и 3D-мир на React и Three.js. Ресурсы и шрифты входят в
сборку. Для запуска игры нужны системный WebView с WebGL 2 и рабочий
графический драйвер. Озвучка зависит от доступных в системе голосов.

## Установка

- **Windows 10/11 x64.** Запустите `Pirozhkovy Dvor 3D_…-setup.exe`.
  Если WebView2 отсутствует, установщик загрузит его с серверов Microsoft.
- **Ubuntu 24.04+, Debian 13+ x86-64.** Установите пакет командой
  `sudo apt install ./Pirozhkovy*.deb` и откройте игру из меню приложений.
- **Другие дистрибутивы Linux x86-64.** Распакуйте архив с программой и
  запустите `./pirozhkovy-dvor`. Нужны glibc 2.39+, GTK 3 и WebKitGTK 4.1.

## Сборка

Установите [Rust](https://rustup.rs/) (от 1.90), [Bun](https://bun.sh/) 1.4.5,
Node.js 24 и [системные зависимости Tauri](https://v2.tauri.app/start/prerequisites/).
Python 3 нужен для автоматической проверки запуска.

```sh
bun install --frozen-lockfile
bun run lint
bun run desktop
```

Linux: `bun run desktop:build --bundles deb -- --locked`.
Windows: `bun run desktop:build --bundles nsis -- --locked`.
Готовые установщики лежат в `src-tauri/target/release/bundle/`.
Веб-режим доступен через `bun run dev`.

## Проверка сборки

`python scripts/smoke_desktop.py <путь-к-исполняемому-файлу>` открывает окно и
проверяет локальные изображения, выключатель звука, отрисовку 3D-сцены,
паузу, завершение свободной игры и запуск смены с таймером.
Для проверки нужна графическая сессия. GitHub Actions выполняет сценарий
на Linux и Windows и сохраняет установщики в разделе Artifacts.
