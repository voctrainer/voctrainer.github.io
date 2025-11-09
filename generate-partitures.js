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
        this.generateFolderIndex(this.abcDir, this.partituresDir);
        
        // Сканируем и генерируем все файлы
        this.scanAndGenerate(this.abcDir, this.partituresDir);
        
        // Генерируем filelist.json для JavaScript навигации
        this.generateFileList();
        
        console.log('Generation completed!');
    }

    scanAndGenerate(abcPath, partituresPath) {
        if (!fs.existsSync(abcPath)) {
            console.log('ABC path does not exist:', abcPath);
            return;
        }
        
        const items = fs.readdirSync(abcPath);
        
        items.forEach(item => {
            if (item === '.git') return;
            
            const abcItemPath = path.join(abcPath, item);
            const stat = fs.statSync(abcItemPath);
            
            if (stat.isDirectory()) {
                this.processFolder(abcItemPath, partituresPath);
            } else if (item.endsWith('.abc')) {
                this.processAbcFile(abcItemPath, partituresPath);
            }
            // folder.index обрабатывается в processFolder
        });
    }

    processFolder(abcFolderPath, partituresBasePath) {
        const folderName = path.basename(abcFolderPath);
        const partituresFolderPath = path.join(partituresBasePath, folderName);
        
        console.log('Processing folder:', abcFolderPath, '->', partituresFolderPath);
        
        // Создаем папку в partitures если не существует
        if (!fs.existsSync(partituresFolderPath)) {
            fs.mkdirSync(partituresFolderPath, { recursive: true });
        }

        // Генерируем/обновляем index.md для папки из folder.index
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
        
        // Проверяем, нужно ли обновлять файл
        if (this.shouldRegenerate(folderIndexPath, outputIndexPath)) {
            let content = `---
layout: folder
title: "${this.formatName(path.basename(abcFolderPath))}"
---

`;
            
            if (fs.existsSync(folderIndexPath)) {
                const folderContent = fs.readFileSync(folderIndexPath, 'utf8');
                content += folderContent;
            } else {
                content += `# ${this.formatName(path.basename(abcFolderPath))}\n\nСодержимое папки.`;
            }
            
            fs.writeFileSync(outputIndexPath, content, 'utf8');
            console.log('Generated/Updated folder index:', outputIndexPath);
        } else {
            console.log('Skipped unchanged folder index:', outputIndexPath);
        }
    }

    processAbcFile(abcFilePath, partituresPath) {
        const fileName = path.basename(abcFilePath, '.abc');
        const htmlFilePath = path.join(partituresPath, fileName + '.html');
        
        // Проверяем, нужно ли обновлять файл
        if (this.shouldRegenerate(abcFilePath, htmlFilePath)) {
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
        } else {
            console.log('Skipped unchanged ABC file:', htmlFilePath);
        }
    }

    shouldRegenerate(sourcePath, targetPath) {
        // Если целевого файла не существует, нужно генерировать
        if (!fs.existsSync(targetPath)) {
            return true;
        }
        
        // Если исходный файл новее целевого, нужно перегенерировать
        const sourceTime = fs.statSync(sourcePath).mtime;
        const targetTime = fs.statSync(targetPath).mtime;
        
        return sourceTime > targetTime;
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
