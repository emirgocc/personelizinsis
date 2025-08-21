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
    
    // Her takıma ID'ye göre isim ata
    foreach ($teams as &$team) {
        $team['display_name'] = $team['id'] . '. Ekip';
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
