/**
 * Feature flags for safe platform scope reduction
 * MVP Strategy: Web platform for information/management, Desktop for coding
 */

export const FEATURE_FLAGS = {
  // Web IDE Features (DISABLE for MVP)
  WEB_IDE: false,                    // Main IDE interface
  MONACO_EDITOR: false,              // Code editor
  FILE_MANAGEMENT: false,            // File explorer and operations
  PROJECT_CREATION: false,           // Web-based project creation
  TEMPLATE_SYSTEM: false,            // Project templates
  WEB_TERMINAL: false,               // Integrated terminal
  CODE_EXECUTION: false,             // Running code in browser
  COLLABORATION: false,              // Real-time collaboration
  AI_CHAT_IDE: false,               // AI chat in IDE context

  // Information Platform Features (KEEP for MVP)
  AUTHENTICATION: true,              // Login/signup/forgot password
  USER_DASHBOARD: true,              // User profile and dashboard
  BILLING: true,                     // Subscription management
  DOCUMENTATION: true,               // Help and docs
  DESKTOP_DOWNLOADS: true,           // Desktop app downloads
  COMMUNITY: true,                   // Community features
  SUPPORT: true,                     // Support and contact
  SETTINGS: true,                    // Account settings
  ANALYTICS: true,                   // Usage reporting

  // Development Features (TEMPORARY)
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  MIGRATION_WARNINGS: true,          // Show migration notices
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([flag, _]) => flag as FeatureFlag);
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([flag, _]) => flag as FeatureFlag);
}

/**
 * Migration helper - show warning for deprecated features
 */
export function showMigrationWarning(feature: string, alternative: string) {
  if (FEATURE_FLAGS.MIGRATION_WARNINGS && FEATURE_FLAGS.DEBUG_MODE) {
    console.warn(`🚧 Feature "${feature}" is disabled in MVP. Use "${alternative}" instead.`);
  }
}