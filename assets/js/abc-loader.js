class AbcLoader {
    constructor() {
        this.abcFiles = [];
        this.init();
    }

    async init() {
        await this.loadAbcFileList();
        this.generateNavigation();
    }

    async loadAbcFileList() {
        try {
            const response = await fetch('/partitures/filelist.json');
            if (!response.ok) throw new Error('File not found');
            this.abcFiles = await response.json();
            console.log('Loaded navigation data:', this.abcFiles);
        } catch (error) {
            console.error('Error loading file list:', error);
            this.abcFiles = [];
        }
    }

    generateNavigation() {
        const navContainer = document.querySelector('.folder-navigation');
        if (!navContainer) return;

        const currentPath = window.location.pathname;
        
        // Фильтруем элементы для текущей папки
        const childItems = this.abcFiles.filter(item => {
            if (item.type === 'folder') {
                return item.path === currentPath;
            } else {
                const itemDir = item.path.split('/').slice(0, -1).join('/') + '/';
                return itemDir === currentPath;
            }
        });

        if (childItems.length === 0) {
            navContainer.innerHTML = '<div style="color: #7f8c8d; font-style: italic; padding: 20px; text-align: center;">Папка пуста</div>';
            return;
        }

        let html = '<h3 style="margin: 0 0 15px 0; color: #2c3e50;">📁 Навигация</h3>';
        html += '<ul style="list-style: none; padding-left: 0; margin: 0;">';
        
        childItems.forEach(item => {
            const icon = item.type === 'folder' ? '📁' : '📄';
            const displayName = this.formatDisplayName(item.name);
            
            html += `
                <li style="margin-bottom: 8px;">
                    <a href="${item.path}" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        background: white;
                        border-radius: 5px;
                        border: 1px solid #e9ecef;
                        color: ${item.type === 'folder' ? '#e67e22' : '#2c3e50'};
                        text-decoration: none;
                        font-weight: ${item.type === 'folder' ? 'bold' : 'normal'};
                        transition: all 0.2s;
                    " onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='${item.type === 'folder' ? '#e67e22' : '#4051b5'}'" 
                       onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e9ecef'">
                        ${icon} ${displayName}
                    </a>
                </li>
            `;
        });
        
        html += '</ul>';
        navContainer.innerHTML = html;
    }

    formatDisplayName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new AbcLoader();
});
