<?php
// teams.php

function handleTeamInfo($db, $user) {
    if ($user['role'] == 'admin') {
        // Admin tüm takımları görebilir
        $teams = $db->query("SELECT * FROM teams ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
        
        // Her takıma ID'ye göre isim ata
        foreach ($teams as &$team) {
            $team['display_name'] = $team['id'] . '. Ekip';
        }
        
        response($teams);
    } else {
        // Normal kullanıcı sadece kendi takımını görebilir
        $team_id = $user['team_id'];
        $team = $db->query("SELECT * FROM teams WHERE id=$team_id")->fetch(PDO::FETCH_ASSOC);
        
        if ($team) {
            $team['display_name'] = $team['id'] . '. Ekip';
        }
        
        response($team);
    }
}

function handleTeamMembers($db, $user) {
    if ($user['role'] == 'admin') {
        // Admin tüm personelleri görebilir
        $members = $db->query("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.hire_date, u.annual_leave_days, u.team_id FROM users u WHERE u.role != 'admin' ORDER BY u.team_id, u.first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
        
        // Her personel için kalan izin günlerini hesapla
        foreach ($members as &$member) {
            if ($member['team_id']) {
                $member['team_name'] = $member['team_id'] . '. Ekip';
            } else {
                $member['team_name'] = 'Takım Yok';
            }
            
            // Kalan izin günlerini hesapla
            $annualLimit = $member['annual_leave_days'] ?? 20;
            $currentYear = date('Y');
            $usedDays = $db->query("SELECT COUNT(*) FROM leaves WHERE user_id=".$member['id']." AND start_date >= '$currentYear-01-01' AND start_date <= '$currentYear-12-31' AND status = 'onaylı'")->fetchColumn();
            $member['remaining_leave_days'] = $annualLimit - $usedDays;
        }
        
        response($members);
    } else {
        // Normal kullanıcı sadece kendi takımını görebilir
        $team_id = $user['team_id'];
        $members = $db->query("SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.annual_leave_days FROM users u WHERE u.team_id=$team_id ORDER BY u.role DESC, u.first_name ASC")->fetchAll(PDO::FETCH_ASSOC);
        
        // Her personel için kalan izin günlerini hesapla
        foreach ($members as &$member) {
            $annualLimit = $member['annual_leave_days'] ?? 20;
            $currentYear = date('Y');
            $usedDays = $db->query("SELECT COUNT(*) FROM leaves WHERE user_id=".$member['id']." AND start_date >= '$currentYear-01-01' AND start_date <= '$currentYear-12-31' AND status = 'onaylı'")->fetchColumn();
            $member['remaining_leave_days'] = $annualLimit - $usedDays;
        }
        
        response($members);
    }
}

// Admin için tüm takımları getir
function handleAllTeams($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $teams = $db->query("SELECT * FROM teams ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
    
    // Her takıma ID'ye göre isim ata (name sütunu kaldırıldı)
    foreach ($teams as &$team) {
        $team['name'] = $team['id'] . '. Ekip';
    }
    
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

// Takım bazında günlük izin limiti ayarını getir
function handleGetTeamLeaveLimit($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $team_id = intval($_GET['team_id'] ?? 0);
    if (!$team_id) response(["error"=>"Takım ID gerekli."], 400);
    
    $stmt = $db->prepare("SELECT max_leave_count FROM teams WHERE id = ?");
    $stmt->execute([$team_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        response(["error" => "Takım bulunamadı."], 404);
    }
    
    response(["max_leave_count" => intval($result['max_leave_count'])]);
}

// Takım bazında günlük izin limiti ayarını güncelle
function handleUpdateTeamLeaveLimit($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $team_id = intval($input['team_id'] ?? 0);
    $max_leave_count = intval($input['max_leave_count'] ?? 2);
    
    // Debug log
    error_log("handleUpdateTeamLeaveLimit called with team_id: $team_id, max_leave_count: $max_leave_count");
    error_log("Input data: " . json_encode($input));
    
    if (!$team_id) {
        error_log("Error: Takım ID gerekli");
        response(["error" => "Takım ID gerekli."], 400);
    }
    
    if ($max_leave_count < 1 || $max_leave_count > 10) {
        error_log("Error: Günlük izin limiti 1-10 arasında olmalıdır");
        response(["error" => "Günlük izin limiti 1-10 arasında olmalıdır."], 400);
    }
    
    try {
        // Transaction başlat
        $db->beginTransaction();
        
        // Takımın varlığını kontrol et (name sütunu yok, sadece id kullan)
        $stmt = $db->prepare("SELECT id FROM teams WHERE id = ?");
        $stmt->execute([$team_id]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$team) {
            error_log("Error: Takım bulunamadı, team_id: $team_id");
            $db->rollBack();
            response(["error" => "Takım bulunamadı."], 404);
        }
        
        error_log("Takım bulundu: " . json_encode($team));
        
        // Günlük izin limitini güncelle
        $stmt = $db->prepare("UPDATE teams SET max_leave_count = ? WHERE id = ?");
        $result = $stmt->execute([$max_leave_count, $team_id]);
        
        if ($result) {
            // Transaction'ı commit et
            $db->commit();
            
            error_log("Veritabanı güncelleme başarılı: team_id=$team_id, max_leave_count=$max_leave_count");
            
            // Güncellenen veriyi kontrol et
            $checkStmt = $db->prepare("SELECT max_leave_count FROM teams WHERE id = ?");
            $checkStmt->execute([$team_id]);
            $updatedValue = $checkStmt->fetchColumn();
            error_log("Güncellenmiş değer kontrol edildi: $updatedValue");
            
            response([
                "success" => true, 
                "message" => "Takım ID {$team_id} günlük izin limiti {$max_leave_count} olarak güncellendi.",
                "max_leave_count" => $max_leave_count
            ]);
        } else {
            $db->rollBack();
            error_log("Veritabanı güncelleme hatası: " . json_encode($stmt->errorInfo()));
            response(["error" => "Veritabanı güncelleme hatası."], 500);
        }
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Exception in handleUpdateTeamLeaveLimit: " . $e->getMessage());
        response(["error" => "Veritabanı hatası: " . $e->getMessage()], 500);
    }
}

// Personel ekip değişikliği
function handleChangeMemberTeam($db, $user) {
    if ($user['role'] != 'admin') response(["error"=>"Yetki yok."], 403);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $memberId = intval($input['member_id'] ?? 0);
    $newTeamId = intval($input['new_team_id'] ?? 0);
    
    // Debug log
    error_log("handleChangeMemberTeam called with member_id: $memberId, new_team_id: $newTeamId");
    error_log("Input data: " . json_encode($input));
    
    if (!$memberId) {
        error_log("Error: Personel ID gerekli");
        response(["error" => "Personel ID gerekli."], 400);
    }
    
    if (!$newTeamId) {
        error_log("Error: Yeni takım ID gerekli");
        response(["error" => "Yeni takım ID gerekli."], 400);
    }
    
    try {
        // Transaction başlat
        $db->beginTransaction();
        
        // Personelin mevcut durumunu kontrol et
        $stmt = $db->prepare("SELECT id, first_name, last_name, team_id FROM users WHERE id = ? AND role != 'admin'");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$member) {
            error_log("Error: Personel bulunamadı, member_id: $memberId");
            $db->rollBack();
            response(["error" => "Personel bulunamadı."], 404);
        }
        
        error_log("Personel bulundu: " . json_encode($member));
        
        // Yeni takımın varlığını kontrol et (name sütunu yok, sadece id kullan)
        $stmt = $db->prepare("SELECT id FROM teams WHERE id = ?");
        $stmt->execute([$newTeamId]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$team) {
            error_log("Error: Geçersiz takım ID, new_team_id: $newTeamId");
            $db->rollBack();
            response(["error" => "Geçersiz takım ID."], 400);
        }
        
        error_log("Yeni takım bulundu: " . json_encode($team));
        
        // Ekip değişikliğini yap
        $stmt = $db->prepare("UPDATE users SET team_id = ? WHERE id = ?");
        $result = $stmt->execute([$newTeamId, $memberId]);
        
        if ($result) {
            // Transaction'ı commit et
            $db->commit();
            
            error_log("Personel ekip değişikliği başarılı: member_id=$memberId, new_team_id=$newTeamId");
            
            // Güncellenen veriyi kontrol et
            $checkStmt = $db->prepare("SELECT team_id FROM users WHERE id = ?");
            $checkStmt->execute([$memberId]);
            $updatedValue = $checkStmt->fetchColumn();
            error_log("Güncellenmiş team_id kontrol edildi: $updatedValue");
            
            response([
                "success" => true, 
                "message" => "{$member['first_name']} {$member['last_name']} personeli {$newTeamId}. ekibine atandı."
            ]);
        } else {
            $db->rollBack();
            error_log("Personel ekip değişikliği hatası: " . json_encode($stmt->errorInfo()));
            response(["error" => "Ekip değişikliği yapılamadı."], 500);
        }
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Exception in handleChangeMemberTeam: " . $e->getMessage());
        response(["error" => "Veritabanı hatası: " . $e->getMessage()], 500);
    }
}

// Test endpoint - veritabanı bağlantısını kontrol et
function handleTestDB($db, $user) {
    try {
        // Teams tablosunu kontrol et
        $teams = $db->query("SELECT * FROM teams")->fetchAll(PDO::FETCH_ASSOC);
        error_log("Teams table contents: " . json_encode($teams));
        
        // Users tablosunu kontrol et
        $users = $db->query("SELECT id, email, team_id FROM users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        error_log("Users table sample: " . json_encode($users));
        
        response([
            "teams_count" => count($teams),
            "users_count" => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
            "teams" => $teams,
            "users_sample" => $users
        ]);
    } catch (Exception $e) {
        error_log("Test DB error: " . $e->getMessage());
        response(["error" => $e->getMessage()], 500);
    }
}
