import { useState, useEffect } from 'react';
import { Target, Star, Users, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*')
          .order('created_at', { ascending: false });

        if (challengesError) throw challengesError;

        // Fetch user's progress
        const { data: userProgress, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        // Fetch all progress with profile info for leaderboard
        const { data: allProgress, error: allProgressError } = await supabase
          .from('user_challenge_progress')
          .select(`
            challenge_id,
            progress_hours,
            completed,
            profiles (
              id,
              username,
              avatar_url
            )
          `)
          .order('progress_hours', { ascending: false });

        if (allProgressError) throw allProgressError;

        // Group progress by challenge and calculate counts
        const completionCounts: Record<string, number> = {};
        const topParticipants: Record<string, any[]> = {};

        allProgress?.forEach(p => {
          if (p.completed) {
            completionCounts[p.challenge_id] = (completionCounts[p.challenge_id] || 0) + 1;
          }
          
          if (!topParticipants[p.challenge_id]) {
            topParticipants[p.challenge_id] = [];
          }
          
          if (topParticipants[p.challenge_id].length < 3) {
            topParticipants[p.challenge_id].push(p);
          }
        });

        // Merge data
        const merged = challengesData?.map(challenge => {
          const myProgress = userProgress?.find(p => p.challenge_id === challenge.id);
          return {
            ...challenge,
            myProgress,
            completedCount: completionCounts[challenge.id] || 0,
            topParticipants: topParticipants[challenge.id] || [],
            hasJoined: !!myProgress
          };
        }) || [];

        setChallenges(merged);
      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscription
    const channel = supabase.channel('public:challenges_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_challenge_progress' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_challenge_progress').insert([{
        user_id: user.id,
        challenge_id: challengeId,
        progress_hours: 0,
        completed: false
      }]);
      
      if (error) throw error;
      
      // Update local state optimistically
      setChallenges(prev => prev.map(c => {
        if (c.id === challengeId) {
          return {
            ...c,
            hasJoined: true,
            myProgress: { progress_hours: 0, completed: false }
          };
        }
        return c;
      }));
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Failed to join challenge. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Challenges & Achievements</h1>
        <p className="text-slate-400 text-sm mt-1">Push your limits, earn stars, and climb the leaderboard.</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-indigo-500/20">
          <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Active Challenges</p>
          <p className="text-2xl font-bold text-white">{challenges.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-emerald-500/20">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">Total Completions</p>
          <p className="text-2xl font-bold text-white">
            {challenges.reduce((acc, c) => acc + (c.completedCount || 0), 0)}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-amber-500/20">
          <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1">Stars Up For Grabs</p>
          <p className="text-2xl font-bold text-white">
            {challenges.reduce((acc, c) => acc + (c.reward_stars || 0), 0)}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-purple-500/20">
          <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-1">Your Joined</p>
          <p className="text-2xl font-bold text-white">
            {challenges.filter(c => c.hasJoined).length}
          </p>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
          <Target className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">No active challenges</h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">Check back later! The admin hasn't posted any new challenges yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge, index) => {
            const progressPercent = challenge.hasJoined 
              ? Math.min(100, Math.round(((challenge.myProgress?.progress_hours || 0) / challenge.target_hours) * 100))
              : 0;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={challenge.id} 
                className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{challenge.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        challenge.target_hours >= 50 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        challenge.target_hours >= 20 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {challenge.target_hours >= 50 ? 'Elite' : challenge.target_hours >= 20 ? 'Pro' : 'Sprint'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg font-bold text-sm border border-yellow-500/20 whitespace-nowrap">
                    <Star size={16} fill="currentColor" />
                    +{challenge.reward_stars}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Target size={14} className="text-indigo-400" />
                    {challenge.target_hours} Hours Goal
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-400" />
                    {challenge.completedCount} Completed
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    {(() => {
                      const end = new Date(challenge.end_date);
                      const now = new Date();
                      const diff = end.getTime() - now.getTime();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return days > 0 ? `${days} days left` : 'Ended';
                    })()}
                  </div>
                </div>

                {/* Top Participants Leaderboard */}
                <div className="mb-6 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-1">Top Participants</p>
                  <div className="space-y-2">
                    {challenge.topParticipants?.length > 0 ? (
                      challenge.topParticipants.map((participant: any, pIndex: number) => (
                        <div key={participant.profiles?.id || pIndex} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              pIndex === 0 ? 'bg-yellow-500 text-black' : 
                              pIndex === 1 ? 'bg-slate-300 text-black' : 
                              'bg-amber-700 text-white'
                            }`}>
                              {pIndex + 1}
                            </div>
                            <img 
                              src={participant.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.profiles?.username || 'user'}`}
                              alt={participant.profiles?.username || 'User'}
                              className="w-6 h-6 rounded-full border border-slate-700"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-xs text-slate-300 font-medium truncate max-w-[80px]">
                              {participant.profiles?.username || 'User'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-indigo-400">
                            {Number(participant.progress_hours).toFixed(1)}h
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 italic px-1">No participants yet</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  {challenge.hasJoined ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-300">Your Progress</span>
                        <span className={challenge.myProgress?.completed ? "text-emerald-400" : "text-indigo-400"}>
                          {Number(challenge.myProgress?.progress_hours || 0).toFixed(1)} / {challenge.target_hours} hrs ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${challenge.myProgress?.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                      {challenge.myProgress?.completed ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold mt-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <CheckCircle size={18} />
                          Challenge Completed!
                        </div>
                      ) : (
                        <p className="text-xs text-center text-slate-500 mt-2">Keep studying to reach your goal!</p>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                      <Target size={18} />
                      Join Challenge
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
