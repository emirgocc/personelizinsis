<?php
// remove-team-names.php
// Bu script teams tablosundan name sütununu kaldırır

try {
    $db = new PDO('sqlite:' . __DIR__ . '/database.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Teams tablosundan name sütunu kaldırılıyor...\n";

    // Teams tablosundan name sütununu kaldır
    try {
        $db->exec("ALTER TABLE teams DROP COLUMN name");
        echo "✅ Teams tablosundan name sütunu başarıyla kaldırıldı.\n";
        echo "Artık ekipler ID'ye göre '1. Ekip', '2. Ekip' şeklinde gösterilecek.\n";
    } catch (Exception $e) {
        echo "ℹ️ Name sütunu zaten kaldırılmış veya mevcut değil.\n";
    }

    echo "\nMigration tamamlandı!\n";

} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
    echo "Migration başarısız oldu!\n";
}
?>
