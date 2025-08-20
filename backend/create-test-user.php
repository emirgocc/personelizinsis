<?php
// create-test-user.php - Test kullanıcısı oluşturma scripti

require_once __DIR__.'/db.php';

try {
    // Test kullanıcısı bilgileri
    $email = 'test@example.com';
    $password = '123456';
    $firstName = 'Test';
    $lastName = 'Kullanıcı';
    $role = 'employee';
    
    // Şifreyi hash'le
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Kullanıcı var mı kontrol et
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        echo "Kullanıcı zaten mevcut!\n";
        echo "E-posta: $email\n";
        echo "Şifre: $password\n";
    } else {
        // Yeni kullanıcı oluştur
        $stmt = $db->prepare("INSERT INTO users (email, password, first_name, last_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$email, $hashedPassword, $firstName, $lastName, $role, date('Y-m-d H:i:s')]);
        
        echo "Test kullanıcısı başarıyla oluşturuldu!\n";
        echo "E-posta: $email\n";
        echo "Şifre: $password\n";
        echo "Rol: $role\n";
    }
    
    // Mevcut kullanıcıları listele
    echo "\nMevcut kullanıcılar:\n";
    $stmt = $db->query("SELECT id, email, first_name, last_name, role FROM users");
    while ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$user['id']}, E-posta: {$user['email']}, Ad: {$user['first_name']}, Soyad: {$user['last_name']}, Rol: {$user['role']}\n";
    }
    
} catch (Exception $e) {
    echo "Hata: " . $e->getMessage() . "\n";
}
?>
