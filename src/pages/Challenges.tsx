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

        // Fetch all completions to count how many finished each challenge
        const { data: allCompletions, error: completionsError } = await supabase
          .from('user_challenge_progress')
          .select('challenge_id')
          .eq('completed', true);

        if (completionsError) throw completionsError;

        // Calculate completions per challenge
        const completionCounts: Record<string, number> = {};
        allCompletions?.forEach(c => {
          completionCounts[c.challenge_id] = (completionCounts[c.challenge_id] || 0) + 1;
        });

        // Merge data
        const merged = challengesData?.map(challenge => {
          const myProgress = userProgress?.find(p => p.challenge_id === challenge.id);
          return {
            ...challenge,
            myProgress,
            completedCount: completionCounts[challenge.id] || 0,
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
                    <h3 className="text-xl font-bold text-white">{challenge.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg font-bold text-sm border border-yellow-500/20 whitespace-nowrap">
                    <Star size={16} fill="currentColor" />
                    +{challenge.reward_stars}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-6">
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
                    Ends {new Date(challenge.end_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-auto">
                  {challenge.hasJoined ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-300">Your Progress</span>
                        <span className={challenge.myProgress?.completed ? "text-emerald-400" : "text-indigo-400"}>
                          {challenge.myProgress?.progress_hours || 0} / {challenge.target_hours} hrs ({progressPercent}%)
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
