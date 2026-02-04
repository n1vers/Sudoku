<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/sudoku_games.db';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS game_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
            time_seconds INTEGER NOT NULL,
            was_auto_filled BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("
        CREATE INDEX IF NOT EXISTS idx_nickname_difficulty 
        ON game_results(nickname, difficulty)
    ");

    $pdo->exec("
        CREATE INDEX IF NOT EXISTS idx_difficulty_time 
        ON game_results(difficulty, time_seconds)
    ");

    echo json_encode(['success' => true, 'message' => 'Database initialized']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit;
}
?>
