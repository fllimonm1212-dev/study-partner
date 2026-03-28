import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, BookOpen, MonitorPlay, PenTool, Flame, Users, Trophy, Star, Play, Pause, Square, Coffee } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Sidebar';

type ActivityType = 'study' | 'lecture' | 'problem' | 'break';

const activities = [
  { id: 'study', name: 'Studying', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' },
  { id: 'lecture', name: 'Watching Lecture', icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/50' },
  { id: 'problem', name: 'Solving Problems', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/50' },
  { id: 'break', name: 'Break', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/50' },
];

function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  const [chartData, setChartData] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [liveExtraSeconds, setLiveExtraSeconds] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const { activeUsers } = useOutletContext<{ activeUsers: any[] }>();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Timer State
  const [activeType, setActiveType] = useState<ActivityType>(() => 
    (localStorage.getItem(`timer_${user?.id}_activeType`) as ActivityType) || 'study'
  );
  const [isRunning, setIsRunning] = useState(() => 
    localStorage.getItem(`timer_${user?.id}_isRunning`) === 'true'
  );
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem(`timer_${user?.id}_sessionStartTime`);
    return saved ? new Date(saved) : null;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const saved = localStorage.getItem(`timer_${user?.id}_elapsedSeconds`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isSaving, setIsSaving] = useState(false);

  const stateRef = useRef({ activeType, sessionStartTime, elapsedSeconds, isRunning });
  useEffect(() => {
    stateRef.current = { activeType, sessionStartTime, elapsedSeconds, isRunning };
  });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle missed time on mount
  useEffect(() => {
    if (!user) return;
    const lastTick = localStorage.getItem(`timer_${user.id}_lastTick`);
    if (isRunning && lastTick) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - parseInt(lastTick, 10)) / 1000);
      if (diffSeconds > 0) {
        setElapsedSeconds(prev => prev + diffSeconds);
      }
    }
  }, [user]);

  // Main timer interval
  useEffect(() => {
    if (!user || !isRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        localStorage.setItem(`timer_${user.id}_elapsedSeconds`, String(next));
        return next;
      });
      localStorage.setItem(`timer_${user.id}_lastTick`, String(Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`timer_${user.id}_activeType`, activeType);
  }, [activeType, user]);

  const toggleTimer = () => {
    const nextIsRunning = !isRunning;
    setIsRunning(nextIsRunning);
    if (user) {
      localStorage.setItem(`timer_${user.id}_isRunning`, String(nextIsRunning));
      if (nextIsRunning) {
        localStorage.setItem(`timer_${user.id}_lastTick`, String(Date.now()));
        if (!sessionStartTime) {
          const now = new Date();
          setSessionStartTime(now);
          localStorage.setItem(`timer_${user.id}_sessionStartTime`, now.toISOString());
        }
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setSessionStartTime(null);
    if (user) {
      localStorage.setItem(`timer_${user.id}_isRunning`, 'false');
      localStorage.setItem(`timer_${user.id}_elapsedSeconds`, '0');
      localStorage.removeItem(`timer_${user.id}_sessionStartTime`);
      localStorage.removeItem(`timer_${user.id}_lastTick`);
    }
  };

  const handleSaveSession = async () => {
    const finalElapsed = stateRef.current.elapsedSeconds;
    if (!user || finalElapsed < 10) {
      resetTimer();
      return;
    }

    setIsSaving(true);
    setIsRunning(false);
    localStorage.setItem(`timer_${user.id}_isRunning`, 'false');

    const durationMinutes = Math.max(1, Math.ceil(finalElapsed / 60));
    const isCounted = stateRef.current.activeType !== 'break';

    try {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id: 'General', // Default subject for dashboard timer
        activity_type: stateRef.current.activeType,
        duration_minutes: durationMinutes,
        start_time: stateRef.current.sessionStartTime?.toISOString() || new Date(Date.now() - finalElapsed * 1000).toISOString(),
        end_time: new Date().toISOString(),
        is_counted: isCounted
      });

      if (error) throw error;

      if (isCounted) {
        const starsEarned = Math.floor(durationMinutes / 10);
        if (starsEarned > 0) {
          const { data: profile } = await supabase.from('profiles').select('total_stars').eq('id', user.id).single();
          if (profile) {
            await supabase.from('profiles').update({
              total_stars: (profile.total_stars || 0) + starsEarned
            }).eq('id', user.id);
          }
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsSaving(false);
      resetTimer();
    }
  };

  const formatDuration = (startedAt: string) => {
    const diffMins = Math.floor((currentTime - new Date(startedAt).getTime()) / 60000);
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const updateLiveTimer = () => {
      if (!user) return;
      const isRunning = localStorage.getItem(`timer_${user.id}_isRunning`) === 'true';
      const activeType = localStorage.getItem(`timer_${user.id}_activeType`) || 'study';
      
      if (isRunning && activeType !== 'break') {
        const lastTick = parseInt(localStorage.getItem(`timer_${user.id}_lastTick`) || '0', 10);
        const savedElapsed = parseInt(localStorage.getItem(`timer_${user.id}_elapsedSeconds`) || '0', 10);
        const diff = lastTick > 0 ? Math.floor((Date.now() - lastTick) / 1000) : 0;
        setLiveExtraSeconds(savedElapsed + diff);
      } else {
        setLiveExtraSeconds(0);
      }
    };

    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStatTime = (totalMinutes: number, extraSeconds: number) => {
    const totalSeconds = (totalMinutes * 60) + extraSeconds;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      // Fetch Profile Stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_stars, current_streak')
        .eq('id', user.id)
        .single();

      // Fetch Study Sessions for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', sevenDaysAgo.toISOString());

      // Calculate Today's Study
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      
      const todaysSessions = sessions?.filter(s => {
        const sessionDate = new Date(s.start_time);
        const sessionDateStr = sessionDate.getFullYear() + '-' + String(sessionDate.getMonth() + 1).padStart(2, '0') + '-' + String(sessionDate.getDate()).padStart(2, '0');
        return sessionDateStr === todayStr && s.is_counted;
      }) || [];
      const todayMinutes = todaysSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);

      // Calculate Weekly Study
      const weeklyMinutes = sessions?.filter(s => s.is_counted).reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;

      setTodayMinutes(todayMinutes);
      setWeeklyMinutes(weeklyMinutes); // Keep total minutes
      setCurrentStreak(profile?.current_streak || 0);
      setTotalStars(profile?.total_stars || 0);

      // Process Chart Data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartAgg = new Map();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        chartAgg.set(dateStr, { name: days[d.getDay()], study: 0, lecture: 0, problem: 0 });
      }

      sessions?.forEach(session => {
        const sessionDate = new Date(session.start_time);
        const dateStr = sessionDate.getFullYear() + '-' + String(sessionDate.getMonth() + 1).padStart(2, '0') + '-' + String(sessionDate.getDate()).padStart(2, '0');
        if (chartAgg.has(dateStr)) {
          const dayData = chartAgg.get(dateStr);
          const hours = session.duration_minutes / 60;
          if (session.activity_type === 'study') dayData.study += hours;
          if (session.activity_type === 'lecture') dayData.lecture += hours;
          if (session.activity_type === 'problem') dayData.problem += hours;
        }
      });

      setChartData(Array.from(chartAgg.values()).map(d => ({
        ...d,
        study: Number(d.study.toFixed(1)),
        lecture: Number(d.lecture.toFixed(1)),
        problem: Number(d.problem.toFixed(1))
      })));

      // Fetch My Recent Activity
      const { data: recentSessions } = await supabase
        .from('study_sessions')
        .select(`
          id,
          activity_type,
          start_time,
          profiles ( full_name )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5);

      if (recentSessions) {
        setLiveActivity(recentSessions.map(s => {
          let action = 'Studying';
          let color = 'text-emerald-400';
          let bg = 'bg-emerald-400/10';
          
          if (s.activity_type === 'lecture') { action = 'Watching Lecture'; color = 'text-blue-400'; bg = 'bg-blue-400/10'; }
          if (s.activity_type === 'problem') { action = 'Solving Problems'; color = 'text-purple-400'; bg = 'bg-purple-400/10'; }
          if (s.activity_type === 'break') { action = 'On Break'; color = 'text-amber-400'; bg = 'bg-amber-400/10'; }

          const diffMins = Math.floor((new Date().getTime() - new Date(s.start_time).getTime()) / 60000);
          const timeStr = diffMins === 0 ? 'Just now' : `${diffMins}m ago`;

          return {
            id: s.id,
            user: (s.profiles as any)?.full_name || 'Anonymous',
            action,
            time: timeStr,
            type: s.activity_type,
            color,
            bg
          };
        }));
      }

      // Fetch Active Challenges for Dashboard
      const { data: myProgress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, progress_hours, completed')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (myProgress && myProgress.length > 0) {
        const challengeIds = myProgress.map(p => p.challenge_id);
        const { data: activeChallengesData } = await supabase
          .from('challenges')
          .select('*')
          .in('id', challengeIds)
          .limit(2);
          
        if (activeChallengesData) {
          const merged = activeChallengesData.map(c => {
            const prog = myProgress.find(p => p.challenge_id === c.id);
            return {
              ...c,
              progress_hours: prog?.progress_hours || 0
            };
          });
          setActiveChallenges(merged);
        }
      } else {
        setActiveChallenges([]);
      }
    };

    fetchDashboardData();

    // Set up realtime subscription for my sessions
    const channel = supabase.channel('public:study_sessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData(); // Refresh data when new session is added
      })
      .subscribe();

    // Real-time subscription for challenge progress
    const progressChannel = supabase.channel('public:user_challenge_progress_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_challenge_progress', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(progressChannel);
    };
  }, [user]);

  const activeConfig = activities.find(a => a.id === activeType)!;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {firstName}! 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening in your study network today.</p>
        </div>
      </div>

      {/* Quick Timer Section */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setActiveType(activity.id as ActivityType)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap",
                  activeType === activity.id 
                    ? `bg-slate-800 border ${activity.border} shadow-sm` 
                    : "bg-slate-800/50 border border-transparent hover:bg-slate-800"
                )}
              >
                <activity.icon size={16} className={activity.color} />
                <span className={cn("text-sm font-medium", activeType === activity.id ? "text-white" : "text-slate-400")}>
                  {activity.name}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            <div className="text-3xl font-mono font-bold text-white tracking-tight w-32 text-center">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTimer}
                disabled={isSaving}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 active:scale-95",
                  isRunning ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-500 hover:bg-indigo-600"
                )}
              >
                {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={handleSaveSession}
                disabled={isSaving || elapsedSeconds < 10}
                className="w-12 h-12 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <Square size={20} fill="currentColor" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Study", value: formatStatTime(todayMinutes, liveExtraSeconds), icon: Clock, color: "text-indigo-400", bg: "bg-indigo-400/10" },
          { title: "Weekly Goal", value: `${formatStatTime(weeklyMinutes, liveExtraSeconds)} / 30h`, icon: Target, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { title: "Current Streak", value: `${currentStreak} Days`, icon: Flame, color: "text-amber-400", bg: "bg-amber-400/10" },
          { title: "Total Stars", value: `${totalStars}`, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title} 
            className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Now Section */}
      {activeUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Now
            </h2>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">{activeUsers.length} Studying</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
            {activeUsers.map(u => (
              <div key={u.user_id} className="flex-shrink-0 w-64 bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {u.full_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{u.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.subject || 'Studying'} • {formatDuration(u.started_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Challenges Section */}
      {activeChallenges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {activeChallenges.map(challenge => {
            const progressPercent = Math.min(100, Math.round((challenge.progress_hours / challenge.target_hours) * 100));
            return (
              <div key={challenge.id} className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold truncate pr-4">{challenge.title}</h3>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
                    <Star size={12} fill="currentColor" />
                    +{challenge.reward_stars}
                  </div>
                </div>
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-indigo-400">{challenge.progress_hours} / {challenge.target_hours} hrs</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Weekly Activity Breakdown</h2>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Study</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div>Lecture</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-400"></div>Problems</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="study" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                <Bar dataKey="lecture" stackId="a" fill="#60a5fa" />
                <Bar dataKey="problem" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              My Recent Activity
            </h2>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {liveActivity.length > 0 ? liveActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bg} ${activity.color}`}>
                  {activity.type === 'study' && <BookOpen size={14} />}
                  {activity.type === 'lecture' && <MonitorPlay size={14} />}
                  {activity.type === 'problem' && <PenTool size={14} />}
                  {activity.type === 'break' && <Clock size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors cursor-pointer">
                    {activity.user}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{activity.action}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{activity.time}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center mt-10">No recent activity</p>
            )}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors">
            View All Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}
