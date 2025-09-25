import { EventEmitter } from 'events';

export interface PrivacySettings {
  enabled: boolean;
  dataRetentionPolicy: 'none' | 'session' | 'temporary' | 'custom';
  retentionDays: number;
  allowTelemetry: boolean;
  allowCrashReports: boolean;
  anonymizeData: boolean;
  localProcessingOnly: boolean;
  encryptLocalData: boolean;
  auditLogging: boolean;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  sensitivePatterns: RegExp[];
  allowedOperations: string[];
}

export interface PrivacyViolation {
  id: string;
  timestamp: Date;
  type: 'data-leak' | 'retention-violation' | 'unauthorized-access' | 'external-transmission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  dataInvolved: string;
  source: string;
  mitigated: boolean;
  mitigationActions: string[];
}

export interface DataProcessingRequest {
  id: string;
  operation: string;
  data: any;
  classification: DataClassification;
  purpose: string;
  requestedBy: string;
  timestamp: Date;
}

export interface DataProcessingResult {
  allowed: boolean;
  sanitizedData?: any;
  redactedFields: string[];
  warnings: string[];
  auditTrail: string;
}

export class PrivacyMode extends EventEmitter {
  private settings: PrivacySettings;
  private violations: PrivacyViolation[] = [];
  private dataClassifications: Map<string, DataClassification> = new Map();
  private processingQueue: DataProcessingRequest[] = [];
  private isEnabled: boolean = false;

  constructor(initialSettings?: Partial<PrivacySettings>) {
    super();

    this.settings = {
      enabled: false,
      dataRetentionPolicy: 'session',
      retentionDays: 7,
      allowTelemetry: false,
      allowCrashReports: true,
      anonymizeData: true,
      localProcessingOnly: false,
      encryptLocalData: true,
      auditLogging: true,
      ...initialSettings
    };

    this.initializeDataClassifications();

    if (this.settings.enabled) {
      this.enablePrivacyMode();
    }
  }

  private initializeDataClassifications(): void {
    // Source code classification
    this.dataClassifications.set('source-code', {
      level: 'confidential',
      categories: ['intellectual-property', 'code'],
      sensitivePatterns: [
        /(?:api[_-]?key|secret|password|token|credential)/i,
        /(?:private[_-]?key|ssh[_-]?key|cert)/i,
        /(?:database[_-]?url|connection[_-]?string)/i
      ],
      allowedOperations: ['analyze', 'format', 'refactor']
    });

    // Personal data classification
    this.dataClassifications.set('personal-data', {
      level: 'restricted',
      categories: ['pii', 'personal'],
      sensitivePatterns: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g // Credit card
      ],
      allowedOperations: ['anonymize']
    });

    // Configuration data
    this.dataClassifications.set('config-data', {
      level: 'internal',
      categories: ['configuration', 'settings'],
      sensitivePatterns: [
        /(?:password|secret|key|token)[\s]*[:=][\s]*["']?([^"'\s]+)/i
      ],
      allowedOperations: ['read', 'validate']
    });

    // Public data
    this.dataClassifications.set('public-data', {
      level: 'public',
      categories: ['documentation', 'comments'],
      sensitivePatterns: [],
      allowedOperations: ['read', 'write', 'share', 'analyze']
    });
  }

  enablePrivacyMode(): void {
    this.isEnabled = true;
    this.settings.enabled = true;

    // Set up privacy enforcement
    this.setupDataInterception();
    this.startPrivacyMonitoring();

    this.emit('privacy-mode-enabled', {
      timestamp: new Date(),
      settings: this.settings
    });

    console.log('🔒 Privacy Mode: ENABLED');
    console.log('🛡️  Data processing restrictions active');
    console.log('📊 Local processing preferred');
  }

  disablePrivacyMode(): void {
    this.isEnabled = false;
    this.settings.enabled = false;

    this.emit('privacy-mode-disabled', {
      timestamp: new Date()
    });

    console.log('🔓 Privacy Mode: DISABLED');
  }

  private setupDataInterception(): void {
    // Intercept fetch requests to prevent external data transmission
    if (typeof window !== 'undefined' && this.settings.localProcessingOnly) {
      const originalFetch = window.fetch;

      window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
        const urlString = url.toString();

        // Allow local requests and whitelisted domains
        if (this.isAllowedRequest(urlString)) {
          return originalFetch(url, options);
        }

        // Block external requests with sensitive data
        if (options?.body && this.containsSensitiveData(options.body)) {
          const violation: PrivacyViolation = {
            id: `violation-${Date.now()}`,
            timestamp: new Date(),
            type: 'external-transmission',
            severity: 'high',
            description: 'Attempted to send sensitive data to external service',
            dataInvolved: 'Request body contains sensitive patterns',
            source: urlString,
            mitigated: true,
            mitigationActions: ['Request blocked', 'Data transmission prevented']
          };

          this.recordViolation(violation);
          throw new Error('Privacy Mode: External transmission of sensitive data blocked');
        }

        return originalFetch(url, options);
      };
    }
  }

  private isAllowedRequest(url: string): boolean {
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      // Add company domains or local services
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  private containsSensitiveData(data: any): boolean {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    for (const classification of this.dataClassifications.values()) {
      for (const pattern of classification.sensitivePatterns) {
        if (pattern.test(dataString)) {
          return true;
        }
      }
    }

    return false;
  }

  private startPrivacyMonitoring(): void {
    // Monitor for privacy violations
    setInterval(() => {
      this.checkDataRetentionCompliance();
      this.auditDataAccess();
    }, 60000); // Check every minute
  }

  private checkDataRetentionCompliance(): void {
    if (this.settings.dataRetentionPolicy === 'none') {
      // Clear all temporary data
      this.clearTemporaryData();
    } else if (this.settings.dataRetentionPolicy === 'custom') {
      // Check retention periods
      this.enforceRetentionPolicy();
    }
  }

  private clearTemporaryData(): void {
    // Clear browser storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear IndexedDB if available
        if (window.indexedDB) {
          this.clearIndexedDB();
        }
      } catch (error) {
        console.error('Privacy Mode: Error clearing temporary data:', error);
      }
    }
  }

  private async clearIndexedDB(): Promise<void> {
    try {
      const databases = await indexedDB.databases();

      for (const db of databases) {
        if (db.name) {
          const deleteRequest = indexedDB.deleteDatabase(db.name);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(void 0);
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        }
      }
    } catch (error) {
      console.error('Privacy Mode: Error clearing IndexedDB:', error);
    }
  }

  private enforceRetentionPolicy(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.settings.retentionDays);

    // Check for data older than retention period
    // This would integrate with your data storage systems
  }

  private auditDataAccess(): void {
    if (!this.settings.auditLogging) return;

    // Log current privacy status
    const auditEntry = {
      timestamp: new Date(),
      privacyModeEnabled: this.isEnabled,
      violationsCount: this.violations.length,
      dataClassifications: this.dataClassifications.size,
      pendingRequests: this.processingQueue.length
    };

    this.emit('privacy-audit', auditEntry);
  }

  async processDataRequest(request: DataProcessingRequest): Promise<DataProcessingResult> {
    if (!this.isEnabled) {
      return {
        allowed: true,
        sanitizedData: request.data,
        redactedFields: [],
        warnings: [],
        auditTrail: 'Privacy mode disabled - no restrictions applied'
      };
    }

    this.processingQueue.push(request);

    try {
      const classification = this.classifyData(request.data);
      const result = await this.evaluateRequest(request, classification);

      // Remove from queue when processed
      const index = this.processingQueue.findIndex(r => r.id === request.id);
      if (index > -1) {
        this.processingQueue.splice(index, 1);
      }

      return result;
    } catch (error) {
      const violation: PrivacyViolation = {
        id: `violation-${Date.now()}`,
        timestamp: new Date(),
        type: 'unauthorized-access',
        severity: 'medium',
        description: `Data processing failed: ${error}`,
        dataInvolved: 'Request data',
        source: request.requestedBy,
        mitigated: false,
        mitigationActions: []
      };

      this.recordViolation(violation);
      throw error;
    }
  }

  private classifyData(data: any): DataClassification {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Check against known classifications
    for (const [key, classification] of this.dataClassifications) {
      for (const pattern of classification.sensitivePatterns) {
        if (pattern.test(dataString)) {
          return classification;
        }
      }
    }

    // Default classification for unclassified data
    return {
      level: 'internal',
      categories: ['general'],
      sensitivePatterns: [],
      allowedOperations: ['read', 'analyze']
    };
  }

  private async evaluateRequest(
    request: DataProcessingRequest,
    classification: DataClassification
  ): Promise<DataProcessingResult> {
    const warnings: string[] = [];
    const redactedFields: string[] = [];
    let sanitizedData = request.data;

    // Check if operation is allowed for this data classification
    if (!classification.allowedOperations.includes(request.operation)) {
      return {
        allowed: false,
        redactedFields: [],
        warnings: [`Operation '${request.operation}' not allowed for ${classification.level} data`],
        auditTrail: `Request denied: Operation not permitted for data classification level ${classification.level}`
      };
    }

    // Apply data sanitization based on privacy settings
    if (this.settings.anonymizeData) {
      const sanitized = this.sanitizeData(sanitizedData, classification);
      sanitizedData = sanitized.data;
      redactedFields.push(...sanitized.redactedFields);
    }

    // Check retention policy
    if (this.settings.dataRetentionPolicy === 'none') {
      warnings.push('Data will not be retained after processing');
    }

    // Local processing requirement
    if (this.settings.localProcessingOnly && this.requiresExternalProcessing(request.operation)) {
      return {
        allowed: false,
        redactedFields: [],
        warnings: ['External processing required but local processing only mode is enabled'],
        auditTrail: 'Request denied: Local processing only mode active'
      };
    }

    const auditTrail = this.createAuditTrail(request, classification, warnings);

    this.emit('data-processed', {
      requestId: request.id,
      allowed: true,
      classification: classification.level,
      redactedFields,
      warnings
    });

    return {
      allowed: true,
      sanitizedData,
      redactedFields,
      warnings,
      auditTrail
    };
  }

  private sanitizeData(data: any, classification: DataClassification): {
    data: any;
    redactedFields: string[];
  } {
    const redactedFields: string[] = [];

    if (typeof data === 'string') {
      let sanitized = data;

      for (const pattern of classification.sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redactedFields.push('sensitive-pattern-match');
        }
      }

      return { data: sanitized, redactedFields };
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      // Redact known sensitive fields
      const sensitiveFields = ['password', 'secret', 'token', 'key', 'credential', 'ssn', 'email'];

      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
          redactedFields.push(field);
        }
      }

      return { data: sanitized, redactedFields };
    }

    return { data, redactedFields };
  }

  private requiresExternalProcessing(operation: string): boolean {
    const externalOperations = ['translate', 'image-analyze', 'speech-to-text', 'advanced-ai'];
    return externalOperations.includes(operation);
  }

  private createAuditTrail(
    request: DataProcessingRequest,
    classification: DataClassification,
    warnings: string[]
  ): string {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      requestId: request.id,
      operation: request.operation,
      dataClassification: classification.level,
      purpose: request.purpose,
      requestedBy: request.requestedBy,
      privacySettings: {
        anonymizeData: this.settings.anonymizeData,
        localProcessingOnly: this.settings.localProcessingOnly,
        dataRetention: this.settings.dataRetentionPolicy
      },
      warnings: warnings.length,
      outcome: 'processed'
    };

    return JSON.stringify(auditEntry);
  }

  private recordViolation(violation: PrivacyViolation): void {
    this.violations.push(violation);

    // Limit violation history
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }

    this.emit('privacy-violation', violation);

    // Log critical violations
    if (violation.severity === 'critical' || violation.severity === 'high') {
      console.error('🚨 Privacy Violation:', violation);
    }
  }

  // Public API methods

  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<PrivacySettings>): Promise<void> {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Re-initialize if privacy mode status changed
    if (oldSettings.enabled !== this.settings.enabled) {
      if (this.settings.enabled) {
        this.enablePrivacyMode();
      } else {
        this.disablePrivacyMode();
      }
    }

    this.emit('settings-updated', {
      oldSettings,
      newSettings: this.settings
    });
  }

  isPrivacyModeEnabled(): boolean {
    return this.isEnabled;
  }

  getViolations(): PrivacyViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
    this.emit('violations-cleared');
  }

  async generatePrivacyReport(): Promise<{
    summary: {
      privacyModeEnabled: boolean;
      totalViolations: number;
      criticalViolations: number;
      dataClassifications: number;
      retentionPolicy: string;
    };
    violations: PrivacyViolation[];
    settings: PrivacySettings;
    recommendations: string[];
  }> {
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length;

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        privacyModeEnabled: this.isEnabled,
        totalViolations: this.violations.length,
        criticalViolations,
        dataClassifications: this.dataClassifications.size,
        retentionPolicy: this.settings.dataRetentionPolicy
      },
      violations: this.violations,
      settings: this.settings,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.isEnabled) {
      recommendations.push('Enable Privacy Mode for enhanced data protection');
    }

    if (this.settings.allowTelemetry) {
      recommendations.push('Consider disabling telemetry for maximum privacy');
    }

    if (!this.settings.encryptLocalData) {
      recommendations.push('Enable local data encryption for sensitive information');
    }

    if (this.settings.dataRetentionPolicy !== 'none' && this.violations.length > 0) {
      recommendations.push('Review data retention policy due to privacy violations');
    }

    if (!this.settings.auditLogging) {
      recommendations.push('Enable audit logging for compliance and monitoring');
    }

    const recentViolations = this.violations.filter(
      v => Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    if (recentViolations.length > 5) {
      recommendations.push('High number of recent violations - review data handling practices');
    }

    return recommendations;
  }

  async exportPrivacyData(): Promise<string> {
    const exportData = {
      timestamp: new Date().toISOString(),
      privacyMode: {
        enabled: this.isEnabled,
        settings: this.settings
      },
      violations: this.violations,
      dataClassifications: Object.fromEntries(this.dataClassifications),
      processingQueue: this.processingQueue.length
    };

    return JSON.stringify(exportData, null, 2);
  }

  async validateCompliance(standards: string[] = ['GDPR', 'CCPA', 'SOC2']): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const standard of standards) {
      switch (standard) {
        case 'GDPR':
          if (!this.settings.anonymizeData) {
            issues.push('GDPR: Data anonymization not enabled');
            recommendations.push('Enable data anonymization for GDPR compliance');
          }
          if (!this.settings.auditLogging) {
            issues.push('GDPR: Audit logging not enabled');
          }
          break;

        case 'CCPA':
          if (this.settings.allowTelemetry) {
            issues.push('CCPA: Telemetry collection may require disclosure');
          }
          break;

        case 'SOC2':
          if (!this.settings.encryptLocalData) {
            issues.push('SOC2: Local data encryption not enabled');
            recommendations.push('Enable local data encryption for SOC2 compliance');
          }
          break;
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export default PrivacyMode;