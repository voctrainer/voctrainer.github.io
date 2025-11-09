#!/usr/bin/env python3
import os
import re
import glob

def convert_abc_to_html():
    # Находим все .abc файлы
    abc_files = glob.glob('partitures/**/*.abc', recursive=True)
    
    for abc_file in abc_files:
        # Читаем ABC файл
        with open(abc_file, 'r', encoding='utf-8') as f:
            abc_content = f.read()
        
        # Извлекаем заголовок и композитора из первой партитуры
        title_match = re.search(r'^T:\s*(.+)$', abc_content, re.MULTILINE)
        composer_match = re.search(r'^C:\s*(.+)$', abc_content, re.MULTILINE)
        
        title = title_match.group(1).strip() if title_match else os.path.basename(abc_file).replace('.abc', '')
        composer = composer_match.group(1).strip() if composer_match else ''
        
        # Создаем HTML файл
        html_file = abc_file.replace('.abc', '.html')
        html_dir = os.path.dirname(html_file)
        
        # Создаем директорию если нужно
        os.makedirs(html_dir, exist_ok=True)
        
        # Генерируем содержимое HTML файла
        html_content = f"""---
layout: abc_partiture
title: "{title}"
composer: "{composer}"
---

<div class="abc-source 16 1.5">
{abc_content}
</div>
"""
        
        # Записываем HTML файл
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Converted: {abc_file} -> {html_file}")

if __name__ == '__main__':
    convert_abc_to_html()
