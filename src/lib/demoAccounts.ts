export interface DemoAccount {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  class_id: string;
  section: string;
  total_stars: number;
  current_streak: number;
  study_hours: number;
  is_demo: boolean;
  institution?: string;
  bio?: string;
}

const DEMO_MODE_KEY = 'show_demo_accounts';
const DEMO_FRIENDS_KEY = 'demo_accepted_friends';
export const DEMO_MODE_EVENT = 'demo_mode_changed';

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event(DEMO_MODE_EVENT));
}

export function getDemoAcceptedFriends(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEMO_FRIENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDemoFriend(demoId: string): void {
  if (typeof window === 'undefined') return;
  const current = getDemoAcceptedFriends();
  if (!current.includes(demoId)) {
    const updated = [...current, demoId];
    localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(DEMO_MODE_EVENT));
  }
}

export function removeDemoFriend(demoId: string): void {
  if (typeof window === 'undefined') return;
  const current = getDemoAcceptedFriends();
  const updated = current.filter(id => id !== demoId);
  localStorage.setItem(DEMO_FRIENDS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(DEMO_MODE_EVENT));
}

export function isDemoFriend(demoId: string): boolean {
  return getDemoAcceptedFriends().includes(demoId);
}

// Get dynamic demo accounts with realistic naturally increasing study hours and stars
export function getDemoAccounts(): DemoAccount[] {
  // Base study stats
  const now = Date.now();
  // Calculate dynamic study progression (adds ~1-3 stars every few hours smoothly)
  const hoursSinceEpoch = Math.floor(now / (1000 * 60 * 60));
  const timeOffset = (hoursSinceEpoch % 1000);

  const baseList: Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    class_id: string;
    section: string;
    baseStars: number;
    baseStreak: number;
    growthRate: number;
    institution: string;
    bio: string;
  }> = [
    {
      id: 'demo-user-1',
      full_name: 'Tanvir Ahmed',
      email: 'tanvir.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      class_id: 'Class 10',
      section: 'A',
      baseStars: 320,
      baseStreak: 12,
      growthRate: 1.2,
      institution: 'Dhaka Residential Model College',
      bio: 'Loves Physics and solving Math problems daily! 🚀'
    },
    {
      id: 'demo-user-2',
      full_name: 'Anika Rahman',
      email: 'anika.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      class_id: 'HSC-2025',
      section: 'Science',
      baseStars: 450,
      baseStreak: 18,
      growthRate: 1.5,
      institution: 'Viqarunnisa Noon School & College',
      bio: 'Targeting Top Medical Admission! Biology & Chemistry lover. 🩺'
    },
    {
      id: 'demo-user-3',
      full_name: 'Rahat Chowdhury',
      email: 'rahat.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      class_id: 'SSC-2026',
      section: 'Science',
      baseStars: 280,
      baseStreak: 8,
      growthRate: 1.1,
      institution: 'Ideal School & College',
      bio: 'Preparing for SSC 2026 with full dedication! 📖'
    },
    {
      id: 'demo-user-4',
      full_name: 'Nusrat Jahan',
      email: 'nusrat.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      class_id: 'Class 10',
      section: 'B',
      baseStars: 390,
      baseStreak: 15,
      growthRate: 1.3,
      institution: 'Holy Cross College',
      bio: 'Consistency is key. Studying 4 hours every day! ✨'
    },
    {
      id: 'demo-user-5',
      full_name: 'Samiul Islam',
      email: 'samiul.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      class_id: 'HSC-2026',
      section: 'Science',
      baseStars: 210,
      baseStreak: 6,
      growthRate: 1.0,
      institution: 'Notre Dame College',
      bio: 'BUET Aspirant 2026. Higher Math is life! 🧮'
    },
    {
      id: 'demo-user-6',
      full_name: 'Sadia Akter',
      email: 'sadia.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      class_id: 'Class 9',
      section: 'A',
      baseStars: 360,
      baseStreak: 14,
      growthRate: 1.4,
      institution: 'Rajuk Uttara Model College',
      bio: 'Focused on building strong basics in Science. 🧪'
    },
    {
      id: 'demo-user-7',
      full_name: 'Fahim Hasan',
      email: 'fahim.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      class_id: 'HSC-2025',
      section: 'Science',
      baseStars: 510,
      baseStreak: 22,
      growthRate: 1.6,
      institution: 'Chittagong College',
      bio: 'Engineering target! Always solving question banks. ⚙️'
    },
    {
      id: 'demo-user-8',
      full_name: 'Mehedi Hasan',
      email: 'mehedi.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      class_id: 'Class 10',
      section: 'Science',
      baseStars: 250,
      baseStreak: 9,
      growthRate: 1.0,
      institution: 'Government Laboratory High School',
      bio: 'Hard work beats talent. Continuous learner. 📚'
    },
    {
      id: 'demo-user-9',
      full_name: 'Sumaiya Islam',
      email: 'sumaiya.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      class_id: 'SSC-2026',
      section: 'Science',
      baseStars: 410,
      baseStreak: 16,
      growthRate: 1.4,
      institution: 'Mymensingh Girls Cadet College',
      bio: 'A+ target in SSC 2026! Study buddy welcome! 🌟'
    },
    {
      id: 'demo-user-10',
      full_name: 'Arafat Hossain',
      email: 'arafat.demo@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      class_id: 'Class 9',
      section: 'B',
      baseStars: 295,
      baseStreak: 10,
      growthRate: 1.2,
      institution: 'Sylhet Govt Pilot High School',
      bio: 'Learning new concepts every day with enthusiasm! 🎯'
    }
  ];

  return baseList.map(item => {
    // Dynamic calculation: stars = base + time progression
    const addedStars = Math.floor(timeOffset * item.growthRate % 80);
    const totalStars = item.baseStars + addedStars;
    const studyHours = Math.round((totalStars / 6) * 10) / 10;

    return {
      id: item.id,
      full_name: item.full_name,
      email: item.email,
      avatar_url: item.avatar_url,
      class_id: item.class_id,
      section: item.section,
      total_stars: totalStars,
      current_streak: item.baseStreak,
      study_hours: studyHours,
      is_demo: true,
      institution: item.institution,
      bio: item.bio
    };
  });
}
