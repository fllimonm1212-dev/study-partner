import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Image as ImageIcon, FileText, ArrowLeft, Users, Trophy, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'leaderboard'>('chat');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            profiles (id, full_name, avatar_url, total_stars, current_streak)
          `)
          .eq('group_id', id);
          
        if (membersError) throw membersError;
        
        // Check if current user is a member
        const isMember = membersData.some(m => (m.profiles as any).id === user.id);
        if (!isMember) {
          navigate('/groups');
          return;
        }

        // Sort members by total_stars for leaderboard
        const sortedMembers = membersData
          .map(m => ({ ...m.profiles, role: m.role }))
          .sort((a: any, b: any) => (b.total_stars || 0) - (a.total_stars || 0));
          
        setMembers(sortedMembers);

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
        
      } catch (error) {
        console.error('Error fetching group data:', error);
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

    return () => {
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(membersSub);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!group) return <div>Group not found</div>;

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
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === 'leaderboard' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Trophy size={16} />
            Leaderboard
          </button>
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
                          {/* Add image/pdf rendering here later if needed */}
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
                  <button type="button" className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors">
                    <ImageIcon size={20} />
                  </button>
                  <button type="button" className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors">
                    <FileText size={20} />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-indigo-400 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16 text-center">Rank</th>
                      <th className="px-6 py-4 font-medium">Member</th>
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
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                {(member.full_name || 'U').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{member.full_name}</span>
                                {member.id === user?.id && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">You</span>
                                )}
                                {member.role === 'admin' && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Admin</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{member.current_streak || 0} day streak 🔥</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-amber-400">{member.total_stars || 0}</span>
                          <span className="text-amber-500/50 text-sm ml-1">⭐</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
