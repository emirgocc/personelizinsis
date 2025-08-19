@echo off
REM Personel İzin Sistemi - Tümünü Başlat

REM Backend'i yeni bir komut penceresinde başlat
start cmd /k "cd /d %cd%\backend && C:\xampp\php\php.exe -S 0.0.0.0:8000 -t ."

REM Frontend'i başlat
cd frontend
npm start
