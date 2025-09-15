import { MCPServer, MCPTool, MCPResource, MCPToolResult } from '../../types/mcp';

export class StripeServer implements MCPServer {
  name = 'stripe';
  description = 'Stripe payment processing integration';
  version = '1.0.0';
  author = 'AI Code IDE';
  
  capabilities = {
    tools: true,
    resources: true,
    prompts: true,
    payments: true,
    customers: true,
    subscriptions: true,
  };

  private apiKey: string = '';
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  tools: MCPTool[] = [
    {
      name: 'create_customer',
      description: 'Create a new Stripe customer',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email' },
          name: { type: 'string', description: 'Customer name' },
          description: { type: 'string', description: 'Customer description' },
          metadata: { type: 'object', description: 'Additional metadata' }
        },
        required: ['email']
      },
      handler: this.createCustomer.bind(this)
    },
    {
      name: 'create_payment_intent',
      description: 'Create a payment intent for processing payments',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in cents' },
          currency: { type: 'string', description: 'Currency code (e.g., usd)' },
          customer: { type: 'string', description: 'Customer ID' },
          description: { type: 'string', description: 'Payment description' },
          metadata: { type: 'object', description: 'Additional metadata' }
        },
        required: ['amount', 'currency']
      },
      handler: this.createPaymentIntent.bind(this)
    },
    {
      name: 'create_subscription',
      description: 'Create a subscription for recurring payments',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          price: { type: 'string', description: 'Price ID' },
          quantity: { type: 'number', description: 'Quantity of items' },
          trial_period_days: { type: 'number', description: 'Trial period in days' }
        },
        required: ['customer', 'price']
      },
      handler: this.createSubscription.bind(this)
    },
    {
      name: 'list_customers',
      description: 'List customers with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of customers to return' },
          email: { type: 'string', description: 'Filter by email' },
          created: { type: 'object', description: 'Created date filters' }
        }
      },
      handler: this.listCustomers.bind(this)
    },
    {
      name: 'get_payment_intent',
      description: 'Retrieve a payment intent by ID',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' }
        },
        required: ['payment_intent_id']
      },
      handler: this.getPaymentIntent.bind(this)
    }
  ];

  resources: MCPResource[] = [
    {
      uri: 'stripe://customers',
      name: 'Customers',
      description: 'List of Stripe customers',
      mimeType: 'application/json'
    },
    {
      uri: 'stripe://payments',
      name: 'Payments',
      description: 'Recent payment transactions',
      mimeType: 'application/json'
    },
    {
      uri: 'stripe://subscriptions',
      name: 'Subscriptions',
      description: 'Active subscriptions',
      mimeType: 'application/json'
    }
  ];

  private async makeStripeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Stripe API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
      let body;
      if (data && method !== 'GET') {
        body = new URLSearchParams(data).toString();
      }

      const response = await fetch(url, {
        method,
        headers,
        body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to make Stripe request: ${error}`);
    }
  }

  async createCustomer(params: any): Promise<MCPToolResult> {
    try {
      const customer = await this.makeStripeRequest('/customers', 'POST', {
        email: params.email,
        name: params.name,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined
      });

      return {
        content: [{
          type: 'text',
          text: `Successfully created customer: ${customer.id}\nEmail: ${customer.email}\nName: ${customer.name}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating customer: ${error}`
        }],
        isError: true
      };
    }
  }

  async createPaymentIntent(params: any): Promise<MCPToolResult> {
    try {
      const paymentIntent = await this.makeStripeRequest('/payment_intents', 'POST', {
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined
      });

      return {
        content: [{
          type: 'text',
          text: `Successfully created payment intent: ${paymentIntent.id}\nAmount: $${params.amount / 100}\nStatus: ${paymentIntent.status}\nClient Secret: ${paymentIntent.client_secret}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating payment intent: ${error}`
        }],
        isError: true
      };
    }
  }

  async createSubscription(params: any): Promise<MCPToolResult> {
    try {
      const subscription = await this.makeStripeRequest('/subscriptions', 'POST', {
        customer: params.customer,
        items: [{ price: params.price, quantity: params.quantity || 1 }],
        trial_period_days: params.trial_period_days
      });

      return {
        content: [{
          type: 'text',
          text: `Successfully created subscription: ${subscription.id}\nCustomer: ${subscription.customer}\nStatus: ${subscription.status}\nCurrent period end: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating subscription: ${error}`
        }],
        isError: true
      };
    }
  }

  async listCustomers(params: any): Promise<MCPToolResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.email) queryParams.append('email', params.email);

      const customers = await this.makeStripeRequest(`/customers?${queryParams.toString()}`);

      const customerList = customers.data.map((customer: any) => 
        `ID: ${customer.id} | Email: ${customer.email} | Name: ${customer.name || 'N/A'} | Created: ${new Date(customer.created * 1000).toLocaleDateString()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${customers.data.length} customers:\n\n${customerList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing customers: ${error}`
        }],
        isError: true
      };
    }
  }

  async getPaymentIntent(params: any): Promise<MCPToolResult> {
    try {
      const paymentIntent = await this.makeStripeRequest(`/payment_intents/${params.payment_intent_id}`);

      return {
        content: [{
          type: 'text',
          text: `Payment Intent: ${paymentIntent.id}\nAmount: $${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}\nStatus: ${paymentIntent.status}\nCustomer: ${paymentIntent.customer || 'N/A'}\nDescription: ${paymentIntent.description || 'N/A'}\nCreated: ${new Date(paymentIntent.created * 1000).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error retrieving payment intent: ${error}`
        }],
        isError: true
      };
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}