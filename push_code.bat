@echo off
title Pushing MediVault-AI to GitHub
color 0A
echo ========================================================
echo  Pushing MediVault AI to GitHub (JeetendraNegi/MediVault-AI)
echo ========================================================
echo.

cd /d "%~dp0"
git status
echo.
echo Pushing 'main' branch to https://github.com/JeetendraNegi/MediVault-AI ...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! All code has been pushed to:
    echo  https://github.com/JeetendraNegi/MediVault-AI
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  Push failed. If prompted, please complete browser login.
    echo ========================================================
)

echo.
pause
