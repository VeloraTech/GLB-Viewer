@echo off
:: GLB Viewer launcher
:: Runs the Rust exe with the dropped GLB file path.
setlocal

if "%~1"=="" (
    echo Drag and drop a GLB file onto this batch file, or use Open With > GLB Viewer.
    pause
    exit /b 1
)

:: Path to the Rust launcher exe (build this first: cargo build --release)
set "LAUNCHER=%~dp0launcher.exe"

if not exist "%LAUNCHER%" (
    echo Launcher not found: %LAUNCHER%
    echo Build it first: cargo build --release
    pause
    exit /b 1
)

"%LAUNCHER%" "%~1"
