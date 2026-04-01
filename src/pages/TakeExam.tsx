import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Trophy, FileText, Play, XCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function TakeExam() {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const targetUserId = searchParams.get('userId') || user?.id;
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (data?.role === 'admin') {
        setIsAdmin(true);
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!user || !id || !targetUserId) return;

    const fetchExamData = async () => {
      setLoading(true);
      try {
        // If viewing someone else's result, fetch their profile
        if (targetUserId !== user.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', targetUserId)
            .single();
          setStudentProfile(profileData);
        }

        // Check if already submitted or in progress
        const { data: existingSub } = await supabase
          .from('exam_submissions')
          .select('*')
          .eq('exam_id', id)
          .eq('user_id', targetUserId)
          .maybeSingle();

      if (existingSub) {
        if (existingSub.status === 'completed') {
          setIsSubmitted(true);
          setResult(existingSub);
          if (existingSub.answers) {
            setAnswers(existingSub.answers);
          }
        } else if (existingSub.status === 'in-progress' && targetUserId === user.id) {
          setCurrentSubmissionId(existingSub.id);
          setHasStarted(true);
          
          // Load answers from DB first
          let currentAnswers = existingSub.answers || {};
          
          // Check local storage for potentially newer/unsynced answers
          try {
            const localData = localStorage.getItem(`exam_progress_${user.id}_${id}`);
            if (localData) {
              const { answers: localAnswers } = JSON.parse(localData);
              // Merge local answers - prefer local if they exist as they might be more recent
              currentAnswers = { ...currentAnswers, ...localAnswers };
            }
          } catch (e) {
            console.error("Error loading local answers:", e);
          }
          
          setAnswers(currentAnswers);
        }
      }

        // Fetch exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', id)
          .single();

        if (examError) throw examError;
        
        // Check availability
        const now = new Date();
        const startTime = examData.start_time ? new Date(examData.start_time) : null;
        const endTime = examData.end_time ? new Date(examData.end_time) : null;
        
        // Only block access if the user hasn't completed the exam and isn't an admin viewing someone else's result
        if (existingSub?.status !== 'completed' && targetUserId === user.id) {
          // Check if admin (we need to wait for isAdmin state, or fetch it here to be safe)
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          const userIsAdmin = profile?.role === 'admin';

          if (startTime && startTime > now && !userIsAdmin) {
            toast.error("This exam has not started yet.");
            navigate('/exams');
            return;
          }
          
          if (endTime && endTime < now && !userIsAdmin) {
            toast.error("This exam has already ended.");
            navigate('/exams');
            return;
          }
        }

        setExam(examData);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', id)
          .order('created_at', { ascending: true });

        if (questionsError) throw questionsError;
        
        let finalQuestions = questionsData || [];
        
        if (examData.randomize_questions && finalQuestions.length > 0) {
          // Simple deterministic shuffle based on user ID so it doesn't change on refresh
          let seed = 0;
          for (let i = 0; i < user.id.length; i++) {
            seed += user.id.charCodeAt(i);
          }
          
          const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
          };
          
          let m = finalQuestions.length, t, i;
          while (m) {
            i = Math.floor(seededRandom() * m--);
            t = finalQuestions[m];
            finalQuestions[m] = finalQuestions[i];
            finalQuestions[i] = t;
          }
        }
        
        setQuestions(finalQuestions);
        
        // Set timer
        if (examData.duration_minutes) {
          if (existingSub && existingSub.status === 'in-progress' && existingSub.started_at) {
            const startTime = new Date(existingSub.started_at).getTime();
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = (examData.duration_minutes * 60) - elapsedSeconds;
            setTimeLeft(Math.max(0, remaining));
          } else {
            setTimeLeft(examData.duration_minutes * 60);
          }
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast.error("Failed to load exam.");
        navigate('/exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id, user, navigate]);

  useEffect(() => {
    if (!hasStarted || timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, isSubmitted]);

  useEffect(() => {
    if (!hasStarted || isSubmitted || !currentSubmissionId) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        setIsSaving(true);
        await supabase
          .from('exam_submissions')
          .update({ answers })
          .eq('id', currentSubmissionId);
        console.log("Auto-saved answers at", new Date().toLocaleTimeString());
        setTimeout(() => setIsSaving(false), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setIsSaving(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasStarted, isSubmitted, currentSubmissionId, answers]);

  // Sync to localStorage whenever answers change
  useEffect(() => {
    if (hasStarted && !isSubmitted && user && id) {
      localStorage.setItem(`exam_progress_${user.id}_${id}`, JSON.stringify({
        answers,
        updatedAt: new Date().toISOString()
      }));
    }
  }, [answers, hasStarted, isSubmitted, user, id]);

  // Handle page leave/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStarted && !isSubmitted) {
        // Save to local storage one last time
        if (user && id) {
          localStorage.setItem(`exam_progress_${user.id}_${id}`, JSON.stringify({
            answers,
            updatedAt: new Date().toISOString()
          }));
        }
        
        // Standard confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, isSubmitted, answers, user, id]);

  // Final save to Supabase on unmount (React Router navigation)
  useEffect(() => {
    return () => {
      if (hasStarted && !isSubmitted && currentSubmissionId && Object.keys(answers).length > 0) {
        // Fire and forget, but handle errors
        const save = async () => {
          try {
            await supabase
              .from('exam_submissions')
              .update({ answers })
              .eq('id', currentSubmissionId);
          } catch (err) {
            console.error("Final unmount save failed", err);
          }
        };
        save();
      }
    };
  }, [hasStarted, isSubmitted, currentSubmissionId, answers]);

  const handleStartExam = async () => {
    if (!user || !exam) return;
    
    try {
      // Create an in-progress submission record to track start time
      const { data, error } = await supabase
        .from('exam_submissions')
        .insert([{
          exam_id: exam.id,
          user_id: user.id,
          status: 'in-progress',
          started_at: new Date().toISOString(),
          answers: {}
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSubmissionId(data.id);
      setHasStarted(true);
    } catch (error: any) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam record.");
      // Still start locally even if DB fails, but it's better if it works
      setHasStarted(true);
    }
  };

  const handleAnswerSelect = async (questionId: string, optionIndex: number) => {
    const newAnswers = {
      ...answers,
      [questionId]: optionIndex
    };
    setAnswers(newAnswers);

    // Sync answers to DB in background
    if (currentSubmissionId) {
      setIsSaving(true);
      await supabase
        .from('exam_submissions')
        .update({ answers: newAnswers })
        .eq('id', currentSubmissionId);
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const handleSubmit = async () => {
    if (!user || !exam || isSubmitted) return;
    setSubmitting(true);

    try {
      let score = 0;
      let totalPoints = 0;

      questions.forEach(q => {
        totalPoints += q.points || 1;
        if (answers[q.id] === q.correct_option_index) {
          score += q.points || 1;
        } else if (answers[q.id] !== undefined && answers[q.id] !== -1) {
          // Wrong answer (and not skipped)
          if (exam.negative_marking_enabled) {
            score -= (exam.negative_marking_penalty || 0);
          }
        }
      });
      
      // Ensure score doesn't go below 0 if that's preferred, but usually negative scores are allowed in competitive exams.
      // We will allow negative scores as it's standard for negative marking.

      const submissionData = {
        score,
        total_points: totalPoints,
        answers,
        status: 'completed',
        completed_at: new Date().toISOString()
      };

      let resultData;
      if (currentSubmissionId) {
        const { data, error } = await supabase
          .from('exam_submissions')
          .update(submissionData)
          .eq('id', currentSubmissionId)
          .select()
          .single();
        if (error) throw error;
        resultData = data;
      } else {
        const { data, error } = await supabase
          .from('exam_submissions')
          .insert([{
            ...submissionData,
            exam_id: exam.id,
            user_id: user.id
          }])
          .select()
          .single();
        if (error) throw error;
        resultData = data;
      }

      setIsSubmitted(true);
      setResult(resultData);
      
      // Clear local storage on successful submission
      if (user && id) {
        localStorage.removeItem(`exam_progress_${user.id}_${id}`);
      }
      
      toast.success("Exam submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast.error(error.message || "Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isSubmitted && result) {
    const totalPoints = result.total_points || 1;
    const percentage = totalPoints > 0 ? (result.score / totalPoints) * 100 : 0;
    const canViewAnswers = isAdmin || 
      (exam?.show_answers_after === 'immediately') || 
      (!exam?.end_time) || 
      (new Date() >= new Date(exam.end_time));
    const passingPercentage = exam?.passing_percentage ?? 50;
    const isPassed = percentage >= passingPercentage;

    return (
      <div className="max-w-3xl mx-auto mt-12 pb-12">
        {studentProfile && (
          <div className="glass-panel p-4 rounded-xl mb-6 border-l-4 border-l-indigo-500 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Viewing Result For</p>
              <h3 className="text-white font-bold">{studentProfile.full_name}</h3>
              <p className="text-xs text-slate-400">{studentProfile.email}</p>
            </div>
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-2xl text-center mb-8"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPassed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            {isPassed ? (
              <CheckCircle2 size={40} className="text-emerald-500" />
            ) : (
              <XCircle size={40} className="text-rose-500" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Exam Completed!</h2>
          <p className="text-slate-400 mb-8">You have successfully submitted your answers.</p>
          
          <div className="bg-slate-900/50 rounded-xl p-6 mb-8 border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-slate-400 uppercase tracking-wider font-bold">Your Score</div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isPassed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
            <div className="text-5xl font-bold text-white mb-2">
              {Number(result.score.toFixed(2))} <span className="text-2xl text-slate-500">/ {result.total_points}</span>
            </div>
            <div className={`text-lg font-medium ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {percentage.toFixed(1)}% <span className="text-sm text-slate-500 ml-2">(Passing: {passingPercentage}%)</span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/exams')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
          >
            Back to Exams
          </button>
        </motion.div>

        {!canViewAnswers ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <Clock size={48} className="text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Answers Hidden</h3>
            <p className="text-slate-400">
              Detailed answers will be available after the exam ends on {new Date(exam.end_time).toLocaleString()}.
            </p>
          </div>
        ) : questions.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Detailed Breakdown</h3>
            {questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correct_option_index;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={q.id} 
                  className="glass-panel p-6 rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-lg font-medium text-white leading-relaxed">
                      <span className="text-slate-400 mr-2">{index + 1}.</span>
                      {q.question_text}
                    </h4>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap ml-4 ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : userAnswer !== undefined && userAnswer !== -1 && exam.negative_marking_enabled ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                      {isCorrect ? q.points : userAnswer !== undefined && userAnswer !== -1 && exam.negative_marking_enabled ? `-${exam.negative_marking_penalty}` : 0} / {q.points} pts
                    </span>
                  </div>
                  <div className="space-y-3">
                    {q.options.map((opt: string, optIdx: number) => {
                      let bgClass = "bg-slate-900/50 border-slate-700 text-slate-300";
                      let icon = null;
                      
                      if (optIdx === q.correct_option_index) {
                        bgClass = "bg-emerald-500/20 border-emerald-500 text-emerald-100";
                        icon = <CheckCircle2 size={18} className="text-emerald-500" />;
                      } else if (optIdx === userAnswer) {
                        bgClass = "bg-rose-500/20 border-rose-500 text-rose-100";
                        icon = <XCircle size={18} className="text-rose-500" />;
                      }
                      
                      return (
                        <div key={optIdx} className={`p-4 rounded-xl border flex items-center justify-between ${bgClass}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                              optIdx === q.correct_option_index ? 'bg-emerald-500 border-emerald-500 text-white' : 
                              optIdx === userAnswer ? 'bg-rose-500 border-rose-500 text-white' : 
                              'border-slate-600 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            {opt}
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4">
                    {isCorrect ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold">You got this right!</span>
                      </div>
                    ) : userAnswer === undefined ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-amber-400 mb-1">Not Answered</p>
                          <p className="text-amber-200 text-sm">
                            The correct answer is <span className="font-bold text-white">{String.fromCharCode(65 + q.correct_option_index)}: {q.options[q.correct_option_index]}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                        <XCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-rose-400 mb-1">
                            Incorrect {exam.negative_marking_enabled ? `(-${exam.negative_marking_penalty} points)` : ''}
                          </p>
                          <p className="text-rose-200 text-sm">
                            The correct answer is <span className="font-bold text-white">{String.fromCharCode(65 + q.correct_option_index)}: {q.options[q.correct_option_index]}</span>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {q.explanation && (
                      <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Explanation</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!exam || (questions.length === 0 && !isSubmitted)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Exam not found or has no questions</h2>
        <button onClick={() => navigate('/exams')} className="mt-4 text-indigo-400 hover:text-indigo-300">Go back</button>
      </div>
    );
  }

  if (!hasStarted) {
    const now = new Date();
    const isBeforeStart = exam.start_time && now < new Date(exam.start_time);
    const isAfterEnd = exam.end_time && now > new Date(exam.end_time);
    const canStart = !isBeforeStart && !isAfterEnd;

    return (
      <div className="max-w-3xl mx-auto mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl"
        >
          <h1 className="text-3xl font-bold text-white mb-4">{exam.title}</h1>
          <p className="text-slate-400 mb-6 text-lg">{exam.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-indigo-400" />
              {exam.duration_minutes} Minutes
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              {exam.total_points} Total Points
            </div>
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              {questions.length} Questions
            </div>
          </div>

          {(exam.start_time || exam.end_time) && (
            <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={16} />
                Exam Schedule
              </h3>
              <div className="space-y-2 text-slate-300">
                {exam.start_time && (
                  <p><span className="text-slate-500">Starts:</span> {new Date(exam.start_time).toLocaleString()}</p>
                )}
                {exam.end_time && (
                  <p><span className="text-slate-500">Ends:</span> {new Date(exam.end_time).toLocaleString()}</p>
                )}
              </div>
              {isBeforeStart && (
                <p className="mt-4 text-amber-400 font-medium">This exam has not started yet.</p>
              )}
              {isAfterEnd && (
                <p className="mt-4 text-rose-400 font-medium">This exam has already ended.</p>
              )}
            </div>
          )}

          {exam.instructions && (
            <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Instructions
              </h3>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{exam.instructions}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button 
              onClick={() => navigate('/exams')}
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleStartExam}
              disabled={!canStart}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              Start Exam
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Sticky Header with Timer and Submit */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 -mx-4 px-4 py-4 mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{exam.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-400 font-medium">
                {questions.length} Questions • {exam.duration_minutes} Mins
              </span>
              {isSaving && (
                <span className="text-[10px] text-emerald-400 font-medium animate-pulse">Draft saved...</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono text-sm sm:text-lg font-bold ${timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                <Clock size={16} className="sm:w-5 sm:h-5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 size={18} className="hidden sm:inline" />
              {submitting ? '...' : 'Submit'}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {questions.map((q, idx) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="glass-panel p-6 sm:p-8 rounded-2xl"
            id={`question-${idx}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                  {idx + 1}
                </span>
                <h2 className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                  {q.question_text}
                </h2>
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap ml-4">
                {q.points} pts
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 ml-0 sm:ml-12">
              {q.options.map((option: string, optIdx: number) => (
                <button
                  key={optIdx}
                  onClick={() => handleAnswerSelect(q.id, optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    answers[q.id] === optIdx
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    answers[q.id] === optIdx ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="text-sm sm:text-base">{option}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Submit Button */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={submitting}
          className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95"
        >
          <CheckCircle2 size={24} />
          {submitting ? 'Submitting Exam...' : 'Finish & Submit Exam'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <CheckCircle2 size={24} />
              <h3 className="text-xl font-bold text-white">Submit Exam?</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              {questions.length - Object.keys(answers).length > 0 ? (
                <span className="text-amber-400 font-medium block mb-2">
                  Warning: You have {questions.length - Object.keys(answers).length} unanswered questions.
                </span>
              ) : null}
              Are you sure you want to submit your exam? You won't be able to change your answers after submission.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
