# Next.js Integration Guide

This guide explains how to integrate your existing Next.js project with the Branchcode AI desktop application.

## Architecture Options

### Option 1: Hybrid Architecture (Recommended)

```
branchcode-ai/
├── src/                    # Desktop app (Tauri + React)
├── web-app/               # Next.js web app
├── shared/                # Shared components & services
├── website/               # Static marketing/download site
└── package.json           # Root package with workspaces
```

**Benefits:**
- Share core components and logic
- Platform-specific optimizations
- Independent deployment
- Consistent branding and UX

### Option 2: Embedded Web App

```
branchcode-ai/
├── src/                   # Desktop app
│   └── components/
│       └── WebView.tsx    # Embedded Next.js app
├── web-app/              # Next.js app
└── src-tauri/            # Tauri backend
```

**Benefits:**
- Single codebase
- Easier maintenance
- Automatic feature parity

## Setup Instructions

### Step 1: Analyze Your Next.js Project

Please share:

1. **Project location**: Where is your Next.js project?
2. **Styling approach**: Tailwind, styled-components, CSS modules?
3. **Key components**: What components do you want to share?
4. **Dependencies**: Any specific libraries we need to consider?

### Step 2: Choose Integration Method

**Method A: Copy Your Next.js Project**

```bash
# Copy your Next.js project to web-app directory
cp -r /path/to/your/nextjs-project ./web-app/

# Install dependencies
cd web-app && npm install

# Update configuration
```

**Method B: Set Up Monorepo**

```bash
# Update root package.json for workspaces
npm init -w web-app
npm init -w shared

# Move shared components
mkdir -p shared/components
# Copy components from your Next.js project
```

### Step 3: Share Components

#### Extract Shared Components

1. **From your Next.js project**, identify reusable components:
   - UI components (buttons, inputs, modals)
   - Layout components (sidebars, headers)
   - Editor-related components
   - Authentication components

2. **Move to shared directory**:
   ```bash
   shared/
   ├── components/
   │   ├── ui/           # Basic UI components
   │   ├── editor/       # Code editor components
   │   ├── auth/         # Authentication
   │   └── layout/       # Layout components
   ├── hooks/            # Custom React hooks
   ├── services/         # API services
   ├── styles/           # Shared styles/themes
   └── types/            # TypeScript definitions
   ```

#### Update Imports

**In Desktop App (src/):**
```typescript
// Before
import { Button } from './components/ui/Button';

// After
import { Button } from '@shared/components/ui/Button';
```

**In Web App (web-app/):**
```typescript
// Before
import { CodeEditor } from './components/CodeEditor';

// After
import { CodeEditor } from '@shared/components/editor/CodeEditor';
```

### Step 4: Configure Build Pipeline

#### Root package.json (Workspaces)

```json
{
  "name": "branchcode-ai-monorepo",
  "private": true,
  "workspaces": [
    "shared",
    "web-app",
    "."
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:desktop\" \"npm run dev:web\"",
    "dev:desktop": "vite",
    "dev:web": "npm run dev --workspace=web-app",
    "build": "npm run build:shared && npm run build:desktop && npm run build:web",
    "build:shared": "tsc --build shared/tsconfig.json",
    "build:desktop": "npm run build",
    "build:web": "npm run build --workspace=web-app",
    "tauri:build": "npm run build && tauri build"
  }
}
```

#### TypeScript Configuration

**shared/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "outDir": "./dist",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**web-app/next.config.js:**
```javascript
const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, '../shared'),
    };
    return config;
  },
  transpilePackages: ['@shared'],
};
```

### Step 5: Style Integration

#### Option A: Shared Tailwind Configuration

**shared/tailwind.config.js:**
```javascript
module.exports = {
  content: [
    '../src/**/*.{js,ts,jsx,tsx}',
    '../web-app/**/*.{js,ts,jsx,tsx}',
    './**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007acc',
        secondary: '#1e1e1e',
        // Your custom colors
      },
    },
  },
  plugins: [],
};
```

#### Option B: CSS Variables for Consistency

**shared/styles/theme.css:**
```css
:root {
  --color-primary: #007acc;
  --color-secondary: #1e1e1e;
  --color-accent: #0078d4;

  /* Your existing design tokens */
  --font-family: 'Inter', sans-serif;
  --border-radius: 8px;
  --spacing-unit: 0.25rem;
}
```

### Step 6: Platform-Specific Features

#### Desktop-Specific Features

```typescript
// shared/services/PlatformService.ts
export const usePlatformFeatures = () => {
  const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;

  return {
    fileSystem: isDesktop ?
      () => import('../src/services/filesystem/FileSystemService') :
      () => import('./web/WebFileSystemService'),

    nativeMenus: isDesktop,
    systemIntegration: isDesktop,
    offline: isDesktop,
  };
};
```

#### Web-Specific Features

```typescript
// web-app/components/WebFileUpload.tsx
export const WebFileUpload = () => {
  const [files, setFiles] = useState<WebFile[]>([]);

  const handleFileUpload = async (fileList: FileList) => {
    const webFiles = await webFileSystemService.importFiles(fileList);
    setFiles(webFiles);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      {/* File list display */}
    </div>
  );
};
```

## Migration Checklist

### Pre-Migration

- [ ] Audit your Next.js project structure
- [ ] Identify components to share vs. keep platform-specific
- [ ] Note any platform-specific dependencies
- [ ] Document current styling approach

### During Migration

- [ ] Set up workspace structure
- [ ] Move shared components to `shared/`
- [ ] Update import paths
- [ ] Configure build pipeline
- [ ] Test both desktop and web builds

### Post-Migration

- [ ] Verify feature parity between platforms
- [ ] Test platform-specific features
- [ ] Update documentation
- [ ] Set up CI/CD for both platforms

## Common Patterns

### Responsive Components

```typescript
// shared/components/ResponsiveEditor.tsx
import { useIsMobile } from '@shared/hooks/useIsMobile';

export const ResponsiveEditor = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`editor ${isMobile ? 'mobile' : 'desktop'}`}>
      {isMobile ? <MobileEditor /> : <DesktopEditor />}
    </div>
  );
};
```

### Platform Detection

```typescript
// shared/hooks/usePlatform.ts
export const usePlatform = () => {
  const [platform, setPlatform] = useState<'desktop' | 'web'>('web');

  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;
    setPlatform(isDesktop ? 'desktop' : 'web');
  }, []);

  return platform;
};
```

### Conditional Features

```typescript
// shared/components/ConditionalFeature.tsx
export const ConditionalFeature = ({
  children,
  platform
}: {
  children: React.ReactNode;
  platform: 'desktop' | 'web' | 'both';
}) => {
  const currentPlatform = usePlatform();

  if (platform === 'both' || platform === currentPlatform) {
    return <>{children}</>;
  }

  return null;
};
```

## Next Steps

1. **Share your Next.js project structure** so I can provide specific migration instructions
2. **Choose your preferred integration method** (hybrid vs. embedded)
3. **Identify priority components** to migrate first
4. **Set up the development environment** for both platforms

Would you like me to help you with any specific part of this integration?