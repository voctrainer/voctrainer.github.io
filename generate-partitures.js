const fs = require('fs');
const path = require('path');

class PartitureGenerator {
    constructor() {
        this.abcDir = './abc';
        this.partituresDir = './partitures';
    }

    generateAll() {
        console.log('Starting generation...');
        
        // Сканируем структуру abc папки
        this.scanAndGenerate(this.abcDir, this.partituresDir);
        
        // Генерируем filelist.json для навигации
        this.generateFileList();
        
        console.log('Generation completed!');
    }

    scanAndGenerate(abcPath, partituresPath) {
        const items = fs.readdirSync(abcPath);
        
        items.forEach(item => {
            if (item === '.git') return;
            
            const abcItemPath = path.join(abcPath, item);
            const partituresItemPath = path.join(partituresPath, item);
            const stat = fs.statSync(abcItemPath);
            
            if (stat.isDirectory()) {
                // Обрабатываем папку
                this.processFolder(abcItemPath, partituresItemPath);
            } else if (item.endsWith('.abc')) {
                // Обрабатываем ABC файл
                this.processAbcFile(abcItemPath, partituresItemPath.replace('.abc', '.html'));
            } else if (item === 'folder.index') {
                // Обрабатываем индекс папки
                this.processFolderIndex(abcItemPath, path.join(partituresPath, 'index.md'));
            }
        });
    }

    processFolder(abcFolderPath, partituresFolderPath) {
        // Создаем папку в partitures если её нет
        if (!fs.existsSync(partituresFolderPath)) {
            fs.mkdirSync(partituresFolderPath, { recursive: true });
            console.log('Created folder:', partituresFolderPath);
        }

        // Обрабатываем содержимое папки
        const items = fs.readdirSync(abcFolderPath);
        
        items.forEach(item => {
            if (item === '.git') return;
            
            const abcItemPath = path.join(abcFolderPath, item);
            const partituresItemPath = path.join(partituresFolderPath, item);
            const stat = fs.statSync(abcItemPath);
            
            if (stat.isDirectory()) {
                this.processFolder(abcItemPath, partituresItemPath);
            } else if (item.endsWith('.abc')) {
                this.processAbcFile(abcItemPath, partituresItemPath.replace('.abc', '.html'));
            } else if (item === 'folder.index') {
                this.processFolderIndex(abcItemPath, path.join(partituresFolderPath, 'index.md'));
            }
        });
    }

    processAbcFile(abcFilePath, htmlFilePath) {
        const abcContent = fs.readFileSync(abcFilePath, 'utf8');
        const needsUpdate = this.needsUpdate(abcFilePath, htmlFilePath);
        
        if (!needsUpdate) {
            console.log('Skipping (no changes):', htmlFilePath);
            return;
        }

        // Извлекаем метаданные
        const titleMatch = abcContent.match(/T:\s*([^\n]+)/);
        const composerMatch = abcContent.match(/C:\s*([^\n]+)/);
        
        const title = titleMatch ? titleMatch[1].trim() : path.basename(abcFilePath, '.abc');
        const composer = composerMatch ? composerMatch[1].trim() : '';

        // Генерируем HTML
        const htmlContent = this.generateHtmlContent(title, composer, abcContent);
        
        // Сохраняем
        fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
        console.log('Generated:', htmlFilePath);
    }

    processFolderIndex(abcIndexPath, mdFilePath) {
        const indexContent = fs.readFileSync(abcIndexPath, 'utf8');
        const needsUpdate = this.needsUpdate(abcIndexPath, mdFilePath);
        
        if (!needsUpdate) {
            console.log('Skipping (no changes):', mdFilePath);
            return;
        }

        // Генерируем Markdown с front matter
        const folderName = path.basename(path.dirname(abcIndexPath));
        const title = folderName === 'abc' ? 'Коллекция партитур' : this.formatName(folderName);
        
        const mdContent = `---
layout: folder
title: "${title}"
---

${indexContent}
`;
        
        fs.writeFileSync(mdFilePath, mdContent, 'utf8');
        console.log('Generated:', mdFilePath);
    }

    needsUpdate(sourcePath, targetPath) {
        if (!fs.existsSync(targetPath)) return true;
        
        const sourceStats = fs.statSync(sourcePath);
        const targetStats = fs.statSync(targetPath);
        
        return sourceStats.mtime > targetStats.mtime;
    }

    generateHtmlContent(title, composer, abcContent) {
        return `---
layout: abc_partiture
title: "${title}"
composer: "${composer}"
---

<div class="abc-source 16 1.5">
${abcContent}
</div>
`;
    }

    formatName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateFileList() {
        const fileList = [];
        
        const scanDir = (dir, basePath = '') => {
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
                } else if (item.endsWith('.html')) {
                    fileList.push({
                        path: `/partitures/${relativePath}`,
                        name: path.basename(item, '.html'),
                        type: 'file'
                    });
                }
            });
        };
        
        scanDir(this.partituresDir);
        
        fs.writeFileSync(
            path.join(this.partituresDir, 'filelist.json'),
            JSON.stringify(fileList, null, 2),
            'utf8'
        );
        
        console.log('Generated filelist.json with', fileList.length, 'items');
    }
}

// Запуск генерации
const generator = new PartitureGenerator();
generator.generateAll();
