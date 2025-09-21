# Ottokode Architecture

This document describes the unified architecture for Ottokode's web and desktop applications.

## 🏗️ Project Structure

```
ottokode/
├── shared/                     # Shared library package
│   ├── src/
│   │   ├── config/            # Environment, security, routes
│   │   ├── services/          # AI, platform adapters
│   │   ├── types/             # Shared TypeScript types
│   │   └── utils/             # Common utilities
│   └── package.json
├── web-app/                   # Next.js web application
│   ├── app/                   # Next.js app router
│   ├── src/                   # Web-specific components & services
│   └── package.json
├── src-tauri/                 # Tauri desktop wrapper
│   ├── src/                   # Rust backend code
│   └── Cargo.toml
├── scripts/                   # Build and deployment scripts
└── package.json              # Root workspace configuration
```

## 🔧 Architecture Principles

### 1. **Shared-First Design**
- Common functionality lives in `@ottokode/shared` package
- Platform-specific code in respective directories
- Type-safe interfaces across all packages

### 2. **Platform Abstraction**
- Unified service interfaces with platform-specific implementations
- Environment detection for web vs desktop contexts
- Consistent API across platforms

### 3. **Security by Design**
- Centralized security configuration
- Content Security Policy (CSP) without unsafe directives
- Environment variable validation and sanitization

### 4. **Unified Routing**
- Platform-aware route configuration
- Consistent navigation between web and desktop
- Authentication-aware routing

## 📦 Package Organization

### Root Package (`package.json`)
- **Type**: NPM workspaces monorepo
- **Purpose**: Orchestrates builds, manages shared dependencies
- **Scripts**: Unified build commands for all targets

### Shared Package (`shared/`)
- **Type**: TypeScript library
- **Purpose**: Common functionality, types, and services
- **Exports**: Modular exports for selective importing

### Web App (`web-app/`)
- **Type**: Next.js application
- **Purpose**: Web interface with SSR/SSG capabilities
- **Features**: Server-side rendering, API routes, dynamic imports

### Desktop App (`src-tauri/`)
- **Type**: Tauri application
- **Purpose**: Native desktop wrapper
- **Features**: File system access, system integration, offline support

## 🔐 Security Architecture

### Content Security Policy
- **Strict CSP**: No `unsafe-inline` or `unsafe-eval` in production
- **Nonce-based**: Dynamic nonces for scripts when needed
- **Platform-aware**: Different policies for web vs desktop

### Environment Management
- **Validation**: Required environment variables checked at startup
- **Sanitization**: Automatic detection of placeholder values
- **Type-safe**: Full TypeScript support for configuration

### API Security
- **Authentication**: Supabase-based auth with JWT tokens
- **Rate limiting**: Built-in rate limiting for API endpoints
- **Input validation**: Request validation middleware

## 🤖 AI Service Architecture

### Provider Pattern
```typescript
interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateText(prompt: string): Promise<string>;
  generateCode(prompt: string, language?: string): Promise<string>;
  chat(messages: ChatMessage[]): Promise<string>;
}
```

### Available Providers
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3 Sonnet, Haiku
- **Google**: Gemini Pro (planned)
- **Cohere**: Command models (planned)
- **Mistral**: Mistral models (planned)

### Service Management
- **Registry**: Centralized provider registration
- **Fallback**: Automatic provider switching on failures
- **Credits**: Integration with billing system for usage tracking

## 🚀 Build System

### Development
```bash
npm run dev              # Start web development server
npm run dev:desktop      # Start desktop development with hot reload
npm run build:shared     # Build shared package only
```

### Production
```bash
npm run build:production    # Build optimized web app
npm run tauri:build:release # Build desktop app with web app
node scripts/build.js desktop # Complete desktop build
```

### Build Pipeline
1. **Dependency Installation**: `npm install` (workspace-aware)
2. **Shared Package**: TypeScript compilation with declarations
3. **Type Checking**: Full project type validation
4. **Linting**: Code quality checks
5. **Web Build**: Next.js optimization and bundling
6. **Desktop Build**: Tauri compilation and packaging

## 🛣️ Routing System

### Route Configuration
```typescript
interface RouteConfig {
  path: string;
  name: string;
  title: string;
  requiresAuth?: boolean;
  webOnly?: boolean;
  desktopOnly?: boolean;
  icon?: string;
}
```

### Platform-Aware Navigation
- **Web Routes**: Full navigation with public pages
- **Desktop Routes**: Focused on authenticated features
- **Shared Routes**: Core functionality available everywhere

### Authentication Flow
- **Web**: Redirect to `/login` for authentication
- **Desktop**: Show user agreement, then authenticate
- **Protected**: Automatic redirection for unauthorized access

## 🔄 Platform Services

### File System Abstraction
```typescript
interface PlatformAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}
```

### Web Implementation
- **Storage**: localStorage/IndexedDB for file simulation
- **Notifications**: Browser Notification API
- **URLs**: `window.open` for external links

### Desktop Implementation
- **Storage**: Native file system via Tauri APIs
- **Notifications**: System notifications
- **URLs**: System default browser

## 📱 Platform Detection

### Environment Context
```typescript
interface PlatformContext {
  isDesktop: boolean;
  isWeb: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
}
```

### Feature Flags
- **AI Chat**: Available on both platforms
- **Billing**: Web-only (Stripe integration)
- **File System**: Enhanced on desktop
- **Collaboration**: Platform-agnostic

## 🧪 Testing Strategy

### Unit Tests
- **Shared**: Jest with TypeScript
- **Web**: Next.js testing utilities
- **Desktop**: Tauri test framework

### Integration Tests
- **API**: Supertest for endpoint testing
- **E2E**: Playwright for cross-platform testing
- **Desktop**: Tauri integration tests

### Security Tests
- **CSP**: Header validation
- **Environment**: Configuration testing
- **Authentication**: Flow validation

## 🚀 Deployment

### Web Application
- **Platform**: Vercel (recommended) or Netlify
- **Build**: `npm run build:production`
- **Environment**: Production environment variables required

### Desktop Application
- **Platforms**: macOS, Windows, Linux
- **Build**: `npm run tauri:build:release`
- **Distribution**: GitHub Releases with automated CI/CD

### Continuous Integration
```yaml
# Example GitHub Actions workflow
name: Build and Release
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

## 🔧 Development Guidelines

### Code Organization
1. **Shared First**: Common logic goes in `shared/`
2. **Platform Specific**: Only when absolutely necessary
3. **Type Safety**: Full TypeScript coverage required
4. **Security**: Security considerations in all decisions

### Adding New Features
1. **Design**: Create interfaces in `shared/types/`
2. **Implementation**: Shared logic in `shared/services/`
3. **Platform**: Platform-specific adapters if needed
4. **Testing**: Unit and integration tests required

### Environment Variables
```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional AI providers
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key

# Web-only features
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

## 📈 Performance Considerations

### Bundle Optimization
- **Code Splitting**: Automatic by Next.js and Vite
- **Tree Shaking**: Dead code elimination
- **Dynamic Imports**: Platform-specific features loaded on demand

### Caching Strategy
- **Static Assets**: Long-term caching with hashing
- **API Responses**: Intelligent caching with invalidation
- **Build Artifacts**: Incremental builds where possible

### Memory Management
- **Service Instances**: Singleton pattern for shared services
- **Event Listeners**: Proper cleanup on component unmount
- **Large Data**: Streaming and pagination where appropriate

## 🛡️ Security Considerations

### Input Validation
- **Environment Variables**: Type checking and sanitization
- **User Input**: Validation at service boundaries
- **API Requests**: Schema validation and rate limiting

### Secret Management
- **Development**: `.env.local` files (gitignored)
- **Production**: Environment-specific secret management
- **Build Time**: No secrets in client bundles

### Attack Prevention
- **XSS**: Strict CSP and input sanitization
- **CSRF**: Supabase built-in protection
- **SQL Injection**: Parameterized queries only
- **Rate Limiting**: API endpoint protection

This architecture provides a robust, scalable, and secure foundation for both web and desktop versions of Ottokode while maintaining code reusability and development efficiency.