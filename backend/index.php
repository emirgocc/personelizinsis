<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Kurumsal Personel İzin Yönetim Sistemi Backend
// Otomatik tablo oluşturma, seed data ve REST API

header('Content-Type: application/json');

$db = new PDO('sqlite:'.__DIR__.'/database.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// --- Yardımcı Fonksiyonlar ---
function generateToken($user) {
    // Basit bir token: base64(user_id:email:role:timestamp:random)
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

// --- Tablo ve Seed ---
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
createTables($db);
seedData($db);

// --- Router ---
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// --- /login ---
if ($path == '/login' && $method == 'POST') {
    $input = getInput();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $user = $db->query("SELECT * FROM users WHERE email='".$email."'")->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($password, $user['password'])) {
        response(["error"=>"Geçersiz e-posta veya şifre."], 401);
    }
    $token = generateToken($user);
    response(["token"=>$token, "role"=>$user['role'], "email"=>$user['email']]);
}

// --- Auth gerektiren endpointler ---
$protected = ['/leaves/create','/leaves/mine','/leaves/day','/leaves/pending','/leaves/approve','/teams/update'];
if (in_array($path, $protected)) {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    if (!$token) response(["error"=>"Token gerekli."], 401);
    $user = verifyToken($db, $token);
    if (!$user) response(["error"=>"Geçersiz token."], 401);
}

// --- /leaves/create ---
if ($path == '/leaves/create' && $method == 'POST') {
    $input = getInput();
    $start = $input['start_date'] ?? '';
    $end = $input['end_date'] ?? '';
    $status = 'beklemede';
    // Limit kontrolü
    $team_id = $user['team_id'];
    $team = $db->query("SELECT * FROM teams WHERE id=$team_id")->fetch(PDO::FETCH_ASSOC);
    $max = $team['max_leave_count'];
    $count = $db->query("SELECT COUNT(*) FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date='$start' AND l.status IN ('onaylı','beklemede') AND u.team_id=$team_id")->fetchColumn();
    if ($count >= $max) {
        response(["error"=>"Bu tarihte izin hakkı dolmuştur."], 400);
    }
    $db->exec("INSERT INTO leaves (user_id, start_date, end_date, status) VALUES (".$user['id'].", '$start', '$end', '$status')");
    response(["success"=>true]);
}

// --- /leaves/mine ---
if ($path == '/leaves/mine' && $method == 'GET') {
    $leaves = $db->query("SELECT * FROM leaves WHERE user_id=".$user['id']." ORDER BY start_date DESC")->fetchAll(PDO::FETCH_ASSOC);
    response($leaves);
}

// --- /leaves/day ---
if ($path == '/leaves/day' && $method == 'GET') {
    $date = $_GET['date'] ?? '';
    $team_id = $user['team_id'];
    $leaves = $db->query("SELECT u.email, l.status FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date='$date' AND u.team_id=$team_id")->fetchAll(PDO::FETCH_ASSOC);
    response($leaves);
}

// --- /leaves/pending ---
if ($path == '/leaves/pending' && $method == 'GET') {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $pending = $db->query("SELECT l.id, u.email, l.start_date, l.end_date, l.status FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.status='beklemede' ORDER BY l.start_date")->fetchAll(PDO::FETCH_ASSOC);
    response($pending);
}

// --- /leaves/approve ---
if ($path == '/leaves/approve' && $method == 'POST') {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $leave_id = intval($input['leave_id'] ?? 0);
    $action = $input['action'] ?? '';
    if (!in_array($action, ['onayla','reddet'])) response(["error"=>"Geçersiz işlem."], 400);
    $status = $action == 'onayla' ? 'onaylı' : 'reddedildi';
    $db->exec("UPDATE leaves SET status='$status' WHERE id=$leave_id");
    response(["success"=>true]);
}

// --- /teams/update ---
if ($path == '/teams/update' && $method == 'POST') {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $team_id = intval($input['team_id'] ?? 0);
    $max = intval($input['max_leave_count'] ?? 2);
    $member_count = intval($input['member_count'] ?? 0);
    $db->exec("UPDATE teams SET max_leave_count=$max, member_count=$member_count WHERE id=$team_id");
    response(["success"=>true]);
}

// --- Default ---
if ($path == '/' || $path == '/index.php') {
    response(["status"=>"OK", "message"=>"Kurulum tamamlandı."]);
}

response(["error"=>"Geçersiz istek."], 404);
