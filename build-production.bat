@echo off
echo ============================================
echo Production APK Build Script
echo Server: https://hometuitionapp.com/api
echo ============================================
echo.

REM Set production environment variables
set APP_ENV=production
set API_BASE_URL=https://hometuitionapp.com/api
set EXPO_PUBLIC_API_BASE_URL=https://hometuitionapp.com/api
set SOCKET_URL=https://hometuitionapp.com
set NODE_ENV=production

echo Environment variables set:
echo API_BASE_URL=%API_BASE_URL%
echo.

REM Navigate to android directory and build
cd android

REM Clean previous build
echo Cleaning previous build...
call .\gradlew clean

REM Build release APK
echo Building production APK...
call .\gradlew assembleRelease --no-daemon -x test

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Build SUCCESSFUL!
    echo.
    echo APK Location:
    echo android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo Install with:
    echo adb install android\app\build\outputs\apk\release\app-release.apk
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Build FAILED!
    echo Check errors above.
    echo ============================================
)

cd ..
