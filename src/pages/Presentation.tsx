import React, { useState, useEffect } from 'react';
import { 
  Download, ChevronLeft, ChevronRight, Presentation as PresIcon, Sparkles, 
  CheckCircle2, MonitorPlay, Maximize2, Minimize2, Play, Grid, 
  Flame, Award, BarChart3, Clock, MessageSquare, BookOpen, Layers, Target, Compass,
  Calculator, CheckSquare, Zap, Trophy, Users, FileText, Activity, Brain
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
      }, 6000);
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
      toast.info('Entered Fullscreen Mode (Press ESC or F to exit)');
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
    // SLIDE 01: COVER
    // ------------------------------------------------------------------
    {
      id: 1,
      tag: 'SLIDE 01 • PLATFORM OVERVIEW',
      title: 'StudyPartner BD',
      subtitle: 'Next-Gen Social Learning & Study Tracking Platform for HSC & Admission Candidates',
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

          <div className="lg:col-span-6 relative">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-slate-500 ml-2">app.studypartner.bd</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">LIVE PLATFORM</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 relative">
                  <div className="text-xs font-semibold text-white mb-1 flex items-center justify-between">
                    <span>30-Day Consistency Heatmap</span>
                    <span className="text-[10px] text-emerald-400 font-bold">14 Day Streak 🔥</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 my-2">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className={`h-3 rounded-sm ${i % 3 === 0 ? 'bg-emerald-500' : i % 2 === 0 ? 'bg-emerald-700/80' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-semibold text-amber-400 mb-1">Live Timer</div>
                  <div className="text-lg font-mono font-bold text-white">02:45:12</div>
                  <div className="text-[10px] text-slate-400">Physics Mechanics</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">National Rank #3 (1,450 Stars)</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">HSC Science Squad</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 02: PROBLEM STATEMENT
    // ------------------------------------------------------------------
    {
      id: 2,
      tag: 'SLIDE 02 • THE CHALLENGE',
      title: 'Core Struggles of HSC & Admission Candidates',
      subtitle: 'Why Traditional Self-Study Fails to Produce Consistent Top Rankers',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              ⚠️ 1. Procrastination & Study Isolation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Studying alone in a room without peer competition causes students to lose daily study momentum and burn out before board exams.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              📊 2. Unmeasured Time & Neglected Subjects
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Without digital subject breakdown logs, students spend 80% of time on comfortable subjects while completely neglecting weaker topics.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              📝 3. Untimed Tests Without Negative Marking
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Guidebooks don't enforce strict countdown timers or simulate university negative marking (-0.25), creating false exam confidence.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              💬 4. Fragmented Doubt Solving
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When stuck on difficult physics or math problems, students lack a dedicated, distraction-free study group to ask questions.
            </p>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 03: SOLUTION OVERVIEW
    // ------------------------------------------------------------------
    {
      id: 3,
      tag: 'SLIDE 03 • THE SOLUTION',
      title: 'The StudyPartner BD Ecosystem',
      subtitle: '4 Integrated Pillars Transforming How Students Prepare for High-Stakes Exams',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-2">
            <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 w-12 h-12 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">1. Smart Tracker</h4>
            <p className="text-slate-300 text-xs">Live stopwatch, 30-day activity heatmaps, & subject breakdowns.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 w-12 h-12 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">2. Online Exams</h4>
            <p className="text-slate-300 text-xs">Timed MCQ model tests, negative marking & instant score cards.</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
            <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 w-12 h-12 mx-auto flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">3. Gamification</h4>
            <p className="text-slate-300 text-xs">7-day subject sprint challenges, star rewards, & national rankings.</p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-2">
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 w-12 h-12 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">4. Peer Community</h4>
            <p className="text-slate-300 text-xs">Dedicated HSC Science squads, BUET aspirants & direct chat.</p>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 04: SECTION 01 - DASHBOARD & 30-DAY HEATMAP
    // ------------------------------------------------------------------
    {
      id: 4,
      tag: 'SLIDE 04 • SECTION 01',
      title: 'Dashboard & 30-Day Activity Heatmap',
      subtitle: '📍 Location: Dashboard Page (Sidebar Menu #1)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>30-Day Github-style Activity Heatmap</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Daily Study Streak Counter (Active 🔥)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Today's Total Study Hours & Star Rewards</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Dashboard</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">DASHBOARD • 30-DAY CONSISTENCY HEATMAP</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">14 DAY STREAK 🔥</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-200">Study Intensity (Last 30 Days)</div>
              <div className="grid grid-cols-10 gap-1.5 my-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`h-4 rounded-sm flex items-center justify-center text-[8px] font-bold text-white ${
                    i % 3 === 0 ? 'bg-emerald-500' : i % 2 === 0 ? 'bg-emerald-700/80' : 'bg-slate-800'
                  }`}>
                    {i % 3 === 0 ? '4h' : i % 2 === 0 ? '2h' : '0'}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Less Active</span>
                <span className="text-emerald-400 font-semibold">● Most Active (4+ Hours)</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 05: SECTION 02 - LIVE STUDY TIMER
    // ------------------------------------------------------------------
    {
      id: 5,
      tag: 'SLIDE 05 • SECTION 02',
      title: 'Live Study Timer & Focus Soundscapes',
      subtitle: '📍 Location: Live Timer Page (Sidebar Menu #2)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Subject Tagging (Physics, Math, Chemistry)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ambient Audio (Lo-Fi Beats, Rain, Forest)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Auto Syncs Study Hours to Profile DB</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Live Timer</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-center">
            <div className="text-xs font-semibold text-slate-400">ACTIVE STUDY SESSION</div>
            <div className="text-4xl font-mono font-extrabold text-white tracking-widest my-2">02:45:12</div>
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              Subject: Higher Math • Integration
            </div>

            <div className="flex justify-center gap-2 mt-3">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold">Start / Resume</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold">Pause</span>
              <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">End Session</span>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 06: SECTION 03 - ONLINE MCQ EXAM ENGINE
    // ------------------------------------------------------------------
    {
      id: 6,
      tag: 'SLIDE 06 • SECTION 03',
      title: 'Automated MCQ Model Test & Instant Evaluation',
      subtitle: '📍 Location: Exams Page (Sidebar Menu #3)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Admission Standard Negative Marking (-0.25)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live Countdown Timer & Auto-Submit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant Scorecard & Detailed Solution Key</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Model Tests</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">HSC Physics Chapter 3 Test</span>
              <span className="text-xs font-mono font-bold text-amber-400">⏱️ 14:32</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-200">
                Q1. ভেক্টরের সামান্তরিক সূত্রের লব্ধির মান সর্বোচ্চ কখন হয়?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-indigo-600/30 border border-indigo-500 text-white font-medium">A. α = 0° (Selected)</div>
                <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">B. α = 90°</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-400">Result Evaluation</div>
                <div className="font-bold text-emerald-400">Score: 18.75 / 20.00 (93.75%)</div>
              </div>
              <span className="font-bold bg-emerald-500 text-slate-950 px-2 py-1 rounded text-[10px]">Passed</span>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 07: SECTION 04 - STUDY GROUPS
    // ------------------------------------------------------------------
    {
      id: 7,
      tag: 'SLIDE 07 • SECTION 04',
      title: 'HSC & Admission Study Groups',
      subtitle: '📍 Location: Study Groups Page (Sidebar Menu #4)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Subject Channels (Science Squad, BUET Aspirants)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Attachment & PDF Sheet Sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Realtime Supabase Group Sync</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Study Groups</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">HSC 2025 Science Squad</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">● 14 Online</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 max-w-[80%]">
                <div className="font-bold text-indigo-400 text-[10px]">Tanvir Hossain</div>
                <span>Physics Chapter 3 Vector sheet er solve kaku ase group e?</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-white max-w-[80%] ml-auto">
                <div className="font-bold text-amber-300 text-[10px]">You</div>
                <span>Haan Tanvir! Sheet solve complete, Group PDF file section e upload korsi! 📄</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 08: SECTION 05 - DIRECT MESSAGING
    // ------------------------------------------------------------------
    {
      id: 8,
      tag: 'SLIDE 08 • SECTION 05',
      title: '1-on-1 Direct Messaging & Peer Collaboration',
      subtitle: '📍 Location: Messages Page & Friend Profiles',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Private 1-on-1 Chat with Study Partners</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Friend Requests & Mutual Partner Status</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero Latency WebSockets Delivery</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Messages</strong> or Friend Profile.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">Direct Chat with Rafiq Ahmed</span>
              <span className="text-[10px] text-emerald-400 font-bold">● Active Now</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 max-w-[80%]">
                <span>Dost, Ajker Physics Mechanics Model Test er 5th question er solution ta ektu bujhaibi?</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-white max-w-[80%] ml-auto">
                <span>Haan, Formula hocche F = ma sin(θ). Short note e likhe image pathacchi!</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 09: SECTION 06 - NATIONAL LEADERBOARD
    // ------------------------------------------------------------------
    {
      id: 9,
      tag: 'SLIDE 09 • SECTION 06',
      title: 'National Student Leaderboard & Star Rankings',
      subtitle: '📍 Location: Leaderboard Page (Sidebar Menu #6)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>National All-Bangladesh Ranking Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Calculated via Study Hours, Streaks & Stars</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Top 3 Podium Badges & Daily Multipliers</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Leaderboard</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-white pb-2 border-b border-slate-800 flex justify-between">
              <span>NATIONAL TOP RANKINGS</span>
              <span className="text-amber-400 font-mono">Top 3 Students</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center">1</span>
                <span className="font-bold text-white">Siam Islam (Notre Dame College)</span>
              </div>
              <span className="font-mono font-bold text-amber-400">1,890 Stars 🔥</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-bold text-slate-200">Ayesha Rahman (Holy Cross)</span>
              </div>
              <span className="font-mono font-bold text-slate-300">1,620 Stars 🔥</span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <span className="font-bold text-indigo-300">You (Current User)</span>
              </div>
              <span className="font-mono font-bold text-indigo-300">1,450 Stars 🔥</span>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 10: SECTION 07 - 7-DAY SPRINT CHALLENGES
    // ------------------------------------------------------------------
    {
      id: 10,
      tag: 'SLIDE 10 • SECTION 07',
      title: '7-Day Sprint Study Challenges & Badges',
      subtitle: '📍 Location: Challenges Page (Sidebar Menu #7)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Topic-focused Sprints (e.g. Physics 10h Sprint)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automated Goal Progress Tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unlocks Special Profile Achievement Badges</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Challenges</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-white">
                <span>🎯 Higher Math Calculus 12-Hour Sprint</span>
                <span className="text-purple-400 font-mono">8.5 / 12 Hours</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[70%]" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Progress: 70% Completed</span>
                <span className="text-amber-400 font-bold">Reward: +200 Stars 🌟</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 11: SECTION 08 - TASKS & NOTES MANAGER
    // ------------------------------------------------------------------
    {
      id: 11,
      tag: 'SLIDE 11 • SECTION 08',
      title: 'Task Todo Planner & Digital Notes Manager',
      subtitle: '📍 Location: Tasks & Notes Pages (Sidebar Menus #8 & #9)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Priority Todo Lists (High, Medium, Low)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Digital Revision Notepad with Category Tags</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Syllabus Chapter Checklist Synchronization</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Task Planner</strong> or <strong>Notes</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-bold text-white">TODAY'S REVISION CHECKLIST</div>
              <div className="space-y-1.5">
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 line-through">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Physics Chapter 3 Vector Formulas Revision</span>
                </div>
                <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border border-slate-500" />
                  <span>Chemistry Organic Reactions Practice (15 MCQs)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 12: SECTION 09 - SCIENTIFIC CALCULATOR
    // ------------------------------------------------------------------
    {
      id: 12,
      tag: 'SLIDE 12 • SECTION 09',
      title: 'Scientific Calculator & Formula Sheet Reference',
      subtitle: '📍 Location: Calculator & Formulas Page (Sidebar Menu #10)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Full Scientific Functions (Sin, Cos, Log, Ln, Deg/Rad)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant Formula Sheet Reference (Physics, Math)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Built-in Constants (g = 9.8, c = 3x10^8 m/s)</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Calculator & Formulas</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-center">
              <div className="text-[10px] text-slate-400">SCIENTIFIC CALCULATOR DISPLAY</div>
              <div className="text-xl font-mono font-bold text-amber-400 bg-slate-950 p-2 rounded border border-slate-800 text-right">
                sin(45°) * 9.8 = 6.9296
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-bold">
                <span className="p-1.5 rounded bg-slate-800 text-slate-300">sin</span>
                <span className="p-1.5 rounded bg-slate-800 text-slate-300">cos</span>
                <span className="p-1.5 rounded bg-slate-800 text-slate-300">log</span>
                <span className="p-1.5 rounded bg-amber-500 text-slate-950">AC</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 13: SECTION 10 - PERFORMANCE ANALYTICS
    // ------------------------------------------------------------------
    {
      id: 13,
      tag: 'SLIDE 13 • SECTION 10',
      title: 'Subject Performance Analytics & Weekly Reports',
      subtitle: '📍 Location: Analytics Page (Sidebar Menu #11)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Key Features
              </h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Subject Time Distribution Bar Charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Strong vs Weak Subject Balance Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Monthly Target Hour Tracker</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <strong>📍 How to access:</strong> Open Sidebar → Click <strong>Analytics</strong>.
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-bold text-white">THIS WEEK'S SUBJECT TIME LOG (HOURS)</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Physics (14.5 Hours)</span>
                    <span className="text-indigo-400 font-bold">40%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[40%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Higher Math (10.8 Hours)</span>
                    <span className="text-emerald-400 font-bold">30%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[30%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 14: TECHNICAL STACK & ARCHITECTURE
    // ------------------------------------------------------------------
    {
      id: 14,
      tag: 'SLIDE 14 • TECHNICAL STACK',
      title: 'Full-Stack Technical Architecture',
      subtitle: 'Modern Engineering Built for Zero Latency & High Availability',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-400 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Frontend Tier
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• React 18 with Vite Bundler</li>
              <li>• TypeScript Type-Safety</li>
              <li>• Tailwind CSS Utility Engine</li>
              <li>• Motion React Smooth Transitions</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Compass className="w-4 h-4" /> Backend & DB Tier
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• Supabase PostgreSQL Database</li>
              <li>• Realtime WebSockets Sync</li>
              <li>• LocalStorage Resilience Fallback</li>
              <li>• Row Level Security (RLS)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Target className="w-4 h-4" /> Quality Assurance
            </div>
            <ul className="text-slate-300 space-y-1.5">
              <li>• Slate & Emerald Dark Aesthetic</li>
              <li>• Sub-second Cold Boot Speed</li>
              <li>• 100% Mobile & Desktop Responsive</li>
              <li>• Zero Broken Component Handlers</li>
            </ul>
          </div>
        </div>
      )
    },

    // ------------------------------------------------------------------
    // SLIDE 15: CONCLUSION & LIVE DEMO LAUNCH
    // ------------------------------------------------------------------
    {
      id: 15,
      tag: 'SLIDE 15 • CONCLUSION',
      title: 'Ready for Live Exploration & Q&A',
      subtitle: 'Experience StudyPartner BD First-Hand',
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
                15 Dedicated Slides
              </span>
            </h1>
            <p className="text-xs text-slate-400">StudyPartner BD Full Presentation • Slide {currentSlide + 1} of {slides.length}</p>
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
                <Grid className="w-5 h-5 text-indigo-400" /> Jump to Slide (15 Total)
              </h3>
              <button
                onClick={() => setShowGridModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setShowGridModal(false);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    currentSlide === idx
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-[9px] font-bold text-indigo-400 mb-0.5">SLIDE {s.id < 10 ? `0${s.id}` : s.id}</div>
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
