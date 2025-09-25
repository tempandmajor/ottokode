import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId?: string;
  organizationId?: string;
  eventType: AuditEventType;
  category: AuditCategory;
  action: string;
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  details: Record<string, any>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    severity: AuditSeverity;
    riskScore: number;
  };
  outcome: 'success' | 'failure' | 'partial';
  complianceFlags: string[];
}

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'configuration_change'
  | 'system_event'
  | 'security_event'
  | 'compliance_event'
  | 'privacy_event';

export type AuditCategory =
  | 'security'
  | 'privacy'
  | 'access'
  | 'data'
  | 'system'
  | 'admin'
  | 'compliance';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  organizationId?: string;
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  outcomes?: Array<'success' | 'failure' | 'partial'>;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  generatedAt: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    byCategory: Record<AuditCategory, number>;
    bySeverity: Record<AuditSeverity, number>;
    byOutcome: Record<'success' | 'failure' | 'partial', number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    topResources: Array<{ resourceType: string; eventCount: number }>;
  };
  complianceStatus: {
    gdpr: ComplianceStatus;
    sox: ComplianceStatus;
    hipaa: ComplianceStatus;
    pci: ComplianceStatus;
  };
  events: AuditEvent[];
  recommendations: string[];
}

interface ComplianceStatus {
  compliant: boolean;
  issues: string[];
  violations: number;
  lastReview: Date;
}

export interface AuditConfiguration {
  enabled: boolean;
  retentionDays: number;
  realTimeMonitoring: boolean;
  alertThresholds: {
    failedLogins: number;
    dataAccessVolume: number;
    privilegedActions: number;
  };
  complianceStandards: string[];
  encryptionEnabled: boolean;
  tamperProtection: boolean;
}

export class AuditLogger {
  private config: AuditConfiguration;
  private eventQueue: AuditEvent[] = [];
  private alertSubscribers: Array<(event: AuditEvent) => void> = [];
  private isProcessing: boolean = false;

  constructor(config?: Partial<AuditConfiguration>) {
    this.config = {
      enabled: true,
      retentionDays: 365,
      realTimeMonitoring: true,
      alertThresholds: {
        failedLogins: 5,
        dataAccessVolume: 1000,
        privilegedActions: 10
      },
      complianceStandards: ['SOX', 'GDPR', 'SOC2'],
      encryptionEnabled: true,
      tamperProtection: true,
      ...config
    };

    this.initializeAuditLogger();
  }

  private async initializeAuditLogger(): Promise<void> {
    if (!this.config.enabled) return;

    // Start background processing
    this.startBackgroundProcessing();

    // Set up real-time monitoring
    if (this.config.realTimeMonitoring) {
      this.setupRealTimeMonitoring();
    }

    // Initialize compliance checking
    this.initializeComplianceChecking();

    console.log('🔍 Audit Logger initialized');
    console.log(`📊 Retention: ${this.config.retentionDays} days`);
    console.log(`🔔 Real-time monitoring: ${this.config.realTimeMonitoring ? 'enabled' : 'disabled'}`);
  }

  private startBackgroundProcessing(): void {
    // Process audit event queue every 5 seconds
    setInterval(async () => {
      if (this.eventQueue.length > 0 && !this.isProcessing) {
        await this.processEventQueue();
      }
    }, 5000);

    // Cleanup old events daily
    setInterval(async () => {
      await this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000);
  }

  private setupRealTimeMonitoring(): void {
    // Monitor for suspicious patterns
    setInterval(async () => {
      await this.checkForSuspiciousActivity();
    }, 60000); // Every minute

    // Monitor system health
    setInterval(async () => {
      await this.logSystemHealth();
    }, 300000); // Every 5 minutes
  }

  private initializeComplianceChecking(): void {
    // Schedule compliance checks
    setInterval(async () => {
      await this.performComplianceCheck();
    }, 3600000); // Every hour
  }

  async log(eventData: Partial<AuditEvent>): Promise<string> {
    if (!this.config.enabled) return '';

    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      userId: eventData.userId || 'system',
      sessionId: eventData.sessionId,
      organizationId: eventData.organizationId,
      eventType: eventData.eventType || 'system_event',
      category: eventData.category || 'system',
      action: eventData.action || 'unknown',
      resource: eventData.resource || { type: 'system', id: 'unknown' },
      details: eventData.details || {},
      metadata: {
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        location: await this.getLocation(),
        severity: this.calculateSeverity(eventData),
        riskScore: this.calculateRiskScore(eventData),
        ...eventData.metadata
      },
      outcome: eventData.outcome || 'success',
      complianceFlags: this.generateComplianceFlags(eventData)
    };

    // Add to processing queue
    this.eventQueue.push(event);

    // Trigger immediate alerts for critical events
    if (event.metadata.severity === 'critical') {
      await this.triggerImmediateAlert(event);
    }

    return event.id;
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const batch = this.eventQueue.splice(0, 100); // Process in batches of 100

      // Encrypt events if enabled
      const processedEvents = this.config.encryptionEnabled
        ? batch.map(event => this.encryptEvent(event))
        : batch;

      // Store events in database
      const { error } = await supabase
        .from('audit_events')
        .insert(processedEvents.map(event => this.mapEventForDB(event)));

      if (error) {
        console.error('Failed to store audit events:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...batch);
      } else {
        // Trigger real-time alerts
        if (this.config.realTimeMonitoring) {
          batch.forEach(event => this.checkEventForAlerts(event));
        }
      }

    } catch (error) {
      console.error('Error processing audit event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private calculateSeverity(eventData: Partial<AuditEvent>): AuditSeverity {
    // Determine severity based on event type and action
    if (eventData.eventType === 'security_event') return 'high';
    if (eventData.action?.includes('delete') || eventData.action?.includes('destroy')) return 'medium';
    if (eventData.eventType === 'authentication' && eventData.outcome === 'failure') return 'medium';
    if (eventData.eventType === 'privacy_event') return 'high';

    return eventData.metadata?.severity || 'low';
  }

  private calculateRiskScore(eventData: Partial<AuditEvent>): number {
    let score = 0;

    // Base score by event type
    const eventTypeScores: Record<AuditEventType, number> = {
      authentication: 3,
      authorization: 4,
      data_access: 2,
      data_modification: 6,
      configuration_change: 8,
      system_event: 1,
      security_event: 9,
      compliance_event: 7,
      privacy_event: 8
    };

    score += eventTypeScores[eventData.eventType || 'system_event'];

    // Increase score for failures
    if (eventData.outcome === 'failure') score += 3;

    // Increase score for privileged actions
    if (eventData.action?.includes('admin') || eventData.action?.includes('root')) score += 5;

    // Time-based risk (actions outside business hours)
    const hour = new Date().getHours();
    if (hour < 8 || hour > 18) score += 2;

    return Math.min(score, 10); // Cap at 10
  }

  private generateComplianceFlags(eventData: Partial<AuditEvent>): string[] {
    const flags: string[] = [];

    // GDPR flags
    if (eventData.eventType === 'data_access' || eventData.eventType === 'privacy_event') {
      flags.push('GDPR');
    }

    // SOX flags for financial data
    if (eventData.details?.dataType === 'financial' || eventData.resource?.type === 'financial_record') {
      flags.push('SOX');
    }

    // HIPAA flags for health data
    if (eventData.details?.dataType === 'health' || eventData.resource?.type === 'patient_record') {
      flags.push('HIPAA');
    }

    // PCI flags for payment data
    if (eventData.details?.dataType === 'payment' || eventData.resource?.type === 'payment_info') {
      flags.push('PCI');
    }

    return flags;
  }

  private encryptEvent(event: AuditEvent): AuditEvent {
    // In production, this would use proper encryption
    // For now, we'll just mark it as encrypted
    return {
      ...event,
      details: { ...event.details, encrypted: true }
    };
  }

  private async triggerImmediateAlert(event: AuditEvent): Promise<void> {
    // Notify all subscribers
    this.alertSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in alert subscriber:', error);
      }
    });

    // Log the alert
    console.warn('🚨 CRITICAL AUDIT EVENT:', {
      id: event.id,
      action: event.action,
      resource: event.resource,
      severity: event.metadata.severity
    });
  }

  private checkEventForAlerts(event: AuditEvent): void {
    // Check for alert thresholds
    if (event.eventType === 'authentication' && event.outcome === 'failure') {
      this.checkFailedLoginThreshold(event.userId);
    }

    if (event.eventType === 'data_access') {
      this.checkDataAccessVolumeThreshold(event.userId);
    }

    if (event.action.includes('admin') || event.action.includes('privileged')) {
      this.checkPrivilegedActionThreshold(event.userId);
    }
  }

  private async checkFailedLoginThreshold(userId: string): Promise<void> {
    const recentFailures = await this.getRecentEvents({
      userId,
      eventTypes: ['authentication'],
      outcomes: ['failure'],
      startDate: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      limit: this.config.alertThresholds.failedLogins
    });

    if (recentFailures.length >= this.config.alertThresholds.failedLogins) {
      await this.log({
        eventType: 'security_event',
        category: 'security',
        action: 'failed_login_threshold_exceeded',
        resource: { type: 'user', id: userId },
        details: { failedAttempts: recentFailures.length },
        metadata: { severity: 'high' },
        outcome: 'success'
      });
    }
  }

  private async checkDataAccessVolumeThreshold(userId: string): Promise<void> {
    const recentAccess = await this.getRecentEvents({
      userId,
      eventTypes: ['data_access'],
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      limit: this.config.alertThresholds.dataAccessVolume
    });

    if (recentAccess.length >= this.config.alertThresholds.dataAccessVolume) {
      await this.log({
        eventType: 'security_event',
        category: 'security',
        action: 'data_access_volume_threshold_exceeded',
        resource: { type: 'user', id: userId },
        details: { accessCount: recentAccess.length },
        metadata: { severity: 'medium' },
        outcome: 'success'
      });
    }
  }

  private async checkPrivilegedActionThreshold(userId: string): Promise<void> {
    const recentPrivileged = await this.getRecentEvents({
      userId,
      searchTerm: 'admin OR privileged OR root',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      limit: this.config.alertThresholds.privilegedActions
    });

    if (recentPrivileged.length >= this.config.alertThresholds.privilegedActions) {
      await this.log({
        eventType: 'security_event',
        category: 'security',
        action: 'privileged_action_threshold_exceeded',
        resource: { type: 'user', id: userId },
        details: { privilegedActions: recentPrivileged.length },
        metadata: { severity: 'high' },
        outcome: 'success'
      });
    }
  }

  private async checkForSuspiciousActivity(): Promise<void> {
    // Check for unusual patterns
    await this.detectAnomalousUserBehavior();
    await this.detectUnusualAccessPatterns();
    await this.detectPrivilegeEscalation();
  }

  private async detectAnomalousUserBehavior(): Promise<void> {
    // Analyze user behavior patterns
    const recentEvents = await this.getRecentEvents({
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      limit: 1000
    });

    // Group by user and detect anomalies
    const userActivity = new Map<string, AuditEvent[]>();

    recentEvents.forEach(event => {
      if (!userActivity.has(event.userId)) {
        userActivity.set(event.userId, []);
      }
      userActivity.get(event.userId)!.push(event);
    });

    for (const [userId, events] of userActivity) {
      if (this.isAnomalousActivity(events)) {
        await this.log({
          eventType: 'security_event',
          category: 'security',
          action: 'anomalous_user_behavior_detected',
          resource: { type: 'user', id: userId },
          details: { eventCount: events.length, patterns: this.analyzePatterns(events) },
          metadata: { severity: 'medium' },
          outcome: 'success'
        });
      }
    }
  }

  private async detectUnusualAccessPatterns(): Promise<void> {
    // Detect access from unusual locations or times
    const recentEvents = await this.getRecentEvents({
      eventTypes: ['data_access'],
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      limit: 1000
    });

    const locationPatterns = new Map<string, Set<string>>();

    recentEvents.forEach(event => {
      const location = event.metadata.location || 'unknown';
      if (!locationPatterns.has(event.userId)) {
        locationPatterns.set(event.userId, new Set());
      }
      locationPatterns.get(event.userId)!.add(location);
    });

    // Alert on access from multiple unusual locations
    for (const [userId, locations] of locationPatterns) {
      if (locations.size > 3) { // More than 3 different locations
        await this.log({
          eventType: 'security_event',
          category: 'security',
          action: 'unusual_access_pattern_detected',
          resource: { type: 'user', id: userId },
          details: { locations: Array.from(locations) },
          metadata: { severity: 'medium' },
          outcome: 'success'
        });
      }
    }
  }

  private async detectPrivilegeEscalation(): Promise<void> {
    // Look for users gaining new privileges
    const privilegedActions = await this.getRecentEvents({
      searchTerm: 'privilege OR admin OR grant OR elevate',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      limit: 100
    });

    privilegedActions.forEach(async (event) => {
      if (event.details.privilegeChanged) {
        await this.log({
          eventType: 'security_event',
          category: 'security',
          action: 'privilege_escalation_detected',
          resource: event.resource,
          details: { originalEvent: event.id, privilegeChange: event.details.privilegeChanged },
          metadata: { severity: 'high' },
          outcome: 'success'
        });
      }
    });
  }

  private isAnomalousActivity(events: AuditEvent[]): boolean {
    // Simple anomaly detection
    const avgEventsPerHour = events.length;
    const failureRate = events.filter(e => e.outcome === 'failure').length / events.length;
    const uniqueResources = new Set(events.map(e => e.resource.id)).size;

    // Anomaly if high activity, high failure rate, or accessing many resources
    return avgEventsPerHour > 100 || failureRate > 0.3 || uniqueResources > 20;
  }

  private analyzePatterns(events: AuditEvent[]): any {
    return {
      eventTypes: [...new Set(events.map(e => e.eventType))],
      resources: [...new Set(events.map(e => e.resource.type))],
      failureRate: events.filter(e => e.outcome === 'failure').length / events.length
    };
  }

  private async logSystemHealth(): Promise<void> {
    const memoryUsage = process.memoryUsage();

    await this.log({
      eventType: 'system_event',
      category: 'system',
      action: 'system_health_check',
      resource: { type: 'system', id: 'audit_logger' },
      details: {
        memoryUsage,
        queueSize: this.eventQueue.length,
        uptime: process.uptime()
      },
      metadata: { severity: 'low' },
      outcome: 'success'
    });
  }

  private async performComplianceCheck(): Promise<void> {
    // Perform automated compliance checking
    for (const standard of this.config.complianceStandards) {
      const complianceResult = await this.checkCompliance(standard);

      await this.log({
        eventType: 'compliance_event',
        category: 'compliance',
        action: 'compliance_check',
        resource: { type: 'system', id: 'compliance', name: standard },
        details: complianceResult,
        metadata: { severity: complianceResult.compliant ? 'low' : 'high' },
        outcome: complianceResult.compliant ? 'success' : 'failure'
      });
    }
  }

  private async checkCompliance(standard: string): Promise<any> {
    // Mock compliance check - in production would be more sophisticated
    return {
      standard,
      compliant: true,
      issues: [],
      lastCheck: new Date().toISOString()
    };
  }

  private async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const { error } = await supabase
      .from('audit_events')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old audit events:', error);
    } else {
      console.log(`🧹 Cleaned up audit events older than ${this.config.retentionDays} days`);
    }
  }

  // Public API Methods

  async getEvents(query: AuditQuery): Promise<AuditEvent[]> {
    return this.getRecentEvents(query);
  }

  private async getRecentEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let dbQuery = supabase.from('audit_events').select('*');

    if (query.startDate) {
      dbQuery = dbQuery.gte('timestamp', query.startDate.toISOString());
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('timestamp', query.endDate.toISOString());
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    }

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      dbQuery = dbQuery.in('event_type', query.eventTypes);
    }

    if (query.categories && query.categories.length > 0) {
      dbQuery = dbQuery.in('category', query.categories);
    }

    if (query.outcomes && query.outcomes.length > 0) {
      dbQuery = dbQuery.in('outcome', query.outcomes);
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 100) - 1);
    }

    dbQuery = dbQuery.order('timestamp', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Failed to fetch audit events:', error);
      return [];
    }

    return (data || []).map(event => this.mapEventFromDB(event));
  }

  async generateReport(
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<AuditReport> {
    const events = await this.getEvents({
      startDate: period.start,
      endDate: period.end,
      limit: 10000
    });

    const summary = this.generateReportSummary(events);
    const complianceStatus = await this.generateComplianceStatus(events);

    return {
      id: uuidv4(),
      generatedAt: new Date(),
      generatedBy,
      period,
      summary,
      complianceStatus,
      events: events.slice(0, 1000), // Limit events in report
      recommendations: this.generateRecommendations(events, complianceStatus)
    };
  }

  private generateReportSummary(events: AuditEvent[]): AuditReport['summary'] {
    const byCategory: Record<AuditCategory, number> = {
      security: 0, privacy: 0, access: 0, data: 0, system: 0, admin: 0, compliance: 0
    };

    const bySeverity: Record<AuditSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    const byOutcome: Record<'success' | 'failure' | 'partial', number> = {
      success: 0, failure: 0, partial: 0
    };

    const userCounts = new Map<string, number>();
    const resourceCounts = new Map<string, number>();

    events.forEach(event => {
      byCategory[event.category]++;
      bySeverity[event.metadata.severity]++;
      byOutcome[event.outcome]++;

      userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      resourceCounts.set(event.resource.type, (resourceCounts.get(event.resource.type) || 0) + 1);
    });

    const topUsers = Array.from(userCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, eventCount]) => ({ userId, eventCount }));

    const topResources = Array.from(resourceCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([resourceType, eventCount]) => ({ resourceType, eventCount }));

    return {
      totalEvents: events.length,
      byCategory,
      bySeverity,
      byOutcome,
      topUsers,
      topResources
    };
  }

  private async generateComplianceStatus(events: AuditEvent[]): Promise<AuditReport['complianceStatus']> {
    // Mock compliance status - in production would be more sophisticated
    return {
      gdpr: { compliant: true, issues: [], violations: 0, lastReview: new Date() },
      sox: { compliant: true, issues: [], violations: 0, lastReview: new Date() },
      hipaa: { compliant: true, issues: [], violations: 0, lastReview: new Date() },
      pci: { compliant: true, issues: [], violations: 0, lastReview: new Date() }
    };
  }

  private generateRecommendations(events: AuditEvent[], complianceStatus: any): string[] {
    const recommendations: string[] = [];

    const highSeverityEvents = events.filter(e => e.metadata.severity === 'high' || e.metadata.severity === 'critical');
    if (highSeverityEvents.length > 10) {
      recommendations.push('High number of critical security events detected - review security policies');
    }

    const failureRate = events.filter(e => e.outcome === 'failure').length / events.length;
    if (failureRate > 0.2) {
      recommendations.push('High failure rate detected - investigate system issues');
    }

    if (!complianceStatus.gdpr.compliant) {
      recommendations.push('GDPR compliance issues detected - address privacy concerns');
    }

    return recommendations;
  }

  subscribe(callback: (event: AuditEvent) => void): () => void {
    this.alertSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  async updateConfiguration(newConfig: Partial<AuditConfiguration>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    await this.log({
      eventType: 'configuration_change',
      category: 'admin',
      action: 'audit_configuration_updated',
      resource: { type: 'system', id: 'audit_logger' },
      details: { changes: newConfig },
      metadata: { severity: 'medium' },
      outcome: 'success'
    });
  }

  getConfiguration(): AuditConfiguration {
    return { ...this.config };
  }

  async exportEvents(query: AuditQuery, format: 'json' | 'csv'): Promise<string> {
    const events = await this.getEvents(query);

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    } else {
      return this.convertToCSV(events);
    }
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'timestamp', 'userId', 'eventType', 'category', 'action',
      'resourceType', 'resourceId', 'outcome', 'severity', 'riskScore'
    ];

    const rows = events.map(event => [
      event.timestamp.toISOString(),
      event.userId,
      event.eventType,
      event.category,
      event.action,
      event.resource.type,
      event.resource.id,
      event.outcome,
      event.metadata.severity,
      event.metadata.riskScore.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Helper methods

  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : 'Node.js';
  }

  private async getLocation(): Promise<string> {
    // In a real implementation, this would use IP geolocation
    return 'Unknown';
  }

  private mapEventForDB(event: AuditEvent): any {
    return {
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      user_id: event.userId,
      session_id: event.sessionId,
      organization_id: event.organizationId,
      event_type: event.eventType,
      category: event.category,
      action: event.action,
      resource_type: event.resource.type,
      resource_id: event.resource.id,
      resource_name: event.resource.name,
      details: event.details,
      metadata: event.metadata,
      outcome: event.outcome,
      compliance_flags: event.complianceFlags
    };
  }

  private mapEventFromDB(data: any): AuditEvent {
    return {
      id: data.id,
      timestamp: new Date(data.timestamp),
      userId: data.user_id,
      sessionId: data.session_id,
      organizationId: data.organization_id,
      eventType: data.event_type,
      category: data.category,
      action: data.action,
      resource: {
        type: data.resource_type,
        id: data.resource_id,
        name: data.resource_name
      },
      details: data.details || {},
      metadata: data.metadata || {
        ipAddress: '127.0.0.1',
        userAgent: 'Unknown',
        severity: 'low',
        riskScore: 1
      },
      outcome: data.outcome,
      complianceFlags: data.compliance_flags || []
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default AuditLogger;