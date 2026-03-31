import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, MessageSquare, Clock, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';
import { toast } from 'sonner';

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchFriendsData();

    const requestsSub = supabase.channel('public:friend_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, fetchFriendsData)
      .subscribe();

    return () => {
      supabase.removeChannel(requestsSub);
    };
  }, [user]);

  const fetchFriendsData = async () => {
    if (!user) return;
    try {
      // Fetch requests where user is sender or receiver
      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id (id, full_name, avatar_url, total_stars, class_id),
          receiver:receiver_id (id, full_name, avatar_url, total_stars, class_id)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (requestsError) throw requestsError;

      const accepted = requestsData?.filter(r => r.status === 'accepted') || [];
      const incoming = requestsData?.filter(r => r.status === 'pending' && r.receiver_id === user.id) || [];
      const outgoing = requestsData?.filter(r => r.status === 'pending' && r.sender_id === user.id) || [];

      // Map accepted requests to friend profiles
      const friendsList = accepted.map(r => {
        const friendProfile = r.sender_id === user.id ? r.receiver : r.sender;
        return { ...friendProfile, friendship_id: r.id };
      });

      setFriends(friendsList);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error fetching friends data:', error);
      toast.error('Failed to fetch friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, total_stars')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      // Filter out existing friends and pending requests
      const { data: existingRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const existingIds = new Set(
        existingRequests?.flatMap(r => [r.sender_id, r.receiver_id]) || []
      );

      const filteredResults = data?.filter(p => !existingIds.has(p.id)) || [];
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      // Use upsert to handle re-sending rejected requests
      const { error } = await supabase
        .from('friend_requests')
        .upsert(
          { 
            sender_id: user.id, 
            receiver_id: receiverId, 
            status: 'pending',
            created_at: new Date().toISOString()
          },
          { onConflict: 'sender_id,receiver_id' }
        );

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Database table "friend_requests" is missing. Please run the SQL setup.');
        }
        throw error;
      }

      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(p => p.id !== receiverId));
      fetchFriendsData(); // Refresh to update state
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`Request ${status === 'accepted' ? 'accepted' : 'rejected'}`);
      fetchFriendsData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to respond to request');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Friends</h1>
          <p className="text-slate-400 text-sm mt-1">Connect with other students and study together.</p>
        </div>
        <button 
          onClick={() => setActiveTab('find')}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <UserPlus size={18} />
          Find Students
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'friends', label: `My Friends (${friends.length})` },
          { id: 'requests', label: `Requests ${incomingRequests.length > 0 ? `(${incomingRequests.length})` : ''}` },
          { id: 'find', label: 'Find Students' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* FRIENDS TAB */}
          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                  <Users size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No friends yet</h2>
                <p className="text-slate-400 max-w-md mb-8">
                  Build your study network! Send friend requests to other students to see their progress, chat, and motivate each other.
                </p>
                <button 
                  onClick={() => setActiveTab('find')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-slate-700"
                >
                  <UserPlus size={18} />
                  Find Students
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <div key={friend.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                          {(friend.full_name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 
                          className="font-medium text-white hover:text-indigo-400 cursor-pointer transition-colors"
                          onClick={() => navigate(`/friends/${friend.id}/profile`)}
                        >
                          {friend.full_name}
                        </h3>
                        <p className="text-sm text-amber-400">{friend.total_stars || 0} ⭐</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/friends/${friend.id}`)}
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                      title="Message"
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No pending friend requests.
              </div>
            ) : (
              <div className="space-y-8">
                {incomingRequests.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Incoming Requests</h3>
                    {incomingRequests.map(request => (
                      <div key={request.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {request.sender.avatar_url ? (
                            <img src={request.sender.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                              {(request.sender.full_name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 
                              className="font-medium text-white hover:text-indigo-400 cursor-pointer transition-colors"
                              onClick={() => navigate(`/friends/${request.sender.id}/profile`)}
                            >
                              {request.sender.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                {request.sender.total_stars || 0} <Star size={10} fill="currentColor" />
                              </span>
                              {(request.sender as any).class_id && (
                                <>
                                  <span className="text-[10px] text-slate-500">•</span>
                                  <span className="text-[10px] text-indigo-400 font-medium">Class {(request.sender as any).class_id}</span>
                                </>
                              )}
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-400">Wants to be your friend</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => respondToRequest(request.id, 'accepted')}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          >
                            <Check size={16} /> Accept
                          </button>
                          <button 
                            onClick={() => respondToRequest(request.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                          >
                            <X size={16} /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {incomingRequests.length > 0 && outgoingRequests.length > 0 && (
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-950 px-3 text-xs font-medium text-slate-600 uppercase tracking-widest">Pending Outgoing</span>
                    </div>
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Sent Requests</h3>
                    {outgoingRequests.map(request => (
                      <div key={request.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {request.receiver.avatar_url ? (
                            <img src={request.receiver.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                              {(request.receiver.full_name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 
                              className="font-medium text-white hover:text-indigo-400 cursor-pointer transition-colors"
                              onClick={() => navigate(`/friends/${request.receiver.id}/profile`)}
                            >
                              {request.receiver.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                {request.receiver.total_stars || 0} <Star size={10} fill="currentColor" />
                              </span>
                              {(request.receiver as any).class_id && (
                                <>
                                  <span className="text-[10px] text-slate-500">•</span>
                                  <span className="text-[10px] text-indigo-400 font-medium">Class {(request.receiver as any).class_id}</span>
                                </>
                              )}
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-400">Waiting for response...</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => respondToRequest(request.id, 'rejected')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium border border-slate-700"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* FIND TAB */}
          {activeTab === 'find' && (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button type="submit" className="hidden">Search</button>
              </form>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(result => (
                    <div key={result.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {result.avatar_url ? (
                          <img src={result.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                            {(result.full_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 
                            className="font-medium text-white hover:text-indigo-400 cursor-pointer transition-colors"
                            onClick={() => navigate(`/friends/${result.id}/profile`)}
                          >
                            {result.full_name}
                          </h3>
                          <p className="text-sm text-amber-400">{result.total_stars || 0} ⭐</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => sendRequest(result.id)}
                        className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                        title="Send Request"
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && (
                <div className="text-center py-12 text-slate-400">
                  No users found matching "{searchQuery}" or they are already your friends.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
