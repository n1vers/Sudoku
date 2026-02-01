<?php
// Разрешаем запросы с фронтенда
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Если это предварительный запрос от браузера (OPTIONS), просто выходим
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$db_file = 'users_list.json'; // Файл создастся сам

// Получаем данные из тела запроса
$input = file_get_contents("php://input");
$data = json_decode($input, true);
$action = $_GET['action'] ?? '';

if (!$data || !isset($data['nickname']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Данные не получены. JSON: " . $input]);
    exit;
}

$nickname = trim($data['nickname']);
$password = $data['password'];

// Читаем базу (если файла нет — создаем пустой массив)
$users = file_exists($db_file) ? json_decode(file_get_contents($db_file), true) : [];

if ($action === 'register') {
    if (isset($users[$nickname])) {
        echo json_encode(["success" => false, "message" => "Этот ник уже занят"]);
    } else {
        $users[$nickname] = password_hash($password, PASSWORD_DEFAULT);
        file_put_contents($db_file, json_encode($users));
        echo json_encode(["success" => true]);
    }
} elseif ($action === 'login') {
    if (isset($users[$nickname]) && password_verify($password, $users[$nickname])) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Неверный ник или пароль"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Неизвестное действие"]);
}