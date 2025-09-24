import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Code,
  GitBranch,
  Clock,
  Target,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Download,
  Filter,
  Calendar,
  Zap,
  Award,
  Globe,
  Database,
  Terminal,
  FileText,
  MessageSquare
} from 'lucide-react';

// Types
interface TeamMetrics {
  teamId: string;
  teamName: string;
  members: number;
  activeMembers: number;
  productivity: number;
  codeQuality: number;
  velocity: number;
  burnRate: number;
  satisfaction: number;
}

interface ProductivityMetrics {
  period: string;
  linesOfCode: number;
  commits: number;
  pullRequests: number;
  codeReviews: number;
  bugsFixed: number;
  featuresCompleted: number;
  testsCovered: number;
  deployments: number;
}

interface CodeQualityMetrics {
  maintainabilityIndex: number;
  technicalDebt: number;
  codeComplexity: number;
  testCoverage: number;
  duplication: number;
  vulnerabilities: number;
  codeSmells: number;
  securityHotspots: number;
}

interface CollaborationMetrics {
  sessionsCount: number;
  averageParticipants: number;
  totalDuration: number;
  codeReviews: number;
  commentsAdded: number;
  issuesResolved: number;
  pairProgrammingHours: number;
  knowledgeSharing: number;
}

interface ProjectMetrics {
  projectId: string;
  projectName: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  team: string;
  dueDate: string;
  budget: number;
  spent: number;
  velocity: number;
  riskScore: number;
}

interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceScore: number;
  securityEvents: number;
  policyViolations: number;
  accessReviews: number;
  dataClassification: {
    public: number;
    internal: number;
    confidential: number;
    restricted: number;
  };
}

interface UserActivity {
  userId: string;
  userName: string;
  avatar?: string;
  lastActive: Date;
  sessionsToday: number;
  linesOfCode: number;
  commits: number;
  reviews: number;
  productivity: number;
  status: 'active' | 'idle' | 'offline';
}

const EnterpriseAnalyticsDashboard: React.FC = () => {
  // State
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from APIs
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 245,
      activeUsers: 189,
      totalProjects: 42,
      activeProjects: 23,
      codeCommits: 1847,
      pullRequests: 312,
      deployments: 89,
      uptime: 99.97
    },
    teamMetrics: [] as TeamMetrics[],
    productivityData: [] as ProductivityMetrics[],
    codeQuality: {} as CodeQualityMetrics,
    collaboration: {} as CollaborationMetrics,
    projects: [] as ProjectMetrics[],
    security: {} as SecurityMetrics,
    userActivity: [] as UserActivity[]
  });

  // Load data
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedTeam, selectedProject]);

  const loadDashboardData = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data generation
    setDashboardData({
      overview: {
        totalUsers: 245,
        activeUsers: 189,
        totalProjects: 42,
        activeProjects: 23,
        codeCommits: 1847,
        pullRequests: 312,
        deployments: 89,
        uptime: 99.97
      },
      teamMetrics: generateMockTeamMetrics(),
      productivityData: generateMockProductivityData(),
      codeQuality: generateMockCodeQuality(),
      collaboration: generateMockCollaboration(),
      projects: generateMockProjects(),
      security: generateMockSecurity(),
      userActivity: generateMockUserActivity()
    });

    setLoading(false);
  };

  const generateMockTeamMetrics = (): TeamMetrics[] => [
    {
      teamId: 'frontend',
      teamName: 'Frontend Team',
      members: 12,
      activeMembers: 10,
      productivity: 87,
      codeQuality: 92,
      velocity: 34,
      burnRate: 78,
      satisfaction: 94
    },
    {
      teamId: 'backend',
      teamName: 'Backend Team',
      members: 15,
      activeMembers: 13,
      productivity: 91,
      codeQuality: 89,
      velocity: 42,
      burnRate: 82,
      satisfaction: 88
    },
    {
      teamId: 'devops',
      teamName: 'DevOps Team',
      members: 8,
      activeMembers: 7,
      productivity: 85,
      codeQuality: 95,
      velocity: 28,
      burnRate: 75,
      satisfaction: 96
    }
  ];

  const generateMockProductivityData = (): ProductivityMetrics[] => [
    { period: 'Mon', linesOfCode: 2340, commits: 45, pullRequests: 12, codeReviews: 23, bugsFixed: 8, featuresCompleted: 3, testsCovered: 89, deployments: 2 },
    { period: 'Tue', linesOfCode: 2150, commits: 52, pullRequests: 15, codeReviews: 28, bugsFixed: 12, featuresCompleted: 5, testsCovered: 91, deployments: 3 },
    { period: 'Wed', linesOfCode: 2890, commits: 38, pullRequests: 8, codeReviews: 19, bugsFixed: 6, featuresCompleted: 2, testsCovered: 87, deployments: 1 },
    { period: 'Thu', linesOfCode: 2456, commits: 47, pullRequests: 18, codeReviews: 31, bugsFixed: 15, featuresCompleted: 7, testsCovered: 93, deployments: 4 },
    { period: 'Fri', linesOfCode: 1987, commits: 29, pullRequests: 9, codeReviews: 16, bugsFixed: 4, featuresCompleted: 1, testsCovered: 85, deployments: 1 },
    { period: 'Sat', linesOfCode: 876, commits: 12, pullRequests: 3, codeReviews: 7, bugsFixed: 2, featuresCompleted: 0, testsCovered: 78, deployments: 0 },
    { period: 'Sun', linesOfCode: 534, commits: 8, pullRequests: 2, codeReviews: 4, bugsFixed: 1, featuresCompleted: 0, testsCovered: 82, deployments: 0 }
  ];

  const generateMockCodeQuality = (): CodeQualityMetrics => ({
    maintainabilityIndex: 78,
    technicalDebt: 23,
    codeComplexity: 3.2,
    testCoverage: 87,
    duplication: 5.4,
    vulnerabilities: 3,
    codeSmells: 45,
    securityHotspots: 8
  });

  const generateMockCollaboration = (): CollaborationMetrics => ({
    sessionsCount: 156,
    averageParticipants: 3.2,
    totalDuration: 2340, // minutes
    codeReviews: 89,
    commentsAdded: 445,
    issuesResolved: 67,
    pairProgrammingHours: 234,
    knowledgeSharing: 78
  });

  const generateMockProjects = (): ProjectMetrics[] => [
    {
      projectId: 'proj1',
      projectName: 'E-commerce Platform',
      status: 'active',
      progress: 67,
      health: 'good',
      team: 'Frontend Team',
      dueDate: '2024-12-15',
      budget: 250000,
      spent: 167500,
      velocity: 34,
      riskScore: 0.3
    },
    {
      projectId: 'proj2',
      projectName: 'Analytics Dashboard',
      status: 'active',
      progress: 89,
      health: 'excellent',
      team: 'Backend Team',
      dueDate: '2024-11-30',
      budget: 180000,
      spent: 160200,
      velocity: 42,
      riskScore: 0.1
    }
  ];

  const generateMockSecurity = (): SecurityMetrics => ({
    vulnerabilities: {
      critical: 2,
      high: 5,
      medium: 12,
      low: 23
    },
    complianceScore: 94,
    securityEvents: 234,
    policyViolations: 8,
    accessReviews: 45,
    dataClassification: {
      public: 234,
      internal: 567,
      confidential: 123,
      restricted: 45
    }
  });

  const generateMockUserActivity = (): UserActivity[] => [
    {
      userId: 'user1',
      userName: 'John Doe',
      lastActive: new Date(Date.now() - 300000),
      sessionsToday: 3,
      linesOfCode: 234,
      commits: 5,
      reviews: 2,
      productivity: 87,
      status: 'active'
    },
    {
      userId: 'user2',
      userName: 'Jane Smith',
      lastActive: new Date(Date.now() - 600000),
      sessionsToday: 2,
      linesOfCode: 456,
      commits: 8,
      reviews: 4,
      productivity: 92,
      status: 'idle'
    }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border border-gray-300 rounded-full border-t-gray-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights into your organization&apos;s development metrics
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last Day</SelectItem>
                <SelectItem value="7d">Last Week</SelectItem>
                <SelectItem value="30d">Last Month</SelectItem>
                <SelectItem value="90d">Last Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="frontend">Frontend Team</SelectItem>
                <SelectItem value="backend">Backend Team</SelectItem>
                <SelectItem value="devops">DevOps Team</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  of {dashboardData.overview.totalUsers} total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  of {dashboardData.overview.totalProjects} total projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Code Commits</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.codeCommits.toLocaleString()}</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.uptime}%</div>
                <p className="text-xs text-green-600">Excellent performance</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="productivity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="quality">Code Quality</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="productivity" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Development Activity</CardTitle>
                    <CardDescription>Lines of code and commits over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dashboardData.productivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="linesOfCode"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="commits"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pull Requests & Reviews</CardTitle>
                    <CardDescription>Code review activity and velocity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.productivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="pullRequests" fill="#8884d8" />
                        <Bar dataKey="codeReviews" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Current developer activity and productivity</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Developer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sessions Today</TableHead>
                        <TableHead>Lines of Code</TableHead>
                        <TableHead>Commits</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Productivity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.userActivity.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.userName.charAt(0)}
                            </div>
                            <span>{user.userName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === 'active' ? 'default' :
                                user.status === 'idle' ? 'secondary' : 'outline'
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.sessionsToday}</TableCell>
                          <TableCell>{user.linesOfCode.toLocaleString()}</TableCell>
                          <TableCell>{user.commits}</TableCell>
                          <TableCell>{user.reviews}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={user.productivity} className="w-20" />
                              <span className="text-sm">{user.productivity}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {dashboardData.teamMetrics.map((team) => (
                  <Card key={team.teamId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {team.teamName}
                        <Badge variant="outline">{team.activeMembers}/{team.members}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Productivity</span>
                          <span>{team.productivity}%</span>
                        </div>
                        <Progress value={team.productivity} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Code Quality</span>
                          <span>{team.codeQuality}%</span>
                        </div>
                        <Progress value={team.codeQuality} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Velocity</span>
                          <span>{team.velocity}</span>
                        </div>
                        <Progress value={(team.velocity / 50) * 100} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Satisfaction</span>
                          <span>{team.satisfaction}%</span>
                        </div>
                        <Progress value={team.satisfaction} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Quality Metrics</CardTitle>
                    <CardDescription>Overall health of the codebase</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Maintainability Index</span>
                        <span>{dashboardData.codeQuality.maintainabilityIndex}%</span>
                      </div>
                      <Progress value={dashboardData.codeQuality.maintainabilityIndex} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Test Coverage</span>
                        <span>{dashboardData.codeQuality.testCoverage}%</span>
                      </div>
                      <Progress value={dashboardData.codeQuality.testCoverage} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Technical Debt</span>
                        <span>{dashboardData.codeQuality.technicalDebt}%</span>
                      </div>
                      <Progress
                        value={dashboardData.codeQuality.technicalDebt}
                        className="[&>div]:bg-red-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Code Duplication</span>
                        <span>{dashboardData.codeQuality.duplication}%</span>
                      </div>
                      <Progress
                        value={dashboardData.codeQuality.duplication}
                        className="[&>div]:bg-yellow-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security & Issues</CardTitle>
                    <CardDescription>Vulnerabilities and code smells</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {dashboardData.codeQuality.vulnerabilities}
                        </div>
                        <div className="text-sm text-muted-foreground">Vulnerabilities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {dashboardData.codeQuality.codeSmells}
                        </div>
                        <div className="text-sm text-muted-foreground">Code Smells</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {dashboardData.codeQuality.securityHotspots}
                        </div>
                        <div className="text-sm text-muted-foreground">Security Hotspots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardData.codeQuality.codeComplexity}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Complexity</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="collaboration" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Sessions</CardTitle>
                    <CardDescription>Real-time collaboration activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {dashboardData.collaboration.sessionsCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {dashboardData.collaboration.averageParticipants}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.round(dashboardData.collaboration.totalDuration / 60)}h
                        </div>
                        <div className="text-sm text-muted-foreground">Total Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {dashboardData.collaboration.pairProgrammingHours}h
                        </div>
                        <div className="text-sm text-muted-foreground">Pair Programming</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication Metrics</CardTitle>
                    <CardDescription>Team communication and code reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Comments Added
                        </span>
                        <span className="font-semibold">{dashboardData.collaboration.commentsAdded}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Code Reviews
                        </span>
                        <span className="font-semibold">{dashboardData.collaboration.codeReviews}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Issues Resolved
                        </span>
                        <span className="font-semibold">{dashboardData.collaboration.issuesResolved}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Knowledge Sharing Score
                        </span>
                        <span className="font-semibold">{dashboardData.collaboration.knowledgeSharing}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                  <CardDescription>Active projects and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.projects.map((project) => (
                        <TableRow key={project.projectId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{project.projectName}</div>
                              <Badge
                                variant={
                                  project.status === 'active' ? 'default' :
                                  project.status === 'completed' ? 'secondary' : 'outline'
                                }
                                className="text-xs mt-1"
                              >
                                {project.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{project.team}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={project.progress} className="w-20" />
                              <span className="text-sm">{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center space-x-1 ${getHealthColor(project.health)}`}>
                              {getHealthIcon(project.health)}
                              <span className="capitalize text-sm">{project.health}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</div>
                              <Progress value={(project.spent / project.budget) * 100} className="w-16 mt-1" />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{project.dueDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.riskScore < 0.3 ? 'secondary' :
                                project.riskScore < 0.7 ? 'default' : 'destructive'
                              }
                            >
                              {project.riskScore < 0.3 ? 'Low' :
                               project.riskScore < 0.7 ? 'Medium' : 'High'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Vulnerabilities</CardTitle>
                    <CardDescription>Current security issues by severity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Critical', value: dashboardData.security.vulnerabilities.critical, color: '#dc2626' },
                            { name: 'High', value: dashboardData.security.vulnerabilities.high, color: '#ea580c' },
                            { name: 'Medium', value: dashboardData.security.vulnerabilities.medium, color: '#ca8a04' },
                            { name: 'Low', value: dashboardData.security.vulnerabilities.low, color: '#16a34a' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#dc2626', '#ea580c', '#ca8a04', '#16a34a'][index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance & Governance</CardTitle>
                    <CardDescription>Security metrics and compliance status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Compliance Score
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={dashboardData.security.complianceScore} className="w-20" />
                        <span className="font-semibold">{dashboardData.security.complianceScore}%</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Security Events (7 days)</span>
                        <span>{dashboardData.security.securityEvents}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Policy Violations</span>
                        <span className="text-red-600">{dashboardData.security.policyViolations}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Access Reviews Completed</span>
                        <span className="text-green-600">{dashboardData.security.accessReviews}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Data Classification</CardTitle>
                  <CardDescription>Breakdown of data by classification level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.security.dataClassification.public}
                      </div>
                      <div className="text-sm text-muted-foreground">Public</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.security.dataClassification.internal}
                      </div>
                      <div className="text-sm text-muted-foreground">Internal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.security.dataClassification.confidential}
                      </div>
                      <div className="text-sm text-muted-foreground">Confidential</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.security.dataClassification.restricted}
                      </div>
                      <div className="text-sm text-muted-foreground">Restricted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default EnterpriseAnalyticsDashboard;