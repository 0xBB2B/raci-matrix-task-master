import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Task, TaskStatus, ProjectSuggestion, RaciRoles } from './types';
import { TaskCard } from './components/TaskCard';
import { Icons } from './constants';
import { Modal } from './components/Modal';
import { RoleSelect } from './components/RoleSelect';
import { generateRaciPlan } from './services/geminiService';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Launch Marketing Campaign',
    description: 'Prepare assets and schedule social media posts for Q3 product launch.',
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // Due in 5 days
    roles: {
      responsible: ['Sarah', 'Mike'],
      accountable: 'Jessica',
      consulted: ['Dev Team', 'Legal'],
      informed: ['Sales Team']
    }
  },
  {
      id: '2',
      title: 'Update Privacy Policy',
      description: 'Review new GDPR compliance requirements and update the website.',
      status: TaskStatus.TODO,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], // Overdue
      roles: {
        responsible: ['Legal'],
        accountable: 'CEO',
        consulted: ['CTO'],
        informed: ['All Staff']
      }
  }
];

const initialRoster = [
    'Sarah', 'Mike', 'Jessica', 'Steve', 'Amanda', 
    'CEO', 'CTO', 'CFO', 
    'Dev Team', 'Design Team', 'Marketing', 'Legal', 'Sales Team', 'All Staff'
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('raci_tasks');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse tasks from localStorage", e);
            }
        }
    }
    return initialTasks;
  });
  
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  
  // Roster State
  const [roster, setRoster] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('raci_roster');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse roster from localStorage", e);
            }
        }
    }
    return initialRoster.sort();
  });

  // Save to LocalStorage effects
  useEffect(() => {
    localStorage.setItem('raci_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('raci_roster', JSON.stringify(roster));
  }, [roster]);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit/Create State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Roster Management State
  const [newMemberName, setNewMemberName] = useState('');

  // Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Empty form state
  const defaultFormState: Task = {
      id: '',
      title: '',
      description: '',
      status: TaskStatus.TODO,
      dueDate: '',
      roles: { responsible: [], accountable: '', consulted: [], informed: [] }
  };
  const [formData, setFormData] = useState<Task>(defaultFormState);

  // Handlers
  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;

      // If archiving, save the current status as previousStatus
      if (status === TaskStatus.ARCHIVED) {
        return { ...t, status, previousStatus: t.status };
      }

      // If restoring or changing normally, just update status
      // We clear previousStatus to keep the object clean
      return { ...t, status, previousStatus: undefined };
    }));
  };

  const handleTaskUpdate = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...updates };
    }));
  };

  const handleAiGenerate = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      try {
          const suggestions = await generateRaciPlan(aiPrompt);
          const newTasks: Task[] = suggestions.map(s => ({
              id: crypto.randomUUID(),
              title: s.title,
              description: s.description,
              status: TaskStatus.TODO,
              roles: s.roles
          }));
          
          setTasks(prev => [...prev, ...newTasks]);
          setIsAiModalOpen(false);
          setAiPrompt('');
      } catch (e) {
          console.error(e);
          alert("Failed to generate plan. Please try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const openEditModal = (task?: Task) => {
      if (task) {
          setEditingTask(task);
          setFormData(task);
      } else {
          setEditingTask(null);
          setFormData({ ...defaultFormState, id: crypto.randomUUID() });
      }
      setIsTaskModalOpen(true);
  };

  const saveTask = () => {
      if (editingTask) {
          setTasks(prev => prev.map(t => t.id === editingTask.id ? formData : t));
      } else {
          setTasks(prev => [...prev, formData]);
      }
      setIsTaskModalOpen(false);
  };

  const addRosterMember = () => {
      if (newMemberName.trim() && !roster.includes(newMemberName.trim())) {
          setRoster(prev => [...prev, newMemberName.trim()].sort());
          setNewMemberName('');
      }
  };

  const removeRosterMember = (name: string) => {
      setRoster(prev => prev.filter(m => m !== name));
  };

  // Import/Export Handlers
  const handleExport = () => {
    const data = {
        tasks,
        roster,
        exportedAt: new Date().toISOString(),
        version: 1
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raci-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const json = JSON.parse(content);
              
              if (json && Array.isArray(json.tasks) && Array.isArray(json.roster)) {
                  if (window.confirm("This will overwrite your current tasks and team roster. Are you sure you want to continue?")) {
                      setTasks(json.tasks);
                      setRoster(json.roster);
                  }
              } else {
                  alert("Invalid file format: Missing 'tasks' or 'roster' arrays.");
              }
          } catch (error) {
              console.error("Import error:", error);
              alert("Failed to parse the file. Please ensure it is a valid JSON file.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };


  // Filter & Sort Logic
  const filteredTasks = tasks
    .filter(t => {
      if (filterStatus === TaskStatus.ARCHIVED) {
          return t.status === TaskStatus.ARCHIVED;
      }
      if (filterStatus === 'ALL') {
          return t.status !== TaskStatus.ARCHIVED;
      }
      return t.status === filterStatus;
    })
    .sort((a, b) => {
        // Sort by due date ascending (earliest first)
        if (a.dueDate && b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
        }
        // Tasks with due dates come first
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        // Keep original order otherwise
        return 0;
    });

  return (
    <div className="min-h-screen pb-20 transition-colors duration-200 bg-gray-50 dark:bg-slate-900">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Icons.Grid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">RACI Task Master</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {/* Data Tools */}
             <div className="flex items-center gap-1 border-r border-gray-200 dark:border-slate-700 pr-2 mr-1">
                <button
                    onClick={handleImportClick}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Import Data"
                >
                    <Icons.ArrowUpTray className="w-5 h-5" />
                </button>
                <button
                    onClick={handleExport}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Export Data"
                >
                    <Icons.ArrowDownTray className="w-5 h-5" />
                </button>
             </div>

            <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
            </button>
            <button
                onClick={() => setIsRosterModalOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Manage Team"
            >
                <Icons.Users className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span>AI Assist</span>
            </button>
            <button 
                onClick={() => openEditModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
            >
                <Icons.Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-x-auto">
             {(['ALL', TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] as const).map(status => (
                 <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        filterStatus === status 
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                 >
                     {status.replace('_', ' ')}
                 </button>
             ))}
             {/* Divider */}
             <div className="w-px bg-gray-200 dark:bg-slate-700 mx-1 h-6 self-center"></div>
             
             {/* Archive Filter */}
             <button
                onClick={() => setFilterStatus(TaskStatus.ARCHIVED)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    filterStatus === TaskStatus.ARCHIVED
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
             >
                 <Icons.ArchiveBox className="w-4 h-4" />
                 <span>Archived</span>
             </button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {filteredTasks.length} Tasks
          </div>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-600">
                    <div className="mx-auto w-12 h-12 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        {filterStatus === TaskStatus.ARCHIVED ? (
                            <Icons.ArchiveBox className="w-6 h-6 text-gray-400 dark:text-slate-400" />
                        ) : (
                            <Icons.List className="w-6 h-6 text-gray-400 dark:text-slate-400" />
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {filterStatus === TaskStatus.ARCHIVED 
                            ? 'Archived tasks will appear here.'
                            : 'Get started by creating a new task or using AI.'}
                    </p>
                </div>
            ) : (
                filteredTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onEdit={openEditModal}
                        onTaskUpdate={handleTaskUpdate}
                    />
                ))
            )}
        </div>
      </main>

      {/* Mobile Floating Action Button for AI */}
      <button 
        onClick={() => setIsAiModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 transition-transform"
      >
          <Icons.Sparkles className="w-6 h-6" />
      </button>

      {/* AI Modal */}
      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        title="AI Project Planner"
      >
          <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg text-indigo-800 dark:text-indigo-200 text-sm">
                  <p>Describe your project goal, and the AI will break it down into actionable tasks and assign RACI roles automatically.</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Project Goal / Description</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="e.g., Plan a company holiday party for 50 employees..."
                  />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                  >
                      Cancel
                  </button>
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                      {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Thinking...
                          </>
                      ) : (
                          <>
                            <Icons.Sparkles className="w-4 h-4" />
                            Generate Plan
                          </>
                      )}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Roster Modal */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title="Manage Team Roster"
      >
          <div className="space-y-6">
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRosterMember()}
                    className="flex-1 p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter name (e.g. Alice, Dev Team)"
                  />
                  <button 
                    onClick={addRosterMember}
                    disabled={!newMemberName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                      Add
                  </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                  {roster.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-slate-400">Roster is empty.</div>
                  ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                          {roster.map(member => (
                              <li key={member} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{member}</span>
                                  <button 
                                    onClick={() => removeRosterMember(member)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Remove"
                                  >
                                      <Icons.Trash className="w-4 h-4" />
                                  </button>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>

              <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setIsRosterModalOpen(false)}
                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                      Done
                  </button>
              </div>
          </div>
      </Modal>

      {/* Task Edit/Create Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? "Edit Task" : "New Task"}
      >
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Task Title</label>
                <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter task title"
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Due Date</label>
                     <input 
                        type="date" 
                        value={formData.dueDate || ''}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24"
                    placeholder="Enter task details"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-slate-700">
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Responsible (R)
                    </h4>
                    <RoleSelect 
                        multiple
                        value={formData.roles.responsible}
                        options={roster}
                        onChange={(val) => setFormData(prev => ({ ...prev, roles: { ...prev.roles, responsible: val } }))}
                        placeholder="Select people..."
                    />
                    <p className="text-xs text-gray-400">Who does the work?</p>
                </div>
                
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Accountable (A)
                    </h4>
                    <RoleSelect 
                        value={formData.roles.accountable}
                        options={roster}
                        onChange={(val) => setFormData(prev => ({ ...prev, roles: { ...prev.roles, accountable: val } }))}
                        placeholder="Select person..."
                    />
                     <p className="text-xs text-gray-400">The "One Throat to Choke"</p>
                </div>

                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Consulted (C)
                    </h4>
                    <RoleSelect 
                        multiple
                        value={formData.roles.consulted}
                        options={roster}
                        onChange={(val) => setFormData(prev => ({ ...prev, roles: { ...prev.roles, consulted: val } }))}
                        placeholder="Select people..."
                    />
                     <p className="text-xs text-gray-400">Two-way communication</p>
                </div>

                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Informed (I)
                    </h4>
                    <RoleSelect 
                        multiple
                        value={formData.roles.informed}
                        options={roster}
                        onChange={(val) => setFormData(prev => ({ ...prev, roles: { ...prev.roles, informed: val } }))}
                        placeholder="Select people..."
                    />
                     <p className="text-xs text-gray-400">One-way communication</p>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
                <button 
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={saveTask}
                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg font-medium"
                >
                    Save Task
                </button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

export default App;