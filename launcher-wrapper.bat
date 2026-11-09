@echo off
:: GLB Viewer launcher wrapper
:: Determines its own directory and launches launcher.exe from there.
:: This makes the registration portable regardless of where the repo is cloned.
setlocal

if "%~1"=="" (
    echo Drag and drop a GLB file onto this batch file, or use Open With > GLB Viewer.
    pause
    exit /b 1
)

:: Path to the Rust launcher exe in the same folder as this wrapper
set "LAUNCHER=%~dp0launcher.exe"

if not exist "%LAUNCHER%" (
    echo Launcher not found: %LAUNCHER%
    echo Build it first: rustc launcher.rs -o launcher.exe
    pause
    exit /b 1
)

"%LAUNCHER%" "%~1"