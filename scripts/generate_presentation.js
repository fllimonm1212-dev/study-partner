import pptxgen from 'pptxgenjs';

async function generatePresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'StudyPartner BD Team';
  pptx.company = 'StudyPartner BD';
  pptx.title = 'StudyPartner BD - Official Presentation Deck';

  // Theme Colors
  const BG_COLOR = '0F172A'; // Slate 900
  const CARD_BG = '1E293B';  // Slate 800
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8'; // Slate 400
  const ACCENT_INDIGO = '6366F1';
  const ACCENT_AMBER = 'F59E0B';
  const ACCENT_EMERALD = '10B981';
  const ACCENT_CYAN = '06B6D4';

  const createBaseSlide = () => {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };
    return slide;
  };

  // SLIDE 1: Title
  const slide1 = createBaseSlide();
  slide1.addText('STUDYPARTNER BD', {
    x: 1.0, y: 1.8, w: 11.3, h: 0.8,
    fontSize: 44, bold: true, color: ACCENT_INDIGO, fontFace: 'Arial'
  });
  slide1.addText('Next-Gen Social Learning & Study Tracking Platform', {
    x: 1.0, y: 2.6, w: 11.3, h: 0.6,
    fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
  });
  slide1.addText('Empowering HSC 2025/2026 & University Admission candidates across Bangladesh with 30-Day Activity Heatmaps, Live Exam Engines & Peer Collaboration.', {
    x: 1.0, y: 3.3, w: 10.5, h: 1.0,
    fontSize: 16, color: TEXT_MUTED, fontFace: 'Arial'
  });
  slide1.addShape(pptx.shapes.RECTANGLE, {
    x: 1.0, y: 4.8, w: 11.3, h: 1.5,
    fill: { color: CARD_BG },
    line: { color: ACCENT_INDIGO, width: 1.5 }
  });
  slide1.addText('🚀 Core Modules: 30-Day Heatmaps • Automated MCQ Tests • Science Squad Chat • Leaderboard', {
    x: 1.3, y: 5.2, w: 10.7, h: 0.7,
    fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
  });

  // SLIDE 2: Problems & Solutions
  const slide2 = createBaseSlide();
  slide2.addText('PROBLEM & SOLUTION', {
    x: 1.0, y: 0.8, w: 11.3, h: 0.5,
    fontSize: 14, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
  });
  slide2.addText('Bridging the Gap in HSC & Admission Preparation', {
    x: 1.0, y: 1.3, w: 11.3, h: 0.6,
    fontSize: 28, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
  });

  const probs = [
    { title: '1. Isolation & Burnout', desc: 'Studying alone leads to loss of study momentum without daily accountability.' },
    { title: '2. Unmeasured Hours', desc: 'Students spend hours reading without tracking subject-wise focus or 30-day consistency.' },
    { title: '3. Quality Model Tests', desc: 'Lack of timed online practice exams with negative marking (-0.25) and detailed analysis.' },
    { title: '4. Fragmented Peer Support', desc: 'Difficulty finding dedicated study partners and topic-focused HSC/Admission study groups.' }
  ];

  probs.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.0 + col * 5.8;
    const y = 2.2 + row * 2.3;

    slide2.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 5.4, h: 2.0,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });
    slide2.addText(p.title, {
      x: x + 0.3, y: y + 0.3, w: 4.8, h: 0.4,
      fontSize: 18, bold: true, color: ACCENT_CYAN, fontFace: 'Arial'
    });
    slide2.addText(p.desc, {
      x: x + 0.3, y: y + 0.8, w: 4.8, h: 1.0,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // SLIDE 3: Navigation Map & Feature Placement
  const slide3 = createBaseSlide();
  slide3.addText('INTERFACE NAVIGATION MAP', {
    x: 1.0, y: 0.8, w: 11.3, h: 0.5,
    fontSize: 14, bold: true, color: ACCENT_EMERALD, fontFace: 'Arial'
  });
  slide3.addText('Where Every Feature is Located in the Application', {
    x: 1.0, y: 1.3, w: 11.3, h: 0.6,
    fontSize: 28, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
  });

  const uiItems = [
    { loc: '📍 Left Sidebar', title: 'Dashboard & Navigation', desc: 'Access Dashboard, Live Timer, Exams, Group Chat, and Leaderboard.' },
    { loc: '📍 Top Center', title: 'Daily Streak & Star Engine', desc: 'Shows active study streak (e.g. 14 Days 🔥) and star rewards.' },
    { loc: '📍 Dashboard Main', title: '30-Day Activity Heatmap', desc: 'Visual grid tracking subject-wise time and daily study consistency.' },
    { loc: '📍 Exams Tab', title: 'Realtime MCQ Engine', desc: 'Timed model tests with instant score cards and detailed solution keys.' }
  ];

  uiItems.forEach((u, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.0 + col * 5.8;
    const y = 2.2 + row * 2.3;

    slide3.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 5.4, h: 2.0,
      fill: { color: CARD_BG },
      line: { color: ACCENT_INDIGO, width: 1.2 }
    });
    slide3.addText(`${u.loc} — ${u.title}`, {
      x: x + 0.3, y: y + 0.3, w: 4.8, h: 0.4,
      fontSize: 17, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
    });
    slide3.addText(u.desc, {
      x: x + 0.3, y: y + 0.8, w: 4.8, h: 1.0,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // SLIDE 4: Technical Stack
  const slide4 = createBaseSlide();
  slide4.addText('TECHNICAL ARCHITECTURE', {
    x: 1.0, y: 0.8, w: 11.3, h: 0.5,
    fontSize: 14, bold: true, color: ACCENT_CYAN, fontFace: 'Arial'
  });
  slide4.addText('Full-Stack Tech Architecture', {
    x: 1.0, y: 1.3, w: 11.3, h: 0.6,
    fontSize: 28, bold: true, color: TEXT_WHITE, fontFace: 'Arial'
  });

  const techStack = [
    { title: 'Frontend Tier', items: ['React 18 & TypeScript', 'Vite Fast Bundler', 'Tailwind CSS Utility UI', 'Motion React Animations'] },
    { title: 'Backend Tier', items: ['Supabase PostgreSQL', 'Realtime WebSockets', 'LocalStorage Fallback', 'Token Session Auth'] },
    { title: 'UI Craftsmanship', items: ['Slate & Emerald Dark Palette', 'Sub-second Load Speed', 'Zero Broken Handlers', '100% Mobile Responsive'] }
  ];

  techStack.forEach((t, idx) => {
    const x = 1.0 + idx * 3.9;
    const y = 2.2;

    slide4.addShape(pptx.shapes.RECTANGLE, {
      x, y, w: 3.5, h: 4.2,
      fill: { color: CARD_BG },
      line: { color: ACCENT_EMERALD, width: 1.2 }
    });
    slide4.addText(t.title, {
      x: x + 0.3, y: y + 0.4, w: 2.9, h: 0.5,
      fontSize: 18, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
    });
    const bulletText = t.items.map(it => `• ${it}`).join('\n\n');
    slide4.addText(bulletText, {
      x: x + 0.3, y: y + 1.1, w: 2.9, h: 2.8,
      fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // SLIDE 5: Conclusion
  const slide5 = createBaseSlide();
  slide5.addText('THANK YOU!', {
    x: 1.0, y: 1.8, w: 11.3, h: 0.8,
    fontSize: 48, bold: true, color: ACCENT_EMERALD, fontFace: 'Arial'
  });
  slide5.addText('StudyPartner BD - Shaping the Future of Social Learning', {
    x: 1.0, y: 2.8, w: 11.3, h: 0.6,
    fontSize: 22, color: TEXT_WHITE, fontFace: 'Arial'
  });
  slide5.addShape(pptx.shapes.RECTANGLE, {
    x: 1.0, y: 3.8, w: 11.3, h: 2.2,
    fill: { color: CARD_BG },
    line: { color: ACCENT_INDIGO, width: 1.5 }
  });
  slide5.addText('💡 Questions & Feedback Are Most Welcome!', {
    x: 1.3, y: 4.2, w: 10.7, h: 0.5,
    fontSize: 20, bold: true, color: ACCENT_AMBER, fontFace: 'Arial'
  });

  await pptx.writeFile({ fileName: 'public/StudyPartner_BD_Presentation.pptx' });
  await pptx.writeFile({ fileName: 'StudyPartner_BD_Presentation.pptx' });
  console.log('Regenerated PPTX presentation successfully!');
}

generatePresentation().catch(console.error);
