import pptxgen from 'pptxgenjs';

async function generatePresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'StudyPartner BD Team';
  pptx.company = 'StudyPartner BD';
  pptx.title = 'StudyPartner BD - Official 15-Slide Deck';

  // Theme Colors
  const BG_COLOR = '0F172A'; // Slate 900
  const CARD_BG = '1E293B';  // Slate 800
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8'; // Slate 400
  const ACCENT_INDIGO = '6366F1';
  const ACCENT_AMBER = 'F59E0B';
  const ACCENT_EMERALD = '10B981';
  const ACCENT_CYAN = '06B6D4';
  const ACCENT_PURPLE = 'A855F7';

  const createBaseSlide = (tag, title, subtitle) => {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    // Tag
    slide.addText(tag, {
      x: 0.8, y: 0.5, w: 11.5, h: 0.4,
      fontSize: 12, bold: true, color: ACCENT_INDIGO, fontFace: 'Arial'
    });

    // Title
    slide.addText(title, {
      x: 0.8, y: 0.9, w: 11.5, h: 0.6,
      fontSize: 26, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
    });

    // Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.5, w: 11.5, h: 0.4,
        fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
      });
    }

    return slide;
  };

  // ------------------------------------------------------------------
  // SLIDE 1: COVER
  // ------------------------------------------------------------------
  const s1 = pptx.addSlide();
  s1.background = { color: BG_COLOR };
  s1.addText('STUDYPARTNER BD', {
    x: 0.8, y: 1.5, w: 11.5, h: 0.8,
    fontSize: 44, bold: true, color: ACCENT_INDIGO, fontFace: 'Arial'
  });
  s1.addText('Next-Gen Social Learning & Study Tracking Platform for HSC & Admission Candidates', {
    x: 0.8, y: 2.3, w: 11.5, h: 0.6,
    fontSize: 22, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
  });
  s1.addText('Empowering Bangladesh students with 30-Day Activity Heatmaps, Live Exam Engines & Collaborative Peer Groups.', {
    x: 0.8, y: 3.1, w: 11.5, h: 0.8,
    fontSize: 16, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s1.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 4.5, w: 11.5, h: 1.8,
    fill: { color: CARD_BG },
    line: { color: ACCENT_INDIGO, width: 1.5 }
  });
  s1.addText('🚀 Core Features Overview:\n• 30-Day Heatmaps & Live Timer\t• Automated Model Tests (-0.25)\n• Peer Group Chat & DMs\t\t• National Rankings & 7-Day Sprints', {
    x: 1.1, y: 4.8, w: 10.9, h: 1.2,
    fontSize: 16, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 2: PROBLEM STATEMENT
  // ------------------------------------------------------------------
  const s2 = createBaseSlide('SLIDE 02 • THE CHALLENGE', 'Core Struggles of HSC & Admission Candidates', 'Why Traditional Self-Study Fails to Produce Consistent Top Rankers');
  const probs = [
    { title: '1. Procrastination & Isolation', desc: 'Studying alone without peer accountability causes loss of daily momentum.' },
    { title: '2. Unmeasured Hours', desc: 'Students read without tracking subject-wise focus or 30-day consistency.' },
    { title: '3. Untimed Model Tests', desc: 'Lack of timed online exams with negative marking (-0.25) and analysis.' },
    { title: '4. Fragmented Doubt Solving', desc: 'Difficulty finding dedicated study partners and HSC/Admission topic groups.' }
  ];
  probs.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.8;
    const y = 2.1 + row * 2.3;
    s2.addShape(pptx.shapes.RECTANGLE, { x, y, w: 5.4, h: 2.0, fill: { color: CARD_BG }, line: { color: '334155', width: 1 } });
    s2.addText(p.title, { x: x + 0.3, y: y + 0.3, w: 4.8, h: 0.4, fontSize: 17, bold: true, color: ACCENT_CYAN, fontFace: 'Arial' });
    s2.addText(p.desc, { x: x + 0.3, y: y + 0.8, w: 4.8, h: 1.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial' });
  });

  // ------------------------------------------------------------------
  // SLIDE 3: SOLUTION OVERVIEW
  // ------------------------------------------------------------------
  const s3 = createBaseSlide('SLIDE 03 • THE SOLUTION', 'The StudyPartner BD Ecosystem', '4 Core Pillars Built for Academic Consistency');
  const solPillars = [
    { title: '1. Smart Tracker', desc: 'Live stopwatch, 30-day activity heatmaps, & subject breakdowns.' },
    { title: '2. Online Model Tests', desc: 'Timed MCQ model tests, negative marking (-0.25) & scorecards.' },
    { title: '3. Gamified Sprints', desc: '7-day subject sprint challenges, star rewards, & national rankings.' },
    { title: '4. Peer Community', desc: 'Dedicated HSC Science squads, BUET aspirants & direct chat.' }
  ];
  solPillars.forEach((sp, idx) => {
    const x = 0.8 + idx * 2.95;
    const y = 2.2;
    s3.addShape(pptx.shapes.RECTANGLE, { x, y, w: 2.7, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_INDIGO, width: 1.2 } });
    s3.addText(sp.title, { x: x + 0.2, y: y + 0.4, w: 2.3, h: 0.5, fontSize: 16, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
    s3.addText(sp.desc, { x: x + 0.2, y: y + 1.1, w: 2.3, h: 2.8, fontSize: 13, color: TEXT_MUTED, fontFace: 'Arial' });
  });

  // ------------------------------------------------------------------
  // SLIDE 4: SECTION 01 - DASHBOARD & HEATMAP
  // ------------------------------------------------------------------
  const s4 = createBaseSlide('SLIDE 04 • SECTION 01', 'Dashboard & 30-Day Activity Heatmap', '📍 Location: Dashboard Page (Sidebar Menu #1)');
  s4.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_EMERALD, width: 1.2 } });
  s4.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_EMERALD, fontFace: 'Arial' });
  s4.addText('• 30-Day Github-style Activity Heatmap\n• Active Study Streak Counter (14 Days 🔥)\n• Today\'s Total Hours & Earned Stars\n• Quick Navigation Widgets to All Modules', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s4.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s4.addText('MOCKUP: 30-DAY HEATMAP GRID', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s4.addText('🟩 🟩 🟩 ⬜ 🟩 🟩 🟩 🟩 ⬜ 🟩\n🟩 🟩 ⬜ 🟩 🟩 🟩 ⬜ 🟩 🟩 🟩\n🟩 🟩 🟩 🟩 ⬜ 🟩 🟩 🟩 🟩 🟩', {
    x: 6.9, y: 3.2, w: 5.1, h: 1.5, fontSize: 20, color: ACCENT_EMERALD, fontFace: 'Courier'
  });
  s4.addText('Current Status: 14 Day Active Streak 🔥\nTotal Stars Earned: 1,450 Stars', {
    x: 6.9, y: 5.0, w: 5.1, h: 1.0, fontSize: 14, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 5: SECTION 02 - LIVE STUDY TIMER
  // ------------------------------------------------------------------
  const s5 = createBaseSlide('SLIDE 05 • SECTION 02', 'Live Study Timer & Focus Soundscapes', '📍 Location: Live Timer Page (Sidebar Menu #2)');
  s5.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_AMBER, width: 1.2 } });
  s5.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
  s5.addText('• Subject Tagging (Physics, Math, Chemistry)\n• Ambient Audio Engine (Lo-Fi, Rain, Forest)\n• Stopwatch & Pomodoro Countdown Modes\n• Automatic Sync to Profile Analytics', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s5.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s5.addText('ACTIVE TIMER: 02:45:12', { x: 6.9, y: 2.8, w: 5.1, h: 0.6, fontSize: 26, bold: true, color: ACCENT_AMBER, fontFace: 'Courier' });
  s5.addText('Subject: Higher Math • Integration\nSoundscape: Gentle Rain Ambient Audio (Active 🌧️)', {
    x: 6.9, y: 3.8, w: 5.1, h: 1.2, fontSize: 15, color: TEXT_WHITE, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 6: SECTION 03 - ONLINE MCQ MODEL TESTS
  // ------------------------------------------------------------------
  const s6 = createBaseSlide('SLIDE 06 • SECTION 03', 'Automated MCQ Model Test Engine', '📍 Location: Model Tests Page (Sidebar Menu #3)');
  s6.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_EMERALD, width: 1.2 } });
  s6.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_EMERALD, fontFace: 'Arial' });
  s6.addText('• Admission Negative Marking (-0.25)\n• Live Timer with Auto-Submit\n• Subject & Chapter Breakdown Tests\n• Instant Scorecard & Explanations', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s6.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s6.addText('MODEL TEST EVALUATION', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s6.addText('HSC Physics Mechanics Chapter 3\nScore: 18.75 / 20.00 (93.75%)\nCorrect: 19 | Incorrect: 1 (-0.25)\nStatus: Passed (Top 5% Percentile)', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 15, color: ACCENT_EMERALD, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 7: SECTION 04 - STUDY GROUPS
  // ------------------------------------------------------------------
  const s7 = createBaseSlide('SLIDE 07 • SECTION 04', 'HSC & Admission Study Groups', '📍 Location: Study Groups Page (Sidebar Menu #4)');
  s7.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_CYAN, width: 1.2 } });
  s7.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_CYAN, fontFace: 'Arial' });
  s7.addText('• Subject Channels (Science Squad, BUET Aspirants)\n• PDF Handout & Practice Sheet Uploads\n• Realtime Supabase Group Sync\n• Active Online Member Indicators', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s7.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s7.addText('GROUP CHAT: HSC 2025 Science Squad', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 15, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s7.addText('Tanvir: Physics Vector sheet solve kaku ase?\nYou: Haan Tanvir! Sheet solve complete, Group PDF file section e upload korsi! 📄', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 8: SECTION 05 - DIRECT MESSAGING
  // ------------------------------------------------------------------
  const s8 = createBaseSlide('SLIDE 08 • SECTION 05', 'Direct Messaging & Peer Collaboration', '📍 Location: Messages Page & Friend Profiles');
  s8.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_INDIGO, width: 1.2 } });
  s8.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_INDIGO, fontFace: 'Arial' });
  s8.addText('• Private 1-on-1 Chat with Study Partners\n• Friend Requests & Mutual Partner Badges\n• Zero-latency WebSockets Communication\n• Doubt Solving & Notes Sharing', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s8.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s8.addText('DIRECT CHAT: Rafiq Ahmed', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s8.addText('Rafiq: Dost, 5th question er solution ta bujhaibi?\nYou: Formula hocche F = ma sin(θ). Short note e likhe image pathacchi!', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 14, color: ACCENT_INDIGO, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 9: SECTION 06 - NATIONAL LEADERBOARD
  // ------------------------------------------------------------------
  const s9 = createBaseSlide('SLIDE 09 • SECTION 06', 'National Student Leaderboard & Star Rankings', '📍 Location: Leaderboard Page (Sidebar Menu #6)');
  s9.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_AMBER, width: 1.2 } });
  s9.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
  s9.addText('• National All-Bangladesh Ranking Engine\n• Calculated via Hours, Streaks & Stars\n• Podium Badges (#1 Gold, #2 Silver, #3 Bronze)\n• Daily Multipliers for Long Streaks', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s9.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s9.addText('NATIONAL RANKINGS (TOP 3)', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s9.addText('🥇 1. Siam Islam (Notre Dame) - 1,890 Stars\n🥈 2. Ayesha Rahman (Holy Cross) - 1,620 Stars\n🥉 3. You (Current Rank) - 1,450 Stars', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 15, color: ACCENT_AMBER, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 10: SECTION 07 - 7-DAY SPRINT CHALLENGES
  // ------------------------------------------------------------------
  const s10 = createBaseSlide('SLIDE 10 • SECTION 07', '7-Day Sprint Study Challenges', '📍 Location: Challenges Page (Sidebar Menu #7)');
  s10.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_PURPLE, width: 1.2 } });
  s10.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_PURPLE, fontFace: 'Arial' });
  s10.addText('• Topic Sprints (e.g., Higher Math 12h Sprint)\n• Automated Goal Progress Bar\n• Special Profile Achievement Badges\n• Daily Target Milestones', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s10.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s10.addText('ACTIVE SPRINT PROGRESS', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s10.addText('🎯 Higher Math Calculus 12h Sprint\nProgress: 8.5 / 12 Hours (70% Done)\nReward: +200 Stars 🌟 & Calculus Badge', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 15, color: ACCENT_PURPLE, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 11: SECTION 08 - TASKS & NOTES MANAGER
  // ------------------------------------------------------------------
  const s11 = createBaseSlide('SLIDE 11 • SECTION 08', 'Task Todo Planner & Digital Notes Manager', '📍 Location: Tasks & Notes Pages (Sidebar Menus #8 & #9)');
  s11.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_EMERALD, width: 1.2 } });
  s11.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_EMERALD, fontFace: 'Arial' });
  s11.addText('• Priority Todo Lists (High, Medium, Low)\n• Digital Revision Notepad with Markdown\n• Syllabus Chapter Checklist Sync\n• Category Filtering & Color Tags', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s11.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s11.addText('TODAY\'S REVISION CHECKLIST', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s11.addText('✅ Physics Chapter 3 Vector Formulas\n[ ] Chemistry Organic Reactions Practice\n[ ] Higher Math Integration Worksheet', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 15, color: ACCENT_EMERALD, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 12: SECTION 09 - SCIENTIFIC CALCULATOR
  // ------------------------------------------------------------------
  const s12 = createBaseSlide('SLIDE 12 • SECTION 09', 'Scientific Calculator & Formula Sheet', '📍 Location: Calculator & Formulas Page (Sidebar Menu #10)');
  s12.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_AMBER, width: 1.2 } });
  s12.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
  s12.addText('• Full Scientific Functions (Sin, Cos, Log, Ln)\n• Formula Sheet Cards (Physics, Math, Chem)\n• Built-in Physics Constants (g = 9.8 m/s²)\n• Unit Conversions & Quick Reset', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s12.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s12.addText('CALCULATOR DISPLAY', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s12.addText('sin(45°) * 9.8 = 6.9296\nConstant: c = 3 x 10^8 m/s\nFormula: Vector Resultant R = √(P² + Q² + 2PQ cos α)', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 14, color: ACCENT_AMBER, fontFace: 'Courier'
  });

  // ------------------------------------------------------------------
  // SLIDE 13: SECTION 10 - PERFORMANCE ANALYTICS
  // ------------------------------------------------------------------
  const s13 = createBaseSlide('SLIDE 13 • SECTION 10', 'Subject Analytics & Weekly Reports', '📍 Location: Analytics Page (Sidebar Menu #11)');
  s13.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_INDIGO, width: 1.2 } });
  s13.addText('Key Capabilities:', { x: 1.1, y: 2.5, w: 4.9, h: 0.4, fontSize: 18, bold: true, color: ACCENT_INDIGO, fontFace: 'Arial' });
  s13.addText('• Subject Time Distribution Bar Charts\n• Strong vs Weak Subject Balance Analysis\n• Monthly Goal Progress Tracker\n• Exportable Study Log Data', {
    x: 1.1, y: 3.1, w: 4.9, h: 3.0, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
  });
  s13.addShape(pptx.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 5.7, h: 4.2, fill: { color: '020617' }, line: { color: '1E293B', width: 1 } });
  s13.addText('WEEKLY TIME LOG (HOURS)', { x: 6.9, y: 2.5, w: 5.1, h: 0.4, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: 'Arial' });
  s13.addText('Physics: 14.5 Hours (40%)\nHigher Math: 10.8 Hours (30%)\nChemistry: 7.2 Hours (20%)\nBiology: 3.6 Hours (10%)', {
    x: 6.9, y: 3.2, w: 5.1, h: 2.5, fontSize: 15, color: ACCENT_INDIGO, fontFace: 'Arial'
  });

  // ------------------------------------------------------------------
  // SLIDE 14: TECHNICAL ARCHITECTURE
  // ------------------------------------------------------------------
  const s14 = createBaseSlide('SLIDE 14 • TECH ARCHITECTURE', 'Full-Stack Technical Architecture', 'Engineered for Sub-Second Speed & Zero Latency');
  const techTiers = [
    { title: 'Frontend Tier', items: ['React 18 & TypeScript', 'Vite Fast Bundler', 'Tailwind CSS Utility UI', 'Motion React Animations'] },
    { title: 'Backend Tier', items: ['Supabase PostgreSQL', 'Realtime WebSockets Sync', 'LocalStorage Fallback', 'Row Level Security (RLS)'] },
    { title: 'Quality Assurance', items: ['Slate & Emerald Dark Palette', 'Sub-second Load Speed', 'Zero Broken Handlers', '100% Responsive Layout'] }
  ];
  techTiers.forEach((t, idx) => {
    const x = 0.8 + idx * 3.9;
    const y = 2.2;
    s14.addShape(pptx.shapes.RECTANGLE, { x, y, w: 3.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_CYAN, width: 1.2 } });
    s14.addText(t.title, { x: x + 0.3, y: y + 0.4, w: 2.9, h: 0.5, fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
    const bulletText = t.items.map(it => `• ${it}`).join('\n\n');
    s14.addText(bulletText, { x: x + 0.3, y: y + 1.1, w: 2.9, h: 2.8, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial' });
  });

  // ------------------------------------------------------------------
  // SLIDE 15: CONCLUSION
  // ------------------------------------------------------------------
  const s15 = createBaseSlide('SLIDE 15 • CONCLUSION', 'Ready for Live Demonstration & Q&A', 'StudyPartner BD - Shaping the Future of Social Learning');
  s15.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 2.2, w: 11.5, h: 4.2, fill: { color: CARD_BG }, line: { color: ACCENT_EMERALD, width: 1.5 } });
  s15.addText('💡 Presentation Summary & Next Steps:', { x: 1.2, y: 2.6, w: 10.7, h: 0.5, fontSize: 22, bold: true, color: ACCENT_AMBER, fontFace: 'Arial' });
  s15.addText('• All 11 platform modules are fully functional and ready for live demonstration.\n• Test live study heatmaps, automated MCQ model tests with negative marking, and real-time peer study group chats.\n• Download the generated .pptx file directly from the app for offline presentations.', {
    x: 1.2, y: 3.3, w: 10.7, h: 2.5, fontSize: 16, color: TEXT_WHITE, fontFace: 'Arial'
  });

  // Write PPTX
  await pptx.writeFile({ fileName: 'public/StudyPartner_BD_Presentation.pptx' });
  await pptx.writeFile({ fileName: 'StudyPartner_BD_Presentation.pptx' });
  console.log('Successfully generated 15-Slide Presentation PPTX file!');
}

generatePresentation().catch(console.error);
