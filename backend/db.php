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
    $user = $db->query("SELECT * FROM users WHERE id=".intval($user_id)." AND email='".$email."' AND role='".$role."'")->fetch(PDO::FETCH_ASSOC);
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
function createTables($db) {
    $db->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        team_id INTEGER
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        member_count INTEGER,
        max_leave_count INTEGER
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        status TEXT
    )');
}
function seedData($db) {
    $stmt = $db->query("SELECT COUNT(*) FROM users");
    if ($stmt->fetchColumn() > 0) return;
    $db->exec("INSERT INTO teams (name, member_count, max_leave_count) VALUES
        ('Mavi Takım', 4, 2),
        ('Beyaz Takım', 5, 2)");
    $team1 = $db->query("SELECT id FROM teams WHERE name='Mavi Takım'")->fetchColumn();
    $team2 = $db->query("SELECT id FROM teams WHERE name='Beyaz Takım'")->fetchColumn();
    $db->exec("INSERT INTO users (email, password, role, team_id) VALUES
        ('admin@kurum.com', '".password_hash('admin', PASSWORD_DEFAULT)."', 'admin', $team1),
        ('user@kurum.com', '".password_hash('user', PASSWORD_DEFAULT)."', 'user', $team1)");
    $personeller = [
        ['ali@kurum.com','123',$team1],
        ['ayse@kurum.com','123',$team1],
        ['veli@kurum.com','123',$team2],
        ['zeynep@kurum.com','123',$team2],
        ['mehmet@kurum.com','123',$team2],
    ];
    foreach ($personeller as $p) {
        $db->exec("INSERT INTO users (email, password, role, team_id) VALUES (
            '".$p[0]."', '".password_hash($p[1], PASSWORD_DEFAULT)."', 'user', ".$p[2].")");
    }
    $user1 = $db->query("SELECT id FROM users WHERE email='user@kurum.com'")->fetchColumn();
    $ali = $db->query("SELECT id FROM users WHERE email='ali@kurum.com'")->fetchColumn();
    $veli = $db->query("SELECT id FROM users WHERE email='veli@kurum.com'")->fetchColumn();
    $db->exec("INSERT INTO leaves (user_id, start_date, end_date, status) VALUES
        ($user1, '2025-08-20', '2025-08-20', 'onaylı'),
        ($ali, '2025-08-21', '2025-08-21', 'beklemede'),
        ($veli, '2025-08-22', '2025-08-22', 'onaylı')");
}
