@echo off
cd /d "%~dp0"

echo [1/3] Degisiklikler hazırlanıyor...
git add -A
git status --short

echo.
echo [2/3] Commit yapılıyor...
git diff --cached --quiet
if %ERRORLEVEL% == 0 (
    echo Yeni degisiklik yok, direkt push yapılıyor...
) else (
    git commit -m "Site guncellendi"
)

echo.
echo [3/3] GitHub'a yukleniyor...
git push origin main --force-with-lease

echo.
if %ERRORLEVEL% == 0 (
    echo BASARILI - turkua.net 1-2 dakikada guncellenir.
) else (
    echo HATA - Asagidaki mesaji Claude'a gonderin.
)
echo.
pause
