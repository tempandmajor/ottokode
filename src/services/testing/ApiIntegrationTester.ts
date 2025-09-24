import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

interface ApiTestResult {
  service: string;
  endpoint?: string;
  method: string;
  status: 'success' | 'failure' | 'partial';
  responseTime: number;
  error?: string;
  details?: any;
}

interface ApiHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  metadata?: any;
}

export class ApiIntegrationTester {
  private supabaseClient: SupabaseClient | null = null;
  private openaiClient: OpenAI | null = null;
  private testResults: ApiTestResult[] = [];

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }

    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }

  async runAllApiTests(): Promise<ApiTestResult[]> {
    console.log('🔌 Starting API Integration Tests...\n');
    this.testResults = [];

    const testSuites = [
      this.testSupabaseIntegration.bind(this),
      this.testOpenAIIntegration.bind(this),
      this.testLocalApiEndpoints.bind(this),
      this.testExternalServices.bind(this),
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite();
      } catch (error) {
        console.error('❌ Test suite failed:', error);
      }
    }

    this.printTestSummary();
    return this.testResults;
  }

  async checkApiHealth(): Promise<ApiHealth[]> {
    const healthChecks: ApiHealth[] = [];

    // Supabase Health
    if (this.supabaseClient) {
      const startTime = Date.now();
      try {
        const { error } = await this.supabaseClient
          .from('ai_patches')
          .select('count')
          .limit(1);

        const responseTime = Date.now() - startTime;
        healthChecks.push({
          service: 'Supabase',
          status: !error || error.message.includes('permission') ? 'healthy' : 'degraded',
          responseTime,
          lastChecked: new Date(),
          metadata: { error: error?.message }
        });
      } catch (error) {
        healthChecks.push({
          service: 'Supabase',
          status: 'down',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          metadata: { error: (error as Error).message }
        });
      }
    }

    // OpenAI Health
    if (this.openaiClient) {
      const startTime = Date.now();
      try {
        const response = await this.openaiClient.models.list();
        const responseTime = Date.now() - startTime;

        healthChecks.push({
          service: 'OpenAI',
          status: 'healthy',
          responseTime,
          lastChecked: new Date(),
          metadata: { modelsCount: response.data.length }
        });
      } catch (error) {
        healthChecks.push({
          service: 'OpenAI',
          status: 'down',
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          metadata: { error: (error as Error).message }
        });
      }
    }

    return healthChecks;
  }

  private async testSupabaseIntegration() {
    console.log('🗄️  Testing Supabase Integration...');

    if (!this.supabaseClient) {
      this.addTestResult({
        service: 'Supabase',
        method: 'initialization',
        status: 'failure',
        responseTime: 0,
        error: 'Supabase client not initialized - check environment variables'
      });
      return;
    }

    // Test authentication
    await this.testWithTiming('Supabase', 'auth', async () => {
      const { data: { user }, error } = await this.supabaseClient!.auth.getUser();
      return { authenticated: !!user, error: error?.message };
    });

    // Test database read
    await this.testWithTiming('Supabase', 'database-read', async () => {
      const { data, error } = await this.supabaseClient!
        .from('ai_patches')
        .select('id, created_at')
        .limit(5);

      if (error && !error.message.includes('permission')) {
        throw new Error(error.message);
      }

      return {
        recordsFound: data?.length || 0,
        tablesAccessible: ['ai_patches'],
        permissions: error?.message.includes('permission') ? 'limited' : 'full'
      };
    });

    // Test database write (if permissions allow)
    await this.testWithTiming('Supabase', 'database-write', async () => {
      const testRecord = {
        file_path: '/test/integration-test.ts',
        original_content: 'test content',
        ai_suggestion: 'test suggestion',
        status: 'pending'
      };

      const { data, error } = await this.supabaseClient!
        .from('ai_patches')
        .insert([testRecord])
        .select();

      if (error) {
        if (error.message.includes('permission')) {
          return { writeTest: 'skipped', reason: 'insufficient permissions' };
        }
        throw new Error(error.message);
      }

      // Clean up test record
      if (data && data.length > 0) {
        await this.supabaseClient!
          .from('ai_patches')
          .delete()
          .eq('id', data[0].id);
      }

      return { writeTest: 'success', recordsCreated: data?.length || 0 };
    });

    // Test storage (if available)
    await this.testWithTiming('Supabase', 'storage', async () => {
      const { data: buckets, error } = await this.supabaseClient!
        .storage
        .listBuckets();

      if (error) {
        return { storage: 'unavailable', error: error.message };
      }

      return {
        storage: 'available',
        buckets: buckets?.map(b => b.name) || []
      };
    });

    // Test real-time subscriptions
    await this.testWithTiming('Supabase', 'realtime', async () => {
      return new Promise((resolve) => {
        const channel = this.supabaseClient!
          .channel('integration-test')
          .on('broadcast', { event: 'test' }, () => {
            resolve({ realtime: 'working' });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Test broadcast
              channel.send({
                type: 'broadcast',
                event: 'test',
                payload: { test: true }
              });
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              resolve({ realtime: 'failed', status });
            }
          });

        // Timeout after 5 seconds
        setTimeout(() => {
          channel.unsubscribe();
          resolve({ realtime: 'timeout' });
        }, 5000);
      });
    });
  }

  private async testOpenAIIntegration() {
    console.log('🤖 Testing OpenAI Integration...');

    if (!this.openaiClient) {
      this.addTestResult({
        service: 'OpenAI',
        method: 'initialization',
        status: 'failure',
        responseTime: 0,
        error: 'OpenAI client not initialized - check OPENAI_API_KEY'
      });
      return;
    }

    // Test models list
    await this.testWithTiming('OpenAI', 'models-list', async () => {
      const response = await this.openaiClient!.models.list();
      const models = response.data.map(m => m.id);
      const hasGPT4 = models.some(m => m.includes('gpt-4'));
      const hasGPT35 = models.some(m => m.includes('gpt-3.5'));

      return {
        totalModels: models.length,
        hasGPT4,
        hasGPT35,
        availableModels: models.slice(0, 5) // First 5 models
      };
    });

    // Test chat completions
    await this.testWithTiming('OpenAI', 'chat-completion', async () => {
      const response = await this.openaiClient!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Say "test successful" if you can respond.' }
        ],
        max_tokens: 10
      });

      const content = response.choices[0]?.message?.content || '';
      const successful = content.toLowerCase().includes('test successful');

      return {
        response: successful,
        content: content.trim(),
        usage: response.usage,
        model: response.model
      };
    });

    // Test embeddings
    await this.testWithTiming('OpenAI', 'embeddings', async () => {
      const response = await this.openaiClient!.embeddings.create({
        model: 'text-embedding-ada-002',
        input: 'This is a test for embedding generation.'
      });

      const embedding = response.data[0]?.embedding;

      return {
        embeddingGenerated: !!embedding,
        dimensions: embedding?.length || 0,
        usage: response.usage
      };
    });
  }

  private async testLocalApiEndpoints() {
    console.log('🏠 Testing Local API Endpoints...');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const endpoints = [
      { path: '/api/health', method: 'GET' },
      { path: '/api/chat', method: 'POST', body: { message: 'test' } },
      { path: '/api/files', method: 'GET' },
      { path: '/api/suggestions', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      await this.testWithTiming('Local API', endpoint.path, async () => {
        const options: RequestInit = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        try {
          const response = await fetch(`${baseUrl}${endpoint.path}`, {
            ...options,
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : await response.text();

          return {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            dataReceived: !!data,
            responseSize: JSON.stringify(data).length
          };
        } catch (error: any) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout');
          }
          throw error;
        }
      });
    }
  }

  private async testExternalServices() {
    console.log('🌐 Testing External Services...');

    const services = [
      {
        name: 'GitHub API',
        url: 'https://api.github.com',
        test: async () => {
          const response = await fetch('https://api.github.com/zen');
          return {
            status: response.status,
            zen: await response.text()
          };
        }
      },
      {
        name: 'NPM Registry',
        url: 'https://registry.npmjs.org',
        test: async () => {
          const response = await fetch('https://registry.npmjs.org/react/latest');
          const data = await response.json();
          return {
            status: response.status,
            reactVersion: data.version
          };
        }
      }
    ];

    for (const service of services) {
      await this.testWithTiming('External', service.name, async () => {
        try {
          const result = await Promise.race([
            service.test(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 10000)
            )
          ]);
          return result;
        } catch (error) {
          throw new Error(`${service.name} unreachable: ${(error as Error).message}`);
        }
      });
    }
  }

  private async testWithTiming(
    service: string,
    method: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await testFn();
      const responseTime = Date.now() - startTime;

      this.addTestResult({
        service,
        endpoint: method,
        method: 'TEST',
        status: 'success',
        responseTime,
        details: result
      });

      console.log(`  ✅ ${service} - ${method} (${responseTime}ms)`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.addTestResult({
        service,
        endpoint: method,
        method: 'TEST',
        status: 'failure',
        responseTime,
        error: errorMessage
      });

      console.log(`  ❌ ${service} - ${method} - ${errorMessage}`);
    }
  }

  private addTestResult(result: Omit<ApiTestResult, 'details'> & { details?: any }) {
    this.testResults.push(result as ApiTestResult);
  }

  private printTestSummary() {
    const successful = this.testResults.filter(r => r.status === 'success').length;
    const failed = this.testResults.filter(r => r.status === 'failure').length;
    const partial = this.testResults.filter(r => r.status === 'partial').length;

    console.log('\n🔌 API Integration Test Summary');
    console.log('═'.repeat(40));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log(`📊 Total: ${this.testResults.length}`);

    const avgResponseTime = this.testResults
      .reduce((sum, r) => sum + r.responseTime, 0) / this.testResults.length;

    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'failure')
        .forEach(test => {
          console.log(`  • ${test.service} - ${test.endpoint}: ${test.error}`);
        });
    }

    const successRate = (successful / this.testResults.length * 100).toFixed(1);
    console.log(`\n🎯 API Success Rate: ${successRate}%`);
  }

  async generateApiReport(): Promise<any> {
    const healthStatus = await this.checkApiHealth();

    return {
      timestamp: new Date(),
      testResults: this.testResults,
      healthStatus,
      summary: {
        total: this.testResults.length,
        successful: this.testResults.filter(r => r.status === 'success').length,
        failed: this.testResults.filter(r => r.status === 'failure').length,
        partial: this.testResults.filter(r => r.status === 'partial').length,
        averageResponseTime: this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / this.testResults.length
      }
    };
  }
}

export default ApiIntegrationTester;