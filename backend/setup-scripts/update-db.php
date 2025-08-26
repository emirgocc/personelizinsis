<?php
// update-db.php
// Bu script mevcut veritabanına yeni alanlar ekler (first_name, last_name, photo)
// Mevcut verileri silmez, sadece eksik sütunları ekler

try {
    $db = new PDO('sqlite:' . __DIR__ . '/database.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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

    addColumnIfNotExists($db, 'users', 'first_name', 'TEXT');
    addColumnIfNotExists($db, 'users', 'last_name', 'TEXT');
    addColumnIfNotExists($db, 'users', 'photo', 'TEXT');

    echo "Güncelleme tamamlandı!\n";
} catch (Exception $e) {
    echo "Hata: ".$e->getMessage()."\n";
}
