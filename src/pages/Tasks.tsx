import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/Sidebar';
import { format, isPast, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';

/*
  SQL to create the tasks table:
  
  CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );

  ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their own tasks"
  ON public.tasks FOR ALL
  USING (auth.uid() = user_id);
*/

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  user_id: string;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');

  const categories = ['General', 'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History'];

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  useEffect(() => {
    if (tasks.length > 0 && !loading) {
      const now = new Date();
      const overdue = tasks.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
      const dueSoon = tasks.filter(t => !t.completed && t.due_date && !isPast(new Date(t.due_date)) && new Date(t.due_date).getTime() < addDays(now, 2).getTime());

      if (overdue.length > 0) {
        toast.error(`You have ${overdue.length} overdue task(s)!`, {
          duration: 5000,
          icon: <AlertCircle size={18} />
        });
      }
      
      if (dueSoon.length > 0) {
        toast.warning(`You have ${dueSoon.length} task(s) due soon!`, {
          duration: 5000,
          icon: <Clock size={18} />
        });
      }
    }
  }, [tasks.length, loading]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: sortOrder === 'asc', nullsFirst: false });

      if (error) {
        // Fallback to localStorage if table doesn't exist
        const localTasks = localStorage.getItem(`tasks_${user.id}`);
        if (localTasks) {
          setTasks(JSON.parse(localTasks));
        }
        console.warn('Supabase tasks table might not exist, using localStorage fallback');
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    if (!user) return;
    setTasks(updatedTasks);
    // Always update localStorage as a backup
    localStorage.setItem(`tasks_${user.id}`, JSON.stringify(updatedTasks));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    const newTaskData = {
      user_id: user.id,
      title: newTaskTitle,
      description: newTaskDesc,
      due_date: newTaskDueDate || null,
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTaskData)
        .select()
        .single();

      if (error) {
        // Local fallback
        const localTask: Task = {
          id: Math.random().toString(36).substring(2, 9),
          ...newTaskData,
          created_at: new Date().toISOString(),
          completed_at: null
        };
        saveTasks([localTask, ...tasks]);
      } else {
        setTasks([data, ...tasks]);
      }

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
      setNewTaskPriority('Medium');
      setNewTaskCategory('General');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;
    const updatedCompleted = !task.completed;
    const completedAt = updatedCompleted ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: updatedCompleted,
          completed_at: completedAt
        })
        .eq('id', task.id);

      if (error) {
        const updatedTasks = tasks.map(t => 
          t.id === task.id ? { ...t, completed: updatedCompleted, completed_at: completedAt } : t
        );
        saveTasks(updatedTasks);
      } else {
        setTasks(tasks.map(t => 
          t.id === task.id ? { ...t, completed: updatedCompleted, completed_at: completedAt } : t
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        const updatedTasks = tasks.filter(t => t.id !== id);
        saveTasks(updatedTasks);
      } else {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .filter(t => categoryFilter === 'All Categories' || t.category === categoryFilter)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const upcomingTasks = tasks.filter(t => 
    !t.completed && 
    t.due_date && 
    !isPast(new Date(t.due_date)) && 
    new Date(t.due_date).getTime() < addDays(new Date(), 3).getTime()
  ).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const getDueDateColor = (dateStr: string | null) => {
    if (!dateStr) return 'text-slate-500';
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'text-rose-400';
    if (isToday(date)) return 'text-amber-400';
    if (isTomorrow(date)) return 'text-indigo-400';
    return 'text-emerald-400';
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'No deadline';
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Study Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your deadlines and stay on track.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Upcoming Deadlines Section */}
      {upcomingTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4"
        >
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertCircle size={14} />
            Upcoming Deadlines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingTasks.map(task => (
              <div key={task.id} className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  <p className={cn("text-[10px] font-bold uppercase", getDueDateColor(task.due_date))}>
                    Due {formatDueDate(task.due_date)}
                  </p>
                </div>
                <button 
                  onClick={() => toggleTask(task)}
                  className="text-indigo-400 hover:text-indigo-300 p-1"
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Complete Math Assignment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Details about the task..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                filter === 'all' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                filter === 'active' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                filter === 'completed' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="All Categories">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowUpDown size={14} />
              Deadline: {sortOrder === 'asc' ? 'Soonest' : 'Latest'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 italic">No tasks found.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={cn(
                "p-4 flex items-start gap-4 group hover:bg-slate-800/30 transition-colors",
                task.completed && "opacity-60"
              )}>
                <button 
                  onClick={() => toggleTask(task)}
                  className={cn(
                    "mt-1 transition-colors",
                    task.completed ? "text-emerald-500" : "text-slate-600 hover:text-indigo-400"
                  )}
                >
                  {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "text-sm font-bold text-white transition-all relative inline-block",
                      task.completed && "text-slate-500"
                    )}>
                      {task.title}
                      {task.completed && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          className="absolute left-0 top-1/2 h-[2px] bg-slate-500 -translate-y-1/2"
                        />
                      )}
                    </h3>
                  </div>
                  {task.description && (
                    <p className={cn(
                      "text-xs text-slate-500 mt-1 line-clamp-2 transition-all",
                      task.completed && "opacity-50"
                    )}>{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-bold uppercase",
                      getDueDateColor(task.due_date)
                    )}>
                      <Clock size={10} />
                      {formatDueDate(task.due_date)}
                    </div>
                    {task.priority && (
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        task.priority === 'High' ? "bg-rose-500/10 text-rose-400" :
                        task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {task.priority}
                      </span>
                    )}
                    {task.category && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                        {task.category}
                      </span>
                    )}
                    {task.due_date && isPast(new Date(task.due_date)) && !task.completed && !isToday(new Date(task.due_date)) && (
                      <span className="text-[10px] font-bold text-rose-500 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">Overdue</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setTaskToDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Delete Task?</h2>
              </div>
              
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteTask(taskToDelete);
                    setTaskToDelete(null);
                  }}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
