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

echo [1/6] Copying root files and library...

if exist "%SCRIPT_DIR%README.md" (
    copy /Y "%SCRIPT_DIR%README.md" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: README.md || echo   FAIL: README.md
)

if exist "%SCRIPT_DIR%LICENSE.txt" (
    copy /Y "%SCRIPT_DIR%LICENSE.txt" "%TEMP_DIR%\" >nul 2>&1 && echo   OK: LICENSE.txt || echo   FAIL: LICENSE.txt
)

if exist "%SCRIPT_DIR%library" (
    xcopy /E /I /H /Y "%SCRIPT_DIR%library\*" "%TEMP_DIR%\library\" >nul 2>&1 && echo   OK: library\ || echo   FAIL: library\
) else (
    echo   WARN: library\ not found
)

if exist "%SCRIPT_DIR%images" (
    xcopy /E /I /H /Y "%SCRIPT_DIR%images" "%TEMP_DIR%\images\" >nul 2>&1 && echo   OK: images\ || echo   FAIL: images\
)

echo.

echo [2/6] Creating content directory...

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

echo.

echo [3/6] Creating release directory...

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%" 2>nul
if not exist "%RELEASE_DIR%" (
    echo ERROR: Failed to create release directory
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b 1
)

echo [4/6] Creating ZIP file...

set "ZIP_BASE=comic_viewer_tune_%DATE_STR%"
set "ZIP_NAME=%ZIP_BASE%.zip"
set "ZIP_PATH=%RELEASE_DIR%\%ZIP_NAME%"
set "ZIP_N=1"
:zipname_loop
if exist "%ZIP_PATH%" (
    set /a ZIP_N+=1
    set "ZIP_NAME=!ZIP_BASE!_!ZIP_N!.zip"
    set "ZIP_PATH=%RELEASE_DIR%\!ZIP_NAME!"
    goto zipname_loop
)
echo   Output: %ZIP_NAME%

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

echo [5/6] Refreshing docs with release contents (keeping docs\index.html and docs\*.md)...
set "DOCS_DIR=%SCRIPT_DIR%docs"
set "DOCS_INDEX_BAK=%SCRIPT_DIR%docs_index_backup.html"
if exist "%DOCS_DIR%\index.html" (
    copy /Y "%DOCS_DIR%\index.html" "%DOCS_INDEX_BAK%" >nul 2>&1
)
if exist "%DOCS_DIR%\content" rmdir /s /q "%DOCS_DIR%\content" 2>nul
if exist "%DOCS_DIR%\library" rmdir /s /q "%DOCS_DIR%\library" 2>nul
if exist "%DOCS_DIR%\images" rmdir /s /q "%DOCS_DIR%\images" 2>nul
if exist "%DOCS_DIR%\README.md" del /q "%DOCS_DIR%\README.md" 2>nul
if exist "%DOCS_DIR%\LICENSE.txt" del /q "%DOCS_DIR%\LICENSE.txt" 2>nul
if exist "%DOCS_DIR%\comic.js" del /q "%DOCS_DIR%\comic.js" 2>nul
if exist "%DOCS_DIR%\comi_style.css" del /q "%DOCS_DIR%\comi_style.css" 2>nul
xcopy /E /I /H /Y "%TEMP_DIR%\*" "%DOCS_DIR%\" >nul 2>&1
if exist "%DOCS_INDEX_BAK%" (
    copy /Y "%DOCS_INDEX_BAK%" "%DOCS_DIR%\index.html" >nul 2>&1
    del /q "%DOCS_INDEX_BAK%" 2>nul
    echo   OK: docs refreshed, index.html restored
) else (
    echo   WARN: docs refreshed, no index.html backup found
)

echo [6/6] Cleaning up...
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
