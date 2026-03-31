import { useState, useEffect, useRef, FormEvent } from 'react';
import { Play, Pause, Square, RotateCcw, BookOpen, MonitorPlay, PenTool, Coffee, Settings2, Loader2, Check, Sparkles, Star, Clock, XCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ActivityType = 'study' | 'lecture' | 'problem' | 'break' | 'prayer' | 'exam' | 'ai_study';

const activities = [
  { id: 'study', name: 'Studying', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' },
  { id: 'lecture', name: 'Watching Lecture', icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/50' },
  { id: 'problem', name: 'Solving Problems', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/50' },
  { id: 'ai_study', name: 'AI Study Session', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  { id: 'exam', name: 'Exam', icon: PenTool, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/50' },
  { id: 'prayer', name: 'Prayer', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/50' },
  { id: 'break', name: 'Break', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/50' },
];

export default function Timer() {
  const { user } = useAuth();
  
  const [durations, setDurations] = useState<Record<ActivityType, number>>(() => {
    const saved = localStorage.getItem(`timer_${user?.id}_durations`);
    return saved ? JSON.parse(saved) : {
      study: 25,
      lecture: 45,
      problem: 30,
      ai_study: 25,
      exam: 60,
      prayer: 15,
      break: 5
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Initialize state from localStorage if available
  const [activeType, setActiveType] = useState<ActivityType>(() => 
    (localStorage.getItem(`timer_${user?.id}_activeType`) as ActivityType) || 'study'
  );
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>(() => 
    (localStorage.getItem(`timer_${user?.id}_mode`) as 'pomodoro' | 'stopwatch') || 'pomodoro'
  );
  
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem(`timer_${user?.id}_subjects`);
    return saved ? JSON.parse(saved) : ['Physics', 'Mathematics', 'Chemistry', 'Biology', 'Computer Science'];
  });

  const [subject, setSubject] = useState(() => 
    localStorage.getItem(`timer_${user?.id}_subject`) || 'Physics'
  );

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
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
    if (saved) return parseInt(saved, 10);
    
    // Fallback to default duration for active type
    const initialType = (localStorage.getItem(`timer_${user?.id}_activeType`) as ActivityType) || 'study';
    const initialDurations = localStorage.getItem(`timer_${user?.id}_durations`) 
      ? JSON.parse(localStorage.getItem(`timer_${user?.id}_durations`)!) 
      : { study: 25, lecture: 45, problem: 30, exam: 60, prayer: 15, break: 5 };
    
    return (initialDurations[initialType] || 25) * 60;
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
    localStorage.setItem(`timer_${user.id}_durations`, JSON.stringify(durations));
    localStorage.setItem(`timer_${user.id}_subjects`, JSON.stringify(subjects));
  }, [activeType, mode, subject, user, durations, subjects]);

  // Update time when activeType changes (if not running and in pomodoro mode)
  useEffect(() => {
    if (!isRunning && mode === 'pomodoro') {
      const newTime = (durations[activeType] || 25) * 60;
      setTime(newTime);
      if (user) localStorage.setItem(`timer_${user.id}_time`, String(newTime));
    }
  }, [activeType, mode, durations, isRunning, user]);

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
    const defaultTime = mode === 'pomodoro' ? (durations[activeType] || 25) * 60 : 0;
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

  const handleSaveSession = async (
    finalElapsed = stateRef.current.elapsedSeconds,
    type = stateRef.current.activeType,
    sub = stateRef.current.subject,
    startTime = stateRef.current.sessionStartTime
  ) => {
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
    const isCounted = type !== 'break';

    try {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        subject_id: sub,
        activity_type: type,
        duration_minutes: durationMinutes,
        start_time: startTime?.toISOString() || new Date(Date.now() - finalElapsed * 1000).toISOString(),
        end_time: new Date().toISOString(),
        is_counted: isCounted
      });

      if (error) throw error;

      toast.success('Session saved successfully!');

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
            // Already studied today
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
          
          if (starsEarned > 0) {
            toast.success(`You earned ${starsEarned} star${starsEarned > 1 ? 's' : ''}!`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
      resetTimer();
    }
  };

  // Save session on unmount if it's been running
  useEffect(() => {
    return () => {
      if (stateRef.current.isRunning && stateRef.current.elapsedSeconds >= 10) {
        // We can't wait for this to finish, but we can fire it
        handleSaveSession();
      }
    };
  }, []);

  const handleAddSubject = (e: FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim() && !subjects.includes(newSubjectName.trim())) {
      const updatedSubjects = [...subjects, newSubjectName.trim()];
      setSubjects(updatedSubjects);
      setSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  const removeSubject = (subToRemove: string) => {
    if (subjects.length <= 1) return;
    const updatedSubjects = subjects.filter(s => s !== subToRemove);
    setSubjects(updatedSubjects);
    if (subject === subToRemove) {
      setSubject(updatedSubjects[0]);
    }
  };

  const activeConfig = activities.find(a => a.id === activeType)!;

  // Calculate progress for the ring
  const calculateProgress = () => {
    if (mode === 'stopwatch') return 100;
    const total = (durations[activeType] || 25) * 60;
    return Math.max(0, (time / total) * 100);
  };

  const progress = calculateProgress();
  const strokeDasharray = 2 * Math.PI * 140; // r=140
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-indigo-400 w-5 h-5" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Focus Timer</h1>
          </div>
          <p className="text-slate-400 text-sm">Track your study sessions and stay productive.</p>
        </div>
        
            <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button 
            onClick={async () => { 
              if (mode === 'pomodoro') return;
              if (isRunning && elapsedSeconds >= 10) {
                await handleSaveSession();
              }
              setMode('pomodoro'); 
              const newTime = (durations[activeType] || 25) * 60;
              setTime(newTime); 
              setIsRunning(false); 
              setElapsedSeconds(0); 
              if (user) {
                localStorage.setItem(`timer_${user.id}_mode`, 'pomodoro');
                localStorage.setItem(`timer_${user.id}_time`, String(newTime));
              }
            }}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300", 
              mode === 'pomodoro' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            Pomodoro
          </button>
          <button 
            onClick={async () => { 
              if (mode === 'stopwatch') return;
              if (isRunning && elapsedSeconds >= 10) {
                await handleSaveSession();
              }
              setMode('stopwatch'); 
              setTime(0); 
              setIsRunning(false); 
              setElapsedSeconds(0); 
              if (user) {
                localStorage.setItem(`timer_${user.id}_mode`, 'stopwatch');
                localStorage.setItem(`timer_${user.id}_time`, '0');
              }
            }}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300", 
              mode === 'stopwatch' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            Stopwatch
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Settings2 size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Timer Presets</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                        <activity.icon size={12} className={activity.color} />
                        {activity.name}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={durations[activity.id as ActivityType]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setDurations(prev => ({ ...prev, [activity.id]: val }));
                          }}
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase">min</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Customizing these durations will update the default Pomodoro time for each activity. Changes are saved automatically to your profile.
                  </p>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Select Activity</h3>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Recording
              </span>
            )}
          </div>
          
          <div className="relative group/carousel">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
              {activities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={async () => {
                    if (activeType === activity.id) return;
                    if (isRunning && elapsedSeconds >= 10) {
                      await handleSaveSession();
                    }
                    setActiveType(activity.id as ActivityType);
                  }}
                  className={cn(
                    "flex-shrink-0 snap-center group relative w-48 flex flex-col items-center gap-4 p-6 rounded-[32px] transition-all duration-500 border overflow-hidden",
                    activeType === activity.id 
                      ? `bg-slate-800/80 ${activity.border} shadow-2xl scale-[1.05] z-10` 
                      : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700"
                  )}
                >
                  {/* Selection indicator background */}
                  {activeType === activity.id && (
                    <motion.div 
                      layoutId="active-bg-carousel"
                      className={cn("absolute inset-0 opacity-10 pointer-events-none", activity.bg.replace('/10', ''))}
                    />
                  )}

                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner", 
                    activity.bg, 
                    activity.color,
                    activeType === activity.id ? "scale-110 rotate-6 shadow-lg" : "group-hover:scale-105"
                  )}>
                    <activity.icon size={32} />
                  </div>
                  
                  <div className="text-center">
                    <p className={cn("font-black text-sm uppercase tracking-wider transition-colors", activeType === activity.id ? "text-white" : "text-slate-400")}>
                      {activity.name}
                    </p>
                    {activeType === activity.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("mt-2 text-[10px] font-bold uppercase tracking-widest", activity.color)}
                      >
                        Active
                      </motion.div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Fade edges for scroll */}
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity"></div>
          </div>
        </div>

        <div className="lg:col-span-8 glass-panel p-8 md:p-12 rounded-[40px] flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group">
          {/* Background glow based on active type */}
          <motion.div 
            animate={
              isRunning 
                ? { 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [0, 90, 180, 270, 360]
                  } 
                : { 
                    scale: [1, 1.05, 1],
                    opacity: [0.15, 0.25, 0.15],
                    rotate: [0, 0, 0]
                  }
            }
            transition={{ 
              duration: isRunning ? 8 : 15, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-colors duration-700", 
              activeConfig.bg.replace('/10', '')
            )}
          />
          <motion.div 
            animate={
              isRunning 
                ? { 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.3, 0.1],
                    x: ['-50%', '-30%', '-50%'],
                    y: ['-50%', '-70%', '-50%']
                  } 
                : { 
                    scale: [1.05, 1, 1.05],
                    opacity: [0.1, 0.2, 0.1],
                    x: ['-50%', '-45%', '-50%'],
                    y: ['-50%', '-55%', '-50%']
                  }
            }
            transition={{ 
              duration: isRunning ? 12 : 20, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className={cn(
              "absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-colors duration-700", 
              activeConfig.bg.replace('/10', '')
            )}
          />
          
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</span>
                <div className="relative">
                  <select 
                    value={subject}
                    onChange={async (e) => {
                      const newSub = e.target.value;
                      if (subject === newSub) return;
                      if (isRunning && elapsedSeconds >= 10) {
                        await handleSaveSession();
                      }
                      setSubject(newSub);
                    }}
                    className="appearance-none bg-slate-900/90 border border-slate-700/50 text-slate-200 text-sm font-bold rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-4 pr-10 py-3 outline-none transition-all hover:bg-slate-800 cursor-pointer shadow-xl min-w-[160px]"
                  >
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <BookOpen size={16} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-transparent uppercase tracking-widest">.</span>
                <button 
                  onClick={() => setIsAddingSubject(true)}
                  className="p-3 text-slate-400 hover:text-white bg-slate-900/90 rounded-2xl border border-slate-700/50 transition-all hover:bg-slate-800 shadow-xl"
                  title="Add Subject"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-transparent uppercase tracking-widest">.</span>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 text-slate-400 hover:text-white bg-slate-900/90 rounded-2xl border border-slate-700/50 transition-all hover:bg-slate-800 shadow-xl"
                  title="Timer Settings"
                >
                  <Settings2 size={20} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isAddingSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl"
                  >
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                      <Plus className="text-indigo-400" /> Add New Subject
                    </h2>
                    <form onSubmit={handleAddSubject} className="space-y-6">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Subject Name (e.g. Physics)"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {subjects.map(s => (
                          <div key={s} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 group">
                            <span className="text-xs font-bold text-slate-300">{s}</span>
                            <button 
                              type="button"
                              onClick={() => removeSubject(s)}
                              className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsAddingSubject(false)}
                          className="flex-1 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black py-3 rounded-2xl transition-all"
                        >
                          Add Subject
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Timer Display with Progress Ring */}
            <div className="relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80 mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
                {/* Background Circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="140"
                  className="stroke-slate-800/50 fill-none"
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="140"
                  className={cn("fill-none transition-all duration-1000", activeConfig.color.replace('text-', 'stroke-'))}
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray,
                    strokeDashoffset: isRunning ? strokeDashoffset : strokeDasharray,
                  }}
                  initial={{ strokeDashoffset: strokeDasharray }}
                  animate={{ 
                    strokeDashoffset: isRunning ? strokeDashoffset : strokeDasharray,
                    filter: isRunning ? ['drop-shadow(0 0 8px rgba(255,255,255,0.2))', 'drop-shadow(0 0 16px rgba(255,255,255,0.4))', 'drop-shadow(0 0 8px rgba(255,255,255,0.2))'] : 'drop-shadow(0 0 0px rgba(255,255,255,0))'
                  }}
                  transition={isRunning ? { filter: { duration: 2, repeat: Infinity, ease: "easeInOut" } } : {}}
                />
              </svg>

              <div className="flex flex-col items-center justify-center z-10">
                <motion.div 
                  key={subject}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2"
                >
                  {subject}
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={time}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-7xl md:text-8xl font-mono font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  >
                    {formatTime(time)}
                  </motion.div>
                </AnimatePresence>
                
                <motion.div 
                  animate={isRunning ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn("mt-4 font-black tracking-[0.2em] uppercase text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10", activeConfig.color)}
                >
                  {mode === 'pomodoro' ? 'Focus Session' : 'Continuous Study'}
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-8 mt-4">
              <button 
                onClick={resetTimer}
                disabled={isSaving}
                className="w-16 h-16 rounded-3xl bg-slate-900/80 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all border border-slate-800 shadow-xl disabled:opacity-50 group/btn"
              >
                <RotateCcw size={24} className="group-hover/btn:rotate-[-45deg] transition-transform" />
              </button>
              
              <button 
                onClick={toggleTimer}
                disabled={isSaving}
                className={cn(
                  "w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                  isRunning 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30" 
                    : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30"
                )}
              >
                {isRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
              </button>
              
              <button 
                onClick={() => handleSaveSession()}
                disabled={isSaving || elapsedSeconds < 10}
                className="w-16 h-16 rounded-3xl bg-slate-900/80 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all border border-slate-800 shadow-xl disabled:opacity-50 group/btn"
                title={elapsedSeconds < 10 ? "Study for at least 10 seconds to save" : "Stop and save session"}
              >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Square size={24} fill="currentColor" className="group-hover/btn:scale-110 transition-transform" />}
              </button>
            </div>
            
            {elapsedSeconds > 0 && elapsedSeconds < 10 && !isRunning && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-400 mt-6 font-medium bg-rose-400/10 px-4 py-2 rounded-full border border-rose-400/20"
              >
                Study for at least 10 seconds to save the session.
              </motion.p>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Session Info Card */}
          <div className="p-8 rounded-[40px] bg-indigo-500/5 border border-indigo-500/10 h-full flex flex-col justify-center">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">Current Session Stats</h4>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Time Elapsed</p>
                  <span className="text-3xl font-mono font-black text-white tracking-tighter">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Clock size={24} />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stars Earned</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white tracking-tighter">{Math.floor(elapsedSeconds / 600)}</span>
                    <Star size={20} className="text-yellow-400" fill="currentColor" />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                  <Sparkles size={24} />
                </div>
              </div>

              <div className="pt-8 border-t border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activeConfig.bg, activeConfig.color)}>
                    <activeConfig.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Mode</p>
                    <p className="text-sm font-bold text-white">{activeConfig.name}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">
                  <Clock size={12} />
                  Started at {sessionStartTime ? sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
