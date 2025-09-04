# 🤝 Contributing to Fellowz Chat App

Thank you for your interest in contributing to Fellowz Chat App! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project follows a code of conduct that we expect all contributors to adhere to:

- **Be respectful** - Treat everyone with respect and kindness
- **Be inclusive** - Welcome contributors from all backgrounds
- **Be constructive** - Provide helpful feedback and suggestions
- **Be patient** - Remember that everyone is learning and growing

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- A Supabase account (for testing)
- A code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/fellowz-chat-app.git
   cd fellowz-chat-app
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/fellowz-chat-app.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp env.template .env.local
```

Fill in your `.env.local` with test credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_key
```

### 3. Database Setup
1. Create a test Supabase project
2. Run the schema from `supabase-schema.sql`
3. Run the quick fix from `QUICK_DATABASE_FIX.sql`

### 4. Start Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── profile/           # Profile pages
│   └── setup-profile/     # Profile setup
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── chat/              # Chat components
│   ├── friends/           # Friend system
│   ├── profile/           # Profile components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── types/                 # TypeScript definitions
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type - use specific types
- Use strict type checking

### React
- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement proper error boundaries

### Styling
- Use Tailwind CSS for styling
- Follow mobile-first approach
- Use consistent spacing and colors
- Ensure accessibility compliance

### File Naming
- Use kebab-case for files: `user-profile.tsx`
- Use PascalCase for components: `UserProfile`
- Use camelCase for functions: `getUserProfile`

### Code Organization
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper folder structure
- Add meaningful comments

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add Google OAuth integration
fix(chat): resolve message duplication issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(profile): extract profile validation logic
test(api): add tests for user endpoints
chore(deps): update dependencies
```

## 🔄 Pull Request Process

### Before Submitting
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Test your changes**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes** with proper commit messages

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Template
When creating a PR, include:

- **Description** of what the PR does
- **Type of change** (bug fix, feature, etc.)
- **Testing** - how you tested the changes
- **Screenshots** (if UI changes)
- **Breaking changes** (if any)
- **Related issues** (if any)

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on staging environment
4. **Approval** and merge

## 🐛 Issue Guidelines

### Before Creating an Issue
1. **Search existing issues** to avoid duplicates
2. **Check if it's already fixed** in the latest version
3. **Gather information** about the problem

### Bug Reports
Include:
- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, browser, version)
- **Screenshots** or error messages
- **Console logs** (if applicable)

### Feature Requests
Include:
- **Clear description** of the feature
- **Use case** and motivation
- **Proposed solution** (if you have one)
- **Alternatives** considered
- **Additional context**

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write tests for new features
- Test both happy path and edge cases
- Use descriptive test names
- Mock external dependencies
- Aim for good test coverage

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex logic
- Keep comments up to date
- Use clear, concise language

### README Updates
- Update README for new features
- Add installation instructions
- Include usage examples
- Keep screenshots current

### API Documentation
- Document API endpoints
- Include request/response examples
- Add error handling information
- Keep documentation in sync with code

## 🎯 Areas for Contribution

### High Priority
- 🐛 Bug fixes
- 📱 Mobile responsiveness improvements
- ♿ Accessibility enhancements
- 🧪 Test coverage improvements
- 📚 Documentation updates

### Medium Priority
- ✨ New features
- 🎨 UI/UX improvements
- ⚡ Performance optimizations
- 🔧 Developer experience improvements

### Low Priority
- 🎨 Design system improvements
- 🌐 Internationalization
- 📊 Analytics integration
- 🔌 Plugin system

## 💡 Getting Help

### Questions and Support
- **GitHub Discussions** - For general questions
- **GitHub Issues** - For bug reports and feature requests
- **Discord/Slack** - For real-time chat (if available)

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** - Contributors section
- **Release notes** - For significant contributions
- **GitHub** - Contributor badges and mentions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Fellowz Chat App! 🎉**

*Together, we can build an amazing chat experience for everyone!*
