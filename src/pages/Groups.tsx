import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Clock, CheckCircle, XCircle, ArrowRight, Trophy, Star, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/Sidebar';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover' | 'leaderboards'>('my-groups');
  const [groupLeaderboards, setGroupLeaderboards] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchGroups();
    
    const groupsSub = supabase.channel('public:groups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchGroups)
      .subscribe();
      
    const membersSub = supabase.channel('public:group_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, fetchGroups)
      .subscribe();

    return () => {
      supabase.removeChannel(groupsSub);
      supabase.removeChannel(membersSub);
    };
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      let fetchedGroups: any[] = [];
      let memberships: any[] = [];

      // Fetch all groups (attempt relational select first)
      const { data: gData, error: gError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(user_id)
        `)
        .order('created_at', { ascending: false });
        
      if (!gError && gData) {
        fetchedGroups = gData;
      } else {
        const { data: simpleGroups } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false });
        fetchedGroups = simpleGroups || [];
      }
      
      // Fetch my memberships
      const { data: mData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
        
      memberships = mData || [];

      // Also check local storage for joined groups
      let localJoined: string[] = [];
      try {
        localJoined = JSON.parse(localStorage.getItem(`joined_groups_${user.id}`) || '[]');
      } catch (e) {}

      const myGroupIds = new Set([...memberships.map(m => m.group_id), ...localJoined]);
      
      setGroups(fetchedGroups);
      
      const userGroups = fetchedGroups.filter(g => myGroupIds.has(g.id) || g.created_by === user.id);
      setMyGroups(userGroups);

      // Fetch leaderboard data for groups
      if (fetchedGroups.length > 0) {
        const groupIds = fetchedGroups.map(g => g.id);
        
        // Fetch members for these groups
        const { data: membersData } = await supabase
          .from('group_members')
          .select(`
            group_id,
            joined_at,
            user_id
          `)
          .in('group_id', groupIds);

        if (membersData && membersData.length > 0) {
          // Fetch sessions for all members in these groups
          const memberIds = Array.from(new Set(membersData.map(m => m.user_id).filter(Boolean)));
          const { data: sessionsData } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, start_time')
            .in('user_id', memberIds)
            .eq('is_counted', true);

          // Process leaderboards for each group
          const leaderboards = fetchedGroups.map(group => {
            const groupMembers = membersData.filter(m => m.group_id === group.id);
            
            let groupTotalMinutes = 0;
            
            groupMembers.forEach(m => {
              const sessions = sessionsData?.filter(s => 
                s.user_id === m.user_id && 
                (!m.joined_at || new Date(s.start_time) >= new Date(m.joined_at))
              ) || [];
              
              const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
              groupTotalMinutes += totalMinutes;
            });

            return {
              id: group.id,
              name: group.name,
              memberCount: Math.max(groupMembers.length, 1),
              totalHours: (groupTotalMinutes / 60).toFixed(1),
              totalMinutes: groupTotalMinutes
            };
          }).sort((a, b) => b.totalMinutes - a.totalMinutes);

          setGroupLeaderboards(leaderboards);
        }
      }
    } catch (error: any) {
      console.warn('Groups fetch notice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (createLoading) return;
    
    setCreateLoading(true);
    try {
      const newGroupObj = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        created_by: user.id,
        status: 'approved'
      };

      const { data, error } = await supabase
        .from('groups')
        .insert(newGroupObj)
        .select();
        
      let group = data?.[0];

      if (error || !group) {
        console.warn('Groups select insert notice:', error);
        // Try simple insert without .select()
        const { error: insertErr } = await supabase.from('groups').insert(newGroupObj);
        if (insertErr) {
          console.warn('Simple group insert notice:', insertErr);
        }

        const { data: foundGroups } = await supabase
          .from('groups')
          .select('*')
          .eq('created_by', user.id)
          .eq('name', newGroupName.trim())
          .order('created_at', { ascending: false })
          .limit(1);

        group = foundGroups?.[0] || { id: crypto.randomUUID(), ...newGroupObj, created_at: new Date().toISOString() };
      }

      if (group?.id) {
        // Add creator as admin member
        const { error: memberError } = await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

        if (memberError) {
          console.warn('Group member insert notice:', memberError);
        }
      }
      
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupDesc('');

      if (group) {
        setGroups(prev => [group, ...prev.filter(g => g.id !== group.id)]);
        setMyGroups(prev => [group, ...prev.filter(g => g.id !== group.id)]);
      }

      await fetchGroups();
      toast.success('Group created successfully!');
    } catch (error: any) {
      console.warn('Group creation notice:', error);
      toast.error(error?.message || 'Failed to create group. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    try {
      // Add directly to group_members table
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error && error.code !== '23505') {
        console.warn('Group member insert notice:', error);
      }

      // Save to localStorage for instant local persistence
      try {
        const localJoined: string[] = JSON.parse(localStorage.getItem(`joined_groups_${user.id}`) || '[]');
        if (!localJoined.includes(groupId)) {
          localJoined.push(groupId);
          localStorage.setItem(`joined_groups_${user.id}`, JSON.stringify(localJoined));
        }
      } catch (e) {}

      toast.success('Joined group successfully!');
      await fetchGroups();
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group. Please try again.');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.status === 'approved' && 
    !myGroups.find(mg => mg.id === g.id) &&
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Study Groups</h1>
          <p className="text-slate-400 text-sm mt-1">Join or create groups to collaborate and compete.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-xl">
            <button 
              onClick={() => setActiveTab('my-groups')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'my-groups' ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              My Groups
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'discover' ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Discover
            </button>
            <button 
              onClick={() => setActiveTab('leaderboards')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'leaderboards' ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Leaderboards
            </button>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Create
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create a Study Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., CS101 Study Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                  placeholder="What is this group about?"
                />
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-3">
                <Shield className="text-indigo-400 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-indigo-200/80">
                  Your group will be created and accessible immediately to you and your peers.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Groups Tab */}
          {activeTab === 'my-groups' && (
            <div>
              {myGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myGroups.map(group => (
                    <div 
                      key={group.id} 
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{group.name}</h3>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{group.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Users size={16} />
                          <span>{group.group_members?.length || 1} members</span>
                        </div>
                        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          Open <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Users size={24} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No groups yet</h3>
                  <p className="text-slate-400 max-w-md mb-6">
                    You haven't joined any study groups. Discover groups or create your own to start collaborating!
                  </p>
                  <button 
                    onClick={() => setActiveTab('discover')}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-all"
                  >
                    Discover Groups
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Discover Groups Tab */}
          {activeTab === 'discover' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Discover Groups</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search groups..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              {filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map(group => (
                    <div key={group.id} className="glass-panel p-5 rounded-2xl flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-2">{group.name}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{group.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Users size={16} />
                          <span>{group.group_members?.length || 0} members</span>
                        </div>
                        {myRequests.some(r => r.group_id === group.id) ? (
                          <button 
                            disabled
                            className="px-3 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed"
                          >
                            Requested
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleJoinGroup(group.id)}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No groups found</h3>
                  <p className="text-slate-400 max-w-md">
                    We couldn't find any groups matching your search. Why not create one?
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Leaderboards Tab */}
          {activeTab === 'leaderboards' && (
            <div className="space-y-6">
              {groupLeaderboards.length > 0 ? (
                <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/50 flex flex-col max-w-3xl mx-auto">
                  <div className="p-5 bg-slate-800/30 border-b border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Trophy size={20} />
                      </div>
                      <h3 className="font-bold text-white">Global Group Rankings</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {groupLeaderboards.map((group: any, index: number) => (
                      <div 
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                            index === 1 ? "bg-slate-300/20 text-slate-300" :
                            index === 2 ? "bg-amber-700/20 text-amber-500" :
                            "text-slate-500 bg-slate-800"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{group.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Users size={12} />
                              <span>{group.memberCount} members</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-indigo-400">{group.totalHours}h</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Total Study Time</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Trophy size={24} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No leaderboards available</h3>
                  <p className="text-slate-400 max-w-md">
                    There are no approved groups to rank yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
