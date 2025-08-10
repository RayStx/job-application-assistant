# Job Application Assistant

[中文文档](./README_CN.md) | English Documentation

A Chrome extension born from the chaos of PhD job hunting.

## The problem I was trying to solve

During my PhD job search, I found myself drowning in a mess of files. Resume_v1.pdf, Resume_final.pdf, Resume_ACTUALLY_final.pdf scattered across Desktop and Downloads. Cover letters with 90% identical content but slightly tweaked for different positions. Worst of all, I had no clue which version I'd sent to which company - did I send the research-heavy resume to that startup, or was it the industry-focused one?

I was applying to both Chinese companies (阿里, 字节, 腾讯) and international positions, which meant managing two completely separate workflows. The existing tools either cost too much for a broke PhD student, required uploading data to random servers, or were built for HR departments rather than job seekers.

I needed something that could parse job postings automatically (because manually copying job descriptions is mind-numbing), let me build targeted resume versions without starting from scratch each time, and most importantly, keep track of what I sent where.

## How I solved it

**Job parsing**: Built a parser that extracts job details from posting pages. I tested it extensively on Chinese job platforms since that's where I was applying most. It uses OpenAI's API to make sense of the page content, but it's optional - manual entry works fine too.

**Resume versioning**: Instead of managing countless files, I created a modular system. I can build reusable sections (education, work experience, projects) and mix them into different resume versions. Each version gets automatic numbering and links to specific applications. The LaTeX editor means I can get properly formatted PDFs without fighting with Word.

**Cover letter workflow**: Similar approach for cover letters, especially important since international applications usually expect personalized letters. I can see which letter version went with which application.

**Separate datasets**: Chinese and English applications live in completely separate data spaces. No more accidentally sending a Chinese resume to an international position.

**Local storage**: Everything stays in the browser. No accounts, no servers, no monthly fees, no privacy concerns.

## Getting it running

This is a development extension, so installation involves a few manual steps. I've included helper scripts to make it easier:

**Automatic setup**:
1. Download from [releases](https://github.com/RayStx/job-application-assistant/releases) and extract
2. Run the install script (`install.bat` on Windows, `./install.sh` on Mac/Linux)
3. The script opens Chrome's extension page
4. Enable "Developer mode" and click "Load unpacked"
5. Select the extension folder

**Manual setup**: Go to `chrome://extensions/`, enable developer mode, load unpacked extension.

First run: Click the extension icon to optionally add an OpenAI API key for job parsing.

## What it actually does

**Job parsing**: On a job posting page, click the extension to parse details automatically. I mainly tested this on Chinese platforms, but manual entry works everywhere.

**Resume building**: The Library tab is where I build reusable sections. Then I assemble different resume versions from these sections, each getting a version number and linking to specific applications.

**Cover letters**: Same modular approach. Build templates, create versions, link to applications.

**Language switching**: Toggle between Chinese and English datasets. Backup function exports everything or restores from previous backups.

## What this isn't

This extension solved my specific PhD job search problems, but it's not for everyone:

- Requires developer mode installation
- Job parsing works best on Chinese platforms (that's where I tested it)
- No mobile version
- Built by someone who needed it, not a product team
- Assumes basic technical comfort

If this workflow doesn't match what's needed, there are plenty of polished alternatives out there.

## Technical bits

React + TypeScript + Chrome Extension API. Local browser storage only, except for optional OpenAI calls. Includes a LaTeX editor for proper resume formatting.

---

**Code**: https://github.com/RayStx/job-application-assistant  
**Issues**: https://github.com/RayStx/job-application-assistant/issues

Built during PhD job hunting when existing tools didn't match my workflow. Sharing in case others have similar frustrations.