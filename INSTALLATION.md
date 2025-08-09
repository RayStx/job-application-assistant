# Installation Guide

## Quick Start

### 1. Get the Extension

**Option A: Download Release**
- Download the latest release from [Releases page](https://github.com/YOUR_USERNAME/job-assistant-extension/releases)
- Extract the ZIP file

**Option B: Build from Source**
```bash
git clone https://github.com/YOUR_USERNAME/job-assistant-extension.git
cd job-assistant-extension
npm install
npm run build
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### 3. Setup API Key

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Click the extension icon in Chrome
3. Enter your API key when prompted
4. The key is stored securely in local storage

### 4. Start Using

- Click the extension icon on any job posting page
- Use "Parse Current Page" to extract job information
- Access the dashboard to manage applications, resumes, and cover letters

## System Requirements

- Google Chrome 88+ (or any Chromium-based browser)
- OpenAI API access
- ~5MB free storage space

## Troubleshooting

**Extension not loading?**
- Make sure Developer mode is enabled
- Check that you selected the `dist/` folder (not the root project folder)

**Parsing not working?**
- Verify your OpenAI API key is correct
- Check your internet connection
- Ensure you have sufficient API credits

**Need help?**
- Check the [Issues page](https://github.com/YOUR_USERNAME/job-assistant-extension/issues)
- Create a new issue with details about your problem