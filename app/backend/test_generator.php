<?php
// backend/test_generator.php

// 1. Убедитесь, что namespace и путь к файлу верны
// Если вы не используете фреймворк с автозагрузкой, вам нужно явно подключить файл:
require_once __DIR__ . '/app/Services/SudokuGenerator.php'; 

use App\Services\SudokuGenerator; // Замените, если ваш namespace другой

header('Content-Type: application/json');

try {
    // 2. Инициализация и запуск генерации
    $generator = new SudokuGenerator();
    $fullGrid = $generator->getNewFullGrid();

    // 3. Проверка (опционально: просто для визуального подтверждения в консоли)
    if (empty($fullGrid) || count($fullGrid) !== 9 || count($fullGrid[0]) !== 9) {
        throw new Exception("Генератор вернул некорректный размер сетки.");
    }
    
    // 4. Отправка результата в формате JSON
    echo json_encode([
        'success' => true,
        'message' => 'Полностью заполненная сетка сгенерирована успешно.',
        'full_grid' => $fullGrid,
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка генерации: ' . $e->getMessage(),
    ]);
}

?>