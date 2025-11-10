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
        
        // Генерируем навигационные данные для каждой папки
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
        
        // Сохраняем название папки для использования в навигации
        this.saveFolderTitle(partituresFolderPath, title);
    }

    saveFolderTitle(partituresFolderPath, title) {
        const titlePath = path.join(partituresFolderPath, 'folder-title.json');
        fs.writeFileSync(titlePath, JSON.stringify({ title: title }, null, 2), 'utf8');
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
            if (!fs.existsSync(dir)) return null;
            
            const items = fs.readdirSync(dir);
            const navigation = {
                folders: [],
                files: []
            };
            
            items.forEach(item => {
                if (item === '.git' || item.startsWith('_')) return;
                
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Получаем название папки из folder-title.json
                    const titlePath = path.join(fullPath, 'folder-title.json');
                    let displayName = this.formatName(item);
                    
                    if (fs.existsSync(titlePath)) {
                        try {
                            const titleData = JSON.parse(fs.readFileSync(titlePath, 'utf8'));
                            displayName = titleData.title || displayName;
                        } catch (e) {
                            console.warn('⚠️ Could not read folder title:', titlePath, e.message);
                        }
                    }
                    
                    const folderData = scanDir(fullPath);
                    navigation.folders.push({
                        name: item,
                        displayName: displayName,
                        path: fullPath.replace(this.partituresDir, ''),
                        children: folderData
                    });
                } else if (item.endsWith('.html')) {
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
                    
                    navigation.files.push({
                        name: item,
                        displayName: displayName,
                        path: fullPath.replace(this.partituresDir, '')
                    });
                }
            });
            
            // Сортируем: сначала папки, потом файлы
            navigation.folders.sort((a, b) => a.displayName.localeCompare(b.displayName));
            navigation.files.sort((a, b) => a.displayName.localeCompare(b.displayName));
            
            // Сохраняем навигацию для текущей папки
            const navPath = path.join(dir, 'navigation.json');
            fs.writeFileSync(navPath, JSON.stringify(navigation, null, 2), 'utf8');
            
            return navigation;
        };
        
        scanDir(this.partituresDir);
        console.log('✅ Navigation data generated');
        
        // Также генерируем общий filelist.json
        this.generateFileList();
    }

    generateFileList() {
        const fileList = [];
        
        const scanDir = (dir, basePath = '') => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                if (item === '.git' || item.startsWith('_')) return;
                
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Получаем название папки
                    const titlePath = path.join(fullPath, 'folder-title.json');
                    let displayName = this.formatName(item);
                    
                    if (fs.existsSync(titlePath)) {
                        try {
                            const titleData = JSON.parse(fs.readFileSync(titlePath, 'utf8'));
                            displayName = titleData.title || displayName;
                        } catch (e) {
                            console.warn('⚠️ Could not read folder title for filelist:', titlePath);
                        }
                    }
                    
                    // Добавляем папку
                    const folderPath = `/partitures/${relativePath}/`;
                    if (!fileList.some(existing => existing.path === folderPath)) {
                        fileList.push({
                            path: folderPath,
                            name: item,
                            displayName: displayName,
                            type: 'folder'
                        });
                    }
                    scanDir(fullPath, relativePath);
                } else if (item.endsWith('.html')) {
                    // Получаем метаданные для файла
                    const metadataPath = path.join(dir, 'metadata.json');
                    let displayName = this.formatName(path.basename(item, '.html'));
                    
                    if (fs.existsSync(metadataPath)) {
                        try {
                            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                            if (metadata[item] && metadata[item].displayName) {
                                displayName = metadata[item].displayName;
                            }
                        } catch (e) {
                            console.warn('⚠️ Could not read metadata for filelist:', metadataPath);
                        }
                    }
                    
                    // Добавляем HTML файлы
                    fileList.push({
                        path: `/partitures/${relativePath}`,
                        name: path.basename(item, '.html'),
                        displayName: displayName,
                        type: 'file'
                    });
                }
            });
        };
        
        scanDir(this.partituresDir);
        
        // Добавляем корневую папку partitures
        const rootTitlePath = path.join(this.partituresDir, 'folder-title.json');
        let rootDisplayName = 'Коллекция партитур';
        
        if (fs.existsSync(rootTitlePath)) {
            try {
                const titleData = JSON.parse(fs.readFileSync(rootTitlePath, 'utf8'));
                rootDisplayName = titleData.title || rootDisplayName;
            } catch (e) {
                console.warn('⚠️ Could not read root folder title:', rootTitlePath);
            }
        }
        
        if (!fileList.some(item => item.path === '/partitures/')) {
            fileList.push({
                path: '/partitures/',
                name: 'partitures',
                displayName: rootDisplayName,
                type: 'folder'
            });
        }
        
        // Сортируем: сначала папки, потом файлы
        fileList.sort((a, b) => {
            if (a.type === b.type) {
                return a.displayName.localeCompare(b.displayName);
            }
            return a.type === 'folder' ? -1 : 1;
        });
        
        fs.writeFileSync(
            path.join(this.partituresDir, 'filelist.json'),
            JSON.stringify(fileList, null, 2),
            'utf8'
        );
        
        console.log('📋 Generated filelist.json with', fileList.length, 'items');
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
