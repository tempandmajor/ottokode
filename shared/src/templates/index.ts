/**
 * Project Template Definitions
 * Pre-configured templates for different project types
 */

import type { ProjectTemplate } from '../types/project-templates';

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // iOS Templates
  {
    id: 'ios-swift-app',
    name: 'iOS App (Swift)',
    description: 'Native iOS application using Swift and UIKit',
    category: 'mobile-ios',
    icon: '📱',
    platforms: ['ios'],
    languages: ['swift'],
    frameworks: ['UIKit', 'Foundation'],
    tags: ['mobile', 'native', 'swift', 'ios'],
    difficulty: 'beginner',
    estimatedSetupTime: '2-3 minutes',
    preview: {
      description: 'A complete iOS project with storyboards, view controllers, and basic navigation.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'App.xcodeproj', type: 'directory' },
        { path: 'App', type: 'directory' },
        { path: 'App/AppDelegate.swift', type: 'file', template: 'ios-app-delegate' },
        { path: 'App/SceneDelegate.swift', type: 'file', template: 'ios-scene-delegate' },
        { path: 'App/ViewController.swift', type: 'file', template: 'ios-view-controller' },
        { path: 'App/Main.storyboard', type: 'file', template: 'ios-main-storyboard' },
        { path: 'App/LaunchScreen.storyboard', type: 'file', template: 'ios-launch-storyboard' },
        { path: 'App/Info.plist', type: 'file', template: 'ios-info-plist' },
        { path: 'App/Assets.xcassets', type: 'directory' },
        { path: 'App/Assets.xcassets/AppIcon.appiconset', type: 'directory' },
        { path: 'App/Assets.xcassets/Contents.json', type: 'file', template: 'ios-assets-contents' }
      ],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'configure-app',
          title: 'Configure App Details',
          description: 'Set up your app name, bundle identifier, and target iOS version',
          type: 'user-input',
          userPrompt: {
            type: 'text',
            message: 'What is your app bundle identifier? (e.g., com.yourname.appname)',
            validation: { required: true, pattern: '^[a-zA-Z0-9.-]+$' }
          }
        }
      ]
    }
  },

  {
    id: 'ios-swiftui-app',
    name: 'iOS App (SwiftUI)',
    description: 'Modern iOS application using SwiftUI',
    category: 'mobile-ios',
    icon: '🎨',
    platforms: ['ios'],
    languages: ['swift'],
    frameworks: ['SwiftUI', 'Combine'],
    tags: ['mobile', 'native', 'swift', 'swiftui', 'modern'],
    difficulty: 'intermediate',
    estimatedSetupTime: '2-3 minutes',
    preview: {
      description: 'A SwiftUI-based iOS project with declarative UI and modern Swift patterns.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'App.xcodeproj', type: 'directory' },
        { path: 'App', type: 'directory' },
        { path: 'App/App.swift', type: 'file', template: 'swiftui-app' },
        { path: 'App/ContentView.swift', type: 'file', template: 'swiftui-content-view' },
        { path: 'App/Assets.xcassets', type: 'directory' },
        { path: 'App/Preview Content', type: 'directory' },
        { path: 'App/Preview Content/Preview Assets.xcassets', type: 'directory' },
        { path: 'App/Info.plist', type: 'file', template: 'swiftui-info-plist' }
      ],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: []
    }
  },

  // Android Templates
  {
    id: 'android-kotlin-app',
    name: 'Android App (Kotlin)',
    description: 'Native Android application using Kotlin',
    category: 'mobile-android',
    icon: '🤖',
    platforms: ['android'],
    languages: ['kotlin'],
    frameworks: ['Android SDK', 'Jetpack'],
    tags: ['mobile', 'native', 'kotlin', 'android'],
    difficulty: 'beginner',
    estimatedSetupTime: '3-4 minutes',
    preview: {
      description: 'A complete Android project with activities, layouts, and Gradle configuration.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'app', type: 'directory' },
        { path: 'app/src/main/java/com/example/app', type: 'directory' },
        { path: 'app/src/main/java/com/example/app/MainActivity.kt', type: 'file', template: 'android-main-activity' },
        { path: 'app/src/main/res/layout', type: 'directory' },
        { path: 'app/src/main/res/layout/activity_main.xml', type: 'file', template: 'android-main-layout' },
        { path: 'app/src/main/res/values', type: 'directory' },
        { path: 'app/src/main/res/values/strings.xml', type: 'file', template: 'android-strings' },
        { path: 'app/src/main/res/values/colors.xml', type: 'file', template: 'android-colors' },
        { path: 'app/src/main/res/values/themes.xml', type: 'file', template: 'android-themes' },
        { path: 'app/src/main/AndroidManifest.xml', type: 'file', template: 'android-manifest' },
        { path: 'app/build.gradle', type: 'file', template: 'android-app-gradle' },
        { path: 'build.gradle', type: 'file', template: 'android-project-gradle' },
        { path: 'gradle.properties', type: 'file', template: 'android-gradle-properties' },
        { path: 'settings.gradle', type: 'file', template: 'android-settings-gradle' }
      ],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'configure-package',
          title: 'Configure Package Name',
          description: 'Set your Android app package name',
          type: 'user-input',
          userPrompt: {
            type: 'text',
            message: 'What is your app package name? (e.g., com.yourname.appname)',
            validation: { required: true, pattern: '^[a-zA-Z0-9.]+$' }
          }
        }
      ]
    }
  },

  // Cross-Platform Mobile
  {
    id: 'react-native-app',
    name: 'React Native App',
    description: 'Cross-platform mobile app with React Native',
    category: 'mobile-cross-platform',
    icon: '⚛️',
    platforms: ['ios', 'android'],
    languages: ['javascript', 'typescript'],
    frameworks: ['React Native', 'Metro'],
    tags: ['mobile', 'cross-platform', 'react', 'javascript'],
    difficulty: 'intermediate',
    estimatedSetupTime: '4-5 minutes',
    preview: {
      description: 'A React Native project that runs on both iOS and Android with shared codebase.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'src', type: 'directory' },
        { path: 'src/App.tsx', type: 'file', template: 'rn-app' },
        { path: 'src/components', type: 'directory' },
        { path: 'src/screens', type: 'directory' },
        { path: 'src/navigation', type: 'directory' },
        { path: 'android', type: 'directory' },
        { path: 'ios', type: 'directory' },
        { path: 'package.json', type: 'file', template: 'rn-package-json' },
        { path: 'tsconfig.json', type: 'file', template: 'rn-tsconfig' },
        { path: 'metro.config.js', type: 'file', template: 'rn-metro-config' },
        { path: 'babel.config.js', type: 'file', template: 'rn-babel-config' }
      ],
      dependencies: [
        { name: 'react', version: '^18.0.0', type: 'dependency', manager: 'npm' },
        { name: 'react-native', version: '^0.72.0', type: 'dependency', manager: 'npm' },
        { name: '@react-native-community/cli', version: '^11.0.0', type: 'devDependency', manager: 'npm' },
        { name: '@types/react', version: '^18.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependency', manager: 'npm' }
      ],
      scripts: {
        'android': 'react-native run-android',
        'ios': 'react-native run-ios',
        'start': 'react-native start',
        'test': 'jest',
        'lint': 'eslint . --ext .js,.jsx,.ts,.tsx'
      },
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'install-dependencies',
          title: 'Install Dependencies',
          description: 'Installing React Native and required packages',
          type: 'command',
          command: 'npm install'
        }
      ]
    }
  },

  // Web Templates
  {
    id: 'nextjs-app',
    name: 'Next.js App',
    description: 'Modern React web application with Next.js',
    category: 'web-fullstack',
    icon: '🌐',
    platforms: ['web'],
    languages: ['typescript', 'javascript'],
    frameworks: ['Next.js', 'React', 'Tailwind CSS'],
    tags: ['web', 'react', 'nextjs', 'ssr', 'modern'],
    difficulty: 'intermediate',
    estimatedSetupTime: '3-4 minutes',
    preview: {
      description: 'A full-stack Next.js application with TypeScript, Tailwind CSS, and modern tooling.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'src/app', type: 'directory' },
        { path: 'src/app/layout.tsx', type: 'file', template: 'nextjs-layout' },
        { path: 'src/app/page.tsx', type: 'file', template: 'nextjs-page' },
        { path: 'src/app/globals.css', type: 'file', template: 'nextjs-globals-css' },
        { path: 'src/components', type: 'directory' },
        { path: 'src/lib', type: 'directory' },
        { path: 'public', type: 'directory' },
        { path: 'package.json', type: 'file', template: 'nextjs-package-json' },
        { path: 'tsconfig.json', type: 'file', template: 'nextjs-tsconfig' },
        { path: 'tailwind.config.js', type: 'file', template: 'nextjs-tailwind-config' },
        { path: 'postcss.config.js', type: 'file', template: 'nextjs-postcss-config' },
        { path: 'next.config.js', type: 'file', template: 'nextjs-config' }
      ],
      dependencies: [
        { name: 'next', version: '^14.0.0', type: 'dependency', manager: 'npm' },
        { name: 'react', version: '^18.0.0', type: 'dependency', manager: 'npm' },
        { name: 'react-dom', version: '^18.0.0', type: 'dependency', manager: 'npm' },
        { name: 'tailwindcss', version: '^3.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependency', manager: 'npm' },
        { name: '@types/react', version: '^18.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'eslint', version: '^8.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'eslint-config-next', version: '^14.0.0', type: 'devDependency', manager: 'npm' }
      ],
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint'
      },
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'install-dependencies',
          title: 'Install Dependencies',
          description: 'Installing Next.js and required packages',
          type: 'command',
          command: 'npm install'
        }
      ]
    }
  },

  // Game Development
  {
    id: 'unity-game',
    name: 'Unity Game',
    description: 'Cross-platform game with Unity Engine',
    category: 'game',
    icon: '🎮',
    platforms: ['unity', 'ios', 'android', 'desktop'],
    languages: ['csharp'],
    frameworks: ['Unity Engine'],
    tags: ['game', 'unity', 'cross-platform', 'csharp'],
    difficulty: 'advanced',
    estimatedSetupTime: '5-7 minutes',
    preview: {
      description: 'A Unity project with scenes, scripts, and cross-platform deployment capabilities.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'Assets', type: 'directory' },
        { path: 'Assets/Scripts', type: 'directory' },
        { path: 'Assets/Scripts/GameManager.cs', type: 'file', template: 'unity-game-manager' },
        { path: 'Assets/Scripts/PlayerController.cs', type: 'file', template: 'unity-player-controller' },
        { path: 'Assets/Scenes', type: 'directory' },
        { path: 'Assets/Materials', type: 'directory' },
        { path: 'Assets/Prefabs', type: 'directory' },
        { path: 'ProjectSettings', type: 'directory' },
        { path: 'Packages', type: 'directory' },
        { path: 'Packages/manifest.json', type: 'file', template: 'unity-packages-manifest' }
      ],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'configure-game',
          title: 'Configure Game Settings',
          description: 'Set up your game name and target platforms',
          type: 'user-input',
          userPrompt: {
            type: 'multiselect',
            message: 'Which platforms would you like to target?',
            options: [
              { label: 'iOS', value: 'ios', description: 'iPhone and iPad' },
              { label: 'Android', value: 'android', description: 'Android devices' },
              { label: 'Windows', value: 'windows', description: 'Windows PC' },
              { label: 'macOS', value: 'macos', description: 'Mac computers' },
              { label: 'WebGL', value: 'webgl', description: 'Web browsers' }
            ]
          }
        }
      ]
    }
  },

  // Desktop Application
  {
    id: 'electron-app',
    name: 'Electron Desktop App',
    description: 'Cross-platform desktop application with Electron',
    category: 'desktop',
    icon: '💻',
    platforms: ['desktop', 'windows', 'macos', 'linux'],
    languages: ['typescript', 'javascript'],
    frameworks: ['Electron', 'React'],
    tags: ['desktop', 'electron', 'cross-platform', 'react'],
    difficulty: 'intermediate',
    estimatedSetupTime: '4-5 minutes',
    preview: {
      description: 'An Electron desktop application with React frontend and native system integration.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'src', type: 'directory' },
        { path: 'src/main', type: 'directory' },
        { path: 'src/main/main.ts', type: 'file', template: 'electron-main' },
        { path: 'src/main/preload.ts', type: 'file', template: 'electron-preload' },
        { path: 'src/renderer', type: 'directory' },
        { path: 'src/renderer/App.tsx', type: 'file', template: 'electron-renderer-app' },
        { path: 'src/renderer/index.tsx', type: 'file', template: 'electron-renderer-index' },
        { path: 'src/renderer/index.html', type: 'file', template: 'electron-renderer-html' },
        { path: 'package.json', type: 'file', template: 'electron-package-json' },
        { path: 'tsconfig.json', type: 'file', template: 'electron-tsconfig' },
        { path: 'webpack.config.js', type: 'file', template: 'electron-webpack-config' }
      ],
      dependencies: [
        { name: 'electron', version: '^27.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'react', version: '^18.0.0', type: 'dependency', manager: 'npm' },
        { name: 'react-dom', version: '^18.0.0', type: 'dependency', manager: 'npm' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'webpack', version: '^5.0.0', type: 'devDependency', manager: 'npm' },
        { name: 'electron-builder', version: '^24.0.0', type: 'devDependency', manager: 'npm' }
      ],
      scripts: {
        'dev': 'webpack serve --mode development',
        'build': 'webpack --mode production',
        'electron': 'electron dist/main/main.js',
        'electron:dev': 'concurrently "npm run dev" "wait-on http://localhost:3000 && electron ."',
        'dist': 'npm run build && electron-builder'
      },
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'install-dependencies',
          title: 'Install Dependencies',
          description: 'Installing Electron and required packages',
          type: 'command',
          command: 'npm install'
        }
      ]
    }
  },

  // API/Backend
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with Node.js and Express',
    category: 'api',
    icon: '🔌',
    platforms: ['node'],
    languages: ['typescript', 'javascript'],
    frameworks: ['Express.js', 'Node.js'],
    tags: ['backend', 'api', 'nodejs', 'express', 'rest'],
    difficulty: 'beginner',
    estimatedSetupTime: '2-3 minutes',
    preview: {
      description: 'A Node.js REST API with Express, TypeScript, and common middleware setup.'
    },
    scaffolding: {
      fileStructure: [
        { path: 'src', type: 'directory' },
        { path: 'src/index.ts', type: 'file', template: 'node-api-index' },
        { path: 'src/routes', type: 'directory' },
        { path: 'src/routes/index.ts', type: 'file', template: 'node-api-routes' },
        { path: 'src/middleware', type: 'directory' },
        { path: 'src/middleware/auth.ts', type: 'file', template: 'node-api-auth-middleware' },
        { path: 'src/controllers', type: 'directory' },
        { path: 'src/models', type: 'directory' },
        { path: 'src/utils', type: 'directory' },
        { path: 'package.json', type: 'file', template: 'node-api-package-json' },
        { path: 'tsconfig.json', type: 'file', template: 'node-api-tsconfig' },
        { path: '.env.example', type: 'file', template: 'node-api-env-example' }
      ],
      dependencies: [
        { name: 'express', version: '^4.18.0', type: 'dependency', manager: 'npm' },
        { name: 'cors', version: '^2.8.5', type: 'dependency', manager: 'npm' },
        { name: 'helmet', version: '^7.0.0', type: 'dependency', manager: 'npm' },
        { name: 'dotenv', version: '^16.0.0', type: 'dependency', manager: 'npm' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependency', manager: 'npm' },
        { name: '@types/express', version: '^4.17.0', type: 'devDependency', manager: 'npm' },
        { name: '@types/cors', version: '^2.8.0', type: 'devDependency', manager: 'npm' },
        { name: 'ts-node', version: '^10.9.0', type: 'devDependency', manager: 'npm' },
        { name: 'nodemon', version: '^3.0.0', type: 'devDependency', manager: 'npm' }
      ],
      scripts: {
        'dev': 'nodemon src/index.ts',
        'build': 'tsc',
        'start': 'node dist/index.js',
        'test': 'jest'
      },
      configuration: [],
      initialCode: [],
      setupSteps: [
        {
          id: 'install-dependencies',
          title: 'Install Dependencies',
          description: 'Installing Express and required packages',
          type: 'command',
          command: 'npm install'
        }
      ]
    }
  }
];

export const TEMPLATE_CATEGORIES = [
  {
    id: 'mobile-ios',
    name: 'iOS',
    description: 'Native iOS applications',
    icon: '📱',
    color: '#007AFF'
  },
  {
    id: 'mobile-android',
    name: 'Android',
    description: 'Native Android applications',
    icon: '🤖',
    color: '#3DDC84'
  },
  {
    id: 'mobile-cross-platform',
    name: 'Cross-Platform Mobile',
    description: 'Apps that run on multiple mobile platforms',
    icon: '📲',
    color: '#61DAFB'
  },
  {
    id: 'web-frontend',
    name: 'Web Frontend',
    description: 'Client-side web applications',
    icon: '🌐',
    color: '#FF6B6B'
  },
  {
    id: 'web-backend',
    name: 'Web Backend',
    description: 'Server-side applications and APIs',
    icon: '⚙️',
    color: '#4ECDC4'
  },
  {
    id: 'web-fullstack',
    name: 'Full-Stack Web',
    description: 'Complete web applications',
    icon: '🔗',
    color: '#45B7D1'
  },
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'Cross-platform desktop applications',
    icon: '💻',
    color: '#9B59B6'
  },
  {
    id: 'game',
    name: 'Game Development',
    description: 'Games and interactive experiences',
    icon: '🎮',
    color: '#E74C3C'
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'AI/ML projects and experiments',
    icon: '🤖',
    color: '#F39C12'
  },
  {
    id: 'api',
    name: 'API & Backend',
    description: 'RESTful APIs and backend services',
    icon: '🔌',
    color: '#27AE60'
  },
  {
    id: 'cli-tool',
    name: 'CLI Tools',
    description: 'Command-line applications',
    icon: '⌨️',
    color: '#34495E'
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Reusable libraries and packages',
    icon: '📚',
    color: '#8E44AD'
  }
];

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function searchTemplates(query: string): ProjectTemplate[] {
  const searchTerm = query.toLowerCase();
  return PROJECT_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    template.languages.some(lang => lang.toLowerCase().includes(searchTerm)) ||
    template.frameworks.some(framework => framework.toLowerCase().includes(searchTerm))
  );
}