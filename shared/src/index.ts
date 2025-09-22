// Main exports for the shared package
export * from './types';
export * from './utils';
export * from './config';

// Explicit service exports to avoid naming conflicts
export { logger, createLogger, LogLevel, LogEntry } from './services/logger';
export { emailService, EmailProvider, EmailOptions, EmailResult } from './services/email';
export * from './services/ai';
export * from './services/platform';

// Template system exports
export * from './types/project-templates';
export * from './templates';

// Re-export common components if needed
export type { ReactNode } from 'react';