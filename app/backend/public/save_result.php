<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
        exit;
    }

    $nickname = $input['nickname'] ?? '';
    $difficulty = $input['difficulty'] ?? null;
    $time = $input['time'] ?? null;
    $wasAutoFilled = $input['wasAutoFilled'] ?? false;

    if (!is_string($nickname)) $nickname = '';
    $nickname = trim($nickname);

    if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid difficulty']);
        exit;
    }

    if (!is_numeric($time) || $time <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Time must be a positive number']);
        exit;
    }

    $dbPath = dirname(__DIR__) . '/sudoku_games.db';
    
    $dbDir = dirname($dbPath);
    if (!is_writable($dbDir)) {
        throw new Exception("Database directory is not writable: " . $dbDir . " (permissions: " . decoct(fileperms($dbDir)) . ")");
    }
    
    try {
        $pdo = new PDO('sqlite:' . $dbPath);
    } catch (PDOException $e) {
        throw new Exception("Failed to connect to SQLite database at " . $dbPath . ": " . $e->getMessage());
    }
    
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

        try {
            try {
                $row = $pdo->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM game_results")->fetch(PDO::FETCH_ASSOC);
                $nextId = $row && isset($row['next_id']) ? (int)$row['next_id'] : time();
            } catch (Throwable $e) {
                $nextId = time();
            }

            if ($nickname === '') {
                $nickname = 'anonymous' . $nextId;
            }

            if (strlen($nickname) > 50) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nickname is too long']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO game_results (nickname, difficulty, time_seconds, was_auto_filled) VALUES (:nickname, :difficulty, :time, :wasAutoFilled)");
            $stmt->execute([
                ':nickname' => $nickname,
                ':difficulty' => $difficulty,
                ':time' => (int)$time,
                ':wasAutoFilled' => $wasAutoFilled ? 1 : 0
            ]);

            $resultId = $pdo->lastInsertId();
        } catch (PDOException $e) {
            try {
                $jsonPath = dirname(__DIR__) . '/results.json';
                if (!file_exists($jsonPath)) {
                    file_put_contents($jsonPath, json_encode([]));
                }

                $fp = fopen($jsonPath, 'c+');
                if (!$fp) {
                    throw new Exception('Failed to open fallback results file');
                }

                if (!flock($fp, LOCK_EX)) {
                    fclose($fp);
                    throw new Exception('Failed to lock fallback results file');
                }

                $contents = stream_get_contents($fp);
                $data = $contents ? json_decode($contents, true) : [];
                if (!is_array($data)) $data = [];

                $maxId = 0;
                foreach ($data as $r) {
                    if (isset($r['id']) && is_numeric($r['id'])) {
                        $maxId = max($maxId, (int)$r['id']);
                    }
                }
                $newId = $maxId + 1;

                if ($nickname === '') {
                    $nickname = 'anonymous' . $newId;
                }

                if (strlen($nickname) > 50) {
                    flock($fp, LOCK_UN);
                    fclose($fp);
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Nickname is too long']);
                    exit;
                }

                $record = [
                    'id' => $newId,
                    'nickname' => $nickname,
                    'difficulty' => $difficulty,
                    'time_seconds' => (int)$time,
                    'was_auto_filled' => $wasAutoFilled ? 1 : 0,
                    'created_at' => date('Y-m-d H:i:s')
                ];

                $data[] = $record;

                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                fflush($fp);
                flock($fp, LOCK_UN);
                fclose($fp);

                $resultId = $newId;
            } catch (Throwable $e2) {
                http_response_code(500);
                $errorMsg = 'Fallback storage error: ' . $e2->getMessage();
                error_log('save_result.php fallback error: ' . $errorMsg);
                echo json_encode(['success' => false, 'message' => $errorMsg]);
                exit;
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Game result saved',
            'resultId' => $resultId,
            'nickname' => $nickname
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        $errorMsg = 'Database error: ' . $e->getMessage();
        error_log('save_result.php PDO error: ' . $errorMsg);
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    } catch (Throwable $e) {
        http_response_code(500);
        $errorMsg = 'Server error: ' . $e->getMessage();
        error_log('save_result.php error: ' . $errorMsg);
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    }
    ?>
