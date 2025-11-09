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

    // ... остальные методы (cleanPartituresDir, scanAndGenerate, processFolder, generateFolderIndex) остаются без изменений ...

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
        this.saveAbcMetadata(abcFilePath, partituresPath, fileName, title, composer);

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

    saveAbcMetadata(abcFilePath, partituresPath, fileName, title, composer) {
        const metadataPath = path.join(partituresPath, '_metadata.json');
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
                if (item === '.git' || item === 'filelist.json' || item.startsWith('_')) return;
                
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    const folderData = scanDir(fullPath);
                    navigation.folders.push({
                        name: item,
                        displayName: this.formatFolderName(item),
                        path: fullPath.replace(this.partituresDir, ''),
                        children: folderData
                    });
                } else if (item.endsWith('.html')) {
                    // Загружаем метаданные для файла
                    const metadataPath = path.join(dir, '_metadata.json');
                    let displayName = this.formatName(path.basename(item, '.html'));
                    
                    if (fs.existsSync(metadataPath)) {
                        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                        if (metadata[item] && metadata[item].displayName) {
                            displayName = metadata[item].displayName;
                        }
                    }
                    
                    navigation.files.push({
                        name: item,
                        displayName: displayName,
                        path: fullPath.replace(this.partituresDir, '')
                    });
                }
            });
            
            // Сохраняем навигацию для текущей папки
            const navPath = path.join(dir, '_navigation.json');
            fs.writeFileSync(navPath, JSON.stringify(navigation, null, 2), 'utf8');
            
            return navigation;
        };
        
        scanDir(this.partituresDir);
        console.log('✅ Navigation data generated');
    }

    formatFolderName(name) {
        const folderNames = {
            'partitures': 'Коллекция партитур',
            'cherubic': 'Херувимские песни'
        };
        
        return folderNames[name] || this.formatName(name);
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
