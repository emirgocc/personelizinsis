<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json');
require_once __DIR__.'/db.php';
require_once __DIR__.'/auth.php';
require_once __DIR__.'/leaves.php';
require_once __DIR__.'/teams.php';
createTables($db);
seedData($db);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// --- /login ---
if ($path == '/login' && $method == 'POST') {
    handleLogin($db);
}

// --- Auth gerektiren endpointler ---
$protected = ['/leaves/create','/leaves/mine','/leaves/day','/leaves/month','/leaves/pending','/leaves/approve','/teams/update'];
if (in_array($path, $protected)) {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    if (!$token) response(["error"=>"Token gerekli."], 401);
    $user = verifyToken($db, $token);
    if (!$user) response(["error"=>"Geçersiz token."], 401);
}

// --- /leaves/create ---
if ($path == '/leaves/create' && $method == 'POST') {
    handleCreateLeave($db, $user);
}
// --- /leaves/mine ---
if ($path == '/leaves/mine' && $method == 'GET') {
    handleMyLeaves($db, $user);
}
// --- /leaves/day ---
if ($path == '/leaves/day' && $method == 'GET') {
    handleLeavesDay($db, $user);
}
// --- /leaves/month ---
if ($path == '/leaves/month' && $method == 'GET') {
    handleLeavesMonth($db, $user);
}
// --- /leaves/pending ---
if ($path == '/leaves/pending' && $method == 'GET') {
    handleLeavesPending($db, $user);
}
// --- /leaves/approve ---
if ($path == '/leaves/approve' && $method == 'POST') {
    handleLeavesApprove($db, $user);
}
// --- /teams/update ---
if ($path == '/teams/update' && $method == 'POST') {
    handleTeamUpdate($db, $user);
}
// --- Default ---
if ($path == '/' || $path == '/index.php') {
    response(["status"=>"OK", "message"=>"Kurulum tamamlandı."]);
}
response(["error"=>"Geçersiz istek."], 404);
