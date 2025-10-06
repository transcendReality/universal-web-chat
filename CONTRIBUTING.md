# Contributing to Universal Web Chat

Thank you for your interest in contributing to the Universal Web Chat browser extension! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork
   ```
   git clone https://github.com/YOUR_USERNAME/universal-web-chat.git
   cd universal-web-chat
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Create a branch for your feature
   ```
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes
2. Test your changes in multiple browsers
3. Ensure code follows project standards
4. Submit a pull request

## Code Standards

### Module System
- Always use ES Module syntax (import/export)
- Never use CommonJS syntax (require/module.exports)
- Add file extensions to imports (.js, .vue)

### Coding Style
- Use consistent indentation (2 spaces)
- Follow ESLint rules
- Add JSDoc comments for functions and classes
- Use meaningful variable and function names

### Browser Compatibility
- Test in all target browsers (Chrome, Firefox, Edge, Brave)
- Implement feature detection, not browser detection
- Use polyfills for missing features

### Commit Messages
- Use clear, descriptive commit messages
- Follow conventional commits format when possible
- Reference issue numbers when applicable

## Testing

Before submitting a pull request, test your changes in all supported browsers:
- Chrome
- Firefox
- Edge
- Brave

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the version number in package.json following semantic versioning
3. The PR will be merged once it passes review and testing

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.
