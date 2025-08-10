# Contributing to Job Application Assistant

Thank you for your interest in contributing to Job Application Assistant! We welcome contributions from the community.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/job-application-assistant.git
   cd job-application-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for testing**
   ```bash
   npm run build
   ```

## Code Guidelines

- **TypeScript**: All new code should be written in TypeScript
- **React**: Use functional components with hooks
- **Styling**: Use Tailwind CSS for consistent styling
- **Storage**: Use the existing storage classes for data management
- **Languages**: Support both Chinese and English where applicable

## Testing Your Changes

1. Build the extension with `npm run build`
2. Load the `dist/` folder in Chrome extensions
3. Test both the popup and dashboard interfaces
4. Test with both Chinese and English datasets
5. Verify backup/restore functionality works

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Test thoroughly in Chrome
4. Update documentation if needed
5. Submit a pull request with a clear description

## Reporting Issues

When reporting issues, please include:
- Browser version
- Extension version
- Steps to reproduce
- Console error logs (if any)
- Screenshots (if UI-related)

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this tool to help job seekers worldwide.