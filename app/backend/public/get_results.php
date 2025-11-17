<?php
/**
 * Get game results from database
 * GET /get_results.php?difficulty=easy|medium|hard&limit=10
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Get parameters
    $difficulty = $_GET['difficulty'] ?? null;
    $limit = (int)($_GET['limit'] ?? 10);
    
    // Validate limit
    if ($limit < 1 || $limit > 100) {
        $limit = 10;
    }

    // Database setup
    $dbPath = dirname(__DIR__) . '/sudoku_games.db';
    
    if (!file_exists($dbPath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Database not found', 'results' => []]);
        exit;
    }

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Build query
    $query = "SELECT nickname, difficulty, time_seconds, was_auto_filled, created_at FROM game_results";
    $params = [];

    if ($difficulty && in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
        $query .= " WHERE difficulty = :difficulty";
        $params[':difficulty'] = $difficulty;
    }

    // Order by time ascending (fastest first)
    $query .= " ORDER BY time_seconds ASC LIMIT :limit";
    $params[':limit'] = $limit;

    $stmt = $pdo->prepare($query);
    
    // Bind limit as integer
    foreach ($params as $key => $value) {
        if ($key === ':limit') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value);
        }
    }

    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format results for frontend
    $formattedResults = [];
    foreach ($results as $row) {
        $minutes = floor($row['time_seconds'] / 60);
        $seconds = $row['time_seconds'] % 60;
        $timeStr = sprintf('%02d:%02d', $minutes, $seconds);

        $difficultyLabel = [
            'easy' => 'Easy',
            'medium' => 'Medium',
            'hard' => 'Hard'
        ][$row['difficulty']] ?? 'Unknown';

        $formattedResults[] = [
            'nickname' => $row['nickname'],
            'time' => $timeStr,
            'time_seconds' => (int)$row['time_seconds'],
            'difficulty' => $difficultyLabel,
            'was_auto_filled' => (bool)$row['was_auto_filled'],
            'created_at' => $row['created_at']
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'results' => $formattedResults,
        'count' => count($formattedResults)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_results.php PDO error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error', 'results' => []]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('get_results.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error', 'results' => []]);
}
?>
