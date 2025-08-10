# Job Assistant Extension

A lightweight Chrome extension for managing job applications, resumes, and cover letters during job hunting.

[中文文档](./README_CN.md) | English Documentation

## What This Extension Does

This extension helps job seekers who need to:
- Track multiple job applications across different platforms
- Manage different resume/CV versions for different applications  
- Create targeted cover letters for specific positions
- Link specific resume versions to applications for better tracking

## Core Features

### 🔍 **Job Information Parsing**
- Parse job postings from Chinese platforms (tested on 阿里/字节/腾讯)
- AI-powered extraction of job details (title, company, requirements, etc.)
- One-click import to your application tracker
- **Note**: Currently tested mainly on Chinese job platforms

### 📝 **Resume & CV Management**
- **Version Control**: Track multiple resume versions with automatic versioning
- **Modular Editing**: Create reusable sections (education, experience, projects)
- **LaTeX Support**: Built-in LaTeX editor for professional resume compilation
- **Application Linking**: Link specific resume versions to job applications
- **Export**: Export sections or full resumes for external use

### ✉️ **Cover Letter Management**
- Version-controlled cover letter editing
- Template system for quick customization
- Link cover letters to specific applications
- Particularly useful for international applications (e.g., UK positions)

### 📊 **Application Tracking**
- Simple status management (saved, applied, interviewing, offered, rejected)
- **Dual Language Support**: Separate Chinese and English application datasets
- Personal notes and application timeline
- CSV export for external tools (Excel, etc.)

### 💾 **Data Management**
- **100% Local Storage**: All data stays in your browser
- **Backup System**: Create backups of all your data
- **Language Separation**: Manage Chinese and English applications independently
- **Privacy First**: No cloud sync, your data stays private

## Installation

### Prerequisites
- Chrome browser (or Chromium-based browser like Edge)
- OpenAI API key for job parsing ([Get one here](https://platform.openai.com/api-keys))
  - Estimated cost: ~$0.10-0.20/month for parsing 100 job postings

### Install Steps

1. **Download the extension**
   - Go to [Releases](https://github.com/RayStx/job-assistant-extension/releases)
   - Download the latest `job-assistant-extension.zip`
   - Extract the ZIP file

2. **Load in Chrome**
   - Open Chrome → go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" → select the extracted folder

3. **Setup**
   - Click the extension icon in your browser
   - Enter your OpenAI API key when prompted
   - Start parsing job postings!

### Alternative: Build from Source
```bash
git clone https://github.com/RayStx/job-assistant-extension.git
cd job-assistant-extension
npm install
npm run build
# Then load the dist/ folder in Chrome
```

## Usage

### Basic Workflow
1. **Find a job posting** → click extension icon → "Parse Current Page"
2. **Review extracted information** → save to your tracker
3. **Create/edit resume versions** → link to specific applications
4. **Track application status** → update as you progress
5. **Export data** if needed for other tools

### Key Use Cases
- **PhD students** applying to industry positions with diverse requirements
- **International job seekers** managing applications in multiple countries
- **Anyone** who needs targeted resume versions for different job types
- **Users** who prefer local data control over cloud-based tools

## Limitations & Considerations

⚠️ **This is a development version** - not suitable for users uncomfortable with:
- Loading unpacked Chrome extensions
- Using developer tools
- Potential bugs or rough edges

🔧 **Current limitations**:
- Parsing tested mainly on Chinese job platforms (阿里/字节/腾讯)
- Requires OpenAI API access (small cost)
- Web-based interface only (no mobile app)
- Developer-level installation required

## Technical Details

- **Frontend**: React + TypeScript + Tailwind CSS
- **Extension API**: Chrome Manifest V3
- **AI Integration**: OpenAI GPT-4o-mini for parsing
- **Storage**: Chrome Local Storage (no external servers)
- **LaTeX**: Built-in editor with syntax highlighting

## Contributing

This extension was built to solve a specific job hunting workflow. If you have similar needs or want to contribute improvements, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Support

- **Issues**: [GitHub Issues](https://github.com/RayStx/job-assistant-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RayStx/job-assistant-extension/discussions)

## License

MIT License - see [LICENSE](./LICENSE)

---

**Built for job seekers, by a job seeker** 🎯

*This extension was created during a PhD job search to solve real workflow problems. It focuses on practical functionality over flashy features.*