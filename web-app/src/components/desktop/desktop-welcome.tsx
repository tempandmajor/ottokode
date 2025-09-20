'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/auth/user-menu';
import {
  FolderOpen,
  GitBranch,
  Plus,
  Clock,
  Folder,
  Star,
  Settings,
  Search,
  Download,
  FileText,
  Globe,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/theme-provider';

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  type: 'local' | 'git';
  language?: string;
  description?: string;
  gitUrl?: string;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  files: string[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-ts',
    name: 'React TypeScript',
    description: 'Modern React app with TypeScript, Tailwind CSS, and Vite',
    language: 'TypeScript',
    icon: '⚛️',
    files: ['src/App.tsx', 'src/main.tsx', 'package.json', 'tsconfig.json']
  },
  {
    id: 'next-js',
    name: 'Next.js App',
    description: 'Full-stack React framework with App Router',
    language: 'TypeScript',
    icon: '▲',
    files: ['app/page.tsx', 'app/layout.tsx', 'package.json', 'next.config.js']
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with Express and TypeScript',
    language: 'TypeScript',
    icon: '🟢',
    files: ['src/server.ts', 'src/routes/index.ts', 'package.json', 'tsconfig.json']
  },
  {
    id: 'python-app',
    name: 'Python Application',
    description: 'Python project with virtual environment setup',
    language: 'Python',
    icon: '🐍',
    files: ['main.py', 'requirements.txt', 'README.md', '.gitignore']
  },
  {
    id: 'rust-cli',
    name: 'Rust CLI',
    description: 'Command-line application in Rust',
    language: 'Rust',
    icon: '🦀',
    files: ['src/main.rs', 'Cargo.toml', 'README.md']
  },
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Start with a blank slate',
    language: 'Any',
    icon: '📁',
    files: ['README.md']
  }
];

export function DesktopWelcome() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [recentProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'ottokode-extension',
      path: '/Users/dev/projects/ottokode-extension',
      lastOpened: new Date('2024-01-15T10:30:00'),
      type: 'git',
      language: 'TypeScript',
      description: 'AI-powered VS Code extension',
      gitUrl: 'https://github.com/user/ottokode-extension'
    },
    {
      id: '2',
      name: 'portfolio-website',
      path: '/Users/dev/projects/portfolio',
      lastOpened: new Date('2024-01-14T16:45:00'),
      type: 'local',
      language: 'React',
      description: 'Personal portfolio with Next.js'
    },
    {
      id: '3',
      name: 'api-service',
      path: '/Users/dev/projects/api-service',
      lastOpened: new Date('2024-01-12T09:15:00'),
      type: 'git',
      language: 'Node.js',
      description: 'Backend API for mobile app',
      gitUrl: 'https://github.com/company/api-service'
    }
  ]);

  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [gitUrl, setGitUrl] = useState('');
  const [clonePath, setClonePath] = useState('');
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    path: '',
    template: ''
  });

  const handleOpenProject = useCallback(async () => {
    try {
      // In a real implementation, this would use Tauri's file dialog API
      // For now, we'll just log and show a placeholder
      console.log('Opening project folder dialog...');
      // TODO: Implement actual folder dialog using Tauri APIs
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
    }
  }, []);

  const handleCloneRepository = useCallback(async () => {
    if (!gitUrl.trim()) return;

    console.log('Cloning repository:', gitUrl, 'to:', clonePath);
    // In a real implementation, this would use git commands via Tauri
    setCloneDialogOpen(false);
    setGitUrl('');
    setClonePath('');
  }, [gitUrl, clonePath]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectData.name.trim() || !newProjectData.template) return;

    console.log('Creating new project:', newProjectData);
    // In a real implementation, this would create the project structure
    setNewProjectDialogOpen(false);
    setNewProjectData({ name: '', path: '', template: '' });
  }, [newProjectData]);

  const formatLastOpened = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Image
                src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
                alt="Ottokode"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary">
              Desktop
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/20 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Choose a template and location for your new project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          value={newProjectData.name}
                          onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="my-awesome-project"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-path">Location</Label>
                        <Input
                          id="project-path"
                          value={newProjectData.path}
                          onChange={(e) => setNewProjectData(prev => ({ ...prev, path: e.target.value }))}
                          placeholder="/Users/dev/projects"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-template">Template</Label>
                        <Select value={newProjectData.template} onValueChange={(value) => setNewProjectData(prev => ({ ...prev, template: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_TEMPLATES.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{template.icon}</span>
                                  <span>{template.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleCreateProject}>
                        Create Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full justify-start" onClick={handleOpenProject}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Existing Project
                </Button>

                <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Clone Repository
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Clone Repository</DialogTitle>
                      <DialogDescription>
                        Enter the Git URL and choose where to clone the repository.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="git-url">Repository URL</Label>
                        <Input
                          id="git-url"
                          value={gitUrl}
                          onChange={(e) => setGitUrl(e.target.value)}
                          placeholder="https://github.com/user/repo.git"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="clone-path">Clone to</Label>
                        <Input
                          id="clone-path"
                          value={clonePath}
                          onChange={(e) => setClonePath(e.target.value)}
                          placeholder="/Users/dev/projects"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleCloneRepository}>
                        <Download className="h-4 w-4 mr-2" />
                        Clone Repository
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">PROJECT TEMPLATES</h3>
              <div className="space-y-1">
                {PROJECT_TEMPLATES.slice(0, 4).map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      setNewProjectData(prev => ({ ...prev, template: template.id }));
                      setNewProjectDialogOpen(true);
                    }}
                  >
                    <span className="mr-2">{template.icon}</span>
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer'}!
              </h1>
              <p className="text-muted-foreground">
                Choose a project to continue coding, or start something new.
              </p>
            </div>

            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="recent" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Recent Projects</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Templates</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {recentProjects.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No recent projects</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Create a new project or open an existing one to get started.
                      </p>
                      <Button onClick={() => setNewProjectDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Project
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {recentProjects.map((project) => (
                      <Card key={project.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                {project.type === 'git' ? (
                                  <GitBranch className="h-5 w-5 text-primary" />
                                ) : (
                                  <Folder className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{project.name}</h3>
                                <p className="text-sm text-muted-foreground">{project.path}</p>
                                {project.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                {project.language && (
                                  <Badge variant="secondary" className="mb-1">
                                    {project.language}
                                  </Badge>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {formatLastOpened(project.lastOpened)}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROJECT_TEMPLATES.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{template.icon}</div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{template.language}</Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewProjectData(prev => ({ ...prev, template: template.id }));
                              setNewProjectDialogOpen(true);
                            }}
                          >
                            Use Template
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <p>Includes: {template.files.slice(0, 3).join(', ')}{template.files.length > 3 ? '...' : ''}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}