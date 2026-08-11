import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Circle, 
  BookOpen, 
  Clock,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { cn } from './Sidebar';
import { isDemoModeEnabled, getDemoAccounts, getDemoAcceptedFriends, DEMO_MODE_EVENT } from '../lib/demoAccounts';

interface FriendsSidebarProps {
  activeUsers: any[];
}

export default function FriendsSidebar({ activeUsers }: FriendsSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFriends();

    const handleDemoChange = () => fetchFriends();
    window.addEventListener(DEMO_MODE_EVENT, handleDemoChange);

    const channel = supabase.channel('friends_sidebar_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friend_requests' 
      }, fetchFriends)
      .subscribe();

    return () => {
      window.removeEventListener(DEMO_MODE_EVENT, handleDemoChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      let friendsList: any[] = [];
      const getProfile = (val: any) => (Array.isArray(val) ? val[0] : val);

      // Attempt 1: Try PostgREST relationship join
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:profiles!sender_id (id, full_name, avatar_url, total_stars),
          receiver:profiles!receiver_id (id, full_name, avatar_url, total_stars)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!error && data) {
        friendsList = data
          .map(r => {
            const sender = getProfile(r.sender);
            const receiver = getProfile(r.receiver);
            const friendProfile = r.sender_id === user.id ? receiver : sender;
            if (!friendProfile) return null;
            return { ...friendProfile, friendship_id: r.id };
          })
          .filter(Boolean);
      } else {
        // Fallback: 2-step query if schema cache / FK join fails
        const { data: rawRequests, error: reqError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (!reqError && rawRequests && rawRequests.length > 0) {
          const targetIds = Array.from(new Set(
            rawRequests.flatMap(r => [r.sender_id, r.receiver_id]).filter(id => id && id !== user.id && !id.startsWith('demo-user-'))
          ));

          if (targetIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, total_stars')
              .in('id', targetIds);

            const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

            friendsList = rawRequests.map(r => {
              const friendId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
              const friendProfile = profilesMap.get(friendId);
              if (!friendProfile) return null;
              return { ...friendProfile, friendship_id: r.id };
            }).filter(Boolean);
          }
        }
      }

      // Merge demo friends if demo mode is enabled
      if (isDemoModeEnabled()) {
        const demoAcceptedIds = getDemoAcceptedFriends();
        const demoAccounts = getDemoAccounts();
        const demoFriends = demoAccounts
          .filter(d => demoAcceptedIds.includes(d.id))
          .map(d => ({
            id: d.id,
            full_name: d.full_name,
            avatar_url: d.avatar_url,
            total_stars: d.total_stars,
            class_id: d.class_id,
            is_demo: true,
            friendship_id: `demo-friendship-${d.id}`
          }));

        friendsList = [...friendsList, ...demoFriends];
      }

      setFriends(friendsList);
    } catch (error) {
      console.warn('Friends sidebar fetch notice:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    (f?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFriendStatus = (friendId: string) => {
    return activeUsers.find(u => u.user_id === friendId);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-l-xl text-slate-400 hover:text-white transition-all z-40 hidden lg:flex"
      >
        <ChevronRight className="rotate-180" size={20} />
      </button>
    );
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-950/50 backdrop-blur-xl border-l border-slate-800 hidden xl:flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-indigo-400" />
          <h2 className="font-bold text-white text-sm tracking-tight uppercase tracking-widest">Friends List</h2>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-500"></div>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-slate-500">
              {searchQuery ? 'No friends found' : 'No friends yet. Add some to see them here!'}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => navigate('/friends')}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mx-auto"
              >
                <UserPlus size={12} /> Find Students
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Online Friends */}
            {filteredFriends.some(f => getFriendStatus(f.id)) && (
              <div className="py-2">
                <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Online — {filteredFriends.filter(f => getFriendStatus(f.id)).length}</p>
                {filteredFriends.filter(f => getFriendStatus(f.id)).map(friend => {
                  const status = getFriendStatus(friend.id);
                  return (
                    <FriendItem 
                      key={friend.id} 
                      friend={friend} 
                      status={status} 
                      onClick={() => { navigate(`/friends/${friend.id}/profile`); }}
                    />
                  );
                })}
              </div>
            )}

            {/* Offline Friends */}
            <div className="py-2">
              <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Offline — {filteredFriends.filter(f => !getFriendStatus(f.id)).length}</p>
              {filteredFriends.filter(f => !getFriendStatus(f.id)).map(friend => (
                <FriendItem 
                  key={friend.id} 
                  friend={friend} 
                  onClick={() => { navigate(`/friends/${friend.id}/profile`); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <button 
          onClick={() => navigate('/friends')}
          className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium transition-all border border-indigo-500/20 flex items-center justify-center gap-2"
        >
          <Users size={14} />
          Manage Friends
        </button>
      </div>
    </aside>
  );
}

interface FriendItemProps {
  friend: any;
  status?: any;
  onClick: () => void;
  key?: any;
}

function FriendItem({ friend, status, onClick }: FriendItemProps) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-slate-700/50"
    >
      <div className="relative">
        {friend.avatar_url ? (
          <img src={friend.avatar_url} alt="" className={cn("w-10 h-10 rounded-full object-cover border border-slate-800", status ? "ring-2 ring-emerald-500/20" : "")} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm border border-slate-800">
            {friend.full_name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950",
          status ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" : "bg-slate-600"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{friend.full_name}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-amber-400 font-bold">{friend.total_stars || 0} ⭐</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/friends/${friend.id}`);
              }}
              className="p-1 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 rounded-md transition-all"
              title="Send Message"
            >
              <MessageSquare size={12} />
            </button>
          </div>
        </div>
        {status ? (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <BookOpen size={10} />
              <span className="truncate max-w-[80px]">{status.activity_type}</span>
            </div>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-400 truncate max-w-[60px]">{status.subject}</span>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 mt-0.5">Offline</p>
        )}
      </div>
    </div>
  );
}
