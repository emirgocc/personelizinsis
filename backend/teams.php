<?php
// teams.php

function handleTeamUpdate($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $max = intval($input['max_leave_count'] ?? 2);
    $team_id = $user['team_id'];
    $db->exec("UPDATE teams SET max_leave_count=$max WHERE id=$team_id");
    response(["success"=>true]);
}

function handleTeamInfo($db, $user) {
    $team_id = $user['team_id'];
    $team = $db->query("SELECT * FROM teams WHERE id=$team_id")->fetch(PDO::FETCH_ASSOC);
    response($team);
}

function handleTeamMembers($db, $user) {
    $team_id = $user['team_id'];
    $members = $db->query("SELECT id, email, first_name, last_name, role FROM users WHERE team_id=$team_id ORDER BY role DESC, first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
    response($members);
}
