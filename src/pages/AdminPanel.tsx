import { useState, useEffect } from 'react';
import { Database, FolderTree, Server, ShieldCheck, AlertTriangle, Users, Target, Activity, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Sidebar';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'challenges' | 'groups'>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [challengesList, setChallengesList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalHours: 0, totalSessions: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Challenge form
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '', description: '', target_hours: 10, reward_stars: 50, start_date: '', end_date: ''
  });

  useEffect(() => {
    if (user?.email !== 'fllimonm1212@gmail.com') return;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        if (activeTab === 'overview') {
          const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const { data: sessions } = await supabase.from('study_sessions').select('duration_minutes');
          const totalMins = sessions?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0;
          setStats({ 
            totalUsers: userCount || 0, 
            totalHours: Math.floor(totalMins / 60),
            totalSessions: sessions?.length || 0
          });
        } else if (activeTab === 'users') {
          const { data, error } = await supabase.from('profiles').select('*').order('total_stars', { ascending: false });
          if (error) throw error;
          setUsersList(data || []);
        } else if (activeTab === 'challenges') {
          const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Challenges table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setChallengesList(data || []);
          }
        } else if (activeTab === 'groups') {
          const { data, error } = await supabase.from('groups').select(`
            *,
            profiles:created_by (full_name)
          `).order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Groups table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setGroupsList(data || []);
          }
        }
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
        setErrorMsg(error.message || 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newChallenge.title || !newChallenge.start_date || !newChallenge.end_date) {
        throw new Error("Please fill in all required fields.");
      }
      if (new Date(newChallenge.start_date) > new Date(newChallenge.end_date)) {
        throw new Error("Start date cannot be after end date.");
      }

      const { error } = await supabase.from('challenges').insert([{
        title: newChallenge.title,
        description: newChallenge.description,
        target_hours: newChallenge.target_hours,
        reward_stars: newChallenge.reward_stars,
        start_date: newChallenge.start_date,
        end_date: newChallenge.end_date
      }]);
      
      if (error) throw error;
      
      // Refresh
      const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
      setChallengesList(data || []);
      setShowChallengeForm(false);
      setNewChallenge({ title: '', description: '', target_hours: 10, reward_stars: 50, start_date: '', end_date: '' });
      setErrorMsg(''); // Clear any previous errors
    } catch (error: any) {
      console.error("Error creating challenge:", error);
      setErrorMsg(error.message || 'Failed to create challenge.');
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) throw error;
      setChallengesList(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error("Error deleting challenge:", error);
      setErrorMsg(error.message || 'Failed to delete challenge.');
    }
  };

  const handleGroupStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('groups').update({ status }).eq('id', id);
      if (error) throw error;
      setGroupsList(prev => prev.map(g => g.id === id ? { ...g, status } : g));
    } catch (error: any) {
      console.error("Error updating group status:", error);
      setErrorMsg(error.message || 'Failed to update group status.');
    }
  };

  if (user?.email !== 'fllimonm1212@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-rose-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md">
          You do not have permission to view this page. This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage users, challenges, and platform settings.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <ShieldCheck size={16} />
          Admin Access
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Manage Users', icon: Users },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'groups', label: 'Groups', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Study Hours</p>
                      <p className="text-3xl font-bold text-white">{stats.totalHours}h</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Class/Section</th>
                        <th className="px-6 py-4 font-medium">Total Stars</th>
                        <th className="px-6 py-4 font-medium">Current Streak</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                  {(u.full_name || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-slate-200">{u.full_name || 'Unknown User'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {u.class_id ? `Class ${u.class_id} - ${u.section || 'A'}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-medium">{u.total_stars || 0} ⭐</td>
                          <td className="px-6 py-4 text-emerald-400 font-medium">{u.current_streak || 0} 🔥</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(u.created_at || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* CHALLENGES TAB */}
            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowChallengeForm(!showChallengeForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus size={16} />
                    {showChallengeForm ? 'Cancel' : 'Create New Challenge'}
                  </button>
                </div>

                {showChallengeForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Create Challenge</h3>
                    <form onSubmit={handleCreateChallenge} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                          <input required type="text" value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g., Weekend Warrior" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Target Hours</label>
                          <input required type="number" min="1" value={newChallenge.target_hours} onChange={e => setNewChallenge({...newChallenge, target_hours: parseInt(e.target.value) || 0})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Reward Stars</label>
                          <input required type="number" min="1" value={newChallenge.reward_stars} onChange={e => setNewChallenge({...newChallenge, reward_stars: parseInt(e.target.value) || 0})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                          <input required type="date" value={newChallenge.start_date} onChange={e => setNewChallenge({...newChallenge, start_date: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                          <input required type="date" value={newChallenge.end_date} onChange={e => setNewChallenge({...newChallenge, end_date: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                          <textarea required value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" rows={3} placeholder="Describe the challenge..."></textarea>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
                          Save Challenge
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challengesList.map(c => (
                    <div key={c.id} className="glass-panel p-5 rounded-2xl flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{c.title}</h4>
                        <button onClick={() => handleDeleteChallenge(c.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 flex-1">{c.description}</p>
                      <div className="flex items-center justify-between text-xs font-medium border-t border-slate-800 pt-4">
                        <span className="text-indigo-400">Target: {c.target_hours}h</span>
                        <span className="text-amber-400">Reward: {c.reward_stars} ⭐</span>
                        <span className="text-slate-500">Ends: {new Date(c.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {challengesList.length === 0 && !showChallengeForm && (
                    <div className="col-span-2 text-center py-12 text-slate-500 glass-panel rounded-2xl">
                      No challenges found. Create one to engage your users!
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* GROUPS TAB */}
            {activeTab === 'groups' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Group Name</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Created By</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {groupsList.map(g => (
                        <tr key={g.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-200">{g.name}</td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={g.description}>{g.description}</td>
                          <td className="px-6 py-4 text-slate-400">{(g.profiles as any)?.full_name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium",
                              g.status === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
                              g.status === 'rejected' ? "bg-rose-500/10 text-rose-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {g.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {g.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleGroupStatus(g.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleGroupStatus(g.id, 'rejected')}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {groupsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No groups found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
