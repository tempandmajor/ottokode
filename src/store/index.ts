import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AuthState } from '../services/auth/AuthService';

// File and Editor State
export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty?: boolean;
  lastModified?: Date;
}

// UI State Management
export interface UIState {
  // Panel visibility
  showSetupChecklist: boolean;
  showTerminal: boolean;
  showAIChat: boolean;
  showCostDashboard: boolean;
  showPerformanceDashboard: boolean;
  showAgentDashboard: boolean;
  showCollaborationPanel: boolean;
  showSecureNotepad: boolean;
  showGitPanel: boolean;
  showAIProviderSettings: boolean;
  showBillingDashboard: boolean;
  showAuth: boolean;

  // Enterprise Panels
  showAITerminal: boolean;
  showEnterpriseAnalytics: boolean;
  showEnterpriseProject: boolean;
  showEnterpriseDeployment: boolean;
  showEnterpriseSecurity: boolean;

  // Editor state
  activeFile: EditorFile | null;
  openFiles: EditorFile[];

  // Settings
  aiCompletionEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';

  // Loading states
  isLoading: boolean;
  loadingMessage?: string;

  // Error state
  error: string | null;
}

// Application State
export interface AppState extends UIState {
  // Authentication
  authState: AuthState;

  // Workspace
  currentWorkspace: string | null;
  recentWorkspaces: string[];

  // Performance
  isOnline: boolean;
  lastSyncTime: Date | null;
}

// State Actions
export interface AppActions {
  // UI Actions
  togglePanel: (panel: keyof Pick<UIState, 'showSetupChecklist' | 'showTerminal' | 'showAIChat' | 'showCostDashboard' | 'showPerformanceDashboard' | 'showAgentDashboard' | 'showCollaborationPanel' | 'showSecureNotepad' | 'showGitPanel' | 'showAIProviderSettings' | 'showBillingDashboard' | 'showAuth' | 'showAITerminal' | 'showEnterpriseAnalytics' | 'showEnterpriseProject' | 'showEnterpriseDeployment' | 'showEnterpriseSecurity'>) => void;
  setPanel: (panel: keyof Pick<UIState, 'showSetupChecklist' | 'showTerminal' | 'showAIChat' | 'showCostDashboard' | 'showPerformanceDashboard' | 'showAgentDashboard' | 'showCollaborationPanel' | 'showSecureNotepad' | 'showGitPanel' | 'showAIProviderSettings' | 'showBillingDashboard' | 'showAuth' | 'showAITerminal' | 'showEnterpriseAnalytics' | 'showEnterpriseProject' | 'showEnterpriseDeployment' | 'showEnterpriseSecurity'>, visible: boolean) => void;

  // File Actions
  openFile: (file: EditorFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (file: EditorFile | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileDirty: (fileId: string, isDirty: boolean) => void;

  // Settings Actions
  setAiCompletionEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;

  // Auth Actions
  setAuthState: (authState: AuthState) => void;

  // Workspace Actions
  setCurrentWorkspace: (workspace: string | null) => void;
  addRecentWorkspace: (workspace: string) => void;

  // Loading Actions
  setLoading: (loading: boolean, message?: string) => void;

  // Error Actions
  setError: (error: string | null) => void;

  // Network Actions
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSyncTime: () => void;

  // Reset Actions
  resetUIState: () => void;
  resetAllState: () => void;
}

// Default State
const defaultState: AppState = {
  // UI State
  showSetupChecklist: true,
  showTerminal: false,
  showAIChat: false,
  showCostDashboard: false,
  showPerformanceDashboard: false,
  showAgentDashboard: false,
  showCollaborationPanel: false,
  showSecureNotepad: false,
  showGitPanel: false,
  showAIProviderSettings: false,
  showBillingDashboard: false,
  showAuth: false,

  // Enterprise Panels
  showAITerminal: false,
  showEnterpriseAnalytics: false,
  showEnterpriseProject: false,
  showEnterpriseDeployment: false,
  showEnterpriseSecurity: false,

  // Editor
  activeFile: null,
  openFiles: [],

  // Settings
  aiCompletionEnabled: true,
  theme: 'dark',

  // Loading
  isLoading: false,
  loadingMessage: undefined,

  // Error
  error: null,

  // Auth
  authState: {
    user: null,
    session: null,
    loading: false,
    isAuthenticated: false,
  },

  // Workspace
  currentWorkspace: null,
  recentWorkspaces: [],

  // Network
  isOnline: true,
  lastSyncTime: null,
};

// Create Store
export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...defaultState,

        // UI Actions
        togglePanel: (panel) => set((state) => {
          state[panel] = !state[panel];
        }),

        setPanel: (panel, visible) => set((state) => {
          state[panel] = visible;
        }),

        // File Actions
        openFile: (file) => set((state) => {
          // Check if file is already open
          const existingFile = state.openFiles.find(f => f.id === file.id);
          if (!existingFile) {
            state.openFiles.push(file);
          }
          state.activeFile = file;
        }),

        closeFile: (fileId) => set((state) => {
          state.openFiles = state.openFiles.filter(f => f.id !== fileId);

          // If closing active file, set new active file
          if (state.activeFile?.id === fileId) {
            state.activeFile = state.openFiles.length > 0
              ? state.openFiles[state.openFiles.length - 1]
              : null;
          }
        }),

        setActiveFile: (file) => set((state) => {
          state.activeFile = file;
        }),

        updateFileContent: (fileId, content) => set((state) => {
          // Update in openFiles
          const fileIndex = state.openFiles.findIndex(f => f.id === fileId);
          if (fileIndex !== -1) {
            state.openFiles[fileIndex].content = content;
            state.openFiles[fileIndex].lastModified = new Date();
          }

          // Update activeFile if it matches
          if (state.activeFile?.id === fileId) {
            state.activeFile.content = content;
            state.activeFile.lastModified = new Date();
          }
        }),

        markFileDirty: (fileId, isDirty) => set((state) => {
          const fileIndex = state.openFiles.findIndex(f => f.id === fileId);
          if (fileIndex !== -1) {
            state.openFiles[fileIndex].isDirty = isDirty;
          }

          if (state.activeFile?.id === fileId) {
            state.activeFile.isDirty = isDirty;
          }
        }),

        // Settings Actions
        setAiCompletionEnabled: (enabled) => set((state) => {
          state.aiCompletionEnabled = enabled;
        }),

        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),

        // Auth Actions
        setAuthState: (authState) => set((state) => {
          state.authState = authState;
        }),

        // Workspace Actions
        setCurrentWorkspace: (workspace) => set((state) => {
          state.currentWorkspace = workspace;
          if (workspace && !state.recentWorkspaces.includes(workspace)) {
            state.recentWorkspaces.unshift(workspace);
            // Keep only last 10 workspaces
            if (state.recentWorkspaces.length > 10) {
              state.recentWorkspaces = state.recentWorkspaces.slice(0, 10);
            }
          }
        }),

        addRecentWorkspace: (workspace) => set((state) => {
          if (!state.recentWorkspaces.includes(workspace)) {
            state.recentWorkspaces.unshift(workspace);
            if (state.recentWorkspaces.length > 10) {
              state.recentWorkspaces = state.recentWorkspaces.slice(0, 10);
            }
          }
        }),

        // Loading Actions
        setLoading: (loading, message) => set((state) => {
          state.isLoading = loading;
          state.loadingMessage = message;
        }),

        // Error Actions
        setError: (error) => set((state) => {
          state.error = error;
        }),

        // Network Actions
        setOnlineStatus: (isOnline) => set((state) => {
          state.isOnline = isOnline;
        }),

        updateLastSyncTime: () => set((state) => {
          state.lastSyncTime = new Date();
        }),

        // Reset Actions
        resetUIState: () => set((state) => {
          // Reset only UI-related state, keep auth and workspace
          Object.assign(state, {
            ...defaultState,
            authState: state.authState,
            currentWorkspace: state.currentWorkspace,
            recentWorkspaces: state.recentWorkspaces,
          });
        }),

        resetAllState: () => set(() => ({ ...defaultState })),
      })),
      {
        name: 'ottokode-app-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only specific parts of state
          showSetupChecklist: state.showSetupChecklist,
          aiCompletionEnabled: state.aiCompletionEnabled,
          theme: state.theme,
          currentWorkspace: state.currentWorkspace,
          recentWorkspaces: state.recentWorkspaces,
        }),
      }
    )
  )
);

// Selectors for better performance
export const useUIStore = () => useAppStore((state) => ({
  showSetupChecklist: state.showSetupChecklist,
  showTerminal: state.showTerminal,
  showAIChat: state.showAIChat,
  showCostDashboard: state.showCostDashboard,
  showPerformanceDashboard: state.showPerformanceDashboard,
  showAgentDashboard: state.showAgentDashboard,
  showCollaborationPanel: state.showCollaborationPanel,
  showSecureNotepad: state.showSecureNotepad,
  showGitPanel: state.showGitPanel,
  showAIProviderSettings: state.showAIProviderSettings,
  showBillingDashboard: state.showBillingDashboard,
  showAuth: state.showAuth,

  // Enterprise Panels
  showAITerminal: state.showAITerminal,
  showEnterpriseAnalytics: state.showEnterpriseAnalytics,
  showEnterpriseProject: state.showEnterpriseProject,
  showEnterpriseDeployment: state.showEnterpriseDeployment,
  showEnterpriseSecurity: state.showEnterpriseSecurity,

  togglePanel: state.togglePanel,
  setPanel: state.setPanel,
}));

export const useEditorStore = () => useAppStore((state) => ({
  activeFile: state.activeFile,
  openFiles: state.openFiles,
  openFile: state.openFile,
  closeFile: state.closeFile,
  setActiveFile: state.setActiveFile,
  updateFileContent: state.updateFileContent,
  markFileDirty: state.markFileDirty,
}));

export const useAuthStore = () => useAppStore((state) => ({
  authState: state.authState,
  setAuthState: state.setAuthState,
}));

export const useWorkspaceStore = () => useAppStore((state) => ({
  currentWorkspace: state.currentWorkspace,
  recentWorkspaces: state.recentWorkspaces,
  setCurrentWorkspace: state.setCurrentWorkspace,
  addRecentWorkspace: state.addRecentWorkspace,
}));

export const useSettingsStore = () => useAppStore((state) => ({
  aiCompletionEnabled: state.aiCompletionEnabled,
  theme: state.theme,
  setAiCompletionEnabled: state.setAiCompletionEnabled,
  setTheme: state.setTheme,
}));

export const useAppStatus = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  loadingMessage: state.loadingMessage,
  error: state.error,
  isOnline: state.isOnline,
  lastSyncTime: state.lastSyncTime,
  setLoading: state.setLoading,
  setError: state.setError,
  setOnlineStatus: state.setOnlineStatus,
  updateLastSyncTime: state.updateLastSyncTime,
}));