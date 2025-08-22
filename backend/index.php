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
// Tabloları ve örnek verileri oluşturma kodları kaldırıldı. Sadece mevcut veritabanı ile çalışır.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
// Header loglama
file_put_contents('php://stderr', print_r(getallheaders(), true));

// --- /login ---
if ($path == '/login' && $method == 'POST') {
    handleLogin($db);
}

// --- Auth gerektiren endpointler ---
$protected = ['/leaves/create','/leaves/mine','/leaves/remaining','/leaves/day','/leaves/month','/leaves/pending','/leaves/approve','/teams/info','/teams/members','/teams/all','/teams/members-by-team','/teams/team-leave-limit','/teams/update-team-leave-limit','/teams/change-member-team','/teams/test-db'];
if (in_array($path, $protected)) {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = $headers['authorization'] ?? '';
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
// --- /leaves/remaining ---
if ($path == '/leaves/remaining' && $method == 'GET') {
    handleRemainingLeaveDays($db, $user);
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
// --- /teams/info ---
if ($path == '/teams/info' && $method == 'GET') {
    handleTeamInfo($db, $user);
}
// --- /teams/members ---
if ($path == '/teams/members' && $method == 'GET') {
    handleTeamMembers($db, $user);
}
// --- /teams/all ---
if ($path == '/teams/all' && $method == 'GET') {
    handleAllTeams($db, $user);
}
// --- /teams/members-by-team ---
if ($path == '/teams/members-by-team' && $method == 'GET') {
    handleTeamMembersByTeam($db, $user);
}
// --- /teams/team-leave-limit ---
if ($path == '/teams/team-leave-limit' && $method == 'GET') {
    handleGetTeamLeaveLimit($db, $user);
}
// --- /teams/update-team-leave-limit ---
if ($path == '/teams/update-team-leave-limit' && $method == 'POST') {
    handleUpdateTeamLeaveLimit($db, $user);
}
// --- /teams/change-member-team ---
if ($path == '/teams/change-member-team' && $method == 'POST') {
    handleChangeMemberTeam($db, $user);
}
// --- /teams/test-db ---
if ($path == '/teams/test-db' && $method == 'GET') {
    handleTestDB($db, $user);
}
// --- /me ---
if ($path == '/me' && $method == 'GET') {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = $headers['authorization'] ?? '';
    if (!$token) response(["error"=>"Token gerekli."], 401);
    $user = verifyToken($db, $token);
    if (!$user) response(["error"=>"Geçersiz token."], 401);
    response([
        "email" => $user['email'],
        "first_name" => $user['first_name'],
        "last_name" => $user['last_name'],
        "photo" => $user['photo']
    ]);
}
// --- Default ---
if ($path == '/' || $path == '/index.php') {
    response(["status"=>"OK", "message"=>"Kurulum tamamlandı."]);
}
response(["error"=>"Geçersiz istek."], 404);
