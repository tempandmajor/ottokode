import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';

export interface APIKeyConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'mistral';
  name: string;
  key: string; // Encrypted
  isActive: boolean;
  organizationId?: string; // For enterprise keys
  isPersonal: boolean; // User's personal key vs org key
  createdAt: string;
  lastUsed?: string;
}

export interface ProviderConfig {
  provider: string;
  name: string;
  description: string;
  keyFormat: string;
  testEndpoint?: string;
  models: string[];
  pricing: {
    inputTokens: number; // per 1M tokens
    outputTokens: number; // per 1M tokens
  };
}

class APIKeyManager {
  private encryptionKey: string | null = null;

  constructor() {
    this.initializeEncryption();
  }

  private async initializeEncryption() {
    // In production, use a proper encryption key management system
    // For now, derive from user session
    const user = authService.getCurrentUser();
    if (user) {
      this.encryptionKey = await this.deriveEncryptionKey(user.id);
    }
  }

  private async deriveEncryptionKey(userId: string): Promise<string> {
    // Simple key derivation - in production, use proper KDF
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + 'ai-ide-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async encryptKey(apiKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    // Simple encryption - in production, use proper AES encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);

    // XOR with encryption key (simplified - use proper encryption in production)
    const encrypted = data.map((byte, index) =>
      byte ^ this.encryptionKey!.charCodeAt(index % this.encryptionKey!.length)
    );

    return btoa(String.fromCharCode(...encrypted));
  }

  private async decryptKey(encryptedKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const encrypted = atob(encryptedKey);
      const data = Uint8Array.from(encrypted, c => c.charCodeAt(0));

      // XOR with encryption key (simplified)
      const decrypted = data.map((byte, index) =>
        byte ^ this.encryptionKey!.charCodeAt(index % this.encryptionKey!.length)
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt API key');
    }
  }

  async addPersonalAPIKey(provider: string, name: string, apiKey: string): Promise<APIKeyConfig> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Validate API key format
    if (!this.validateAPIKeyFormat(provider, apiKey)) {
      throw new Error(`Invalid API key format for ${provider}`);
    }

    // Test API key
    const isValid = await this.testAPIKey(provider, apiKey);
    if (!isValid) {
      throw new Error(`API key test failed for ${provider}`);
    }

    const encryptedKey = await this.encryptKey(apiKey);

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        key_name: name,
        encrypted_key: encryptedKey,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving API key:', error);
      throw error;
    }

    return {
      id: data.id,
      provider: data.provider as any,
      name: data.key_name,
      key: apiKey, // Return decrypted for immediate use
      isActive: data.is_active,
      isPersonal: true,
      createdAt: data.created_at,
    };
  }

  async addOrganizationAPIKey(
    organizationId: string,
    provider: string,
    name: string,
    apiKey: string
  ): Promise<APIKeyConfig> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check organization permissions
    // TODO: Implement organization permission check

    const encryptedKey = await this.encryptKey(apiKey);

    const { data, error } = await supabase
      .from('organization_api_keys')
      .insert({
        organization_id: organizationId,
        provider,
        key_name: name,
        encrypted_key: encryptedKey,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving organization API key:', error);
      throw error;
    }

    return {
      id: data.id,
      provider: data.provider as any,
      name: data.key_name,
      key: apiKey,
      isActive: data.is_active,
      isPersonal: false,
      organizationId,
      createdAt: data.created_at,
    };
  }

  async getUserAPIKeys(): Promise<APIKeyConfig[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching user API keys:', error);
      return [];
    }

    const keys: APIKeyConfig[] = [];
    for (const key of data) {
      try {
        const decryptedKey = await this.decryptKey(key.encrypted_key);
        keys.push({
          id: key.id,
          provider: key.provider as any,
          name: key.key_name,
          key: decryptedKey,
          isActive: key.is_active,
          isPersonal: true,
          createdAt: key.created_at,
          lastUsed: key.last_used_at,
        });
      } catch (error) {
        console.error('Error decrypting API key:', error);
      }
    }

    return keys;
  }

  async getOrganizationAPIKeys(organizationId: string): Promise<APIKeyConfig[]> {
    const { data, error } = await supabase
      .from('organization_api_keys')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching organization API keys:', error);
      return [];
    }

    const keys: APIKeyConfig[] = [];
    for (const key of data) {
      try {
        const decryptedKey = await this.decryptKey(key.encrypted_key);
        keys.push({
          id: key.id,
          provider: key.provider as any,
          name: key.key_name,
          key: decryptedKey,
          isActive: key.is_active,
          isPersonal: false,
          organizationId,
          createdAt: key.created_at,
          lastUsed: key.last_used_at,
        });
      } catch (error) {
        console.error('Error decrypting API key:', error);
      }
    }

    return keys;
  }

  async getActiveAPIKey(provider: string, organizationId?: string): Promise<string | null> {
    // Prioritize organization keys over personal keys
    if (organizationId) {
      const orgKeys = await this.getOrganizationAPIKeys(organizationId);
      const providerKey = orgKeys.find(key => key.provider === provider && key.isActive);
      if (providerKey) {
        await this.updateLastUsed(providerKey.id, false);
        return providerKey.key;
      }
    }

    // Fallback to personal keys
    const personalKeys = await this.getUserAPIKeys();
    const providerKey = personalKeys.find(key => key.provider === provider && key.isActive);
    if (providerKey) {
      await this.updateLastUsed(providerKey.id, true);
      return providerKey.key;
    }

    return null;
  }

  async deleteAPIKey(keyId: string, isPersonal: boolean): Promise<void> {
    const table = isPersonal ? 'user_api_keys' : 'organization_api_keys';

    const { error } = await supabase
      .from(table)
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  private async updateLastUsed(keyId: string, isPersonal: boolean): Promise<void> {
    const table = isPersonal ? 'user_api_keys' : 'organization_api_keys';

    await supabase
      .from(table)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId);
  }

  private validateAPIKeyFormat(provider: string, apiKey: string): boolean {
    const patterns = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]+$/,
      google: /^AI[a-zA-Z0-9-_]{35,}$/,
      cohere: /^[a-zA-Z0-9]{40,}$/,
      mistral: /^[a-zA-Z0-9]{32,}$/,
    };

    const pattern = patterns[provider as keyof typeof patterns];
    return pattern ? pattern.test(apiKey) : true; // Default to true for unknown providers
  }

  private async testAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          return await this.testOpenAIKey(apiKey);
        case 'anthropic':
          return await this.testAnthropicKey(apiKey);
        case 'google':
          return await this.testGoogleAIKey(apiKey);
        default:
          return true; // Skip test for unknown providers
      }
    } catch (error) {
      console.error(`API key test failed for ${provider}:`, error);
      return false;
    }
  }

  private async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testAnthropicKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.status !== 401; // Unauthorized means invalid key
    } catch {
      return false;
    }
  }

  private async testGoogleAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  getSupportedProviders(): ProviderConfig[] {
    return [
      {
        provider: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other OpenAI models',
        keyFormat: 'sk-...',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        pricing: { inputTokens: 30, outputTokens: 60 },
      },
      {
        provider: 'anthropic',
        name: 'Anthropic',
        description: 'Claude 3 Opus, Sonnet, and Haiku models',
        keyFormat: 'sk-ant-...',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        pricing: { inputTokens: 15, outputTokens: 75 },
      },
      {
        provider: 'google',
        name: 'Google AI',
        description: 'Gemini Pro and other Google AI models',
        keyFormat: 'AI...',
        models: ['gemini-pro', 'gemini-pro-vision'],
        pricing: { inputTokens: 7, outputTokens: 21 },
      },
      {
        provider: 'cohere',
        name: 'Cohere',
        description: 'Command and other Cohere models',
        keyFormat: '40+ character string',
        models: ['command', 'command-light'],
        pricing: { inputTokens: 15, outputTokens: 15 },
      },
      {
        provider: 'mistral',
        name: 'Mistral AI',
        description: 'Mistral Large and Medium models',
        keyFormat: '32+ character string',
        models: ['mistral-large', 'mistral-medium'],
        pricing: { inputTokens: 8, outputTokens: 24 },
      },
    ];
  }
}

export const apiKeyManager = new APIKeyManager();