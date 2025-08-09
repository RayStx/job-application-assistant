# Job Assistant Extension

A comprehensive Chrome extension for job seekers that combines AI-powered job parsing with professional resume management and application tracking.

[中文文档](#中文文档) | [English Documentation](#english-documentation)

---

## English Documentation

### 🚀 Features

#### 🤖 **Intelligent Job Parsing**
- Parse job postings from any website (LinkedIn, Indeed, Glassdoor, company sites)
- AI-powered extraction of: title, company, description, requirements, salary, location, work type
- Support for multiple languages and formats
- One-click parsing with intelligent content detection

#### 📝 **Professional Resume Management**
- **LaTeX Resume Editor**: Built-in editor for professional LaTeX resumes
- **Version Control**: Track multiple resume versions with automatic versioning
- **Resume Library**: Modular sections (education, experience, projects) for easy customization
- **Application Linking**: Link specific resume versions to job applications
- **Export Options**: Export resumes and compile with LaTeX

#### ✉️ **Cover Letter Management**
- Dedicated cover letter editor with version control
- Link cover letters to specific applications
- Template system for quick customization
- Markdown support for easy formatting

#### 📊 **Application Tracking**
- Comprehensive application status management (saved, applied, interviewing, offered, rejected)
- **Dual Language Support**: Separate Chinese and English datasets
- Detailed application information with editable fields
- Application timeline and notes
- Smart linking between resumes, cover letters, and applications

#### 💾 **Advanced Backup & Data Management**
- **Full Language Backup**: Automatically backs up both Chinese and English datasets
- Smart backup system with change detection
- Selective restore options (restore specific language datasets)
- CSV export for external analysis
- Complete data privacy (local storage only)

#### 🌐 **Multi-Language Support**
- **UI Languages**: Chinese and English interface
- **Data Separation**: Independent Chinese and English job application datasets
- **Language-Aware**: Automatic language detection and appropriate handling

### 📦 Installation

#### Prerequisites
- Google Chrome browser (or Chromium-based browser)
- OpenAI API key for job parsing ([Get one here](https://platform.openai.com/api-keys))

#### Install from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/RayStx/job-assistant-extension.git
   cd job-assistant-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` folder from the project directory

5. **Initial Setup**
   - Click the extension icon in your browser toolbar
   - Enter your OpenAI API key when prompted
   - The key is encrypted and stored securely in local storage

### 🎯 Usage Guide

#### Job Application Workflow

1. **Parse Job Posting**
   - Navigate to any job posting website
   - Click the Job Assistant extension icon
   - Click "Parse Current Page"
   - Review and edit the extracted information
   - Save to your application dashboard

2. **Manage Resumes**
   - Access the "Resume" tab in the dashboard
   - Create and edit LaTeX-based professional resumes
   - Build modular sections in the "Library" tab
   - Link specific resume versions to applications
   - Export and compile your resumes

3. **Create Cover Letters**
   - Use the "Cover Letter" tab for personalized cover letters
   - Create multiple versions for different applications
   - Link cover letters to specific job applications

4. **Track Applications**
   - Monitor all applications in the main dashboard
   - Update status as you progress through the hiring process
   - Add personal notes and track important dates
   - Switch between Chinese and English datasets using the data language toggle

#### Data Management

- **Language Switching**: Use the "Data" toggle to switch between Chinese and English application sets
- **Backup Creation**: Use "Backup Manager" to create full backups of both language datasets
- **Export Options**: Export applications to CSV or create comprehensive backups
- **Restore**: Selectively restore Chinese or English datasets from backups

### 🛠️ Technical Details

#### Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build System**: Vite with Chrome extension optimizations
- **Extension API**: Chrome Manifest V3 with service worker
- **AI Integration**: OpenAI GPT-4o-mini for intelligent parsing
- **Storage**: Chrome Local Storage API with language-specific partitioning
- **LaTeX Processing**: Built-in LaTeX editor and preview system

#### Browser Support
- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Brave Browser
- ❌ Firefox (Different extension API)
- ❌ Safari (Different extension system)

#### API Costs
- **Model**: GPT-4o-mini (cost-effective)
- **Average parsing cost**: ~$0.001-0.002 USD per job
- **Estimated monthly cost**: ~$0.10-0.20 USD for 100 applications

### 📁 Project Structure

```
src/
├── popup/               # Extension popup interface
├── dashboard/           # Main application dashboard
│   ├── components/      # React components
│   │   ├── SimpleCV.tsx        # Resume management
│   │   ├── CoverLetter.tsx     # Cover letter editor
│   │   ├── SectionLibrary.tsx  # Resume sections library
│   │   └── ...
├── lib/
│   ├── ai/             # OpenAI integration
│   ├── storage/        # Data management
│   │   ├── applications.ts     # Application storage
│   │   ├── cvStorage.ts        # Resume storage
│   │   ├── sectionStorage.ts   # Section library storage
│   │   └── backupStorage.ts    # Backup system
│   └── utils/          # Utility functions
└── types/              # TypeScript definitions

dist/                   # Built extension files
manifest.json          # Chrome extension manifest
```

### 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 中文文档

### 🚀 功能特性

#### 🤖 **智能职位解析**
- 解析任意网站的职位信息（LinkedIn、Indeed、拉勾、智联招聘等）
- AI智能提取：职位、公司、描述、要求、薪资、地点、工作类型
- 支持中英文及多种格式
- 一键解析，智能内容识别

#### 📝 **专业简历管理**
- **LaTeX简历编辑器**：内置专业LaTeX简历编辑器
- **版本控制**：跟踪多个简历版本，自动版本管理
- **简历模块库**：模块化管理教育、经验、项目等简历部分
- **应用关联**：将特定简历版本与求职申请关联
- **导出选项**：导出简历并支持LaTeX编译

#### ✉️ **求职信管理**
- 专用求职信编辑器，支持版本控制
- 将求职信与特定申请关联
- 模板系统，快速定制
- Markdown支持，便于格式化

#### 📊 **申请跟踪**
- 全面的申请状态管理（已保存、已申请、面试中、已录用、已拒绝）
- **双语言支持**：独立的中英文数据集
- 详细申请信息，可编辑字段
- 申请时间线和笔记
- 简历、求职信与申请的智能关联

#### 💾 **高级备份与数据管理**
- **全语言备份**：自动备份中英文数据集
- 智能备份系统，变更检测
- 选择性恢复选项（恢复特定语言数据集）
- CSV导出，便于外部分析
- 完全数据隐私（仅本地存储）

#### 🌐 **多语言支持**
- **界面语言**：中英文界面切换
- **数据分离**：独立的中英文求职申请数据集
- **语言感知**：自动语言检测和适当处理

### 📦 安装指南

#### 系统要求
- Google Chrome浏览器（或基于Chromium的浏览器）
- OpenAI API密钥用于职位解析（[获取密钥](https://platform.openai.com/api-keys)）

#### 从源码安装

1. **克隆代码库**
   ```bash
   git clone https://github.com/RayStx/job-assistant-extension.git
   cd job-assistant-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建扩展**
   ```bash
   npm run build
   ```

4. **在Chrome中加载**
   - 打开Chrome，导航到 `chrome://extensions/`
   - 启用"开发者模式"（右上角切换）
   - 点击"加载已解压的扩展程序"
   - 选择项目目录中的 `dist/` 文件夹

5. **初始设置**
   - 点击浏览器工具栏中的扩展图标
   - 输入OpenAI API密钥
   - 密钥将加密存储在本地

### 🎯 使用指南

#### 求职申请流程

1. **解析职位信息**
   - 导航到任意职位发布网站
   - 点击Job Assistant扩展图标
   - 点击"解析当前页面"
   - 检查并编辑提取的信息
   - 保存到申请仪表板

2. **管理简历**
   - 在仪表板中访问"简历"选项卡
   - 创建和编辑基于LaTeX的专业简历
   - 在"模块库"选项卡中构建模块化部分
   - 将特定简历版本关联到申请
   - 导出和编译简历

3. **创建求职信**
   - 使用"求职信"选项卡创建个性化求职信
   - 为不同申请创建多个版本
   - 将求职信关联到特定工作申请

4. **跟踪申请**
   - 在主仪表板中监控所有申请
   - 根据招聘流程进展更新状态
   - 添加个人笔记和跟踪重要日期
   - 使用数据语言切换器在中英文数据集之间切换

#### 数据管理

- **语言切换**：使用"数据"切换器在中英文申请集之间切换
- **备份创建**：使用"备份管理器"创建双语言数据集的完整备份
- **导出选项**：将申请导出为CSV或创建综合备份
- **恢复**：从备份中选择性恢复中文或英文数据集

### 🛠️ 技术详情

#### 架构
- **前端**：React 18 + TypeScript + Tailwind CSS
- **构建系统**：Vite，Chrome扩展优化
- **扩展API**：Chrome Manifest V3，服务工作器
- **AI集成**：OpenAI GPT-4o-mini智能解析
- **存储**：Chrome本地存储API，语言特定分区
- **LaTeX处理**：内置LaTeX编辑器和预览系统

#### 浏览器支持
- ✅ Google Chrome（推荐）
- ✅ Microsoft Edge（基于Chromium）
- ✅ Brave浏览器
- ❌ Firefox（不同的扩展API）
- ❌ Safari（不同的扩展系统）

#### API成本
- **模型**：GPT-4o-mini（成本效益高）
- **平均解析成本**：每个职位约$0.001-0.002美元
- **预估月度成本**：100个申请约$0.10-0.20美元

### 🤝 参与贡献

1. Fork此代码库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 开启Pull Request

### 📄 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。

---

**为全世界的求职者精心打造 ❤️**