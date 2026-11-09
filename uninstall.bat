@echo off
:: GLB Viewer uninstaller
:: Removes the GLB Viewer Open With registration from the Windows registry.
setlocal

echo This will remove GLB Viewer from the right-click Open With menu for .glb files.
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

reg delete "HKEY_CLASSES_ROOT\GLBViewer" /f >nul 2>&1
reg delete "HKEY_CLASSES_ROOT\.glb" /f >nul 2>&1

if errorlevel 1 (
    echo ERROR: Failed to remove registry keys. Run as Administrator.
    pause
    exit /b 1
)

echo.
echo GLB Viewer unregistered successfully.
pause