import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Core Integration Types
export interface Integration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  organizationId: string;
  configuration: IntegrationConfiguration;
  authentication: AuthenticationConfiguration;
  endpoints: APIEndpoint[];
  webhooks: WebhookConfiguration[];
  rateLimit: RateLimitConfiguration;
  monitoring: IntegrationMonitoring;
  security: IntegrationSecurity;
  metadata: IntegrationMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
}

export type IntegrationType =
  | 'version_control'
  | 'project_management'
  | 'communication'
  | 'ci_cd'
  | 'monitoring'
  | 'security'
  | 'analytics'
  | 'documentation'
  | 'storage'
  | 'authentication'
  | 'notification'
  | 'custom';

export type IntegrationProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure_devops'
  | 'jira'
  | 'asana'
  | 'trello'
  | 'slack'
  | 'teams'
  | 'discord'
  | 'jenkins'
  | 'circleci'
  | 'travis'
  | 'datadog'
  | 'newrelic'
  | 'sentry'
  | 'pagerduty'
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'okta'
  | 'auth0'
  | 'custom';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'configuring' | 'testing' | 'suspended';

export interface IntegrationConfiguration {
  baseUrl?: string;
  region?: string;
  version?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize?: number;
  syncInterval?: number; // minutes
  customFields: Record<string, any>;
  features: IntegrationFeature[];
  limits: IntegrationLimits;
}

export interface IntegrationFeature {
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
  permissions: string[];
}

export interface IntegrationLimits {
  maxRequests: number;
  maxPayloadSize: number; // bytes
  maxConcurrent: number;
  quotaReset: 'hourly' | 'daily' | 'monthly';
}

export interface AuthenticationConfiguration {
  type: AuthenticationType;
  credentials: AuthenticationCredentials;
  tokenRefresh: TokenRefreshConfiguration;
  scopes: string[];
  permissions: string[];
  expiration?: Date;
}

export type AuthenticationType = 'api_key' | 'oauth2' | 'basic_auth' | 'jwt' | 'certificate' | 'custom';

export interface AuthenticationCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  certificate?: string;
  privateKey?: string;
  customHeaders?: Record<string, string>;
}

export interface TokenRefreshConfiguration {
  enabled: boolean;
  endpoint: string;
  method: 'POST' | 'GET' | 'PUT';
  headers: Record<string, string>;
  body: Record<string, any>;
  tokenPath: string;
  refreshThreshold: number; // minutes before expiration
}

// API Endpoints and Operations
export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: APIParameter[];
  requestSchema?: JSONSchema;
  responseSchema?: JSONSchema;
  authentication: boolean;
  rateLimit?: EndpointRateLimit;
  caching: CachingConfiguration;
  transformation: DataTransformation;
  validation: ValidationConfiguration;
}

export interface APIParameter {
  name: string;
  type: 'query' | 'path' | 'header' | 'body';
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  format?: string;
}

export interface JSONSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface EndpointRateLimit {
  requests: number;
  window: number; // seconds
  burst: number;
  key: 'ip' | 'user' | 'api_key' | 'custom';
}

export interface CachingConfiguration {
  enabled: boolean;
  ttl: number; // seconds
  key: string;
  vary?: string[];
  invalidateOn?: string[];
}

export interface DataTransformation {
  request?: TransformationRule[];
  response?: TransformationRule[];
  errorHandling: ErrorHandlingRule[];
}

export interface TransformationRule {
  type: 'map' | 'filter' | 'aggregate' | 'format' | 'validate' | 'custom';
  source: string;
  target: string;
  function?: string;
  parameters?: Record<string, any>;
}

export interface ErrorHandlingRule {
  condition: string;
  action: 'retry' | 'fallback' | 'transform' | 'ignore' | 'escalate';
  parameters?: Record<string, any>;
}

export interface ValidationConfiguration {
  enabled: boolean;
  rules: ValidationRule[];
  onFailure: 'reject' | 'warn' | 'transform';
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'format' | 'range' | 'custom';
  parameters?: Record<string, any>;
  message: string;
}

// Webhook Management
export interface WebhookConfiguration {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers: Record<string, string>;
  payloadTemplate?: string;
  transformation: DataTransformation;
  delivery: DeliveryConfiguration;
  security: WebhookSecurity;
}

export interface DeliveryConfiguration {
  retryAttempts: number;
  retryDelay: number; // seconds
  timeout: number; // seconds
  batchSize?: number;
  deliveryWindow?: TimeWindow;
}

export interface TimeWindow {
  start: string; // HH:MM format
  end: string; // HH:MM format
  timezone: string;
  days: number[]; // 0-6, Sunday to Saturday
}

export interface WebhookSecurity {
  signatureHeader?: string;
  signatureAlgorithm?: 'sha1' | 'sha256';
  ipWhitelist?: string[];
  requireHttps: boolean;
  validateCertificate: boolean;
}

// Rate Limiting and Throttling
export interface RateLimitConfiguration {
  enabled: boolean;
  global: RateLimitRule;
  perEndpoint: Record<string, RateLimitRule>;
  burst: BurstConfiguration;
  adaptive: AdaptiveRateLimit;
}

export interface RateLimitRule {
  requests: number;
  window: number; // seconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: string; // Function to generate rate limit key
}

export interface BurstConfiguration {
  enabled: boolean;
  maxBurst: number;
  refillRate: number; // tokens per second
  capacity: number;
}

export interface AdaptiveRateLimit {
  enabled: boolean;
  baseRate: number;
  maxRate: number;
  adjustmentFactor: number;
  errorThreshold: number;
  latencyThreshold: number; // milliseconds
}

// Monitoring and Analytics
export interface IntegrationMonitoring {
  enabled: boolean;
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  healthCheck: HealthCheckConfiguration;
  logging: LoggingConfiguration;
  tracing: TracingConfiguration;
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timing';
  description: string;
  labels: string[];
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
  retention: number; // days
}

export interface MonitoringAlert {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  window: number; // minutes
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
  escalation?: AlertEscalation;
}

export interface AlertEscalation {
  delay: number; // minutes
  channels: string[];
  repeat: boolean;
  maxRepeats?: number;
}

export interface HealthCheckConfiguration {
  enabled: boolean;
  endpoint?: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
  successCodes: number[];
  headers?: Record<string, string>;
  body?: any;
}

export interface LoggingConfiguration {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  includeHeaders: boolean;
  includeBody: boolean;
  sanitize: SanitizationRule[];
  retention: number; // days
}

export interface SanitizationRule {
  field: string;
  action: 'remove' | 'mask' | 'hash';
  pattern?: string;
  replacement?: string;
}

export interface TracingConfiguration {
  enabled: boolean;
  sampler: 'always' | 'never' | 'probabilistic' | 'adaptive';
  sampleRate: number; // 0-1
  propagation: string[];
  attributes: Record<string, string>;
}

// Security and Compliance
export interface IntegrationSecurity {
  encryption: EncryptionConfiguration;
  dataClassification: DataClassification;
  compliance: ComplianceConfiguration;
  audit: AuditConfiguration;
  access: AccessControlConfiguration;
}

export interface EncryptionConfiguration {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyManagement: KeyManagementConfiguration;
}

export interface KeyManagementConfiguration {
  provider: 'aws_kms' | 'azure_keyvault' | 'gcp_kms' | 'hashicorp_vault' | 'internal';
  keyId?: string;
  rotation: KeyRotationConfiguration;
}

export interface KeyRotationConfiguration {
  enabled: boolean;
  interval: number; // days
  automatic: boolean;
  backupCount: number;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // days
  geographicRestrictions: string[];
}

export interface ComplianceConfiguration {
  frameworks: ComplianceFramework[];
  dataHandling: DataHandlingPolicy;
  auditTrail: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
}

export interface ComplianceFramework {
  name: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'PCI_DSS';
  enabled: boolean;
  controls: string[];
}

export interface DataHandlingPolicy {
  collection: DataCollectionPolicy;
  processing: DataProcessingPolicy;
  sharing: DataSharingPolicy;
  retention: DataRetentionPolicy;
}

export interface DataCollectionPolicy {
  minimization: boolean;
  consentRequired: boolean;
  purposeLimitation: boolean;
  dataTypes: string[];
}

export interface DataProcessingPolicy {
  lawfulBasis: string[];
  processors: string[];
  transferMechanisms: string[];
  safeguards: string[];
}

export interface DataSharingPolicy {
  allowed: boolean;
  partners: string[];
  agreements: string[];
  restrictions: string[];
}

export interface DataRetentionPolicy {
  defaultPeriod: number; // days
  typeSpecific: Record<string, number>;
  deletionMethods: string[];
  archiving: boolean;
}

export interface AuditConfiguration {
  enabled: boolean;
  events: string[];
  retention: number; // days
  immutable: boolean;
  encryption: boolean;
  export: AuditExportConfiguration;
}

export interface AuditExportConfiguration {
  enabled: boolean;
  format: 'json' | 'csv' | 'xml';
  frequency: 'daily' | 'weekly' | 'monthly';
  destination: string;
  encryption: boolean;
}

export interface AccessControlConfiguration {
  authentication: boolean;
  authorization: AuthorizationConfiguration;
  ipWhitelist?: string[];
  geoblocking?: string[];
  timeRestrictions?: TimeRestriction[];
}

export interface AuthorizationConfiguration {
  type: 'rbac' | 'abac' | 'custom';
  roles: string[];
  permissions: string[];
  policies: AuthorizationPolicy[];
}

export interface AuthorizationPolicy {
  name: string;
  description: string;
  rules: AuthorizationRule[];
  effect: 'allow' | 'deny';
}

export interface AuthorizationRule {
  subject: string;
  resource: string;
  action: string;
  condition?: string;
}

export interface TimeRestriction {
  start: string; // HH:MM format
  end: string; // HH:MM format
  days: number[]; // 0-6, Sunday to Saturday
  timezone: string;
}

export interface IntegrationMetadata {
  version: string;
  sdk?: string;
  documentation: string;
  support: SupportConfiguration;
  billing: BillingConfiguration;
  performance: PerformanceMetrics;
}

export interface SupportConfiguration {
  level: 'community' | 'standard' | 'premium' | 'enterprise';
  contact: string;
  documentation: string;
  sla?: ServiceLevelAgreement;
}

export interface ServiceLevelAgreement {
  uptime: number; // percentage
  responseTime: number; // hours
  resolutionTime: number; // hours
  escalation: string[];
}

export interface BillingConfiguration {
  model: 'free' | 'usage' | 'subscription' | 'enterprise';
  currency: string;
  costs: BillingCost[];
  limits: BillingLimit[];
}

export interface BillingCost {
  type: 'request' | 'data' | 'user' | 'feature';
  unit: string;
  price: number;
  tiers?: BillingTier[];
}

export interface BillingTier {
  from: number;
  to?: number;
  price: number;
}

export interface BillingLimit {
  type: 'requests' | 'data' | 'users';
  limit: number;
  period: 'monthly' | 'daily' | 'hourly';
  overage: boolean;
}

export interface PerformanceMetrics {
  avgResponseTime: number; // milliseconds
  successRate: number; // percentage
  throughput: number; // requests per second
  availability: number; // percentage
  lastUpdated: Date;
}

// Integration Execution and Events
export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'request' | 'response' | 'error' | 'webhook' | 'sync' | 'auth';
  timestamp: Date;
  data: any;
  metadata: EventMetadata;
}

export interface EventMetadata {
  source: string;
  correlationId: string;
  traceId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  userId?: string;
  ipAddress?: string;
}

export interface SyncOperation {
  id: string;
  integrationId: string;
  type: 'full' | 'incremental' | 'selective';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errors: SyncError[];
  configuration: SyncConfiguration;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  error: string;
  code?: string;
  severity: 'warning' | 'error';
}

export interface SyncConfiguration {
  direction: 'push' | 'pull' | 'bidirectional';
  filters: SyncFilter[];
  mapping: FieldMapping[];
  conflictResolution: ConflictResolutionStrategy;
  batchSize: number;
  parallelism: number;
}

export interface SyncFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface FieldMapping {
  source: string;
  target: string;
  transformation?: string;
  defaultValue?: any;
  required: boolean;
}

export interface ConflictResolutionStrategy {
  strategy: 'source_wins' | 'target_wins' | 'latest_wins' | 'manual' | 'custom';
  customHandler?: string;
}

export class EnterpriseIntegrationAPIs extends EventEmitter {
  private integrations: Map<string, Integration> = new Map();
  private events: Map<string, IntegrationEvent[]> = new Map();
  private syncOperations: Map<string, SyncOperation> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();
  private webhookHandlers: Map<string, WebhookHandler> = new Map();

  constructor() {
    super();
    this.initializeIntegrationManager();
  }

  // Integration Management
  async createIntegration(integrationData: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Integration> {
    const integration: Integration = {
      ...integrationData,
      id: this.generateIntegrationId(),
      status: 'configuring',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate configuration
    await this.validateIntegrationConfiguration(integration);

    // Create HTTP client
    await this.createHttpClient(integration);

    // Setup webhooks
    if (integration.webhooks.length > 0) {
      await this.setupWebhooks(integration);
    }

    // Test connection
    const testResult = await this.testIntegrationConnection(integration);
    if (!testResult.success) {
      integration.status = 'error';
      throw new Error(`Integration test failed: ${testResult.error}`);
    }

    integration.status = 'active';
    this.integrations.set(integration.id, integration);

    this.emit('integration_created', integration);
    return integration;
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const updatedIntegration = {
      ...integration,
      ...updates,
      updatedAt: new Date()
    };

    // Revalidate if configuration changed
    if (updates.configuration || updates.authentication) {
      await this.validateIntegrationConfiguration(updatedIntegration);
      await this.updateHttpClient(updatedIntegration);
    }

    this.integrations.set(integrationId, updatedIntegration);

    this.emit('integration_updated', updatedIntegration);
    return updatedIntegration;
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Cleanup webhooks
    await this.cleanupWebhooks(integration);

    // Remove HTTP client
    this.httpClients.delete(integrationId);

    // Archive events (don't delete for audit purposes)
    const events = this.events.get(integrationId) || [];
    this.archiveEvents(integrationId, events);

    this.integrations.delete(integrationId);

    this.emit('integration_deleted', { integrationId });
  }

  // API Operations
  async makeAPICall(
    integrationId: string,
    endpointId: string,
    parameters?: Record<string, any>
  ): Promise<APIResponse> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const endpoint = integration.endpoints.find(e => e.id === endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    const client = this.httpClients.get(integrationId);
    if (!client) {
      throw new Error(`HTTP client not found for integration ${integrationId}`);
    }

    const startTime = Date.now();
    let response: any;
    let error: any;

    try {
      // Build request configuration
      const requestConfig = await this.buildRequestConfig(integration, endpoint, parameters);

      // Apply rate limiting
      await this.enforceRateLimit(integration, endpoint);

      // Make request
      response = await client.request(requestConfig);

      // Transform response
      if (endpoint.transformation.response) {
        response.data = await this.transformData(response.data, endpoint.transformation.response);
      }

      // Cache response if enabled
      if (endpoint.caching.enabled) {
        await this.cacheResponse(integration, endpoint, requestConfig, response);
      }

      const apiResponse: APIResponse = {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: response.headers,
        duration: Date.now() - startTime
      };

      // Log event
      await this.logEvent(integrationId, {
        type: 'response',
        data: {
          endpoint: endpointId,
          statusCode: response.status,
          duration: apiResponse.duration
        }
      });

      return apiResponse;

    } catch (err) {
      error = err;
      const apiResponse: APIResponse = {
        success: false,
        error: (err as Error).message,
        statusCode: (err as any).response?.status || 500,
        duration: Date.now() - startTime
      };

      // Handle error according to rules
      if (endpoint.transformation.errorHandling.length > 0) {
        await this.handleAPIError(integration, endpoint, err as Error);
      }

      // Log error event
      await this.logEvent(integrationId, {
        type: 'error',
        data: {
          endpoint: endpointId,
          error: (err as Error).message,
          statusCode: apiResponse.statusCode
        }
      });

      return apiResponse;
    }
  }

  async batchAPICall(
    integrationId: string,
    requests: BatchRequest[]
  ): Promise<BatchResponse> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const batchSize = integration.configuration.batchSize || 10;
    const results: APIResponse[] = [];
    const errors: BatchError[] = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await this.makeAPICall(integrationId, request.endpointId, request.parameters);
          results[i + index] = result;
        } catch (error) {
          errors.push({
            index: i + index,
            request,
            error: (error as Error).message
          });
        }
      });

      await Promise.allSettled(batchPromises);

      // Apply rate limiting between batches
      if (i + batchSize < requests.length) {
        await this.delay(integration.rateLimit.global.window / 10); // Small delay
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalRequests: requests.length,
      successfulRequests: results.length,
      failedRequests: errors.length
    };
  }

  // Webhook Management
  async handleWebhook(integrationId: string, webhookId: string, payload: any, headers: Record<string, string>): Promise<WebhookResponse> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const webhook = integration.webhooks.find(w => w.id === webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    if (!webhook.active) {
      return {
        success: false,
        error: 'Webhook is not active'
      };
    }

    try {
      // Verify webhook security
      if (webhook.security.requireHttps && !headers['x-forwarded-proto']?.includes('https')) {
        throw new Error('HTTPS required for webhook');
      }

      // Verify signature if configured
      if (webhook.secret && webhook.security.signatureHeader) {
        const isValid = await this.verifyWebhookSignature(webhook, payload, headers);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Transform payload
      let transformedPayload = payload;
      if (webhook.transformation.request) {
        transformedPayload = await this.transformData(payload, webhook.transformation.request);
      }

      // Process webhook
      await this.processWebhookPayload(integration, webhook, transformedPayload);

      // Log event
      await this.logEvent(integrationId, {
        type: 'webhook',
        data: {
          webhookId,
          event: headers['x-event-type'] || 'unknown'
        }
      });

      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      // Log error
      await this.logEvent(integrationId, {
        type: 'error',
        data: {
          webhookId,
          error: (error as Error).message
        }
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Data Synchronization
  async startSync(integrationId: string, configuration: SyncConfiguration): Promise<SyncOperation> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const syncOperation: SyncOperation = {
      id: this.generateSyncId(),
      integrationId,
      type: 'full',
      status: 'pending',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      errors: [],
      configuration
    };

    this.syncOperations.set(syncOperation.id, syncOperation);

    // Start sync process
    this.processSyncOperation(syncOperation);

    this.emit('sync_started', syncOperation);
    return syncOperation;
  }

  async getSyncStatus(syncId: string): Promise<SyncOperation | undefined> {
    return this.syncOperations.get(syncId);
  }

  async cancelSync(syncId: string): Promise<void> {
    const syncOperation = this.syncOperations.get(syncId);
    if (!syncOperation) {
      throw new Error(`Sync operation ${syncId} not found`);
    }

    if (syncOperation.status === 'running') {
      syncOperation.status = 'cancelled';
      syncOperation.endTime = new Date();
      syncOperation.duration = syncOperation.endTime.getTime() - syncOperation.startTime.getTime();

      this.emit('sync_cancelled', syncOperation);
    }
  }

  // Monitoring and Health
  async getIntegrationHealth(integrationId: string): Promise<IntegrationHealth> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const events = this.events.get(integrationId) || [];
    const recentEvents = events.filter(e =>
      Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const successRate = recentEvents.length > 0
      ? (recentEvents.length - errorEvents.length) / recentEvents.length * 100
      : 100;

    const avgResponseTime = this.calculateAverageResponseTime(recentEvents);

    const health: IntegrationHealth = {
      status: integration.status,
      uptime: this.calculateUptime(integration),
      successRate,
      averageResponseTime: avgResponseTime,
      totalRequests: recentEvents.length,
      errorCount: errorEvents.length,
      lastSync: integration.lastSync,
      alerts: await this.getActiveAlerts(integrationId),
      recommendations: await this.generateHealthRecommendations(integration, recentEvents)
    };

    return health;
  }

  // Private Implementation Methods
  private initializeIntegrationManager(): void {
    // Setup periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute

    // Cleanup old events
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000); // Daily

    // Refresh authentication tokens
    setInterval(() => {
      this.refreshAuthenticationTokens();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private async validateIntegrationConfiguration(integration: Integration): Promise<void> {
    // Validate endpoints
    for (const endpoint of integration.endpoints) {
      if (!endpoint.path || !endpoint.method) {
        throw new Error(`Invalid endpoint configuration: ${endpoint.name}`);
      }
    }

    // Validate authentication
    if (!integration.authentication.credentials) {
      throw new Error('Authentication credentials are required');
    }

    // Validate webhooks
    for (const webhook of integration.webhooks) {
      if (!webhook.url || webhook.events.length === 0) {
        throw new Error(`Invalid webhook configuration: ${webhook.name}`);
      }
    }
  }

  private async createHttpClient(integration: Integration): Promise<void> {
    const config: AxiosRequestConfig = {
      baseURL: integration.configuration.baseUrl,
      timeout: integration.configuration.timeout,
      headers: {}
    };

    // Setup authentication
    switch (integration.authentication.type) {
      case 'api_key':
        if (integration.authentication.credentials.apiKey) {
          config.headers!['Authorization'] = `Bearer ${integration.authentication.credentials.apiKey}`;
        }
        break;
      case 'basic_auth':
        if (integration.authentication.credentials.username && integration.authentication.credentials.password) {
          const credentials = Buffer.from(
            `${integration.authentication.credentials.username}:${integration.authentication.credentials.password}`
          ).toString('base64');
          config.headers!['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'oauth2':
        if (integration.authentication.credentials.accessToken) {
          config.headers!['Authorization'] = `Bearer ${integration.authentication.credentials.accessToken}`;
        }
        break;
    }

    // Add custom headers
    if (integration.authentication.credentials.customHeaders) {
      Object.assign(config.headers!, integration.authentication.credentials.customHeaders);
    }

    const client = axios.create(config);

    // Add request interceptor
    client.interceptors.request.use(
      (config) => {
        this.logEvent(integration.id, {
          type: 'request',
          data: {
            method: config.method,
            url: config.url,
            headers: config.headers
          }
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle token refresh
        if (error.response?.status === 401 && integration.authentication.tokenRefresh.enabled) {
          const refreshed = await this.refreshAuthenticationToken(integration);
          if (refreshed) {
            // Retry request with new token
            return client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    this.httpClients.set(integration.id, client);
  }

  private async updateHttpClient(integration: Integration): Promise<void> {
    this.httpClients.delete(integration.id);
    await this.createHttpClient(integration);
  }

  private async setupWebhooks(integration: Integration): Promise<void> {
    for (const webhook of integration.webhooks) {
      const handler = new WebhookHandler(webhook);
      this.webhookHandlers.set(webhook.id, handler);
    }
  }

  private async cleanupWebhooks(integration: Integration): Promise<void> {
    for (const webhook of integration.webhooks) {
      this.webhookHandlers.delete(webhook.id);
    }
  }

  // Utility methods
  private generateIntegrationId(): string {
    return `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logEvent(integrationId: string, eventData: Partial<IntegrationEvent>): Promise<void> {
    const event: IntegrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      integrationId,
      timestamp: new Date(),
      metadata: {
        source: 'integration_manager',
        correlationId: `corr_${Date.now()}`
      },
      ...eventData
    } as IntegrationEvent;

    let events = this.events.get(integrationId) || [];
    events.push(event);

    // Keep only recent events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }

    this.events.set(integrationId, events);
    this.emit('event_logged', event);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Placeholder implementations for complex methods
  private async testIntegrationConnection(integration: Integration): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  private async buildRequestConfig(integration: Integration, endpoint: APIEndpoint, parameters?: Record<string, any>): Promise<AxiosRequestConfig> {
    return {};
  }

  private async enforceRateLimit(integration: Integration, endpoint: APIEndpoint): Promise<void> {}

  private async transformData(data: any, rules: TransformationRule[]): Promise<any> {
    return data;
  }

  private async cacheResponse(integration: Integration, endpoint: APIEndpoint, request: any, response: any): Promise<void> {}

  private async handleAPIError(integration: Integration, endpoint: APIEndpoint, error: Error): Promise<void> {}

  private archiveEvents(integrationId: string, events: IntegrationEvent[]): void {}

  private async verifyWebhookSignature(webhook: WebhookConfiguration, payload: any, headers: Record<string, string>): Promise<boolean> {
    return true;
  }

  private async processWebhookPayload(integration: Integration, webhook: WebhookConfiguration, payload: any): Promise<void> {}

  private async processSyncOperation(syncOperation: SyncOperation): Promise<void> {
    syncOperation.status = 'running';
    // Implementation would perform the actual sync
    setTimeout(() => {
      syncOperation.status = 'completed';
      syncOperation.endTime = new Date();
      syncOperation.duration = syncOperation.endTime.getTime() - syncOperation.startTime.getTime();
      this.emit('sync_completed', syncOperation);
    }, 5000);
  }

  private calculateAverageResponseTime(events: IntegrationEvent[]): number {
    const responseEvents = events.filter(e => e.metadata.duration);
    if (responseEvents.length === 0) return 0;

    const totalDuration = responseEvents.reduce((sum, e) => sum + (e.metadata.duration || 0), 0);
    return totalDuration / responseEvents.length;
  }

  private calculateUptime(integration: Integration): number {
    const totalTime = Date.now() - integration.createdAt.getTime();
    // Implementation would calculate actual uptime based on health checks
    return 99.5; // Placeholder
  }

  private async getActiveAlerts(integrationId: string): Promise<Alert[]> {
    return []; // Placeholder
  }

  private async generateHealthRecommendations(integration: Integration, events: IntegrationEvent[]): Promise<string[]> {
    return []; // Placeholder
  }

  private performHealthChecks(): void {}
  private cleanupOldEvents(): void {}
  private async refreshAuthenticationTokens(): Promise<void> {}
  private async refreshAuthenticationToken(integration: Integration): Promise<boolean> { return false; }

  // Public API methods
  getIntegration(integrationId: string): Integration | undefined {
    return this.integrations.get(integrationId);
  }

  getIntegrations(organizationId?: string): Integration[] {
    const integrations = Array.from(this.integrations.values());
    return organizationId ? integrations.filter(i => i.organizationId === organizationId) : integrations;
  }

  getIntegrationEvents(integrationId: string, limit?: number): IntegrationEvent[] {
    const events = this.events.get(integrationId) || [];
    return limit ? events.slice(-limit) : events;
  }
}

// Additional interfaces and classes
interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
  headers?: Record<string, any>;
  duration: number;
}

interface BatchRequest {
  endpointId: string;
  parameters?: Record<string, any>;
}

interface BatchResponse {
  success: boolean;
  results: APIResponse[];
  errors: BatchError[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

interface BatchError {
  index: number;
  request: BatchRequest;
  error: string;
}

interface WebhookResponse {
  success: boolean;
  error?: string;
  message?: string;
}

interface IntegrationHealth {
  status: IntegrationStatus;
  uptime: number;
  successRate: number;
  averageResponseTime: number;
  totalRequests: number;
  errorCount: number;
  lastSync?: Date;
  alerts: Alert[];
  recommendations: string[];
}

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
}

class WebhookHandler {
  constructor(private webhook: WebhookConfiguration) {}

  async handle(payload: any, headers: Record<string, string>): Promise<void> {
    // Implementation for webhook handling
  }
}

export default EnterpriseIntegrationAPIs;