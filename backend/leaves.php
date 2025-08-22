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
    
    // Eğer end_date yoksa start_date ile aynı yap
    if (!$end) {
        $end = $start;
    }
    
    // Tarih aralığı oluştur (doluluk kontrolü için)
    $dates = [];
    $dt = strtotime($start);
    $endDt = strtotime($end);
    while ($dt <= $endDt) {
        $dates[] = date('Y-m-d', $dt);
        $dt = strtotime('+1 day', $dt);
    }
    
    // Yıllık izin günleri kontrolü
    $currentYear = date('Y');
    $userInfo = $db->query("SELECT annual_leave_days FROM users WHERE id=".$user['id'])->fetch(PDO::FETCH_ASSOC);
    $annualLimit = $userInfo['annual_leave_days'] ?? 20;
    
    // Bu yıl kullanılan izin günleri
    $usedDays = $db->query("SELECT COUNT(*) FROM leaves WHERE user_id=".$user['id']." AND start_date >= '$currentYear-01-01' AND start_date <= '$currentYear-12-31' AND status IN ('onaylı','beklemede')")->fetchColumn();
    
    // Talep edilen gün sayısı
    $requestedDays = count($dates);
    
    if (($usedDays + $requestedDays) > $annualLimit) {
        response(["error"=>"Yıllık izin günleri aşılıyor. Kalan: " . ($annualLimit - $usedDays) . " gün"], 400);
    }
    
    // Her gün için doluluk kontrolü
    $doluGunler = [];
    foreach ($dates as $d) {
        $count = $db->query("SELECT COUNT(*) FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date <= '$d' AND l.end_date >= '$d' AND l.status IN ('onaylı','beklemede') AND u.team_id=$team_id")->fetchColumn();
        if ($count >= $max) {
            $doluGunler[] = $d;
        }
    }
    
    if (count($doluGunler) > 0) {
        response(["error"=>"Bazı günlerde izin hakkı dolmuştur.", "full_days"=>$doluGunler], 400);
    }
    
    // Tek bir izin kaydı oluştur (tarih aralığı ile)
    $db->exec("INSERT INTO leaves (user_id, start_date, end_date, status, leave_type) VALUES (".$user['id'].", '$start', '$end', '$status', 'yıllık')");
    
    response(["success"=>true]);
}

function handleMyLeaves($db, $user) {
    $leaves = $db->query("SELECT * FROM leaves WHERE user_id=".$user['id']." ORDER BY start_date DESC")->fetchAll(PDO::FETCH_ASSOC);
    response($leaves);
}

function handleLeavesDay($db, $user) {
    $date = $_GET['date'] ?? '';
    $team_id = $user['team_id'];
    
    // O gün için izinli olan kişileri getir (onaylı ve beklemede)
    $leaves = $db->query("SELECT u.id, u.email, u.first_name, u.last_name, l.status FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.start_date <= '$date' AND l.end_date >= '$date' AND u.team_id=$team_id AND l.status IN ('onaylı','beklemede') ORDER BY u.first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
    
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
    
    // Bekleyen izinleri getir ve takım isimlerini ekle
    $pending = $db->query("SELECT l.id, u.email, u.first_name, u.last_name, l.start_date, l.end_date, l.status, u.team_id FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.status='beklemede' ORDER BY l.start_date")->fetchAll(PDO::FETCH_ASSOC);
    
    // Her izin için takım ismini ekle
    foreach ($pending as &$leave) {
        if ($leave['team_id']) {
            // Takım ismini al
            $teamStmt = $db->prepare("SELECT name FROM teams WHERE id = ?");
            $teamStmt->execute([$leave['team_id']]);
            $teamName = $teamStmt->fetchColumn();
            
            if (!empty($teamName)) {
                $leave['team_name'] = 'Ekip ' . $teamName;
            } else {
                $leave['team_name'] = $leave['team_id'] . '. Ekip';
            }
        } else {
            $leave['team_name'] = 'Takım Yok';
        }
    }
    
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

function handleRemainingLeaveDays($db, $user) {
    // Kullanıcının yıllık izin günü limiti
    $userInfo = $db->query("SELECT annual_leave_days FROM users WHERE id=".$user['id'])->fetch(PDO::FETCH_ASSOC);
    $annualLimit = $userInfo['annual_leave_days'] ?? 20;
    
    // Bu yıl kullanılan izin günleri (sadece onaylı)
    $currentYear = date('Y');
    $usedDays = $db->query("SELECT COUNT(*) FROM leaves WHERE user_id=".$user['id']." AND start_date >= '$currentYear-01-01' AND start_date <= '$currentYear-12-31' AND status = 'onaylı'")->fetchColumn();
    
    // Kalan izin günleri
    $remainingDays = $annualLimit - $usedDays;
    
    response([
        "annual_limit" => $annualLimit,
        "used_days" => $usedDays,
        "remaining_days" => $remainingDays
    ]);
}
