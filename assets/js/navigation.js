// Генерирует навигацию на основе структуры папок
async function generateNavigation() {
    try {
        const response = await fetch('/sitemap.json');
        const sitemap = await response.json();
        
        const nav = document.createElement('nav');
        nav.innerHTML = buildNavigation(sitemap);
        document.body.prepend(nav);
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
}

function buildNavigation(items, level = 0) {
    let html = '<ul>';
    
    items.forEach(item => {
        html += '<li>';
        html += `<a href="${item.url}">${item.title}</a>`;
        
        if (item.children && item.children.length > 0) {
            html += buildNavigation(item.children, level + 1);
        }
        
        html += '</li>';
    });
    
    html += '</ul>';
    return html;
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', generateNavigation);
