const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Пути
const ABC_DIR = './abc';
const OUTPUT_DIR = './partitures'; // Изменить на './partitures' в корне репо
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

// Извлечение заголовка из ABC файла
function extractTitle(abcContent) {
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
      composer = line.substring(2).trim();
    } else if (line.trim() === '') {
      break; // Останавливаемся на первой пустой строке после метаданных
    }
  }

  return { title: title.trim(), composer: composer.trim() };
}

// Генерация YAML Front Matter для Jekyll
function generateFrontMatter(layout, title, parentFolderTitle = '', parentFolderPath = '', fullTree = false) {
  let frontMatter = `---\nlayout: ${layout}\ntitle: "${title}"\n`;
  if (parentFolderTitle) frontMatter += `parent_folder_title: "${parentFolderTitle}"\n`;
  if (parentFolderPath) frontMatter += `parent_folder_path: "${parentFolderPath}"\n`;
  if (fullTree) frontMatter += `full_tree: true\n`;
  frontMatter += "---\n";
  return frontMatter;
}

// Генерация Markdown из ABC (теперь создает Jekyll-совместимый markdown с front matter)
function generateAbcMarkdown(abcContent, fileName, parentFolder, folderTitle) {
  const { title, composer } = extractTitle(abcContent);
  const fullTitle = `${title} ${composer}`.trim();

  // Определяем путь родительской папки для ссылки
  const parentFolderPath = path.relative(ABC_DIR, parentFolder).replace(/\\/g, '/'); // Убедимся в слэше
  const relativeParentPath = parentFolderPath ? `partitures/${parentFolderPath}/` : 'partitures/';

  // --- ИСПРАВЛЕНО: Убрана попытка экранировать для YAML, содержимое ABC будет в теле документа ---
  // const escapedAbcContent = abcContent.replace(/"/g, '\\"').replace(/\n/g, '\n    ');

  const frontMatter = generateFrontMatter(
    'partiture',
    fullTitle, // <-- ИСПРАВЛЕНО: Используем извлечённый заголовок для page.title
    folderTitle,
    `/${relativeParentPath}`
  );

  // --- ИСПРАВЛЕНО: Помещаем ABC контент в переменную front matter ---
  // В шаблоне будет использоваться page.abc_content
  return `${frontMatter}
abc_content: |
  ${abcContent.replace(/\n/g, '\n  ')} # Добавляем отступ для многострочного значения в YAML
`;
}


// Генерация Markdown из folder.index (теперь создает Jekyll-совместимый markdown с front matter)
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
    getTitleFromMarkdown(markdownContent),
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

// Извлечение заголовка из markdown
function getTitleFromMarkdown(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Без названия';
}

// Создание структуры дерева
async function buildTreeStructure(currentPath, relativePath = '') {
  const tree = [];
  const items = await fs.readdir(currentPath);

  for (const item of items) {
    const itemPath = path.join(currentPath, item);
    const stats = await fs.stat(itemPath);

    if (item === 'folder.index') continue; // Пропускаем файл описания

    if (stats.isDirectory()) {
      const folderIndexPath = path.join(itemPath, 'folder.index');
      let folderTitle = item; // Название по умолчанию - имя папки
      let showInNavigation = true;

      if (await fs.pathExists(folderIndexPath)) {
        const folderIndexContent = readUtf8File(folderIndexPath);
        // Извлечение showInNavigation и заголовка из folder.index
        const navigationMatch = folderIndexContent.match(/showInNavigation:\s*(true|false)/);
        showInNavigation = navigationMatch ? navigationMatch[1] === 'true' : true;
        if (showInNavigation) {
          folderTitle = getTitleFromMarkdown(folderIndexContent) || item; // Берём заголовок из markdown
        }
      }

      if (showInNavigation) {
        const children = await buildTreeStructure(itemPath, relativePath + item + '/');
        // jsTree и renderFullTree ожидают: { text: "отображаемое имя", id: "путь/до/папки", children: [...] }
        tree.push({
          text: folderTitle, // <-- Используем извлеченное имя
          id: relativePath + item, // <-- Путь к папке
          icon: 'jstree-folder', // <-- Иконка (опционально, jsTree может использовать по умолчанию)
          children: children
        });
      }
    } else if (item.endsWith('.abc')) {
      const abcContent = readUtf8File(itemPath);
      const { title, composer } = extractTitle(abcContent);
      const fullTitle = `${title} ${composer}`.trim() || path.basename(item, '.abc'); // Название по умолчанию - имя файла без .abc
      const fileName = path.basename(item, '.abc');

      // jsTree и renderFullTree ожидают: { text: "отображаемое имя", id: "путь/до/файла.html" }
      tree.push({
        text: fullTitle, // <-- Используем извлечённое имя (название + композитор)
        id: relativePath + fileName + '.html', // <-- Путь к HTML файлу
        icon: 'jstree-file' // <-- Иконка (опционально)
      });
    }
  }

  return tree;
}

// Основная функция конвертации
async function convertAbcToJekyll() {
  console.log('Начинаю подготовку ABC файлов для Jekyll...');

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
  const treeOutputPath = path.join(OUTPUT_DIR, 'full-tree.json');
  await ensureDir(path.dirname(treeOutputPath)); // Убедимся, что папка partitures существует
  await fs.writeJson(treeOutputPath, fullTreeWithRoot, { spaces: 2 }); // Используем fullTreeWithRoot
  console.log(`Создан файл структуры дерева: ${treeOutputPath}`);

  // Обработка ABC файлов и folder.index
  const abcFiles = glob.sync(path.join(ABC_DIR, '**', '*.abc'));
  const folderIndexFiles = glob.sync(path.join(ABC_DIR, '**', 'folder.index'));

  // Обработка folder.index файлов
  for (const folderIndexFile of folderIndexFiles) {
    const relativePath = path.relative(ABC_DIR, folderIndexFile);
    const outputDir = path.join(OUTPUT_DIR, path.dirname(relativePath)); // Путь в _site
    const outputFilePath = path.join(outputDir, 'index.md'); // Создаем .md файл для Jekyll

    await ensureDir(outputDir);

    const content = readUtf8File(folderIndexFile);
    const { markdown, showInNavigation } = generateFolderMarkdown(content, path.dirname(folderIndexFile));

    if (showInNavigation) {
      await fs.writeFile(outputFilePath, markdown);
      console.log(`Создан файл Jekyll: ${outputFilePath}`);
    }
  }

  // Обработка ABC файлов
  for (const abcFile of abcFiles) {
    const relativePath = path.relative(ABC_DIR, abcFile);
    const outputDir = path.join(OUTPUT_DIR, path.dirname(relativePath)); // Путь в _site
    const fileName = path.basename(abcFile, '.abc');
    const outputFilePath = path.join(outputDir, fileName + '.md'); // Создаем .md файл для Jekyll

    await ensureDir(outputDir);

    const content = readUtf8File(abcFile);
    const parentFolder = path.dirname(abcFile);

    // Получаем заголовок родительской папки
    const parentFolderIndex = path.join(parentFolder, 'folder.index');
    let folderTitle = path.basename(parentFolder);
    if (await fs.pathExists(parentFolderIndex)) {
      const folderIndexContent = readUtf8File(parentFolderIndex);
      folderTitle = getTitleFromMarkdown(folderIndexContent);
    }

    const markdown = generateAbcMarkdown(content, fileName, parentFolder, folderTitle);
    await fs.writeFile(outputFilePath, markdown);
    console.log(`Создан файл Jekyll: ${outputFilePath}`);
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