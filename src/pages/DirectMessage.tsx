import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Image as ImageIcon, FileText, ArrowLeft, MessageSquare } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function DirectMessage() {
  const { id } = useParams<{ id: string }>(); // friend's user ID
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [friend, setFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchFriendData = async () => {
      try {
        // Verify friendship
        const { data: friendship, error: friendError } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .eq('status', 'accepted')
          .single();

        if (friendError || !friendship) {
          navigate('/friends');
          return;
        }

        // Fetch friend profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setFriend(profileData);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('personal_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
        
      } catch (error) {
        console.error('Error fetching DM data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendData();

    // Subscriptions
    const messagesSub = supabase.channel(`public:personal_messages:${user.id}:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'personal_messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.sender_id === id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSub);
    };
  }, [id, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newMessage.trim()) return;

    const msgContent = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: user.id,
      receiver_id: id,
      content: msgContent,
      type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data, error } = await supabase
        .from('personal_messages')
        .insert({
          sender_id: user.id,
          receiver_id: id,
          content: msgContent,
          type: 'text'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!friend) return <div>Friend not found</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/friends')}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {(friend.full_name || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{friend.full_name}</h1>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const showHeader = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
              
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn("flex items-end gap-2 max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                    {showHeader ? (
                      isMe ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                          Me
                        </div>
                      ) : (
                        friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                            {(friend.full_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )
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
      </div>
    </div>
  );
}
