<?php
/**
 * Test database connectivity and permissions
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$result = [
    'php_version' => phpversion(),
    'sqlite_available' => extension_loaded('pdo_sqlite'),
    'backend_dir' => dirname(__DIR__),
    'backend_writable' => is_writable(dirname(__DIR__)),
];

try {
    $dbPath = dirname(__DIR__) . '/sudoku_games.db';
    $result['db_path'] = $dbPath;
    $result['db_dir_exists'] = is_dir(dirname($dbPath));
    $result['db_dir_writable'] = is_writable(dirname($dbPath));
    
    // Try to create/access database
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $result['db_connection'] = 'success';
    
    // Check if table exists
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='game_results'");
    $result['table_exists'] = $stmt->fetchColumn() ? true : false;
    
    // Create table if needed
    if (!$result['table_exists']) {
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
        $result['table_created'] = true;
    }
    
    $result['success'] = true;
} catch (Exception $e) {
    $result['success'] = false;
    $result['error'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
