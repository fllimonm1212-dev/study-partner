import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, BookOpen, MonitorPlay, PenTool, Flame, Users, Trophy, Star, Play, Pause, Square, Coffee, X, MessageSquare, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Sidebar';

type ActivityType = 'study' | 'lecture' | 'problem' | 'break' | 'ai_study';

const activities = [
  { id: 'study', name: 'Studying', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' },
  { id: 'lecture', name: 'Watching Lecture', icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/50' },
  { id: 'problem', name: 'Solving Problems', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/50' },
  { id: 'ai_study', name: 'AI Study Session', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  { id: 'break', name: 'Break', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/50' },
];

function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl ring-1 ring-white/10">
        <p className="text-slate-200 font-bold mb-3 flex items-center gap-2">
          <Clock size={14} className="text-indigo-400" />
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.fill.includes('url') ? entry.color : entry.fill }}></div>
                <span className="text-xs text-slate-400 font-medium capitalize">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-white tabular-nums">{entry.value.toFixed(1)}h</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between gap-6">
            <span className="text-xs font-bold text-slate-300">Total Study</span>
            <span className="text-xs font-bold text-indigo-400 tabular-nums">
              {payload.reduce((acc: number, curr: any) => acc + curr.value, 0).toFixed(1)}h
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  const [chartData, setChartData] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [dailyGoal, setDailyGoal] = useState(240); // Default 4 hours
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [liveExtraSeconds, setLiveExtraSeconds] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [productivityScore, setProductivityScore] = useState(0);
  const [studyTip, setStudyTip] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(1200); // 20 hours
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

  // Sync from localStorage when user becomes available
  useEffect(() => {
    if (!user) return;
    
    const savedActiveType = localStorage.getItem(`timer_${user.id}_activeType`) as ActivityType;
    if (savedActiveType) setActiveType(savedActiveType);
    
    const savedIsRunning = localStorage.getItem(`timer_${user.id}_isRunning`) === 'true';
    setIsRunning(savedIsRunning);
    
    const savedSessionStartTime = localStorage.getItem(`timer_${user.id}_sessionStartTime`);
    if (savedSessionStartTime) setSessionStartTime(new Date(savedSessionStartTime));
    
    const savedElapsedSeconds = localStorage.getItem(`timer_${user.id}_elapsedSeconds`);
    if (savedElapsedSeconds) setElapsedSeconds(parseInt(savedElapsedSeconds, 10));
  }, [user]);

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
      setElapsedSeconds(prev => prev + 1);
      localStorage.setItem(`timer_${user.id}_lastTick`, String(Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, user]);

  useEffect(() => {
    if (!user || !isRunning) return;
    localStorage.setItem(`timer_${user.id}_elapsedSeconds`, String(elapsedSeconds));
  }, [elapsedSeconds, isRunning, user]);

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
      
      // Update streak and stars (1 star per 10 minutes of study, at least 15 mins for streak)
      if (isCounted && durationMinutes >= 15) {
        const starsEarned = Math.floor(durationMinutes / 10);
        
        // Fetch current profile to calculate streak
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_stars, current_streak, last_study_date')
          .eq('id', user.id)
          .single();

        if (profile) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = profile.current_streak || 0;
          const lastDate = profile.last_study_date;

          if (!lastDate) {
            newStreak = 1;
          } else if (lastDate === today) {
            // Already studied today, streak stays the same
          } else if (lastDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1; // Broken streak
          }

          await supabase.from('profiles').update({
            total_stars: (profile.total_stars || 0) + starsEarned,
            current_streak: newStreak,
            last_study_date: today
          }).eq('id', user.id);
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

  const getActivityName = (type: string) => {
    switch (type) {
      case 'lecture': return 'Watching Lecture';
      case 'problem': return 'Solving Problems';
      case 'break': return 'On Break';
      default: return 'Studying';
    }
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
        .select('total_stars, current_streak, last_study_date, daily_goal')
        .eq('id', user.id)
        .single();

      if (profile?.daily_goal) {
        setDailyGoal(profile.daily_goal);
      }

      let streak = profile?.current_streak || 0;
      if (profile?.last_study_date) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // If last study was before yesterday, streak is broken
        if (profile.last_study_date !== today && profile.last_study_date !== yesterdayStr) {
          streak = 0;
          // Update database to reflect broken streak
          await supabase.from('profiles').update({ current_streak: 0 }).eq('id', user.id);
        }
      }

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
      setCurrentStreak(streak);
      setTotalStars(profile?.total_stars || 0);

      // Process Subject Data
      const subjectAgg = new Map();
      sessions?.filter(s => s.is_counted).forEach(session => {
        const subject = session.subject_id || 'General';
        subjectAgg.set(subject, (subjectAgg.get(subject) || 0) + session.duration_minutes);
      });
      
      const sortedSubjects = Array.from(subjectAgg.entries())
        .map(([name, minutes]) => ({ name, minutes }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);
      
      setSubjectData(sortedSubjects);

      // Calculate Productivity Score
      const focusMinutes = sessions?.filter(s => s.is_counted).reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
      const breakMinutes = sessions?.filter(s => s.activity_type === 'break').reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
      const totalSessionMinutes = focusMinutes + breakMinutes;
      const score = totalSessionMinutes > 0 ? Math.round((focusMinutes / totalSessionMinutes) * 100) : 0;
      setProductivityScore(score);

      // Set Random Study Tip
      const tips = [
        "Use the Pomodoro technique: 25 mins focus, 5 mins break.",
        "Teach what you've learned to someone else to reinforce it.",
        "Keep your study space clean and free of distractions.",
        "Stay hydrated! Your brain needs water to function at its best.",
        "Review your notes within 24 hours of taking them.",
        "Break large tasks into smaller, manageable chunks.",
        "Get enough sleep—it's when your brain consolidates memories."
      ];
      setStudyTip(tips[Math.floor(Math.random() * tips.length)]);

      // Calculate Global Rank
      if (profile) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_stars', profile.total_stars || 0);
        setGlobalRank((count || 0) + 1);
      }

      // Process Chart Data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartAgg = new Map();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        chartAgg.set(dateStr, { name: days[d.getDay()], study: 0, lecture: 0, problem: 0, ai_study: 0 });
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
          if (session.activity_type === 'ai_study') dayData.ai_study += hours;
        }
      });

      setChartData(Array.from(chartAgg.values()).map(d => ({
        ...d,
        study: Number(d.study.toFixed(1)),
        lecture: Number(d.lecture.toFixed(1)),
        problem: Number(d.problem.toFixed(1)),
        ai_study: Number(d.ai_study.toFixed(1))
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

      const { data: recentExams } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          exam_id,
          score,
          total_points,
          created_at,
          status,
          exams ( title )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const combinedActivity: any[] = [];

      if (recentSessions) {
        recentSessions.forEach(s => {
          let action = 'Studying';
          let color = 'text-emerald-400';
          let bg = 'bg-emerald-400/10';
          
          if (s.activity_type === 'lecture') { action = 'Watching Lecture'; color = 'text-blue-400'; bg = 'bg-blue-400/10'; }
          if (s.activity_type === 'problem') { action = 'Solving Problems'; color = 'text-purple-400'; bg = 'bg-purple-400/10'; }
          if (s.activity_type === 'ai_study') { action = 'AI Study Session'; color = 'text-purple-500'; bg = 'bg-purple-500/10'; }
          if (s.activity_type === 'break') { action = 'On Break'; color = 'text-amber-400'; bg = 'bg-amber-400/10'; }

          const startTime = new Date(s.start_time).getTime();
          const diffMins = Math.floor((new Date().getTime() - startTime) / 60000);
          const timeStr = diffMins === 0 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffMins < 1440 ? `${Math.floor(diffMins/60)}h ago` : `${Math.floor(diffMins/1440)}d ago`;

          combinedActivity.push({
            id: s.id,
            timestamp: startTime,
            action,
            time: timeStr,
            type: s.activity_type,
            color,
            bg
          });
        });
      }

      if (recentExams) {
        recentExams.forEach(e => {
          const examTitle = (e.exams as any)?.title || 'Exam';
          const isCompleted = e.status === 'completed';
          const action = isCompleted ? `Completed ${examTitle} (${e.score}/${e.total_points})` : `Started ${examTitle}`;
          const color = isCompleted ? 'text-indigo-400' : 'text-amber-400';
          const bg = isCompleted ? 'bg-indigo-400/10' : 'bg-amber-400/10';

          const startTime = new Date(e.created_at).getTime();
          const diffMins = Math.floor((new Date().getTime() - startTime) / 60000);
          const timeStr = diffMins === 0 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : diffMins < 1440 ? `${Math.floor(diffMins/60)}h ago` : `${Math.floor(diffMins/1440)}d ago`;

          combinedActivity.push({
            id: e.id,
            timestamp: startTime,
            action,
            time: timeStr,
            type: 'exam',
            color,
            bg,
            examId: e.exam_id
          });
        });
      }

      // Sort combined activity by timestamp descending and limit to 6
      setLiveActivity(combinedActivity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6));

      // Fetch Active/Available Challenges for Dashboard
      const { data: myProgress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, progress_hours, completed')
        .eq('user_id', user.id);

      const { data: allChallengesData } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);
        
      if (allChallengesData) {
        const merged = allChallengesData.map(c => {
          const prog = myProgress?.find(p => p.challenge_id === c.id);
          return {
            ...c,
            progress_hours: prog?.progress_hours || 0,
            hasJoined: !!prog,
            isCompleted: prog?.completed || false
          };
        });
        setActiveChallenges(merged);
      } else {
        setActiveChallenges([]);
      }

      // Fetch Recent Exams for dedicated section
      setLoadingExams(true);
      try {
        const { data: examsData } = await supabase
          .from('exam_submissions')
          .select(`
            id,
            exam_id,
            score,
            total_points,
            created_at,
            status,
            exams ( title )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentExams(examsData || []);
      } catch (error) {
        console.error('Error fetching recent exams:', error);
      } finally {
        setLoadingExams(false);
      }

      // Fetch Upcoming Tasks
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(3);

        if (tasksError) {
          // Fallback to localStorage
          const localTasks = JSON.parse(localStorage.getItem(`tasks_${user.id}`) || '[]');
          const filtered = localTasks
            .filter((t: any) => !t.completed)
            .sort((a: any, b: any) => {
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            })
            .slice(0, 3);
          setUpcomingTasks(filtered);
        } else {
          setUpcomingTasks(tasksData || []);
        }
      } catch (error) {
        console.error('Error fetching tasks for dashboard:', error);
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

  const activeConfig = activities.find(a => a.id === activeType) || activities[0];

  const filteredActiveUsers = selectedSubject 
    ? activeUsers.filter(u => u.subject === selectedSubject)
    : activeUsers;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('Welcome back')}, {firstName}! 👋</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t("Here's what's happening in your study network today.")}</p>
        </div>
      </div>

      {/* Quick Timer Section */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setActiveType(activity.id as ActivityType)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap",
                  activeType === activity.id 
                    ? `bg-slate-100 dark:bg-slate-800 border ${activity.border} shadow-sm` 
                    : "bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <activity.icon size={16} className={activity.color} />
                <span className={cn("text-sm font-medium", activeType === activity.id ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                  {t(activity.name)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight w-32 text-center">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: t("Today's Study"), value: formatStatTime(todayMinutes, liveExtraSeconds), icon: Clock, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-400/10" },
            { title: t("Global Rank"), value: globalRank ? `#${globalRank}` : '...', icon: Trophy, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-400/10" },
            { title: t("Current Streak"), value: `${currentStreak} ${t('Days')}`, icon: Flame, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-400/10" },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.title} 
              className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Daily Goal Progress Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full -z-10"></div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.min(1, (todayMinutes + (liveExtraSeconds / 60)) / dailyGoal)) 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
                className="text-indigo-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">
                {Math.round(Math.min(100, ((todayMinutes + (liveExtraSeconds / 60)) / dailyGoal) * 100))}%
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Goal</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {Math.floor(todayMinutes + (liveExtraSeconds / 60))} / {dailyGoal}m
            </p>
          </div>
        </motion.div>
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
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Now
              </h2>
              {selectedSubject && (
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md hover:bg-indigo-400/20 transition-colors flex items-center gap-1"
                >
                  Filtering: {selectedSubject}
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
              {filteredActiveUsers.length} {selectedSubject ? 'Matching' : 'Studying'}
            </span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
            {filteredActiveUsers.map(u => (
              <div key={u.user_id} className="flex-shrink-0 w-80 bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div 
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => navigate(`/friends/${u.user_id}/profile`)}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {u.full_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p 
                        className="text-sm font-medium text-white truncate cursor-pointer hover:text-indigo-400 transition-colors"
                        onClick={() => navigate(`/friends/${u.user_id}/profile`)}
                      >
                        {u.full_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {u.subject && (
                        <button
                          onClick={() => setSelectedSubject(u.subject)}
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors",
                            selectedSubject === u.subject 
                              ? "bg-indigo-500 text-white" 
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          )}
                        >
                          {u.subject}
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 truncate">
                        {formatDuration(u.started_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {u.user_id !== user?.id && (
                  <button
                    onClick={() => navigate(`/friends/${u.user_id}`)}
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border border-indigo-500/20 hover:border-indigo-500"
                  >
                    <MessageSquare size={14} />
                    Study Together
                  </button>
                )}
              </div>
            ))}
            {filteredActiveUsers.length === 0 && selectedSubject && (
              <div className="w-full py-4 text-center">
                <p className="text-sm text-slate-500 italic">No one else is studying {selectedSubject} right now.</p>
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Active Challenges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy size={18} className="text-indigo-400" />
                Latest Challenges
              </h2>
              <button 
                onClick={() => navigate('/challenges')}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
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
                    
                    {challenge.hasJoined ? (
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">
                            {challenge.isCompleted ? 'Completed!' : 'Progress'}
                          </span>
                          <span className={challenge.isCompleted ? "text-emerald-400" : "text-indigo-400"}>
                            {Number(challenge.progress_hours).toFixed(1)} / {challenge.target_hours} hrs
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              challenge.isCompleted ? "bg-emerald-500" : "bg-indigo-500"
                            )}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto pt-2">
                        <button 
                          onClick={() => navigate('/challenges')}
                          className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30"
                        >
                          Join Challenge
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Upcoming Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-400" />
              Upcoming Tasks
            </h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
              <div key={task.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        task.due_date && new Date(task.due_date).getTime() < Date.now() ? "text-rose-400" : "text-slate-500"
                      )}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/tasks')}
                  className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )) : (
              <div className="glass-panel p-8 rounded-2xl text-center">
                <p className="text-sm text-slate-500 italic">No upcoming tasks. Enjoy your free time!</p>
                <button 
                  onClick={() => navigate('/tasks')}
                  className="mt-3 text-xs text-indigo-400 hover:underline"
                >
                  Create a task
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Exams Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy size={18} className="text-indigo-400" />
              Recent Exams
            </h2>
            <button 
              onClick={() => navigate('/exams')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {loadingExams ? (
              <div className="glass-panel p-8 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : recentExams.length > 0 ? recentExams.map(exam => (
              <div 
                key={exam.id} 
                onClick={() => navigate(`/exams/${exam.exam_id}`)}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Trophy size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{(exam.exams as any)?.title || 'Exam'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">
                        Score: {exam.score}/{exam.total_points}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        • {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
            )) : (
              <div className="glass-panel p-8 rounded-2xl text-center">
                <p className="text-sm text-slate-500 italic">No exams completed yet.</p>
                <button 
                  onClick={() => navigate('/exams')}
                  className="mt-3 text-xs text-indigo-400 hover:underline"
                >
                  Take an exam
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Productivity Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
            <Flame size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Productivity Score</h3>
          <p className="text-3xl font-black text-indigo-400 mt-1">{productivityScore}%</p>
          <p className="text-xs text-slate-400 mt-2 max-w-[150px]">
            Based on your focus vs break ratio this week.
          </p>
        </motion.div>

        {/* Live Study Buddies */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              Live Now
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex -space-x-2 overflow-hidden mb-3">
            {activeUsers.slice(0, 5).map((u, i) => (
              <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : (u.name || 'U').charAt(0)}
              </div>
            ))}
            {activeUsers.length > 5 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                +{activeUsers.length - 5}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {activeUsers.length > 0 ? `${activeUsers.length} buddies are studying right now.` : 'Study alone or invite friends!'}
          </p>
          <button 
            onClick={() => navigate('/groups')}
            className="mt-auto text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Join a room <ArrowRight size={12} />
          </button>
        </motion.div>

        {/* Study Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Star size={24} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Study Tip of the Day</h4>
            <p className="text-slate-200 font-medium italic">"{studyTip}"</p>
          </div>
        </motion.div>
      </div>

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
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <defs>
                  <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="colorLecture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="colorProblem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }}
                  content={<CustomTooltip />}
                />
                <Bar 
                  dataKey="study" 
                  stackId="a" 
                  fill="url(#colorStudy)" 
                  radius={[0, 0, 4, 4]} 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="lecture" 
                  stackId="a" 
                  fill="url(#colorLecture)" 
                  animationDuration={1500}
                  animationBegin={200}
                />
                <Bar 
                  dataKey="problem" 
                  stackId="a" 
                  fill="url(#colorProblem)" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                  animationBegin={400}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Subject Focus
            </h2>
          </div>
          <div className="space-y-5 flex-1">
            {subjectData.length > 0 ? subjectData.map((subject, idx) => {
              const maxMins = subjectData[0].minutes;
              const width = Math.max(10, (subject.minutes / maxMins) * 100);
              const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
              
              return (
                <div key={subject.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{subject.name}</span>
                    <span className="text-slate-400">{Math.round(subject.minutes)}m</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn("h-full rounded-full", colors[idx % colors.length])}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <BookOpen size={32} opacity={0.2} />
                <p className="text-sm italic">No subject data yet</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Stars</span>
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star size={16} fill="currentColor" />
                {totalStars}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              My Recent Activity
            </h2>
            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveActivity.length > 0 ? liveActivity.map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => activity.type === 'exam' ? navigate(`/exams/${activity.examId}`) : null}
                className={cn(
                  "flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 group hover:border-indigo-500/30 transition-all",
                  activity.type === 'exam' && "cursor-pointer"
                )}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.bg} ${activity.color}`}>
                  {activity.type === 'study' && <BookOpen size={18} />}
                  {activity.type === 'lecture' && <MonitorPlay size={18} />}
                  {activity.type === 'problem' && <PenTool size={18} />}
                  {activity.type === 'break' && <Clock size={18} />}
                  {activity.type === 'exam' && <Trophy size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-2 py-10 text-center text-slate-500 italic text-sm">
                No recent activity recorded.
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Weekly Summary</h2>
            <div className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Goal: {Math.floor(weeklyGoal / 60)}h
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-400">Total Time</span>
              <span className="text-sm font-bold text-white">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Weekly Progress</span>
                <span>{Math.round((weeklyMinutes / weeklyGoal) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (weeklyMinutes / weeklyGoal) * 100)}%` }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-400">Avg. Daily</span>
              <span className="text-sm font-bold text-white">{Math.round(weeklyMinutes / 7)}m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-400">Best Day</span>
              <span className="text-sm font-bold text-emerald-400">
                {chartData.length > 0 ? chartData.reduce((prev, current) => (prev.study + prev.lecture + prev.problem > current.study + current.lecture + current.problem) ? prev : current).name : 'N/A'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/analytics')}
            className="w-full mt-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            Detailed Analytics
          </button>
        </motion.div>
      </div>
    </div>
  );
}
