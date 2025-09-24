import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Terminal,
  Play,
  Square,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  History,
  Settings,
  Shield,
  TrendingUp,
  FileText
} from 'lucide-react';

// Types
interface TerminalEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
  command?: ParsedCommand;
  analysis?: OutputAnalysis;
  executionTime?: number;
}

interface ParsedCommand {
  id: string;
  originalQuery: string;
  commands: Command[];
  confidence: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  warnings?: string[];
  requiresConfirmation: boolean;
  estimatedDuration: number;
}

interface Command {
  id: string;
  command: string;
  args: string[];
  description: string;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  requiresElevation: boolean;
}

interface OutputAnalysis {
  summary: string;
  errorDetected: boolean;
  warningsDetected: boolean;
  successIndicators: string[];
  failureIndicators: string[];
  recommendations?: string[];
  followUpCommands?: FollowUpCommand[];
  severity: 'info' | 'warning' | 'error' | 'success';
  confidence: number;
  keyFindings: string[];
}

interface FollowUpCommand {
  command: string;
  args: string[];
  description: string;
  reason: string;
  category: string;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
}

interface TerminalSession {
  id: string;
  name: string;
  workingDirectory: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  lastActivity: Date;
}

const AITerminal: React.FC = () => {
  // State
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentSession, setCurrentSession] = useState<TerminalSession | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [workingDirectory, setWorkingDirectory] = useState('/Users/emmanuelakangbou/ai-ide');

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [entries]);

  const initializeSession = async () => {
    const session: TerminalSession = {
      id: `session-${Date.now()}`,
      name: 'AI Terminal Session',
      workingDirectory: '/Users/emmanuelakangbou/ai-ide',
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    setCurrentSession(session);
    addSystemMessage('AI Terminal initialized. Type your commands in natural language.');
  };

  const addSystemMessage = (message: string) => {
    const entry: TerminalEntry = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: message,
      timestamp: new Date()
    };
    setEntries(prev => [...prev, entry]);
  };

  const handleInputSubmit = async () => {
    if (!input.trim() || isExecuting) return;

    const userInput = input.trim();
    setInput('');

    // Add user input to terminal
    const inputEntry: TerminalEntry = {
      id: `input-${Date.now()}`,
      type: 'input',
      content: userInput,
      timestamp: new Date()
    };
    setEntries(prev => [...prev, inputEntry]);

    try {
      setIsExecuting(true);

      // Parse natural language to commands
      const parsed = await parseNaturalLanguage(userInput);

      // Check if confirmation is required
      if (parsed.requiresConfirmation) {
        setPendingCommand(parsed);
        setShowConfirmDialog(true);
        setIsExecuting(false);
        return;
      }

      // Execute commands directly
      await executeCommands(parsed);

    } catch (error) {
      console.error('Command execution failed:', error);
      addErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const parseNaturalLanguage = async (query: string): Promise<ParsedCommand> => {
    // Simulate API call to NLCommandParser
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock parsing logic - in real implementation, this would call the backend
    const mockCommands: Command[] = [];
    let riskLevel: ParsedCommand['riskLevel'] = 'safe';
    let requiresConfirmation = false;

    if (query.toLowerCase().includes('install')) {
      const packageName = query.match(/install\s+(\S+)/)?.[1] || 'package';
      mockCommands.push({
        id: 'install-cmd',
        command: 'npm',
        args: ['install', packageName],
        description: `Install ${packageName} package`,
        riskLevel: 'medium',
        category: 'package_management',
        requiresElevation: false
      });
      riskLevel = 'medium';
    } else if (query.toLowerCase().includes('list') || query.toLowerCase().includes('show')) {
      mockCommands.push({
        id: 'list-cmd',
        command: 'ls',
        args: ['-la'],
        description: 'List directory contents',
        riskLevel: 'safe',
        category: 'file_management',
        requiresElevation: false
      });
    } else if (query.toLowerCase().includes('build')) {
      mockCommands.push({
        id: 'build-cmd',
        command: 'npm',
        args: ['run', 'build'],
        description: 'Build the project',
        riskLevel: 'low',
        category: 'development',
        requiresElevation: false
      });
      riskLevel = 'low';
    } else if (query.toLowerCase().includes('delete') || query.toLowerCase().includes('remove')) {
      mockCommands.push({
        id: 'remove-cmd',
        command: 'rm',
        args: ['-rf', 'target'],
        description: 'Remove files (DANGEROUS)',
        riskLevel: 'critical',
        category: 'file_management',
        requiresElevation: false
      });
      riskLevel = 'critical';
      requiresConfirmation = true;
    }

    return {
      id: `parsed-${Date.now()}`,
      originalQuery: query,
      commands: mockCommands,
      confidence: 0.85,
      riskLevel,
      explanation: `Parsed "${query}" into ${mockCommands.length} command(s)`,
      warnings: riskLevel === 'critical' ? ['This operation may be destructive'] : undefined,
      requiresConfirmation,
      estimatedDuration: 5000
    };
  };

  const executeCommands = async (parsed: ParsedCommand) => {
    const startTime = Date.now();

    for (const command of parsed.commands) {
      // Add command info
      addSystemMessage(`Executing: ${command.command} ${command.args.join(' ')}`);

      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock execution results
      const mockOutput = generateMockOutput(command);
      const mockAnalysis = generateMockAnalysis(command, mockOutput);

      // Add output entry
      const outputEntry: TerminalEntry = {
        id: `output-${Date.now()}`,
        type: mockAnalysis.errorDetected ? 'error' : 'output',
        content: mockOutput,
        timestamp: new Date(),
        command: parsed,
        analysis: mockAnalysis,
        executionTime: Date.now() - startTime
      };

      setEntries(prev => [...prev, outputEntry]);

      // Show follow-up suggestions
      if (mockAnalysis.followUpCommands && mockAnalysis.followUpCommands.length > 0) {
        showFollowUpSuggestions(mockAnalysis.followUpCommands);
      }
    }
  };

  const generateMockOutput = (command: Command): string => {
    switch (command.command) {
      case 'npm':
        if (command.args.includes('install')) {
          return `+ ${command.args[1]}@1.0.0\nadded 1 package in 2.543s\n\n1 package is looking for funding\n  run \`npm fund\` for details`;
        }
        if (command.args.includes('build')) {
          return `> build\n> webpack --mode=production\n\nwebpack 5.74.0 compiled successfully in 3.2s\n✓ Built in 3.2s`;
        }
        break;
      case 'ls':
        return `total 96\ndrwxr-xr-x  15 user  staff   480 Oct 15 10:30 .\ndrwxr-xr-x   8 user  staff   256 Oct 14 09:15 ..\n-rw-r--r--   1 user  staff  1024 Oct 15 10:30 package.json\ndrwxr-xr-x   3 user  staff    96 Oct 14 09:20 src\ndrwxr-xr-x   2 user  staff    64 Oct 14 09:25 dist`;
      case 'rm':
        return `rm: target: No such file or directory`;
      default:
        return `Command executed successfully`;
    }
  };

  const generateMockAnalysis = (command: Command, output: string): OutputAnalysis => {
    const hasError = output.includes('error') || output.includes('No such file');

    return {
      summary: hasError ? 'Command completed with errors' : 'Command executed successfully',
      errorDetected: hasError,
      warningsDetected: output.includes('warning') || output.includes('deprecated'),
      successIndicators: hasError ? [] : ['Command completed', 'Exit code 0'],
      failureIndicators: hasError ? ['Error in execution'] : [],
      severity: hasError ? 'error' : 'success',
      confidence: 0.9,
      keyFindings: hasError ? ['File not found'] : ['Operation successful'],
      recommendations: hasError ? ['Check file path', 'Verify permissions'] : undefined,
      followUpCommands: command.command === 'npm' && command.args.includes('install') ? [
        {
          command: 'npm',
          args: ['audit'],
          description: 'Check for vulnerabilities',
          reason: 'Security check after package installation',
          category: 'security',
          riskLevel: 'safe'
        }
      ] : undefined
    };
  };

  const showFollowUpSuggestions = (commands: FollowUpCommand[]) => {
    const suggestions = commands.map(cmd =>
      `${cmd.description} (${cmd.command} ${cmd.args.join(' ')})`
    );
    setSuggestions(suggestions);
    setShowSuggestions(true);

    // Auto-hide after 10 seconds
    setTimeout(() => setShowSuggestions(false), 10000);
  };

  const addErrorMessage = (message: string) => {
    const entry: TerminalEntry = {
      id: `error-${Date.now()}`,
      type: 'error',
      content: message,
      timestamp: new Date()
    };
    setEntries(prev => [...prev, entry]);
  };

  const handleConfirmExecution = async () => {
    if (pendingCommand) {
      setShowConfirmDialog(false);
      setPendingCommand(null);
      await executeCommands(pendingCommand);
      setIsExecuting(false);
    }
  };

  const handleCancelExecution = () => {
    setShowConfirmDialog(false);
    setPendingCommand(null);
    setIsExecuting(false);
    addSystemMessage('Command execution cancelled by user');
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-500';
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <Card className="rounded-none border-l-0 border-r-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <CardTitle className="text-lg">AI Terminal</CardTitle>
              {currentSession && (
                <Badge variant="outline" className="ml-2">
                  {currentSession.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Command History</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Terminal Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <span>Working Directory: {workingDirectory}</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span>Session: {currentSession?.id.slice(-8) || 'Not connected'}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Terminal Content */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <Tabs defaultValue="terminal" className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="terminal" className="h-full">
              <Card className="h-full rounded-none border-l-0 border-r-0 border-b-0">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Terminal Output */}
                  <ScrollArea className="flex-1 p-4 font-mono text-sm" ref={scrollAreaRef}>
                    {entries.map((entry) => (
                      <div key={entry.id} className="mb-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-muted-foreground text-xs min-w-[60px]">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>

                          {entry.type === 'input' && (
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Terminal className="h-3 w-3 text-blue-500" />
                                <span className="font-medium text-blue-600">$</span>
                                <span>{entry.content}</span>
                              </div>
                            </div>
                          )}

                          {entry.type === 'output' && (
                            <div className="flex-1">
                              <div className="flex items-start space-x-2">
                                {entry.analysis && getSeverityIcon(entry.analysis.severity)}
                                <div className="flex-1">
                                  <pre className="whitespace-pre-wrap text-sm">{entry.content}</pre>
                                  {entry.analysis && (
                                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">Analysis</span>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(entry.analysis.confidence * 100)}% confident
                                        </Badge>
                                      </div>
                                      <p>{entry.analysis.summary}</p>
                                      {entry.analysis.keyFindings.length > 0 && (
                                        <div className="mt-1">
                                          <strong>Key Findings:</strong>
                                          <ul className="list-disc list-inside ml-2">
                                            {entry.analysis.keyFindings.map((finding, idx) => (
                                              <li key={idx}>{finding}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(entry.content)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {entry.type === 'error' && (
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-red-600">{entry.content}</span>
                              </div>
                            </div>
                          )}

                          {entry.type === 'system' && (
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Zap className="h-3 w-3 text-purple-500" />
                                <span className="text-muted-foreground italic">{entry.content}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isExecuting && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-gray-600" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Follow-up Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="border-t p-2">
                      <div className="text-xs text-muted-foreground mb-2">Suggested follow-up commands:</div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 3).map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => setInput(suggestion.split('(')[0].trim())}
                          >
                            {suggestion.split('(')[0].trim()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Terminal className="h-4 w-4" />
                        <span>$</span>
                      </div>
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
                        placeholder="Type your command in natural language..."
                        disabled={isExecuting}
                        className="font-mono"
                      />
                      <Button
                        onClick={handleInputSubmit}
                        disabled={isExecuting || !input.trim()}
                        size="sm"
                      >
                        {isExecuting ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="h-full">
              <Card className="h-full rounded-none border-l-0 border-r-0 border-b-0">
                <CardContent className="p-4">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>Detailed analysis view will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="h-full">
              <Card className="h-full rounded-none border-l-0 border-r-0 border-b-0">
                <CardContent className="p-4">
                  <div className="text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2" />
                    <p>Command history will be shown here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <span>Confirm Command Execution</span>
            </DialogTitle>
            <DialogDescription>
              This command requires confirmation due to its risk level.
            </DialogDescription>
          </DialogHeader>

          {pendingCommand && (
            <div className="space-y-4">
              <div>
                <div className="font-medium">Original Query:</div>
                <div className="text-sm text-muted-foreground">{pendingCommand.originalQuery}</div>
              </div>

              <div>
                <div className="font-medium">Commands to Execute:</div>
                <div className="space-y-2 mt-2">
                  {pendingCommand.commands.map((cmd, idx) => (
                    <div key={idx} className="bg-muted p-2 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <code>{cmd.command} {cmd.args.join(' ')}</code>
                        <Badge className={getRiskLevelColor(cmd.riskLevel)}>
                          {cmd.riskLevel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cmd.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pendingCommand.warnings && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {pendingCommand.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelExecution}>
              Cancel
            </Button>
            <Button onClick={handleConfirmExecution} className="bg-orange-500 hover:bg-orange-600">
              Execute Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AITerminal;