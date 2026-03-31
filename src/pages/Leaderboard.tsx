import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Trophy, Medal, Star, TrendingUp, Loader2, Search, Clock, Flame, ChevronRight, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  class: string;
  hours: number;
  stars: number;
  streak: number;
  isMe: boolean;
  initials: string;
  avatar_url?: string;
  level: number;
}

type SortMetric = 'stars' | 'hours' | 'streak';

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeUsers } = useOutletContext<{ activeUsers: any[] }>();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [filteredData, setFilteredData] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [sortBy, setSortBy] = useState<SortMetric>('stars');
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [friendsIds, setFriendsIds] = useState<Set<string>>(new Set());
  const [classes, setClasses] = useState<string[]>(['All']);
  const [displayLimit, setDisplayLimit] = useState(20);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!error && data) {
        const ids = new Set(data.flatMap(r => [r.sender_id, r.receiver_id]));
        ids.delete(user.id);
        setFriendsIds(ids);
      }
    };

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Map sortBy to database column
        const sortColumn = sortBy === 'stars' ? 'total_stars' : 
                          sortBy === 'streak' ? 'current_streak' : 'total_stars';

        // Fetch top 1000 profiles ordered by selected metric
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, class_id, section, total_stars, current_streak, avatar_url')
          .order(sortColumn, { ascending: false })
          .limit(1000);

        if (error) throw error;

        if (profiles) {
          const formattedData = profiles.map((p, index) => {
            const name = p.full_name || p.email?.split('@')[0] || 'Unknown Student';
            const classLabel = p.class_id ? `${p.class_id}-${p.section || 'A'}` : 'N/A';
            const stars = p.total_stars || 0;
            return {
              id: p.id,
              rank: index + 1,
              name: name,
              class: classLabel,
              hours: Math.floor(stars / 6),
              stars: stars,
              streak: p.current_streak || 0,
              isMe: user?.id === p.id,
              initials: name.substring(0, 2).toUpperCase(),
              avatar_url: p.avatar_url,
              level: Math.floor(stars / 50) + 1
            };
          });
          setLeaderboardData(formattedData);
          setFilteredData(formattedData);

          // Extract unique classes for filter
          const uniqueClasses = Array.from(new Set(formattedData.map(u => u.class))).sort();
          setClasses(['All', ...uniqueClasses]);

          // Check if current user is in the fetched list
          const meInList = formattedData.find(u => u.isMe);
          if (meInList) {
            setCurrentUserRank(meInList);
          } else if (user) {
            // Fetch current user's rank specifically if not in top 1000
            const { data: myProfile } = await supabase
              .from('profiles')
              .select('total_stars, current_streak')
              .eq('id', user.id)
              .single();

            if (myProfile) {
              const myMetricValue = sortBy === 'stars' ? myProfile.total_stars : 
                                   sortBy === 'streak' ? myProfile.current_streak : myProfile.total_stars;

              const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt(sortColumn, myMetricValue || 0);

              const { data: myFullProfile } = await supabase
                .from('profiles')
                .select('id, full_name, email, class_id, section, total_stars, current_streak, avatar_url')
                .eq('id', user.id)
                .single();

              if (myFullProfile) {
                const name = myFullProfile.full_name || myFullProfile.email?.split('@')[0] || 'You';
                const stars = myFullProfile.total_stars || 0;
                setCurrentUserRank({
                  id: myFullProfile.id,
                  rank: (count || 0) + 1,
                  name: name,
                  class: myFullProfile.class_id ? `${myFullProfile.class_id}-${myFullProfile.section || 'A'}` : 'N/A',
                  hours: Math.floor(stars / 6),
                  stars: stars,
                  streak: myFullProfile.current_streak || 0,
                  isMe: true,
                  initials: name.substring(0, 2).toUpperCase(),
                  avatar_url: myFullProfile.avatar_url,
                  level: Math.floor(stars / 50) + 1
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
    fetchLeaderboard();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        // Re-fetch leaderboard data when any profile changes
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, timeframe, sortBy]);

  useEffect(() => {
    let filtered = leaderboardData;
    
    if (selectedClass !== 'All') {
      filtered = filtered.filter(u => u.class === selectedClass);
    }

    if (showFriendsOnly) {
      filtered = filtered.filter(u => friendsIds.has(u.id) || u.isMe);
    }
    
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [searchQuery, selectedClass, leaderboardData, showFriendsOnly, friendsIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">See how you rank against your peers.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 flex-1 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {classes.map(c => (
                <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'All Classes' : c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFriendsOnly(!showFriendsOnly)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all",
                showFriendsOnly 
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
                  : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-200"
              )}
            >
              <Users size={16} />
              <span className="hidden sm:inline">Friends Only</span>
            </button>
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button 
                onClick={() => setSortBy('stars')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", sortBy === 'stars' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
              >
                Stars
              </button>
              <button 
                onClick={() => setSortBy('streak')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", sortBy === 'streak' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
              >
                Streak
              </button>
            </div>
          </div>
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            <button 
              onClick={() => setTimeframe('daily')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", timeframe === 'daily' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
            >
              Daily
            </button>
            <button 
              onClick={() => setTimeframe('weekly')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", timeframe === 'weekly' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
            >
              Weekly
            </button>
            <button 
              onClick={() => setTimeframe('monthly')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", timeframe === 'monthly' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {leaderboardData.length >= 3 ? (
        <div className="grid grid-cols-3 gap-4 md:gap-6 pt-8 pb-4 items-end">
          {/* Rank 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
            <div 
              className="relative mb-4 cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate(`/friends/${leaderboardData[1].id}/profile`)}
            >
              {leaderboardData[1].avatar_url ? (
                <img src={leaderboardData[1].avatar_url} alt={leaderboardData[1].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center text-xl font-bold text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.3)]">
                  {leaderboardData[1].initials}
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-400 text-slate-900 flex items-center justify-center text-xs font-bold border-2 border-slate-950">2</div>
            </div>
            <div className="flex items-center gap-2 justify-center w-full">
              <p 
                className="font-bold text-white text-center truncate cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => navigate(`/friends/${leaderboardData[1].id}/profile`)}
              >
                {leaderboardData[1].name}
              </p>
              {activeUsers.some(u => u.user_id === leaderboardData[1].id) && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                  LVL {leaderboardData[1].level}
                </div>
                <p className="text-xs text-slate-400">{leaderboardData[1].hours}h</p>
                <div className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                  <Flame size={12} fill="currentColor" />
                  <span>{leaderboardData[1].streak}</span>
                </div>
              </div>
            <div className="w-full h-24 md:h-32 bg-gradient-to-t from-slate-400/20 to-slate-400/5 rounded-t-xl mt-4 border-t border-x border-slate-400/20"></div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center z-10">
            <div 
              className="relative mb-4 cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate(`/friends/${leaderboardData[0].id}/profile`)}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                <Trophy size={32} fill="currentColor" />
              </div>
              {leaderboardData[0].avatar_url ? (
                <img src={leaderboardData[0].avatar_url} alt={leaderboardData[0].name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                  {leaderboardData[0].initials}
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center text-xs font-bold border-2 border-slate-950">1</div>
            </div>
            <div className="flex items-center gap-2 justify-center w-full">
              <p 
                className="font-bold text-white text-center truncate text-lg cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => navigate(`/friends/${leaderboardData[0].id}/profile`)}
              >
                {leaderboardData[0].name}
              </p>
              {activeUsers.some(u => u.user_id === leaderboardData[0].id) && (
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="px-2 py-0.5 rounded bg-yellow-400/20 border border-yellow-400/30 text-[10px] font-bold text-yellow-400">
                LVL {leaderboardData[0].level}
              </div>
              <p className="text-sm text-yellow-400 font-medium">{leaderboardData[0].hours}h</p>
              <div className="flex items-center gap-1 text-sm text-amber-500 font-bold">
                <Flame size={14} fill="currentColor" />
                <span>{leaderboardData[0].streak}</span>
              </div>
            </div>
            <div className="w-full h-32 md:h-40 bg-gradient-to-t from-yellow-400/20 to-yellow-400/5 rounded-t-xl mt-4 border-t border-x border-yellow-400/20"></div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
            <div 
              className="relative mb-4 cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate(`/friends/${leaderboardData[2].id}/profile`)}
            >
              {leaderboardData[2].avatar_url ? (
                <img src={leaderboardData[2].avatar_url} alt={leaderboardData[2].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-amber-600 flex items-center justify-center text-xl font-bold text-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                  {leaderboardData[2].initials}
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-600 text-amber-950 flex items-center justify-center text-xs font-bold border-2 border-slate-950">3</div>
            </div>
            <div className="flex items-center gap-2 justify-center w-full">
              <p 
                className="font-bold text-white text-center truncate cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => navigate(`/friends/${leaderboardData[2].id}/profile`)}
              >
                {leaderboardData[2].name}
              </p>
              {activeUsers.some(u => u.user_id === leaderboardData[2].id) && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                LVL {leaderboardData[2].level}
              </div>
              <p className="text-xs text-slate-400">{leaderboardData[2].hours}h</p>
              <div className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                <Flame size={12} fill="currentColor" />
                <span>{leaderboardData[2].streak}</span>
              </div>
            </div>
            <div className="w-full h-20 md:h-24 bg-gradient-to-t from-amber-600/20 to-amber-600/5 rounded-t-xl mt-4 border-t border-x border-amber-600/20"></div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          Not enough users to show podium yet.
        </div>
      )}

      {/* List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4 md:col-span-4">Student</div>
          <div className="col-span-2 hidden md:block">Class</div>
          <div className="col-span-2 md:col-span-1 text-right">Streak</div>
          <div className="col-span-2 md:col-span-2 text-right">Hours</div>
          <div className="col-span-3 md:col-span-2 text-right">Stars</div>
        </div>
        
        <div className="divide-y divide-slate-800/60">
          {filteredData.slice((searchQuery || selectedClass !== 'All') ? 0 : 3, displayLimit).map((user, index) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + (index * 0.01) }}
              key={user.id} 
              className={cn(
                "grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors",
                user.isMe ? "bg-indigo-500/10 border-l-2 border-indigo-500" : ""
              )}
            >
              <div className="col-span-1 text-center font-mono text-slate-400 font-medium">
                {user.rank}
              </div>
              <div className="col-span-4 md:col-span-4 flex items-center gap-3">
                <div 
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => navigate(`/friends/${user.id}/profile`)}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                      {user.initials}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p 
                      className={cn("font-medium text-sm cursor-pointer hover:text-indigo-400 transition-colors", user.isMe ? "text-indigo-400" : "text-slate-200")}
                      onClick={() => navigate(`/friends/${user.id}/profile`)}
                    >
                      {user.name} {user.isMe && "(You)"}
                    </p>
                    {activeUsers.some(u => u.user_id === user.id) && (
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 md:hidden">
                    <span className="font-bold text-indigo-400">L{user.level}</span>
                    <span>{user.class}</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Flame size={10} fill="currentColor" />
                      {user.streak}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 hidden md:flex items-center text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                    L{user.level}
                  </span>
                  {user.class}
                </div>
              </div>
              <div className="col-span-2 md:col-span-1 text-right flex items-center justify-end gap-1 text-sm font-medium text-amber-500">
                <span className="hidden md:inline">{user.streak}</span>
                <Flame size={14} fill="currentColor" />
              </div>
              <div className="col-span-2 md:col-span-2 text-right font-mono text-sm text-slate-200">
                {user.hours}h
              </div>
              <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1 text-sm font-medium text-yellow-400">
                {user.stars} <Star size={14} fill="currentColor" />
              </div>
            </motion.div>
          ))}
          {filteredData.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No students found matching your search.
            </div>
          )}
          {filteredData.length > displayLimit && (
            <div className="p-4 flex justify-center border-t border-slate-800/60">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-1"
              >
                Show More Students <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Rank Summary at the bottom */}
      {currentUserRank && (
        <div className="mt-12 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-indigo-400 shadow-lg shadow-indigo-500/20">
                  #{currentUserRank.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Current Rank</h3>
                  <p className="text-indigo-300 text-sm">Keep studying to climb higher in the leaderboard!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full md:w-auto">
                <div className="text-center md:text-right">
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider mb-1">Level</p>
                  <p className="text-2xl font-bold text-white">L{currentUserRank.level}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider mb-1">Streak</p>
                  <p className="text-2xl font-bold text-white flex items-center justify-center md:justify-end gap-1">
                    {currentUserRank.streak} <Flame size={18} fill="currentColor" className="text-orange-500" />
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider mb-1">Stars</p>
                  <p className="text-2xl font-bold text-white flex items-center justify-center md:justify-end gap-1">
                    {currentUserRank.stars} <Star size={18} fill="currentColor" className="text-yellow-400" />
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider mb-1">Hours</p>
                  <p className="text-2xl font-bold text-white">{currentUserRank.hours}h</p>
                </div>
              </div>
            </div>
            
            {/* Level Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <span>Level {currentUserRank.level} Progress</span>
                <span>{currentUserRank.stars % 50} / 50 Stars to L{currentUserRank.level + 1}</span>
              </div>
              <div className="h-3 w-full bg-slate-900/50 rounded-full overflow-hidden border border-indigo-500/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentUserRank.stars % 50) / 50 * 100}%` }}
                  className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
