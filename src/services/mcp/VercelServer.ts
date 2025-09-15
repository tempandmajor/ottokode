import { MCPServer, MCPTool, MCPResource, MCPToolResult } from '../../types/mcp';

export class VercelServer implements MCPServer {
  name = 'vercel';
  description = 'Vercel deployment and project management integration';
  version = '1.0.0';
  author = 'AI Code IDE';
  
  capabilities = {
    tools: true,
    resources: true,
    prompts: true,
    deployments: true,
    domains: true,
    projects: true,
    analytics: true,
  };

  private apiToken: string = '';
  private teamId: string = '';
  private baseUrl = 'https://api.vercel.com';

  constructor(config?: { apiToken: string; teamId?: string }) {
    if (config) {
      this.apiToken = config.apiToken;
      this.teamId = config.teamId || '';
    }
  }

  tools: MCPTool[] = [
    {
      name: 'list_projects',
      description: 'List all projects in the account or team',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of projects to return' },
          search: { type: 'string', description: 'Search projects by name' }
        }
      },
      handler: this.listProjects.bind(this)
    },
    {
      name: 'get_project',
      description: 'Get detailed information about a specific project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID or name' }
        },
        required: ['project_id']
      },
      handler: this.getProject.bind(this)
    },
    {
      name: 'create_deployment',
      description: 'Create a new deployment',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Deployment name' },
          files: { type: 'array', description: 'Files to deploy' },
          project_settings: { type: 'object', description: 'Project configuration' },
          target: { type: 'string', description: 'Deployment target (production/preview)' }
        },
        required: ['name', 'files']
      },
      handler: this.createDeployment.bind(this)
    },
    {
      name: 'list_deployments',
      description: 'List deployments for a project or account',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID to filter by' },
          limit: { type: 'number', description: 'Number of deployments to return' },
          state: { type: 'string', description: 'Filter by deployment state' }
        }
      },
      handler: this.listDeployments.bind(this)
    },
    {
      name: 'get_deployment',
      description: 'Get detailed information about a specific deployment',
      inputSchema: {
        type: 'object',
        properties: {
          deployment_id: { type: 'string', description: 'Deployment ID' }
        },
        required: ['deployment_id']
      },
      handler: this.getDeployment.bind(this)
    },
    {
      name: 'cancel_deployment',
      description: 'Cancel a running deployment',
      inputSchema: {
        type: 'object',
        properties: {
          deployment_id: { type: 'string', description: 'Deployment ID' }
        },
        required: ['deployment_id']
      },
      handler: this.cancelDeployment.bind(this)
    },
    {
      name: 'list_domains',
      description: 'List all domains in the account or team',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of domains to return' }
        }
      },
      handler: this.listDomains.bind(this)
    },
    {
      name: 'add_domain',
      description: 'Add a domain to a project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Domain name' },
          project_id: { type: 'string', description: 'Project ID' }
        },
        required: ['name', 'project_id']
      },
      handler: this.addDomain.bind(this)
    },
    {
      name: 'get_analytics',
      description: 'Get analytics data for a project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          from: { type: 'string', description: 'Start date (ISO format)' },
          to: { type: 'string', description: 'End date (ISO format)' }
        },
        required: ['project_id']
      },
      handler: this.getAnalytics.bind(this)
    },
    {
      name: 'create_env_variable',
      description: 'Create or update environment variable',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          key: { type: 'string', description: 'Variable key' },
          value: { type: 'string', description: 'Variable value' },
          target: { type: 'array', description: 'Targets (production, preview, development)' }
        },
        required: ['project_id', 'key', 'value']
      },
      handler: this.createEnvVariable.bind(this)
    }
  ];

  resources: MCPResource[] = [
    {
      uri: 'vercel://projects',
      name: 'Projects',
      description: 'List of Vercel projects',
      mimeType: 'application/json'
    },
    {
      uri: 'vercel://deployments',
      name: 'Deployments',
      description: 'Recent deployments',
      mimeType: 'application/json'
    },
    {
      uri: 'vercel://domains',
      name: 'Domains',
      description: 'Configured domains',
      mimeType: 'application/json'
    },
    {
      uri: 'vercel://analytics',
      name: 'Analytics',
      description: 'Project analytics data',
      mimeType: 'application/json'
    }
  ];

  private async makeVercelRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    if (!this.apiToken) {
      throw new Error('Vercel API token not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };

    if (this.teamId) {
      headers['X-Vercel-Team-Id'] = this.teamId;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Vercel API error: ${error.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to make Vercel request: ${error}`);
    }
  }

  async listProjects(params: any): Promise<MCPToolResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);

      const endpoint = `/v9/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeVercelRequest(endpoint);

      const projectList = response.projects.map((project: any) => 
        `Name: ${project.name} | ID: ${project.id} | Framework: ${project.framework || 'N/A'} | Created: ${new Date(project.createdAt).toLocaleDateString()} | URL: https://${project.name}.vercel.app`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${response.projects.length} projects:\n\n${projectList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing projects: ${error}`
        }],
        isError: true
      };
    }
  }

  async getProject(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = `/v9/projects/${params.project_id}`;
      const project = await this.makeVercelRequest(endpoint);

      return {
        content: [{
          type: 'text',
          text: `Project Details:
Name: ${project.name}
ID: ${project.id}
Framework: ${project.framework || 'N/A'}
Created: ${new Date(project.createdAt).toLocaleString()}
Updated: ${new Date(project.updatedAt).toLocaleString()}
Public: ${project.publicSource ? 'Yes' : 'No'}
Repository: ${project.link?.repo || 'N/A'}
Production Domain: ${project.alias?.[0] || 'N/A'}
Environment Variables: ${project.env?.length || 0} configured`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting project: ${error}`
        }],
        isError: true
      };
    }
  }

  async createDeployment(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = '/v13/deployments';
      const deploymentData = {
        name: params.name,
        files: params.files,
        projectSettings: params.project_settings,
        target: params.target || 'preview'
      };

      const deployment = await this.makeVercelRequest(endpoint, 'POST', deploymentData);

      return {
        content: [{
          type: 'text',
          text: `Deployment created successfully:
ID: ${deployment.id}
URL: ${deployment.url}
State: ${deployment.readyState}
Target: ${deployment.target}
Created: ${new Date(deployment.createdAt).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating deployment: ${error}`
        }],
        isError: true
      };
    }
  }

  async listDeployments(params: any): Promise<MCPToolResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.project_id) queryParams.append('projectId', params.project_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.state) queryParams.append('state', params.state);

      const endpoint = `/v6/deployments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeVercelRequest(endpoint);

      const deploymentList = response.deployments.map((deployment: any) => 
        `ID: ${deployment.uid} | URL: ${deployment.url} | State: ${deployment.state} | Created: ${new Date(deployment.createdAt).toLocaleDateString()} | Target: ${deployment.target}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${response.deployments.length} deployments:\n\n${deploymentList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing deployments: ${error}`
        }],
        isError: true
      };
    }
  }

  async getDeployment(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = `/v13/deployments/${params.deployment_id}`;
      const deployment = await this.makeVercelRequest(endpoint);

      return {
        content: [{
          type: 'text',
          text: `Deployment Details:
ID: ${deployment.uid}
URL: ${deployment.url}
State: ${deployment.state}
Target: ${deployment.target}
Created: ${new Date(deployment.createdAt).toLocaleString()}
Build Time: ${deployment.buildingAt ? Math.round((new Date(deployment.readyAt || Date.now()).getTime() - new Date(deployment.buildingAt).getTime()) / 1000) + 's' : 'N/A'}
Creator: ${deployment.creator?.username || 'N/A'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting deployment: ${error}`
        }],
        isError: true
      };
    }
  }

  async cancelDeployment(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = `/v12/deployments/${params.deployment_id}/cancel`;
      await this.makeVercelRequest(endpoint, 'PATCH');

      return {
        content: [{
          type: 'text',
          text: `Deployment ${params.deployment_id} cancelled successfully`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error cancelling deployment: ${error}`
        }],
        isError: true
      };
    }
  }

  async listDomains(params: any): Promise<MCPToolResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/v5/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeVercelRequest(endpoint);

      const domainList = response.domains.map((domain: any) => 
        `Name: ${domain.name} | Verified: ${domain.verified ? 'Yes' : 'No'} | Created: ${new Date(domain.createdAt).toLocaleDateString()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${response.domains.length} domains:\n\n${domainList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing domains: ${error}`
        }],
        isError: true
      };
    }
  }

  async addDomain(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = '/v9/projects/' + params.project_id + '/domains';
      const domainData = {
        name: params.name
      };

      const domain = await this.makeVercelRequest(endpoint, 'POST', domainData);

      return {
        content: [{
          type: 'text',
          text: `Domain added successfully:
Name: ${domain.name}
Verified: ${domain.verified ? 'Yes' : 'No'}
Created: ${new Date(domain.createdAt).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error adding domain: ${error}`
        }],
        isError: true
      };
    }
  }

  async getAnalytics(params: any): Promise<MCPToolResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);

      const endpoint = `/v1/analytics/${params.project_id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const analytics = await this.makeVercelRequest(endpoint);

      return {
        content: [{
          type: 'text',
          text: `Analytics for project ${params.project_id}:
Page Views: ${analytics.pageViews || 'N/A'}
Unique Visitors: ${analytics.uniqueVisitors || 'N/A'}
Top Pages: ${analytics.topPages?.map((page: any) => page.page).join(', ') || 'N/A'}
Countries: ${analytics.countries?.map((country: any) => country.country).join(', ') || 'N/A'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting analytics: ${error}`
        }],
        isError: true
      };
    }
  }

  async createEnvVariable(params: any): Promise<MCPToolResult> {
    try {
      const endpoint = `/v9/projects/${params.project_id}/env`;
      const envData = {
        key: params.key,
        value: params.value,
        target: params.target || ['production', 'preview', 'development']
      };

      const envVar = await this.makeVercelRequest(endpoint, 'POST', envData);

      return {
        content: [{
          type: 'text',
          text: `Environment variable created:
Key: ${envVar.key}
Targets: ${envVar.target.join(', ')}
ID: ${envVar.id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating environment variable: ${error}`
        }],
        isError: true
      };
    }
  }

  configure(config: { apiToken: string; teamId?: string }): void {
    this.apiToken = config.apiToken;
    this.teamId = config.teamId || '';
  }

  isConfigured(): boolean {
    return !!this.apiToken;
  }
}