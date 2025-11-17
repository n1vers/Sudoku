<?php
/**
 * Simple test endpoint to verify database operations
 * GET /test_save.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $dbPath = dirname(__DIR__) . '/sudoku_games.db';
    
    // Check directory and file
    $dbDir = dirname($dbPath);
    $result = [
        'backend_dir' => $dbDir,
        'backend_exists' => is_dir($dbDir),
        'backend_writable' => is_writable($dbDir),
        'db_path' => $dbPath,
        'db_exists' => file_exists($dbPath),
    ];
    
    // Try to connect
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $result['connection'] = 'success';
    
    // Create table
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
    $result['table'] = 'created_or_exists';
    
    // Insert test record
    $stmt = $pdo->prepare("
        INSERT INTO game_results (nickname, difficulty, time_seconds, was_auto_filled)
        VALUES (:nickname, :difficulty, :time, :wasAutoFilled)
    ");
    
    $stmt->execute([
        ':nickname' => 'Test User',
        ':difficulty' => 'medium',
        ':time' => 123,
        ':wasAutoFilled' => 0
    ]);
    
    $result['insert'] = 'success';
    $result['last_id'] = $pdo->lastInsertId();
    
    // Query records
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM game_results");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $result['total_records'] = $row['count'];
    
    $result['success'] = true;
    
} catch (Exception $e) {
    $result['success'] = false;
    $result['error'] = $e->getMessage();
    $result['error_trace'] = $e->getTraceAsString();
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
