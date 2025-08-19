<?php
// teams.php

function handleTeamUpdate($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $team_id = intval($input['team_id'] ?? 0);
    $max = intval($input['max_leave_count'] ?? 2);
    $member_count = intval($input['member_count'] ?? 0);
    $db->exec("UPDATE teams SET max_leave_count=$max, member_count=$member_count WHERE id=$team_id");
    response(["success"=>true]);
}
