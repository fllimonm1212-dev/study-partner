import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data || {});
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user || profile === null) return;

    const room = supabase.channel('live_study_room', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    let isSubscribed = false;
    let lastState = '';

    const updateActiveUsers = () => {
      const newState = room.presenceState();
      const users: any[] = [];
      for (const id in newState) {
        const userState = newState[id][0] as any;
        // Only show users who are actively running a timer
        if (userState && userState.is_running) {
          users.push(userState);
        }
      }
      users.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      setActiveUsers(users);
    };

    room.on('presence', { event: 'sync' }, updateActiveUsers);

    room.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true;
        updateActiveUsers();
      }
    });

    const updatePresence = async () => {
      if (!isSubscribed) return;
      
      const isRunning = localStorage.getItem(`timer_${user.id}_isRunning`) === 'true';
      const activeType = localStorage.getItem(`timer_${user.id}_activeType`) || 'study';
      const subject = localStorage.getItem(`timer_${user.id}_subject`) || 'Physics';
      const sessionStartTime = localStorage.getItem(`timer_${user.id}_sessionStartTime`);
      
      const currentState = JSON.stringify({ isRunning, activeType, subject, sessionStartTime });
      
      if (currentState !== lastState) {
        await room.track({
          user_id: user.id,
          full_name: profile.full_name || user.email?.split('@')[0] || 'Student',
          avatar_url: profile.avatar_url,
          activity_type: activeType,
          subject: subject,
          started_at: sessionStartTime || new Date().toISOString(),
          is_running: isRunning
        });
        lastState = currentState;
      }
    };

    // Initial update and poll every 2 seconds
    const interval = setInterval(updatePresence, 2000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(room);
    };
  }, [user, profile]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header activeUsersCount={activeUsers.length} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <Outlet context={{ activeUsers }} />
        </main>
      </div>
    </div>
  );
}
