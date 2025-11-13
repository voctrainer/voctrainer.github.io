// JavaScript для навигации нотной библиотеки

document.addEventListener('DOMContentLoaded', function() {
  // Инициализация навигации
  initNavigation();
});

function initNavigation() {
  // Добавляем обработчики для мобильной навигации
  const navLinks = document.querySelectorAll('.navigation-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Добавляем класс активной ссылки
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Обработка кликов по файлам для воспроизведения (если нужно)
  const fileLinks = document.querySelectorAll('.navigation-file-link');
  fileLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Можно добавить логику для предзагрузки партитуры
      console.log('Открытие партитуры:', this.href);
    });
  });

  // Инициализация скролла для навигационного дерева
  const navTree = document.querySelector('.navigation-tree');
  if (navTree) {
    // Устанавливаем высоту в зависимости от контента
    const maxHeight = window.innerHeight * 0.6;
    navTree.style.maxHeight = Math.min(400, maxHeight) + 'px';
  }
}

// Функция для обновления активного элемента навигации
function updateActiveNavigation(currentPath) {
  const navLinks = document.querySelectorAll('.navigation-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
      link.style.backgroundColor = '#d1ecf1';
      link.style.fontWeight = '600';
    } else {
      link.classList.remove('active');
      link.style.backgroundColor = '';
      link.style.fontWeight = '';
    }
  });
}

// Функция для инициализации дерева навигации
function initTreeNavigation() {
  // Если на странице есть дерево навигации
  const treeList = document.querySelector('.navigation-tree-list');
  if (treeList) {
    // Добавляем класс для стилизации
    treeList.classList.add('initialized');
  }
}