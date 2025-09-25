import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

export interface Command {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: CommandCategory;
  tags: string[];
  parameters: CommandParameter[];
  examples: CommandExample[];
  usage: CommandUsage;
  metadata: CommandMetadata;
  createdBy: string;
  teamId?: string;
  organizationId?: string;
  visibility: 'private' | 'team' | 'organization' | 'public';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CommandCategory =
  | 'code-generation'
  | 'code-review'
  | 'debugging'
  | 'testing'
  | 'documentation'
  | 'refactoring'
  | 'analysis'
  | 'deployment'
  | 'custom';

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'code' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface CommandExample {
  title: string;
  description: string;
  input: Record<string, any>;
  expectedOutput: string;
  context?: string;
}

export interface CommandUsage {
  totalExecutions: number;
  successfulExecutions: number;
  averageRating: number;
  lastUsed?: Date;
  popularityScore: number;
}

export interface CommandMetadata {
  aiModel?: string;
  estimatedTokens: number;
  executionTimeMs: number;
  language?: string;
  framework?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  version: string;
}

export interface CommandExecution {
  id: string;
  commandId: string;
  userId: string;
  teamId?: string;
  input: Record<string, any>;
  output: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tokens?: number;
  cost?: number;
  rating?: number;
  feedback?: string;
  error?: string;
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  template: string;
  parameters: CommandParameter[];
  examples: string[];
  tags: string[];
}

export class CommandLibrary {
  private commands: Map<string, Command> = new Map();
  private templates: Map<string, CommandTemplate> = new Map();
  private executionHistory: Map<string, CommandExecution[]> = new Map();

  constructor() {
    this.initializeLibrary();
  }

  private async initializeLibrary(): Promise<void> {
    await this.loadCommands();
    await this.loadTemplates();
    this.initializeBuiltInCommands();
  }

  private async loadCommands(): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('commands')
        .select('*')
        .or(`created_by.eq.${user.id},visibility.eq.public`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading commands:', error);
        return;
      }

      data.forEach(cmd => {
        this.commands.set(cmd.id, this.mapCommandData(cmd));
      });

    } catch (error) {
      console.error('Error initializing command library:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    // Load built-in command templates
    const builtInTemplates = this.getBuiltInTemplates();
    builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeBuiltInCommands(): void {
    const builtInCommands = [
      {
        name: 'Code Review',
        description: 'Perform a comprehensive code review with suggestions for improvement',
        prompt: `Please review the following code and provide feedback on:

1. Code quality and readability
2. Performance optimizations
3. Security considerations
4. Best practices adherence
5. Potential bugs or issues

Code to review:
\`\`\`{{language}}
{{code}}
\`\`\`

{{#if context}}
Additional context: {{context}}
{{/if}}

Please provide specific, actionable feedback with examples where appropriate.`,
        category: 'code-review' as CommandCategory,
        parameters: [
          {
            name: 'code',
            type: 'code' as const,
            description: 'The code to review',
            required: true
          },
          {
            name: 'language',
            type: 'string' as const,
            description: 'Programming language',
            required: true,
            validation: {
              options: ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust']
            }
          },
          {
            name: 'context',
            type: 'string' as const,
            description: 'Additional context about the code',
            required: false
          }
        ]
      },
      {
        name: 'Generate Tests',
        description: 'Generate comprehensive unit tests for the provided code',
        prompt: `Generate comprehensive unit tests for the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Requirements:
- Use {{testFramework}} testing framework
- Include edge cases and error scenarios
- Test all public methods/functions
- Mock external dependencies if needed
- Provide clear test descriptions
- Achieve {{coverage}}% code coverage

{{#if includeIntegrationTests}}
Also include integration tests where appropriate.
{{/if}}

Please provide complete, runnable test code with setup and teardown as needed.`,
        category: 'testing' as CommandCategory,
        parameters: [
          {
            name: 'code',
            type: 'code' as const,
            description: 'The code to generate tests for',
            required: true
          },
          {
            name: 'language',
            type: 'string' as const,
            description: 'Programming language',
            required: true
          },
          {
            name: 'testFramework',
            type: 'string' as const,
            description: 'Testing framework to use',
            required: true,
            defaultValue: 'jest'
          },
          {
            name: 'coverage',
            type: 'number' as const,
            description: 'Target code coverage percentage',
            required: false,
            defaultValue: 90,
            validation: { min: 50, max: 100 }
          },
          {
            name: 'includeIntegrationTests',
            type: 'boolean' as const,
            description: 'Include integration tests',
            required: false,
            defaultValue: false
          }
        ]
      },
      {
        name: 'Explain Code',
        description: 'Provide a detailed explanation of how the code works',
        prompt: `Please explain the following {{language}} code in detail:

\`\`\`{{language}}
{{code}}
\`\`\`

Please provide:
1. **Overview**: What does this code do?
2. **Step-by-step breakdown**: Explain each significant part
3. **Key concepts**: Important programming concepts used
4. **Inputs and outputs**: What goes in and what comes out
5. **Dependencies**: External libraries or modules used
6. **Complexity**: Time and space complexity if applicable

{{#if audience}}
Tailor the explanation for: {{audience}}
{{/if}}

Use clear, {{#if audience}}{{#if (eq audience "beginner")}}simple{{else}}technical{{/if}}{{else}}accessible{{/if}} language with examples where helpful.`,
        category: 'analysis' as CommandCategory,
        parameters: [
          {
            name: 'code',
            type: 'code' as const,
            description: 'The code to explain',
            required: true
          },
          {
            name: 'language',
            type: 'string' as const,
            description: 'Programming language',
            required: true
          },
          {
            name: 'audience',
            type: 'string' as const,
            description: 'Target audience level',
            required: false,
            validation: {
              options: ['beginner', 'intermediate', 'advanced', 'expert']
            }
          }
        ]
      }
    ];

    builtInCommands.forEach((cmdData, index) => {
      const command: Command = {
        id: `builtin-${index}`,
        name: cmdData.name,
        description: cmdData.description,
        prompt: cmdData.prompt,
        category: cmdData.category,
        tags: [cmdData.category, 'builtin'],
        parameters: cmdData.parameters,
        examples: [],
        usage: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageRating: 0,
          popularityScore: 0
        },
        metadata: {
          estimatedTokens: this.estimateTokens(cmdData.prompt),
          executionTimeMs: 5000,
          difficulty: 'intermediate',
          version: '1.0.0'
        },
        createdBy: 'system',
        visibility: 'public',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.commands.set(command.id, command);
    });
  }

  async createCommand(commandData: Partial<Command>): Promise<Command> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const command: Command = {
      id: uuidv4(),
      name: commandData.name!,
      description: commandData.description!,
      prompt: commandData.prompt!,
      category: commandData.category!,
      tags: commandData.tags || [],
      parameters: commandData.parameters || [],
      examples: commandData.examples || [],
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageRating: 0,
        popularityScore: 0
      },
      metadata: {
        estimatedTokens: this.estimateTokens(commandData.prompt!),
        executionTimeMs: 3000,
        difficulty: commandData.metadata?.difficulty || 'intermediate',
        version: '1.0.0',
        ...commandData.metadata
      },
      createdBy: user.id,
      teamId: commandData.teamId,
      organizationId: commandData.organizationId,
      visibility: commandData.visibility || 'private',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const { error } = await supabase
        .from('commands')
        .insert(this.mapCommandForDB(command));

      if (error) {
        throw error;
      }

      this.commands.set(command.id, command);
      return command;
    } catch (error) {
      console.error('Error creating command:', error);
      throw error;
    }
  }

  async updateCommand(commandId: string, updates: Partial<Command>): Promise<Command> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error('Command not found');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user || command.createdBy !== user.id) {
      throw new Error('Not authorized to update this command');
    }

    const updatedCommand = {
      ...command,
      ...updates,
      updatedAt: new Date()
    };

    if (updates.prompt) {
      updatedCommand.metadata.estimatedTokens = this.estimateTokens(updates.prompt);
    }

    try {
      const { error } = await supabase
        .from('commands')
        .update(this.mapCommandForDB(updatedCommand))
        .eq('id', commandId);

      if (error) {
        throw error;
      }

      this.commands.set(commandId, updatedCommand);
      return updatedCommand;
    } catch (error) {
      console.error('Error updating command:', error);
      throw error;
    }
  }

  async deleteCommand(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error('Command not found');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user || command.createdBy !== user.id) {
      throw new Error('Not authorized to delete this command');
    }

    try {
      const { error } = await supabase
        .from('commands')
        .update({ is_active: false })
        .eq('id', commandId);

      if (error) {
        throw error;
      }

      this.commands.delete(commandId);
    } catch (error) {
      console.error('Error deleting command:', error);
      throw error;
    }
  }

  async executeCommand(
    commandId: string,
    input: Record<string, any>,
    context?: any
  ): Promise<CommandExecution> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error('Command not found');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate input parameters
    this.validateInput(command.parameters, input);

    const execution: CommandExecution = {
      id: uuidv4(),
      commandId,
      userId: user.id,
      teamId: context?.teamId,
      input,
      output: '',
      status: 'pending',
      startTime: new Date()
    };

    try {
      execution.status = 'running';

      // Process the prompt template with input
      const processedPrompt = this.processPromptTemplate(command.prompt, input);

      // Execute with AI service (mock for now)
      const startTime = Date.now();
      const output = await this.executeWithAI(processedPrompt, command.metadata);
      const duration = Date.now() - startTime;

      execution.output = output;
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = duration;
      execution.tokens = this.estimateTokens(processedPrompt + output);

      // Update command usage statistics
      await this.updateCommandUsage(commandId, execution);

      // Store execution history
      await this.storeExecution(execution);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
      execution.duration = Date.now() - execution.startTime.getTime();

      await this.storeExecution(execution);
      throw error;
    }
  }

  getCommands(filters?: {
    category?: CommandCategory;
    tags?: string[];
    visibility?: Command['visibility'];
    createdBy?: string;
  }): Command[] {
    let commands = Array.from(this.commands.values());

    if (filters) {
      if (filters.category) {
        commands = commands.filter(cmd => cmd.category === filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        commands = commands.filter(cmd =>
          filters.tags!.some(tag => cmd.tags.includes(tag))
        );
      }

      if (filters.visibility) {
        commands = commands.filter(cmd => cmd.visibility === filters.visibility);
      }

      if (filters.createdBy) {
        commands = commands.filter(cmd => cmd.createdBy === filters.createdBy);
      }
    }

    // Sort by popularity score and last used
    return commands.sort((a, b) => {
      if (a.usage.popularityScore !== b.usage.popularityScore) {
        return b.usage.popularityScore - a.usage.popularityScore;
      }

      const aLastUsed = a.usage.lastUsed?.getTime() || 0;
      const bLastUsed = b.usage.lastUsed?.getTime() || 0;
      return bLastUsed - aLastUsed;
    });
  }

  getCommand(commandId: string): Command | undefined {
    return this.commands.get(commandId);
  }

  searchCommands(query: string): Command[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.commands.values()).filter(cmd =>
      cmd.name.toLowerCase().includes(queryLower) ||
      cmd.description.toLowerCase().includes(queryLower) ||
      cmd.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  getExecutionHistory(userId: string, limit: number = 50): CommandExecution[] {
    const history = this.executionHistory.get(userId) || [];
    return history
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async rateExecution(executionId: string, rating: number, feedback?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const { error } = await supabase
        .from('command_executions')
        .update({ rating, feedback })
        .eq('id', executionId);

      if (error) {
        throw error;
      }

      // Update command's average rating
      await this.updateCommandRating(executionId, rating);
    } catch (error) {
      console.error('Error rating execution:', error);
      throw error;
    }
  }

  getTemplates(category?: CommandCategory): CommandTemplate[] {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter(template => template.category === category);
    }

    return templates;
  }

  createCommandFromTemplate(templateId: string, customizations: Partial<Command>): Command {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      id: uuidv4(),
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      prompt: template.template,
      category: template.category,
      tags: customizations.tags || template.tags,
      parameters: template.parameters,
      examples: [],
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageRating: 0,
        popularityScore: 0
      },
      metadata: {
        estimatedTokens: this.estimateTokens(template.template),
        executionTimeMs: 3000,
        difficulty: 'intermediate',
        version: '1.0.0',
        ...customizations.metadata
      },
      createdBy: customizations.createdBy!,
      teamId: customizations.teamId,
      organizationId: customizations.organizationId,
      visibility: customizations.visibility || 'private',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Private helper methods

  private validateInput(parameters: CommandParameter[], input: Record<string, any>): void {
    for (const param of parameters) {
      if (param.required && !(param.name in input)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      if (param.name in input) {
        const value = input[param.name];

        // Type validation
        if (!this.validateParameterType(param.type, value)) {
          throw new Error(`Parameter '${param.name}' has invalid type. Expected ${param.type}`);
        }

        // Additional validation
        if (param.validation) {
          this.validateParameterConstraints(param, value);
        }
      }
    }
  }

  private validateParameterType(type: CommandParameter['type'], value: any): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'file':
      case 'code':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  private validateParameterConstraints(param: CommandParameter, value: any): void {
    const validation = param.validation!;

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter '${param.name}' does not match required pattern`);
      }
    }

    if (validation.min !== undefined && typeof value === 'number') {
      if (value < validation.min) {
        throw new Error(`Parameter '${param.name}' must be at least ${validation.min}`);
      }
    }

    if (validation.max !== undefined && typeof value === 'number') {
      if (value > validation.max) {
        throw new Error(`Parameter '${param.name}' must be at most ${validation.max}`);
      }
    }

    if (validation.options && !validation.options.includes(value)) {
      throw new Error(`Parameter '${param.name}' must be one of: ${validation.options.join(', ')}`);
    }
  }

  private processPromptTemplate(template: string, input: Record<string, any>): string {
    let processed = template;

    // Simple template processing - in production would use a proper template engine
    Object.entries(input).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(placeholder, String(value));
    });

    // Handle conditional blocks (simplified)
    processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return input[condition] ? content : '';
    });

    return processed;
  }

  private async executeWithAI(prompt: string, metadata: CommandMetadata): Promise<string> {
    // Mock AI execution - in production would call actual AI service
    await new Promise(resolve => setTimeout(resolve, metadata.executionTimeMs || 1000));

    return `AI response for prompt: ${prompt.substring(0, 100)}...

This is a mock response. In production, this would be the actual AI-generated output based on the processed prompt and the specified AI model.`;
  }

  private estimateTokens(text: string): number {
    // Rough token estimation - in production would use proper tokenization
    return Math.ceil(text.length / 4);
  }

  private async updateCommandUsage(commandId: string, execution: CommandExecution): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) return;

    command.usage.totalExecutions++;
    if (execution.status === 'completed') {
      command.usage.successfulExecutions++;
    }
    command.usage.lastUsed = execution.endTime || new Date();
    command.usage.popularityScore = this.calculatePopularityScore(command.usage);

    try {
      await supabase
        .from('commands')
        .update({
          usage_stats: command.usage,
          updated_at: new Date().toISOString()
        })
        .eq('id', commandId);
    } catch (error) {
      console.error('Error updating command usage:', error);
    }
  }

  private calculatePopularityScore(usage: CommandUsage): number {
    const successRate = usage.totalExecutions > 0 ? usage.successfulExecutions / usage.totalExecutions : 0;
    const recencyBoost = usage.lastUsed ? Math.max(0, 1 - (Date.now() - usage.lastUsed.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0;
    const ratingBoost = usage.averageRating > 0 ? usage.averageRating / 5 : 0.5;

    return Math.round((usage.totalExecutions * successRate * (1 + recencyBoost) * (1 + ratingBoost)) * 100) / 100;
  }

  private async storeExecution(execution: CommandExecution): Promise<void> {
    try {
      await supabase
        .from('command_executions')
        .insert({
          id: execution.id,
          command_id: execution.commandId,
          user_id: execution.userId,
          team_id: execution.teamId,
          input: execution.input,
          output: execution.output,
          status: execution.status,
          start_time: execution.startTime.toISOString(),
          end_time: execution.endTime?.toISOString(),
          duration: execution.duration,
          tokens: execution.tokens,
          cost: execution.cost,
          error: execution.error
        });

      // Store in local history for quick access
      if (!this.executionHistory.has(execution.userId)) {
        this.executionHistory.set(execution.userId, []);
      }
      this.executionHistory.get(execution.userId)!.push(execution);

    } catch (error) {
      console.error('Error storing execution:', error);
    }
  }

  private async updateCommandRating(executionId: string, rating: number): Promise<void> {
    try {
      // Get command ID from execution
      const { data: execution } = await supabase
        .from('command_executions')
        .select('command_id')
        .eq('id', executionId)
        .single();

      if (!execution) return;

      // Get all ratings for this command
      const { data: executions } = await supabase
        .from('command_executions')
        .select('rating')
        .eq('command_id', execution.command_id)
        .not('rating', 'is', null);

      if (executions) {
        const ratings = executions.map(e => e.rating).filter(r => r !== null);
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        // Update command's average rating
        const command = this.commands.get(execution.command_id);
        if (command) {
          command.usage.averageRating = averageRating;
          command.usage.popularityScore = this.calculatePopularityScore(command.usage);

          await supabase
            .from('commands')
            .update({
              usage_stats: command.usage,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.command_id);
        }
      }
    } catch (error) {
      console.error('Error updating command rating:', error);
    }
  }

  private mapCommandData(dbData: any): Command {
    return {
      id: dbData.id,
      name: dbData.name,
      description: dbData.description,
      prompt: dbData.prompt,
      category: dbData.category,
      tags: dbData.tags || [],
      parameters: dbData.parameters || [],
      examples: dbData.examples || [],
      usage: dbData.usage_stats || {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageRating: 0,
        popularityScore: 0
      },
      metadata: dbData.metadata || {
        estimatedTokens: 0,
        executionTimeMs: 3000,
        difficulty: 'intermediate',
        version: '1.0.0'
      },
      createdBy: dbData.created_by,
      teamId: dbData.team_id,
      organizationId: dbData.organization_id,
      visibility: dbData.visibility,
      isActive: dbData.is_active,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    };
  }

  private mapCommandForDB(command: Command): any {
    return {
      id: command.id,
      name: command.name,
      description: command.description,
      prompt: command.prompt,
      category: command.category,
      tags: command.tags,
      parameters: command.parameters,
      examples: command.examples,
      usage_stats: command.usage,
      metadata: command.metadata,
      created_by: command.createdBy,
      team_id: command.teamId,
      organization_id: command.organizationId,
      visibility: command.visibility,
      is_active: command.isActive,
      created_at: command.createdAt.toISOString(),
      updated_at: command.updatedAt.toISOString()
    };
  }

  private getBuiltInTemplates(): CommandTemplate[] {
    return [
      {
        id: 'code-review-template',
        name: 'Code Review Template',
        description: 'Template for code review commands',
        category: 'code-review',
        template: 'Review this {{language}} code: {{code}}',
        parameters: [
          { name: 'code', type: 'code', description: 'Code to review', required: true },
          { name: 'language', type: 'string', description: 'Programming language', required: true }
        ],
        examples: ['Review my JavaScript function', 'Check this Python class for issues'],
        tags: ['review', 'quality', 'feedback']
      },
      {
        id: 'test-generation-template',
        name: 'Test Generation Template',
        description: 'Template for test generation commands',
        category: 'testing',
        template: 'Generate {{testType}} tests for this {{language}} code: {{code}}',
        parameters: [
          { name: 'code', type: 'code', description: 'Code to test', required: true },
          { name: 'language', type: 'string', description: 'Programming language', required: true },
          { name: 'testType', type: 'string', description: 'Type of tests', required: false, defaultValue: 'unit' }
        ],
        examples: ['Generate unit tests for my function', 'Create integration tests'],
        tags: ['testing', 'automation', 'quality']
      }
    ];
  }
}

export const commandLibrary = new CommandLibrary();
export default CommandLibrary;