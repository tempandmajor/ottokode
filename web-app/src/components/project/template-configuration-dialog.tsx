'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Sparkles, FolderOpen } from 'lucide-react';
import type { ProjectTemplate, ProjectCreationOptions, UserPrompt } from '@ottokode/shared';

interface TemplateConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ProjectTemplate | null;
  onCreateProject: (options: ProjectCreationOptions) => void;
  onBack: () => void;
}

export function TemplateConfigurationDialog({
  open,
  onOpenChange,
  template,
  onCreateProject,
  onBack
}: TemplateConfigurationDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [userInputs, setUserInputs] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);

  if (!template) return null;

  const setupSteps = template.scaffolding.setupSteps.filter(step => step.userPrompt);
  const totalSteps = 2 + setupSteps.length; // Basic info + setup steps + summary
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleInputChange = (stepId: string, value: any) => {
    setUserInputs(prev => ({
      ...prev,
      [stepId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      const options: ProjectCreationOptions = {
        templateId: template.id,
        projectName: projectName.trim(),
        description: projectDescription.trim() || undefined,
        userInputs
      };

      await onCreateProject(options);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return projectName.trim().length > 0;
      default:
        const stepIndex = currentStep - 1;
        const step = setupSteps[stepIndex];
        if (step?.userPrompt?.validation?.required) {
          const value = userInputs[step.id];
          return value !== undefined && value !== null && value !== '';
        }
        return true;
    }
  };

  const renderUserPrompt = (prompt: UserPrompt, stepId: string) => {
    const value = userInputs[stepId];

    switch (prompt.type) {
      case 'text':
        return (
          <Input
            placeholder={prompt.message}
            value={value || ''}
            onChange={(e) => handleInputChange(stepId, e.target.value)}
            className="mt-2"
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => handleInputChange(stepId, newValue)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder={prompt.message} />
            </SelectTrigger>
            <SelectContent>
              {prompt.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="mt-2 space-y-2">
            {prompt.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={value?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      handleInputChange(stepId, [...currentValues, option.value]);
                    } else {
                      handleInputChange(stepId, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={option.value} className="flex-1">
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  )}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={stepId}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(stepId, checked)}
            />
            <Label htmlFor={stepId}>{prompt.message}</Label>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div>
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="My Awesome Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="projectDescription">Description (Optional)</Label>
            <Textarea
              id="projectDescription"
              placeholder="Describe your project..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
      );
    }

    if (currentStep <= setupSteps.length) {
      const stepIndex = currentStep - 1;
      const step = setupSteps[stepIndex];

      if (!step?.userPrompt) return null;

      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <div>
            <Label>{step.userPrompt.message}</Label>
            {renderUserPrompt(step.userPrompt, step.id)}
          </div>
        </div>
      );
    }

    // Summary step
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Review Your Configuration</h3>
          <p className="text-muted-foreground">
            Your project will be created with the following settings:
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              {projectName}
            </CardTitle>
            <CardDescription>{projectDescription || 'No description provided'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Template</h4>
                <Badge variant="outline">{template.name}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Platforms</h4>
                <div className="flex flex-wrap gap-1">
                  {template.platforms.map((platform) => (
                    <Badge key={platform} variant="secondary">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Technologies</h4>
                <div className="flex flex-wrap gap-1">
                  {[...template.languages, ...template.frameworks].map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {Object.keys(userInputs).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className="space-y-2">
                    {Object.entries(userInputs).map(([key, value]) => {
                      const step = setupSteps.find(s => s.id === key);
                      if (!step) return null;

                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{step.title}:</span>
                          <span className="text-sm">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-xl">
                Configure {template.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </DialogHeader>

        <div className="py-6">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === totalSteps - 1 ? (
              <Button
                onClick={handleCreateProject}
                disabled={!isStepValid() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}