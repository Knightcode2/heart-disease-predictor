@echo off
REM Build a one-folder PyInstaller distribution
REM Requires pyinstaller installed in the environment

REM Clean previous builds
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist heart_disease_app.spec del /q heart_disease_app.spec

echo Building with PyInstaller...
pyinstaller --noconfirm --onedir --add-data "index.html;." --add-data "style.css;." --add-data "app.js;." --add-data "ensemble_model.pkl;." --add-data "styles;styles" --add-data "models;models" --hidden-import=sklearn --name heart_disease_app app.py

if %ERRORLEVEL% equ 0 (
  echo Build completed. See dist\heart_disease_app
) else (
  echo Build failed with error %ERRORLEVEL%
)
