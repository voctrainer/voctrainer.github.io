# voctrainer.github.io

## Структура проекта

Партитуры хранятся в папке partitures. Навигация строится автоматически.

Партитуры размещать в отдельном файле `.abc`, файлы будут обработаны, и преобразованы в страницы статического сайта.

## Структура проекта:

```text
.github/
└── workflows/
    └── deploy.yml

abc/  ✅ (ваши исходные ABC файлы)
├── folder.index
├── heruvimskaya_spasskaya.abc
├── heruvimskaya_bogomolov.abc
└── cherubic/
    ├── folder.index
    ├── heruvimskaya_preobrajenskoe.abc
    └── heruvimskaya_staro_bolgarskaya.abc

_includes/
├── folder-navigation.html
└── navigation.html

_layouts/
├── default.html
├── folder.html
└── abc_partiture.html

partitures/  ✅ (автогенерация - НЕ добавляйте файлы вручную!)
├── filelist.json (автогенерация)
├── index.md (автогенерация)
├── heruvimskaya_spasskaya.html (автогенерация)
├── heruvimskaya_bogomolov.html (автогенерация)
└── cherubic/
    ├── index.md (автогенерация)
    ├── heruvimskaya_preobrajenskoe.html (автогенерация)
    └── heruvimskaya_staro_bolgarskaya.html (автогенерация)

assets/
└── js/
    └── abc-loader.js

generate-partitures.js  ✅ (ЗДЕСЬ - в корне!)

_config.yml
abc-ui-1.0.0.min.js
acoustic_grand_piano-mp3.js
favicon.png
index.html
LICENSE
main.css
music.min.css
README.md
```

### Подробное описание расположения:

1. Корень репозитория `(/)`

```text
generate-partitures.js          ← СКРИПТ ГЕНЕРАЦИИ ЗДЕСЬ
_config.yml
abc-ui-1.0.0.min.js
acoustic_grand_piano-mp3.js
# ... остальные корневые файлы
```

2. Папка `abc/` (ручное управление, пример структуры)

```text
abc/
├── folder.index                ← Описание главной страницы партитур
├── heruvimskaya_spasskaya.abc  ← Исходный ABC файл
├── heruvimskaya_bogomolov.abc  ← Исходный ABC файл
└── cherubic/
    ├── folder.index            ← Описание папки "Херувимские"
    ├── heruvimskaya_preobrajenskoe.abc
    └── heruvimskaya_staro_bolgarskaya.abc
```

3. Папка `partitures/` (автогенерация - НЕ ТРОГАТЬ!)

```text
partitures/                     ← ВСЁ СОДЕРЖИМОЕ АВТОГЕНЕРИРУЕТСЯ!
├── filelist.json               ← Автогенерация для навигации
├── index.md                    ← Автогенерация из abc/folder.index
├── heruvimskaya_spasskaya.html ← Автогенерация из abc/... .abc
├── heruvimskaya_bogomolov.html ← Автогенерация
└── cherubic/
    ├── index.md                ← Автогенерация из abc/cherubic/folder.index
    ├── heruvimskaya_preobrajenskoe.html ← Автогенерация
    └── heruvimskaya_staro_bolgarskaya.html ← Автогенерация
```
