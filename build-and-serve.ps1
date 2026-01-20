# build-and-serve.ps1
# Скрипт для локальной сборки и запуска сайта Vocal Trainer

$ErrorActionPreference = "Stop" # Прекращает выполнение при ошибке

Write-Host "==========================================" -ForegroundColor Green
Write-Host "?? Начинаю локальную сборку сайта..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# 1. Убедитесь, что вы в корне репозитория
$RepoRoot = Get-Location
$ExpectedFiles = @("abc", "convert-abc.js", "_config.yml", "Gemfile")
$MissingFiles = $ExpectedFiles | Where-Object { -not (Test-Path $_) }

if ($MissingFiles.Count -gt 0) {
    Write-Host "? Ошибка: Не найдены ожидаемые файлы/папки в текущей директории:" -ForegroundColor Red
    $MissingFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "Текущая директория: $RepoRoot" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "? Найдены ожидаемые файлы/папки в корне репозитория." -ForegroundColor Green
}

# 2. Установка зависимостей Node.js
Write-Host "`n?? Устанавливаю зависимости Node.js..." -ForegroundColor Cyan
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install завершился с ошибкой (код: $LASTEXITCODE)" }
    Write-Host "? Зависимости Node.js установлены." -ForegroundColor Green
}
catch {
    Write-Host "? Ошибка при установке зависимостей Node.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Запуск скрипта convert-abc.js
Write-Host "`n?? Запускаю convert-abc.js для генерации файлов партитур..." -ForegroundColor Cyan
try {
    node convert-abc.js
    if ($LASTEXITCODE -ne 0) { throw "convert-abc.js завершился с ошибкой (код: $LASTEXITCODE)" }
    Write-Host "? convert-abc.js успешно выполнен." -ForegroundColor Green
}
catch {
    Write-Host "? Ошибка при выполнении convert-abc.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Проверка наличия сгенерированных файлов (опционально, но полезно)
Write-Host "`n?? Проверяю сгенерированные файлы в ./scores/..." -ForegroundColor Cyan
$GeneratedFiles = Get-ChildItem -Path "./scores" -Recurse -File | Measure-Object
if ($GeneratedFiles.Count -eq 0) {
    Write-Host "??  Внимание: В папке ./scores не найдено файлов после выполнения convert-abc.js." -ForegroundColor Yellow
    Write-Host "Это может быть нормально, если в abc/ нет файлов, или ошибка в скрипте." -ForegroundColor Yellow
}
else {
    Write-Host "? Найдено $($GeneratedFiles.Count) сгенерированных файлов в ./scores/." -ForegroundColor Green
}

# 5. Установка и запуск Jekyll (используя bundle)
Write-Host "`n?? Запускаю сборку Jekyll через bundle exec..." -ForegroundColor Cyan
try {
    # bundle install обычно не нужен, если bundler-cache: true в workflow, но можно добавить на всякий случай
    # bundle install --quiet
    bundle exec jekyll build --trace
    if ($LASTEXITCODE -ne 0) { throw "jekyll build завершился с ошибкой (код: $LASTEXITCODE)" }
    Write-Host "? Сборка Jekyll завершена успешно." -ForegroundColor Green
}
catch {
    Write-Host "? Ошибка при сборке Jekyll: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Проверьте вывод выше на наличие деталей ошибки." -ForegroundColor Yellow
    exit 1
}

# 6. Запуск локального сервера
Write-Host "`n?? Запускаю локальный сервер Jekyll..." -ForegroundColor Cyan
Write-Host "Откройте в браузере: http://127.0.0.1:4000 или http://localhost:4000" -ForegroundColor Yellow
Write-Host "Для остановки сервера нажмите Ctrl+C в этом окне терминала." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green

try {
    # bundle exec jekyll serve --watch --livereload # Добавьте --open-url, если хотите, чтобы браузер открылся автоматически (если поддерживается)
    bundle exec jekyll serve --livereload
}
catch {
    Write-Host "`n? Ошибка при запуске локального сервера: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Процесс завершен." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n? Сервер остановлен." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
