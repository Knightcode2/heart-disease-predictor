Portable distribution instructions
=================================

Goal
----
Make a portable version of this Heart Disease Prediction app so you can copy it to a USB drive and run it on any Windows laptop without installing Python or project dependencies.

Approaches
---------
1. Build a standalone Windows folder (recommended) using PyInstaller ("one-folder"). This bundles a Python interpreter and all dependencies into a runnable folder. Copy the folder to a pendrive and run the EXE.
2. Use a portable Python embeddable distribution + run scripts (lighter, but requires you to include the embeddable Python alongside the app and still set up dependencies).

Recommended (PyInstaller - one-folder)
-------------------------------------
Steps (on a Windows machine where you build the portable app):

1. Create a fresh virtual environment and install dev dependencies (PyInstaller):

   python -m venv .venv-build
   & .\.venv-build\Scripts\Activate.ps1
   pip install --upgrade pip
   pip install pyinstaller

2. From the project root run the included build script (it calls pyinstaller with the right flags):

   build_exe.bat

   The script builds a one-folder distribution under `dist\heart_disease_app`. That folder contains `heart_disease_app.exe` plus all required dynamic libraries.

3. Copy the whole `dist\heart_disease_app` folder onto your pendrive. On any Windows laptop you can open that folder and run `heart_disease_app.exe`.

Notes / tips
-----------
- The app opens a local web server and serves the UI; by default it listens on 127.0.0.1:5000. The EXE will open the user's default browser automatically to the app URL.
- If you include a large ML model file (`ensemble_model.pkl`) keep it in the same folder as the exe so the backend can load it.
- One-folder is more robust than one-file (single EXE) because antivirus/packers sometimes block single-file EXEs.

Fallback: run with Python
-------------------------
If you prefer not to build an exe, copy the project folder to the pendrive and use the included `run.bat` to run the app using the local Python on the target machine (target must have Python installed):

  run.bat

This script will first look for an exe, then try `python app.py` as fallback (requires Python+deps installed on the laptop).

Security
--------
Do not commit large binary model files to public repositories. If sharing the portable package, be mindful of model licensing and patient data.

If you want, I can build the portable EXE for you now (this environment has Python available) — tell me to proceed and I will run the build script and attach the produced dist folder (zipped) if successful.
