const fs = require('fs');
const path = require('path');

class PartitureGenerator {
    constructor() {
        this.abcDir = './abc';
        this.partituresDir = './partitures';
    }

    generateAll() {
        console.log('Starting generation from:', this.abcDir);
        
        // Создаем основную папку partitures
        if (!fs.existsSync(this.partituresDir)) {
            fs.mkdirSync(this.partituresDir, { recursive: true });
        }
        
        // Генерируем корневой index.md
        this.generateRootIndex();
        
        // Сканируем и генерируем все файлы
        this.scanAndGenerate(this.abcDir, this.partituresDir);
        
        // Генерируем filelist.json
        this.generateFileList();
        
        console.log('Generation completed!');
    }

    generateRootIndex() {
        const rootIndexPath = path.join(this.abcDir, 'folder.index');
        const outputPath = path.join(this.partituresDir, 'index.md');
        
        let content = `---
layout: folder
title: "Коллекция партитур"
---

`;
        
        if (fs.existsSync(rootIndexPath)) {
            const folderContent = fs.readFileSync(rootIndexPath, 'utf8');
            content += folderContent;
        } else {
            content += `# 🎵 Нотная библиотека

Добро пожаловать в коллекцию церковных песнопений.

Выберите раздел из списка слева для просмотра партитур.`;
        }
        
        fs.writeFileSync(outputPath, content, 'utf8');
        console.log('Generated:', outputPath);
    }

    scanAndGenerate(abcPath, partituresPath) {
        if (!fs.existsSync(abcPath)) {
            console.log('ABC path does not exist:', abcPath);
            return;
        }
        
        const items = fs.readdirSync(abcPath);
        console.log('Found items in', abcPath, ':', items);
        
        items.forEach(item => {
            if (item === '.git' || item === 'folder.index') return;
            
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
        
        console.log('Processing folder:', abcFolderPath, '->', partituresFolderPath);
        
        // Создаем папку в partitures
        if (!fs.existsSync(partituresFolderPath)) {
            fs.mkdirSync(partituresFolderPath, { recursive: true });
        }

        // Генерируем index.md для папки
        const folderIndexPath = path.join(abcFolderPath, 'folder.index');
        const outputIndexPath = path.join(partituresFolderPath, 'index.md');
        
        let content = `---
layout: folder
title: "${this.formatName(folderName)}"
---

`;
        
        if (fs.existsSync(folderIndexPath)) {
            const folderContent = fs.readFileSync(folderIndexPath, 'utf8');
            content += folderContent;
        } else {
            content += `# ${this.formatName(folderName)}\n\nСодержимое папки.`;
        }
        
        fs.writeFileSync(outputIndexPath, content, 'utf8');
        console.log('Generated folder index:', outputIndexPath);

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

    processAbcFile(abcFilePath, partituresPath) {
        const fileName = path.basename(abcFilePath, '.abc');
        const htmlFilePath = path.join(partituresPath, fileName + '.html');
        
        console.log('Processing ABC file:', abcFilePath, '->', htmlFilePath);
        
        const abcContent = fs.readFileSync(abcFilePath, 'utf8');
        
        // Извлекаем метаданные
        const titleMatch = abcContent.match(/T:\s*([^\n]+)/);
        const composerMatch = abcContent.match(/C:\s*([^\n]+)/);
        
        const title = titleMatch ? titleMatch[1].trim() : fileName;
        const composer = composerMatch ? composerMatch[1].trim() : '';

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
        console.log('Generated HTML:', htmlFilePath);
    }

    generateFileList() {
        const fileList = [];
        
        const scanDir = (dir, basePath = '') => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                if (item === 'filelist.json' || item === '.git') return;
                
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    fileList.push({
                        path: `/partitures/${relativePath}/`,
                        name: item,
                        type: 'folder'
                    });
                    scanDir(fullPath, relativePath);
                } else if (item.endsWith('.html') || item.endsWith('.md')) {
                    // Для index.md используем путь папки
                    if (item === 'index.md') {
                        fileList.push({
                            path: `/partitures/${basePath}${basePath ? '' : '/'}`,
                            name: basePath || 'partitures',
                            type: 'folder'
                        });
                    } else if (item.endsWith('.html')) {
                        fileList.push({
                            path: `/partitures/${relativePath}`,
                            name: path.basename(item, '.html'),
                            type: 'file'
                        });
                    }
                }
            });
        };
        
        scanDir(this.partituresDir);
        
        // Удаляем дубликаты
        const uniqueFileList = fileList.filter((item, index, self) => 
            index === self.findIndex(i => i.path === item.path)
        );
        
        fs.writeFileSync(
            path.join(this.partituresDir, 'filelist.json'),
            JSON.stringify(uniqueFileList, null, 2),
            'utf8'
        );
        
        console.log('Generated filelist.json with', uniqueFileList.length, 'items');
    }

    formatName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Запуск генерации
try {
    const generator = new PartitureGenerator();
    generator.generateAll();
} catch (error) {
    console.error('Generation error:', error);
    process.exit(1);
}
