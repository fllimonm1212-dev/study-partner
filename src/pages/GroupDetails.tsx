import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Send, ImageIcon, FileText, ArrowLeft, Users, Trophy, MessageSquare, Clock, Star, Download, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'leaderboard' | 'requests'>('chat');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
          
        if (groupError) throw groupError;
        setGroup(groupData);

        // Fetch members with profiles
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            role,
            joined_at,
            profiles (id, full_name, avatar_url, total_stars, current_streak)
          `)
          .eq('group_id', id);
          
        if (membersError) throw membersError;
        
        // Fetch study sessions for all members to calculate group hours
        const memberIds = membersData.map(m => (m.profiles as any).id);
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('study_sessions')
          .select('user_id, duration_minutes, start_time')
          .in('user_id', memberIds)
          .eq('is_counted', true);

        if (sessionsError) throw sessionsError;

        // Check if current user is a member, creator, or global admin
        const isMember = membersData.some(m => m.profiles && (m.profiles as any).id === user.id);
        const isCreator = groupData.created_by === user.id;
        const isGlobalAdmin = user.email === 'fllimonm1212@gmail.com';
        
        if (!isMember && !isCreator && !isGlobalAdmin) {
          toast.error('You do not have permission to access this group. It may be pending approval.');
          navigate('/groups');
          return;
        }

        // Calculate hours for each member since they joined the group
        const membersWithStats = membersData
          .filter(m => m.profiles)
          .map(m => {
            const profile = m.profiles as any;
            const groupSessions = sessionsData?.filter(s => 
              s.user_id === profile.id && 
              new Date(s.start_time) >= new Date(m.joined_at)
            ) || [];
            
            const totalMinutes = groupSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
            return {
              ...profile,
              role: m.role,
              joined_at: m.joined_at,
              groupMinutes: totalMinutes,
              groupHours: (totalMinutes / 60).toFixed(1)
            };
          })
          .sort((a: any, b: any) => b.groupMinutes - a.groupMinutes);
          
        setMembers(membersWithStats);

        // Fetch join requests if user is admin
        const currentUserRole = membersData.find(m => m.profiles && (m.profiles as any).id === user.id)?.role;
        if (currentUserRole === 'admin' || isGlobalAdmin) {
          const { data: requestsData, error: requestsError } = await supabase
            .from('group_requests')
            .select(`
              id,
              user_id,
              status,
              created_at,
              profiles (id, full_name, avatar_url)
            `)
            .eq('group_id', id)
            .eq('status', 'pending');
            
          if (!requestsError && requestsData) {
            setJoinRequests(requestsData);
          }
        }

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('group_messages')
          .select(`
            *,
            profiles (full_name, avatar_url)
          `)
          .eq('group_id', id)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
        
      } catch (error: any) {
        console.error('Error fetching group data:', error);
        toast.error(error?.message || 'Failed to load group data');
        if (error?.code === 'PGRST116') {
          navigate('/groups');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();

    // Subscriptions
    const messagesSub = supabase.channel(`public:group_messages:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${id}`
      }, (payload) => {
        // Fetch the profile for the new message
        supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.user_id).single()
          .then(({ data }) => {
            setMessages(prev => [...prev, { ...payload.new, profiles: data }]);
          });
      })
      .subscribe();

    const membersSub = supabase.channel(`public:group_members:${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'group_members',
        filter: `group_id=eq.${id}`
      }, fetchGroupData)
      .subscribe();

    const requestsSub = supabase.channel(`public:group_requests:${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'group_requests',
        filter: `group_id=eq.${id}`
      }, fetchGroupData)
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(membersSub);
      supabase.removeChannel(requestsSub);
    };
  }, [id, user, navigate]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          user_id: user.id,
          content: newMessage.trim(),
          type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (type === 'pdf' && file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          user_id: user.id,
          content: file.name,
          type: type,
          file_url: publicUrl
        });

      if (dbError) throw dbError;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', memberId);
        
      if (error) throw error;
      
      toast.success('Member removed successfully');
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleAcceptRequest = async (requestId: string, userId: string) => {
    try {
      // 1. Update request status
      const { error: updateError } = await supabase
        .from('group_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
        
      if (updateError) throw updateError;

      // 2. Add to group_members
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: userId,
          role: 'member'
        });

      if (insertError) throw insertError;

      toast.success('Request accepted!');
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('group_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;

      toast.success('Request rejected');
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const currentUserRole = members.find(m => m.id === user?.id)?.role;
  const isGlobalAdmin = user?.email === 'fllimonm1212@gmail.com';
  const canManageMembers = currentUserRole === 'admin' || isGlobalAdmin;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-xl font-semibold text-gray-900 mb-2">Group not found</div>
        <p className="text-gray-500 mb-6">The group you are looking for does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{group.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{members.length} members</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'chat' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <MessageSquare size={16} />
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'members' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Users size={16} />
            Members
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'leaderboard' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Trophy size={16} />
            Leaderboard
          </button>
          {canManageMembers && (
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative",
                activeTab === 'requests' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Users size={16} />
              Requests
              {joinRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {joinRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col relative">
        
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.user_id === user?.id;
                  const showHeader = idx === 0 || messages[idx-1].user_id !== msg.user_id;
                  
                  return (
                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {showHeader && !isMe && (
                        <span className="text-xs text-slate-400 ml-12 mb-1">{(msg.profiles as any)?.full_name}</span>
                      )}
                      <div className={cn("flex items-end gap-2 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        {showHeader ? (
                          (msg.profiles as any)?.avatar_url ? (
                            <img src={(msg.profiles as any).avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                              {((msg.profiles as any)?.full_name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8 flex-shrink-0" /> // Spacer
                        )}
                        
                        <div className={cn(
                          "px-4 py-2 rounded-2xl",
                          isMe 
                            ? "bg-indigo-500 text-white rounded-br-sm" 
                            : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
                        )}>
                          {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                          {msg.type === 'image' && (
                            <div className="space-y-1">
                              <img src={msg.file_url} alt="Uploaded image" className="max-w-[200px] sm:max-w-xs rounded-lg object-cover" />
                              {msg.content && <p className="text-xs opacity-70 truncate max-w-[200px]">{msg.content}</p>}
                            </div>
                          )}
                          {msg.type === 'pdf' && (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                              <FileText size={24} className={isMe ? "text-white" : "text-rose-400"} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.content}</p>
                                <p className="text-xs opacity-70">PDF Document</p>
                              </div>
                              <Download size={16} className="opacity-70" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'image')}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'pdf')}
                  />
                  <button 
                    type="button" 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <FileText size={20} />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={uploading ? "Uploading..." : "Type a message..."}
                    disabled={uploading}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || uploading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-indigo-400 transition-colors"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users size={20} className="text-indigo-400" />
                      Group Members
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">People in this study group.</p>
                  </div>
                  <div className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold">
                    {members.length} Total
                  </div>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {members.map(member => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div 
                          className="cursor-pointer transition-transform hover:scale-110"
                          onClick={() => navigate(`/friends/${member.id}/profile`)}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                              {(member.full_name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 
                              className="text-base font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={() => navigate(`/friends/${member.id}/profile`)}
                            >
                              {member.full_name}
                            </h3>
                            {member.id === user?.id && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">You</span>
                            )}
                            {member.role === 'admin' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Admin</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {canManageMembers && member.id !== user?.id && member.role !== 'admin' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Group Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Group Hours</p>
                    <p className="text-xl font-bold text-white">
                      {(members.reduce((acc, m) => acc + (m.groupMinutes || 0), 0) / 60).toFixed(1)}h
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Group Stars</p>
                    <p className="text-xl font-bold text-white">
                      {members.reduce((acc, m) => acc + (m.total_stars || 0), 0)}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Members</p>
                    <p className="text-xl font-bold text-white">{members.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16 text-center">Rank</th>
                      <th className="px-6 py-4 font-medium">Member</th>
                      <th className="px-6 py-4 font-medium text-right">Group Hours</th>
                      <th className="px-6 py-4 font-medium text-right">Total Stars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {members.map((member, index) => (
                      <tr 
                        key={member.id} 
                        className={cn(
                          "transition-colors",
                          member.id === user?.id ? "bg-indigo-500/5" : "hover:bg-slate-800/20"
                        )}
                      >
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                            index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                            index === 1 ? "bg-slate-300/20 text-slate-300" :
                            index === 2 ? "bg-amber-700/20 text-amber-500" :
                            "text-slate-500"
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="cursor-pointer transition-transform hover:scale-110"
                              onClick={() => navigate(`/friends/${member.id}/profile`)}
                            >
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                  {(member.full_name || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-medium text-white cursor-pointer hover:text-indigo-400 transition-colors"
                                  onClick={() => navigate(`/friends/${member.id}/profile`)}
                                >
                                  {member.full_name}
                                </span>
                                {member.id === user?.id && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">You</span>
                                )}
                                {member.role === 'admin' && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Admin</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tight">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-indigo-400">{member.groupHours}h</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">In Group</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-base font-bold text-amber-400">{member.total_stars || 0}</span>
                            <Star size={14} className="text-amber-500/50" fill="currentColor" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && canManageMembers && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users size={20} className="text-indigo-400" />
                      Join Requests
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Manage users who want to join this group.</p>
                  </div>
                  <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold">
                    {joinRequests.length} Pending
                  </div>
                </div>

                {joinRequests.length > 0 ? (
                  <div className="divide-y divide-slate-800/50">
                    {joinRequests.map(request => (
                      <div key={request.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div 
                            className="cursor-pointer transition-transform hover:scale-110"
                            onClick={() => navigate(`/friends/${request.user_id}/profile`)}
                          >
                            {request.profiles.avatar_url ? (
                              <img src={request.profiles.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                {(request.profiles.full_name || 'U').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 
                              className="text-lg font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={() => navigate(`/friends/${request.user_id}/profile`)}
                            >
                              {request.profiles.full_name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Requested on {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl text-sm font-bold transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(request.id, request.user_id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={24} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">You're all caught up!</h3>
                    <p className="text-slate-400 max-w-sm">
                      There are no pending join requests for this group at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
