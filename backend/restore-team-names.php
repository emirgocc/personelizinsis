<?php
// restore-team-names.php
// Bu script teams tablosuna name sütununu geri ekler ve takım isimlerini atar

try {
    $db = new PDO('sqlite:' . __DIR__ . '/database.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Teams tablosuna name sütunu ekleniyor ve takım isimleri atanıyor...\n";

    // 1. Teams tablosuna name sütununu ekle
    try {
        $db->exec("ALTER TABLE teams ADD COLUMN name TEXT");
        echo "✅ Teams tablosuna name sütunu başarıyla eklendi.\n";
    } catch (Exception $e) {
        echo "ℹ️ Name sütunu zaten mevcut.\n";
    }

    // 2. Mevcut takımları kontrol et ve isimlerini ata
    $teams = $db->query("SELECT id FROM teams ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($teams) >= 3) {
        // İlk 3 takıma isim ata
        $teamNames = [
            1 => 'Paşa Kafe',
            2 => 'Dingiloğlu Parkı',
            3 => 'İsimsiz'
        ];
        
        foreach ($teamNames as $teamId => $teamName) {
            $stmt = $db->prepare("UPDATE teams SET name = ? WHERE id = ?");
            $stmt->execute([$teamName, $teamId]);
            echo "✅ Takım ID $teamId: '$teamName' olarak güncellendi.\n";
        }
        
        // Kalan takımları isimsiz yap
        for ($i = 4; $i <= count($teams); $i++) {
            $stmt = $db->prepare("UPDATE teams SET name = ? WHERE id = ?");
            $stmt->execute(['İsimsiz', $i]);
            echo "✅ Takım ID $i: 'İsimsiz' olarak güncellendi.\n";
        }
    } else {
        // Eğer 3'ten az takım varsa, mevcut olanları isimlendir
        $teamNames = ['Paşa Kafe', 'Dingiloğlu Parkı', 'İsimsiz'];
        
        foreach ($teams as $index => $team) {
            $teamName = $teamNames[$index] ?? 'İsimsiz';
            $stmt = $db->prepare("UPDATE teams SET name = ? WHERE id = ?");
            $stmt->execute([$teamName, $team['id']]);
            echo "✅ Takım ID {$team['id']}: '$teamName' olarak güncellendi.\n";
        }
    }

    echo "\n✅ Takım isimleri başarıyla geri yüklendi!\n";
    echo "Güncel takım listesi:\n";
    
    $updatedTeams = $db->query("SELECT id, name FROM teams ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($updatedTeams as $team) {
        echo "- Takım {$team['id']}: {$team['name']}\n";
    }

} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
    echo "İşlem başarısız oldu!\n";
}
?>
