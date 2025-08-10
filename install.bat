@echo off
chcp 65001 >nul
echo 🚀 Job Assistant Extension 安装助手
echo =================================================
echo.

echo 🔍 检查Chrome浏览器...

REM 检查Chrome是否安装
set CHROME_FOUND=false
set CHROME_CMD=

REM 检查默认Chrome安装路径
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_FOUND=true
    set CHROME_CMD="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME_FOUND=true
    set CHROME_CMD="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_FOUND=true
    set CHROME_CMD="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if "%CHROME_FOUND%"=="true" (
    echo ✅ Chrome浏览器已找到
    echo.
    echo 🌐 正在打开Chrome扩展页面...
    start "" %CHROME_CMD% chrome://extensions/
    timeout /t 3 /nobreak >nul
) else (
    echo ❌ 未找到Chrome浏览器
    echo.
    echo 请先安装Chrome浏览器：
    echo - 官网: https://www.google.com/chrome/
    echo.
    pause
    exit /b 1
)

echo.
echo 📋 安装步骤：
echo =================================================
echo 1. ✨ 在打开的Chrome页面中，启用右上角的"开发者模式"
echo 2. 📁 点击"加载已解压的扩展程序"按钮
echo 3. 📂 选择当前文件夹（包含manifest.json的文件夹）
echo 4. 🎉 完成！扩展将出现在Chrome工具栏中
echo.
echo ⚙️  首次使用：
echo - 点击扩展图标
echo - 输入OpenAI API密钥
echo - 开始解析岗位信息
echo.
echo ❓ 需要帮助？查看详细指南：
echo    https://github.com/RayStx/job-assistant-extension#installation
echo.
echo ✅ 安装助手完成！
echo.
pause