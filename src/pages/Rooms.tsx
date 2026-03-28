import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, MonitorPlay, PenTool, Coffee, Users, Search } from 'lucide-react';
import { motion } from 'motion/react';

type ActiveUser = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  activity_type: 'study' | 'lecture' | 'problem' | 'break';
  subject: string;
  started_at: string;
};

const activityConfig = {
  study: { name: 'Studying', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
  lecture: { name: 'Watching Lecture', icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30' },
  problem: { name: 'Solving Problems', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30' },
  break: { name: 'On Break', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
};

export default function Rooms() {
  const { activeUsers } = useOutletContext<{ activeUsers: ActiveUser[] }>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = activeUsers.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (startedAt: string) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(startedAt).getTime()) / 60000);
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Live Study
          </h1>
          <p className="text-slate-400 text-sm mt-1">See who is studying right now and what they are working on.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search students or subjects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2">
            <Users size={18} className="text-indigo-400" />
            <span className="text-sm font-bold text-white">{activeUsers.length}</span>
          </div>
        </div>
      </div>

      {activeUsers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No one is studying right now</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Virtual study rooms help you stay accountable. Turn on your camera, mute your mic, and study alongside peers from around the world. Be the first one to start a focus session!
          </p>
          <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            <PenTool size={18} />
            Start Studying
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, i) => {
            const config = activityConfig[user.activity_type] || activityConfig.study;
            const Icon = config.icon;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={user.user_id}
                className={`glass-panel p-5 rounded-2xl border ${config.border} hover:bg-slate-800/50 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user.full_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white truncate max-w-[140px]">{user.full_name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDuration(user.started_at)}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
                    <Icon size={14} />
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-medium text-slate-200">{user.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-slate-400">Activity:</span>
                    <span className={`font-medium ${config.color}`}>{config.name}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
