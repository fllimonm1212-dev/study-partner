import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'Dashboard': 'Dashboard',
    'Study Timer': 'Study Timer',
    'Leaderboard': 'Leaderboard',
    'Live Study': 'Live Study',
    'Friends': 'Friends',
    'Messages': 'Messages',
    'Groups': 'Groups',
    'Exams': 'Exams',
    'Challenges': 'Challenges',
    'Tasks': 'Tasks',
    'Study Notes': 'Study Notes',
    'Analytics': 'Analytics',
    'Profile': 'Profile',
    'Complain & Request for Feature': 'Complain & Request for Feature',
    'Admin Panel': 'Admin Panel',
    'Contact Us': 'Contact Us',
    'Facebook Profile': 'Facebook Profile',
    'Facebook Home': 'Facebook Home',
    'LinkedIn': 'LinkedIn',
    'Sign Out': 'Sign Out',
    'Search friends, rooms...': 'Search friends, rooms...',
    'Notifications': 'Notifications',
    'No new notifications': 'No new notifications',
    'Student': 'Student',
    'Class': 'Class',
    'Section': 'Section'
  },
  bn: {
    'Dashboard': 'ড্যাশবোর্ড',
    'Study Timer': 'স্টাডি টাইমার',
    'Leaderboard': 'লিডারবোর্ড',
    'Live Study': 'লাইভ স্টাডি',
    'Friends': 'বন্ধুরা',
    'Messages': 'মেসেজ',
    'Groups': 'গ্রুপসমূহ',
    'Exams': 'পরীক্ষা',
    'Challenges': 'চ্যালেঞ্জ',
    'Tasks': 'টাস্ক',
    'Study Notes': 'স্টাডি নোটস',
    'Analytics': 'অ্যানালিটিক্স',
    'Profile': 'প্রোফাইল',
    'Complain & Request for Feature': 'অভিযোগ ও নতুন ফিচার রিকোয়েস্ট',
    'Admin Panel': 'অ্যাডমিন প্যানেল',
    'Contact Us': 'যোগাযোগ করুন',
    'Facebook Profile': 'ফেসবুক প্রোফাইল',
    'Facebook Home': 'ফেসবুক হোম',
    'LinkedIn': 'লিংকডইন',
    'Sign Out': 'লগ আউট',
    'Search friends, rooms...': 'বন্ধু, রুম খুঁজুন...',
    'Notifications': 'নোটিফিকেশন',
    'No new notifications': 'কোনো নতুন নোটিফিকেশন নেই',
    'Student': 'শিক্ষার্থী',
    'Class': 'শ্রেণী',
    'Section': 'শাখা'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
