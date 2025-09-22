'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Book, AlertTriangle, CheckCircle, ExternalLink, Code, Lightbulb } from 'lucide-react';
import { documentationGuideService } from '../../../../../shared/src/services/documentation-guide';
import {
  PlatformGuideline,
  ThirdPartyService,
  CodeAnalysisResult,
  GuidelineViolation,
  Suggestion
} from '../../../../../shared/src/types/documentation-guide';

interface DocumentationGuideProps {
  projectType?: string;
  currentFile?: string;
  codeContent?: string;
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({
  projectType,
  currentFile,
  codeContent,
  onApplySuggestion
}) => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'services' | 'analysis'>('guidelines');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformGuidelines, setPlatformGuidelines] = useState<PlatformGuideline[]>([]);
  const [thirdPartyServices, setThirdPartyServices] = useState<ThirdPartyService[]>([]);
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState<PlatformGuideline | null>(null);
  const [selectedService, setSelectedService] = useState<ThirdPartyService | null>(null);

  useEffect(() => {
    loadGuidelines();
    loadServices();
  }, [projectType, loadGuidelines, loadServices]);

  useEffect(() => {
    if (codeContent && currentFile && projectType) {
      analyzeCode();
    }
  }, [codeContent, currentFile, projectType, analyzeCode]);

  const loadGuidelines = useCallback(async () => {
    if (!projectType) return;

    setLoading(true);
    try {
      const guidelines = await documentationGuideService.getPlatformGuidelines(projectType);
      setPlatformGuidelines(guidelines);
    } catch (error) {
      console.error('Failed to load guidelines:', error);
    } finally {
      setLoading(false);
    }
  }, [projectType]);

  const loadServices = useCallback(async () => {
    if (!projectType) return;

    try {
      const services = await documentationGuideService.getThirdPartyServices(projectType);
      setThirdPartyServices(services);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, [projectType]);

  const analyzeCode = useCallback(async () => {
    if (!codeContent || !currentFile || !projectType) return;

    try {
      const result = await documentationGuideService.analyzeCode({
        code: codeContent,
        filePath: currentFile,
        language: getLanguageFromFile(currentFile),
        projectType,
        platformGuidelines: platformGuidelines.map(g => g.id)
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error('Failed to analyze code:', error);
    }
  }, [codeContent, currentFile, projectType, platformGuidelines]);

  const getLanguageFromFile = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'swift': 'swift',
      'kt': 'kotlin',
      'java': 'java',
      'py': 'python'
    };
    return languageMap[ext || ''] || 'text';
  };

  const filteredGuidelines = platformGuidelines.filter(guideline =>
    guideline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guideline.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = thirdPartyServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderViolation = (violation: GuidelineViolation) => (
    <div key={violation.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-red-900">{violation.title}</h4>
          <p className="text-sm text-red-700 mt-1">{violation.description}</p>
          {violation.lineNumber && (
            <p className="text-xs text-red-600 mt-1">Line {violation.lineNumber}</p>
          )}
          {violation.codeSnippet && (
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
              <code>{violation.codeSnippet}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );

  const renderSuggestion = (suggestion: Suggestion) => (
    <div key={suggestion.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">{suggestion.title}</h4>
          <p className="text-sm text-blue-700 mt-1">{suggestion.description}</p>
          {suggestion.codeExample && (
            <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-x-auto">
              <code>{suggestion.codeExample}</code>
            </pre>
          )}
          {onApplySuggestion && suggestion.autoFixAvailable && (
            <button
              onClick={() => onApplySuggestion(suggestion)}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Apply Fix
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderGuidelineDetail = (guideline: PlatformGuideline) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedGuideline(null)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Guidelines
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold">{guideline.title}</h3>
        <p className="text-gray-600 mt-1">{guideline.description}</p>
      </div>

      {guideline.sections.map((section, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">{section.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{section.content}</p>

          {section.examples && section.examples.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Examples:</h5>
              {section.examples.map((example, exIndex) => (
                <div key={exIndex} className="bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4" />
                    <span className="text-sm font-medium">{example.title}</span>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                  {example.explanation && (
                    <p className="text-xs text-gray-600 mt-2">{example.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {section.checklist && section.checklist.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium mb-2">Checklist:</h5>
              <ul className="space-y-1">
                {section.checklist.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.links && section.links.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium mb-2">References:</h5>
              <ul className="space-y-1">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Documentation Guide</h2>

        <div className="flex space-x-1 mb-3">
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'guidelines'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Guidelines
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analysis
            {analysisResult && (analysisResult.violations.length > 0 || analysisResult.suggestions.length > 0) && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {analysisResult.violations.length + analysisResult.suggestions.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines and services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'guidelines' && (
          <div className="space-y-3">
            {selectedGuideline ? (
              renderGuidelineDetail(selectedGuideline)
            ) : (
              <>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading guidelines...</div>
                ) : filteredGuidelines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No guidelines found</div>
                ) : (
                  filteredGuidelines.map((guideline) => (
                    <div
                      key={guideline.id}
                      onClick={() => setSelectedGuideline(guideline)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Book className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-medium">{guideline.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{guideline.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              guideline.priority === 'high' ? 'bg-red-100 text-red-800' :
                              guideline.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {guideline.priority} priority
                            </span>
                            <span className="text-xs text-gray-500">
                              {guideline.sections.length} sections
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-3">
            {selectedService ? (
              <div>Service details for {selectedService.name}</div>
            ) : (
              <>
                {filteredServices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No services found</div>
                ) : (
                  filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">
                            {service.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {service.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {service.integrationGuides.length} guides
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {!analysisResult ? (
              <div className="text-center py-8 text-gray-500">
                No code analysis available. Open a file to see suggestions.
              </div>
            ) : (
              <>
                {analysisResult.violations.length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-900 mb-3">
                      Guideline Violations ({analysisResult.violations.length})
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.violations.map(renderViolation)}
                    </div>
                  </div>
                )}

                {analysisResult.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-blue-900 mb-3">
                      Suggestions ({analysisResult.suggestions.length})
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.suggestions.map(renderSuggestion)}
                    </div>
                  </div>
                )}

                {analysisResult.violations.length === 0 && analysisResult.suggestions.length === 0 && (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Your code follows all applicable guidelines!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationGuide;