<?php
// sudoku/app/backend/public/new_game.php

// Путь к классу SudokuGenerator
require_once __DIR__ . '/../src/SudokuGenerator.php'; 

use SudokuApp\Backend\SudokuGenerator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET');

try {
    // Получаем уровень сложности из GET-параметра (по умолчанию "medium")
    $difficulty = $_GET['difficulty'] ?? 'medium';
    
    $generator = new SudokuGenerator();
    
    // 💡 Генерируем загадку и её решение
    $gameData = $generator->generateNewGame($difficulty);

    // В реальном проекте: сохраните $gameData['solution'] в MySQL
    
    // Отправляем на фронтенд только загадку, ID игры и решение НЕ отправляется
    echo json_encode([
        'success' => true,
        'difficulty' => $difficulty,
        'puzzle' => $gameData['puzzle'],
        // 'game_id' => 123 // Здесь должен быть ID из MySQL
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([-*-
        'success' => false,
        'message' => 'Ошибка сервера: ' . $e->getMessage(),
    ]);
}