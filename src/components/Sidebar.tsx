import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
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
  LogOut,
  CheckCircle2,
  MessageSquare,
  FileText,
  Facebook,
  Linkedin,
  HelpCircle,
  StickyNote
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  { name: 'Messages', path: '/messages', icon: MessageSquare },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Exams', path: '/exams', icon: FileText },
  { name: 'Challenges', path: '/challenges', icon: Target },
  { name: 'Tasks', path: '/tasks', icon: CheckCircle2 },
  { name: 'Study Notes', path: '/notes', icon: StickyNote },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Complain & Request for Feature', path: '/feedback', icon: HelpCircle },
  { name: 'Admin Panel', path: '/admin', icon: ShieldCheck },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
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
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 w-72 flex-shrink-0 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/[0.08] z-50 md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col shadow-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-[72px] flex items-center px-6 border-b border-slate-200/50 dark:border-white/[0.05]">
          <div className="flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-extrabold text-xl tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-500/20 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full" />
              <img 
                src="/logo.png" 
                alt="Study Partner Logo" 
                className="w-full h-full object-cover relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            Study Partner
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {navItems.filter(item => item.name !== 'Admin Panel' || user?.email === 'fllimonm1212@gmail.com').map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[15px] font-medium overflow-hidden outline-none",
                  isActive 
                    ? "text-indigo-700 dark:text-white" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-indigo-50/80 dark:bg-white/[0.08] rounded-xl border border-indigo-100/50 dark:border-white/[0.05]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  {!isActive && (
                    <div className="absolute inset-0 bg-slate-100/50 dark:bg-white/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  <item.icon 
                    size={18} 
                    className={cn(
                      "relative z-10 transition-all duration-300",
                      isActive 
                        ? "text-indigo-600 dark:text-indigo-400 scale-110" 
                        : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:scale-110"
                    )} 
                  />
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">{t(item.name)}</span>
                </>
              )}
            </NavLink>
          ))}
          
          <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-white/[0.05] space-y-1.5">
            <p className="px-3 mb-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('Contact Us')}
            </p>
            <a
              href="https://web.facebook.com/fl.limon/about/?fb_profile_edit_entry_point=%7B%22click_point%22%3A%22edit_profile_button%22%2C%22feature%22%3A%22profile_header%22%7D&id=100068135405280&sk=about"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[14px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Facebook size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">{t('Facebook Profile')}</span>
            </a>
            <a
              href="https://web.facebook.com/?_rdc=10&_rdr#"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[14px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Facebook size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">{t('Facebook Home')}</span>
            </a>
            <a
              href="https://www.linkedin.com/in/f-limon-a83436392"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[14px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Linkedin size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">{t('LinkedIn')}</span>
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-white/[0.05] bg-gradient-to-b from-transparent to-slate-50/50 dark:to-white/[0.02] space-y-2">
          <NavLink to="/profile" onClick={onClose} className="group relative flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white dark:hover:bg-white/5 cursor-pointer transition-all duration-300 border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 hover:shadow-sm dark:hover:shadow-none">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {initials}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0B0F19] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{fullName}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate font-medium">{classInfo}</p>
            </div>
            <Settings size={18} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-500 group-hover:rotate-90" />
          </NavLink>
          <button 
            onClick={() => {
              onClose?.();
              signOut();
            }}
            className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-rose-50 dark:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-rose-100 dark:border-rose-500/20" />
            <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="relative z-10">{t('Sign Out')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
