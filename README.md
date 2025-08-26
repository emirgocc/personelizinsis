# Personel İzin Sistemi - Backend API

Belediye İşletme ve İştirakler Müdürlüğü personellerinin izin taleplerini ve ekip yönetimini destekleyen PHP REST API servisi.

## 📋 Proje Hakkında

Bu backend API'si, personel izin sistemi mobil uygulamasının veri yönetimini sağlar. SQLite veritabanı kullanarak lightweight ve taşınabilir bir çözüm sunar.

### 🎯 Temel İşlevler
- **Kimlik Doğrulama**: Token tabanlı güvenli auth sistemi
- **İzin Yönetimi**: İzin talebi oluşturma, onaylama, reddetme
- **Ekip Yönetimi**: Personel transfer, izin limiti ayarlama
- **Takvim Entegrasyonu**: Ay/gün bazında izin durumu kontrolü
- **Rol Yönetimi**: Admin ve personel yetki seviyeleri

## 🛠 Teknoloji Stack

### Core Technologies
- **PHP**: 8.0+ (XAMPP ortamında çalışır)
- **SQLite**: Veritabanı 
- **JSON**: API response format
- **PDO**: Database abstraction layer

### Security Features
- **Password Hashing**: PHP `password_hash()` fonksiyonu
- **Token Authentication**: Base64 encoded custom token system
- **SQL Injection Protection**: Prepared statements
- **CORS Support**: Cross-origin resource sharing

## 🏗 Dosya Yapısı

### Ana API Dosyaları
```
backend/
├── index.php           # Ana router ve endpoint yönetimi
├── db.php             # Veritabanı bağlantısı ve utility fonksiyonları
├── auth.php           # Kimlik doğrulama işlemleri
├── leaves.php         # İzin yönetimi fonksiyonları
├── teams.php          # Ekip yönetimi fonksiyonları
├── database.db        # SQLite veritabanı dosyası
└── setup-scripts/     # Kurulum ve yardımcı scriptler
```

### Setup Scripts Klasörü
```
setup-scripts/
├── setup.php                  # İlk kurulum scripti
├── migration-2025-01.php      # Veritabanı migrasyonu
├── update-db.php             # Tablo güncellemeleri
├── create-test-user.php       # Test kullanıcısı oluşturma
├── remove-team-names.php      # Takım isim sütunu kaldırma
├── restore-team-names.php     # Takım isim sütunu geri yükleme
└── *.bat dosyaları           # Windows için çalıştırma scriptleri
```

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler
- **XAMPP**: PHP runtime environment [[memory:6619314]]
- **Windows**: Batch dosyaları için
- **Port 8000**: API servisi için

### Hızlı Başlangıç

1. **XAMPP'ı başlatın**
   ```bash
   # XAMPP Control Panel'den Apache'yi başlatın
   ```

2. **Backend'i çalıştırın**
   ```bash
   # Proje kök dizininden
   ./start-backend.bat
   ```
   
   Bu komut şu işlemi yapar:
   ```cmd
   cd backend && C:\xampp\php\php.exe -S 0.0.0.0:8000 -t .
   ```

3. **API test edin**
   ```bash
   curl http://localhost:8000/
   # Response: {"status":"OK","message":"Kurulum tamamlandı."}
   ```

### Manuel Kurulum (İlk Kez)

Eğer veritabanı mevcut değilse:

```cmd
# backend/setup-scripts/ klasörüne gidin
cd backend/setup-scripts

# İlk kurulum
setup-db.bat

# Migration çalıştırın
run-migration.bat
```

## 📡 API Endpoint'leri

### Authentication Endpoints

#### `POST /login`
Kullanıcı girişi ve token alma
```json
Request:
{
  "email": "user@kurum.com",
  "password": "password123"
}

Response:
{
  "token": "base64_encoded_token",
  "role": "user|admin", 
  "email": "user@kurum.com"
}
```

#### `GET /me`
Kimlik doğrulanmış kullanıcı bilgileri
```json
Headers: Authorization: <token>

Response:
{
  "email": "user@kurum.com",
  "first_name": "Ali",
  "last_name": "Veli", 
  "photo": null,
  "team_name": "Ekip Paşa Kafe"
}
```

### Leave Management Endpoints

#### `POST /leaves/create`
Yeni izin talebi oluşturma
```json
Headers: Authorization: <token>

Request:
{
  "start_date": "2025-08-20",
  "end_date": "2025-08-22"  // Optional, tek gün için start_date ile aynı
}

Response:
{
  "success": true
}
```

#### `GET /leaves/mine`
Kullanıcının kendi izin geçmişi
```json
Headers: Authorization: <token>

Response: [
  {
    "id": 1,
    "user_id": 2,
    "start_date": "2025-08-20",
    "end_date": "2025-08-20",
    "status": "onaylı",
    "leave_type": "yıllık"
  }
]
```

#### `GET /leaves/remaining`
Kalan yıllık izin günleri
```json
Headers: Authorization: <token>

Response:
{
  "annual_limit": 25,
  "used_days": 5,
  "remaining_days": 20
}
```

#### `GET /leaves/day?date=2025-08-20`
Belirli günün izin durumu
```json
Headers: Authorization: <token>

Response: [
  {
    "id": 2,
    "email": "ali@kurum.com",
    "first_name": "Ali",
    "last_name": "Yılmaz",
    "status": "onaylı"
  }
]
```

#### `GET /leaves/month?month=2025-08`
Aylık izin takvimi
```json
Headers: Authorization: <token>

Response:
{
  "2025-08-01": 0,
  "2025-08-02": 1,
  "2025-08-03": 2,
  // ... tüm ay günleri
}
```

### Admin-Only Endpoints

#### `GET /leaves/pending` 🔒
Bekleyen izin talepleri (Admin only)
```json
Headers: Authorization: <admin_token>

Response: [
  {
    "id": 3,
    "email": "personel@kurum.com",
    "first_name": "Mehmet",
    "last_name": "Demir",
    "start_date": "2025-08-25",
    "end_date": "2025-08-27",
    "status": "beklemede",
    "team_id": 1,
    "team_name": "Ekip Paşa Kafe"
  }
]
```

#### `POST /leaves/approve` 🔒
İzin talebi onaylama/reddetme (Admin only)
```json
Headers: Authorization: <admin_token>

Request:
{
  "leave_id": 3,
  "action": "onayla" // veya "reddet"
}

Response:
{
  "success": true
}
```

### Team Management Endpoints

#### `GET /teams/info`
Takım bilgileri (Admin: tüm takımlar, User: kendi takımı)
```json
Headers: Authorization: <token>

Response (Admin):
[
  {
    "id": 1,
    "name": "Paşa Kafe",
    "member_count": 4,
    "max_leave_count": 2,
    "display_name": "Ekip Paşa Kafe"
  }
]

Response (User):
{
  "id": 1,
  "name": "Paşa Kafe", 
  "member_count": 4,
  "max_leave_count": 2,
  "display_name": "Ekip Paşa Kafe"
}
```

#### `GET /teams/members` 🔒
Takım üyeleri listesi
```json
Headers: Authorization: <token>

Response:
[
  {
    "id": 2,
    "email": "ali@kurum.com",
    "first_name": "Ali",
    "last_name": "Yılmaz",
    "role": "user",
    "hire_date": "2020-01-01",
    "annual_leave_days": 25,
    "team_id": 1,
    "team_name": "Ekip Paşa Kafe",
    "remaining_leave_days": 20
  }
]
```

#### `POST /teams/update-team-leave-limit` 🔒
Takım günlük izin limiti güncelleme (Admin only)
```json
Headers: Authorization: <admin_token>

Request:
{
  "team_id": 1,
  "max_leave_count": 3
}

Response:
{
  "success": true,
  "message": "Takım ID 1 günlük izin limiti 3 olarak güncellendi.",
  "max_leave_count": 3
}
```

#### `POST /teams/change-member-team` 🔒
Personel ekip değişikliği (Admin only)
```json
Headers: Authorization: <admin_token>

Request:
{
  "member_id": 5,
  "new_team_id": 2
}

Response:
{
  "success": true,
  "message": "Mehmet Yılmaz personeli 2. ekibine atandı."
}
```

## 🗄 Veritabanı Şeması

### Users Tablosu
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,                    -- Hashed password
    role TEXT,                       -- 'admin' | 'user'
    team_id INTEGER,                 -- Foreign key to teams.id
    first_name TEXT,
    last_name TEXT,
    photo TEXT,                      -- URL veya base64
    hire_date TEXT,                  -- ISO date format
    annual_leave_days INTEGER        -- Yıllık izin hakkı (kıdeme göre)
);
```

### Teams Tablosu
```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,                       -- 'Paşa Kafe', 'Dingiloğlu Parkı' vs
    member_count INTEGER,            -- Toplam üye sayısı (güncellenebilir)
    max_leave_count INTEGER          -- Günlük maksimum izin sayısı
);
```

### Leaves Tablosu
```sql
CREATE TABLE leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                 -- Foreign key to users.id
    start_date TEXT,                 -- ISO date format (YYYY-MM-DD)
    end_date TEXT,                   -- ISO date format (YYYY-MM-DD)
    status TEXT,                     -- 'beklemede' | 'onaylı' | 'reddedildi'
    leave_type TEXT                  -- 'yıllık' | 'hastalık' | 'mazeret' vs
);
```

## 🔐 Güvenlik Özellikleri

### Authentication System
- **Token Format**: Base64 encoded string
- **Token Content**: `user_id:email:role:timestamp:random_salt`
- **Verification**: Database lookup with user validation
- **Expiration**: Stateless (relies on user existence)

### Input Validation
- **SQL Injection Protection**: PDO Prepared Statements
- **XSS Prevention**: JSON response encoding
- **Type Casting**: Integer inputs için `intval()`

### CORS Configuration
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
```

## 📊 Business Logic

### İzin Sistemi Kuralları

#### 1. Yıllık İzin Hesaplama
- **1-5 yıl**: 20 gün
- **5-10 yıl**: 25 gün  
- **10+ yıl**: 30 gün

#### 2. Ekip Doluluk Kontrolü
- Her ekip için günlük maksimum izin sayısı belirlenir
- İzin talebi sırasında real-time kontrol
- Çakışma durumunda talep reddedilir

#### 3. İzin Durumları
- **beklemede**: Yeni talep, admin onayı bekleniyor
- **onaylı**: Admin tarafından onaylandı
- **reddedildi**: Admin tarafından reddedildi

### Tarih Aralığı İşlemleri
- Tek gün izin: `start_date = end_date`
- Çoklu gün izin: Aralıktaki her gün için doluluk kontrol
- Geçmiş tarih kontrolü: Frontend seviyesinde handle edilir

## 🧪 Test ve Debug

### Logging
- **Error Log**: `error_log()` ile PHP error log'a yazılır
- **Debug Info**: Request headers ve input data loglanır
- **Database Transactions**: Success/failure durumları kayıt altına alınır

### Test Endpoints
```bash
# Sistem durumu
curl http://localhost:8000/

# Test kullanıcısı oluştur
cd setup-scripts && php create-test-user.php

# Veritabanı durumu kontrol (Admin only)
curl -H "Authorization: <admin_token>" http://localhost:8000/teams/test-db
```

### Varsayılan Test Verileri
```php
// setup.php çalıştırıldığında oluşturulan test verileri:
Admin: admin@kurum.com / admin
User:  user@kurum.com  / user

Takımlar:
- Takım 1: Mavi Takım (4 üye, max 2 izin)
- Takım 2: Beyaz Takım (5 üye, max 2 izin)
```

## 🔧 Yapılandırma

### PHP Konfigürasyonu
```ini
; php.ini ayarları (XAMPP'ta)
max_execution_time = 30
memory_limit = 128M
upload_max_filesize = 2M
```

### SQLite Optimizasyonu
```php
// db.php'de yapılandırılmış
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

### Network Configuration
- **Host**: `0.0.0.0` (tüm network interfaces)
- **Port**: `8000`
- **Protocol**: HTTP (production'da HTTPS önerilir)

## 📈 Performance Optimizasyonu

### Database Queries
- Prepared statements kullanımı
- Index optimization için SQLite ANALYZE
- Connection pooling (tek connection per request)

### Memory Management
- Large result sets için pagination gerekebilir
- File uploads için size limits
- Memory leak prevention

## 🚨 Bilinen Sınırlamalar

### Güvenlik
- **HTTPS yok**: Production ortamı için SSL sertifikası gerekli
- **Token expiration yok**: Stateless token sistem
- **Rate limiting yok**: DoS attack koruması yok

### Scalability
- **Single SQLite file**: Concurrent write operations sınırlı
- **No caching**: Database cache layer yok
- **No session management**: Stateless design

### Browser Compatibility
- **CORS**: Tüm origins'e açık (production'da kısıtlanmalı)

## 🔮 Gelecek Geliştirmeler

### v2.0 Roadmap
- [ ] **JWT Token System**: Expiration ve refresh token
- [ ] **Redis Cache**: Performance optimization
- [ ] **MySQL Migration**: Scalability için
- [ ] **API Versioning**: Backward compatibility
- [ ] **Swagger Documentation**: API docs
- [ ] **Docker Support**: Containerization
- [ ] **Unit Tests**: PHPUnit integration
- [ ] **HTTPS Support**: SSL certificate management

### Security Enhancements
- [ ] **OAuth2 Integration**: Third-party auth
- [ ] **Rate Limiting**: Request throttling
- [ ] **Input Sanitization**: XSS prevention
- [ ] **Audit Logging**: User action tracking

## 📝 Lisans

Bu proje [MIT lisansı](../LICENSE) altında lisanslanmıştır.

## 👥 Takım

- **Full Stack**: [Emir Göç]

## 📞 İletişim

Herhangi bir sorun veya öneriniz için:
- **E-posta**: [emirgoc.39@gmail.com]
---

**Bu backend API'si XAMPP ortamında geliştirilmiş olup, belediye personel yönetim ihtiyaçlarına yönelik optimize edilmiştir. 🏢**
