import { getDemoAccounts, addDemoFriend, setDemoModeEnabled } from './demoAccounts';

export interface DemoExam {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  start_time?: string;
  end_time?: string;
  is_published: boolean;
  questions?: any[];
}

export interface DemoChallenge {
  id: string;
  title: string;
  description: string;
  target_hours: number;
  reward_stars: number;
  category: string;
  start_date: string;
  end_date: string;
}

export const DEFAULT_DEMO_EXAMS: DemoExam[] = [
  {
    id: 'demo-exam-physics-1',
    title: 'HSC Physics 1st Paper: Mechanics & Gravitation Special Exam',
    description: 'Comprehensive evaluation covering Newton\'s Laws, Vector, Work & Energy, and Gravitation.',
    subject: 'Physics',
    duration_minutes: 30,
    total_points: 50,
    is_published: true,
    questions: [
      {
        id: 'q1',
        question: 'Vector A = 3i + 4j er মান কত?',
        options: ['5', '7', '12', '25'],
        correct_answer: '0'
      },
      {
        id: 'q2',
        question: 'কাজের মাত্রা কোনটি?',
        options: ['[MLT^-1]', '[ML^2T^-2]', '[ML^-1T^-2]', '[MLT^-2]'],
        correct_answer: '1'
      },
      {
        id: 'q3',
        question: 'পৃথিবীর কেন্দ্রে মহাকর্ষীয় ত্বরণ g এর মান কত?',
        options: ['9.8 m/s^2', '0 m/s^2', 'Infinite', '4.9 m/s^2'],
        correct_answer: '1'
      }
    ]
  },
  {
    id: 'demo-exam-math-1',
    title: 'Higher Math: Calculus & Integration Master Quiz',
    description: 'Test your grasp on Differentiation formulas, Definite & Indefinite Integration.',
    subject: 'Higher Math',
    duration_minutes: 40,
    total_points: 50,
    is_published: true,
    questions: [
      {
        id: 'q1',
        question: 'd/dx (sin x) = ?',
        options: ['cos x', '-cos x', 'tan x', 'sec^2 x'],
        correct_answer: '0'
      },
      {
        id: 'q2',
        question: '∫ (1/x) dx = ?',
        options: ['x', 'ln|x| + c', 'e^x', '-1/x^2'],
        correct_answer: '1'
      }
    ]
  },
  {
    id: 'demo-exam-chem-1',
    title: 'Chemistry: Organic Chemistry Reaction Mechanisms',
    description: 'Evaluation on Electrophilic substitution, Hydrocarbons, and Functional groups.',
    subject: 'Chemistry',
    duration_minutes: 25,
    total_points: 40,
    is_published: true,
    questions: [
      {
        id: 'q1',
        question: 'বেনজিনের রেজোন্যান্স সংকরায়ন অবস্থা কোনটি?',
        options: ['sp', 'sp2', 'sp3', 'dsp2'],
        correct_answer: '1'
      }
    ]
  },
  {
    id: 'demo-exam-ict-1',
    title: 'ICT: C Programming & Logic Gates Model Test',
    description: 'Covers C syntax, loops, functions, OR/AND/NAND logic gates.',
    subject: 'ICT',
    duration_minutes: 20,
    total_points: 30,
    is_published: true,
    questions: [
      {
        id: 'q1',
        question: 'NAND গেটের আউটপুট কখন 0 হয়?',
        options: ['সবগুলো ইনপুট 1 হলে', 'সবগুলো ইনপুট 0 হলে', 'যেকোনো একটি 0 হলে', 'কখনোই নয়'],
        correct_answer: '0'
      }
    ]
  }
];

export const DEFAULT_DEMO_CHALLENGES: DemoChallenge[] = [
  {
    id: 'demo-chal-1',
    title: '7-Day Physics Mechanics Sprint 🚀',
    description: 'Complete 14 hours of focused Physics study in 7 days to master Mechanics and Vectors.',
    target_hours: 14,
    reward_stars: 100,
    category: 'Physics',
    start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString()
  },
  {
    id: 'demo-chal-2',
    title: '100 Calculus Problems Marathon 🧮',
    description: 'Solve differentiation and integration question bank problems for 20 hours.',
    target_hours: 20,
    reward_stars: 150,
    category: 'Higher Math',
    start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 10 * 86400000).toISOString()
  },
  {
    id: 'demo-chal-3',
    title: 'Daily 4-Hour Study Grind Routine 📚',
    description: 'Maintain consistency by logging 4+ study hours every single day for a week.',
    target_hours: 28,
    reward_stars: 200,
    category: 'General',
    start_date: new Date(Date.now() - 6 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 8 * 86400000).toISOString()
  },
  {
    id: 'demo-chal-4',
    title: 'Organic Chemistry Reaction Mastery 🧪',
    description: 'Master all named reactions and mechanisms in 10 focused study hours.',
    target_hours: 10,
    reward_stars: 80,
    category: 'Chemistry',
    start_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 5 * 86400000).toISOString()
  }
];

export function seedDemoDataForUser(userId: string, isDemoUser: boolean = true) {
  if (typeof window === 'undefined') return;

  // 1. Enable Demo Mode
  setDemoModeEnabled(true);

  // 2. Seed Friends
  const demoAccounts = getDemoAccounts();
  const sampleFriends = ['demo-user-1', 'demo-user-2', 'demo-user-3', 'demo-user-4', 'demo-user-5', 'demo-user-7'];
  sampleFriends.forEach(fid => addDemoFriend(fid));

  // 3. Seed Direct Messages with Friends
  const chatMessagesMap: Record<string, any[]> = {
    'demo-user-1': [
      { id: 'm1', sender_id: 'demo-user-1', text: 'Hey brother! Physics Mechanics Chapter 3 er Vector math gulo solve hoise?', content: 'Hey brother! Physics Mechanics Chapter 3 er Vector math gulo solve hoise?', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm2', sender_id: userId, text: 'Haan Tanvir! Integration and Vector sheet shob gulo practice korsi. Extremely clear ekhon! 🔥', content: 'Haan Tanvir! Integration and Vector sheet shob gulo practice korsi. Extremely clear ekhon! 🔥', created_at: new Date(Date.now() - 82000000).toISOString() },
      { id: 'm3', sender_id: 'demo-user-1', text: 'Awesome! Kal sokale shobai miley ekta group study session kori? Higher Math Calculus eo help hobe.', content: 'Awesome! Kal sokale shobai miley ekta group study session kori? Higher Math Calculus eo help hobe.', created_at: new Date(Date.now() - 75000000).toISOString() },
      { id: 'm4', sender_id: userId, text: 'Sure! 8:00 AM e online asbo. See you bro! 📖', content: 'Sure! 8:00 AM e online asbo. See you bro! 📖', created_at: new Date(Date.now() - 70000000).toISOString() }
    ],
    'demo-user-2': [
      { id: 'm1', sender_id: 'demo-user-2', text: 'Anika here! Tomorrow\'s Chemistry Organic Reactions model test er revision finish?', content: 'Anika here! Tomorrow\'s Chemistry Organic Reactions model test er revision finish?', created_at: new Date(Date.now() - 43200000).toISOString() },
      { id: 'm2', sender_id: userId, text: 'Yes Anika! Named reactions ar electrophilic substitution practice korsi. Expecting 90%+ 🩺', content: 'Yes Anika! Named reactions ar electrophilic substitution practice korsi. Expecting 90%+ 🩺', created_at: new Date(Date.now() - 36000000).toISOString() },
      { id: 'm3', sender_id: 'demo-user-2', text: 'Brilliant! Best of luck for the test! 🌟', content: 'Brilliant! Best of luck for the test! 🌟', created_at: new Date(Date.now() - 30000000).toISOString() }
    ],
    'demo-user-4': [
      { id: 'm1', sender_id: 'demo-user-4', text: 'Today\'s 4-hour study goal completed! 🔥 What about your progress?', content: 'Today\'s 4-hour study goal completed! 🔥 What about your progress?', created_at: new Date(Date.now() - 18000000).toISOString() },
      { id: 'm2', sender_id: userId, text: 'Same here Nusrat! Just finished 4.2 hours of Calculus & Physics. Streak is now 14 days! 🏆', content: 'Same here Nusrat! Just finished 4.2 hours of Calculus & Physics. Streak is now 14 days! 🏆', created_at: new Date(Date.now() - 14000000).toISOString() },
      { id: 'm3', sender_id: 'demo-user-4', text: 'Super impressive consistency! Keep it up! ✨', content: 'Super impressive consistency! Keep it up! ✨', created_at: new Date(Date.now() - 10000000).toISOString() }
    ]
  };

  Object.entries(chatMessagesMap).forEach(([friendId, msgs]) => {
    const key = `demo_chat_${userId}_${friendId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(msgs));
    }
  });

  // 4. Seed Exam Submissions
  const examSubmissionsKey = `demo_exam_submissions_${userId}`;
  const mockSubmissions = [
    {
      id: 'sub-1',
      exam_id: 'demo-exam-physics-1',
      user_id: userId,
      score: 48,
      total_points: 50,
      percentage: 96,
      status: 'completed',
      completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      exam_title: 'HSC Physics 1st Paper: Mechanics & Gravitation Special Exam'
    },
    {
      id: 'sub-2',
      exam_id: 'demo-exam-math-1',
      user_id: userId,
      score: 46,
      total_points: 50,
      percentage: 92,
      status: 'completed',
      completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      exam_title: 'Higher Math: Calculus & Integration Master Quiz'
    },
    {
      id: 'sub-3',
      exam_id: 'demo-exam-chem-1',
      user_id: userId,
      score: 38,
      total_points: 40,
      percentage: 95,
      status: 'completed',
      completed_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      exam_title: 'Chemistry: Organic Chemistry Reaction Mechanisms'
    }
  ];
  localStorage.setItem(examSubmissionsKey, JSON.stringify(mockSubmissions));

  // 5. Seed Challenge Progress
  const challengeProgressKey = `demo_challenge_progress_${userId}`;
  const mockChallengeProgress = [
    { challenge_id: 'demo-chal-1', progress_hours: 14, completed: true, joined_at: new Date(Date.now() - 6 * 86400000).toISOString() },
    { challenge_id: 'demo-chal-2', progress_hours: 18, completed: false, joined_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { challenge_id: 'demo-chal-3', progress_hours: 28, completed: true, joined_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { challenge_id: 'demo-chal-4', progress_hours: 7, completed: false, joined_at: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];
  localStorage.setItem(challengeProgressKey, JSON.stringify(mockChallengeProgress));

  // 6. Seed 30-Day Study Sessions for Dashboard Charts & Heatmap
  const studySessionsKey = `demo_study_sessions_${userId}`;
  const sessions: any[] = [];
  const subjects = ['Physics', 'Higher Math', 'Chemistry', 'Biology', 'ICT'];
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString();
    
    // Generate 2-3 sessions per day
    const duration = Math.floor(120 + Math.random() * 150); // 120 - 270 minutes/day
    sessions.push({
      id: `sess-${i}`,
      user_id: userId,
      subject_id: subjects[i % subjects.length],
      activity_type: 'Study',
      duration_minutes: duration,
      stars_earned: Math.floor(duration / 30) * 5,
      start_time: dateStr,
      created_at: dateStr
    });
  }
  localStorage.setItem(studySessionsKey, JSON.stringify(sessions));

  // 7. Seed Joined Groups
  const joinedGroupsKey = `joined_groups_${userId}`;
  const sampleGroups = ['demo-group-1', 'demo-group-2', 'demo-group-3'];
  localStorage.setItem(joinedGroupsKey, JSON.stringify(sampleGroups));

  // 8. Seed Tasks / Todo List
  const tasksKey = `demo_tasks_${userId}`;
  const mockTasks = [
    { id: 't1', title: 'Revise Physics Mechanics Chapter 2 & 3', completed: true, subject: 'Physics', due: 'Today' },
    { id: 't2', title: 'Practice 30 Higher Math Calculus questions', completed: true, subject: 'Higher Math', due: 'Today' },
    { id: 't3', title: 'Read Chemistry Organic Reaction Mechanisms', completed: true, subject: 'Chemistry', due: 'Today' },
    { id: 't4', title: 'Take ICT C Programming Model Test', completed: false, subject: 'ICT', due: 'Tomorrow' },
    { id: 't5', title: 'Solve BUET Question Bank Vector Section', completed: false, subject: 'Physics', due: 'In 2 days' }
  ];
  localStorage.setItem(tasksKey, JSON.stringify(mockTasks));
}
