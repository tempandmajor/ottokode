'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, Star, Zap } from 'lucide-react';
import { PROJECT_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, searchTemplates } from '@ottokode/shared';
import type { ProjectTemplate } from '@ottokode/shared';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: ProjectTemplate) => void;
}

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  onTemplateSelect
}: TemplateSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    if (searchQuery) {
      return searchTemplates(searchQuery);
    }

    if (selectedCategory === 'all') {
      return PROJECT_TEMPLATES;
    }

    return getTemplatesByCategory(selectedCategory);
  }, [searchQuery, selectedCategory]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    onTemplateSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Choose Your Project Template
          </DialogTitle>
          <p className="text-muted-foreground">
            Start with a pre-configured template to speed up your development
          </p>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1 mb-6">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              {TEMPLATE_CATEGORIES.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs"
                  title={category.description}
                >
                  <span className="mr-1">{category.icon}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Templates Grid */}
            <TabsContent value={selectedCategory} className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or browse different categories
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{template.icon}</span>
                              <div>
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                  {template.name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className={getDifficultyColor(template.difficulty)}
                                  >
                                    {template.difficulty}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {template.estimatedSetupTime}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <CardDescription className="mb-3 line-clamp-2">
                            {template.description}
                          </CardDescription>

                          {/* Platforms */}
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {template.platforms.slice(0, 3).map((platform) => (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                              {template.platforms.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.platforms.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Technologies */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {[...template.languages, ...template.frameworks].slice(0, 4).map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Features */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {template.scaffolding.fileStructure.length} files
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {template.scaffolding.dependencies.length} deps
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Create Empty Project
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}