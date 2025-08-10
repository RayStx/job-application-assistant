# Job Application Assistant

[中文文档](./README_CN.md) | English Documentation

A Chrome extension that helps you manage job applications, resumes, and cover letters in one place.

## What problem does this solve?

When you're applying to multiple positions, you end up with a mess: different versions of your resume scattered across folders, cover letters with similar but slightly different content, and no easy way to track which version you sent to which company. 

This extension was built during a PhD job search to solve exactly these problems. You can parse job postings directly from company websites (or add them manually), create targeted resume versions for different types of positions, write customized cover letters, and keep everything organized with clear links between applications and the documents you submitted.

The extension supports separate Chinese and English application workflows since job hunting often spans different markets, and all your data stays local in your browser - no cloud sync, no privacy concerns.

## Core functionality

**Job tracking**: Parse job postings from websites (currently tested on Chinese platforms like 阿里, 字节, 腾讯) or add positions manually. Track application status from initial save to final outcome.

**Resume management**: Create multiple resume versions using a LaTeX editor with version control. Build reusable sections (education, experience, projects) that you can mix and match for different applications. Each resume version can be linked to specific applications so you always know what you sent where.

**Cover letter workflow**: Similar to resumes but optimized for cover letters - especially useful for international applications where personalized cover letters are expected.

**Data organization**: Everything is connected. You can see which resume version and cover letter you used for each application, compare different versions of documents, and export your data if needed.

## Installation

Since this is a development version, installation requires a few manual steps, but we've made it as simple as possible.

### Quick install with helper script

1. Download the extension from [releases](https://github.com/RayStx/job-application-assistant/releases)
2. Extract the ZIP file to any folder
3. Run the install helper:
   - **Windows**: Double-click `install.bat`
   - **Mac/Linux**: Open terminal in the folder and run `./install.sh`
4. The script will open Chrome's extension page automatically
5. Enable "Developer mode" (toggle in top-right)
6. Click "Load unpacked" and select the extension folder
7. Done! The extension icon will appear in your Chrome toolbar

### Manual installation

If the script doesn't work, you can install manually:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the folder containing `manifest.json`

## Usage notes

**First time setup**: Click the extension icon and you can optionally add an OpenAI API key for automatic job parsing. This isn't required - you can always add job information manually.

**Job parsing**: When you're on a job posting page, click the extension icon and select "Parse Current Page". The extension will try to extract job details automatically. Review and edit before saving.

**Resume workflow**: Go to the Resume tab in the dashboard. Create sections in the Library tab (education, experience, etc.), then use these sections to build different resume versions. Each version gets automatic version numbers and you can link them to specific applications.

**Cover letters**: Similar workflow to resumes. Create multiple versions for different types of positions and link them to applications.

**Data management**: Use the language toggle to switch between Chinese and English application sets. The backup feature lets you export all your data or restore from previous backups.

## Important limitations

This is a development version built for a specific workflow. It's not suitable for everyone:

- Installation requires enabling Chrome's developer mode
- Job parsing currently works best on Chinese platforms
- No mobile app - Chrome extension only
- Assumes you're comfortable with some technical setup

The extension was built to solve real problems during a PhD job search, not to be a polished consumer product. If you need something more user-friendly, there are other tools available.

## Technical details

Built with React, TypeScript, and Chrome's Extension API. Uses local browser storage only - no external servers except optional OpenAI calls for job parsing. LaTeX editor included for resume compilation.

## Repository and issues

- **Code**: https://github.com/RayStx/job-application-assistant
- **Issues**: https://github.com/RayStx/job-application-assistant/issues

---

Built during a PhD job search to solve real workflow problems. Shared in case it helps others with similar needs.