@echo off
echo Teams tablosundan name sutunu kaldiriliyor...
echo.

"C:\xampp\php\php.exe" "%~dp0remove-team-names.php"

echo.
echo Migration tamamlandi. Herhangi bir tusa basin...
pause >nul
