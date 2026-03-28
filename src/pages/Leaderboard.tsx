import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Loader2 } from 'lucide-react';
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
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Fetch all profiles ordered by total_stars
        // Note: This requires the profiles table to have a public read policy
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, class_id, section, total_stars, current_streak, avatar_url')
          .order('total_stars', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (profiles) {
          const formattedData = profiles.map((p, index) => {
            const name = p.full_name || p.email?.split('@')[0] || 'Unknown Student';
            return {
              id: p.id,
              rank: index + 1,
              name: name,
              class: p.class_id ? `${p.class_id}-${p.section || 'A'}` : 'N/A',
              hours: Math.floor((p.total_stars || 0) / 6), // Rough estimate: 1 star = 10 mins -> 6 stars = 1 hour
              stars: p.total_stars || 0,
              streak: p.current_streak || 0,
              isMe: user?.id === p.id,
              initials: name.substring(0, 2).toUpperCase(),
              avatar_url: p.avatar_url
            };
          });
          setLeaderboardData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

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
  }, [user, timeframe]);

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
        
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => setTimeframe('daily')}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", timeframe === 'daily' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
          >
            Daily
          </button>
          <button 
            onClick={() => setTimeframe('weekly')}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", timeframe === 'weekly' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeframe('monthly')}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", timeframe === 'monthly' ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
          >
            Monthly
          </button>
        </div>
      </div>

      {leaderboardData.length >= 3 ? (
        <div className="grid grid-cols-3 gap-4 md:gap-6 pt-8 pb-4 items-end">
          {/* Rank 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
            <div className="relative mb-4">
              {leaderboardData[1].avatar_url ? (
                <img src={leaderboardData[1].avatar_url} alt={leaderboardData[1].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center text-xl font-bold text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.3)]">
                  {leaderboardData[1].initials}
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-400 text-slate-900 flex items-center justify-center text-xs font-bold border-2 border-slate-950">2</div>
            </div>
            <p className="font-bold text-white text-center truncate w-full">{leaderboardData[1].name}</p>
            <p className="text-xs text-slate-400">{leaderboardData[1].hours}h</p>
            <div className="w-full h-24 md:h-32 bg-gradient-to-t from-slate-400/20 to-slate-400/5 rounded-t-xl mt-4 border-t border-x border-slate-400/20"></div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center z-10">
            <div className="relative mb-4">
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
            <p className="font-bold text-white text-center truncate w-full text-lg">{leaderboardData[0].name}</p>
            <p className="text-sm text-yellow-400 font-medium">{leaderboardData[0].hours}h</p>
            <div className="w-full h-32 md:h-40 bg-gradient-to-t from-yellow-400/20 to-yellow-400/5 rounded-t-xl mt-4 border-t border-x border-yellow-400/20"></div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
            <div className="relative mb-4">
              {leaderboardData[2].avatar_url ? (
                <img src={leaderboardData[2].avatar_url} alt={leaderboardData[2].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-amber-600 flex items-center justify-center text-xl font-bold text-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                  {leaderboardData[2].initials}
                </div>
              )}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-600 text-amber-950 flex items-center justify-center text-xs font-bold border-2 border-slate-950">3</div>
            </div>
            <p className="font-bold text-white text-center truncate w-full">{leaderboardData[2].name}</p>
            <p className="text-xs text-slate-400">{leaderboardData[2].hours}h</p>
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
          <div className="col-span-4 md:col-span-5">Student</div>
          <div className="col-span-2 hidden md:block">Class</div>
          <div className="col-span-3 md:col-span-2 text-right">Hours</div>
          <div className="col-span-4 md:col-span-2 text-right">Stars</div>
        </div>
        
        <div className="divide-y divide-slate-800/60">
          {leaderboardData.slice(3).map((user, index) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + (index * 0.05) }}
              key={user.id} 
              className={cn(
                "grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors",
                user.isMe ? "bg-indigo-500/5 border-l-2 border-indigo-500" : ""
              )}
            >
              <div className="col-span-1 text-center font-mono text-slate-400 font-medium">
                {user.rank}
              </div>
              <div className="col-span-4 md:col-span-5 flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                    {user.initials}
                  </div>
                )}
                <div>
                  <p className={cn("font-medium text-sm", user.isMe ? "text-indigo-400" : "text-slate-200")}>
                    {user.name} {user.isMe && "(You)"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 md:hidden">
                    {user.class}
                  </div>
                </div>
              </div>
              <div className="col-span-2 hidden md:flex items-center text-sm text-slate-400">
                {user.class}
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-mono text-sm text-slate-200">
                {user.hours}h
              </div>
              <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-1 text-sm font-medium text-yellow-400">
                {user.stars} <Star size={14} fill="currentColor" />
              </div>
            </motion.div>
          ))}
          {leaderboardData.length <= 3 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No more users to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
