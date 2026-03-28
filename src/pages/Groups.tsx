import { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      // Fetch all approved groups
      const { data: approvedGroups, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(user_id)
        `)
        .eq('status', 'approved');
        
      if (groupsError) throw groupsError;
      
      // Fetch my pending groups
      const { data: pendingGroups, error: pendingError } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'pending');
        
      if (pendingError) throw pendingError;
      
      // Fetch my memberships
      const { data: memberships, error: membersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
        
      if (membersError) throw membersError;
      
      const myGroupIds = memberships?.map(m => m.group_id) || [];
      
      const allGroups = [...(approvedGroups || []), ...(pendingGroups || [])];
      setGroups(allGroups);
      
      setMyGroups(allGroups.filter(g => myGroupIds.includes(g.id) || g.created_by === user.id));
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;
    
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: newGroupName,
          description: newGroupDesc,
          created_by: user.id,
          status: 'pending' // Requires admin approval
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add creator as admin member
      if (group) {
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });
      }
      
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
      alert('Group created successfully! Waiting for admin approval.');
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert('Failed to create group: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });
        
      if (error) throw error;
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group.');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.status === 'approved' && 
    !myGroups.find(mg => mg.id === g.id) &&
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Study Groups</h1>
          <p className="text-slate-400 text-sm mt-1">Join or create groups to collaborate and compete.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Create Group
        </button>
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
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                <Shield className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-200/70">
                  New groups require admin approval before they become active and visible to others.
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
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create Group
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
          {/* My Groups */}
          {myGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">My Groups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map(group => (
                  <div 
                    key={group.id} 
                    onClick={() => group.status === 'approved' && navigate(`/groups/${group.id}`)}
                    className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white">{group.name}</h3>
                      {group.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{group.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Users size={16} />
                        <span>{group.group_members?.length || 1} members</span>
                      </div>
                      {group.status === 'approved' && (
                        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          Open <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discover Groups */}
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
                      <button 
                        onClick={() => handleJoinGroup(group.id)}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Join Group
                      </button>
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
        </div>
      )}
    </div>
  );
}
