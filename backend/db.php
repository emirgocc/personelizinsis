<?php
// db.php

$db = new PDO('sqlite:'.__DIR__.'/database.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function generateToken($user) {
    $payload = $user['id'].':'.$user['email'].':'.$user['role'].':'.time().':'.bin2hex(random_bytes(8));
    return base64_encode($payload);
}
function verifyToken($db, $token) {
    $payload = base64_decode($token);
    $parts = explode(':', $payload);
    if (count($parts) < 3) return false;
    $user_id = $parts[0];
    $email = $parts[1];
    $role = $parts[2];
    
    // SQL injection koruması için prepared statement kullan
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND email = ? AND role = ?");
    $stmt->execute([intval($user_id), $email, $role]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user ?: false;
}
function getInput() {
    return json_decode(file_get_contents('php://input'), true);
}
function response($data, $code=200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}
