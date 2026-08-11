import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Search, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../components/Sidebar';
import { toast } from 'sonner';
import { isDemoModeEnabled, getDemoAccounts, getDemoAcceptedFriends, DEMO_MODE_EVENT } from '../lib/demoAccounts';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const handleDemoChange = () => fetchConversations();
    window.addEventListener(DEMO_MODE_EVENT, handleDemoChange);

    // Subscribe to new messages to refresh conversation list
    const channel = supabase.channel('messages_hub')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'personal_messages',
        filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      window.removeEventListener(DEMO_MODE_EVENT, handleDemoChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const getProfile = (val: any) => (Array.isArray(val) ? val[0] : val);
      let rawMessages: any[] = [];

      // Attempt 1: Join with profiles
      const { data: messages, error } = await supabase
        .from('personal_messages')
        .select(`
          *,
          sender:profiles!sender_id (id, full_name, avatar_url),
          receiver:profiles!receiver_id (id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && messages) {
        rawMessages = messages;
      } else {
        // Fallback: 2-step query
        const { data: fallbackMsgs, error: fallbackErr } = await supabase
          .from('personal_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!fallbackErr && fallbackMsgs && fallbackMsgs.length > 0) {
          const profileIds = Array.from(new Set(
            fallbackMsgs.flatMap(m => [m.sender_id, m.receiver_id]).filter(id => id && !id.startsWith('demo-user-'))
          ));

          if (profileIds.length > 0) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', profileIds);

            const pMap = new Map((profs || []).map(p => [p.id, p]));

            rawMessages = fallbackMsgs.map(m => ({
              ...m,
              sender: pMap.get(m.sender_id) || null,
              receiver: pMap.get(m.receiver_id) || null
            }));
          }
        }
      }

      const conversationMap = new Map();
      
      rawMessages.forEach(msg => {
        const sender = getProfile(msg.sender);
        const receiver = getProfile(msg.receiver);
        const otherUser = msg.sender_id === user.id ? receiver : sender;
        if (!otherUser || !otherUser.id) return;
        
        if (!conversationMap.has(otherUser.id)) {
          conversationMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: msg,
            unreadCount: 0
          });
        }
      });

      // Merge demo conversations if demo mode is enabled
      if (isDemoModeEnabled()) {
        const demoAcceptedIds = getDemoAcceptedFriends();
        const demoAccounts = getDemoAccounts();
        demoAccounts.forEach(demo => {
          if (demoAcceptedIds.includes(demo.id)) {
            const cacheKey = `demo_chat_${user.id}_${demo.id}`;
            const localRaw = localStorage.getItem(cacheKey);
            let lastMsg = null;
            if (localRaw) {
              try {
                const parsed = JSON.parse(localRaw);
                if (parsed.length > 0) {
                  lastMsg = parsed[parsed.length - 1];
                }
              } catch {}
            }

            conversationMap.set(demo.id, {
              user: {
                id: demo.id,
                full_name: demo.full_name,
                avatar_url: demo.avatar_url
              },
              lastMessage: lastMsg || {
                content: 'Tap to start conversation',
                created_at: new Date().toISOString()
              },
              unreadCount: 0
            });
          }
        });
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.warn('Conversations fetch notice:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
          <p className="text-slate-400 text-sm mt-1">Chat with your study buddies.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-slate-500">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>No conversations yet.</p>
              <button 
                onClick={() => navigate('/friends')}
                className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Find friends to chat with
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => navigate(`/friends/${conv.user.id}`)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors text-left group"
                >
                  <div className="relative">
                    {conv.user.avatar_url ? (
                      <img src={conv.user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                        {(conv.user.full_name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Online status indicator could go here */}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {conv.user.full_name}
                      </h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
