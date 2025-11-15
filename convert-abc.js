// convert-abc.js
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Пути
const ABC_DIR = './abc';
// const OUTPUT_DIR = './partitures'; // Убираем, так как партитуры генерируются напрямую в _site
const LAYOUTS_DIR = './_layouts';
const INCLUDES_DIR = './_includes';
const ASSETS_DIR = './assets';
const JS_DIR = './assets/js';
const CSS_DIR = './assets/css';

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

// Извлечение заголовка из ABC файла (новая функция, как в примере)
function extractTitleAndComposer(abcContent) {
  const lines = abcContent.split('\n');
  let title = '';
  let composer = '';

  for (const line of lines) {
    if (line.startsWith('T:')) {
      const tContent = line.substring(2).trim();
      if (title) {
        title += ' ' + tContent; // Если уже есть T:, добавляем к строке
      } else {
        title = tContent;
      }
    } else if (line.startsWith('C:')) {
      composer = line.substring(2).trim();
    } else if (line.trim() === '') {
      break; // Останавливаемся на первой пустой строке после метаданных
    }
  }

  return { title: title.trim(), composer: composer.trim() };
}

// Форматирование имени файла (новая функция, как в примере)
function formatName(name) {
  return name
    .replace(/_/g, ' ') // Заменяем подчеркивания на пробелы
    .replace(/\b\w/g, l => l.toUpperCase()); // Делаем первую букву заглавной
}

// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ: Генерация HTML страницы партитуры ---
async function generateAbcHtmlFile(abcFilePath, outputDir, parentFolderPath) {
  const fileName = path.basename(abcFilePath, '.abc');
  const htmlFilePath = path.join(outputDir, fileName + '.html');

  console.log('🎵 Processing ABC file:', abcFilePath, '->', htmlFilePath);

  const abcContent = readUtf8File(abcFilePath);

  // Извлекаем метаданные
  const { title, composer } = extractTitleAndComposer(abcContent);

  // --- НОВАЯ ФУНКЦИЯ: Генерация хлебных крошек ---
  function generateBreadcrumbs(parentPath) {
    const parts = parentPath.split('/').filter(p => p); // Убираем пустые строки
    let pathSoFar = '../'; // Начинаем с уровня выше текущего index.html
    let breadcrumbHtml = `<a href="${pathSoFar}index.html">Главная</a> > <a href="${pathSoFar}">Партитуры</a>`;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Для каждого сегмента пути добавляем ссылку на папку
      // Путь к папке: от текущего файла -> вверх -> в папку сегмента
      // Если parts = ['liturgy', 'liturgy_of_the_faithful'], то:
      // i=0: pathSoFar = '../', ссылка на ../liturgy/
      // i=1: pathSoFar = '../liturgy/', ссылка на ../liturgy/liturgy_of_the_faithful/
      let relativePathToFolder = '../'; // Начинаем с уровня выше
      for (let j = 0; j <= i; j++) {
        relativePathToFolder += parts[j] + '/';
      }
      // Пытаемся получить заголовок папки
      const folderPathForTitle = path.join(ABC_DIR, ...parts.slice(0, i + 1));
      const folderTitle = getTitleFromPath(folderPathForTitle);

      breadcrumbHtml += ` > <a href="${relativePathToFolder}">${folderTitle}</a>`;
    }

    // Последний элемент - название самой партитуры
    breadcrumbHtml += ` > <span>${title}</span>`;
    return breadcrumbHtml;
  }
  // --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

  // --- НОВАЯ ФУНКЦИЯ: Генерация навигации (ссылка "назад" на папку) ---
  function generateNav(parentPath) {
    const parts = parentPath.split('/').filter(p => p);
    let pathToParent = '../'; // Уровень выше текущего
    if (parts.length > 0) {
        for (let i = 0; i < parts.length; i++) {
            pathToParent += parts[i] + '/';
        }
    } else {
        pathToParent = '../'; // Если нет parentPath, то ссылка на корень партитур
    }
    const parentTitle = parts.length > 0 ? getTitleFromPath(path.join(ABC_DIR, ...parts)) : 'Партитуры';
    return `<a href="${pathToParent}">${parentTitle}</a>`;
  }
  // --- КОНЕЦ НОВОЙ ФУНКЦИИ ---


  // Генерируем HTML
  const breadcrumbsHtml = generateBreadcrumbs(parentFolderPath);
  const navHtml = generateNav(parentFolderPath);

  const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../main.css" />
    <link rel="stylesheet" href="../jstree/style.min.css" />
    <script src="../jstree/jstree.min.js"></script>
    <script src="../abc-ui-1.0.0.min.js"></script>
    <title>${title}${composer ? ' - ' + composer : ''}</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico"/>
</head>
<body>
    <div class="grid-container">
      <div class="grid-row">
        <div class="grid-col-12">
          <header class="header">
            <h1>Вокальный тренажер</h1>
            <nav class="main-nav">
                <a href="../index.html">Главная</a>
                <a href="../">Партитуры</a>
                ${navHtml} <!-- Ссылка на родительскую папку -->
            </nav>
          </header>
        </div>
      </div>
      <div class="grid-row">
        <main class="main-content grid-col-12">
          <nav class="breadcrumb">
            ${breadcrumbsHtml} <!-- Динамические хлебные крошки -->
          </nav>
          <div class="abc-container">
            <div class="abc-source">${abcContent}</div> <!-- Убран div id="abc-display", убран style="display: none;" -->
          </div>
        </main>
      </div>
    </div>

    <script src="../acoustic_grand_piano-mp3.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Рендер ABC нотации
        // ABCJS.renderAbc('abc-display', abcSource, { ... }); // Не используем, т.к. используем abc-ui
        if (typeof $ABC_UI !== 'undefined') {
            $ABC_UI.init();
            $ABC_UTIL.addHtmlVievers({
                bMacro: true,
                bDeco: true,
                bEditors: false
            });
        }
      });
    </script>
</body>
</html>`;

  await ensureDir(outputDir);
  await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
  console.log('✅ Generated HTML:', htmlFilePath);
}
// --- КОНЕЦ ИСПРАВЛЕННОЙ ФУНКЦИИ ---

// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ: Генерация Markdown из folder.index ---
function generateFolderMarkdown(content, folderPath, relativePath = '') {
  let markdownContent = content;

  // Извлечение настройки showInNavigation
  const navigationMatch = markdownContent.match(/showInNavigation:\s*(true|false)/);
  const showInNavigation = navigationMatch ? navigationMatch[1] === 'true' : true;

  // Удаление строки настройки из контента
  markdownContent = markdownContent.replace(/showInNavigation:\s*(true|false)\s*\n/, '').trim();

  // Определяем, нужно ли показывать полное дерево (для главной страницы каталога)
  const isMainCatalog = relativePath === ''; // Если это корень каталога
  const layoutName = isMainCatalog ? 'partiture_folder' : 'partiture_folder';

  const frontMatter = generateFrontMatter(
    layoutName,
    getTitleFromMarkdown(content),
    '', // folderTitle не нужен для папки
    '', // parentFolderPath не нужен для папки
    isMainCatalog // full_tree: true только для главной страницы каталога
  );

  // Замена плейсхолдера дерева (теперь обрабатывается в шаблоне)
  if (markdownContent.includes('{тут должно быть полное развернутое дерево каталога')) {
    markdownContent = markdownContent.replace('{тут должно быть полное развернутое дерево каталога', '');
  }

  return {
    markdown: `${frontMatter}\n${markdownContent}`,
    showInNavigation: showInNavigation
  };
}

// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ: Генерация YAML Front Matter для Jekyll ---
function generateFrontMatter(layout, title, parentFolderTitle = '', parentFolderPath = '', fullTree = false) {
  let frontMatter = `---\nlayout: ${layout}\ntitle: "${title}"\n`;
  if (parentFolderTitle) frontMatter += `parent_folder_title: "${parentFolderTitle}"\n`;
  if (parentFolderPath) frontMatter += `parent_folder_path: "${parentFolderPath}"\n`;
  if (fullTree) frontMatter += `full_tree: true\n`;
  frontMatter += "---\n";
  return frontMatter;
}

// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ: Извлечение заголовка из markdown ---
function getTitleFromMarkdown(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Без названия';
}

// --- НОВАЯ ФУНКЦИЯ: Извлечение заголовка из пути папки ---
function getTitleFromPath(folderPath) {
  // Пример: "liturgy/liturgy_of_the_faithful/cherubic_hymn" -> "cherubic_hymn"
  // Извлекаем последнюю часть пути
  const parts = folderPath.split('/');
  const lastPart = parts[parts.length - 1];
  if (!lastPart) return 'Папка'; // Если путь заканчивается на '/', возвращаем 'Папка'

  // Пытаемся найти folder.index в этой папке и получить заголовок оттуда
  const folderIndexPath = path.join(ABC_DIR, folderPath, 'folder.index');
  if (fs.existsSync(folderIndexPath)) {
    try {
      const folderIndexContent = readUtf8File(folderIndexPath);
      const title = getTitleFromMarkdown(folderIndexContent);
      if (title) return title;
    } catch (e) {
      console.warn(`Warning: Could not read folder.index for path ${folderPath}:`, e.message);
    }
  }
  // Если folder.index не найден или заголовок пуст, возвращаем имя папки
  return lastPart;
}


// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ: Создание структуры дерева ---
// Теперь она читает .abc файлы напрямую для получения заголовков
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
        const { showInNavigation: navSetting } = generateFolderMarkdown(folderIndexContent, itemPath);
        showInNavigation = navSetting;
        folderTitle = getTitleFromMarkdown(folderIndexContent);
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
      const { title, composer } = extractTitleAndComposer(abcContent);
      const fullTitle = `${title}${composer ? ' ' + composer : ''}`.trim() || path.basename(item, '.abc');
      const fileName = path.basename(item, '.abc');

      tree.push({
        text: fullTitle, // <-- Используем извлечённый заголовок
        id: relativePath + fileName + '.html', // <-- Путь к HTML файлу
        icon: 'jstree-file'
      });
    }
  }

  return tree;
}

// --- ОСНОВНАЯ ФУНКЦИЯ ---
async function convertAbcToJekyll() {
  console.log('Начинаю подготовку ABC файлов для Jekyll...');

  // Путь для генерации файлов Jekyll (до сборки)
  const OUTPUT_DIR_MD = './partitures'; // Путь для .md файлов коллекции
  // Путь для генерации файлов, которые должны быть доступны веб-серверу (HTML, JSON)
  const OUTPUT_DIR_WEB = './_site/partitures';

  await ensureDir(LAYOUTS_DIR);
  await ensureDir(INCLUDES_DIR);
  await ensureDir(ASSETS_DIR);
  await ensureDir(JS_DIR);
  await ensureDir(CSS_DIR);

  // Собираем структуру дерева
  const treeStructure = await buildTreeStructure(ABC_DIR);

  // --- НОВОЕ: Добавляем корневой узел "Партитуры" ---
  const fullTreeWithRoot = [
    {
      text: "Партитуры", // Отображаемое имя корня
      id: "", // Идентификатор корня (может быть пустой строкой или 'partitures')
      icon: 'jstree-root', // Опциональная иконка
      children: treeStructure
    }
  ];

  // Сохраняем структуру дерева в корень каталога (путь относительно _site)
  // full-tree.json должен быть доступен из _site для jsTree и renderFullTree
  const treeOutputPath = path.join(OUTPUT_DIR_WEB, 'full-tree.json'); // Используем OUTPUT_DIR_WEB
  await ensureDir(path.dirname(treeOutputPath)); // Убедимся, что папка _site/partitures существует
  await fs.writeJson(treeOutputPath, fullTreeWithRoot, { spaces: 2 });
  console.log(`Создан файл структуры дерева: ${treeOutputPath}`);

  // Обработка ABC файлов и folder.index
  const abcFiles = glob.sync(path.join(ABC_DIR, '**', '*.abc'));
  const folderIndexFiles = glob.sync(path.join(ABC_DIR, '**', 'folder.index'));

  // Обработка folder.index файлов (генерация .md для Jekyll)
  for (const folderIndexFile of folderIndexFiles) {
    // Путь относительно ABC_DIR
    const relativePath = path.relative(ABC_DIR, folderIndexFile);
    // Путь для вывода относительно корня репо (OUTPUT_DIR_MD)
    const outputDir = path.join(OUTPUT_DIR_MD, path.dirname(relativePath)); // Путь в ./partitures/...
    const outputFilePath = path.join(outputDir, 'index.md'); // Создаем .md файл для Jekyll

    await ensureDir(outputDir);

    const content = readUtf8File(folderIndexFile);
    const { markdown, showInNavigation } = generateFolderMarkdown(content, path.dirname(folderIndexFile));

    if (showInNavigation) {
      await fs.writeFile(outputFilePath, markdown);
      console.log(`Создан файл Jekyll: ${outputFilePath}`);
    }
  }

  // --- ИСПРАВЛЕНО: Обработка ABC файлов (генерация .html напрямую в OUTPUT_DIR_WEB) ---
  for (const abcFile of abcFiles) {
    const relativePath = path.relative(ABC_DIR, abcFile); // e.g., "liturgy/liturgy_of_the_faithful/cherubic_hymn/cherubic-ancient.abc"
    // HTML файлы генерируются напрямую в OUTPUT_DIR_WEB (->_site/partitures/...)
    const outputDir = path.join(OUTPUT_DIR_WEB, path.dirname(relativePath)); // e.g., "_site/partitures/liturgy/liturgy_of_the_faithful/cherubic_hymn"
    const parentFolderPath = path.dirname(relativePath); // e.g., "liturgy/liturgy_of_the_faithful/cherubic_hymn"

    await generateAbcHtmlFile(abcFile, outputDir, parentFolderPath); // Вызываем новую функцию
  }

  console.log('Подготовка файлов для Jekyll завершена! Теперь запустите "jekyll build".');
}

// Основная функция
async function main() {
  try {
    await convertAbcToJekyll();
  } catch (error) {
    console.error('Ошибка при подготовке файлов:', error);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = {
  convertAbcToJekyll
};