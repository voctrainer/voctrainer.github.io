// convert-abc.js
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Пути
const ABC_DIR = './abc';
// Единая папка для генерации файлов, которые Jekyll будет обрабатывать
const OUTPUT_DIR = './scores';
const LAYOUTS_DIR = './_layouts';
const INCLUDES_DIR = './_includes';
const ASSETS_DIR = './assets';
const JS_DIR = './assets/js';
const CSS_DIR = './assets/css';

// Глобальная настройка для генерации учебных партитур
const GENERATE_TRAINING_SCORES = true;

// Цвета интерфейса (теперь не используются в CSS, но могут быть полезны в скрипте)
const COLORS = {
    primary: '#0772A1',
    secondary: '#1B6686',
    dark: '#04577C',
    light: '#2792C0',
    accent: '#3F99C0'
};

// Создание директории
async function ensureDir(dir) {
    await fs.ensureDir(dir);
}

// Чтение файла с обработкой BOM
function readUtf8File(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.replace(/^\uFEFF/, '');
}

// Извлечение заголовка из ABC файла
function extractTitleAndComposer(abcContent) {
    const lines = abcContent.split('\n');
    let title = '';
    let composer = '';

    for (const line of lines) {
        if (line.startsWith('T:')) {
            const tContent = line.substring(2).trim();
            if (title) {
                title += ' ' + tContent;
            } else {
                title = tContent;
            }
        } else if (line.startsWith('C:')) {
            const cContent = line.substring(2).trim();
            if (composer) {
                composer += ' ' + cContent;
            } else {
                composer = cContent;
            }
        } else if (line.startsWith('K:') || line.startsWith('M:') || line.startsWith('L:') || line.startsWith('V:')) {
            // Достигли полей тела музыки - заголовки закончились
            break;
        }
    }

    return {
        title: title.trim(),
        composer: composer.trim()
    };
}

// Определение голосов в партитуре
function extractVoiceDefinitions(abcContent) {
    const lines = abcContent.split('\n');
    const voicePattern = /^V:(\d+)\s/;
    const voices = new Set();

    for (const line of lines) {
        const match = line.match(voicePattern);
        if (match) {
            voices.add(match[1]);
        }
    }

    return Array.from(voices).sort();
}

// Проверка, нужна ли учебная партитура
function needsTrainingScore(abcContent) {
    if (!GENERATE_TRAINING_SCORES) {
        return false;
    }

    const lines = abcContent.split('\n');
    const voices = extractVoiceDefinitions(abcContent);

    if (voices.length === 0) {
        return false;
    }

    // Проверяем, есть ли разбиение по строкам
    // Подсчитываем количество вхождений первого голоса [V:1] или [V:первый_номер]
    const firstVoice = voices[0];
    const voiceMarkerPattern = new RegExp(`^\\[V:${firstVoice}\\]`, 'i');
    let firstVoiceCount = 0;

    for (const line of lines) {
        if (voiceMarkerPattern.test(line.trim())) {
            firstVoiceCount++;
        }
    }

    // Если первый голос встречается более одного раза, значит есть разбиение по строкам
    return firstVoiceCount > 1;
}

// Извлечение заголовка партитуры (все строки до первого [V:X])
function extractHeader(abcContent) {
    const lines = abcContent.split('\n');
    const headerLines = [];

    for (const line of lines) {
        if (/^\[V:\d+\]/.test(line.trim())) {
            break;
        }
        headerLines.push(line);
    }

    return headerLines.join('\n');
}

// Извлечение заголовка без Title и Composer
function extractHeaderWithoutTitleComposer(abcContent) {
    const lines = abcContent.split('\n');
    const headerLines = [];

    for (const line of lines) {
        if (/^\[V:\d+\]/.test(line.trim())) {
            break;
        }
        // Пропускаем строки T: и C:
        if (!line.startsWith('T:') && !line.startsWith('C:')) {
            headerLines.push(line);
        }
    }

    return headerLines.join('\n');
}

// Разбиение партитуры по строкам
function splitByLines(abcContent) {
    const lines = abcContent.split('\n');
    const voices = extractVoiceDefinitions(abcContent);

    if (voices.length === 0) {
        return [];
    }

    const firstVoice = voices[0];
    const sections = [];
    let currentSection = [];
    let inMusicSection = false;

    for (const line of lines) {
        // Проверяем начало музыкальной секции
        if (/^\[V:\d+\]/.test(line.trim())) {
            inMusicSection = true;
        }

        if (!inMusicSection) {
            continue;
        }

        // Если встретили начало новой строки (первый голос)
        if (new RegExp(`^\\[V:${firstVoice}\\]`).test(line.trim())) {
            if (currentSection.length > 0) {
                sections.push(currentSection.join('\n'));
                currentSection = [];
            }
        }

        currentSection.push(line);
    }

    // Добавляем последнюю секцию
    if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
    }

    return sections;
}

// Разбиение партитуры по %%text директивам
function splitByText(abcContent) {
    const lines = abcContent.split('\n');
    const sections = [];
    let currentSection = [];
    let inMusicSection = false;

    for (const line of lines) {
        // Проверяем начало музыкальной секции
        if (/^\[V:\d+\]/.test(line.trim())) {
            inMusicSection = true;
        }

        if (!inMusicSection) {
            continue;
        }

        // Если встретили %%text (кроме самой первой строки)
        if (line.trim().startsWith('%%text') && currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
            currentSection = [];
        }

        currentSection.push(line);
    }

    // Добавляем последнюю секцию
    if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
    }

    return sections;
}

// Проверка наличия %%text в партитуре
function hasTextDirectives(abcContent) {
    return /^%%text/m.test(abcContent);
}

// Создание учебных разделов партитуры
function createTrainingSections(abcContent) {
    const fullHeader = extractHeader(abcContent);
    const headerWithoutTitle = extractHeaderWithoutTitleComposer(abcContent);
    const hasText = hasTextDirectives(abcContent);

    const result = {
        byLines: [],
        byText: []
    };

    // Разбиение по строкам
    const lineSections = splitByLines(abcContent);
    if (lineSections.length > 0) {
        result.byLines = lineSections.map((section, index) => {
            const header = index === 0 ? fullHeader : headerWithoutTitle;
            return header + '\n' + section;
        });
    }

    // Разбиение по %%text (если есть)
    if (hasText) {
        const textSections = splitByText(abcContent);
        if (textSections.length > 0) {
            result.byText = textSections.map((section, index) => {
                const header = index === 0 ? fullHeader : headerWithoutTitle;
                return header + '\n' + section;
            });
        }
    }

    return result;
}

// Форматирование имени файла (пока не используется)
function formatName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// --- Генерация HTML страницы партитуры ---
async function generateAbcHtmlFile(abcFilePath, outputDir, parentFolderPath) {
    const fileName = path.basename(abcFilePath, '.abc');
    const htmlFilePath = path.join(outputDir, fileName + '.html');

    console.log('🎵 Processing ABC file:', abcFilePath, '->', htmlFilePath);

    const abcContent = readUtf8File(abcFilePath);
    const {
        title,
        composer
    } = extractTitleAndComposer(abcContent);

    // Извлечение заголовка папки по пути
    function getTitleFromPath(folderPath) {
        const parts = folderPath.split(path.sep);
        const lastPart = parts[parts.length - 1];
        if (!lastPart) return 'Папка';

        const folderIndexPath = path.join(folderPath, 'folder.index');
        if (fs.existsSync(folderIndexPath)) {
            try {
                const folderIndexContent = readUtf8File(folderIndexPath);
                const title = getTitleFromMarkdown(folderIndexContent);
                if (title) return title;
            } catch (e) {
                console.warn(`Warning: Could not read folder.index for path ${folderPath}:`, e.message);
            }
        }
        return lastPart;
    }

    // Хлебные крошки: Главная → Партитуры → папки → партитура
    function generateBreadcrumbs(parentPath) {
        const parts = parentPath.split('/').filter(p => p);

        let breadcrumbHtml =
            `<a href="/index.html">Главная</a>` +
            ` &gt; <a href="/scores/">Партитуры</a>`;

        for (let i = 0; i < parts.length; i++) {
            const folderParts = parts.slice(0, i + 1); // ['liturgy', 'sub', ...]
            const folderUrl = '/scores/' + folderParts.join('/') + '/';
            const folderPathForTitle = path.join(ABC_DIR, ...folderParts);
            const folderTitle = getTitleFromPath(folderPathForTitle);

            breadcrumbHtml += ` &gt; <a href="${folderUrl}">${folderTitle}</a>`;
        }

        breadcrumbHtml += ` &gt; <span>${title || ''}</span>`;
        return breadcrumbHtml;
    }

    // Навигация: Главная, Партитуры, Родительская папка
    function generateNav(parentPath) {
        const parts = parentPath.split('/').filter(p => p);

        let navLinks =
            `<a href="/index.html">Главная</a>` +
            `<a href="/scores/">Партитуры</a>`;

        if (parts.length > 0) {
            const parentUrl = '/scores/' + parts.join('/') + '/';
            const parentTitle = getTitleFromPath(path.join(ABC_DIR, ...parts));
            navLinks += `<a href="${parentUrl}">${parentTitle}</a>`;
        }

        return navLinks;
    }

    const breadcrumbsHtml = generateBreadcrumbs(parentFolderPath);
    const navHtml = generateNav(parentFolderPath);

    // Проверяем, нужна ли учебная партитура
    const needsTraining = needsTrainingScore(abcContent);
    let abcContainerHtml = '';

    if (needsTraining) {
        const trainingSections = createTrainingSections(abcContent);
        const hasByText = trainingSections.byText.length > 0;

        // Генерируем HTML с вкладками
        abcContainerHtml = `
          <div class="score-tabs">
            <button class="tab-button active" data-tab="full">Полная партитура</button>
            <button class="tab-button" data-tab="by-lines">По строкам</button>
            ${hasByText ? '<button class="tab-button" data-tab="by-text">По разделам</button>' : ''}
          </div>

          <div class="tab-content active" id="full">
            <div class="abc-container">
              <div class="abc-source">${abcContent}</div>
            </div>
          </div>

          <div class="tab-content" id="by-lines">
            <div class="abc-container">
              ${trainingSections.byLines.map(section => `<div class="abc-source">${section}</div>`).join('\n              ')}
            </div>
          </div>

          ${hasByText ? `<div class="tab-content" id="by-text">
            <div class="abc-container">
              ${trainingSections.byText.map(section => `<div class="abc-source">${section}</div>`).join('\n              ')}
            </div>
          </div>` : ''}
        `;
    } else {
        // Обычная партитура без вкладок
        abcContainerHtml = `
          <div class="abc-container">
            <div class="abc-source">${abcContent}</div>
          </div>
        `;
    }

    // Генерируем HTML (без jsTree, с ассетами из /assets)
    const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Подключаем стили и иконку из /assets -->
    <link rel="stylesheet" href="/assets/css/main.css" />
    <link rel="stylesheet" href="/assets/css/music.min.css" />
    <title>${title || ''}${composer ? ' - ' + composer : ''}</title>
    <link rel="icon" type="image/x-icon" href="/assets/images/favicon.ico"/>
    <style>
      .score-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #0772A1;
        padding-bottom: 0;
      }
      .tab-button {
        padding: 10px 20px;
        background: #f0f0f0;
        border: none;
        border-radius: 5px 5px 0 0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        transition: all 0.3s;
      }
      .tab-button:hover {
        background: #e0e0e0;
      }
      .tab-button.active {
        background: #0772A1;
        color: white;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
    </style>
</head>
<body>
    <div class="grid-container">
      <div class="grid-row">
        <div class="grid-col-12">
          <header class="header">
            <h1>Вокальный тренажер</h1>
            <nav class="main-nav">
                ${navHtml}
            </nav>
          </header>
        </div>
      </div>
      <div class="grid-row">
        <main class="main-content grid-col-12">
          <nav class="breadcrumb">
            ${breadcrumbsHtml}
          </nav>
          ${abcContainerHtml}
        </main>
      </div>
    </div>

    <!-- Скрипты также из /assets/js -->
    <script src="/assets/js/acoustic_grand_piano-mp3.js"></script>
    <script src="/assets/js/abc-ui-1.0.0.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Инициализация ABC
        if (typeof $ABC_UI !== 'undefined') {
            $ABC_UI.init();
            $ABC_UTIL.addHtmlVievers({
                bMacro: true,
                bDeco: true,
                bEditors: false
            });
        }

        // Обработка вкладок
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Убираем активный класс со всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Добавляем активный класс к выбранной вкладке
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Переинициализируем ABC UI для новой вкладки
            if (typeof $ABC_UI !== 'undefined') {
              setTimeout(() => {
                $ABC_UI.init();
                $ABC_UTIL.addHtmlVievers({
                  bMacro: true,
                  bDeco: true,
                  bEditors: false
                });
              }, 100);
            }
          });
        });
      });
    </script>
</body>
</html>`;

    await ensureDir(outputDir);
    await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
    console.log('✅ Generated HTML:', htmlFilePath);
}

// --- Генерация HTML дерева из структуры ---
function generateTreeHtml(treeData) {
    if (!treeData || treeData.length === 0) {
        return '<div style="color: #7f8c8d; font-style: italic; padding: 10px 20px;">Папка пуста</div>';
    }

    let html = '<ul style="list-style: none; padding-left: 0; margin: 0;">';

    function renderItems(items, level = 0) {
        items.forEach(item => {
            const id = item.id; // относительный путь
            const text = item.text; // заголовок
            const children = item.children;

            let linkPath = id;
            if (!linkPath.endsWith('.html')) {
                if (id === '') {
                    linkPath = '/scores/';
                } else {
                    linkPath = '/scores/' + id + '/';
                }
            } else {
                linkPath = '/scores/' + id;
            }

            const indent = level * 20;
            const isFolder = !id.endsWith('.html');
            const icon = isFolder ? '📁' : '📄';
            const color = isFolder ? '#e67e22' : '#2c3e50';
            const fontWeight = isFolder ? 'bold' : 'normal';

            html += `
          <li style="margin-bottom: 4px;">
              <a href="${linkPath}" style="
                  color: ${color};
                  text-decoration: none;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 12px;
                  background: white;
                  border-radius: 5px;
                  border: 1px solid #e9ecef;
                  font-weight: ${fontWeight};
                  transition: all 0.2s;
                  margin-left: ${indent}px;
              " onmouseover="this.style.backgroundColor='${isFolder ? '#fff3e0' : '#f8f9fa'}'; this.style.borderColor='${isFolder ? '#e67e22' : '#4051b5'}'"
                 onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e9ecef'">
                  ${icon} ${text}
              </a>`;

            if (children && children.length > 0) {
                html += '<ul style="list-style: none; padding-left: 0; margin: 0;">';
                renderItems(children, level + 1);
                html += '</ul>';
            }

            html += '</li>';
        });
    }

    renderItems(treeData);
    html += '</ul>';
    return html;
}

// --- Генерация Markdown из folder.index ---
function generateFolderMarkdown(content, folderPath, relativePath = '', treeStructure) {
    let markdownContent = content;

    // Извлечение настройки showInNavigation
    const navigationMatch = markdownContent.match(/showInNavigation:\s*(true|false)/);
    const showInNavigation = navigationMatch ? navigationMatch[1] === 'true' : true;

    // Удаление строки настройки из контента
    markdownContent = markdownContent.replace(/showInNavigation:\s*(true|false)\s*\n/, '').trim();

    const isMainCatalog = relativePath === '';
    const layoutName = 'partiture_folder';

    const frontMatter = generateFrontMatter(
        layoutName,
        getTitleFromMarkdown(content),
        '',
        '',
        isMainCatalog
    );

    const PLACEHOLDER_TREE = '{тут должно быть полное развернутое дерево каталога}';

    if (markdownContent.includes(PLACEHOLDER_TREE)) {
        if (isMainCatalog && treeStructure) {
            const treeHtml = generateTreeHtml(treeStructure);
            markdownContent = markdownContent.replace(
                PLACEHOLDER_TREE,
                `<div id="full-partiture-tree">${treeHtml}</div>`
            );
        } else {
            markdownContent = markdownContent.replace(PLACEHOLDER_TREE, '');
        }
    }

    return {
        markdown: `${frontMatter}\n${markdownContent}`,
        showInNavigation: showInNavigation
    };
}

// --- Генерация YAML Front Matter для Jekyll ---
function generateFrontMatter(layout, title, parentFolderTitle = '', parentFolderPath = '', fullTree = false) {
    let frontMatter = `---\nlayout: ${layout}\ntitle: "${title}"\n`;
    if (parentFolderTitle) frontMatter += `parent_folder_title: "${parentFolderTitle}"\n`;
    if (parentFolderPath) frontMatter += `parent_folder_path: "${parentFolderPath}"\n`;
    if (fullTree) frontMatter += `full_tree: true\n`;
    frontMatter += "---\n";
    return frontMatter;
}

// --- Извлечение заголовка из markdown ---
function getTitleFromMarkdown(content) {
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('# ')) {
            return line.substring(2).trim();
        }
    }
    return 'Без названия';
}

// --- Создание структуры дерева ---
async function buildTreeStructure(currentPath, relativePath = '') {
    const tree = [];
    const items = await fs.readdir(currentPath);

    for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = await fs.stat(itemPath);

        if (item === 'folder.index') continue;

        if (stats.isDirectory()) {
            const folderIndexPath = path.join(itemPath, 'folder.index');
            let folderTitle = item;
            let showInNavigation = true;

            if (await fs.pathExists(folderIndexPath)) {
                const folderIndexContent = readUtf8File(folderIndexPath);
                const navigationMatch = folderIndexContent.match(/showInNavigation:\s*(true|false)/);
                showInNavigation = navigationMatch ? navigationMatch[1] === 'true' : true;
                if (showInNavigation) {
                    folderTitle = getTitleFromMarkdown(folderIndexContent) || item;
                }
            }

            if (showInNavigation) {
                const children = await buildTreeStructure(itemPath, relativePath + item + '/');
                tree.push({
                    text: folderTitle,
                    id: relativePath + item,
                    icon: 'jstree-folder',
                    children: children
                });
            }
        } else if (item.endsWith('.abc')) {
            const abcContent = readUtf8File(itemPath);
            const {
                title,
                composer
            } = extractTitleAndComposer(abcContent);
            const fullTitle =
                `${title}${composer ? ' ' + composer : ''}`.trim() ||
                path.basename(item, '.abc');
            const fileName = path.basename(item, '.abc');

            tree.push({
                text: fullTitle,
                id: relativePath + fileName + '.html',
                icon: 'jstree-file'
            });
        }
    }

    return tree;
}

// --- ОСНОВНАЯ ФУНКЦИЯ ---
async function convertAbcToJekyll() {
    console.log('Начинаю подготовку ABC файлов для Jekyll...');

    await ensureDir(LAYOUTS_DIR);
    await ensureDir(INCLUDES_DIR);
    await ensureDir(ASSETS_DIR);
    await ensureDir(JS_DIR);
    await ensureDir(CSS_DIR);

    const treeStructure = await buildTreeStructure(ABC_DIR);

    const fullTreeWithRoot = [{
        text: "Партитуры",
        id: "",
        icon: 'jstree-root',
        children: treeStructure
    }];

    const treeOutputPath = path.join(OUTPUT_DIR, 'full-tree.json');
    await ensureDir(path.dirname(treeOutputPath));
    await fs.writeJson(treeOutputPath, fullTreeWithRoot, {
        spaces: 2
    });
    console.log(`Создан файл структуры дерева: ${treeOutputPath}`);

    const abcFiles = glob.sync(path.join(ABC_DIR, '**', '*.abc'), {
        globstar: true,
        windowsPathsNoEscape: true
    });
    const folderIndexFiles = glob.sync(path.join(ABC_DIR, '**', 'folder.index'), {
        globstar: true,
        windowsPathsNoEscape: true
    });

    console.log('CWD:', process.cwd());
    console.log('ABC_DIR raw:', ABC_DIR, ' => resolved:', path.resolve(ABC_DIR));
    console.log('DEBUG: Путь для поиска .abc файлов:', path.join(ABC_DIR, '**', '*.abc'));
    console.log('DEBUG: Найдено .abc файлов:', abcFiles.length);

    console.log('DEBUG: Путь для поиска folder.index файлов:', path.join(ABC_DIR, '**', 'folder.index'));
    console.log('DEBUG: Найдено folder.index файлов:', folderIndexFiles.length);

    // folder.index → scores/.../index.md
    for (const folderIndexFile of folderIndexFiles) {
        const folderDir = path.dirname(folderIndexFile); // 'abc' или 'abc/xxx'
        const relativePath = path.relative(ABC_DIR, folderDir); // '' или 'xxx/...'

        const outputDir = path.join(OUTPUT_DIR, relativePath); // './scores' или './scores/xxx'
        const outputFilePath = path.join(outputDir, 'index.md');

        await ensureDir(outputDir);

        const content = readUtf8File(folderIndexFile);
        const {
            markdown,
            showInNavigation
        } = generateFolderMarkdown(
            content,
            folderDir,
            relativePath,
            relativePath === '' ? fullTreeWithRoot : undefined
        );

        if (showInNavigation) {
            await fs.writeFile(outputFilePath, markdown);
            console.log(`Создан файл Jekyll: ${outputFilePath}`);
        }
    }

    // abc → scores/.../*.html
    for (const abcFile of abcFiles) {
        const relativePath = path.relative(ABC_DIR, abcFile);
        const outputDir = path.join(OUTPUT_DIR, path.dirname(relativePath));
        const parentFolderPath = path.dirname(relativePath).replace(/\\/g, '/');

        await generateAbcHtmlFile(abcFile, outputDir, parentFolderPath);
    }

    console.log('Подготовка файлов для Jekyll завершена! Теперь запустите "jekyll build".');
}

async function main() {
    try {
        await convertAbcToJekyll();
    } catch (error) {
        console.error('Ошибка при подготовке файлов:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    convertAbcToJekyll
};
