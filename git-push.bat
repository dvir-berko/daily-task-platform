@echo off
echo ==========================================
echo  daily-task-platform - Push to GitHub
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing git...
git init

echo [2/5] Staging all files...
git add .

echo [3/5] Creating commit...
git commit -m "feat: initial commit — daily task platform with WhatsApp"

echo [4/5] Setting remote...
git remote remove origin 2>nul
git remote add origin https://github.com/dvirbf18/daily-task-platform.git
git branch -M main

echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% == 0 (
  echo SUCCESS! Repo is live at: https://github.com/dvirbf18/daily-task-platform
) else (
  echo FAILED. Make sure the repo exists at https://github.com/new
  echo Create it with name: daily-task-platform  (leave it empty, no README)
  echo Then run this script again.
)
echo.
pause
