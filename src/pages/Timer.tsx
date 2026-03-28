import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, BookOpen, MonitorPlay, PenTool, Coffee, Settings2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ActivityType = 'study' | 'lecture' | 'problem' | 'break' | 'prayer' | 'exam';

const activities = [
  { id: 'study', name: 'Studying', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' },
  { id: 'lecture', name: 'Watching Lecture', icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/50' },
  { id: 'problem', name: 'Solving Problems', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/50' },
  { id: 'exam', name: 'Exam', icon: PenTool, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/50' },
  { id: 'prayer', name: 'Prayer', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/50' },
  { id: 'break', name: 'Break', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/50' },
];

export default function Timer() {
  const { user } = useAuth();
  
  // Initialize state from localStorage if available
  const [activeType, setActiveType] = useState<ActivityType>(() => 
    (localStorage.getItem(`timer_${user?.id}_activeType`) as ActivityType) || 'study'
  );
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>(() => 
    (localStorage.getItem(`timer_${user?.id}_mode`) as 'pomodoro' | 'stopwatch') || 'pomodoro'
  );
  const [subject, setSubject] = useState(() => 
    localStorage.getItem(`timer_${user?.id}_subject`) || 'Physics'
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
  
  const [time, setTime] = useState(() => {
    const saved = localStorage.getItem(`timer_${user?.id}_time`);
    return saved ? parseInt(saved, 10) : (25 * 60);
  });

  const [isSaving, setIsSaving] = useState(false);

  // Keep a ref of the latest state to avoid stale closures in the interval
  const stateRef = useRef({ activeType, subject, sessionStartTime, elapsedSeconds, mode, isRunning });
  useEffect(() => {
    stateRef.current = { activeType, subject, sessionStartTime, elapsedSeconds, mode, isRunning };
  });

  // Handle missed time on mount if it was running in background
  useEffect(() => {
    if (!user) return;
    const lastTick = localStorage.getItem(`timer_${user.id}_lastTick`);
    if (isRunning && lastTick) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - parseInt(lastTick, 10)) / 1000);
      
      if (diffSeconds > 0) {
        setElapsedSeconds(prev => prev + diffSeconds);
        if (mode === 'pomodoro') {
          setTime(prev => {
            const newTime = prev - diffSeconds;
            if (newTime <= 0) {
              setIsRunning(false);
              localStorage.setItem(`timer_${user.id}_isRunning`, 'false');
              return 0;
            }
            return newTime;
          });
        } else {
          setTime(prev => prev + diffSeconds);
        }
      }
    }
  }, [user]); // Run once on mount or when user changes

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
      
      if (stateRef.current.mode === 'pomodoro') {
        setTime(t => {
          const next = t - 1;
          localStorage.setItem(`timer_${user.id}_time`, String(next));
          if (next <= 0) {
            setIsRunning(false);
            localStorage.setItem(`timer_${user.id}_isRunning`, 'false');
            // Automatically save when pomodoro finishes
            setTimeout(() => handleSaveSession(stateRef.current.elapsedSeconds + 1), 0);
            return 0;
          }
          return next;
        });
      } else {
        setTime(t => {
          const next = t + 1;
          localStorage.setItem(`timer_${user.id}_time`, String(next));
          return next;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, user]); // Removed elapsedSeconds and mode to prevent recreating interval every second

  // Sync other state changes to localStorage
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`timer_${user.id}_activeType`, activeType);
    localStorage.setItem(`timer_${user.id}_mode`, mode);
    localStorage.setItem(`timer_${user.id}_subject`, subject);
  }, [activeType, mode, subject, user]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
    const defaultTime = mode === 'pomodoro' ? 25 * 60 : 0;
    setTime(defaultTime);
    setElapsedSeconds(0);
    setSessionStartTime(null);
    
    if (user) {
      localStorage.setItem(`timer_${user.id}_isRunning`, 'false');
      localStorage.setItem(`timer_${user.id}_time`, String(defaultTime));
      localStorage.setItem(`timer_${user.id}_elapsedSeconds`, '0');
      localStorage.removeItem(`timer_${user.id}_sessionStartTime`);
      localStorage.removeItem(`timer_${user.id}_lastTick`);
    }
  };

  const handleSaveSession = async (finalElapsed = stateRef.current.elapsedSeconds) => {
    // Minimum 10 seconds to save (makes testing easier and prevents accidental clicks)
    if (!user || finalElapsed < 10) {
      resetTimer();
      return;
    }

    setIsSaving(true);
    setIsRunning(false);
    localStorage.setItem(`timer_${user.id}_isRunning`, 'false');

    // Round up so even 10 seconds counts as 1 minute in the database
    const durationMinutes = Math.max(1, Math.ceil(finalElapsed / 60));
    const isCounted = stateRef.current.activeType !== 'break';

    try {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id: stateRef.current.subject,
        activity_type: stateRef.current.activeType,
        duration_minutes: durationMinutes,
        start_time: stateRef.current.sessionStartTime?.toISOString() || new Date(Date.now() - finalElapsed * 1000).toISOString(),
        end_time: new Date().toISOString(),
        is_counted: isCounted
      });

      if (error) throw error;

      // Update total stars (1 star per 10 minutes of study)
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

  const activeConfig = activities.find(a => a.id === activeType)!;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Focus Timer</h1>
          <p className="text-slate-400 text-sm mt-1">Track your study sessions and stay productive.</p>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => { 
              setMode('pomodoro'); 
              setTime(25 * 60); 
              setIsRunning(false); 
              setElapsedSeconds(0); 
              if (user) localStorage.setItem(`timer_${user.id}_mode`, 'pomodoro');
            }}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", mode === 'pomodoro' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200")}
          >
            Pomodoro
          </button>
          <button 
            onClick={() => { 
              setMode('stopwatch'); 
              setTime(0); 
              setIsRunning(false); 
              setElapsedSeconds(0); 
              if (user) localStorage.setItem(`timer_${user.id}_mode`, 'stopwatch');
            }}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", mode === 'stopwatch' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200")}
          >
            Stopwatch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          {/* Background glow based on active type */}
          <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-500", activeConfig.bg.replace('/10', ''))}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none"
              >
                <option>Physics</option>
                <option>Mathematics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>Computer Science</option>
              </select>
              <button className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-lg border border-slate-700 transition-colors">
                <Settings2 size={18} />
              </button>
            </div>

            <motion.div 
              key={time}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[120px] font-mono font-bold text-white leading-none tracking-tighter drop-shadow-2xl"
            >
              {formatTime(time)}
            </motion.div>
            
            <p className="text-slate-400 mt-4 font-medium tracking-widest uppercase text-sm">
              {mode === 'pomodoro' ? 'Focus Session' : 'Continuous Study'}
            </p>

            <div className="flex items-center gap-6 mt-12">
              <button 
                onClick={resetTimer}
                disabled={isSaving}
                className="w-14 h-14 rounded-full bg-slate-800/80 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
              >
                <RotateCcw size={24} />
              </button>
              
              <button 
                onClick={toggleTimer}
                disabled={isSaving}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                  isRunning ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
                )}
              >
                {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
              </button>
              
              <button 
                onClick={() => handleSaveSession()}
                disabled={isSaving || elapsedSeconds < 10}
                className="w-14 h-14 rounded-full bg-slate-800/80 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                title={elapsedSeconds < 10 ? "Study for at least 10 seconds to save" : "Stop and save session"}
              >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Square size={24} fill="currentColor" />}
              </button>
            </div>
            {elapsedSeconds > 0 && elapsedSeconds < 10 && !isRunning && (
              <p className="text-xs text-rose-400 mt-4">Study for at least 10 seconds to save the session.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Activity</h3>
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setActiveType(activity.id as ActivityType)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border text-left",
                activeType === activity.id 
                  ? `bg-slate-800/80 ${activity.border} shadow-lg` 
                  : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", activity.bg, activity.color)}>
                <activity.icon size={24} />
              </div>
              <div>
                <p className={cn("font-medium", activeType === activity.id ? "text-white" : "text-slate-300")}>{activity.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activity.id === 'break' ? 'Not counted in total' : 'Counted in total hours'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
