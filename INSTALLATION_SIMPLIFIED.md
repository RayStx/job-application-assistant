# 简化安装指南

## 当前最简单的安装方式

### 方式一：从Release下载（推荐）

1. **下载预构建版本**
   - 访问：https://github.com/RayStx/job-application-assistant/releases
   - 下载最新的`job-application-assistant-v1.0.0.zip`
   - 解压到任意文件夹

2. **一键安装脚本**（Windows/Mac）
   ```bash
   # 自动打开Chrome扩展页面
   # Windows
   start chrome://extensions/
   
   # Mac
   open -a "Google Chrome" chrome://extensions/
   ```

3. **在Chrome中加载**
   - 开启"开发者模式"（右上角切换）
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹

### 方式二：一键安装脚本（开发中）

**计划中的改进**：
- 创建安装脚本，自动检测Chrome并打开扩展页面
- 提供.bat（Windows）和.sh（Mac/Linux）脚本
- 自动检查Chrome版本兼容性

## 为什么不能"一键安装"？

### Chrome Web Store发布（最简单但有限制）
- ✅ **优势**：真正的一键安装
- ❌ **限制**：
  - 需要$5开发者费用
  - 审核周期1-3天
  - 需要隐私政策、详细描述
  - 适合稳定版本，不适合快速迭代

### CRX文件打包（有安全警告）
- ✅ **优势**：双击安装
- ❌ **限制**：
  - Chrome会显示"无法验证扩展程序"警告
  - 需要用户确认多个安全提示
  - 某些企业环境可能阻止

### 当前开发者模式加载（推荐）
- ✅ **优势**：
  - 完全控制，无审核限制
  - 适合开发版本和快速迭代
  - 用户数据完全可控
- ❌ **限制**：需要3步手动操作

## 改进计划

### 短期改进（本周）
1. **创建安装脚本**
   - 自动打开Chrome扩展页面
   - 提供图文安装指导
   - 检查系统兼容性

2. **改进Release包**
   - 预构建dist文件夹
   - 包含详细的README
   - 提供安装视频教程

### 中长期方案（看反馈）
1. **Chrome Web Store发布**
   - 如果用户反馈积极，考虑正式发布
   - 需要完善隐私政策、用户协议等

2. **自动更新机制**
   - 检查GitHub Releases的新版本
   - 提示用户更新

## 技术实现

### 安装检测脚本（计划）
```javascript
// 检测Chrome是否安装
function detectChrome() {
  // 检测逻辑
}

// 自动打开扩展页面
function openExtensionsPage() {
  // 平台特定的打开逻辑
}

// 提供安装指导
function showInstallGuide() {
  // 图文指导界面
}
```

### 一键安装脚本模板
```bash
#!/bin/bash
# install.sh
echo "Job Assistant Extension 安装程序"
echo "1. 检查Chrome浏览器..."

# 检查Chrome
if command -v google-chrome &> /dev/null; then
    echo "✅ Chrome已安装"
    google-chrome chrome://extensions/ &
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium已安装"
    chromium-browser chrome://extensions/ &
else
    echo "❌ 未找到Chrome浏览器，请先安装Chrome"
    exit 1
fi

echo "2. 请在打开的页面中："
echo "   - 启用'开发者模式'"
echo "   - 点击'加载已解压的扩展程序'"
echo "   - 选择当前文件夹"
```

---

**结论**：当前的安装方式已经是开发版本的最佳平衡。如果需要真正的一键安装，需要考虑Chrome Web Store发布。