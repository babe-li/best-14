/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon, 
  Calendar,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Tag,
  Flag,
  Trash2,
  X,
  Target,
  Palette,
  Sliders
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type Task, type TaskPriority, type TaskStatus, type TaskCategory, type User as UserType, type Student } from '../types';
import { cn } from '../lib/utils';

export const Tasks = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [priorityColors, setPriorityColors] = useState<Record<TaskPriority, { bg: string; text: string; border: string }>>(() => {
    const currentDb = storageService.getDB();
    return currentDb.settings?.priorityColors || {
      Low: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
      Medium: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
      High: { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
      Urgent: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' }
    };
  });

  const savePriorityColors = (newColors: any) => {
    setPriorityColors(newColors);
    const currentDb = storageService.getDB();
    if (!currentDb.settings) {
      currentDb.settings = { sections: [], gradingScales: [] };
    }
    currentDb.settings.priorityColors = newColors;
    storageService.saveDB(currentDb);
    setDb(currentDb);
  };
  
  const categories: TaskCategory[] = [
    'Academic', 
    'Administrative', 
    'Grading', 
    'Lesson Planning', 
    'Student Follow-up', 
    'Other'
  ];

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Academic',
    assigneeType: 'student',
    completionPercentage: 0
  });

  useEffect(() => {
    setDb(storageService.getDB());
  }, []);

  const tasks = db.tasks || [];
  
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : 
                      activeTab === 'pending' ? t.status !== 'Completed' : 
                      t.status === 'Completed';
    const matchesCategory = selectedCategory === 'all' ? true : t.category === selectedCategory;
    const matchesAssignee = selectedAssignee === 'all' ? true : t.assigneeId === selectedAssignee;
    const matchesPriority = selectedPriority === 'all' ? true : t.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' ? true : t.status === selectedStatus;
    
    // Visibility: Admins see all, teachers see theirs or what's assigned to them/their students
    const hasAccess = currentUser?.role === 'admin' || t.creatorId === currentUser?.id || t.assigneeId === currentUser?.id;
    
    return matchesSearch && matchesTab && matchesCategory && matchesAssignee && matchesPriority && matchesStatus && hasAccess;
  });

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newDb = { ...db };
    if (!newDb.tasks) newDb.tasks = [];

    const percentage = Number(formData.completionPercentage) || 0;
    const calculatedStatus = percentage === 100 ? 'Completed' : 
                            percentage > 0 ? 'In Progress' : 'Pending';

    if (editingTask) {
      newDb.tasks = newDb.tasks.map(t => t.id === editingTask.id ? {
        ...t,
        ...formData,
        status: calculatedStatus,
        updatedAt: new Date().toISOString()
      } as Task : t);
    } else {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: formData.title || '',
        description: formData.description || '',
        priority: formData.priority || 'Medium',
        status: calculatedStatus,
        dueDate: formData.dueDate || '',
        creatorId: currentUser.id,
        assigneeId: formData.assigneeId || '',
        assigneeType: formData.assigneeType || 'student',
        category: formData.category || 'Academic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completionPercentage: percentage
      };
      newDb.tasks.push(newTask);
    }

    storageService.saveDB(newDb);
    setDb(newDb);
    setIsModalOpen(false);
    resetForm();
  };

  const updateStatus = (taskId: string, status: TaskStatus) => {
    const newDb = { ...db };
    newDb.tasks = newDb.tasks.map(t => t.id === taskId ? {
      ...t,
      status,
      completionPercentage: status === 'Completed' ? 100 : (status === 'In Progress' ? Math.max(t.completionPercentage, 10) : 0),
      updatedAt: new Date().toISOString()
    } : t);
    storageService.saveDB(newDb);
    setDb(newDb);
  };

  const updatePercentage = (taskId: string, percentage: number) => {
    const newDb = { ...db };
    newDb.tasks = newDb.tasks.map(t => t.id === taskId ? {
      ...t,
      completionPercentage: percentage,
      status: percentage === 100 ? 'Completed' : percentage > 0 ? 'In Progress' : 'Pending',
      updatedAt: new Date().toISOString()
    } : t);
    storageService.saveDB(newDb);
    setDb(newDb);
  };

  const deleteTask = (taskId: string) => {
    if (confirm('Permanently redact this task from the protocol?')) {
      const newDb = { ...db };
      newDb.tasks = newDb.tasks.filter(t => t.id !== taskId);
      storageService.saveDB(newDb);
      setDb(newDb);
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Academic',
      assigneeType: 'student',
      completionPercentage: 0
    });
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent': return 'bg-red-50 text-red-600 border-red-100';
      case 'High': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Medium': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Workflow & Tasks</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic flex items-center gap-2">
            <ClipboardList size={14} className="text-primary" />
            Operational Directives & Administrative Progress Tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setIsConfigOpen(!isConfigOpen)}
             className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl flex items-center gap-2.5 font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm"
          >
             <Palette size={16} className="text-primary" />
             Configure Badge Colors
          </button>
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Create New Task
          </button>
        </div>
      </div>

      {/* Expandable Priority Color Configurer */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xl"
          >
             <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sliders size={16} className="text-primary" />
                      Configure Task Priority Badge Styles
                   </h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      Customize dynamic background, border, and text colors stored in the server database
                   </p>
                </div>
                <button 
                   onClick={() => setIsConfigOpen(false)}
                   className="p-1 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-950 font-black text-[9px] uppercase tracking-wider border border-slate-100 transition-all"
                >
                   Close
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(['Low', 'Medium', 'High', 'Urgent'] as TaskPriority[]).map((level) => {
                   const config = priorityColors[level] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
                   return (
                      <div key={level} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{level}</span>
                            <span 
                               className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                               style={{
                                  backgroundColor: config.bg,
                                  color: config.text,
                                  borderColor: config.border
                               }}
                            >
                               {level} Preview
                            </span>
                         </div>

                         <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                               <span className="text-[10px] text-slate-400 font-bold uppercase">Background</span>
                               <input 
                                  type="color" 
                                  value={config.bg}
                                  onChange={(e) => {
                                     const updated = {
                                        ...priorityColors,
                                        [level]: { ...config, bg: e.target.value }
                                     };
                                     savePriorityColors(updated);
                                  }}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent outline-none"
                               />
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                               <span className="text-[10px] text-slate-400 font-bold uppercase">Text Color</span>
                               <input 
                                  type="color" 
                                  value={config.text}
                                  onChange={(e) => {
                                     const updated = {
                                        ...priorityColors,
                                        [level]: { ...config, text: e.target.value }
                                     };
                                     savePriorityColors(updated);
                                  }}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent outline-none"
                               />
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                               <span className="text-[10px] text-slate-400 font-bold uppercase">Border Color</span>
                               <input 
                                  type="color" 
                                  value={config.border}
                                  onChange={(e) => {
                                     const updated = {
                                        ...priorityColors,
                                        [level]: { ...config, border: e.target.value }
                                     };
                                     savePriorityColors(updated);
                                  }}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent outline-none"
                               />
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>

             <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                   💡 Changes are instantly populated and written to the persist storage.
                </span>
                <button 
                   onClick={() => {
                      const resets = {
                         Low: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
                         Medium: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
                         High: { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
                         Urgent: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' }
                      };
                      savePriorityColors(resets);
                   }}
                   className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest pl-2"
                >
                   Reset Defaults
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'High Priority', value: tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length, icon: Flag, color: 'text-orange-600', bg: 'bg-orange-50' },
           { label: 'Resolved', value: tasks.filter(t => t.status === 'Completed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Yield Rate', value: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                 <stat.icon size={20} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                 <p className="text-xl font-black text-slate-900 leading-none">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
         <div className="flex-1 relative w-full">
            <input 
              type="text" 
              placeholder="Filter tasks by directive title or narrative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
         </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-full lg:w-auto">
            {['all', 'pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all w-full lg:w-auto"
          >
            <option value="all">Every Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select 
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all w-full lg:w-auto"
          >
            <option value="all">Every Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <select 
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all w-full lg:w-auto"
          >
            <option value="all">Every Assignee</option>
            <optgroup label="Teachers & Staff">
              {db.users.filter(u => u.role !== 'student' && u.role !== 'parent').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </optgroup>
            <optgroup label="Students">
              {db.students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
            selectedCategory === 'all' ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:border-primary"
          )}
        >
          All Domains
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              selectedCategory === cat ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:border-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {filteredTasks.map((task) => (
            <motion.div 
               layout
               key={task.id}
               className={cn(
                 "group bg-white p-6 rounded-[32px] border transition-all hover:shadow-xl hover:shadow-slate-200/50",
                 task.status === 'Completed' ? "border-emerald-100 opacity-80" : "border-slate-200 hover:border-primary/20"
               )}
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap gap-2">
                     <span 
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                        style={{
                           backgroundColor: (priorityColors[task.priority] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }).bg,
                           color: (priorityColors[task.priority] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }).text,
                           borderColor: (priorityColors[task.priority] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }).border
                        }}
                     >
                        {task.priority}
                     </span>
                     <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {task.category}
                     </span>
                  </div>
                  <div className="flex gap-1">
                     <button 
                        onClick={() => {
                          setEditingTask(task);
                          setFormData(task);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-primary transition-all rounded-lg"
                     >
                        <AlertCircle size={16} />
                     </button>
                     <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>

               <h4 className={cn(
                 "text-lg font-black tracking-tight mb-2 uppercase italic transition-colors",
                 task.status === 'Completed' ? "text-slate-400 line-through" : "text-slate-900"
               )}>
                 {task.title}
               </h4>
               <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed line-clamp-2">
                 {task.description}
               </p>

               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                     <span>Protocol Status</span>
                     <div className="flex items-center gap-2">
                        <span className="text-slate-900">{task.completionPercentage}%</span>
                        <span className={task.status === 'Completed' ? "text-emerald-500" : "text-indigo-600"}>{task.status}</span>
                     </div>
                  </div>
                  <div className="relative group/progress h-4 flex items-center">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${task.completionPercentage}%` }}
                          className={cn(
                            "h-full rounded-full transition-all",
                            task.status === 'Completed' ? "bg-emerald-500" : "bg-primary"
                          )}
                       />
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={task.completionPercentage}
                      onChange={(e) => updatePercentage(task.id, parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500" title={`Creator: ${db.users.find(u => u.id === task.creatorId)?.name || 'Unknown'}`}>
                           {db.users.find(u => u.id === task.creatorId)?.name?.[0] || '?' }
                        </div>
                        <div className={cn(
                          "w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center text-[10px] font-black",
                          task.assigneeType === 'student' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                        )} title={`Assignee: ${task.assigneeType === 'student' ? db.students.find(s => s.id === task.assigneeId)?.name : db.users.find(u => u.id === task.assigneeId)?.name} (${task.assigneeType})`}>
                           {(task.assigneeType === 'student' 
                             ? db.students.find(s => s.id === task.assigneeId)?.name?.[0] 
                             : db.users.find(u => u.id === task.assigneeId)?.name?.[0]) || '?' }
                        </div>
                     </div>
                     <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                            {
                              task.assigneeType === 'student' 
                              ? db.students.find(s => s.id === task.assigneeId)?.name 
                              : db.users.find(u => u.id === task.assigneeId)?.name || 'Unassigned'
                            }
                          </p>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter",
                            task.assigneeType === 'student' ? "bg-amber-100 text-amber-600" : 
                            task.assigneeType === 'teacher' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                          )}>
                            {task.assigneeType}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-900">{task.dueDate}</p>
                     </div>
                  </div>
                  
                  {task.status !== 'Completed' ? (
                    <button 
                       onClick={() => updateStatus(task.id, 'Completed')}
                       className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl border border-slate-100 transition-all shadow-sm"
                    >
                       <CheckCircle2 size={18} />
                    </button>
                  ) : (
                    <button 
                       onClick={() => updateStatus(task.id, 'Pending')}
                       className="p-3 bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100 shadow-sm"
                    >
                       <CheckCircle2 size={18} />
                    </button>
                  )}
               </div>
            </motion.div>
         ))}
         {filteredTasks.length === 0 && (
           <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400">
              <Target size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No active directives found.</p>
           </div>
         )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-slate-900 text-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <h3 className="text-2xl font-black tracking-tight uppercase italic">{editingTask ? 'Edit Protocol' : 'New Directive'}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Operational Task Configuration</p>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveTask} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold transition-all"
                        placeholder="e.g., Progress Review: Form 4 Science"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Directive Narrative</label>
                      <textarea 
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium transition-all resize-none"
                        placeholder="Detailed description of the required workflow..."
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Tier</label>
                      <select 
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold"
                      >
                         <option value="Low">Low</option>
                         <option value="Medium">Medium</option>
                         <option value="High">High</option>
                         <option value="Urgent">Urgent</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Deadline</label>
                      <input 
                        type="date" 
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value as TaskCategory})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold"
                      >
                         {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignee</label>
                       <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                        {(['staff', 'student'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, assigneeType: type === 'staff' ? 'teacher' : 'student', assigneeId: ''})}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              (type === 'student' ? formData.assigneeType === 'student' : formData.assigneeType !== 'student') 
                                ? "bg-white text-slate-900 shadow-sm" 
                                : "text-slate-400"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <select 
                        value={formData.assigneeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          let type: any = formData.assigneeType;
                          if (id) {
                            if (formData.assigneeType !== 'student') {
                              const user = db.users.find(u => u.id === id);
                              type = user?.role === 'teacher' ? 'teacher' : 'staff';
                            }
                          }
                          setFormData({...formData, assigneeId: id, assigneeType: type});
                        }}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold"
                      >
                         <option value="">Select Assignee...</option>
                         {formData.assigneeType === 'student' ? (
                           db.students.map(s => (
                             <option key={s.id} value={s.id}>{s.name} (ADM: {s.admissionNo})</option>
                           ))
                         ) : (
                           db.users.filter(u => u.role !== 'student' && u.role !== 'parent').map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                           ))
                         )}
                      </select>
                   </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {editingTask ? 'Synchronize Directive' : 'Commit Protocol'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
