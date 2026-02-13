@echo off
setlocal enabledelayedexpansion

echo ========================================
echo GitHub Releases ZIP Creator
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
set "DATE_STR=%datetime:~0,8%"
set "ZIP_NAME=comic_viewer_tune_%DATE_STR%.zip"
set "RELEASE_DIR=%SCRIPT_DIR%release"
set "TEMP_DIR=%TEMP%\temp_release_%RANDOM%"

echo Working directory: %SCRIPT_DIR%
echo ZIP file name: %ZIP_NAME%
echo Temp directory: %TEMP_DIR%
echo.

if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" 2>nul
mkdir "%TEMP_DIR%" 2>nul
if not exist "%TEMP_DIR%" (
    echo ERROR: Failed to create temp directory
    pause
    exit /b 1
)

echo [1/4] Copying root files...

if exist "%SCRIPT_DIR%jquery-3.6.0.min.js" (
    copy /Y "%SCRIPT_DIR%jquery-3.6.0.min.js" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: jquery-3.6.0.min.js || echo   FAIL: jquery-3.6.0.min.js
)

if exist "%SCRIPT_DIR%slick.min.js" (
    copy /Y "%SCRIPT_DIR%slick.min.js" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: slick.min.js || echo   FAIL: slick.min.js
)

if exist "%SCRIPT_DIR%slick.min.mjs" (
    copy /Y "%SCRIPT_DIR%slick.min.mjs" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: slick.min.mjs || echo   FAIL: slick.min.mjs
)

if exist "%SCRIPT_DIR%slick-swipe-custom.js" (
    copy /Y "%SCRIPT_DIR%slick-swipe-custom.js" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: slick-swipe-custom.js || echo   FAIL: slick-swipe-custom.js
)

if exist "%SCRIPT_DIR%slick.css" (
    copy /Y "%SCRIPT_DIR%slick.css" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: slick.css || echo   FAIL: slick.css
)

if exist "%SCRIPT_DIR%README.md" (
    copy /Y "%SCRIPT_DIR%README.md" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: README.md || echo   FAIL: README.md
)

echo.

echo [2/4] Creating content directory...

set "CONTENT_DIR=%TEMP_DIR%\content"
mkdir "%CONTENT_DIR%" 2>nul
if not exist "%CONTENT_DIR%" (
    echo ERROR: Failed to create content directory
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b 1
)

if exist "%SCRIPT_DIR%content\comic.js" (
    copy /Y "%SCRIPT_DIR%content\comic.js" "%CONTENT_DIR%\" >nul 2>&1 && echo   OK: content\comic.js || echo   FAIL: content\comic.js
)

if exist "%SCRIPT_DIR%content\comi_style.css" (
    copy /Y "%SCRIPT_DIR%content\comi_style.css" "%CONTENT_DIR%\" >nul 2>&1 && echo   OK: content\comi_style.css || echo   FAIL: content\comi_style.css
)

if exist "%SCRIPT_DIR%content\sample" (
    xcopy /E /I /H /Y "%SCRIPT_DIR%content\sample" "%CONTENT_DIR%\sample\" >nul 2>&1 && echo   OK: content\sample\ || echo   FAIL: content\sample\
)

if exist "%SCRIPT_DIR%content\images" (
    xcopy /E /I /H /Y "%SCRIPT_DIR%content\images" "%CONTENT_DIR%\images\" >nul 2>&1 && echo   OK: content\images\ || echo   FAIL: content\images\
)

echo.

echo [3/4] Creating release directory...

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%" 2>nul
if not exist "%RELEASE_DIR%" (
    echo ERROR: Failed to create release directory
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b 1
)

echo [4/5] Creating ZIP file...

set "ZIP_PATH=%RELEASE_DIR%\%ZIP_NAME%"
if exist "%ZIP_PATH%" del /F /Q "%ZIP_PATH%" >nul 2>&1

set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS_EXE%" (
    echo ERROR: PowerShell not found
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b 1
)

"%PS_EXE%" -ExecutionPolicy Bypass -NoProfile -Command "$ErrorActionPreference='Stop'; Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%ZIP_PATH%' -Force"

if errorlevel 1 (
    echo ERROR: Failed to create ZIP file
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b 1
)

echo [5/5] Cleaning up...
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ========================================
echo ZIP created successfully!
echo.
echo File: %ZIP_NAME%
echo Location: %ZIP_PATH%
echo ========================================
echo.
pause
