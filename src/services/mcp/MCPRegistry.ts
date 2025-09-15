import { MCPServer, MCPServerRegistry, MCPToolResult, MCPContent } from '../../types/mcp';
import { StripeServer } from './StripeServer';
import { SupabaseServer } from './SupabaseServer';
import { VercelServer } from './VercelServer';

export class MCPRegistry implements MCPServerRegistry {
  public servers = new Map<string, MCPServer>();
  private configurations = new Map<string, any>();
  private usageStats = {
    totalCalls: 0,
    byServer: new Map<string, number>(),
    byTool: new Map<string, number>(),
    errors: 0,
    lastUsed: null as Date | null
  };

  constructor() {
    this.initializeDefaultServers();
  }

  private initializeDefaultServers(): void {
    // Initialize default MCP servers
    const stripeServer = new StripeServer();
    const supabaseServer = new SupabaseServer();
    const vercelServer = new VercelServer();

    this.register(stripeServer);
    this.register(supabaseServer);
    this.register(vercelServer);
  }

  register(server: MCPServer): void {
    this.servers.set(server.name, server);
    console.log(`MCP Server registered: ${server.name}`);
  }

  unregister(name: string): void {
    this.servers.delete(name);
    this.configurations.delete(name);
    console.log(`MCP Server unregistered: ${name}`);
  }

  get(name: string): MCPServer | undefined {
    return this.servers.get(name);
  }

  list(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  async executeTool(serverName: string, toolName: string, params: any): Promise<MCPToolResult> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP Server '${serverName}' not found`);
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found in server '${serverName}'`);
    }

    try {
      // Validate input schema if needed
      this.validateInput(tool.inputSchema, params);
      
      // Execute the tool
      const result = await tool.handler(params);
      
      // Log usage for analytics
      this.logToolUsage(serverName, toolName, params, result);
      
      return result;
    } catch (error) {
      const errorResult: MCPToolResult = {
        content: [{
          type: 'text',
          text: `Error executing tool '${toolName}' on server '${serverName}': ${error}`
        }],
        isError: true
      };
      
      this.logToolUsage(serverName, toolName, params, errorResult);
      return errorResult;
    }
  }

  async getResource(serverName: string, uri: string): Promise<MCPContent> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP Server '${serverName}' not found`);
    }

    const resource = server.resources.find(r => r.uri === uri);
    if (!resource) {
      throw new Error(`Resource '${uri}' not found in server '${serverName}'`);
    }

    // For demo purposes, return basic resource info
    // In a real implementation, this would fetch actual resource content
    return {
      type: 'text',
      text: `Resource: ${resource.name}\nDescription: ${resource.description}\nURI: ${resource.uri}`
    };
  }

  configureServer(serverName: string, config: any): boolean {
    const server = this.servers.get(serverName);
    if (!server) {
      return false;
    }

    try {
      // Configure based on server type
      switch (serverName) {
        case 'stripe':
          (server as StripeServer).setApiKey(config.apiKey);
          break;
        case 'supabase':
          (server as SupabaseServer).configure({
            projectUrl: config.projectUrl,
            anonKey: config.anonKey,
            serviceKey: config.serviceKey
          });
          break;
        case 'vercel':
          (server as VercelServer).configure({
            apiToken: config.apiToken,
            teamId: config.teamId
          });
          break;
        default:
          console.warn(`Unknown server type: ${serverName}`);
          return false;
      }

      this.configurations.set(serverName, config);
      console.log(`MCP Server '${serverName}' configured successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to configure server '${serverName}':`, error);
      return false;
    }
  }

  getServerConfiguration(serverName: string): any {
    return this.configurations.get(serverName);
  }

  isServerConfigured(serverName: string): boolean {
    const server = this.servers.get(serverName);
    if (!server) return false;

    switch (serverName) {
      case 'stripe':
        return (server as StripeServer).isConfigured();
      case 'supabase':
        return (server as SupabaseServer).isConfigured();
      case 'vercel':
        return (server as VercelServer).isConfigured();
      default:
        return false;
    }
  }

  getAvailableTools(): Array<{ serverName: string; toolName: string; description: string; schema: any }> {
    const tools: Array<{ serverName: string; toolName: string; description: string; schema: any }> = [];

    for (const [serverName, server] of this.servers) {
      if (this.isServerConfigured(serverName)) {
        for (const tool of server.tools) {
          tools.push({
            serverName,
            toolName: tool.name,
            description: tool.description,
            schema: tool.inputSchema
          });
        }
      }
    }

    return tools;
  }

  getAvailableResources(): Array<{ serverName: string; uri: string; name: string; description: string }> {
    const resources: Array<{ serverName: string; uri: string; name: string; description: string }> = [];

    for (const [serverName, server] of this.servers) {
      if (this.isServerConfigured(serverName)) {
        for (const resource of server.resources) {
          resources.push({
            serverName,
            uri: resource.uri,
            name: resource.name,
            description: resource.description || ''
          });
        }
      }
    }

    return resources;
  }

  private validateInput(schema: any, params: any): void {
    // Basic validation - in a real implementation, use a proper JSON schema validator
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in params)) {
          throw new Error(`Required field '${requiredField}' is missing`);
        }
      }
    }
  }

  private logToolUsage(serverName: string, toolName: string, _params: any, result: MCPToolResult): void {
    // Update usage statistics
    this.usageStats.totalCalls++;
    this.usageStats.lastUsed = new Date();

    // Track by server
    const serverCalls = this.usageStats.byServer.get(serverName) || 0;
    this.usageStats.byServer.set(serverName, serverCalls + 1);

    // Track by tool
    const toolKey = `${serverName}.${toolName}`;
    const toolCalls = this.usageStats.byTool.get(toolKey) || 0;
    this.usageStats.byTool.set(toolKey, toolCalls + 1);

    // Track errors
    if (result.isError) {
      this.usageStats.errors++;
    }

    // Log tool usage for debugging
    const logEntry = {
      timestamp: new Date().toISOString(),
      serverName,
      toolName,
      success: !result.isError,
      error: result.isError ? result.content[0]?.text : undefined
    };

    console.log('MCP Tool Usage:', logEntry);
  }

  // Get usage statistics
  getUsageStats(): any {
    return {
      totalCalls: this.usageStats.totalCalls,
      byServer: Object.fromEntries(this.usageStats.byServer),
      byTool: Object.fromEntries(this.usageStats.byTool),
      errors: this.usageStats.errors,
      lastUsed: this.usageStats.lastUsed,
      errorRate: this.usageStats.totalCalls > 0 ? (this.usageStats.errors / this.usageStats.totalCalls) * 100 : 0
    };
  }

  // Clear all configurations (for testing or reset)
  clearAllConfigurations(): void {
    this.configurations.clear();
    console.log('All MCP server configurations cleared');
  }

  // Export configuration for backup
  exportConfiguration(): any {
    const config: any = {};
    for (const [serverName, _serverConfig] of this.configurations) {
      // Don't export sensitive data like API keys in plain text
      config[serverName] = {
        configured: true,
        // Only export non-sensitive configuration
      };
    }
    return config;
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry();