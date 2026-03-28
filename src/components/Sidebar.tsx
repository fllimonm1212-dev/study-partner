import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Timer, 
  Trophy, 
  Users, 
  BookOpen, 
  UserPlus, 
  Target, 
  BarChart3, 
  User,
  Settings,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Study Timer', path: '/timer', icon: Timer },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Live Study', path: '/rooms', icon: BookOpen },
  { name: 'Friends', path: '/friends', icon: UserPlus },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Challenges', path: '/challenges', icon: Target },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Admin Panel', path: '/admin', icon: ShieldCheck },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) setProfile(data);
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase.channel('profile_changes_sidebar')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        setProfile(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = fullName.substring(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;
  const classInfo = profile?.class_id ? `Class ${profile.class_id} • Section ${profile.section || 'A'}` : 'Student';

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <BookOpen size={18} className="text-indigo-400" />
          </div>
          StudySync
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.filter(item => item.name !== 'Admin Panel' || user?.email === 'fllimonm1212@gmail.com').map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-indigo-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-400 hover:text-slate-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-lg border border-slate-700" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{fullName}</p>
            <p className="text-xs text-slate-500 truncate">{classInfo}</p>
          </div>
          <Settings size={16} />
        </NavLink>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
