<?php
// leaves.php

function handleCreateLeave($db, $user) {
    $input = getInput();
    $start = $input['start_date'] ?? '';
    $end = $input['end_date'] ?? '';
    $status = 'beklemede';
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

function handleMyLeaves($db, $user) {
    $leaves = $db->query("SELECT * FROM leaves WHERE user_id=".$user['id']." ORDER BY start_date DESC")->fetchAll(PDO::FETCH_ASSOC);
    response($leaves);
}

function handleLeavesDay($db, $user) {
    $date = $_GET['date'] ?? '';
    $team_id = $user['team_id'];
    $leaves = $db->query("SELECT u.email, l.status FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date='$date' AND u.team_id=$team_id")->fetchAll(PDO::FETCH_ASSOC);
    response($leaves);
}

function handleLeavesMonth($db, $user) {
    $month = $_GET['month'] ?? '';
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        response(["error" => "Geçersiz ay formatı."], 400);
    }
    $team_id = $user['team_id'];
    $start = $month . '-01';
    $end = date('Y-m-t', strtotime($start));
    $stmt = $db->prepare("SELECT start_date, COUNT(*) as count FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date BETWEEN :start AND :end AND u.team_id=:team_id AND l.status IN ('onaylı','beklemede') GROUP BY l.start_date");
    $stmt->execute([':start' => $start, ':end' => $end, ':team_id' => $team_id]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $days = [];
    $date = $start;
    while ($date <= $end) {
        $days[$date] = 0;
        $date = date('Y-m-d', strtotime($date . ' +1 day'));
    }
    foreach ($result as $row) {
        $days[$row['start_date']] = intval($row['count']);
    }
    response($days);
}

function handleLeavesPending($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $pending = $db->query("SELECT l.id, u.email, l.start_date, l.end_date, l.status FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.status='beklemede' ORDER BY l.start_date")->fetchAll(PDO::FETCH_ASSOC);
    response($pending);
}

function handleLeavesApprove($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    $input = getInput();
    $leave_id = intval($input['leave_id'] ?? 0);
    $action = $input['action'] ?? '';
    if (!in_array($action, ['onayla','reddet'])) response(["error"=>"Geçersiz işlem."], 400);
    $status = $action == 'onayla' ? 'onaylı' : 'reddedildi';
    $db->exec("UPDATE leaves SET status='$status' WHERE id=$leave_id");
    response(["success"=>true]);
}
