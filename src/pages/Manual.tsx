import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Sparkles, CheckCircle2, ShieldAlert, ArrowRight,
  LayoutDashboard, Timer, Trophy, Users, FileText, Target, CheckCircle,
  StickyNote, Calculator, BarChart3, MessageSquare, UserPlus, HelpCircle,
  Zap, Award, Compass, Lightbulb, Bookmark, Filter, FileCode2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeatureManualItem {
  id: string;
  category: 'tracking' | 'exams' | 'social' | 'gamification' | 'utility';
  titleBn: string;
  titleEn: string;
  icon: any;
  route: string;
  location: string;
  purposeBn: string;
  howToUseStepsBn: string[];
  rulesBn: string[];
  benefitsBn: string[];
  proTipBn: string;
}

export default function ManualPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const manualItems: FeatureManualItem[] = [
    // 1. DASHBOARD & HEATMAP
    {
      id: 'dashboard',
      category: 'tracking',
      titleBn: 'ড্যাশবোর্ড ও ৩০-দিনের অ্যাক্টিভিটি হিটম্যাপ',
      titleEn: 'Dashboard & 30-Day Activity Heatmap',
      icon: LayoutDashboard,
      route: '/dashboard',
      location: 'সাইডবার অপশন #১ (Dashboard)',
      purposeBn: 'প্রতিদিনের পড়ার ট্র্যাকিং, ৩০ দিনের অ্যাক্টিভিটি হিটম্যাপ পর্যবেক্ষণ এবং মোট পড়ার ঘণ্টা অনুযায়ী দৈনিক পয়েন্ট জমা করা।',
      howToUseStepsBn: [
        'অ্যাপে লগইন করার সাথে সাথে ড্যাশবোর্ড স্ক্রিনটি ওপেন হবে।',
        'উপরে আপনার আজকের পড়ার মোট ঘণ্টা (Today\'s Hours) এবং কারেন্ট স্ট্রাইক (Active Streak) দেখতে পাবেন।',
        '৩০ দিনের সবুজ হিটম্যাপ গ্রিড দেখে বুঝতে পারবেন কোনো দিন পড়া মিস হয়েছে কি না (গাঢ় সবুজ = ৪ ঘণ্টার বেশি পড়া)।',
        'Quick Action বাটন ব্যবহার করে সরাসরি টাইমার চালু বা নতুন টাস্ক যোগ করতে পারবেন।'
      ],
      rulesBn: [
        'প্রতিদিন অন্তত ১ ঘণ্টা স্টাডি টাইমার চালু রাখলে স্ট্রাইক (Streak) বজায় থাকবে।',
        'টানা স্ট্রাইক ভাঙলে Streak Multiplier পয়েন্ট জেনারেট হওয়া বন্ধ হয়ে যাবে।'
      ],
      benefitsBn: [
        'প্রোক্রাস্টিনেশন বা পড়ার আলসেমি দূর হয়।',
        'মাসিক ও সাপ্তাহিক পড়ার ধারাবাহিকতা (Consistency) স্পষ্ট ভিজ্যুয়ালি দেখা যায়।'
      ],
      proTipBn: 'প্রতিদিন রাতে ঘুমানোর আগে ড্যাশবোর্ড চেক করুন যেন ৩০ দিনের হিটম্যাপের আজকের ঘরটি সবুজ থাকে!'
    },

    // 2. LIVE STUDY TIMER
    {
      id: 'timer',
      category: 'tracking',
      titleBn: 'লাইভ স্টাডি টাইমার ও ব্যাকগ্রাউন্ড সাউন্ড',
      titleEn: 'Live Study Timer & Ambient Soundscapes',
      icon: Timer,
      route: '/timer',
      location: 'সাইডবার অপশন #২ (Study Timer)',
      purposeBn: 'সাবজেক্টভিত্তিক স্টপওয়াচ বা পোমোডোরো কাউন্টডাউন দিয়ে মনোযোগ ধরে রেখে পড়ালেখা করা এবং ব্যাকগ্রাউন্ডে রিল্যাক্সিং সাউন্ড শোনা।',
      howToUseStepsBn: [
        'সাইডবার থেকে "Study Timer" এ ক্লিক করুন।',
        'পড়ার বিষয় নির্বাচন করুন (যেমন: Physics, Chemistry, Higher Math, Biology)।',
        'ইচ্ছা হলে রেইন (Rain), ফরেস্ট (Forest) বা লো-ফাই (Lo-Fi) ব্যাকগ্রাউন্ড সাউন্ড অন করুন।',
        '"Start Session" বাটনে ক্লিক করে পড়া শুরু করুন। পড়া শেষ হলে "End & Save" চাপলে আপনার অ্যাকাউন্টে অটোমেটিক সময় ও পয়েন্ট যুক্ত হবে।'
      ],
      rulesBn: [
        'ফেক বা ভুয়া সময় জমা না করতে টাইমার অন রেখে অনর্থক অন্য ট্যাবে বসে থাকবেন না।',
        'সর্বনিম্ন ১০ মিনিট স্টাডি সেশন সম্পন্ন করলে তা হিটম্যাপে কাউন্ট হবে।'
      ],
      benefitsBn: [
        'বিষয়ভিত্তিক পড়ার সঠিক হিসাব বের করা যায়।',
        'মনোযোগ বিচ্যুত না হয়ে পড়ালেখায় গভীর ফোকাস (Deep Work) তৈরি হয়।'
      ],
      proTipBn: 'টানা ২৫ মিনিট পড়ে ৫ মিনিটের পোমোডোরো ব্রেক (Pomodoro) নিলে ব্রেইন দীর্ঘক্ষণ রিফ্রেশ থাকে।'
    },

    // 3. MODEL TESTS & EXAMS
    {
      id: 'exams',
      category: 'exams',
      titleBn: 'অনলাইন মডেল টেস্ট ও এমসিকিউ এক্সাম ইঞ্জিন',
      titleEn: 'Online MCQ Model Tests & Instant Result',
      icon: FileText,
      route: '/exams',
      location: 'সাইডবার অপশন #৮ (Exams)',
      purposeBn: 'এইচএসসি ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সিলেবাস অনুযায়ী নির্ধারিত সময়ে এমসিকিউ মডেল টেস্ট দেওয়া এবং ভুল উত্তরের সঠিক ব্যাখ্যা জানা।',
      howToUseStepsBn: [
        'সাইডবার থেকে "Exams" পেজে প্রবেশ করুন।',
        'আপনার কাঙ্ক্ষিত বিষয় বা অধ্যায়ের পরীক্ষা সিলেক্ট করে "Start Exam" বাটনে চাপুন।',
        'উপরে রানিং কাউন্টডাউন টাইমার দেখে নির্ধারিত সময়ের মধ্যে সব এমসিকিউ উত্তর করুন।',
        'পরীক্ষা শেষে "Submit Exam" চাপলে সাথে সাথেই আপনার মার্কস, সঠিক/ভুল উত্তর এবং নেগেটিভ মার্কিং হিসাব দেখতে পাবেন।'
      ],
      rulesBn: [
        'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার নিয়মে প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর (Negative Marking -0.25) কাটা যাবে।',
        'টাইমার শেষ হওয়ার আগেই সাবমিট করা নিশ্চিত করুন।'
      ],
      benefitsBn: [
        'পরীক্ষার হলের টাইমিং ও প্রেসার নেয়ার অভ্যাস গড়ে ওঠে।',
        'কোন অধ্যায়ে দুর্বলতা আছে তা উত্তরপত্রের ব্যাখ্যামূলক সমাধান দেখে সঙ্গে সঙ্গে শুধরে নেয়া যায়।'
      ],
      proTipBn: 'সপ্তাহে অন্তত ২টি মডেল টেস্ট দিয়ে আপনার ন্যাশনাল পারসেন্টাইল র‍্যাঙ্ক চেক করুন।'
    },

    // 4. STUDY GROUPS & SQUADS
    {
      id: 'groups',
      category: 'social',
      titleBn: 'এইচএসসি ও এডমিশন স্টাডি গ্রুপ (Science Squad)',
      titleEn: 'Study Groups & Peer Chat',
      icon: Users,
      route: '/groups',
      location: 'সাইডবার অপশন #৭ (Groups)',
      purposeBn: 'একই ব্যাচের (HSC 2025/2026 বা BUET/Medical) সহপাঠীদের সাথে গ্রুপ চ্যাট, প্রশ্নপত্র বা নোটস শেয়ার এবং কঠিন টপিক নিয়ে আলোচনা।',
      howToUseStepsBn: [
        'সাইডবার থেকে "Groups" এ যান।',
        'পছন্দসই গ্রুপে (যেমন: HSC 2025 Science Squad, BUET Targeters) "Join Group" করুন।',
        'গ্রুপ চ্যাটে মেসেজ লিখুন বা কোনো প্রশ্নের ছবি/পিডিএফ থাকলে "Attach File" করে পোস্ট করুন।',
        'অন্যদের প্রশ্নের উত্তর দিয়ে স্টাডি হেল্পার ব্যাজ অর্জন করুন।'
      ],
      rulesBn: [
        'গ্রুপে কেবল পড়ালেখা সম্পর্কিত বিষয় আলোচনা করতে হবে। কোনো স্প্যামিং বা অনাকাঙ্ক্ষিত লিংক দেওয়া নিষিদ্ধ।',
        'অন্য সহপাঠীদের সাথে শালীন ও বন্ধুত্বপূর্ণ আচরণ বজায় রাখতে হবে।'
      ],
      benefitsBn: [
        'একা পড়ার একঘেয়েমি কেটে যায়।',
        'গ্রুপের অন্যদের পড়ালেখার অগ্রগতি দেখে নিজের মধ্যেও পজিটিভ কম্পিটিশন তৈরি হয়।'
      ],
      proTipBn: 'কঠিন কোনো ম্যাথ বুঝতে না পারলে গ্রুপে পোস্ট করুন, সহপাঠীরা দ্রুত সলভ পাঠাবে।'
    },

    // 5. DIRECT MESSAGING & FRIENDS
    {
      id: 'messages',
      category: 'social',
      titleBn: '১-অন-১ প্রাইভিক চ্যাট ও ফ্রেন্ড রিকোয়েস্ট',
      titleEn: '1-on-1 Direct Messaging & Friends',
      icon: MessageSquare,
      route: '/messages',
      location: 'সাইডবার অপশন #৫ (Friends) ও #৬ (Messages)',
      purposeBn: 'নিজের পছন্দের স্টাডি পার্টনার বা বন্ধুদের ফ্রেন্ড রিকোয়েস্ট পাঠিয়ে প্রাইভিক চ্যাটে নোটস বা পড়ালেখার আপডেট আদান-প্রদান করা।',
      howToUseStepsBn: [
        '"Friends" পেজে গিয়ে অন্য শিক্ষার্থীদের প্রোফাইল দেখে "Add Friend" রিকোয়েস্ট পাঠান।',
        'রিকোয়েস্ট অ্যাকसेप्ट হলে "Messages" বা প্রোফাইলের "Send Message" বাটনে চাপুন।',
        'রিয়েলটাইম চ্যাটে সরাসরি কথা বলুন এবং একে অপরের পড়ালেখার খোঁজ খবর নিন।'
      ],
      rulesBn: [
        'ব্যক্তিগত তথ্যের নিরাপত্তা রক্ষা করতে অপরিচিত কাউকে সংবেদনশীল তথ্য দেবেন না।'
      ],
      benefitsBn: [
        'নির্দিষ্ট স্টাডি পার্টনার তৈরি করে প্রতিদিনের টার্গেট পূরণ করার মিউচুয়াল পার্টনারশিপ গড়া যায়।'
      ],
      proTipBn: 'একজন সিরিয়াস স্টাডি পার্টনার বানিয়ে প্রতিদিন রাতে একে অপরকে আজকের পড়ার রিপোর্ট শেয়ার করুন।'
    },

    // 6. NATIONAL LEADERBOARD
    {
      id: 'leaderboard',
      category: 'gamification',
      titleBn: 'ন্যাশনাল লিডারবোর্ড ও স্টুডেন্ট র‍্যাঙ্কিং',
      titleEn: 'National Student Leaderboard & Star Points',
      icon: Trophy,
      route: '/leaderboard',
      location: 'সাইডবার অপশন #৩ (Leaderboard)',
      purposeBn: 'সারা বাংলাদেশের সকল শিক্ষার্থীর মধ্যে নিজের রিয়েলটাইম পজিশন ও স্টার পয়েন্ট জানা।',
      howToUseStepsBn: [
        'সাইডবার থেকে "Leaderboard" এ যান।',
        'টপ ১-৩ পজিশনে থাকা শিক্ষার্থীদের দেখা যাবে এবং তাদের গোল্ড/সিলভার/ব্রোঞ্জ ব্যাজ প্রদান করা হবে।',
        'পড়ার সময় (Study Hours), পরীক্ষার স্কোর এবং টানা স্টাডি স্ট্রাইকের মাধ্যমে লিডারবোর্ডের পয়েন্ট বাড়ে।'
      ],
      rulesBn: [
        'প্রতিদিন পড়ার টাইমার অন রেখে সততার সাথে পয়েন্ট অর্জন করতে হবে।',
        'অসাধু উপায়ে পয়েন্ট বানানোর চেষ্টা করলে লিডারবোর্ড অ্যাকাউন্ট রিভিউতে চলে যেতে পারে।'
      ],
      benefitsBn: [
        'জাতীয় পর্যায়ে নিজের অবস্থান দেখে পড়ালেখার অনুপ্রেরণা বহুগুণ বেড়ে যায়।'
      ],
      proTipBn: 'টপ ১০ র‍্যাঙ্কে উঠলে প্রোফাইলে বিশেষ "National Scholar" স্টার ট্যাগ যুক্ত হবে!'
    },

    // 7. 7-DAY SPRINT CHALLENGES
    {
      id: 'challenges',
      category: 'gamification',
      titleBn: '৭ দিনের বিষয়ভিত্তিক স্প্রিন্ট চ্যালেঞ্জ',
      titleEn: '7-Day Subject Sprint Challenges',
      icon: Target,
      route: '/challenges',
      location: 'সাইডবার অপশন #৯ (Challenges)',
      purposeBn: 'নির্দিষ্ট বিষয়ে স্বল্প সময়ে বেশি পড়ার টার্গেট (যেমন: ৭ দিনে অর্গানিক কেমিস্ট্রি ১০ ঘণ্টা) পূরণ করে অতিরিক্ত রিওয়ার্ড পয়েন্ট পাওয়া।',
      howToUseStepsBn: [
        '"Challenges" পেজে গিয়ে একটি অ্যাক্টিভ চ্যালেঞ্জ বাছাই করে "Join Challenge" এ ক্লিক করুন।',
        'টাইমার চালু রেখে বা নির্দিষ্ট বিষয় পড়ে আপনার প্রোগ্রেস বার (Progress Bar) পূরণ করুন।',
        '১০০% গোল পূরণ হলে রিওয়ার্ড বোনাস হিসেবে +২০০ স্টার পয়েন্ট ও স্পেশাল ব্যাজ অটোমেটিক অ্যাকাউন্টে যোগ হবে।'
      ],
      rulesBn: [
        'চ্যালেঞ্জের নির্ধারিত সময়সীমা (যেমন: ৭ দিন) পার হওয়ার আগেই গোল পূরণ করতে হবে।'
      ],
      benefitsBn: [
        'জমে থাকা কঠিন ও বড় চ্যাপ্টারগুলো অল্প সময়ে শেষ করা সম্ভব হয়।'
      ],
      proTipBn: 'এইচএসসি বা এডমিশন পরীক্ষার আগের মাসে রিভিশন চ্যালেঞ্জগুলো জয়েন করুন।'
    },

    // 8. TASK & SYLLABUS TODO PLANNER
    {
      id: 'tasks',
      category: 'utility',
      titleBn: 'টাস্ক প্ল্যানার ও সিলেবাস চেকলিস্ট',
      titleEn: 'Task Planner & Chapter Checklist',
      icon: CheckCircle,
      route: '/tasks',
      location: 'সাইডবার অপশন #১০ (Tasks)',
      purposeBn: 'প্রতিদিনের পড়ার তালিকা (To-Do List) তৈরি করা এবং চ্যাপ্টার পড়া শেষ হলে টিকচিহ্ন দেওয়া।',
      howToUseStepsBn: [
        '"Tasks" পেজে যান এবং "Add New Task" এ ক্লিক করুন।',
        'কাজের শিরোনাম (যেমন: Vector Math Solve) ও প্রায়োরিটি (High / Medium / Low) সেট করে সেভ করুন।',
        'পড়া শেষ হলে ঘরটিতে টিক দিলে টাস্কটি কমপ্লিট হিসেবে মার্ক হবে।'
      ],
      rulesBn: [
        'প্রতিদিন সর্বোচ্চ ৫-৭টি বাস্তবায়নযোগ্য ছোট টাস্ক তৈরি করুন যেন অলসতার কারণে ব্যাকলগ জমা না হয়।'
      ],
      benefitsBn: [
        'সারাদিনে কী কী পড়তে হবে তার একটা সুনির্দিষ্ট পথনকশা (Roadmap) তৈরি হয়।'
      ],
      proTipBn: 'প্রতিদিন সকালে পড়া শুরু করার আগেই আজকের টাস্ক তালিকা তৈরি করে ফেলুন।'
    },

    // 9. REVISION NOTES MANAGER
    {
      id: 'notes',
      category: 'utility',
      titleBn: 'ডিজিটাল স্টাডি নোটস ও রিভিশন প্যাড',
      titleEn: 'Digital Study Notes Manager',
      icon: StickyNote,
      route: '/notes',
      location: 'সাইডবার অপশন #১১ (Study Notes)',
      purposeBn: 'কঠিন সূত্র, গুরুত্বপূর্ণ অনুধাবনমূলক প্রশ্ন ও শটকাট টেকনিক নোট করে রাখা।',
      howToUseStepsBn: [
        '"Study Notes" পেজে গিয়ে "Create Note" এ চাপুন।',
        'বিষয় সিলেক্ট করুন (যেমন: Physics 1st Paper), শিরোনাম ও বিস্তারিত পয়েন্ট লিখুন।',
        'পরে যেকোনো সময় সার্চ বার দিয়ে বিষয় বা কী-ওয়ার্ড লিখে সাথে সাথে আপনার নোটটি বের করে পড়ুন।'
      ],
      rulesBn: [
        'অন্যের নকল না করে নিজের ভাষায় সহজভাবে নোট বানিয়ে রাখুন।'
      ],
      benefitsBn: [
        'পরীক্ষার আগের রাতে পুরো বই না ঘেঁটে কেবল নিজের ডিজিটাল শর্ট নোটস পড়ে দ্রুত রিভিশন শেষ করা যায়।'
      ],
      proTipBn: 'ভুল হওয়া এমসিকিউগুলোর সঠিক ব্যাখ্যা নোটস সেকশনে সেভ করে রাখুন।'
    },

    // 10. SCIENTIFIC CALCULATOR & FORMULA SHEETS
    {
      id: 'calculator',
      category: 'utility',
      titleBn: 'সায়েন্টিফিক ক্যালকুলেটর ও বিষয়ভিত্তিক ফর্মুলা কার্ড',
      titleEn: 'Scientific Calculator & Formula Sheet',
      icon: Calculator,
      route: '/calculator',
      location: 'সাইডবার অপশন #১২ (Calculator & Formulas)',
      purposeBn: 'পড়ার সময় গাণিতিক হিসাব করা এবং পদার্থবিজ্ঞান, উচ্চতর গণিত ও রসায়নের গুরুত্বপূর্ণ সূত্রের তালিকা দেখা।',
      howToUseStepsBn: [
        '"Calculator & Formulas" পেজে যান।',
        'অন-স্ক্রিন সায়েন্টিফিক ক্যালকুলেটর বোতাম চেপে sin, cos, log, ln সহ গাণিতিক সমীকরণ সমাধান করুন।',
        'ডানপাশের "Formula Reference" থেকে অধ্যায়ভিত্তিক প্রয়োজনীয় সূত্র এক নজরে দেখে নিন।'
      ],
      rulesBn: [
        'BUET বা ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার জন্য কোন কোন ক্যালকুলেটর এলাউড তা খেয়াল রাখুন।'
      ],
      benefitsBn: [
        'পড়ার টেবিলে আলাদা করে সূত্র খোঁজার ঝামেলা দূর হয় এবং হিসাব করার গতি বাড়ে।'
      ],
      proTipBn: 'ফিজিক্সের বিভিন্ন ধ্রুবক (যেমন: g = 9.8 m/s², c = 3x10^8 m/s) ক্যালকুলেটর পেজেই দেওয়া আছে।'
    },

    // 11. SUBJECT PERFORMANCE ANALYTICS
    {
      id: 'analytics',
      category: 'tracking',
      titleBn: 'সাবজেক্ট পারফরম্যান্স এনালিটিক্স ও রিপোর্ট',
      titleEn: 'Subject Performance Analytics & Weekly Reports',
      icon: BarChart3,
      route: '/analytics',
      location: 'সাইডবার অপশন #১৩ (Analytics)',
      purposeBn: 'কোন কোন বিষয়ে কত সময় পড়া হয়েছে তার সাপ্তাহিক ও মাসিক ভিজ্যুয়াল বার-চার্ট এবং দুর্বল বিষয়ের হিসাব বের করা।',
      howToUseStepsBn: [
        '"Analytics" পেজে যান।',
        'আপনার এই সপ্তাহের সাবজেক্ট অনুযায়ী সময়ের শতকরা অনুপাত (Subject Time Ratio) দেখুন।',
        'যদি দেখেন বায়োলজিতে কম সময় দেওয়া হচ্ছে, তবে আগামী সপ্তাহের রুটিন সেভাবে রি-ব্যালেন্স করুন।'
      ],
      rulesBn: [
        'নিয়মিত টাইমার ব্যবহার করলে এনালিটিক্সের ডাটা সঠিক ও নির্ভুল দেখাবে।'
      ],
      benefitsBn: [
        'সব বিষয়ে সমান প্রস্তুতি নিশ্চিত করা যায়, ফলে কোনো নির্দিষ্ট বিষয়ের কারণে রেজাল্ট খারাপ হওয়ার ঝুঁকি থাকে না।'
      ],
      proTipBn: 'প্রতি রবিবার এনালিটিক্স দেখে আগামী সপ্তাহের সাবজেক্ট টার্গেট ঠিক করুন।'
    },

    // 12. AI FORMULA & NOTES EXTRACTOR
    {
      id: 'ai_formula_notes',
      category: 'utility',
      titleBn: 'AI নোটস ও ফর্মুলা এক্সট্র্যাক্টর (PDF & Text)',
      titleEn: 'AI PDF Formula Extractor & Short Notes Generator',
      icon: Sparkles,
      route: '/ai-formula-notes',
      location: 'সাইডবার অপশন (AI Formula & Notes Extractor)',
      purposeBn: 'PDF ফাইল, বইয়ের ছবি বা পাঠ্য নোটস দিলে AI সাথে সাথে সকল ম্যাথমেটিক্যাল/সায়েন্টিফিক সূত্রাবলী আলাদা করবে, শর্ট রিভিশন নোটস বানাবে এবং সুন্দর PDF রিপোর্ট ডাউনলোডের সুযোগ দেবে।',
      howToUseStepsBn: [
        'সাইডবার থেকে "AI Formula & Notes Extractor" এ প্রবেশ করুন।',
        'আপনার PDF বই, হ্যান্ডনোট বা ছবি আপলোড করুন অথবা বক্সে সরাসরি পড়া বা চ্যাপ্টারের টেক্সট পেস্ট করুন।',
        '"Generate AI" বাটনে চাপ দিলে কিছুক্ষণের মধ্যে সকল ফর্মুলা, প্রতীকের ব্যাখ্যা, শর্ট নোটস এবং ১০-সেকেন্ডের MCQ ট্রিকস চলে আসবে।',
        'উপরে থাকা "ডাউনলোড PDF রিপোর্ট" বাটনে ক্লিক করে পুরো সামারি ও ফর্মুলা শিট PDF ফাইল হিসেবে আপনার ডিভাইসে ডাউনলোড করে নিন।'
      ],
      rulesBn: [
        'সর্বোচ্চ ২০ মেগাবাইটের পরিষ্কার PDF বা ছবি ফাইল ব্যবহার করার চেষ্টা করুন।',
        'বিষয় সিলেক্ট করে দিলে (যেমন: পদার্থবিজ্ঞান বা উচ্চতর গণিত) AI আরও নির্ভুলভাবে সূত্র চিহ্নিত করতে পারে।'
      ],
      benefitsBn: [
        'বিশাল চ্যাপ্টারের ৫০+ পৃষ্ঠা না পড়ে মাত্র ১ মিনিটেই সকল সূত্র ও শর্ট নোটস আলাদা করে রিভিশন দেওয়া যায়।'
      ],
      proTipBn: 'বইয়ের যেকোনো অধ্যায়ের ছবি তুলে আপলোড করুন এবং এক ক্লিকে সেই চ্যাপ্টারের সকল সূত্রের PDF বানিয়ে নিন!'
    }
  ];

  const filteredItems = manualItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purposeBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Banner / Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-emerald-950/80 border border-indigo-500/30 shadow-2xl text-white space-y-4">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Official User Guide & Feature Manual • সম্পূর্ণ ব্যবহার নির্দেশিকা</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              StudyPartner BD <span className="text-indigo-400">ম্যানুয়াল ও গাইডলাইন</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              অ্যাপের প্রতিটি ফিচার কীভাবে ব্যবহার করবেন, কোন অপশন কী কাজে আসবে এবং সর্বোচ্চ আউটপুট পেতে কী কী নিয়মকানুন মেনে চলতে হবে তা নিচে বিস্তারিত দেওয়া হলো।
            </p>
          </div>

          <button
            onClick={() => navigate('/presentation')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Compass className="w-4 h-4" />
            <span>প্রেজেন্টেশন স্লাইড দেখুন</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative pt-2">
          <Search className="w-5 h-5 absolute left-3.5 top-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ফিচারের নাম বা বিষয় লিখে সার্চ করুন (যেমন: টাইমার, মডেল টেস্ট, হিটম্যাপ, চ্যাট)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'সব ফিচার (All)', icon: Compass },
          { id: 'tracking', label: 'ট্র্যাকিং ও টাইমার', icon: Timer },
          { id: 'exams', label: 'মডেল টেস্ট ও এক্সাম', icon: FileText },
          { id: 'social', label: 'সোশ্যাল ও চ্যাট', icon: Users },
          { id: 'gamification', label: 'র‍্যাঙ্কিং ও স্প্রিন্ট', icon: Trophy },
          { id: 'utility', label: 'টুলস, নোটস ও ক্যালকুলেটর', icon: Calculator }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Manual Cards Grid / List */}
      <div className="space-y-5">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <Search className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">কোনো ফলাফল পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400">অন্য কোনো কী-ওয়ার্ড বা ফিল্টার ট্রাই করে দেখুন।</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const ItemIcon = item.icon;
            const isExpanded = expandedId === item.id || searchQuery.length > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="rounded-3xl bg-slate-900 border border-slate-800/90 shadow-lg hover:border-slate-700/80 transition-all overflow-hidden"
              >
                {/* Header Strip */}
                <div 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-slate-900 hover:bg-slate-800/50 transition-all border-b border-slate-800/60"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <ItemIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/20">
                          {item.location}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.titleEn}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">{item.titleBn}</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.route);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>টেস্ট করে দেখুন (Try Feature)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                      {isExpanded ? 'গোপন করুন ▲' : 'বিস্তারিত দেখুন ▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-slate-950/60 space-y-6">
                    
                    {/* 1. Purpose / কী কাজে আসবে */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                      <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-indigo-400" />
                        কী কাজে আসবে (Purpose & Benefit)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {item.purposeBn}
                      </p>
                    </div>

                    {/* 2. Step-by-Step How to Use & Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* How to use */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-amber-400" />
                          কীভাবে ব্যবহার করবেন (ধাপে ধাপে)
                        </h3>
                        <ol className="space-y-2 text-xs text-slate-300">
                          {item.howToUseStepsBn.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Rules & Guidelines */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                          নিয়মকানুন ও গাইডলাইন (Rules)
                        </h3>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {item.rulesBn.map((rule, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* 3. Pro-Tip */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <div>
                        <strong>স্পেশাল টিপস (Pro-Tip):</strong> {item.proTipBn}
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom Help Note */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
        <div className="inline-flex p-2 rounded-full bg-indigo-500/20 text-indigo-400">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white">কোনো সমস্যা বা নতুন ফিচারের আবদার আছে?</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          যদি কোনো ফিচার ব্যবহার করতে সমস্যা হয় বা নতুন কোনো অপশন যোগ করতে চান, তবে সরাসরি আমাদের ফিডব্যাক পেজে মেসেজ পাঠাতে পারেন।
        </p>
        <button
          onClick={() => navigate('/feedback')}
          className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
        >
          ফিডব্যাক ও ফিচার রিকোয়েস্ট পেজে যান
        </button>
      </div>

    </div>
  );
}
