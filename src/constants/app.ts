export const APP_CONFIG = {
  name: 'Ottokode',
  version: '1.0.0',
  domain: 'https://ottokode.com',
  description: 'Enterprise AI-powered IDE for collaborative development',
  tagline: 'Code together, powered by AI',

  // Company Info
  company: {
    name: 'Branchcode AI',
    email: 'hello@branchcode.ai',
    support: 'support@branchcode.ai',
    legal: 'legal@branchcode.ai',
  },

  // Social Links
  social: {
    twitter: 'https://twitter.com/branchcodeai',
    github: 'https://github.com/branchcode-ai',
    linkedin: 'https://linkedin.com/company/branchcode-ai',
    discord: 'https://discord.gg/branchcode-ai',
  },

  // Download Links
  downloads: {
    windows: 'https://branchcode.ai/download/windows',
    mac: 'https://branchcode.ai/download/mac',
    linux: 'https://branchcode.ai/download/linux',
  },

  // Feature Flags
  features: {
    enterprise: true,
    collaboration: true,
    aiChat: true,
    analytics: true,
    debug: false,
  },

  // AI Providers
  ai: {
    providers: ['openai', 'anthropic', 'google', 'cohere', 'mistral'],
    defaultProvider: 'openai',
    fallbackKeys: {
      openai: undefined,
      anthropic: undefined,
      google: undefined,
      cohere: undefined,
      mistral: undefined,
    }
  },

  // File Extensions
  supportedExtensions: [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php',
    '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml',
    '.html', '.css', '.scss', '.less', '.vue', '.svelte', '.json', '.xml',
    '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.env', '.md', '.txt'
  ],

  // Theme Colors - Updated to match web app branding (#222222)
  colors: {
    primary: '#222222',
    secondary: '#1e1e1e',
    accent: '#333333',
    success: '#107c10',
    warning: '#ffb900',
    error: '#d13438',
  }
} as const;

export const ROUTES = {
  home: '/',
  editor: '/editor',
  dashboard: '/dashboard',
  settings: '/settings',
  pricing: '/pricing',
  login: '/login',
  signup: '/signup',
  organization: '/organization',
  profile: '/profile',
} as const;

export const STORAGE_KEYS = {
  auth: 'branchcode_auth',
  theme: 'branchcode_theme',
  editor: 'branchcode_editor',
  recent: 'branchcode_recent_files',
  workspace: 'branchcode_workspace',
} as const;