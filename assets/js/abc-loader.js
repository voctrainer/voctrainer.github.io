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
            console.log('✅ Loaded navigation data:', this.abcFiles);
        } catch (error) {
            console.error('❌ Error loading file list:', error);
            this.abcFiles = [];
        }
    }

    generateNavigation() {
        // Этот метод теперь не используется, так как навигация загружается через navigation.json
        console.log('✅ Navigation is handled by navigation.json files');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new AbcLoader();
});
