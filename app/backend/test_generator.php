<?php
declare(strict_types=1);

// quick smoke test for generator
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/public/app/src/SudokuGenerator.php';

use SudokuApp\Backend\SudokuGenerator;

try {
    $generator = new SudokuGenerator();

    // Try generating puzzles with different difficulties
    $difficulties = ['easy', 'medium', 'hard'];
    $results = [];

    foreach ($difficulties as $diff) {
        $data = $generator->generateNewGame($diff);
        $ok = isset($data['puzzle']) && is_array($data['puzzle']) && count($data['puzzle']) === 9;
        $results[$diff] = $ok ? ['ok' => true, 'puzzle' => $data['puzzle']] : ['ok' => false, 'message' => 'invalid output'];
    }

    echo json_encode(['success' => true, 'results' => $results]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    error_log('test_generator.php error: ' . $e->getMessage());
}