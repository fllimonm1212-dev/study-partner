import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Trophy, FileText, Play, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function TakeExam() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
    if (!user || !id) return;

    const fetchExamData = async () => {
      setLoading(true);
      try {
        // Check if already submitted or in progress
        const { data: existingSub } = await supabase
          .from('exam_submissions')
          .select('*')
          .eq('exam_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

      if (existingSub) {
        if (existingSub.status === 'completed') {
          setIsSubmitted(true);
          setResult(existingSub);
          if (existingSub.answers) {
            setAnswers(existingSub.answers);
          }
        } else if (existingSub.status === 'in-progress') {
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
        setExam(examData);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', id)
          .order('created_at', { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
        
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
        }
      });

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
    const percentage = (result.score / result.total_points) * 100;
    const canViewAnswers = !exam.end_time || new Date() >= new Date(exam.end_time);

    return (
      <div className="max-w-3xl mx-auto mt-12 pb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-2xl text-center mb-8"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Exam Completed!</h2>
          <p className="text-slate-400 mb-8">You have successfully submitted your answers.</p>
          
          <div className="bg-slate-900/50 rounded-xl p-6 mb-8 border border-slate-800">
            <div className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-2">Your Score</div>
            <div className="text-5xl font-bold text-white mb-2">
              {result.score} <span className="text-2xl text-slate-500">/ {result.total_points}</span>
            </div>
            <div className={`text-lg font-medium ${percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {percentage.toFixed(1)}%
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
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap ml-4 ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isCorrect ? q.points : 0} / {q.points} pts
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
                          <p className="text-sm font-bold text-rose-400 mb-1">Incorrect</p>
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

  if (!exam || questions.length === 0) {
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
    <div className="max-w-5xl mx-auto flex gap-8">
      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Questions</h3>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden text-slate-400 hover:text-white">
              <XCircle size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      if (window.innerWidth < 1024) setShowSidebar(false);
                    }}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      isCurrent 
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' 
                        : isAnswered 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                <span>Answered ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded bg-slate-900 border border-slate-800" />
                <span>Unanswered ({questions.length - Object.keys(answers).length})</span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-4"
            >
              <CheckCircle2 size={18} />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 glass-panel p-4 rounded-2xl sticky top-4 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <FileText size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white truncate max-w-[200px] sm:max-w-md">{exam.title}</h1>
              <p className="text-sm text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft !== null && (
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono text-sm sm:text-lg font-bold ${timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-slate-800 text-slate-200'}`}>
                  <Clock size={16} className="sm:w-5 sm:h-5" />
                  {formatTime(timeLeft)}
                </div>
                {isSaving && (
                  <span className="text-[10px] text-emerald-400 font-medium animate-pulse hidden sm:inline">Draft saved...</span>
                )}
              </div>
            )}
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              className="lg:hidden p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50"
              title="Submit Exam"
            >
              <CheckCircle2 size={20} />
            </button>
          </div>
        </div>

        {/* Question Card */}
        <motion.div 
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8 rounded-2xl mb-6"
        >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-medium text-white leading-relaxed">
            {currentQuestion.question_text}
          </h2>
          <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap ml-4">
            {currentQuestion.points} pts
          </span>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option: string, index: number) => (
            <motion.button
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.98 }}
              key={index}
              onClick={() => handleAnswerSelect(currentQuestion.id, index)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                answers[currentQuestion.id] === index
                  ? 'bg-indigo-500/20 border-indigo-500 text-white'
                  : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ 
                    scale: answers[currentQuestion.id] === index ? [1, 1.2, 1] : 1,
                    backgroundColor: answers[currentQuestion.id] === index ? '#6366f1' : 'transparent',
                    borderColor: answers[currentQuestion.id] === index ? '#6366f1' : '#475569',
                    color: answers[currentQuestion.id] === index ? '#ffffff' : '#94a3b8'
                  }}
                  transition={{ duration: 0.2 }}
                  className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold"
                >
                  {String.fromCharCode(65 + index)}
                </motion.div>
                {option}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
            <CheckCircle2 size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
          >
            Next
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-8 flex gap-1">
        {questions.map((q, idx) => (
          <div 
            key={q.id} 
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`h-2 flex-1 rounded-full cursor-pointer transition-colors ${
              idx === currentQuestionIndex ? 'bg-indigo-500' : 
              answers[q.id] !== undefined ? 'bg-emerald-500/50' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
    </div>
  );
}
