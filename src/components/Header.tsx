import { Bell, Search, Menu, Users, Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header({ 
  activeUsersCount = 0,
  onMenuClick
}: { 
  activeUsersCount?: number;
  onMenuClick?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="h-16 flex-shrink-0 bg-slate-900/30 dark:bg-slate-900/30 bg-white/80 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-900/50 dark:bg-slate-900/50 bg-slate-100 border border-slate-800 dark:border-slate-800 border-slate-200 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder={t('Search friends, rooms...')} 
            className="bg-transparent border-none outline-none text-sm text-slate-200 dark:text-slate-200 text-slate-800 placeholder-slate-500 w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          12 Day Streak! 🔥
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/50 dark:bg-slate-800/50 bg-slate-100 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 hover:bg-slate-200 text-slate-300 dark:text-slate-300 text-slate-700 text-xs font-medium transition-colors"
            title="Toggle Language"
          >
            <Languages size={14} />
            {language === 'en' ? 'BN' : 'EN'}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 hover:text-slate-800 rounded-full hover:bg-slate-800 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {activeUsersCount > 0 && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
              title={`${activeUsersCount} users studying right now`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Users size={12} />
              {activeUsersCount}
            </div>
          )}
          <button className="relative p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-slate-900"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
