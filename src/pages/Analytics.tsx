import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  Clock, Calendar, BookOpen, Star, TrendingUp, Download, 
  ChevronLeft, ChevronRight, Filter, Info, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/Sidebar';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    totalSessions: 0,
    avgSession: 0,
    totalStars: 0,
    currentStreak: 0,
    mostProductiveDay: 'N/A',
    topSubject: 'N/A',
    productiveHour: 'N/A',
    globalRank: 0,
    taskCompletionRate: 0,
    totalTasks: 0,
    completedTasks: 0,
    prevTotalMinutes: 0,
    prevTotalSessions: 0,
    deepWorkSessions: 0,
    bestDayOfWeek: 'N/A',
    todayMinutes: 0,
    studyBreakRatio: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [intensityData, setIntensityData] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [sessionDistribution, setSessionDistribution] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [taskPriorityData, setTaskPriorityData] = useState<any[]>([]);
  const [subjectMasteryData, setSubjectMasteryData] = useState<any[]>([]);
  const [studyBreakData, setStudyBreakData] = useState<any[]>([]);
  const [examPerformanceData, setExamPerformanceData] = useState<any[]>([]);
  const [examStats, setExamStats] = useState({
    totalExams: 0,
    avgScore: 0,
    bestScore: 0,
    totalPoints: 0,
    totalScored: 0
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('study_daily_goal');
    return saved ? parseInt(saved) : 120;
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAnalyticsData();
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Current Period Query
      let query = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Previous Period Query for comparison
      let prevQuery = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id);

      const now = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
      
      const currentStart = new Date();
      currentStart.setDate(now.getDate() - days);
      
      const prevStart = new Date();
      prevStart.setDate(now.getDate() - (days * 2));
      const prevEnd = new Date();
      prevEnd.setDate(now.getDate() - days);

      if (timeRange !== 'all') {
        query = query.gte('created_at', currentStart.toISOString());
        prevQuery = prevQuery.gte('created_at', prevStart.toISOString()).lt('created_at', prevEnd.toISOString());
      }

      const [currentRes, prevRes, tasksRes, profileRes, examsRes] = await Promise.all([
        query,
        prevQuery,
        supabase.from('tasks').select('*').eq('user_id', user?.id),
        supabase.from('profiles').select('total_stars, current_streak').eq('id', user?.id).single(),
        supabase.from('exam_submissions').select('*, exams(title, total_points)').eq('user_id', user?.id).order('submitted_at', { ascending: true })
      ]);

      if (currentRes.error) throw currentRes.error;

      const currentData = currentRes.data || [];
      const prevData = prevRes.data || [];
      const tasksData = tasksRes.data || [];
      const profile = profileRes.data;
      const examsData = examsRes.data || [];

      const prevTotalMinutes = prevData.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const prevTotalSessions = prevData.length;

      setSessions(currentData);
      processData(currentData, prevTotalMinutes, prevTotalSessions, tasksData);
      processExamData(examsData);
      
      if (profile) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_stars', profile.total_stars || 0);
        
        setStats(prev => ({ 
          ...prev, 
          totalStars: profile.total_stars || 0,
          currentStreak: profile.current_streak || 0,
          globalRank: (count || 0) + 1
        }));
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: any[], prevMins: number, prevSessions: number, tasks: any[]) => {
    if (!data.length && !tasks.length) {
      setStats(prev => ({
        ...prev,
        totalMinutes: 0,
        totalSessions: 0,
        avgSession: 0,
        mostProductiveDay: 'N/A',
        topSubject: 'N/A',
        taskCompletionRate: 0,
        totalTasks: 0,
        completedTasks: 0
      }));
      setChartData([]);
      setSubjectData([]);
      return;
    }

    const totalMinutes = data.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const avgSession = data.length ? Math.round(totalMinutes / data.length) : 0;

    // Task Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task Priority Data
    const priorityMap = { 'high': 0, 'medium': 0, 'low': 0 };
    tasks.forEach(t => {
      const p = (t.priority || 'medium').toLowerCase();
      if (p in priorityMap) priorityMap[p as keyof typeof priorityMap]++;
    });
    setTaskPriorityData(Object.entries(priorityMap).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    })));

    // Deep Work Sessions (> 45 mins)
    const deepWorkSessions = data.filter(s => (s.duration_minutes || 0) >= 45).length;

    // Today's study time
    const today = new Date().toDateString();
    const todayMinutes = data
      .filter(s => new Date(s.created_at).toDateString() === today)
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    // Process hourly data
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);

    // Process weekly schedule (7 days x 24 hours)
    const scheduleMap = new Map();
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        scheduleMap.set(`${d}-${h}`, 0);
      }
    }

    data.forEach(s => {
      const date = new Date(s.created_at);
      const hour = date.getHours();
      const day = date.getDay(); // 0 (Sun) to 6 (Sat)
      
      hourlyMap.set(hour, hourlyMap.get(hour) + (s.duration_minutes || 0));
      scheduleMap.set(`${day}-${hour}`, scheduleMap.get(`${day}-${hour}`) + (s.duration_minutes || 0));
    });

    const hourlyArr = Array.from(hourlyMap.entries()).map(([hour, minutes]) => ({
      hour: `${hour}:00`,
      minutes,
      label: hour >= 12 ? `${hour === 12 ? 12 : hour - 12} PM` : `${hour === 0 ? 12 : hour} AM`
    }));
    setHourlyData(hourlyArr);

    const scheduleArr = Array.from(scheduleMap.entries()).map(([key, minutes]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, minutes };
    });
    setWeeklySchedule(scheduleArr);

    // Session length distribution
    const distMap = {
      '< 30m': 0,
      '30-60m': 0,
      '1-2h': 0,
      '> 2h': 0
    };
    data.forEach(s => {
      const mins = s.duration_minutes || 0;
      if (mins < 30) distMap['< 30m']++;
      else if (mins <= 60) distMap['30-60m']++;
      else if (mins <= 120) distMap['1-2h']++;
      else distMap['> 2h']++;
    });
    setSessionDistribution(Object.entries(distMap).map(([name, value]) => ({ name, value })));

    // Find most productive hour
    let maxHourMins = 0;
    let bestHour = 0;
    hourlyMap.forEach((mins, hour) => {
      if (mins > maxHourMins) {
        maxHourMins = mins;
        bestHour = hour;
      }
    });
    const productiveHourStr = bestHour >= 12 
      ? `${bestHour === 12 ? 12 : bestHour - 12} PM` 
      : `${bestHour === 0 ? 12 : bestHour} AM`;

    // Process daily data for chart and productivity trend
    const dailyMap = new Map();
    const dailyTasksMap = new Map();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const fullDateStr = d.toDateString();
      dailyMap.set(dateStr, 0);
      dailyTasksMap.set(fullDateStr, 0);
    }

    data.forEach(s => {
      const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, dailyMap.get(dateStr) + (s.duration_minutes || 0));
      }
    });

    tasks.filter(t => t.completed && t.completed_at).forEach(t => {
      const dateStr = new Date(t.completed_at).toDateString();
      if (dailyTasksMap.has(dateStr)) {
        dailyTasksMap.set(dateStr, dailyTasksMap.get(dateStr) + 1);
      }
    });

    const chartArr = Array.from(dailyMap.entries())
      .map(([name, minutes]) => ({ name, hours: parseFloat((minutes / 60).toFixed(1)) }))
      .reverse();
    
    setChartData(chartArr);

    // Productivity Trend Data
    const prodTrendArr = Array.from(dailyMap.entries()).map(([name, minutes]) => {
      // Find matching tasks count
      const d = new Date(name + ', ' + new Date().getFullYear());
      const fullDateStr = d.toDateString();
      const tasksCount = dailyTasksMap.get(fullDateStr) || 0;
      // Score = (minutes / 30) + (tasks * 2)
      const score = Math.round((minutes / 30) + (tasksCount * 5));
      return { name, score };
    }).reverse();
    setProductivityData(prodTrendArr);

    // Study vs Break Data
    const studyMins = data.filter(s => s.activity_type !== 'break').reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const breakMins = data.filter(s => s.activity_type === 'break').reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    setStudyBreakData([
      { name: 'Study', value: studyMins },
      { name: 'Break', value: breakMins }
    ]);
    const studyBreakRatio = breakMins ? parseFloat((studyMins / breakMins).toFixed(1)) : studyMins;

    // Subject Mastery (Tasks completed vs total per category)
    const masteryMap = new Map();
    tasks.forEach(t => {
      const cat = t.category || 'General';
      if (!masteryMap.has(cat)) masteryMap.set(cat, { total: 0, completed: 0 });
      const current = masteryMap.get(cat);
      current.total++;
      if (t.completed) current.completed++;
    });
    setSubjectMasteryData(Array.from(masteryMap.entries()).map(([name, stats]) => ({
      name,
      percentage: Math.round((stats.completed / stats.total) * 100),
      total: stats.total,
      completed: stats.completed
    })).sort((a, b) => b.percentage - a.percentage));

    // Best Day of Week
    const dayOfWeekMap = new Map();
    daysOfWeek.forEach(d => dayOfWeekMap.set(d, 0));
    data.forEach(s => {
      const dayName = daysOfWeek[new Date(s.created_at).getDay()];
      dayOfWeekMap.set(dayName, dayOfWeekMap.get(dayName) + (s.duration_minutes || 0));
    });
    let maxDayMins = 0;
    let bestDayOfWeek = 'N/A';
    dayOfWeekMap.forEach((mins, day) => {
      if (mins > maxDayMins) {
        maxDayMins = mins;
        bestDayOfWeek = day;
      }
    });

    // Process subject data
    const subjectMap = new Map();
    data.forEach(s => {
      const sub = s.subject || 'Uncategorized';
      subjectMap.set(sub, (subjectMap.get(sub) || 0) + (s.duration_minutes || 0));
    });

    const subjectArr = Array.from(subjectMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    setSubjectData(subjectArr);

    // Process activity data
    const activityMap = new Map();
    data.forEach(s => {
      const type = s.activity_type || 'study';
      activityMap.set(type, (activityMap.get(type) || 0) + (s.duration_minutes || 0));
    });

    const activityArr = Array.from(activityMap.entries())
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
      .sort((a, b) => b.value - a.value);
    
    setActivityData(activityArr);

    // Process intensity data (last 30 days)
    const intensityMap = new Map();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      intensityMap.set(d.toDateString(), 0);
    }

    data.forEach(s => {
      const dateStr = new Date(s.created_at).toDateString();
      if (intensityMap.has(dateStr)) {
        intensityMap.set(dateStr, intensityMap.get(dateStr) + (s.duration_minutes || 0));
      }
    });

    const intensityArr = Array.from(intensityMap.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .reverse();
    setIntensityData(intensityArr);

    // Find top subject and productive day
    const topSub = subjectArr.length > 0 ? subjectArr[0].name : 'N/A';
    
    let maxMins = 0;
    let bestDay = 'N/A';
    dailyMap.forEach((mins, day) => {
      if (mins > maxMins) {
        maxMins = mins;
        bestDay = day;
      }
    });

    setStats(prev => ({
      ...prev,
      totalMinutes,
      totalSessions: data.length,
      avgSession,
      mostProductiveDay: bestDay,
      topSubject: topSub,
      productiveHour: productiveHourStr,
      taskCompletionRate,
      totalTasks,
      completedTasks,
      prevTotalMinutes: prevMins,
      prevTotalSessions: prevSessions,
      deepWorkSessions,
      bestDayOfWeek,
      todayMinutes,
      studyBreakRatio
    }));
  };

  const processExamData = (data: any[]) => {
    if (!data.length) {
      setExamStats({ totalExams: 0, avgScore: 0, bestScore: 0, totalPoints: 0, totalScored: 0 });
      setExamPerformanceData([]);
      return;
    }

    const totalExams = data.length;
    let totalScored = 0;
    let totalPoints = 0;
    let bestScore = 0;

    const performanceArr = data.map(sub => {
      const score = sub.score || 0;
      const points = sub.exams?.total_points || 100;
      const percentage = Math.round((score / points) * 100);
      
      totalScored += score;
      totalPoints += points;
      if (percentage > bestScore) bestScore = percentage;

      return {
        name: sub.exams?.title || 'Exam',
        score: percentage,
        date: new Date(sub.submitted_at).toLocaleDateString()
      };
    });

    setExamStats({
      totalExams,
      avgScore: Math.round((totalScored / totalPoints) * 100),
      bestScore,
      totalPoints,
      totalScored
    });
    setExamPerformanceData(performanceArr);
  };

  const updateDailyGoal = (val: number) => {
    setDailyGoal(val);
    localStorage.setItem('study_daily_goal', val.toString());
    setIsGoalModalOpen(false);
  };

  const handleExport = () => {
    window.print();
  };

  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Learning Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Visualize your progress and study patterns.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700/50 transition-colors"
          >
            <Star size={16} className="text-amber-400" />
            Goal: {Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m
          </button>

          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  timeRange === range 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 transition-colors"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Study Time', 
            value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`, 
            icon: Clock, 
            color: 'text-indigo-400', 
            bg: 'bg-indigo-500/10',
            growth: timeRange !== 'all' ? getGrowth(stats.totalMinutes, stats.prevTotalMinutes) : null
          },
          { 
            label: 'Deep Work Sessions', 
            value: stats.deepWorkSessions, 
            icon: BookOpen, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-500/10',
            sub: 'Sessions > 45 mins'
          },
          { 
            label: 'Task Completion', 
            value: `${stats.taskCompletionRate}%`, 
            icon: CheckCircle2, 
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10',
            sub: `${stats.completedTasks}/${stats.totalTasks} tasks`
          },
          { 
            label: 'Daily Goal', 
            value: `${Math.round(Math.min(100, (stats.todayMinutes / dailyGoal) * 100))}%`, 
            icon: TrendingUp, 
            color: 'text-amber-400', 
            bg: 'bg-amber-500/10',
            sub: `${stats.todayMinutes}/${dailyGoal} mins today`
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              {stat.growth !== null && (
                <div className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full",
                  stat.growth >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {stat.growth >= 0 ? '+' : ''}{stat.growth}%
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              {stat.sub && <p className="text-[10px] text-slate-500 mt-1">{stat.sub}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" />
              Study Activity
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
              <span>Hours Studied</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <BookOpen size={20} className="text-emerald-400" />
            Subject Focus
          </h3>
          
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Time']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {subjectData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                No data available
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
            {subjectData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-slate-500 font-medium">
                  {Math.round((item.value / stats.totalMinutes) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* New Advanced Charts: Productivity Trend and Task Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" />
              Productivity Trend
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <Info size={12} />
              <span>Based on study time & tasks</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study vs Break Ratio */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Clock size={20} className="text-amber-400" />
            Study vs Break
          </h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studyBreakData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value} mins`, 'Time']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-white">{stats.studyBreakRatio}x</span>
              <span className="text-[8px] text-slate-500 uppercase font-bold">Ratio</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-slate-400">Study Time</span>
              </div>
              <span className="text-white font-bold">{Math.floor(studyBreakData[0]?.value / 60 || 0)}h {studyBreakData[0]?.value % 60 || 0}m</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-400">Break Time</span>
              </div>
              <span className="text-white font-bold">{Math.floor(studyBreakData[1]?.value / 60 || 0)}h {studyBreakData[1]?.value % 60 || 0}m</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subject Mastery and Exam Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" />
              Exam Performance
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <Info size={12} />
              <span>Score % Trend</span>
            </div>
          </div>
          
          {examPerformanceData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} hide />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {examPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-slate-500">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p>No exam data available yet.</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Exams</p>
              <p className="text-xl font-bold text-white">{examStats.totalExams}</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Avg Score</p>
              <p className="text-xl font-bold text-emerald-400">{examStats.avgScore}%</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Best Score</p>
              <p className="text-xl font-bold text-indigo-400">{examStats.bestScore}%</p>
            </div>
          </div>
        </motion.div>

        {/* Subject Mastery */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <BookOpen size={20} className="text-emerald-400" />
            Subject Mastery
          </h3>
          <div className="h-[300px] w-full">
            {subjectMasteryData.length === 0 ? (
              <p className="text-slate-500 text-center py-8 italic">No task data available for mastery tracking.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectMasteryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val}%`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number, name: string, props: any) => {
                      if (name === 'percentage') return [`${value}% (${props.payload.completed}/${props.payload.total} tasks)`, 'Completion'];
                      return [value, name];
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="percentage" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* New Features: Weekly Schedule Heatmap and Session Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Schedule Heatmap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Weekly Study Schedule
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <span>Low</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={cn("w-2 h-2 rounded-sm", i === 0 ? "bg-slate-800" : i === 1 ? "bg-indigo-900/40" : i === 2 ? "bg-indigo-700/60" : "bg-indigo-500")}></div>
                ))}
              </div>
              <span>High</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-[600px]">
              <div className="flex mb-2">
                <div className="w-10"></div>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex-1 text-[8px] text-slate-500 text-center">
                    {h % 4 === 0 ? (h >= 12 ? `${h === 12 ? 12 : h - 12}P` : `${h === 0 ? 12 : h}A`) : ''}
                  </div>
                ))}
              </div>
              {daysOfWeek.map((day, d) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-10 text-[10px] font-bold text-slate-400">{day}</div>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const session = weeklySchedule.find(s => s.day === d && s.hour === h);
                    const mins = session?.minutes || 0;
                    const intensity = mins === 0 ? 0 : mins < 15 ? 1 : mins < 45 ? 2 : 3;
                    const colors = ['bg-slate-800', 'bg-indigo-900/40', 'bg-indigo-700/60', 'bg-indigo-500'];
                    
                    return (
                      <div 
                        key={h} 
                        className={cn("flex-1 h-4 rounded-sm transition-all hover:ring-1 hover:ring-white/20 cursor-help", colors[intensity])}
                        title={`${day} at ${h}:00 - ${mins} mins`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Session Length Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-pink-400" />
            Session Lengths
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Clock size={20} className="text-blue-400" />
            Study Time by Hour
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value} mins`, 'Duration']}
                />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Type Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-pink-400" />
            Activity Breakdown
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Time']}
                />
                <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Study Intensity Heatmap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-400" />
            Study Intensity (Last 30 Days)
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
              <div className="w-3 h-3 rounded-sm bg-indigo-900/40"></div>
              <div className="w-3 h-3 rounded-sm bg-indigo-700/60"></div>
              <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {intensityData.map((day, i) => {
            const intensity = day.minutes === 0 ? 0 : day.minutes < 60 ? 1 : day.minutes < 180 ? 2 : 3;
            const colors = [
              'bg-slate-800',
              'bg-indigo-900/40',
              'bg-indigo-700/60',
              'bg-indigo-500'
            ];
            
            return (
              <div 
                key={day.date}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all cursor-help hover:ring-2 hover:ring-white/20",
                  colors[intensity]
                )}
                title={`${day.date}: ${Math.floor(day.minutes / 60)}h ${day.minutes % 60}m`}
              >
                {day.minutes > 0 && (
                  <span className="text-[10px] font-bold text-white/40">
                    {Math.floor(day.minutes / 60)}h
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Subject Details Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white px-1">Subject Breakdown</h3>
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Total Time</th>
                  <th className="px-6 py-4 font-medium">Sessions</th>
                  <th className="px-6 py-4 font-medium">Avg. Session</th>
                  <th className="px-6 py-4 font-medium text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {subjectData.map((subject, index) => {
                  const subjectSessions = sessions.filter(s => (s.subject || 'Uncategorized') === subject.name);
                  const avgSession = Math.round(subject.value / subjectSessions.length);
                  const percentage = Math.round((subject.value / stats.totalMinutes) * 100);
                  
                  return (
                    <tr key={subject.name} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="font-medium text-slate-200">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {Math.floor(subject.value / 60)}h {subject.value % 60}m
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {subjectSessions.length} sessions
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {avgSession} mins
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-white w-8">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {subjectData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No subject data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white px-1">Quick Insights</h3>
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Most Productive Day</p>
                <p className="text-xs text-slate-400 mt-1">
                  You studied the most on <span className="text-indigo-400 font-medium">{stats.mostProductiveDay}</span>.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Top Subject</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your primary focus has been <span className="text-indigo-400 font-medium">{stats.topSubject}</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Star size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Global Standing</p>
                <p className="text-xs text-slate-400 mt-1">
                  You are currently ranked <span className="text-indigo-400 font-medium">#{stats.globalRank}</span> globally.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Peak Productivity</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your most active time is around <span className="text-indigo-400 font-medium">{stats.productiveHour}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white">Recent Sessions</h3>
            <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
          </div>
          
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium text-right">Stars</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sessions.slice(0, 5).map((session) => (
                    <tr key={session.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="font-medium text-slate-200">{session.subject || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {session.duration_minutes} mins
                      </td>
                      <td className="px-6 py-4 text-right text-amber-400 font-bold">
                        +{session.stars_earned || 0}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No study sessions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Set Daily Study Goal</h2>
              <p className="text-slate-400 text-sm mb-8">How many minutes do you want to study each day?</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[60, 120, 180, 240, 300, 360].map(mins => (
                    <button
                      key={mins}
                      onClick={() => updateDailyGoal(mins)}
                      className={cn(
                        "py-3 rounded-xl border font-bold transition-all",
                        dailyGoal === mins 
                          ? "bg-indigo-500 border-indigo-400 text-white" 
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                      )}
                    >
                      {mins / 60}h
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="Custom minutes..."
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase">Minutes</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsGoalModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateDailyGoal(dailyGoal)}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Save Goal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
