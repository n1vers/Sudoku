<?php
// sudoku/app/backend/public/new_game.php

session_start(); // ⚠️ обязательно для хранения текущей игры

// Путь к классу SudokuGenerator
require_once __DIR__ . '/app/src/SudokuGenerator.php'; 

use SudokuApp\Backend\SudokuGenerator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET');

try {
    // Получаем уровень сложности из GET-параметра (по умолчанию "medium")
    $difficulty = $_GET['difficulty'] ?? 'medium';
    
    // Если игра уже есть в сессии, возвращаем её
    if (isset($_SESSION['sudoku_grid'])) {
        echo json_encode([
            'success' => true,
            'difficulty' => $difficulty,
            'puzzle' => $_SESSION['sudoku_grid'],
            'fromCache' => true
        ]);
        exit;
    }

    // Если нет сохранённой сетки, генерируем новую
    $generator = new SudokuGenerator();
    
    // Генерация новой загадки
    $gameData = $generator->generateNewGame($difficulty);

    // Сохраняем в сессии для последующей загрузки
    $_SESSION['sudoku_grid'] = $gameData['puzzle'];

    // Отправляем на фронтенд только загадку
    echo json_encode([
        'success' => true,
        'difficulty' => $difficulty,
        'puzzle' => $gameData['puzzle'],
        'fromCache' => false
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера: ' . $e->getMessage(),
    ]);
}
