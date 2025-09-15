// Plugin System - Extensible plugin architecture for AI IDE
import { EventEmitter } from '../../utils/EventEmitter';
import { readDir, readTextFile, exists } from '@tauri-apps/plugin-fs';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  icon?: string;
  main: string; // Entry point file
  engines: {
    'ai-ide': string; // Compatible IDE version
  };
  categories: PluginCategory[];
  permissions: PluginPermission[];
  activationEvents?: string[];
  contributes?: PluginContributions;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

export type PluginCategory =
  | 'themes'
  | 'languages'
  | 'debuggers'
  | 'formatters'
  | 'linters'
  | 'snippets'
  | 'keymaps'
  | 'ai-tools'
  | 'productivity'
  | 'utilities'
  | 'other';

export type PluginPermission =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:request'
  | 'shell:execute'
  | 'ai:access'
  | 'editor:modify'
  | 'settings:read'
  | 'settings:write'
  | 'clipboard:access';

export interface PluginContributions {
  commands?: PluginCommand[];
  menus?: PluginMenu[];
  keybindings?: PluginKeybinding[];
  languages?: PluginLanguage[];
  themes?: PluginTheme[];
  snippets?: PluginSnippet[];
  debuggers?: PluginDebugger[];
  views?: PluginView[];
  settings?: PluginSetting[];
}

export interface PluginCommand {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  enablement?: string; // When expression
}

export interface PluginMenu {
  command: string;
  when?: string;
  group?: string;
  alt?: string;
}

export interface PluginKeybinding {
  command: string;
  key: string;
  mac?: string;
  linux?: string;
  when?: string;
}

export interface PluginLanguage {
  id: string;
  aliases: string[];
  extensions: string[];
  configuration?: string;
  grammar?: string;
}

export interface PluginTheme {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface PluginSnippet {
  language: string;
  path: string;
}

export interface PluginDebugger {
  type: string;
  label: string;
  program: string;
  runtime?: string;
  configurationAttributes?: any;
}

export interface PluginView {
  id: string;
  name: string;
  when?: string;
  icon?: string;
  contextualTitle?: string;
}

export interface PluginSetting {
  properties: { [key: string]: any };
}

export interface Plugin {
  manifest: PluginManifest;
  path: string;
  isInstalled: boolean;
  isEnabled: boolean;
  isActive: boolean;
  version: string;
  installedAt: Date;
  updatedAt: Date;
  instance?: PluginInstance;
  errors?: string[];
}

export interface PluginInstance {
  activate(context: PluginContext): Promise<void> | void;
  deactivate?(): Promise<void> | void;
}

export interface PluginContext {
  extensionPath: string;
  globalState: PluginMemento;
  workspaceState: PluginMemento;
  subscriptions: PluginDisposable[];
  extensionUri: string;
  environmentVariableCollection?: any;
}

export interface PluginMemento {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: any): Promise<void>;
  keys(): readonly string[];
}

export interface PluginDisposable {
  dispose(): void;
}

export interface PluginMarketplaceEntry {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  publisher: string;
  icon: string;
  categories: PluginCategory[];
  tags: string[];
  rating: number;
  ratingCount: number;
  downloadCount: number;
  installs: number;
  lastUpdated: Date;
  verified: boolean;
  featured: boolean;
  repositoryUrl?: string;
  homepageUrl?: string;
  issuesUrl?: string;
  licenseUrl?: string;
  downloadUrl: string;
  size: number;
  dependencies: string[];
  engines: { [key: string]: string };
  changelog?: string;
  readme?: string;
  screenshots?: string[];
}

export class PluginManager extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();
  private pluginInstances = new Map<string, PluginInstance>();
  private marketplace: PluginMarketplaceEntry[] = [];
  // private pluginDirectory: string;

  constructor(_pluginDirectory: string = './plugins') {
    super();
    // this.pluginDirectory = pluginDirectory;
  }

  // Plugin lifecycle management
  async initializePluginSystem(): Promise<void> {
    try {
      await this.loadInstalledPlugins();
      await this.activateEnabledPlugins();
      await this.loadMarketplace();
      this.emit('pluginSystemInitialized');
    } catch (error) {
      console.error('Failed to initialize plugin system:', error);
      throw error;
    }
  }

  async loadInstalledPlugins(): Promise<void> {
    try {
      const pluginsDir = './plugins';
      const pluginDirExists = await exists(pluginsDir);

      if (!pluginDirExists) {
        console.log('Plugins directory does not exist, creating default plugins...');
        await this.createDefaultPlugins();
        return;
      }

      const entries = await readDir(pluginsDir);

      for (const entry of entries) {
        if (entry.isDirectory) {
          try {
            const plugin = await this.loadPlugin(`${pluginsDir}/${entry.name}`);
            if (plugin) {
              this.plugins.set(plugin.manifest.id, plugin);
            }
          } catch (error) {
            console.error(`Failed to load plugin from ${entry.name}:`, error);
          }
        }
      }

      this.emit('pluginsLoaded', Array.from(this.plugins.values()));
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
      // Fallback to creating default plugins if loading fails
      await this.createDefaultPlugins();
    }
  }

  private async loadPlugin(pluginPath: string): Promise<Plugin | null> {
    try {
      const manifestPath = `${pluginPath}/package.json`;
      const manifestExists = await exists(manifestPath);

      if (!manifestExists) {
        console.warn(`No package.json found in ${pluginPath}`);
        return null;
      }

      const manifestContent = await readTextFile(manifestPath);
      const packageJson = JSON.parse(manifestContent);

      // Convert package.json to our plugin manifest format
      const manifest: PluginManifest = {
        id: packageJson.name || 'unknown',
        name: packageJson.displayName || packageJson.name || 'Unknown Plugin',
        version: packageJson.version || '1.0.0',
        description: packageJson.description || '',
        author: packageJson.author || 'Unknown',
        homepage: packageJson.homepage,
        repository: packageJson.repository?.url,
        license: packageJson.license || 'MIT',
        keywords: packageJson.keywords || [],
        icon: packageJson.icon,
        main: packageJson.main || 'index.js',
        engines: packageJson.engines || { 'ai-ide': '^1.0.0' },
        categories: packageJson.categories || ['other'],
        permissions: packageJson.permissions || [],
        activationEvents: packageJson.activationEvents,
        contributes: packageJson.contributes,
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies
      };

      // Check if plugin is enabled (from settings)
      const isEnabled = this.getPluginSetting(manifest.id, 'enabled', true);

      const plugin: Plugin = {
        manifest,
        path: pluginPath,
        isInstalled: true,
        isEnabled,
        isActive: false,
        version: manifest.version,
        installedAt: new Date(), // Would be stored in plugin metadata
        updatedAt: new Date()
      };

      return plugin;
    } catch (error) {
      console.error(`Error loading plugin from ${pluginPath}:`, error);
      return null;
    }
  }

  private async createDefaultPlugins(): Promise<void> {
    // Create some basic built-in plugins to demonstrate functionality
    const builtinPlugins: Plugin[] = [
      {
        manifest: {
          id: 'ai-ide-core',
          name: 'AI IDE Core Features',
          version: '1.0.0',
          description: 'Core functionality for AI IDE',
          author: 'AI IDE Team',
          license: 'MIT',
          keywords: ['core', 'built-in'],
          main: 'core.js',
          engines: { 'ai-ide': '^1.0.0' },
          categories: ['utilities'],
          permissions: ['filesystem:read', 'filesystem:write', 'editor:modify'],
          contributes: {
            commands: [
              {
                command: 'core.formatDocument',
                title: 'Format Document',
                category: 'Core'
              }
            ]
          }
        },
        path: 'builtin://core',
        isInstalled: true,
        isEnabled: true,
        isActive: true,
        version: '1.0.0',
        installedAt: new Date(),
        updatedAt: new Date()
      }
    ];

    builtinPlugins.forEach(plugin => {
      this.plugins.set(plugin.manifest.id, plugin);
    });

    this.emit('pluginsLoaded', Array.from(this.plugins.values()));
  }

  private getPluginSetting(pluginId: string, key: string, defaultValue: any): any {
    // In a real implementation, this would read from persistent settings
    const settings = localStorage.getItem(`plugin.${pluginId}.${key}`);
    return settings ? JSON.parse(settings) : defaultValue;
  }

  async loadMarketplace(): Promise<void> {
    // Simulate marketplace data
    this.marketplace = [
      {
        id: 'python-syntax',
        name: 'python-syntax',
        displayName: 'Python Language Support',
        description: 'Comprehensive Python language support with IntelliSense, debugging, and more',
        version: '3.2.1',
        author: 'Python Foundation',
        publisher: 'python-org',
        icon: 'https://example.com/python-icon.png',
        categories: ['languages', 'debuggers'],
        tags: ['python', 'debugging', 'intellisense'],
        rating: 4.8,
        ratingCount: 12453,
        downloadCount: 2340000,
        installs: 1890000,
        lastUpdated: new Date('2024-01-20'),
        verified: true,
        featured: true,
        repositoryUrl: 'https://github.com/python/vscode-python',
        downloadUrl: 'https://marketplace.example.com/python-syntax-3.2.1.vsix',
        size: 15.2 * 1024 * 1024,
        dependencies: [],
        engines: { 'ai-ide': '^1.0.0' }
      },
      {
        id: 'vim-keymap',
        name: 'vim-keymap',
        displayName: 'Vim Keymap',
        description: 'Vim keybindings for AI IDE',
        version: '1.5.0',
        author: 'Vim Community',
        publisher: 'vim-team',
        icon: 'https://example.com/vim-icon.png',
        categories: ['keymaps'],
        tags: ['vim', 'keybindings', 'editor'],
        rating: 4.6,
        ratingCount: 8234,
        downloadCount: 890000,
        installs: 670000,
        lastUpdated: new Date('2024-01-18'),
        verified: true,
        featured: false,
        downloadUrl: 'https://marketplace.example.com/vim-keymap-1.5.0.vsix',
        size: 2.1 * 1024 * 1024,
        dependencies: [],
        engines: { 'ai-ide': '^1.0.0' }
      },
      {
        id: 'ai-copilot-plus',
        name: 'ai-copilot-plus',
        displayName: 'AI Copilot Plus',
        description: 'Enhanced AI code assistance with multiple model support',
        version: '2.0.3',
        author: 'AI Tools Inc',
        publisher: 'ai-tools',
        icon: 'https://example.com/copilot-icon.png',
        categories: ['ai-tools', 'productivity'],
        tags: ['ai', 'copilot', 'assistance', 'completion'],
        rating: 4.9,
        ratingCount: 15623,
        downloadCount: 3450000,
        installs: 2890000,
        lastUpdated: new Date('2024-01-22'),
        verified: true,
        featured: true,
        downloadUrl: 'https://marketplace.example.com/ai-copilot-plus-2.0.3.vsix',
        size: 25.8 * 1024 * 1024,
        dependencies: [],
        engines: { 'ai-ide': '^1.0.0' }
      },
      {
        id: 'git-lens-pro',
        name: 'git-lens-pro',
        displayName: 'GitLens Pro',
        description: 'Advanced Git capabilities with blame, history, and more',
        version: '4.1.2',
        author: 'GitKraken',
        publisher: 'gitkraken',
        icon: 'https://example.com/gitlens-icon.png',
        categories: ['utilities', 'productivity'],
        tags: ['git', 'version-control', 'blame', 'history'],
        rating: 4.7,
        ratingCount: 9876,
        downloadCount: 1560000,
        installs: 1230000,
        lastUpdated: new Date('2024-01-19'),
        verified: true,
        featured: false,
        downloadUrl: 'https://marketplace.example.com/git-lens-pro-4.1.2.vsix',
        size: 8.4 * 1024 * 1024,
        dependencies: [],
        engines: { 'ai-ide': '^1.0.0' }
      },
      {
        id: 'rainbow-brackets',
        name: 'rainbow-brackets',
        displayName: 'Rainbow Brackets',
        description: 'Colorize matching brackets for better code readability',
        version: '1.3.0',
        author: 'Community',
        publisher: 'community-themes',
        icon: 'https://example.com/rainbow-icon.png',
        categories: ['themes', 'utilities'],
        tags: ['brackets', 'colors', 'readability'],
        rating: 4.4,
        ratingCount: 5234,
        downloadCount: 780000,
        installs: 620000,
        lastUpdated: new Date('2024-01-15'),
        verified: false,
        featured: false,
        downloadUrl: 'https://marketplace.example.com/rainbow-brackets-1.3.0.vsix',
        size: 1.2 * 1024 * 1024,
        dependencies: [],
        engines: { 'ai-ide': '^1.0.0' }
      }
    ];

    this.emit('marketplaceLoaded', this.marketplace);
  }

  async activateEnabledPlugins(): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values()).filter(p => p.isEnabled);

    for (const plugin of enabledPlugins) {
      try {
        await this.activatePlugin(plugin.manifest.id);
      } catch (error) {
        console.error(`Failed to activate plugin ${plugin.manifest.id}:`, error);
        plugin.errors = plugin.errors || [];
        plugin.errors.push(`Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async activatePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.isActive) {
      return true; // Already active
    }

    try {
      // In a real implementation, this would load and execute the plugin
      // For now, we'll simulate plugin activation
      await this.simulatePluginActivation(plugin);

      plugin.isActive = true;
      this.activePlugins.add(pluginId);

      this.emit('pluginActivated', plugin);
      return true;
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async deactivatePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.isActive) {
      return true; // Already inactive
    }

    try {
      const instance = this.pluginInstances.get(pluginId);
      if (instance && instance.deactivate) {
        await instance.deactivate();
      }

      plugin.isActive = false;
      this.activePlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);

      this.emit('pluginDeactivated', plugin);
      return true;
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.isEnabled = true;
    await this.activatePlugin(pluginId);

    this.emit('pluginEnabled', plugin);
    return true;
  }

  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    await this.deactivatePlugin(pluginId);
    plugin.isEnabled = false;

    this.emit('pluginDisabled', plugin);
    return true;
  }

  // Plugin installation and management
  async installPlugin(pluginId: string): Promise<boolean> {
    const marketplaceEntry = this.marketplace.find(p => p.id === pluginId);
    if (!marketplaceEntry) {
      throw new Error(`Plugin ${pluginId} not found in marketplace`);
    }

    try {
      // Simulate plugin installation
      await this.simulatePluginInstallation(marketplaceEntry);

      const plugin: Plugin = {
        manifest: {
          id: marketplaceEntry.id,
          name: marketplaceEntry.displayName,
          version: marketplaceEntry.version,
          description: marketplaceEntry.description,
          author: marketplaceEntry.author,
          license: 'MIT',
          keywords: marketplaceEntry.tags,
          main: 'index.js',
          engines: { 'ai-ide': '^1.0.0', ...marketplaceEntry.engines },
          categories: marketplaceEntry.categories,
          permissions: []
        },
        path: `/plugins/${marketplaceEntry.id}`,
        isInstalled: true,
        isEnabled: true,
        isActive: false,
        version: marketplaceEntry.version,
        installedAt: new Date(),
        updatedAt: new Date()
      };

      this.plugins.set(pluginId, plugin);
      await this.activatePlugin(pluginId);

      this.emit('pluginInstalled', plugin);
      return true;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await this.deactivatePlugin(pluginId);
      this.plugins.delete(pluginId);

      // In a real implementation, this would delete plugin files
      await this.simulatePluginUninstallation(plugin);

      this.emit('pluginUninstalled', plugin);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async updatePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    const marketplaceEntry = this.marketplace.find(p => p.id === pluginId);

    if (!plugin || !marketplaceEntry) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.version === marketplaceEntry.version) {
      return true; // Already up to date
    }

    try {
      await this.deactivatePlugin(pluginId);

      // Simulate update
      await this.simulatePluginUpdate(plugin, marketplaceEntry);

      plugin.version = marketplaceEntry.version;
      plugin.manifest.version = marketplaceEntry.version;
      plugin.updatedAt = new Date();

      if (plugin.isEnabled) {
        await this.activatePlugin(pluginId);
      }

      this.emit('pluginUpdated', plugin);
      return true;
    } catch (error) {
      console.error(`Failed to update plugin ${pluginId}:`, error);
      throw error;
    }
  }

  // Marketplace operations
  async searchMarketplace(query: string, category?: PluginCategory): Promise<PluginMarketplaceEntry[]> {
    let results = this.marketplace;

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(plugin =>
        plugin.displayName.toLowerCase().includes(lowercaseQuery) ||
        plugin.description.toLowerCase().includes(lowercaseQuery) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    }

    if (category) {
      results = results.filter(plugin => plugin.categories.includes(category));
    }

    return results.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  async getFeaturedPlugins(): Promise<PluginMarketplaceEntry[]> {
    return this.marketplace
      .filter(plugin => plugin.featured)
      .sort((a, b) => b.rating - a.rating);
  }

  async getPopularPlugins(): Promise<PluginMarketplaceEntry[]> {
    return this.marketplace
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 10);
  }

  async getRecentlyUpdatedPlugins(): Promise<PluginMarketplaceEntry[]> {
    return this.marketplace
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .slice(0, 10);
  }

  // Simulation methods (would be real implementations in production)
  private async simulatePluginActivation(plugin: Plugin): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Activated plugin: ${plugin.manifest.name}`);
        resolve();
      }, 100);
    });
  }

  private async simulatePluginInstallation(entry: PluginMarketplaceEntry): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Installed plugin: ${entry.displayName}`);
        resolve();
      }, 2000);
    });
  }

  private async simulatePluginUninstallation(plugin: Plugin): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Uninstalled plugin: ${plugin.manifest.name}`);
        resolve();
      }, 1000);
    });
  }

  private async simulatePluginUpdate(plugin: Plugin, entry: PluginMarketplaceEntry): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Updated plugin: ${plugin.manifest.name} to ${entry.version}`);
        resolve();
      }, 3000);
    });
  }

  // Public getters
  getInstalledPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.isActive);
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.isEnabled);
  }

  getMarketplace(): PluginMarketplaceEntry[] {
    return [...this.marketplace];
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  hasUpdatesAvailable(): boolean {
    return Array.from(this.plugins.values()).some(plugin => {
      const marketplaceEntry = this.marketplace.find(p => p.id === plugin.manifest.id);
      return marketplaceEntry && marketplaceEntry.version !== plugin.version;
    });
  }

  getUpdatesAvailable(): Array<{ plugin: Plugin; newVersion: string }> {
    const updates: Array<{ plugin: Plugin; newVersion: string }> = [];

    Array.from(this.plugins.values()).forEach(plugin => {
      const marketplaceEntry = this.marketplace.find(p => p.id === plugin.manifest.id);
      if (marketplaceEntry && marketplaceEntry.version !== plugin.version) {
        updates.push({ plugin, newVersion: marketplaceEntry.version });
      }
    });

    return updates;
  }
}

// Singleton instance
export const pluginManager = new PluginManager();