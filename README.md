# voctrainer.github.io

## Структура проекта

Партитуры хранятся в папке scores. Навигация строится автоматически.

Партитуры размещать в отдельном файле `.abc`, файлы будут обработаны, и преобразованы в страницы статического сайта.

## Структура проекта:

```text
your-repo/
├── .github/
│   └── workflows/          # (необходимо создать для GitHub Actions)
│       └── build-and-deploy.yml
├── abc/                    # Исходные ABC файлы (ручное управление)
│   ├── folder.index        # Описание главной страницы каталога
│   ├── folder1/
│   │   ├── folder.index    # Описание папки
│   │   ├── file1.abc       # ABC файл партитуры
│   │   └── ...
│   └── ...
├── _layouts/
│   ├── home.html           # Шаблон главной страницы
│   ├── partiture_folder.html # Шаблон страницы папки
│   └── partiture.html      # Шаблон страницы партитуры
├── _includes/
│   └── header.html         # Включаемый фрагмент шапки
├── assets/
│   ├── css/
│   │   ├── main.css        # Основные стили
│   │   └── music.min.css   # Стили для нот
│   ├── jstree/         # Папка с jsTree
│   │       ├── 32px.png
│   │       ├── 40px.png
│   │       ├── style.css
│   │       └── style.min.css
│   └── js/
│       ├── jstree/         # Папка с jsTree
│       │   └── jstree.min.js
│       ├── abc-ui-1.0.0.min.js
│       ├── acoustic_grand_piano-mp3.js
│       ├── jquery.min.js
│       └── navigation.js
├── assets/images/
│   └── favicon.ico         # Фавикон
├── _config.yml             # Конфигурация Jekyll
├── index.md                # Главная страница (исходник для Jekyll)
├── convert-abc.js          # Скрипт для подготовки файлов
├── package.json
├── LICENSE
├── package-lock.json
├── README.md
└── ...

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

3. Папка `scores/` (автогенерация - НЕ ТРОГАТЬ!)

```text
scores/                     ← ВСЁ СОДЕРЖИМОЕ АВТОГЕНЕРИРУЕТСЯ!
├── filelist.json               ← Автогенерация для навигации
├── index.md                    ← Автогенерация из abc/folder.index
├── heruvimskaya_spasskaya.html ← Автогенерация из abc/... .abc
├── heruvimskaya_bogomolov.html ← Автогенерация
└── cherubic/
    ├── index.md                ← Автогенерация из abc/cherubic/folder.index
    ├── heruvimskaya_preobrajenskoe.html ← Автогенерация
    └── heruvimskaya_staro_bolgarskaya.html ← Автогенерация
```
