'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Clock, Star, Zap, Filter, SlidersHorizontal } from 'lucide-react';
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
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const filteredTemplates = useMemo(() => {
    let templates = PROJECT_TEMPLATES;

    // Apply search filter
    if (searchQuery) {
      templates = searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(template =>
        template.category === selectedCategory
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(template =>
        template.difficulty === selectedDifficulty
      );
    }

    // Apply language filter
    if (selectedLanguage !== 'all') {
      templates = templates.filter(template =>
        template.languages.includes(selectedLanguage) ||
        template.frameworks.includes(selectedLanguage)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        return [...templates].sort((a, b) => a.name.localeCompare(b.name));
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return [...templates].sort((a, b) =>
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4) -
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4)
        );
      case 'setup-time':
        return [...templates].sort((a, b) =>
          parseInt(a.estimatedSetupTime) - parseInt(b.estimatedSetupTime)
        );
      default: // popular
        return templates;
    }
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedLanguage, sortBy]);

  // Extract unique values for filter dropdowns
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    PROJECT_TEMPLATES.forEach(template => {
      template.languages.forEach(lang => languages.add(lang));
      template.frameworks.forEach(framework => languages.add(framework));
    });
    return Array.from(languages).sort();
  }, []);

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
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language/Framework Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technology</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Technologies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Technologies</SelectItem>
                    {availableLanguages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="setup-time">Setup Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count and Clear Filters */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </p>
            {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedLanguage !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSelectedLanguage('all');
                  setSearchQuery('');
                  setSortBy('popular');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-[450px] pr-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 group border-2 hover:border-primary/50"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
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
                      <CardDescription className="mb-3 text-sm line-clamp-3">
                        {template.description}
                      </CardDescription>

                      {/* Technologies */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {[...template.languages, ...template.frameworks].slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {[...template.languages, ...template.frameworks].length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{[...template.languages, ...template.frameworks].length - 3}
                            </Badge>
                          )}
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

          {/* Footer */}
          <div className="flex justify-end items-center mt-6 pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Create Empty Project
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}