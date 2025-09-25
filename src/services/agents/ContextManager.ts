import { EventEmitter } from '../../utils/EventEmitter';
import { codebaseIndexer, IndexedFile } from '../indexing/CodebaseIndexer';
import { semanticSearch, SearchResult } from '../search/SemanticSearch';
import { contextRetriever, ContextRequest, ContextResponse } from '../context/ContextRetriever';

export interface TaskContextOptions {
  maxFiles?: number;
  maxTokens?: number;
  includeTests?: boolean;
  includeDocumentation?: boolean;
  depth?: number;
}

export class ContextManager extends EventEmitter {
  private cache: Map<string, ContextResponse> = new Map();

  async warmIndex(rootPath: string): Promise<void> {
    await codebaseIndexer.indexCodebase(rootPath);
  }

  async getTaskContext(query: string, focusFile?: string, options?: TaskContextOptions): Promise<ContextResponse> {
    const request: ContextRequest = {
      id: `ctx_${Date.now()}`,
      type: 'task_context',
      query,
      focusFile,
      timestamp: new Date(),
      maxFiles: options?.maxFiles ?? 15,
      maxTokens: options?.maxTokens ?? 8000,
      includeTests: options?.includeTests ?? true,
      includeDocumentation: options?.includeDocumentation ?? true,
      depth: options?.depth ?? 2,
    };

    const cacheKey = JSON.stringify({ q: query, f: focusFile, o: options });
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const response = await contextRetriever.retrieveContext(request);
    this.cache.set(cacheKey, response);
    this.emit('contextRetrieved', response);
    return response;
  }

  getIndexedFile(path: string): IndexedFile | undefined {
    return codebaseIndexer.getIndexedFile(path);
  }

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    return semanticSearch.search(query, { type: 'semantic', limit });
  }

  clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }
}

export const contextManager = new ContextManager();
