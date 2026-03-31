import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Star, Flame, MessageSquare, ChevronLeft, GraduationCap, MapPin, Calendar, Loader2, Clock, BookOpen, MonitorPlay, PenTool, Coffee, Users, UserPlus, Check, X, ShieldOff } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  class_id: string;
  section: string;
  total_stars: number;
  current_streak: number;
  created_at: string;
  interests?: string[];
  facebook_url?: string;
  instagram_url?: string;
  is_public?: boolean;
  social_links_public?: boolean;
}

export default function FriendProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUsers } = useOutletContext<{ activeUsers: any[] }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProfile();
    fetchRecentSessions();
    fetchFriendshipStatus();

    // Subscribe to real-time updates for study sessions
    const channel = supabase.channel(`friend_sessions_${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'study_sessions', 
        filter: `user_id=eq.${id}` 
      }, () => {
        fetchRecentSessions();
      })
      .subscribe();

    // Subscribe to friend request changes
    const requestsChannel = supabase.channel(`friend_requests_${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests'
      }, () => {
        fetchFriendshipStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(requestsChannel);
    };
  }, [id, user]);

  const fetchFriendshipStatus = async () => {
    if (!user || !id || user.id === id) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        setFriendshipStatus('none');
        setRequestId(null);
      } else {
        setRequestId(data.id);
        if (data.status === 'accepted') {
          setFriendshipStatus('accepted');
        } else if (data.sender_id === user.id) {
          setFriendshipStatus('pending_sent');
        } else {
          setFriendshipStatus('pending_received');
        }
      }
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!user || !id || actionLoading) return;
    setActionLoading(true);

    try {
      // Use upsert to handle re-sending rejected requests
      const { error } = await supabase
        .from('friend_requests')
        .upsert(
          { 
            sender_id: user.id, 
            receiver_id: id, 
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
      fetchFriendshipStatus();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error(error.message || 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const respondToRequest = async (status: 'accepted' | 'rejected') => {
    if (!requestId || actionLoading) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`Request ${status === 'accepted' ? 'accepted' : 'rejected'}`);
      fetchFriendshipStatus();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to respond to request');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching friend profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      setRecentSessions(data?.slice(0, 5) || []);
      
      // Calculate today's minutes
      const today = new Date().toISOString().split('T')[0];
      const mins = data?.filter(s => s.start_time.startsWith(today) && s.is_counted)
        .reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;
      setTodayMinutes(mins);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  const activeUser = activeUsers.find(u => u.user_id === id);

  const formatDuration = (startedAt: string) => {
    const diffMins = Math.floor((currentTime - new Date(startedAt).getTime()) / 60000);
    const diffSecs = Math.floor((currentTime - new Date(startedAt).getTime()) / 1000) % 60;
    
    if (diffMins < 1) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs}s`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <MonitorPlay size={16} className="text-blue-400" />;
      case 'problem': return <PenTool size={16} className="text-purple-400" />;
      case 'break': return <Coffee size={16} className="text-amber-400" />;
      default: return <BookOpen size={16} className="text-emerald-400" />;
    }
  };

  const getActivityName = (type: string) => {
    switch (type) {
      case 'lecture': return 'Watching Lecture';
      case 'problem': return 'Solving Problems';
      case 'break': return 'On Break';
      default: return 'Studying';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white">Profile not found</h2>
        <button 
          onClick={() => navigate('/friends')}
          className="mt-4 text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mx-auto"
        >
          <ChevronLeft size={18} /> Back to Friends
        </button>
      </div>
    );
  }

  if (profile.is_public === false && friendshipStatus !== 'accepted' && user?.id !== id) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button 
          onClick={() => navigate('/friends')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ChevronLeft size={20} />
          <span>Back to Friends</span>
        </button>

        <div className="glass-panel rounded-3xl overflow-hidden p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <ShieldOff size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">Private Profile</h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            This user has set their profile to private. You must be friends to view their full profile and study activity.
          </p>
          {friendshipStatus === 'none' && (
            <button 
              onClick={sendFriendRequest}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              Send Friend Request
            </button>
          )}
          {friendshipStatus === 'pending_sent' && (
            <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-400 px-6 py-3 rounded-2xl font-bold border border-slate-700">
              <Clock size={20} />
              Request Pending
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/friends')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
      >
        <ChevronLeft size={20} />
        <span>Back to Friends</span>
      </button>

      <div className="glass-panel rounded-3xl overflow-hidden">
        {/* Header/Cover Area */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
          <div className="absolute -bottom-16 left-8">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-950 shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-4xl font-bold text-indigo-400 shadow-xl">
                {(profile.full_name || profile.email || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="pt-20 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {profile.full_name || profile.email?.split('@')[0]}
                </h1>
                {activeUser && (
                  <span className="relative flex h-3 w-3 flex-shrink-0 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-indigo-400" />
                  <span>Class {profile.class_id || 'N/A'} • Section {profile.section || 'A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-indigo-400" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user && user.id !== id && (
                <>
                  {friendshipStatus === 'none' && (
                    <button 
                      onClick={sendFriendRequest}
                      disabled={actionLoading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                      Add Friend
                    </button>
                  )}
                  {friendshipStatus === 'pending_sent' && (
                    <button 
                      disabled
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-slate-400 px-6 py-3 rounded-2xl font-bold transition-all border border-slate-700"
                    >
                      <Clock size={20} />
                      Pending
                    </button>
                  )}
                  {friendshipStatus === 'pending_received' && (
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <button 
                        onClick={() => respondToRequest('accepted')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                      >
                        <Check size={20} /> Accept
                      </button>
                      <button 
                        onClick={() => respondToRequest('rejected')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 px-4 py-3 rounded-2xl font-bold transition-all border border-rose-500/20 active:scale-95 disabled:opacity-50"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {friendshipStatus === 'accepted' && (
                <>
                  <button 
                    onClick={() => navigate(`/friends/${profile.id}`)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all border border-indigo-500/20 hover:border-indigo-500 active:scale-95"
                  >
                    <Users size={20} />
                    Study Together
                  </button>
                  <button 
                    onClick={() => navigate(`/friends/${profile.id}`)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    <MessageSquare size={20} />
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Star className="text-yellow-400" size={24} fill="currentColor" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Stars</p>
                <p className="text-2xl font-bold text-white">{profile.total_stars || 0}</p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="text-orange-500" size={24} fill="currentColor" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-white">{profile.current_streak || 0} Days</p>
              </div>
            </div>
            <div className="col-span-2 lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Clock className="text-indigo-400" size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Today's Study</p>
                <p className="text-2xl font-bold text-white">
                  {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                </p>
              </div>
            </div>
          </div>

          {/* Live Study Card */}
          {activeUser && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      {getActivityIcon(activeUser.activity_type)}
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Currently {getActivityName(activeUser.activity_type)}
                    </h3>
                    <p className="text-emerald-400/80 font-medium flex items-center gap-2">
                      {activeUser.subject || 'General Study'}
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-sm">{formatDuration(activeUser.started_at)} elapsed</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/friends/${profile.id}`)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Users size={20} />
                  Join Session
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-bold text-white">About</h3>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-6">
              <p className="text-slate-300 leading-relaxed italic">
                {profile.bio || "No bio available yet. This student is busy studying!"}
              </p>

              {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(interest => (
                      <span key={interest} className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.social_links_public || user?.id === id) && (profile.facebook_url || profile.instagram_url) && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Social Links</p>
                  <div className="flex gap-3">
                    {profile.facebook_url && (
                      <a href={profile.facebook_url.startsWith('http') ? profile.facebook_url : `https://facebook.com/${profile.facebook_url}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {profile.instagram_url && (
                      <a href={`https://instagram.com/${profile.instagram_url}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-900/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        {getActivityIcon(session.activity_type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{getActivityName(session.activity_type)}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(session.start_time).toLocaleDateString()} • {session.duration_minutes} mins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500">
                        {Math.floor((currentTime - new Date(session.start_time).getTime()) / (1000 * 60 * 60 * 24)) === 0 
                          ? 'Today' 
                          : `${Math.floor((currentTime - new Date(session.start_time).getTime()) / (1000 * 60 * 60 * 24))}d ago`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-slate-500 text-sm italic">No recent study sessions recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
