
@echo off
echo XAMPP kontrol ediliyor...

REM XAMPP PHP yolunu kontrol et
if exist "C:\xampp\php\php.exe" (
    echo XAMPP PHP bulundu, kullaniliyor...
    start cmd /k "cd /d %cd%\backend && C:\xampp\php\php.exe -S 0.0.0.0:8000 -t ."
) else (
    echo XAMPP PHP bulunamadi, sistem PHP deneniyor...
    REM Sistem PHP'sini dene
    php -v >nul 2>&1
    if %errorlevel%==0 (
        echo Sistem PHP bulundu, kullaniliyor...
        start cmd /k "cd /d %cd%\backend && php -S 0.0.0.0:8000 -t ."
    ) else (
        echo PHP bulunamadi! XAMPP'i yukleyin veya PHP'yi sistem yoluna ekleyin.
        echo.
        echo XAMPP indirme linki: https://www.apachefriends.org/download.html
        pause
    )
)