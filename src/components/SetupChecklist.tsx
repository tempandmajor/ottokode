import React, { useState, useEffect } from 'react';
import './SetupChecklist.css';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'essential' | 'ai' | 'deployment' | 'advanced';
  link?: string;
  instructions?: string[];
}

interface SetupChecklistProps {
  onClose: () => void;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({ onClose }) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    // Essential Setup
    {
      id: 'node-npm',
      title: 'Node.js & npm installed',
      description: 'Required for running the development environment',
      completed: false,
      category: 'essential',
      link: 'https://nodejs.org/',
      instructions: [
        'Download Node.js from nodejs.org',
        'Install the LTS version',
        'Verify installation: node --version && npm --version'
      ]
    },
    {
      id: 'git',
      title: 'Git version control',
      description: 'Essential for code management and collaboration',
      completed: false,
      category: 'essential',
      link: 'https://git-scm.com/',
      instructions: [
        'Download Git from git-scm.com',
        'Configure: git config --global user.name "Your Name"',
        'Configure: git config --global user.email "your@email.com"'
      ]
    },
    {
      id: 'workspace',
      title: 'Set up workspace folder',
      description: 'Organize your projects in a dedicated folder',
      completed: false,
      category: 'essential',
      instructions: [
        'Create a dedicated coding folder (e.g., ~/Projects)',
        'Set appropriate permissions',
        'Consider using version control for your workspace'
      ]
    },

    // AI Integration Setup
    {
      id: 'openai-api',
      title: 'OpenAI API Key',
      description: 'For GPT-4 and other OpenAI models',
      completed: false,
      category: 'ai',
      link: 'https://platform.openai.com/api-keys',
      instructions: [
        'Sign up at platform.openai.com',
        'Generate an API key',
        'Add billing information for usage',
        'Set usage limits to control costs'
      ]
    },
    {
      id: 'anthropic-api',
      title: 'Anthropic Claude API',
      description: 'For Claude models (Sonnet, Opus, Haiku)',
      completed: false,
      category: 'ai',
      link: 'https://console.anthropic.com/',
      instructions: [
        'Sign up at console.anthropic.com',
        'Request access to Claude API',
        'Generate API key when approved',
        'Review rate limits and pricing'
      ]
    },
    {
      id: 'google-ai',
      title: 'Google AI Studio',
      description: 'For Gemini models and Google AI services',
      completed: false,
      category: 'ai',
      link: 'https://aistudio.google.com/',
      instructions: [
        'Sign up at aistudio.google.com',
        'Enable Gemini API access',
        'Generate API key',
        'Configure usage quotas'
      ]
    },
    {
      id: 'ollama',
      title: 'Ollama (Local AI)',
      description: 'Run AI models locally for privacy',
      completed: false,
      category: 'ai',
      link: 'https://ollama.ai/',
      instructions: [
        'Download Ollama from ollama.ai',
        'Install the application',
        'Download a model: ollama pull codellama',
        'Test: ollama run codellama'
      ]
    },

    // MCP Servers Setup
    {
      id: 'mcp-filesystem',
      title: 'MCP Filesystem Server',
      description: 'Enhanced file operations and project management',
      completed: false,
      category: 'advanced',
      instructions: [
        'Install MCP filesystem server',
        'Configure file permissions',
        'Set up project root directories',
        'Test file operations'
      ]
    },
    {
      id: 'mcp-git',
      title: 'MCP Git Server',
      description: 'Advanced git operations and repository management',
      completed: false,
      category: 'advanced',
      instructions: [
        'Install MCP git server',
        'Configure git credentials',
        'Set up SSH keys for repositories',
        'Test repository operations'
      ]
    },

    // Deployment Platforms
    {
      id: 'vercel-account',
      title: 'Vercel Account',
      description: 'Deploy web applications instantly',
      completed: false,
      category: 'deployment',
      link: 'https://vercel.com/',
      instructions: [
        'Sign up at vercel.com',
        'Install Vercel CLI: npm i -g vercel',
        'Connect your GitHub account',
        'Deploy a test project'
      ]
    },
    {
      id: 'netlify-account',
      title: 'Netlify Account',
      description: 'Static site hosting and deployment',
      completed: false,
      category: 'deployment',
      link: 'https://netlify.com/',
      instructions: [
        'Sign up at netlify.com',
        'Install Netlify CLI: npm i -g netlify-cli',
        'Connect GitHub/GitLab account',
        'Test deployment workflow'
      ]
    },
    {
      id: 'railway-account',
      title: 'Railway Account',
      description: 'Deploy databases and backend services',
      completed: false,
      category: 'deployment',
      link: 'https://railway.app/',
      instructions: [
        'Sign up at railway.app',
        'Install Railway CLI',
        'Connect GitHub account',
        'Deploy a simple service'
      ]
    },
    {
      id: 'supabase-account',
      title: 'Supabase Account',
      description: 'PostgreSQL database and backend services',
      completed: false,
      category: 'deployment',
      link: 'https://supabase.com/',
      instructions: [
        'Sign up at supabase.com',
        'Create your first project',
        'Set up database schema',
        'Configure authentication'
      ]
    }
  ]);

  const [activeCategory, setActiveCategory] = useState<string>('essential');

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('setup-checklist-progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setItems(currentItems => 
          currentItems.map(item => ({
            ...item,
            completed: progress[item.id] || false
          }))
        );
      } catch (error) {
        console.error('Failed to load checklist progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (updatedItems: ChecklistItem[]) => {
    const progress = updatedItems.reduce((acc, item) => {
      acc[item.id] = item.completed;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('setup-checklist-progress', JSON.stringify(progress));
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updatedItems);
    saveProgress(updatedItems);
  };

  const categories = [
    { id: 'essential', name: 'Essential', color: '#ff4444' },
    { id: 'ai', name: 'AI APIs', color: '#4444ff' },
    { id: 'deployment', name: 'Deployment', color: '#44ff44' },
    { id: 'advanced', name: 'Advanced', color: '#ff8844' }
  ];

  const filteredItems = items.filter(item => item.category === activeCategory);
  const completedCount = filteredItems.filter(item => item.completed).length;
  const totalCount = filteredItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="setup-checklist">
      <div className="checklist-header">
        <h3>Setup Guide</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            style={{ borderColor: category.color }}
          >
            {category.name}
            <span className="category-count">
              {items.filter(item => item.category === category.id && item.completed).length}/
              {items.filter(item => item.category === category.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${progress}%`,
            backgroundColor: categories.find(c => c.id === activeCategory)?.color 
          }}
        />
        <span className="progress-text">{completedCount}/{totalCount} completed</span>
      </div>

      <div className="checklist-items">
        {filteredItems.map(item => (
          <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
            <div className="item-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="checkmark"></span>
                <div className="item-content">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </label>
              {item.link && (
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  🔗
                </a>
              )}
            </div>
            
            {item.instructions && (
              <div className="item-instructions">
                <h5>Steps:</h5>
                <ol>
                  {item.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="checklist-footer">
        <p>Complete these steps to get the most out of your AI IDE experience!</p>
        <p>Your progress is automatically saved.</p>
      </div>
    </div>
  );
};