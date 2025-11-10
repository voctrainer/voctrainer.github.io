const fs = require('fs');
const path = require('path');

class PartitureGenerator {
    constructor() {
        this.abcDir = './abc';
        this.partituresDir = './partitures';
    }

    generateAll() {
        console.log('🚀 Starting complete regeneration from:', this.abcDir);
        
        // Полностью очищаем папку partitures
        this.cleanPartituresDir();
        
        // Создаем основную папку partitures
        if (!fs.existsSync(this.partituresDir)) {
            fs.mkdirSync(this.partituresDir, { recursive: true });
        }
        
        // Генерируем корневой index.md
        this.generateFolderIndex(this.abcDir, this.partituresDir);
        
        // Сканируем и генерируем все файлы
        this.scanAndGenerate(this.abcDir, this.partituresDir);
        
        // Генерируем навигационные данные для каждой папки (включая корневую)
        this.generateNavigationData();
        
        console.log('✅ Generation completed!');
    }

    cleanPartituresDir() {
        if (fs.existsSync(this.partituresDir)) {
            console.log('🧹 Cleaning partitures directory...');
            const items = fs.readdirSync(this.partituresDir);
            
            items.forEach(item => {
                if (item === '.git') return;
                
                const itemPath = path.join(this.partituresDir, item);
                this.deleteRecursive(itemPath);
            });
            console.log('✅ Partitures directory cleaned');
        }
    }

    deleteRecursive(filePath) {
        if (fs.existsSync(filePath)) {
            if (fs.statSync(filePath).isDirectory()) {
                const items = fs.readdirSync(filePath);
                items.forEach(item => {
                    this.deleteRecursive(path.join(filePath, item));
                });
                fs.rmdirSync(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }
    }

    scanAndGenerate(abcPath, partituresPath) {
        if (!fs.existsSync(abcPath)) {
            console.log('❌ ABC path does not exist:', abcPath);
            return;
        }
        
        const items = fs.readdirSync(abcPath);
        console.log('📁 Found items in', abcPath, ':', items);
        
        items.forEach(item => {
            if (item === '.git') return;
            
            const abcItemPath = path.join(abcPath, item);
            const stat = fs.statSync(abcItemPath);
            
            if (stat.isDirectory()) {
                this.processFolder(abcItemPath, partituresPath);
            } else if (item.endsWith('.abc')) {
                this.processAbcFile(abcItemPath, partituresPath);
            }
        });
    }

    processFolder(abcFolderPath, partituresBasePath) {
        const folderName = path.basename(abcFolderPath);
        const partituresFolderPath = path.join(partituresBasePath, folderName);
        
        console.log('📂 Processing folder:', abcFolderPath, '->', partituresFolderPath);
        
        // Создаем папку в partitures
        if (!fs.existsSync(partituresFolderPath)) {
            fs.mkdirSync(partituresFolderPath, { recursive: true });
        }

        // Генерируем index.md для папки из folder.index
        this.generateFolderIndex(abcFolderPath, partituresFolderPath);

        // Обрабатываем содержимое папки
        const items = fs.readdirSync(abcFolderPath);
        
        items.forEach(item => {
            if (item === '.git' || item === 'folder.index') return;
            
            const abcItemPath = path.join(abcFolderPath, item);
            const stat = fs.statSync(abcItemPath);
            
            if (stat.isDirectory()) {
                this.processFolder(abcItemPath, partituresFolderPath);
            } else if (item.endsWith('.abc')) {
                this.processAbcFile(abcItemPath, partituresFolderPath);
            }
        });
    }

    generateFolderIndex(abcFolderPath, partituresFolderPath) {
        const folderIndexPath = path.join(abcFolderPath, 'folder.index');
        const outputIndexPath = path.join(partituresFolderPath, 'index.md');
        
        let title = this.formatName(path.basename(abcFolderPath));
        let content = '';
        
        if (fs.existsSync(folderIndexPath)) {
            const folderContent = fs.readFileSync(folderIndexPath, 'utf8').trim();
            
            // Если файл начинается с заголовка Markdown, извлекаем его
            if (folderContent.startsWith('# ')) {
                const firstLineEnd = folderContent.indexOf('\n');
                if (firstLineEnd !== -1) {
                    title = folderContent.substring(2, firstLineEnd).trim();
                    content = folderContent.substring(firstLineEnd + 1).trim();
                } else {
                    title = folderContent.substring(2).trim();
                }
            } else {
                content = folderContent;
            }
            console.log('📄 Generated folder index from folder.index:', outputIndexPath);
        } else {
            content = `# ${title}\n\nСодержимое папки.`;
            console.log('📄 Generated default folder index:', outputIndexPath);
        }
        
        const frontMatter = `---
layout: folder
title: "${title}"
---

${content}`;
        
        fs.writeFileSync(outputIndexPath, frontMatter, 'utf8');
    }

    processAbcFile(abcFilePath, partituresPath) {
        const fileName = path.basename(abcFilePath, '.abc');
        const htmlFilePath = path.join(partituresPath, fileName + '.html');
        
        console.log('🎵 Processing ABC file:', abcFilePath, '->', htmlFilePath);
        
        const abcContent = fs.readFileSync(abcFilePath, 'utf8');
        
        // Извлекаем метаданные
        const titleMatch = abcContent.match(/T:\s*([^\n]+)/);
        const composerMatch = abcContent.match(/C:\s*([^\n]+)/);
        
        const title = titleMatch ? titleMatch[1].trim() : this.formatName(fileName);
        const composer = composerMatch ? composerMatch[1].trim() : '';

        // Сохраняем метаданные для навигации
        this.saveAbcMetadata(partituresPath, fileName, title, composer);

        // Генерируем HTML
        const htmlContent = `---
layout: abc_partiture
title: "${title}"
composer: "${composer}"
---

<div class="abc-source 16 1.5">
${abcContent}
</div>
`;
        
        fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
        console.log('✅ Generated HTML:', htmlFilePath);
    }

    saveAbcMetadata(partituresPath, fileName, title, composer) {
        const metadataPath = path.join(partituresPath, 'metadata.json');
        let metadata = {};
        
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        metadata[fileName + '.html'] = {
            title: title,
            composer: composer,
            displayName: composer ? `${title}. ${composer}` : title
        };
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }

    generateNavigationData() {
        console.log('📋 Generating navigation data...');
        
        const scanDir = (dir) => {
            console.log(`🔍 Scanning directory: ${dir}`);
            
            if (!fs.existsSync(dir)) {
                console.log(`❌ Directory does not exist: ${dir}`);
                return null;
            }
            
            const items = fs.readdirSync(dir);
            console.log(`📁 Items in ${dir}:`, items);
            
            const navigation = {
                folders: [],
                files: [],
                currentFolder: {
                    name: path.basename(dir),
                    displayName: this.getFolderDisplayName(dir),
                    showInNavigation: this.getFolderNavigationStatus(dir)
                }
            };
            
            console.log(`📊 Navigation for ${dir}:`, {
                displayName: navigation.currentFolder.displayName,
                showInNavigation: navigation.currentFolder.showInNavigation
            });
            
            // Если текущая папка скрыта из навигации, возвращаем пустую навигацию
            if (!navigation.currentFolder.showInNavigation) {
                console.log(`🚫 Folder ${dir} is hidden from navigation`);
                const navPath = path.join(dir, 'navigation.json');
                fs.writeFileSync(navPath, JSON.stringify(navigation, null, 2), 'utf8');
                console.log(`💾 Created navigation.json for hidden folder: ${navPath}`);
                return navigation;
            }
            
            items.forEach(item => {
                if (item === '.git' || item.startsWith('_') || item === 'navigation.json') {
                    console.log(`⏭️  Skipping: ${item}`);
                    return;
                }
                
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    console.log(`📂 Processing folder: ${item}`);
                    // Проверяем, должна ли папка показываться в навигации
                    const shouldShow = this.getFolderNavigationStatus(fullPath);
                    console.log(`📂 Folder ${item} showInNavigation: ${shouldShow}`);
                    
                    if (shouldShow) {
                        const folderData = scanDir(fullPath);
                        
                        // Формируем относительный путь
                        const relativePath = this.getRelativePath(fullPath);
                        
                        navigation.folders.push({
                            name: item,
                            displayName: folderData.currentFolder.displayName,
                            path: relativePath
                        });
                        
                        console.log(`✅ Added folder to navigation: ${item}`);
                    } else {
                        console.log(`🚫 Skipped hidden folder: ${item}`);
                    }
                } else if (item.endsWith('.html')) {
                    console.log(`📄 Processing file: ${item}`);
                    // Загружаем метаданные для файла
                    const metadataPath = path.join(dir, 'metadata.json');
                    let displayName = this.formatName(path.basename(item, '.html'));
                    
                    if (fs.existsSync(metadataPath)) {
                        try {
                            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                            if (metadata[item] && metadata[item].displayName) {
                                displayName = metadata[item].displayName;
                            }
                        } catch (e) {
                            console.warn('⚠️ Could not read metadata:', metadataPath, e.message);
                        }
                    }
                    
                    // Формируем относительный путь
                    const relativePath = this.getRelativePath(fullPath);
                    
                    navigation.files.push({
                        name: item,
                        displayName: displayName,
                        path: relativePath
                    });
                    
                    console.log(`✅ Added file to navigation: ${item}`);
                }
            });
            
            // Сортируем: сначала папки, потом файлы
            navigation.folders.sort((a, b) => a.displayName.localeCompare(b.displayName));
            navigation.files.sort((a, b) => a.displayName.localeCompare(b.displayName));
            
            // Сохраняем навигацию для текущей папки
            const navPath = path.join(dir, 'navigation.json');
            console.log(`💾 Saving navigation to: ${navPath}`);
            console.log(`📊 Navigation content:`, JSON.stringify(navigation, null, 2));
            
            try {
                fs.writeFileSync(navPath, JSON.stringify(navigation, null, 2), 'utf8');
                console.log(`✅ Successfully created: ${navPath}`);
            } catch (error) {
                console.error(`❌ Failed to create ${navPath}:`, error);
            }
            
            return navigation;
        };
        
        // Запускаем сканирование с корневой папки partitures
        const result = scanDir(this.partituresDir);
        console.log('✅ Navigation data generation completed');
        return result;
    }

    // Новый метод для проверки статуса навигации папки
    getFolderNavigationStatus(folderPath) {
        const indexPath = path.join(folderPath, 'folder.index');
        
        if (fs.existsSync(indexPath)) {
            try {
                const content = fs.readFileSync(indexPath, 'utf8');
                
                // Ищем параметр showInNavigation в содержимом
                const navigationMatch = content.match(/showInNavigation:\s*(true|false)/i);
                if (navigationMatch) {
                    return navigationMatch[1].toLowerCase() === 'true';
                }
            } catch (e) {
                console.warn('⚠️ Could not read folder navigation status:', indexPath, e.message);
            }
        }
        
        // По умолчанию показываем в навигации
        return true;
    }

    getRelativePath(fullPath) {
        // Преобразуем абсолютный путь в относительный от корня сайта
        let relativePath = fullPath.replace(this.partituresDir, '');
        
        // Для Windows путей заменяем обратные слеши
        relativePath = relativePath.replace(/\\/g, '/');
        
        // Убеждаемся что путь начинается с /
        if (!relativePath.startsWith('/')) {
            relativePath = '/' + relativePath;
        }
        
        return relativePath;
    }

    getFolderDisplayName(folderPath) {
        const indexPath = path.join(folderPath, 'index.md');
        
        if (fs.existsSync(indexPath)) {
            try {
                const content = fs.readFileSync(indexPath, 'utf8');
                // Извлекаем title из front matter
                const titleMatch = content.match(/title:\s*"([^"]+)"/);
                if (titleMatch) {
                    return titleMatch[1];
                }
                
                // Или пытаемся извлечь из заголовка Markdown
                const mdTitleMatch = content.match(/#\s+([^\n]+)/);
                if (mdTitleMatch) {
                    return mdTitleMatch[1].trim();
                }
            } catch (e) {
                console.warn('⚠️ Could not read folder title from index.md:', indexPath, e.message);
            }
        }
        
        // Fallback: форматированное имя папки
        return this.formatName(path.basename(folderPath));
    }

    formatName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2');
    }
}

// Запуск генерации
try {
    const generator = new PartitureGenerator();
    generator.generateAll();
} catch (error) {
    console.error('❌ Generation error:', error);
    process.exit(1);
}
