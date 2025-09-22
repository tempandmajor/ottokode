'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Book,
  Code,
  Lightbulb,
  Shield,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ProjectTemplate, ProjectCreationOptions } from '../../../../../shared/src/types/project-templates';
import { documentationGuideService } from '../../../../../shared/src/services/documentation-guide';
import { PlatformGuideline, ThirdPartyService } from '../../../../../shared/src/types/documentation-guide';

interface EnhancedProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (options: ProjectCreationOptions) => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const wizardSteps: WizardStep[] = [
  {
    id: 'template',
    title: 'Choose Template',
    description: 'Select a project template to get started'
  },
  {
    id: 'configure',
    title: 'Configure Project',
    description: 'Set up your project details'
  },
  {
    id: 'guidelines',
    title: 'Platform Guidelines',
    description: 'Review best practices and guidelines'
  },
  {
    id: 'services',
    title: 'Third-party Services',
    description: 'Explore common service integrations'
  },
  {
    id: 'create',
    title: 'Create Project',
    description: 'Review and create your project'
  }
];

// Mock templates data - in real app this would come from a service
const projectTemplates: ProjectTemplate[] = [
  {
    id: 'ios-swift',
    name: 'iOS App (Swift)',
    description: 'Native iOS application with SwiftUI',
    category: 'mobile-ios',
    icon: '📱',
    platforms: ['ios'],
    languages: ['swift'],
    frameworks: ['SwiftUI', 'UIKit'],
    tags: ['mobile', 'native', 'swift'],
    difficulty: 'intermediate',
    estimatedSetupTime: '5-10 minutes',
    scaffolding: {
      fileStructure: [],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: []
    },
    guidelines: {
      platformGuidelines: ['ios-hig', 'app-store-guidelines'],
      thirdPartyServices: ['firebase', 'stripe', 'analytics'],
      bestPractices: ['swift-naming', 'ios-architecture']
    }
  },
  {
    id: 'react-next',
    name: 'Next.js App',
    description: 'Full-stack React application with Next.js',
    category: 'web-fullstack',
    icon: '⚛️',
    platforms: ['web'],
    languages: ['typescript', 'javascript'],
    frameworks: ['Next.js', 'React'],
    tags: ['web', 'fullstack', 'react'],
    difficulty: 'intermediate',
    estimatedSetupTime: '3-5 minutes',
    scaffolding: {
      fileStructure: [],
      dependencies: [],
      scripts: {},
      configuration: [],
      initialCode: [],
      setupSteps: []
    },
    guidelines: {
      platformGuidelines: ['web-accessibility', 'seo-best-practices'],
      thirdPartyServices: ['stripe', 'auth0', 'vercel'],
      bestPractices: ['react-patterns', 'typescript-guide']
    }
  }
];

export const EnhancedProjectWizard: React.FC<EnhancedProjectWizardProps> = ({
  open,
  onOpenChange,
  onCreateProject
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectConfig, setProjectConfig] = useState({
    name: '',
    description: '',
    directory: ''
  });
  const [guidelines, setGuidelines] = useState<PlatformGuideline[]>([]);
  const [services, setServices] = useState<ThirdPartyService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load guidelines and services when template is selected
  const loadGuidelinesAndServices = useCallback(async () => {
    if (!selectedTemplate?.guidelines) return;

    setLoading(true);
    try {
      // Load platform guidelines
      const platformGuidelines = await Promise.all(
        selectedTemplate.guidelines.platformGuidelines.map(id =>
          documentationGuideService.getGuidelineById(id)
        )
      );
      setGuidelines(platformGuidelines.filter(Boolean) as PlatformGuideline[]);

      // Load third-party services
      const thirdPartyServices = await Promise.all(
        selectedTemplate.guidelines.thirdPartyServices.map(id =>
          documentationGuideService.getServiceById(id)
        )
      );
      setServices(thirdPartyServices.filter(Boolean) as ThirdPartyService[]);
    } catch (error) {
      console.error('Failed to load guidelines and services:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate?.guidelines) {
      loadGuidelinesAndServices();
    }
  }, [selectedTemplate, loadGuidelinesAndServices]);

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectConfig(prev => ({
      ...prev,
      name: template.name.replace(/\s+/g, '-').toLowerCase()
    }));
    handleNext();
  };

  const handleCreateProject = () => {
    if (!selectedTemplate) return;

    const options: ProjectCreationOptions = {
      templateId: selectedTemplate.id,
      projectName: projectConfig.name,
      description: projectConfig.description,
      userInputs: {
        directory: projectConfig.directory,
        selectedServices: selectedServices
      }
    };

    onCreateProject(options);
    onOpenChange(false);

    // Reset wizard state
    setCurrentStep(0);
    setSelectedTemplate(null);
    setProjectConfig({ name: '', description: '', directory: '' });
    setSelectedServices([]);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedTemplate !== null;
      case 1: return projectConfig.name.trim() !== '';
      case 2:
      case 3: return true; // Guidelines and services are optional
      case 4: return true;
      default: return false;
    }
  };

  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{template.icon}</div>
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {template.frameworks.map((framework) => (
                  <Badge key={framework} variant="secondary">
                    {framework}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="capitalize">{template.difficulty}</span>
                <span>{template.estimatedSetupTime}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProjectConfiguration = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Project Name</label>
          <input
            type="text"
            value={projectConfig.name}
            onChange={(e) => setProjectConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="my-awesome-project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={projectConfig.description}
            onChange={(e) => setProjectConfig(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe your project..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Directory (Optional)</label>
          <input
            type="text"
            value={projectConfig.directory}
            onChange={(e) => setProjectConfig(prev => ({ ...prev, directory: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="./projects"
          />
        </div>
      </div>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{selectedTemplate.icon}</div>
              <div>
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Languages:</span>
                <div className="flex gap-1">
                  {selectedTemplate.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Frameworks:</span>
                <div className="flex gap-1">
                  {selectedTemplate.frameworks.map((framework) => (
                    <Badge key={framework} variant="outline" className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderGuidelines = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Book className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Platform Guidelines</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading guidelines...</div>
      ) : guidelines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No specific guidelines available</div>
      ) : (
        <div className="space-y-3">
          {guidelines.map((guideline) => (
            <Card key={guideline.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{guideline.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{guideline.description}</p>
                  </div>
                  <Badge
                    variant={
                      guideline.priority === 'high' ? 'destructive' :
                      guideline.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {guideline.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{guideline.sections.length} sections</span>
                  <span>•</span>
                  <span>{guideline.platform} platform</span>
                  {guideline.lastUpdated && (
                    <>
                      <span>•</span>
                      <span>Updated {new Date(guideline.lastUpdated).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900">Real-time Guidance</h4>
            <p className="text-sm text-blue-700 mt-1">
              These guidelines will be automatically checked as you code. Violations and suggestions
              will appear directly in your editor to help you follow best practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Code className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Common Integrations</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No service recommendations available</div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {service.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices(prev => [...prev, service.id]);
                        } else {
                          setSelectedServices(prev => prev.filter(id => id !== service.id));
                        }
                      }}
                      className="h-4 w-4 text-green-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{service.integrationGuides.length} integration guides</span>
                  <span>•</span>
                  <span>Documentation available</span>
                  {service.pricing && (
                    <>
                      <span>•</span>
                      <span>{service.pricing}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900">Smart Integration</h4>
            <p className="text-sm text-green-700 mt-1">
              Selected services will have their documentation and code examples readily available
              in your IDE. Get context-aware help and best practices as you integrate these services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateProject = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Ready to Create Project</h3>
        <p className="text-muted-foreground">
          Review your selections and create your new project with integrated guidelines and documentation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="font-medium">Template:</span> {selectedTemplate?.name}
          </div>
          <div>
            <span className="font-medium">Project Name:</span> {projectConfig.name}
          </div>
          {projectConfig.description && (
            <div>
              <span className="font-medium">Description:</span> {projectConfig.description}
            </div>
          )}
          <div>
            <span className="font-medium">Guidelines:</span> {guidelines.length} platform guidelines
          </div>
          <div>
            <span className="font-medium">Services:</span> {selectedServices.length} selected for integration
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900">What happens next?</h4>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Project structure will be scaffolded based on your template</li>
              <li>• Platform guidelines will be integrated into your editor</li>
              <li>• Service documentation will be available in the docs panel</li>
              <li>• Real-time code analysis will help you follow best practices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < wizardSteps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{wizardSteps[currentStep].title}</h2>
            <p className="text-muted-foreground">{wizardSteps[currentStep].description}</p>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && renderTemplateSelection()}
            {currentStep === 1 && renderProjectConfiguration()}
            {currentStep === 2 && renderGuidelines()}
            {currentStep === 3 && renderServices()}
            {currentStep === 4 && renderCreateProject()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < wizardSteps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateProject}
                  disabled={!canProceed()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Project
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};