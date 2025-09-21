/**
 * Unified routing configuration for web and desktop
 */

export interface RouteConfig {
  path: string;
  name: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  webOnly?: boolean;
  desktopOnly?: boolean;
  icon?: string;
}

export const routes: Record<string, RouteConfig> = {
  // Public routes
  home: {
    path: '/',
    name: 'home',
    title: 'Home',
    description: 'Welcome to Ottokode',
    requiresAuth: false,
  },
  login: {
    path: '/login',
    name: 'login',
    title: 'Sign In',
    description: 'Sign in to your account',
    requiresAuth: false,
    webOnly: true,
  },
  pricing: {
    path: '/pricing',
    name: 'pricing',
    title: 'Pricing',
    description: 'Choose your plan',
    requiresAuth: false,
    webOnly: true,
  },
  about: {
    path: '/about',
    name: 'about',
    title: 'About',
    description: 'Learn about Ottokode',
    requiresAuth: false,
    webOnly: true,
  },

  // Main application routes
  ide: {
    path: '/ide',
    name: 'ide',
    title: 'IDE',
    description: 'AI-powered development environment',
    requiresAuth: true,
    icon: 'Code',
  },
  desktop: {
    path: '/desktop',
    name: 'desktop',
    title: 'Desktop App',
    description: 'Desktop application interface',
    requiresAuth: true,
    desktopOnly: true,
    icon: 'Monitor',
  },

  // Settings routes
  settings: {
    path: '/settings',
    name: 'settings',
    title: 'Settings',
    description: 'Application settings',
    requiresAuth: true,
    icon: 'Settings',
  },
  settingsProfile: {
    path: '/settings/profile',
    name: 'settings-profile',
    title: 'Profile Settings',
    description: 'Manage your profile',
    requiresAuth: true,
  },
  settingsAI: {
    path: '/settings/ai',
    name: 'settings-ai',
    title: 'AI Settings',
    description: 'Configure AI providers',
    requiresAuth: true,
  },
  settingsSecurity: {
    path: '/settings/security',
    name: 'settings-security',
    title: 'Security Settings',
    description: 'Security and privacy settings',
    requiresAuth: true,
  },
  settingsBilling: {
    path: '/settings/billing',
    name: 'settings-billing',
    title: 'Billing',
    description: 'Manage billing and subscription',
    requiresAuth: true,
    webOnly: true,
  },
  settingsNotifications: {
    path: '/settings/notifications',
    name: 'settings-notifications',
    title: 'Notifications',
    description: 'Notification preferences',
    requiresAuth: true,
  },

  // Feature routes
  extensions: {
    path: '/extensions',
    name: 'extensions',
    title: 'Extensions',
    description: 'Browse and manage extensions',
    requiresAuth: true,
    icon: 'Package',
  },
  gettingStarted: {
    path: '/getting-started',
    name: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how to use Ottokode',
    requiresAuth: false,
    icon: 'BookOpen',
  },

  // Administrative routes
  admin: {
    path: '/admin',
    name: 'admin',
    title: 'Admin',
    description: 'Administrative interface',
    requiresAuth: true,
    webOnly: true,
    icon: 'Shield',
  },

  // Legal routes
  terms: {
    path: '/terms',
    name: 'terms',
    title: 'Terms of Service',
    description: 'Terms of service',
    requiresAuth: false,
    webOnly: true,
  },
  privacy: {
    path: '/privacy',
    name: 'privacy',
    title: 'Privacy Policy',
    description: 'Privacy policy',
    requiresAuth: false,
    webOnly: true,
  },
  userAgreement: {
    path: '/user-agreement',
    name: 'user-agreement',
    title: 'User Agreement',
    description: 'User agreement',
    requiresAuth: false,
  },

  // Support routes
  support: {
    path: '/support',
    name: 'support',
    title: 'Support',
    description: 'Get help and support',
    requiresAuth: false,
    webOnly: true,
    icon: 'HelpCircle',
  },
  help: {
    path: '/help',
    name: 'help',
    title: 'Help',
    description: 'Help and documentation',
    requiresAuth: false,
    icon: 'HelpCircle',
  },
  docs: {
    path: '/docs',
    name: 'docs',
    title: 'Documentation',
    description: 'Product documentation',
    requiresAuth: false,
    webOnly: true,
    icon: 'Book',
  },
  changelog: {
    path: '/changelog',
    name: 'changelog',
    title: 'Changelog',
    description: 'What\'s new in Ottokode',
    requiresAuth: false,
    webOnly: true,
    icon: 'Zap',
  },
};

export class RouteManager {
  private static instance: RouteManager;

  static getInstance(): RouteManager {
    if (!this.instance) {
      this.instance = new RouteManager();
    }
    return this.instance;
  }

  /**
   * Get all routes available for the current platform
   */
  getAvailableRoutes(isDesktop: boolean): RouteConfig[] {
    return Object.values(routes).filter(route => {
      if (isDesktop && route.webOnly) return false;
      if (!isDesktop && route.desktopOnly) return false;
      return true;
    });
  }

  /**
   * Get routes that require authentication
   */
  getProtectedRoutes(isDesktop: boolean): RouteConfig[] {
    return this.getAvailableRoutes(isDesktop).filter(route => route.requiresAuth);
  }

  /**
   * Get public routes
   */
  getPublicRoutes(isDesktop: boolean): RouteConfig[] {
    return this.getAvailableRoutes(isDesktop).filter(route => !route.requiresAuth);
  }

  /**
   * Get navigation menu items
   */
  getNavigationRoutes(isDesktop: boolean): RouteConfig[] {
    return this.getAvailableRoutes(isDesktop).filter(route =>
      route.icon &&
      !route.path.includes('/settings/') &&
      !route.path.includes('/admin')
    );
  }

  /**
   * Get settings menu items
   */
  getSettingsRoutes(isDesktop: boolean): RouteConfig[] {
    return this.getAvailableRoutes(isDesktop).filter(route =>
      route.path.startsWith('/settings/')
    );
  }

  /**
   * Find route by path
   */
  findRoute(path: string): RouteConfig | undefined {
    return Object.values(routes).find(route => route.path === path);
  }

  /**
   * Find route by name
   */
  findRouteByName(name: string): RouteConfig | undefined {
    return Object.values(routes).find(route => route.name === name);
  }

  /**
   * Check if route is available on current platform
   */
  isRouteAvailable(path: string, isDesktop: boolean): boolean {
    const route = this.findRoute(path);
    if (!route) return false;

    if (isDesktop && route.webOnly) return false;
    if (!isDesktop && route.desktopOnly) return false;

    return true;
  }

  /**
   * Get the appropriate main route for the platform
   */
  getMainRoute(isDesktop: boolean): string {
    return isDesktop ? routes.desktop.path : routes.ide.path;
  }

  /**
   * Get redirect path for unauthorized access
   */
  getLoginRedirect(isDesktop: boolean): string {
    return isDesktop ? routes.userAgreement.path : routes.login.path;
  }
}

// Export singleton instance
export const routeManager = RouteManager.getInstance();