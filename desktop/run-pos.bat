@echo off
chcp 65001 > nul
title GHAZAL POS Runner
start "" "%~dp0release\win-unpacked\GHAZAL POS.exe"
exit /b
