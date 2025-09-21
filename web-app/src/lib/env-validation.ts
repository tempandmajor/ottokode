/**
 * Environment validation - now using shared configuration
 * @deprecated Use @ottokode/shared environment instead
 */

import { environment } from '@ottokode/shared';

// Re-export shared types and functions for backwards compatibility
export type { EnvConfig } from '@ottokode/shared';

export const validateEnvironment = () => environment.getConfig();
export const getAvailableAIProviders = () => environment.getAvailableAIProviders();
export const isProductionReady = () => environment.isProductionReady();