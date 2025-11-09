class AbcLoader {
    constructor() {
        this.abcFiles = [];
        this.init();
    }

    async init() {
        await this.loadAbcFileList();
        this.generateNavigation();
        this.loadCurrentAbcFile();
    }

    async loadAbcFileList() {
        // Получаем список всех ABC файлов
        try {
            const response = await fetch('/partitures/filelist.json');
            this.abcFiles = await response.json();
        } catch (error) {
            console.error('Error loading ABC file list:', error);
            // Если файла нет, генерируем список из структуры страниц
            this.generateFileListFromPages();
        }
    }

    generateFileListFromPages() {
        // Альтернативный способ - анализируем структуру URL
        this.abcFiles = [];
        // Этот метод можно расширить для анализа sitemap
    }

    generateNavigation() {
        const navContainer = document.querySelector('.folder-navigation');
        if (!navContainer) return;

        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(part => part);
        
        // Генерируем навигацию на основе текущего пути
        const relevantFiles = this.abcFiles.filter(file => 
            file.path.startsWith(currentPath) && file.path !== currentPath
        );

        let html = '<h3>📁 Навигация</h3><ul>';
        
        relevantFiles.forEach(file => {
            const isFolder = !file.path.includes('.html');
            const icon = isFolder ? '📁' : '📄';
            const name = file.name.replace(/_/g, ' ').replace('.html', '');
            
            html += `
                <li>
                    <a href="${file.path}" class="nav-item ${isFolder ? 'folder' : 'file'}">
                        ${icon} ${name}
                    </a>
                </li>
            `;
        });
        
        html += '</ul>';
        navContainer.innerHTML = html;
    }

    async loadCurrentAbcFile() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('.html')) return;

        // Если это HTML файл, созданный из ABC, загружаем ABC контент
        const abcFilePath = currentPath.replace('.html', '.abc');
        
        try {
            const response = await fetch(abcFilePath);
            if (response.ok) {
                const abcContent = await response.text();
                this.renderAbcContent(abcContent);
            }
        } catch (error) {
            console.log('Not an ABC-based page or ABC file not found');
        }
    }

    renderAbcContent(abcContent) {
        const container = document.querySelector('.abc-container');
        if (!container) return;

        // Разбиваем на отдельные партитуры если их несколько
        const tunes = abcContent.split(/(?=X:\d+)/).filter(tune => tune.trim());
        
        let html = '';
        tunes.forEach((tune, index) => {
            const titleMatch = tune.match(/T:\s*([^\n]+)/);
            const composerMatch = tune.match(/C:\s*([^\n]+)/);
            
            const title = titleMatch ? titleMatch[1].trim() : `Партитура ${index + 1}`;
            const composer = composerMatch ? composerMatch[1].trim() : '';
            
            html += `
                <div class="tune-section">
                    <h3>${title}${composer ? ` - ${composer}` : ''}</h3>
                    <div class="abc-source 16 1.5" id="tune-${index + 1}">
                        ${tune.trim()}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        
        // Инициализируем ABC рендерер
        if (typeof $ABC_UI !== 'undefined') {
            $ABC_UI.init();
            $ABC_UTIL.addHtmlVievers({
                bMacro: true,
                bDeco: true,
                bEditors: false
            });
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AbcLoader();
});
