// Dedicated AI Service - Handles AI model interactions
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// AI Chat endpoint
app.post('/ai/chat', async (req, res) => {
  try {
    const { provider, model, messages, options = {} } = req.body;

    // Validate request
    if (!provider || !model || !messages) {
      return res.status(400).json({
        error: 'Missing required fields: provider, model, messages'
      });
    }

    console.log(`AI Request: ${provider}/${model} - ${messages.length} messages`);

    // Route to appropriate AI provider
    let response;
    switch (provider) {
      case 'openai':
        response = await handleOpenAI(model, messages, options);
        break;
      case 'anthropic':
        response = await handleAnthropic(model, messages, options);
        break;
      case 'ollama':
        response = await handleOllama(model, messages, options);
        break;
      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    res.json(response);

  } catch (error) {
    console.error('AI Service Error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: error.message,
      provider,
      model
    });
  }
});

// OpenAI handler
async function handleOpenAI(model, messages, options) {
  const OpenAI = require('openai');

  const client = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY
  });

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7,
    stream: false
  });

  return {
    content: response.choices[0]?.message?.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0
    },
    model: response.model,
    provider: 'openai',
    success: true
  };
}

// Anthropic handler
async function handleAnthropic(model, messages, options) {
  const Anthropic = require('@anthropic-ai/sdk');

  const client = new Anthropic({
    apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY
  });

  // Convert messages for Anthropic format
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const params = {
    model,
    messages: conversationMessages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7
  };

  if (systemMessage) {
    params.system = systemMessage.content;
  }

  const response = await client.messages.create(params);

  return {
    content: response.content[0]?.text || '',
    usage: {
      promptTokens: response.usage?.input_tokens || 0,
      completionTokens: response.usage?.output_tokens || 0,
      totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    },
    model: response.model,
    provider: 'anthropic',
    success: true
  };
}

// Ollama handler (local AI models)
async function handleOllama(model, messages, options) {
  const fetch = require('node-fetch');

  const ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434';

  // Convert messages to Ollama format
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 4096
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    content: data.response || '',
    usage: {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
    },
    model: data.model || model,
    provider: 'ollama',
    success: true
  };
}

// Code completion endpoint
app.post('/ai/completion', async (req, res) => {
  try {
    const { code, language, position, context } = req.body;

    // Simple code completion logic
    const suggestions = await generateCodeCompletions(code, language, position, context);

    res.json({
      completions: suggestions,
      success: true
    });

  } catch (error) {
    console.error('Code completion error:', error);
    res.status(500).json({
      error: 'Code completion error',
      message: error.message
    });
  }
});

async function generateCodeCompletions(code, language, position, context) {
  // Simple completion logic - in production, use a proper code model
  const completions = [];

  // Common completions based on language
  const languageCompletions = {
    javascript: ['console.log(', 'function ', 'const ', 'let ', 'var ', 'if (', 'for ('],
    python: ['print(', 'def ', 'class ', 'import ', 'from ', 'if ', 'for '],
    typescript: ['console.log(', 'function ', 'const ', 'let ', 'interface ', 'type ', 'class ']
  };

  const suggestions = languageCompletions[language] || languageCompletions.javascript;

  suggestions.forEach((suggestion, index) => {
    completions.push({
      text: suggestion,
      confidence: 0.9 - (index * 0.1),
      type: 'keyword'
    });
  });

  return completions.slice(0, 5); // Return top 5 suggestions
}

// Model management endpoints
app.get('/ai/models/:provider', async (req, res) => {
  const { provider } = req.params;

  try {
    let models = [];

    switch (provider) {
      case 'ollama':
        const fetch = require('node-fetch');
        const ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434';
        const response = await fetch(`${ollamaUrl}/api/tags`);
        const data = await response.json();
        models = data.models || [];
        break;

      case 'openai':
        models = [
          { name: 'gpt-4o', size: 'large' },
          { name: 'gpt-4o-mini', size: 'small' },
          { name: 'gpt-3.5-turbo', size: 'medium' }
        ];
        break;

      case 'anthropic':
        models = [
          { name: 'claude-3-5-sonnet-20241022', size: 'large' },
          { name: 'claude-3-5-haiku-20241022', size: 'small' }
        ];
        break;
    }

    res.json({ provider, models, success: true });

  } catch (error) {
    console.error(`Error fetching ${provider} models:`, error);
    res.status(500).json({
      error: `Failed to fetch ${provider} models`,
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧠 AI Chat: http://localhost:${PORT}/ai/chat`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 AI Service shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 AI Service shutting down gracefully...');
  process.exit(0);
});