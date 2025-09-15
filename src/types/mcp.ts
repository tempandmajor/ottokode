// Model Context Protocol (MCP) Types
// Based on the MCP specification for connecting AI assistants to data sources

export interface MCPServer {
  name: string;
  description: string;
  version: string;
  author?: string;
  capabilities: MCPCapabilities;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  logging?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (params: any) => Promise<MCPToolResult>;
}

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Third-party service integrations
export interface StripeServer extends MCPServer {
  name: 'stripe';
  capabilities: MCPCapabilities & {
    payments: boolean;
    customers: boolean;
    subscriptions: boolean;
  };
}

export interface SupabaseServer extends MCPServer {
  name: 'supabase';
  capabilities: MCPCapabilities & {
    database: boolean;
    auth: boolean;
    storage: boolean;
    realtime: boolean;
  };
}

export interface VercelServer extends MCPServer {
  name: 'vercel';
  capabilities: MCPCapabilities & {
    deployments: boolean;
    domains: boolean;
    projects: boolean;
    analytics: boolean;
  };
}

// GitHub MCP Server
export interface GitHubServer extends MCPServer {
  name: 'github';
  capabilities: MCPCapabilities & {
    repositories: boolean;
    issues: boolean;
    pullRequests: boolean;
    actions: boolean;
  };
}

// Filesystem MCP Server
export interface FileSystemServer extends MCPServer {
  name: 'filesystem';
  capabilities: MCPCapabilities & {
    read: boolean;
    write: boolean;
    watch: boolean;
  };
}

// MCP Server Registry
export interface MCPServerRegistry {
  servers: Map<string, MCPServer>;
  register(server: MCPServer): void;
  unregister(name: string): void;
  get(name: string): MCPServer | undefined;
  list(): MCPServer[];
  executeTool(serverName: string, toolName: string, params: any): Promise<MCPToolResult>;
  getResource(serverName: string, uri: string): Promise<MCPContent>;
}

// MCP Configuration
export interface MCPConfig {
  servers: {
    [serverName: string]: {
      command: string;
      args?: string[];
      env?: Record<string, string>;
      enabled: boolean;
    };
  };
}

// AI Provider with MCP support
export interface AIProviderWithMCP {
  name: string;
  supportsMCP: boolean;
  mcpServers: string[];
  executeWithMCP(prompt: string, context: MCPContext): Promise<AIResponse>;
}

export interface MCPContext {
  availableTools: MCPTool[];
  availableResources: MCPResource[];
  selectedServers: string[];
}

export interface AIResponse {
  content: string;
  toolCalls?: MCPToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface MCPToolCall {
  serverName: string;
  toolName: string;
  parameters: any;
  result?: MCPToolResult;
}