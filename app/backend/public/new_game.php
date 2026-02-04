<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

session_start();

require_once __DIR__ . '/app/src/SudokuGenerator.php';

use SudokuApp\Backend\SudokuGenerator;

$allowed = ['easy', 'medium', 'hard'];
$difficulty = $_GET['difficulty'] ?? 'medium';
if (!in_array($difficulty, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid difficulty']);
    exit;
}

try {
    if (isset($_SESSION['sudoku_game']) && isset($_SESSION['sudoku_game']['difficulty']) && $_SESSION['sudoku_game']['difficulty'] === $difficulty) {
        $cached = $_SESSION['sudoku_game'];
        echo json_encode([
            'success' => true,
            'difficulty' => $difficulty,
            'puzzle' => $cached['puzzle'],
            'solution' => $cached['solution'] ?? null,
            'fromCache' => true
        ]);
        exit;
    }

    $generator = new SudokuGenerator();
    $gameData = $generator->generateNewGame($difficulty);

    if (!isset($gameData['puzzle']) || !is_array($gameData['puzzle'])) {
        throw new Exception('Generator returned invalid data');
    }

    $_SESSION['sudoku_game'] = [
        'difficulty' => $difficulty,
        'puzzle' => $gameData['puzzle'],
        'solution' => $gameData['solution'] ?? null,
        'created_at' => time()
    ];

    echo json_encode([
        'success' => true,
        'difficulty' => $difficulty,
        'puzzle' => $gameData['puzzle'],
        'solution' => $gameData['solution'] ?? null,
        'fromCache' => false
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error while generating puzzle']);
    error_log('new_game.php error: ' . $e->getMessage());
}