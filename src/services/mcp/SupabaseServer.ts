import { MCPServer, MCPTool, MCPResource, MCPToolResult } from '../../types/mcp';

export class SupabaseServer implements MCPServer {
  name = 'supabase';
  description = 'Supabase database and backend services integration';
  version = '1.0.0';
  author = 'AI Code IDE';
  
  capabilities = {
    tools: true,
    resources: true,
    prompts: true,
    database: true,
    auth: true,
    storage: true,
    realtime: true,
  };

  private projectUrl: string = '';
  private anonKey: string = '';
  private serviceKey: string = '';

  constructor(config?: { projectUrl: string; anonKey: string; serviceKey?: string }) {
    if (config) {
      this.projectUrl = config.projectUrl;
      this.anonKey = config.anonKey;
      this.serviceKey = config.serviceKey || '';
    }
  }

  tools: MCPTool[] = [
    {
      name: 'query_table',
      description: 'Query data from a Supabase table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          select: { type: 'string', description: 'Columns to select (default: *)' },
          filter: { type: 'object', description: 'Filter conditions' },
          limit: { type: 'number', description: 'Number of rows to return' },
          order: { type: 'string', description: 'Order by column' }
        },
        required: ['table']
      },
      handler: this.queryTable.bind(this)
    },
    {
      name: 'insert_data',
      description: 'Insert data into a Supabase table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Data to insert' },
          returning: { type: 'string', description: 'Columns to return after insert' }
        },
        required: ['table', 'data']
      },
      handler: this.insertData.bind(this)
    },
    {
      name: 'update_data',
      description: 'Update data in a Supabase table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Data to update' },
          filter: { type: 'object', description: 'Filter conditions for update' },
          returning: { type: 'string', description: 'Columns to return after update' }
        },
        required: ['table', 'data', 'filter']
      },
      handler: this.updateData.bind(this)
    },
    {
      name: 'delete_data',
      description: 'Delete data from a Supabase table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filter: { type: 'object', description: 'Filter conditions for deletion' },
          returning: { type: 'string', description: 'Columns to return after delete' }
        },
        required: ['table', 'filter']
      },
      handler: this.deleteData.bind(this)
    },
    {
      name: 'get_schema',
      description: 'Get database schema information',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Specific table (optional)' }
        }
      },
      handler: this.getSchema.bind(this)
    },
    {
      name: 'create_user',
      description: 'Create a new user with Supabase Auth',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email' },
          password: { type: 'string', description: 'User password' },
          metadata: { type: 'object', description: 'Additional user metadata' }
        },
        required: ['email', 'password']
      },
      handler: this.createUser.bind(this)
    },
    {
      name: 'list_users',
      description: 'List users (requires service key)',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number' },
          per_page: { type: 'number', description: 'Users per page' }
        }
      },
      handler: this.listUsers.bind(this)
    },
    {
      name: 'upload_file',
      description: 'Upload file to Supabase Storage',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Storage bucket name' },
          path: { type: 'string', description: 'File path' },
          file: { type: 'string', description: 'File content (base64)' },
          content_type: { type: 'string', description: 'File content type' }
        },
        required: ['bucket', 'path', 'file']
      },
      handler: this.uploadFile.bind(this)
    },
    {
      name: 'list_files',
      description: 'List files in Supabase Storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Storage bucket name' },
          path: { type: 'string', description: 'Folder path (optional)' },
          limit: { type: 'number', description: 'Number of files to return' }
        },
        required: ['bucket']
      },
      handler: this.listFiles.bind(this)
    }
  ];

  resources: MCPResource[] = [
    {
      uri: 'supabase://tables',
      name: 'Database Tables',
      description: 'List of database tables and their schemas',
      mimeType: 'application/json'
    },
    {
      uri: 'supabase://users',
      name: 'Users',
      description: 'User authentication data',
      mimeType: 'application/json'
    },
    {
      uri: 'supabase://storage',
      name: 'Storage Buckets',
      description: 'File storage buckets and contents',
      mimeType: 'application/json'
    }
  ];

  private async makeSupabaseRequest(endpoint: string, method: string = 'GET', data?: any, useServiceKey: boolean = false): Promise<any> {
    if (!this.projectUrl || (!this.anonKey && !this.serviceKey)) {
      throw new Error('Supabase configuration not set');
    }

    const apiKey = useServiceKey && this.serviceKey ? this.serviceKey : this.anonKey;
    const url = `${this.projectUrl}/rest/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase API error: ${error}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to make Supabase request: ${error}`);
    }
  }

  async queryTable(params: any): Promise<MCPToolResult> {
    try {
      let endpoint = `/${params.table}`;
      const queryParams = new URLSearchParams();
      
      if (params.select) {
        queryParams.append('select', params.select);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params.order) {
        queryParams.append('order', params.order);
      }

      // Add filters
      if (params.filter) {
        Object.entries(params.filter).forEach(([key, value]) => {
          queryParams.append(key, `eq.${value}`);
        });
      }

      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }

      const data = await this.makeSupabaseRequest(endpoint);

      return {
        content: [{
          type: 'text',
          text: `Query results from table '${params.table}':\n\n${JSON.stringify(data, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error querying table: ${error}`
        }],
        isError: true
      };
    }
  }

  async insertData(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = `/${params.table}`;
      const data = await this.makeSupabaseRequest(endpoint, 'POST', params.data);

      return {
        content: [{
          type: 'text',
          text: `Successfully inserted data into '${params.table}':\n\n${JSON.stringify(data, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error inserting data: ${error}`
        }],
        isError: true
      };
    }
  }

  async updateData(params: any): Promise<MCPToolResult> {
    try {
      let endpoint = `/${params.table}`;
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.entries(params.filter).forEach(([key, value]) => {
        queryParams.append(key, `eq.${value}`);
      });

      endpoint += `?${queryParams.toString()}`;
      const data = await this.makeSupabaseRequest(endpoint, 'PATCH', params.data);

      return {
        content: [{
          type: 'text',
          text: `Successfully updated data in '${params.table}':\n\n${JSON.stringify(data, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating data: ${error}`
        }],
        isError: true
      };
    }
  }

  async deleteData(params: any): Promise<MCPToolResult> {
    try {
      let endpoint = `/${params.table}`;
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.entries(params.filter).forEach(([key, value]) => {
        queryParams.append(key, `eq.${value}`);
      });

      endpoint += `?${queryParams.toString()}`;
      const data = await this.makeSupabaseRequest(endpoint, 'DELETE');

      return {
        content: [{
          type: 'text',
          text: `Successfully deleted data from '${params.table}':\n\n${JSON.stringify(data, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting data: ${error}`
        }],
        isError: true
      };
    }
  }

  async getSchema(params: any): Promise<MCPToolResult> {
    try {
      // This would typically require introspection queries
      // For demo purposes, we'll show a simplified schema
      const schemaInfo = params.table 
        ? `Schema information for table '${params.table}' would be displayed here`
        : 'Database schema information would be displayed here';

      return {
        content: [{
          type: 'text',
          text: schemaInfo
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting schema: ${error}`
        }],
        isError: true
      };
    }
  }

  async createUser(params: any): Promise<MCPToolResult> {
    try {
      const authUrl = `${this.projectUrl}/auth/v1/admin/users`;
      const headers = {
        'apikey': this.serviceKey || this.anonKey,
        'Authorization': `Bearer ${this.serviceKey || this.anonKey}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(authUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          user_metadata: params.metadata || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Auth error: ${response.statusText}`);
      }

      const user = await response.json();

      return {
        content: [{
          type: 'text',
          text: `Successfully created user: ${user.email} (ID: ${user.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating user: ${error}`
        }],
        isError: true
      };
    }
  }

  async listUsers(_params: any): Promise<MCPToolResult> {
    try {
      if (!this.serviceKey) {
        throw new Error('Service key required for user management operations');
      }

      const authUrl = `${this.projectUrl}/auth/v1/admin/users`;
      const headers = {
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(authUrl, { headers });

      if (!response.ok) {
        throw new Error(`Auth error: ${response.statusText}`);
      }

      const result = await response.json();
      const users = result.users || [];

      const userList = users.map((user: any) => 
        `ID: ${user.id} | Email: ${user.email} | Created: ${new Date(user.created_at).toLocaleDateString()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${users.length} users:\n\n${userList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing users: ${error}`
        }],
        isError: true
      };
    }
  }

  async uploadFile(params: any): Promise<MCPToolResult> {
    try {
      const storageUrl = `${this.projectUrl}/storage/v1/object/${params.bucket}/${params.path}`;
      const headers = {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': params.content_type || 'application/octet-stream'
      };

      // Convert base64 to blob
      const fileData = atob(params.file);
      const blob = new Blob([fileData], { type: params.content_type });

      const response = await fetch(storageUrl, {
        method: 'POST',
        headers,
        body: blob
      });

      if (!response.ok) {
        throw new Error(`Storage error: ${response.statusText}`);
      }

      return {
        content: [{
          type: 'text',
          text: `Successfully uploaded file to ${params.bucket}/${params.path}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error uploading file: ${error}`
        }],
        isError: true
      };
    }
  }

  async listFiles(params: any): Promise<MCPToolResult> {
    try {
      const storageUrl = `${this.projectUrl}/storage/v1/object/list/${params.bucket}`;
      const headers = {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json'
      };

      const body = {
        prefix: params.path || '',
        limit: params.limit || 100
      };

      const response = await fetch(storageUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Storage error: ${response.statusText}`);
      }

      const files = await response.json();
      const fileList = files.map((file: any) => 
        `${file.name} (${file.metadata?.size || 'Unknown size'} bytes) - Modified: ${new Date(file.updated_at).toLocaleDateString()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Files in bucket '${params.bucket}':\n\n${fileList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing files: ${error}`
        }],
        isError: true
      };
    }
  }

  configure(config: { projectUrl: string; anonKey: string; serviceKey?: string }): void {
    this.projectUrl = config.projectUrl;
    this.anonKey = config.anonKey;
    this.serviceKey = config.serviceKey || '';
  }

  isConfigured(): boolean {
    return !!(this.projectUrl && this.anonKey);
  }
}