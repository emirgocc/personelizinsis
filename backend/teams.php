<?php
// teams.php

function handleTeamUpdate($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $max = intval($input['max_leave_count'] ?? 2);
    $team_id = intval($input['team_id'] ?? 0);
    
    if (!$team_id) response(["error"=>"Takım ID gerekli."], 400);
    
    $db->exec("UPDATE teams SET max_leave_count=$max WHERE id=$team_id");
    response(["success"=>true]);
}

function handleTeamInfo($db, $user) {
    if ($user['role'] == 'admin') {
        // Admin tüm takımları görebilir
        $teams = $db->query("SELECT * FROM teams ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        response($teams);
    } else {
        // Normal kullanıcı sadece kendi takımını görebilir
        $team_id = $user['team_id'];
        $team = $db->query("SELECT * FROM teams WHERE id=$team_id")->fetch(PDO::FETCH_ASSOC);
        response($team);
    }
}

function handleTeamMembers($db, $user) {
    if ($user['role'] == 'admin') {
        // Admin tüm personelleri görebilir
        $members = $db->query("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.hire_date, u.annual_leave_days, t.name as team_name FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.role != 'admin' ORDER BY t.name, u.first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
        response($members);
    } else {
        // Normal kullanıcı sadece kendi takımını görebilir
        $team_id = $user['team_id'];
        $members = $db->query("SELECT id, email, first_name, last_name, role FROM users WHERE team_id=$team_id ORDER BY role DESC, first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
        response($members);
    }
}

// Admin için tüm takımları getir
function handleAllTeams($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $teams = $db->query("SELECT * FROM teams ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
    response($teams);
}

// Admin için belirli takımın üyelerini getir
function handleTeamMembersByTeam($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $team_id = intval($_GET['team_id'] ?? 0);
    if (!$team_id) response(["error"=>"Takım ID gerekli."], 400);
    
    $members = $db->query("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.hire_date, u.annual_leave_days FROM users u WHERE u.team_id=$team_id ORDER BY u.first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
    response($members);
}
