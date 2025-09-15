import React, { useState, useEffect } from 'react';
import { agentManager, Agent, AgentTask } from '../services/agents/AgentManager';
import './AgentDashboard.css';

interface AgentDashboardProps {
  onClose: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onClose }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, inProgress: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'create'>('agents');
  const [newTask, setNewTask] = useState({
    type: 'code_generation' as AgentTask['type'],
    description: '',
    language: 'typescript',
    framework: '',
    priority: 'medium' as AgentTask['priority']
  });

  useEffect(() => {
    // Initial data load
    updateData();

    // Listen for agent events
    const handleTaskEvent = () => updateData();

    agentManager.on('taskCreated', handleTaskEvent);
    agentManager.on('taskAssigned', handleTaskEvent);
    agentManager.on('taskCompleted', handleTaskEvent);
    agentManager.on('taskCancelled', handleTaskEvent);

    return () => {
      agentManager.removeAllListeners();
    };
  }, []);

  const updateData = () => {
    setAgents(agentManager.getAgents());
    setTasks(agentManager.getTasks());
    setQueueStatus(agentManager.getQueueStatus());
  };

  const handleCreateTask = () => {
    if (!newTask.description.trim()) {
      alert('Please provide a task description');
      return;
    }

    agentManager.createTask({
      type: newTask.type,
      description: newTask.description,
      context: {
        language: newTask.language,
        framework: newTask.framework || undefined
      },
      priority: newTask.priority
    });

    // Reset form
    setNewTask({
      type: 'code_generation',
      description: '',
      language: 'typescript',
      framework: '',
      priority: 'medium'
    });

    setActiveTab('tasks');
  };

  const handleCancelTask = (taskId: string) => {
    agentManager.cancelTask(taskId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'failed': return '#e74c3c';
      case 'cancelled': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="agent-dashboard">
      <div className="agent-dashboard-header">
        <h2>🤖 AI Agents</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="agent-dashboard-tabs">
        <button
          className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          Agents ({agents.filter(a => a.isActive).length}/{agents.length})
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({queueStatus.pending + queueStatus.inProgress})
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Task
        </button>
      </div>

      <div className="agent-dashboard-content">
        {activeTab === 'agents' && (
          <div className="agents-tab">
            <div className="queue-status">
              <div className="status-item">
                <span className="status-label">Pending:</span>
                <span className="status-value" style={{ color: '#f39c12' }}>{queueStatus.pending}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Active:</span>
                <span className="status-value" style={{ color: '#3498db' }}>{queueStatus.inProgress}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Completed:</span>
                <span className="status-value" style={{ color: '#27ae60' }}>{queueStatus.completed}</span>
              </div>
            </div>

            <div className="agents-list">
              {agents.map(agent => (
                <div key={agent.id} className={`agent-card ${agent.isActive ? 'active' : ''}`}>
                  <div className="agent-header">
                    <h3>{agent.name}</h3>
                    <span className={`agent-status ${agent.isActive ? 'active' : 'idle'}`}>
                      {agent.isActive ? '🟢 Active' : '⚪ Idle'}
                    </span>
                  </div>
                  <p className="agent-type">{agent.type}</p>
                  <div className="agent-stats">
                    <span>Tasks: {agent.tasksCompleted}</span>
                    <span>Success: {(agent.successRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="agent-specialization">
                    {agent.specialization.map(spec => (
                      <span key={spec} className="spec-tag">{spec}</span>
                    ))}
                  </div>
                  {agent.currentTask && (
                    <div className="current-task">
                      Working on: {agent.currentTask.substring(0, 20)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            <div className="tasks-list">
              {tasks.slice().reverse().map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div className="task-title">
                      <span className="task-type">{task.type.replace('_', ' ')}</span>
                      <span
                        className="task-priority"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <span
                      className="task-status"
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="task-description">{task.description}</p>

                  <div className="task-context">
                    <span>Language: {task.context.language}</span>
                    {task.context.framework && (
                      <span>Framework: {task.context.framework}</span>
                    )}
                  </div>

                  {task.agent && (
                    <div className="task-agent">
                      Assigned to: {agents.find(a => a.id === task.agent)?.name || task.agent}
                    </div>
                  )}

                  {task.result && (
                    <div className="task-result">
                      <strong>Result:</strong>
                      <pre>{task.result}</pre>
                    </div>
                  )}

                  <div className="task-actions">
                    {(task.status === 'pending' || task.status === 'in_progress') && (
                      <button
                        onClick={() => handleCancelTask(task.id)}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    )}
                    <span className="task-time">
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-task-tab">
            <div className="create-task-form">
              <div className="form-group">
                <label>Task Type:</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value as AgentTask['type']})}
                >
                  <option value="code_generation">Code Generation</option>
                  <option value="code_review">Code Review</option>
                  <option value="bug_fix">Bug Fix</option>
                  <option value="optimization">Optimization</option>
                  <option value="documentation">Documentation</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Describe what you need the agent to do..."
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Language:</label>
                  <select
                    value={newTask.language}
                    onChange={(e) => setNewTask({...newTask, language: e.target.value})}
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Framework (optional):</label>
                  <input
                    type="text"
                    value={newTask.framework}
                    onChange={(e) => setNewTask({...newTask, framework: e.target.value})}
                    placeholder="React, Express, Django..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as AgentTask['priority']})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <button onClick={handleCreateTask} className="create-task-button">
                Create Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};