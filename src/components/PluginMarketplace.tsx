import React, { useState, useEffect } from 'react';
import { pluginManager, Plugin, PluginMarketplaceEntry, PluginCategory } from '../services/plugins/PluginManager';
import './PluginMarketplace.css';

interface PluginMarketplaceProps {
  onClose: () => void;
}

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'updates'>('marketplace');
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [marketplacePlugins, setMarketplacePlugins] = useState<PluginMarketplaceEntry[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<PluginMarketplaceEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'updated' | 'name'>('downloads');
  const [isLoading, setIsLoading] = useState(false);
  const [updatesAvailable, setUpdatesAvailable] = useState<Array<{ plugin: Plugin; newVersion: string }>>([]);

  const categories: Array<{ id: PluginCategory | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'All', icon: '📦' },
    { id: 'themes', name: 'Themes', icon: '🎨' },
    { id: 'languages', name: 'Languages', icon: '💬' },
    { id: 'debuggers', name: 'Debuggers', icon: '🐛' },
    { id: 'formatters', name: 'Formatters', icon: '✨' },
    { id: 'linters', name: 'Linters', icon: '🔍' },
    { id: 'snippets', name: 'Snippets', icon: '📝' },
    { id: 'keymaps', name: 'Keymaps', icon: '⌨️' },
    { id: 'ai-tools', name: 'AI Tools', icon: '🤖' },
    { id: 'productivity', name: 'Productivity', icon: '⚡' },
    { id: 'utilities', name: 'Utilities', icon: '🔧' },
    { id: 'other', name: 'Other', icon: '📂' }
  ];

  useEffect(() => {
    initializePluginSystem();
    setupEventListeners();

    return () => {
      pluginManager.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    filterAndSortPlugins();
  }, [marketplacePlugins, searchQuery, selectedCategory, sortBy]);

  const initializePluginSystem = async () => {
    setIsLoading(true);
    try {
      await pluginManager.initializePluginSystem();
      loadData();
    } catch (error) {
      console.error('Failed to initialize plugin system:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    pluginManager.on('pluginInstalled', loadData);
    pluginManager.on('pluginUninstalled', loadData);
    pluginManager.on('pluginEnabled', loadData);
    pluginManager.on('pluginDisabled', loadData);
    pluginManager.on('pluginUpdated', loadData);
    pluginManager.on('pluginsLoaded', loadData);
    pluginManager.on('marketplaceLoaded', loadData);
  };

  const loadData = () => {
    setInstalledPlugins(pluginManager.getInstalledPlugins());
    setMarketplacePlugins(pluginManager.getMarketplace());
    setUpdatesAvailable(pluginManager.getUpdatesAvailable());
  };

  const filterAndSortPlugins = () => {
    let filtered = [...marketplacePlugins];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plugin =>
        plugin.displayName.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin =>
        plugin.categories.includes(selectedCategory as PluginCategory)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloadCount - a.downloadCount;
        case 'rating':
          return b.rating - a.rating;
        case 'updated':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });

    setFilteredPlugins(filtered);
  };

  const handleInstallPlugin = async (pluginId: string) => {
    setIsLoading(true);
    try {
      await pluginManager.installPlugin(pluginId);
    } catch (error) {
      console.error('Failed to install plugin:', error);
      alert(`Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      setIsLoading(true);
      try {
        await pluginManager.uninstallPlugin(pluginId);
      } catch (error) {
        console.error('Failed to uninstall plugin:', error);
        alert(`Failed to uninstall plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        await pluginManager.enablePlugin(pluginId);
      } else {
        await pluginManager.disablePlugin(pluginId);
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      alert(`Failed to toggle plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlugin = async (pluginId: string) => {
    setIsLoading(true);
    try {
      await pluginManager.updatePlugin(pluginId);
    } catch (error) {
      console.error('Failed to update plugin:', error);
      alert(`Failed to update plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAll = async () => {
    if (updatesAvailable.length === 0) return;

    setIsLoading(true);
    try {
      for (const update of updatesAvailable) {
        await pluginManager.updatePlugin(update.plugin.manifest.id);
      }
    } catch (error) {
      console.error('Failed to update plugins:', error);
      alert(`Failed to update plugins: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isPluginInstalled = (pluginId: string): boolean => {
    return installedPlugins.some(p => p.manifest.id === pluginId);
  };

  // const getInstalledPlugin = (pluginId: string): Plugin | undefined => {
  //   return installedPlugins.find(p => p.manifest.id === pluginId);
  // };

  const formatDownloadCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  };

  return (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h2>🔌 Extensions</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="marketplace-tabs">
        <button
          className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </button>
        <button
          className={`tab ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          Installed ({installedPlugins.length})
        </button>
        <button
          className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Updates ({updatesAvailable.length})
        </button>
      </div>

      <div className="marketplace-content">
        {activeTab === 'marketplace' && (
          <div className="marketplace-tab">
            <div className="marketplace-controls">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-section">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'all')}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="sort-select"
                >
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="plugins-grid">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner">🔄</div>
                  <p>Loading extensions...</p>
                </div>
              ) : filteredPlugins.length === 0 ? (
                <div className="empty-state">
                  <p>No extensions found matching your criteria.</p>
                </div>
              ) : (
                filteredPlugins.map(plugin => {
                  const installed = isPluginInstalled(plugin.id);
                  // const installedPlugin = getInstalledPlugin(plugin.id);

                  return (
                    <div key={plugin.id} className="plugin-card">
                      <div className="plugin-header">
                        <div className="plugin-icon">
                          {plugin.icon ? (
                            <img src={plugin.icon} alt={plugin.displayName} />
                          ) : (
                            <div className="default-icon">📦</div>
                          )}
                        </div>
                        <div className="plugin-info">
                          <h3 className="plugin-name">{plugin.displayName}</h3>
                          <div className="plugin-meta">
                            <span className="plugin-author">by {plugin.publisher}</span>
                            {plugin.verified && <span className="verified-badge">✅</span>}
                            {plugin.featured && <span className="featured-badge">⭐</span>}
                          </div>
                        </div>
                      </div>

                      <p className="plugin-description">{plugin.description}</p>

                      <div className="plugin-stats">
                        <div className="stat">
                          <span className="stat-label">Rating:</span>
                          <span className="stat-value">
                            {renderStars(plugin.rating)} ({plugin.ratingCount})
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Downloads:</span>
                          <span className="stat-value">{formatDownloadCount(plugin.downloadCount)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Size:</span>
                          <span className="stat-value">{formatFileSize(plugin.size)}</span>
                        </div>
                      </div>

                      <div className="plugin-tags">
                        {plugin.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        {plugin.tags.length > 3 && (
                          <span className="tag-more">+{plugin.tags.length - 3}</span>
                        )}
                      </div>

                      <div className="plugin-actions">
                        {installed ? (
                          <div className="installed-actions">
                            <span className="installed-label">✅ Installed</span>
                            <button
                              onClick={() => handleUninstallPlugin(plugin.id)}
                              className="uninstall-button"
                              disabled={isLoading}
                            >
                              Uninstall
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInstallPlugin(plugin.id)}
                            className="install-button"
                            disabled={isLoading}
                          >
                            Install
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="installed-tab">
            {installedPlugins.length === 0 ? (
              <div className="empty-state">
                <h3>No Extensions Installed</h3>
                <p>Browse the marketplace to discover and install extensions.</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="browse-button"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="installed-plugins">
                {installedPlugins.map(plugin => (
                  <div key={plugin.manifest.id} className="installed-plugin-card">
                    <div className="plugin-header">
                      <div className="plugin-info">
                        <h3 className="plugin-name">{plugin.manifest.name}</h3>
                        <div className="plugin-meta">
                          <span className="plugin-version">v{plugin.version}</span>
                          <span className="plugin-author">by {plugin.manifest.author}</span>
                        </div>
                      </div>
                      <div className="plugin-status">
                        {plugin.isActive && <span className="status-active">🟢 Active</span>}
                        {plugin.isEnabled && !plugin.isActive && <span className="status-enabled">🟡 Enabled</span>}
                        {!plugin.isEnabled && <span className="status-disabled">⚪ Disabled</span>}
                      </div>
                    </div>

                    <p className="plugin-description">{plugin.manifest.description}</p>

                    <div className="plugin-details">
                      <div className="detail">
                        <span className="detail-label">Categories:</span>
                        <span className="detail-value">
                          {plugin.manifest.categories.join(', ')}
                        </span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Installed:</span>
                        <span className="detail-value">
                          {plugin.installedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {plugin.errors && plugin.errors.length > 0 && (
                      <div className="plugin-errors">
                        <h4>⚠️ Errors:</h4>
                        <ul>
                          {plugin.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="plugin-actions">
                      <button
                        onClick={() => handleTogglePlugin(plugin.manifest.id, !plugin.isEnabled)}
                        className={`toggle-button ${plugin.isEnabled ? 'disable' : 'enable'}`}
                        disabled={isLoading}
                      >
                        {plugin.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleUninstallPlugin(plugin.manifest.id)}
                        className="uninstall-button"
                        disabled={isLoading}
                      >
                        Uninstall
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="updates-tab">
            {updatesAvailable.length === 0 ? (
              <div className="empty-state">
                <h3>All Extensions Up to Date</h3>
                <p>Great! All your installed extensions are running the latest versions.</p>
              </div>
            ) : (
              <div className="updates-section">
                <div className="updates-header">
                  <h3>{updatesAvailable.length} Update{updatesAvailable.length > 1 ? 's' : ''} Available</h3>
                  <button
                    onClick={handleUpdateAll}
                    className="update-all-button"
                    disabled={isLoading}
                  >
                    Update All
                  </button>
                </div>

                <div className="updates-list">
                  {updatesAvailable.map(({ plugin, newVersion }) => (
                    <div key={plugin.manifest.id} className="update-card">
                      <div className="update-info">
                        <h4 className="plugin-name">{plugin.manifest.name}</h4>
                        <div className="version-info">
                          <span className="current-version">v{plugin.version}</span>
                          <span className="arrow">→</span>
                          <span className="new-version">v{newVersion}</span>
                        </div>
                        <p className="plugin-description">{plugin.manifest.description}</p>
                      </div>
                      <div className="update-actions">
                        <button
                          onClick={() => handleUpdatePlugin(plugin.manifest.id)}
                          className="update-button"
                          disabled={isLoading}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};