@echo off
REM Try to run the bundled exe if present
if exist dist\heart_disease_app\heart_disease_app.exe (
  echo Running bundled exe...
  start "" "%~dp0dist\heart_disease_app\heart_disease_app.exe"
  exit /b 0
)

REM Otherwise try to run with system Python
python --version >nul 2>&1
if errorlevel 1 (
  echo Python not found. Please install Python or build the portable executable first.
  pause
  exit /b 1
)

echo Starting app with local Python...
python "%~dp0app.py"
