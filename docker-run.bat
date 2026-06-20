@echo off
echo ==========================================
echo  Daily Task Platform - Docker Runner
echo ==========================================
echo.
echo Building and starting containers...
docker compose up --build -d
echo.
echo Done! App running at:
echo   Frontend: http://localhost
echo   Backend:  http://localhost:3001/api/health
echo.
echo Opening in browser...
timeout /t 3 /nobreak > nul
start http://localhost
pause
