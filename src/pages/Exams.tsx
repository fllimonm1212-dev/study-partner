import { useState, useEffect } from 'react';
import { FileText, Clock, Trophy, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Exams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'history' | 'leaderboard'>('available');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchExams = async () => {
      setLoading(true);
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false });

        if (examsError && examsError.code !== '42P01') throw examsError;

        const { data: subsData, error: subsError } = await supabase
          .from('exam_submissions')
          .select('*')
          .eq('user_id', user.id);

        if (subsError && subsError.code !== '42P01') throw subsError;

        setExams(examsData || []);
        setSubmissions(subsData || []);
        
        if (examsData && examsData.length > 0) {
          setSelectedExamId(examsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'leaderboard' || !selectedExamId) return;

    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const { data, error } = await supabase
          .from('exam_submissions')
          .select(`
            id,
            score,
            total_points,
            status,
            completed_at,
            created_at,
            user_id,
            profiles (
              id,
              full_name,
              email,
              avatar_url,
              class_id,
              section
            )
          `)
          .eq('exam_id', selectedExamId)
          .eq('status', 'completed')
          .order('score', { ascending: false })
          .order('completed_at', { ascending: true }); // Tie-breaker: whoever submitted first

        if (error && error.code !== '42P01') throw error;
        setLeaderboardData(data || []);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, selectedExamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Exams & Quizzes</h1>
          <p className="text-slate-400 text-sm mt-1">Test your knowledge and track your performance.</p>
        </div>
        
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-xl w-fit">
          <button 
            onClick={() => setActiveTab('available')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'available' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Available Exams
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'history' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Submission History
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'leaderboard' 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {activeTab === 'available' ? (
        exams.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
            <FileText className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white">No exams available</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">Check back later! The admin hasn't posted any exams yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam, index) => {
              const submission = submissions.find(s => s.exam_id === exam.id);
              const isCompleted = submission?.status === 'completed';
              const isInProgress = submission?.status === 'in-progress';

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={exam.id} 
                  className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 
                        onClick={() => navigate(`/exams/${exam.id}`)}
                        className="text-xl font-bold text-white mb-1 hover:text-indigo-400 cursor-pointer transition-colors"
                      >
                        {exam.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{exam.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-400" />
                      {exam.duration_minutes} Minutes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={14} className="text-amber-400" />
                      {exam.total_points || 0} Points
                    </div>
                    {(exam.start_time || exam.end_time) && (
                      <div className="w-full mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-1">
                        {exam.start_time && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">Starts:</span> {new Date(exam.start_time).toLocaleString()}
                          </div>
                        )}
                        {exam.end_time && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">Ends:</span> {new Date(exam.end_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    {isCompleted ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-300">Your Score</span>
                          <span className="text-emerald-400">
                            {submission.score} / {submission.total_points} ({(submission.score / submission.total_points * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(submission.score / submission.total_points) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold mt-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 size={18} />
                          Exam Completed
                        </div>
                        <button 
                          onClick={() => navigate(`/exams/${exam.id}`)}
                          className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText size={16} />
                          View Results
                        </button>
                      </div>
                    ) : isInProgress ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-bold py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <Clock size={18} />
                          In Progress
                        </div>
                        <button 
                          onClick={() => navigate(`/exams/${exam.id}`)}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                        >
                          <Play size={18} />
                          Resume Exam
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => navigate(`/exams/${exam.id}`)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                      >
                        <Play size={18} />
                        Start Exam
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : activeTab === 'history' ? (
        <div className="glass-panel p-6 rounded-2xl">
          {submissions.filter(s => s.status === 'completed').length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-slate-600 mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-white">No completed exams yet</h3>
              <p className="text-slate-400 mt-2">Complete an exam to see your history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="pb-4 font-medium px-4">Exam Title</th>
                    <th className="pb-4 font-medium px-4">Date Submitted</th>
                    <th className="pb-4 font-medium px-4">Score</th>
                    <th className="pb-4 font-medium px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {submissions
                    .filter(s => s.status === 'completed')
                    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
                    .map((submission) => {
                      const exam = exams.find(e => e.id === submission.exam_id);
                      const percentage = ((submission.score / submission.total_points) * 100).toFixed(0);
                      const date = new Date(submission.completed_at || submission.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={submission.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-4 font-medium text-white">
                            {exam?.title || 'Unknown Exam'}
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            {date}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold ${Number(percentage) >= 70 ? 'text-emerald-400' : Number(percentage) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {percentage}%
                              </span>
                              <span className="text-slate-500 text-xs">
                                ({submission.score}/{submission.total_points})
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => navigate(`/exams/${submission.exam_id}`)}
                              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Exam Rankings</h2>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/50 text-slate-200 text-sm font-bold rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block px-4 py-2 outline-none transition-all hover:bg-slate-800 cursor-pointer shadow-xl min-w-[200px]"
            >
              {exams.length === 0 && <option value="">No exams available</option>}
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-600 mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-white">No completed submissions yet</h3>
                <p className="text-slate-400 mt-2">Be the first to complete this exam!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                      <th className="py-4 font-medium px-6 w-20 text-center">Rank</th>
                      <th className="py-4 font-medium px-4">Student</th>
                      <th className="py-4 font-medium px-4">Class</th>
                      <th className="py-4 font-medium px-4">Score</th>
                      <th className="py-4 font-medium px-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {leaderboardData
                      .map((submission, index) => {
                      const profile = submission.profiles || {};
                      const name = profile.full_name || profile.email?.split('@')[0] || 'Unknown Student';
                      const initials = name.substring(0, 2).toUpperCase();
                      const isMe = submission.user_id === user?.id;
                      const percentage = ((submission.score / submission.total_points) * 100).toFixed(0);
                      const date = new Date(submission.completed_at || submission.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={submission.id} 
                          className={`border-b border-slate-800/50 transition-colors ${isMe ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/20'}`}
                        >
                          <td className="py-4 px-6 text-center">
                            {index === 0 ? (
                              <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mx-auto font-bold border border-yellow-400/30">1</div>
                            ) : index === 1 ? (
                              <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center mx-auto font-bold border border-slate-400/30">2</div>
                            ) : index === 2 ? (
                              <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center mx-auto font-bold border border-amber-600/30">3</div>
                            ) : (
                              <span className="font-mono text-slate-500 font-medium">{index + 1}</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="cursor-pointer transition-transform hover:scale-110"
                                onClick={() => navigate(`/friends/${submission.user_id}/profile`)}
                              >
                                {profile.avatar_url ? (
                                  <img src={profile.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <p 
                                className={`font-medium text-sm cursor-pointer hover:text-indigo-400 transition-colors ${isMe ? "text-indigo-400" : "text-slate-200"}`}
                                onClick={() => navigate(`/friends/${submission.user_id}/profile`)}
                              >
                                {name} {isMe && "(You)"}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            {profile.class_id ? `${profile.class_id}-${profile.section || 'A'}` : 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${Number(percentage) >= 70 ? 'text-emerald-400' : Number(percentage) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {percentage}%
                              </span>
                              <span className="text-slate-500 text-xs">
                                ({submission.score}/{submission.total_points})
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right text-slate-400 text-xs">
                            {date}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
