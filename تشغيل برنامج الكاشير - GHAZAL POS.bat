@echo off
chcp 65001 > nul
title برنامج كاشير غزل - GHAZAL POS
echo ===================================================
echo     محل غزل للمكياج والعناية — عين الباشا
echo            تشغيل برنامج الكاشير (GHAZAL POS)
echo ===================================================
echo.
echo جاري بدء تشغيل برنامج الكاشير المستقل...
echo.

if exist "%~dp0desktop\release\win-unpacked\GHAZAL POS.exe" (
    start "" "%~dp0desktop\release\win-unpacked\GHAZAL POS.exe"
    exit /b
)

if exist "%~dp0public\downloads\GHAZAL-POS-Setup.exe" (
    start "" "%~dp0public\downloads\GHAZAL-POS-Setup.exe"
    exit /b
)

echo لم يتم العثور على ملف EXE، جاري التشغيل عبر Electron...
cd "%~dp0desktop"
pnpm start
pause
