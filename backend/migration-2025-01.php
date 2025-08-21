<?php
// migration-2025-01.php
// Bu script mevcut veritabanına yeni alanlar ekler ve admin yapısını günceller
// Mevcut verileri silmez, sadece eksik sütunları ekler ve yapıyı günceller

try {
    $db = new PDO('sqlite:' . __DIR__ . '/database.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Migration başlatılıyor...\n";

    // Sütun ekleme fonksiyonu
    function addColumnIfNotExists($db, $table, $column, $type) {
        $exists = $db->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
        $found = false;
        foreach ($exists as $col) {
            if ($col['name'] === $column) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            $db->exec("ALTER TABLE $table ADD COLUMN $column $type");
            echo "$column sütunu eklendi.\n";
        } else {
            echo "$column zaten var.\n";
        }
    }

    // 1. Users tablosuna yeni sütunlar ekle
    echo "\n1. Users tablosuna yeni sütunlar ekleniyor...\n";
    addColumnIfNotExists($db, 'users', 'hire_date', 'TEXT');
    addColumnIfNotExists($db, 'users', 'annual_leave_days', 'INTEGER');

    // 2. Mevcut kullanıcılara varsayılan değerler ata
    echo "\n2. Mevcut kullanıcılara varsayılan değerler atanıyor...\n";
    
    // Tüm kullanıcıları al
    $users = $db->query("SELECT id, hire_date, annual_leave_days FROM users")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        if (!$user['hire_date']) {
            // Varsayılan olarak 2020-01-01 tarihini ata (5 yıldan eski = 25 gün)
            $db->exec("UPDATE users SET hire_date = '2020-01-01' WHERE id = " . $user['id']);
            echo "Kullanıcı ID " . $user['id'] . " için varsayılan işe giriş tarihi atandı.\n";
        }
        
        if (!$user['annual_leave_days']) {
            // Varsayılan olarak 20 gün ata
            $db->exec("UPDATE users SET annual_leave_days = 20 WHERE id = " . $user['id']);
            echo "Kullanıcı ID " . $user['id'] . " için varsayılan yıllık izin günleri atandı.\n";
        }
    }

    // 3. Admin kullanıcıların team_id'sini NULL yap
    echo "\n3. Admin kullanıcıların takım bağlantısı kaldırılıyor...\n";
    $adminCount = $db->exec("UPDATE users SET team_id = NULL WHERE role = 'admin'");
    echo "$adminCount admin kullanıcının takım bağlantısı kaldırıldı.\n";

    // 4. Yıllık izin günlerini işe giriş tarihine göre güncelle
    echo "\n4. Yıllık izin günleri işe giriş tarihine göre güncelleniyor...\n";
    
    // 5 yıldan eski (25 gün)
    $fiveYearCount = $db->exec("UPDATE users SET annual_leave_days = 25 WHERE hire_date <= '2020-01-01'");
    echo "$fiveYearCount kullanıcı 5+ yıl deneyim için 25 gün izin hakkı aldı.\n";
    
    // 10 yıldan eski (30 gün)
    $tenYearCount = $db->exec("UPDATE users SET annual_leave_days = 30 WHERE hire_date <= '2015-01-01'");
    echo "$tenYearCount kullanıcı 10+ yıl deneyim için 30 gün izin hakkı aldı.\n";

    // 5. Leaves tablosuna yeni sütun ekle (izin türü için)
    echo "\n5. Leaves tablosuna yeni sütun ekleniyor...\n";
    addColumnIfNotExists($db, 'leaves', 'leave_type', 'TEXT');

    // 6. Mevcut izinlere varsayılan tür ata
    echo "\n6. Mevcut izinlere varsayılan tür atanıyor...\n";
    $leaveCount = $db->exec("UPDATE leaves SET leave_type = 'yıllık' WHERE leave_type IS NULL");
    echo "$leaveCount izin kaydına varsayılan tür atandı.\n";

    echo "\n✅ Migration başarıyla tamamlandı!\n";
    echo "Yapılan değişiklikler:\n";
    echo "- Users tablosuna hire_date ve annual_leave_days sütunları eklendi\n";
    echo "- Admin kullanıcıların takım bağlantısı kaldırıldı\n";
    echo "- Yıllık izin günleri işe giriş tarihine göre hesaplandı\n";
    echo "- Leaves tablosuna leave_type sütunu eklendi\n";

} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
    echo "Migration başarısız oldu!\n";
}
?>
