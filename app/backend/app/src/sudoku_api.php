<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'save') {
        if (!isset($input['grid'])) {
            http_response_code(400);
            echo json_encode(["error" => "Grid is required"]);
            exit;
        }
        $_SESSION['sudoku_grid'] = $input['grid'];
        echo json_encode(["status" => "saved"]);
        exit;
    }

    if ($action === 'clear') {
        unset($_SESSION['sudoku_grid']);
        echo json_encode(["status" => "cleared"]);
        exit;
    }

} elseif ($method === 'GET' && $action === 'load') {
    if (isset($_SESSION['sudoku_grid'])) {
        echo json_encode(["grid" => $_SESSION['sudoku_grid']]);
    } else {
        echo json_encode(["grid" => null]);
    }
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Invalid request"]);
