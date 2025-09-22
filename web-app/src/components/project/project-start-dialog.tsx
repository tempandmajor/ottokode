'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  GitBranch,
  Clock,
  FolderOpen,
  ArrowRight,
  Plus,
  ExternalLink
} from 'lucide-react';

interface ProjectStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewFromTemplate: () => void;
  onCloneRepository: (url: string) => void;
  onLoadRecent: (projectId: string) => void;
  recentProjects?: Array<{
    id: string;
    name: string;
    description?: string;
    lastAccessed: string;
  }>;
}

export function ProjectStartDialog({
  open,
  onOpenChange,
  onNewFromTemplate,
  onCloneRepository,
  onLoadRecent,
  recentProjects = []
}: ProjectStartDialogProps) {
  const [gitUrl, setGitUrl] = useState('');

  const handleCloneRepository = () => {
    if (gitUrl.trim()) {
      onCloneRepository(gitUrl.trim());
      setGitUrl('');
      onOpenChange(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Start Coding
          </DialogTitle>
          <p className="text-muted-foreground">
            Choose how you&apos;d like to begin your project
          </p>
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New File */}
            <Card className="cursor-pointer hover:shadow-md transition-all group border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">New File</CardTitle>
                      <CardDescription>Start from scratch or use a template</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new project with pre-configured templates for React, Node.js, Python, and more.
                </p>
                <Button
                  onClick={() => {
                    onNewFromTemplate();
                    onOpenChange(false);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Template
                </Button>
              </CardContent>
            </Card>

            {/* Clone Repository */}
            <Card className="cursor-pointer hover:shadow-md transition-all group border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <GitBranch className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Clone Git Repository</CardTitle>
                      <CardDescription>Import an existing project</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="git-url">Repository URL</Label>
                    <Input
                      id="git-url"
                      placeholder="https://github.com/user/repo.git"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCloneRepository();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleCloneRepository}
                    disabled={!gitUrl.trim()}
                    className="w-full"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Clone Repository
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card className="cursor-pointer hover:shadow-md transition-all group border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Recent</CardTitle>
                      <CardDescription>Continue working on recent projects</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentProjects.length > 0 ? (
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {recentProjects.slice(0, 5).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            onLoadRecent(project.id);
                            onOpenChange(false);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(project.lastAccessed)}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent projects</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}