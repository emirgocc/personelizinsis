<?php
// auth.php

function handleLogin($db) {
    $input = getInput();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    // SQL injection koruması için prepared statement kullan
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        response(["error"=>"Geçersiz e-posta veya şifre."], 401);
    }
    
    $token = generateToken($user);
    response(["token"=>$token, "role"=>$user['role'], "email"=>$user['email']]);
}
