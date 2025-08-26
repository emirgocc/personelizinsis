@echo off
echo Migration calistiriliyor...
echo.

"C:\xampp\php\php.exe" "%~dp0migration-2025-01.php"

echo.
echo Migration tamamlandi. Herhangi bir tusa basin...
pause >nul
