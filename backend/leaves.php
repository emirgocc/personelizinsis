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
    // Tarih aralığı oluştur
    $dates = [];
    if ($start && $end && $start !== $end) {
        $dt = strtotime($start);
        $endDt = strtotime($end);
        while ($dt <= $endDt) {
            $dates[] = date('Y-m-d', $dt);
            $dt = strtotime('+1 day', $dt);
        }
    } else if ($start) {
        $dates[] = $start;
    }
    // Her gün için doluluk kontrolü
    $doluGunler = [];
    foreach ($dates as $d) {
        $count = $db->query("SELECT COUNT(*) FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date='$d' AND l.status IN ('onaylı','beklemede') AND u.team_id=$team_id")->fetchColumn();
        if ($count >= $max) {
            $doluGunler[] = $d;
        }
    }
    if (count($doluGunler) > 0) {
        response(["error"=>"Bazı günlerde izin hakkı dolmuştur.", "full_days"=>$doluGunler], 400);
    }
    // Her gün için izin kaydı oluştur
    foreach ($dates as $d) {
        $db->exec("INSERT INTO leaves (user_id, start_date, end_date, status) VALUES (".$user['id'].", '$d', '$d', '$status')");
    }
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
    $leaves = $db->query("SELECT start_date, end_date FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date <= '$end' AND l.end_date >= '$start' AND u.team_id=$team_id AND l.status = 'onaylı'")->fetchAll(PDO::FETCH_ASSOC);
    $days = [];
    $date = $start;
    while ($date <= $end) {
        $days[$date] = 0;
        $date = date('Y-m-d', strtotime($date . ' +1 day'));
    }
    foreach ($leaves as $row) {
        $s = max($row['start_date'], $start);
        $e = min($row['end_date'], $end);
        $dt = strtotime($s);
        $endDt = strtotime($e);
        while ($dt <= $endDt) {
            $d = date('Y-m-d', $dt);
            if (isset($days[$d])) $days[$d]++;
            $dt = strtotime('+1 day', $dt);
        }
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
