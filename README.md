# Personel İzin Sistemi

Bu proje, personel izin taleplerini yönetmek için geliştirilmiş bir web uygulamasıdır.

## Kurulum

### Backend (PHP)
1. XAMPP'i başlatın
2. `backend` klasörünü XAMPP'in `htdocs` klasörüne kopyalayın
3. XAMPP'de Apache'yi başlatın
4. Tarayıcıda `http://localhost/backend/` adresine gidin

### Test Kullanıcısı Oluşturma
1. `backend/create-test-user.php` dosyasını tarayıcıda çalıştırın
2. Test kullanıcısı bilgileri:
   - E-posta: `test@example.com`
   - Şifre: `123456`

### Frontend (React Native)
1. `frontend` klasörüne gidin
2. `npm install` komutunu çalıştırın
3. `npm start` ile uygulamayı başlatın

## Konfigürasyon

### IP Adresi Değiştirme
IP adresini değiştirmek için sadece `frontend/src/config/config.js` dosyasındaki `BASE_URL` değerini güncelleyin:

```javascript
BACKEND: {
  BASE_URL: 'http://YENİ_IP_ADRESİ:8000',
  // ...
}
```

## Özellikler

- Kullanıcı girişi ve kimlik doğrulama
- İzin talebi oluşturma
- Takvim görünümü
- İzin durumu takibi
- Profil yönetimi

## Güvenlik

- SQL injection koruması
- Şifre hash'leme
- Token tabanlı kimlik doğrulama

## Sorun Giderme

### Giriş Yapılamıyor
1. Backend'in çalıştığından emin olun
2. IP adresinin doğru olduğunu kontrol edin
3. Test kullanıcısının oluşturulduğunu kontrol edin
4. Console loglarını kontrol edin

### Bağlantı Hatası
1. Backend sunucusunun çalıştığını kontrol edin
2. Firewall ayarlarını kontrol edin
3. Port 8000'in açık olduğunu kontrol edin
