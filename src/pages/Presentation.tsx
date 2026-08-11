import React, { useState, useEffect } from 'react';
import { 
  Download, ChevronLeft, ChevronRight, Presentation as PresIcon, Sparkles, 
  CheckCircle2, MonitorPlay, Maximize2, Minimize2, Play, Grid, 
  Flame, Award, BarChart3, Clock, MessageSquare, BookOpen, Layers, Target, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Auto Play timer
  useEffect(() => {
    let interval: any = null;
    if (autoPlay) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoPlay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
      toast.info('Entered Fullscreen Presentation Mode (Press ESC or F to exit)');
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  const handleDownloadPPTX = () => {
    const a = document.createElement('a');
    a.href = '/StudyPartner_BD_Presentation.pptx';
    a.download = 'StudyPartner_BD_Presentation.pptx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloading StudyPartner_BD_Presentation.pptx!');
  };

  const slides = [
    // ------------------------------------------------------------------
    // SLIDE 1: COVER
    // ------------------------------------------------------------------
    {
      id: 1,
      tag: '01 • OVERVIEW',
      title: 'StudyPartner BD',
      subtitle: 'Next-Gen Social Learning & Study Tracking Platform for HSC & Admission Candidates',
      speakingPoints: 'বলবেন: আসসালামু আলাইকুম। আমাদের প্রজেক্টের নাম StudyPartner BD — এটি দেশের প্রথম স্টাডি ট্র্যাকিং, অনলাইন মডেল টেস্ট এবং সোশ্যাল লার্নিং প্ল্যাটফর্ম।',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> HSC 2025/2026 & University Admission Special
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Transforming <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">Procrastination</span> into 100% Academic Consistency
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Empowering students across Bangladesh with 30-day consistency heatmaps, live subject timers, automated MCQ model tests, and collaborative peer groups.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <div className="text-xl font-bold text-amber-400">30-Day</div>
                <div className="text-[11px] text-slate-400">Activity Heatmap</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <div className="text-xl font-bold text-emerald-400">100+</div>
                <div className="text-[11px] text-slate-400">Online MCQ Exams</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <div className="text-xl font-bold text-indigo-400">Realtime</div>
                <div className="text-[11px] text-slate-400">Peer Study Groups</div>
              </div>
            </div>
          </div>

          {/* Visual UI Preview Mockup with Callouts */}
          <div className="lg:col-span-6 relative">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-slate-500 ml-2">app.studypartner.bd/dashboard</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">LIVE APP</span>
              </div>

              {/* Mock Dashboard Wireframe */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 relative">
                  <div className="text-xs font-semibold text-white mb-1 flex items-center justify-between">
                    <span>30-Day Activity Heatmap</span>
                    <span className="text-[10px] text-emerald-400 font-bold">14 Day Streak 🔥</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 my-2">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className={`h-3 rounded-sm ${i % 3 === 0 ? 'bg-emerald-500' : i % 2 === 0 ? 'bg-emerald-700/80' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  {/* Visual Pointer Callout */}
                  <div className="absolute -bottom-3 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                    📍 1. Daily Study Streak Engine
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 relative">
                  <div className="text-xs font-semibold text-amber-400 mb-1">Live Timer</div>
                  <div className="text-lg font-mono font-bold text-white">02:45:12</div>
                  <div className="text-[10px] text-slate-400">Physics Mechanics</div>
                  <div className="absolute -bottom-3 left-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    📍 2. Subject Timer
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between relative mt-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">National Rank #3 (1,450 Stars)</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Science Squad</span>
                <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  📍 3. Gamified Leaderboard
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 2: PAIN POINTS VS SOLUTION
    // ------------------------------------------------------------------
    {
      id: 2,
      tag: '02 • PROBLEM & SOLUTION',
      title: 'Bridging the Gap in HSC & Admission Preparation',
      subtitle: 'How Traditional Self-Study Fails vs How StudyPartner BD Solves It',
      speakingPoints: 'বলবেন: শিক্ষার্থীরা সাধারণত একা একা পড়ার কারণে ট্র্যাক হারিয়ে ফেলে। আমরা বিষয়ভিত্তিক ট্র্যাকার ও পিয়ার সোশ্যাল লার্নিং দিয়ে এই সমস্যার সমাধান করেছি।',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pain Points */}
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              ⚠️ Common Student Challenges
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="text-red-400 font-bold">1.</span>
                <span><strong>Procrastination & Burnout:</strong> Lack of daily motivation or structural goals when studying in isolation.</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="text-red-400 font-bold">2.</span>
                <span><strong>No Analytics:</strong> Students don't know which subject they are neglecting until exam day.</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <span className="text-red-400 font-bold">3.</span>
                <span><strong>Untimed Model Tests:</strong> Offline guidebooks don't simulate real exam pressure or negative marking.</span>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              ✨ The StudyPartner BD Solution
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>30-Day Activity Heatmaps:</strong> Visual feedback loop that gamifies study consistency and rewards daily effort.</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Realtime Exam Engine:</strong> Automated timer, negative marking (-0.25), and instant performance analysis.</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Peer Collaboration:</strong> Subject channels (BUET, Medical, Dhaka Univ) for group discussion & doubt clearing.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 3: APP NAVIGATION MAP & WHERE FEATURES ARE
    // ------------------------------------------------------------------
    {
      id: 3,
      tag: '03 • UI MAP & MOCKUP',
      title: 'Platform Visual Navigation Map',
      subtitle: 'Where Every Feature is Located in the Application Interface',
      speakingPoints: 'বলবেন: চিত্রটিতে দেখুন, বাম পাশের সাইডবারে ড্যাশবোর্ড, টাইমার, মডেল টেস্ট, স্টাডি গ্রুপ এবং লিডারবোর্ডের সরাসরি নেভিগেশন দেওয়া আছে।',
      content: (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            {/* Sidebar Visual Mock */}
            <div className="md:col-span-3 p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2 relative">
              <div className="font-bold text-indigo-400 pb-1 border-b border-slate-800">📌 LEFT SIDEBAR NAVIGATION</div>
              <div className="space-y-1 text-slate-300">
                <div className="p-1.5 rounded bg-indigo-500/20 text-white font-semibold flex items-center justify-between">
                  <span>📊 Dashboard</span>
                  <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded">Main</span>
                </div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">⏱️ Live Timer</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">📝 Model Tests</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">💬 Study Groups</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">🏆 Leaderboard</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">🎯 Challenges</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-slate-400">🧮 Calculator</div>
              </div>
              <div className="absolute -right-3 top-10 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg">
                👈 Side Bar Menu
              </div>
            </div>

            {/* Main Stage Mock */}
            <div className="md:col-span-9 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white">STUDYPARTNER MAIN STAGE</span>
                <span className="text-[10px] text-slate-400">User: Tanvir Hossain (HSC 2025)</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Today's Hours</div>
                  <div className="text-base font-bold text-emerald-400">4.2 Hours</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Active Streak</div>
                  <div className="text-base font-bold text-amber-400">14 Days 🔥</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Rank</div>
                  <div className="text-base font-bold text-indigo-400">#3 National</div>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 relative">
                <div className="text-xs font-semibold text-slate-300 mb-1">Subject Time Distribution (This Week)</div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 w-[40%]" title="Physics" />
                  <div className="bg-emerald-500 w-[30%]" title="Chemistry" />
                  <div className="bg-amber-500 w-[20%]" title="Higher Math" />
                  <div className="bg-purple-500 w-[10%]" title="Biology" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Physics (40%)</span>
                  <span>Chemistry (30%)</span>
                  <span>Higher Math (20%)</span>
                  <span>Biology (10%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 4: FEATURE 1 - ONLINE EXAM ENGINE
    // ------------------------------------------------------------------
    {
      id: 4,
      tag: '04 • EXAM ENGINE',
      title: 'Automated MCQ Model Test & Result Analytics',
      subtitle: 'Simulating Real Admissions Pressure with Instant Negative Marking Analysis',
      speakingPoints: 'বলবেন: আমাদের এক্সাম ইঞ্জিনে পরীক্ষার্থীরা সময়সীমার ভেতরে এমসিকিউ উত্তর দেয় এবং পরীক্ষা শেষ হওয়ামাত্রই সঠিক উত্তর ও এক্সপ্লেনেশন দেখতে পায়।',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Key Exam Capabilities
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Configurable Duration & Question Bank</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Standard Admission Negative Marking (-0.25)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant Percentile & Explanations Card</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
              <strong>📍 How to access:</strong> Go to <code>Exams</code> page in the sidebar → Select any Subject Test → Click <code>Start Exam</code>.
            </div>
          </div>

          {/* Exam Mockup Card */}
          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">HSC Physics Mechanics Chapter 3 Model Test</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                ⏱️ Time Remaining: 14:32
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                Q1. ভেক্টরের সামান্তরিক সূত্রের ক্ষেত্রে লব্ধির মান সর্বোচ্চ কখন হয়?
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-indigo-600/30 border border-indigo-500 text-white font-medium flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">A</span>
                  <span>যখন কোণ α = 0° (Correct)</span>
                </div>
                <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[10px] flex items-center justify-center font-bold">B</span>
                  <span>যখন কোণ α = 90°</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">Instant Score Evaluation</div>
                <div className="text-sm font-bold text-emerald-400">Score: 18.75 / 20.00 (93.75%)</div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-1 rounded">Passed</span>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 5: FEATURE 2 - GROUPS & DIRECT MESSAGING
    // ------------------------------------------------------------------
    {
      id: 5,
      tag: '05 • PEER GROUPS & CHAT',
      title: 'Social Study Groups & Peer Collaboration',
      subtitle: 'Realtime Group Chat & Study Partner Direct Messaging via Supabase WebSockets',
      speakingPoints: 'বলবেন: অ্যাপে বিভিন্ন সাবজেক্টের চ্যাট গ্রুপ ও বন্ধুদের সরাসরি ডিরেক্ট মেসেজ পাঠাবার সুবিধা রয়েছে, যা গ্রুপ স্টাডিতে অত্যন্ত কার্যকর।',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-xs">HSC 2025 Science Squad (Group Chat)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">● 14 Online</span>
            </div>

            {/* Chat Bubble Simulation */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 max-w-[80%]">
                <div className="font-bold text-indigo-400 text-[10px] mb-0.5">Tanvir Hossain</div>
                <span>Physics Chapter 3 er Vector math sheet er solve kaku ase group e?</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-white max-w-[80%] ml-auto">
                <div className="font-bold text-amber-300 text-[10px] mb-0.5">You</div>
                <span>Haan Tanvir! Integration and Vector sheet practice complete. Direct message e pathay dicchi! 📖</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Write a message...</span>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold">Send</span>
            </div>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-amber-400 text-sm">📍 Where to find Chat:</h4>
              <p className="text-slate-300">
                Click on <strong>Study Groups</strong> or <strong>Messages</strong> in the sidebar. You can also visit any friend's profile and click <strong>Message</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
              <div className="font-bold text-white">⚡ Realtime WebSockets:</div>
              <p>Powered by Supabase Realtime Channels for zero-latency message sync across devices.</p>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 6: TECHNICAL STACK
    // ------------------------------------------------------------------
    {
      id: 6,
      tag: '06 • TECH ARCHITECTURE',
      title: 'Technical Stack & High-Performance Engineering',
      subtitle: 'Full-Stack Architecture Built with Modern Web Standards',
      speakingPoints: 'বলবেন: টেকনিক্যাল আর্কিটেকচারে রিঅ্যাক্ট ১৮, টাইপস্ক্রিপ্ট, ক্লাউড সুপাবেস এবং লোকালস্টোরেজ রেজিলিয়েন্স ব্যবহার করা হয়েছে।',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-400 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Frontend Tier
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• React 18 with Vite Bundler</li>
              <li>• TypeScript Type-Safety</li>
              <li>• Tailwind CSS Design System</li>
              <li>• Motion React Page Animations</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Compass className="w-4 h-4" /> Backend & Database
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• Supabase PostgreSQL Database</li>
              <li>• Realtime WebSockets Sync</li>
              <li>• LocalStorage Fallback Layer</li>
              <li>• Row Level Security (RLS)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Target className="w-4 h-4" /> Quality & Performance
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• Clean Slate & Emerald Palette</li>
              <li>• Sub-second Cold Boot Load</li>
              <li>• 100% Mobile & Desktop Responsive</li>
              <li>• Zero Broken State Handlers</li>
            </ul>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 7: PRESENTATION LIVE DEMO LAUNCH
    // ------------------------------------------------------------------
    {
      id: 7,
      tag: '07 • LIVE DEMO LAUNCH',
      title: 'Ready for Live Presentation & Demonstration',
      subtitle: 'Experience StudyPartner BD First-Hand',
      speakingPoints: 'বলবেন: ধন্যবাদ সবাইকে! আপনারা এখন যেকোনো মেনুতে গিয়ে অ্যাপটির লাইভ ডেটা এক্সপ্লোর করতে পারেন।',
      content: (
        <div className="text-center py-6 space-y-6">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <MonitorPlay className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white">Start Exploring the Live Application</h3>
            <p className="text-slate-400 text-sm max-w-lg mx-auto mt-1">
              Use the sidebar to test Dashboard Heatmaps, Live Exam Engine, Group Chat & Leaderboards!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownloadPPTX}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PowerPoint File (.pptx)
            </button>
          </div>
        </div>
      )
    }
  ];

  const slide = slides[currentSlide];

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between overflow-hidden' : 'max-w-6xl mx-auto p-4 md:p-6 space-y-6'}`}>
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PresIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Project Presentation Deck
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Interactive Deck
              </span>
            </h1>
            <p className="text-xs text-slate-400">StudyPartner BD Pitch Presentation • Slide {currentSlide + 1} of {slides.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoPlay ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> {autoPlay ? 'Pause Auto-Play' : 'Auto-Play'}
          </button>

          <button
            onClick={() => setShowGridModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Overview Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen Mode'}</span>
          </button>

          <button
            onClick={handleDownloadPPTX}
            className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
            title="Download PPTX File"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card Container */}
      <div className={`relative p-6 md:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden ${isFullscreen ? 'flex-1' : 'min-h-[500px]'}`}>
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Slide Content Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {slide.tag}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Slide {currentSlide + 1} / {slides.length}
              </span>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{slide.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
            </div>

            <div className="pt-2">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Bottom Action Bar */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">F</kbd> for Fullscreen • <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Arrow Keys</kbd> to Navigate
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs font-mono text-slate-400 px-3 font-semibold">
              {currentSlide + 1} of {slides.length}
            </span>
            <button
              onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlide === slides.length - 1}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Grid Modal */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center">
          <div className="max-w-4xl w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-400" /> Jump to Slide
              </h3>
              <button
                onClick={() => setShowGridModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close (ESC)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setShowGridModal(false);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    currentSlide === idx
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold text-indigo-400 mb-1">SLIDE 0{s.id}</div>
                  <div className="text-xs font-semibold line-clamp-1">{s.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
