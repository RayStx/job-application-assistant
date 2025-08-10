#!/bin/bash

echo "🚀 Job Assistant Extension 安装助手"
echo "================================================="
echo ""

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "检测到操作系统: ${MACHINE}"
echo ""

# 检查Chrome浏览器
echo "🔍 检查Chrome浏览器..."
CHROME_FOUND=false

if [[ "$MACHINE" == "Mac" ]]; then
    if [[ -d "/Applications/Google Chrome.app" ]]; then
        CHROME_FOUND=true
        CHROME_CMD="open -a 'Google Chrome'"
    elif [[ -d "/Applications/Chromium.app" ]]; then
        CHROME_FOUND=true
        CHROME_CMD="open -a 'Chromium'"
    fi
elif [[ "$MACHINE" == "Linux" ]]; then
    if command -v google-chrome &> /dev/null; then
        CHROME_FOUND=true
        CHROME_CMD="google-chrome"
    elif command -v chromium-browser &> /dev/null; then
        CHROME_FOUND=true
        CHROME_CMD="chromium-browser"
    elif command -v chromium &> /dev/null; then
        CHROME_FOUND=true
        CHROME_CMD="chromium"
    fi
fi

if [[ "$CHROME_FOUND" == true ]]; then
    echo "✅ Chrome浏览器已找到"
    echo ""
    echo "🌐 正在打开Chrome扩展页面..."
    $CHROME_CMD chrome://extensions/ &
    sleep 2
else
    echo "❌ 未找到Chrome浏览器"
    echo ""
    echo "请先安装Chrome浏览器："
    echo "- 官网: https://www.google.com/chrome/"
    echo "- 或使用Chromium: https://www.chromium.org/"
    exit 1
fi

echo ""
echo "📋 安装步骤："
echo "================================================="
echo "1. ✨ 在打开的Chrome页面中，启用右上角的'开发者模式'"
echo "2. 📁 点击'加载已解压的扩展程序'按钮"
echo "3. 📂 选择当前文件夹（包含manifest.json的文件夹）"
echo "4. 🎉 完成！扩展将出现在Chrome工具栏中"
echo ""
echo "⚙️  首次使用："
echo "- 点击扩展图标"
echo "- 输入OpenAI API密钥"
echo "- 开始解析岗位信息"
echo ""
echo "❓ 需要帮助？查看详细指南："
echo "   https://github.com/RayStx/job-application-assistant#installation"
echo ""
echo "✅ 安装助手完成！"