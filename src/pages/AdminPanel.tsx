import React, { useState, useEffect, useRef } from 'react';
import { Database, FolderTree, Server, ShieldCheck, AlertTriangle, Users, Target, Activity, Plus, Trash2, FileText, Upload, Loader2, MessageSquareWarning, CheckCircle2, Link } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Sidebar';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'challenges' | 'groups' | 'exams' | 'feedback'>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [challengesList, setChallengesList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'complain' | 'feature_request'>('all');
  const [stats, setStats] = useState({ totalUsers: 0, totalHours: 0, totalSessions: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUpDB, setIsSettingUpDB] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Challenge form
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '', description: '', target_hours: 10, reward_stars: 50, start_date: '', end_date: ''
  });

  // Exam form
  const [showExamForm, setShowExamForm] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [isGeneratingFromTopic, setIsGeneratingFromTopic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newExam, setNewExam] = useState({
    title: '', description: '', instructions: '', duration_minutes: 30, start_time: '', end_time: '',
    passing_percentage: 50, is_published: true, randomize_questions: false
  });
  const [newQuestions, setNewQuestions] = useState<any[]>([
    { question_text: '', options: ['', '', '', ''], correct_option_index: 0, points: 1, explanation: '' }
  ]);

  const handleSetupDatabase = async () => {
    setIsSettingUpDB(true);
    setErrorMsg('');
    try {
      console.log('AdminPanel: Starting database setup...');
      
      // Try to update current user's role to admin in the database
      if (user?.id) {
        console.log('AdminPanel: Attempting to set admin role for:', user.email);
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        if (roleError) {
          console.warn('AdminPanel: Could not set admin role via client:', roleError.message);
        } else {
          console.log('AdminPanel: Admin role set successfully.');
        }
      }

      // Create buckets
      const buckets = ['avatars', 'feedback_images'];
      for (const bucket of buckets) {
        console.log(`AdminPanel: Checking bucket ${bucket}...`);
        const { data, error } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
        if (error && error.message !== 'Bucket already exists') {
          console.warn(`Could not create bucket ${bucket}:`, error.message);
        } else {
          console.log(`Bucket ${bucket} checked/created.`);
        }
      }

      // We can't run DDL (CREATE POLICY) via the client easily, 
      // but we can inform the user or try to check if it works.
      alert('Storage buckets checked. If images still do not show, please ensure policies are set in the Supabase Dashboard.');
    } catch (err: any) {
      console.error('Setup error:', err);
      setErrorMsg('Failed to setup database: ' + err.message);
    } finally {
      setIsSettingUpDB(false);
    }
  };

  useEffect(() => {
    console.log('AdminPanel: Current User:', user?.email);
    if (user?.email !== 'fllimonm1212@gmail.com') {
      console.warn('AdminPanel: Access denied for user:', user?.email);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        if (activeTab === 'overview') {
          const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const { data: sessions } = await supabase.from('study_sessions').select('duration_minutes');
          const totalMins = sessions?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0;
          setStats({ 
            totalUsers: userCount || 0, 
            totalHours: Math.floor(totalMins / 60),
            totalSessions: sessions?.length || 0
          });
        } else if (activeTab === 'users') {
          const { data, error } = await supabase.from('profiles').select('*').order('total_stars', { ascending: false });
          if (error) throw error;
          setUsersList(data || []);
        } else if (activeTab === 'challenges') {
          const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Challenges table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setChallengesList(data || []);
          }
        } else if (activeTab === 'groups') {
          const { data, error } = await supabase.from('groups').select(`
            *,
            profiles:created_by (full_name)
          `).order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Groups table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setGroupsList(data || []);
          }
        } else if (activeTab === 'exams') {
          const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Exams table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setExamsList(data || []);
          }

          // Also fetch submissions
          console.log('AdminPanel: Fetching exam submissions...');
          const { data: subData, error: subError } = await supabase
            .from('exam_submissions')
            .select(`
              *,
              profiles:user_id (full_name, email),
              exams:exam_id (title, total_points)
            `)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });
          
          if (subError) {
            console.error('AdminPanel: Error fetching submissions:', subError);
            if (subError.code === '42P01') {
              setErrorMsg('Exam submissions table does not exist in the database yet.');
            }
          } else {
            console.log('AdminPanel: Fetched submissions count:', subData?.length);
            setSubmissionsList(subData || []);
          }
        } else if (activeTab === 'feedback') {
          const { data, error } = await supabase.from('feedback').select('*, profiles(full_name, email, avatar_url)').order('created_at', { ascending: false });
          if (error) {
            if (error.code === '42P01') {
              setErrorMsg('Feedback table does not exist in the database yet.');
            } else {
              throw error;
            }
          } else {
            setFeedbackList(data || []);
          }
        }
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
        setErrorMsg(error.message || 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newChallenge.title || !newChallenge.start_date || !newChallenge.end_date) {
        throw new Error("Please fill in all required fields.");
      }
      if (new Date(newChallenge.start_date) > new Date(newChallenge.end_date)) {
        throw new Error("Start date cannot be after end date.");
      }

      const { error } = await supabase.from('challenges').insert([{
        title: newChallenge.title,
        description: newChallenge.description,
        target_hours: newChallenge.target_hours,
        reward_stars: newChallenge.reward_stars,
        start_date: newChallenge.start_date,
        end_date: newChallenge.end_date
      }]);
      
      if (error) throw error;
      
      // Refresh
      const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
      setChallengesList(data || []);
      setShowChallengeForm(false);
      setNewChallenge({ title: '', description: '', target_hours: 10, reward_stars: 50, start_date: '', end_date: '' });
      setErrorMsg(''); // Clear any previous errors
    } catch (error: any) {
      console.error("Error creating challenge:", error);
      setErrorMsg(error.message || 'Failed to create challenge.');
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) throw error;
      setChallengesList(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error("Error deleting challenge:", error);
      setErrorMsg(error.message || 'Failed to delete challenge.');
    }
  };

  const handleGroupStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('groups').update({ status }).eq('id', id);
      if (error) throw error;
      setGroupsList(prev => prev.map(g => g.id === id ? { ...g, status } : g));
    } catch (error: any) {
      console.error("Error updating group status:", error);
      setErrorMsg(error.message || 'Failed to update group status.');
    }
  };

  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const toLocalISOString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newExam.title || !newExam.duration_minutes) {
        throw new Error("Please fill in all required fields.");
      }

      const totalPoints = newQuestions.reduce((acc, q) => acc + (q.points || 0), 0);
      const examPayload = {
        title: newExam.title,
        description: newExam.description,
        instructions: newExam.instructions,
        duration_minutes: newExam.duration_minutes,
        total_points: totalPoints,
        start_time: newExam.start_time ? new Date(newExam.start_time).toISOString() : null,
        end_time: newExam.end_time ? new Date(newExam.end_time).toISOString() : null,
        passing_percentage: newExam.passing_percentage,
        is_published: newExam.is_published,
        randomize_questions: newExam.randomize_questions
      };

      let examId = editingExamId;

      if (editingExamId) {
        // Update existing exam
        const { error: updateError } = await supabase
          .from('exams')
          .update(examPayload)
          .eq('id', editingExamId);
        
        if (updateError) throw updateError;

        // Delete old questions and insert new ones (simpler than syncing)
        const { error: deleteError } = await supabase
          .from('exam_questions')
          .delete()
          .eq('exam_id', editingExamId);
        
        if (deleteError) throw deleteError;
      } else {
        // Insert new exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .insert([examPayload])
          .select()
          .single();

        if (examError) throw examError;
        examId = examData.id;
      }

      // 2. Insert Questions
      const questionsToInsert = newQuestions.map(q => ({
        exam_id: examId,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        points: q.points,
        explanation: q.explanation
      }));

      const { error: qError } = await supabase.from('exam_questions').insert(questionsToInsert);
      if (qError) throw qError;

      // Refresh
      const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      setExamsList(data || []);
      setShowExamForm(false);
      setEditingExamId(null);
      setNewExam({ 
        title: '', 
        description: '', 
        instructions: '', 
        duration_minutes: 30,
        start_time: '',
        end_time: '',
        passing_percentage: 50,
        is_published: true,
        randomize_questions: false
      });
      setNewQuestions([{ question_text: '', options: ['', '', '', ''], correct_option_index: 0, points: 1, explanation: '' }]);
      setErrorMsg('');
      toast.success(editingExamId ? "Exam updated successfully!" : "Exam created successfully!");
    } catch (error: any) {
      console.error("Error saving exam:", error);
      setErrorMsg(error.message || 'Failed to save exam.');
    }
  };

  const handleEditExam = async (exam: any) => {
    setEditingExamId(exam.id);
    setNewExam({
      title: exam.title || '',
      description: exam.description || '',
      instructions: exam.instructions || '',
      duration_minutes: exam.duration_minutes || 30,
      start_time: toLocalISOString(exam.start_time),
      end_time: toLocalISOString(exam.end_time),
      passing_percentage: exam.passing_percentage ?? 50,
      is_published: exam.is_published ?? true,
      randomize_questions: exam.randomize_questions ?? false
    });

    // Fetch questions for this exam
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data && data.length > 0) {
        setNewQuestions(data.map(q => ({
          question_text: q.question_text,
          options: q.options,
          correct_option_index: q.correct_option_index,
          points: q.points,
          explanation: q.explanation || ''
        })));
      } else {
        setNewQuestions([{ question_text: '', options: ['', '', '', ''], correct_option_index: 0, points: 1, explanation: '' }]);
      }
      setShowExamForm(true);
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert("Failed to load questions: " + err.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      setExamsList(prev => prev.filter(e => e.id !== id));
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      setErrorMsg(error.message || 'Failed to delete exam.');
    }
  };

  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setErrorMsg("Please enter a topic to generate questions.");
      return;
    }

    setIsGeneratingFromTopic(true);
    setErrorMsg('');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an expert educational content creator. Generate 10 multiple-choice questions about the topic: "${topicInput}". 
        The questions MUST be generated in Bengali (Bangla) language and script. 
        Ensure exactly 4 options per question. 
        Provide the correct answer index (0-3). 
        Set points to 1 for each question. 
        Provide a brief explanation for the correct answer in Bengali. 
        Return the extracted data in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING, description: "The question text in Bengali" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 options for the multiple choice question in Bengali"
                },
                correct_option_index: { type: Type.INTEGER, description: "The index (0-3) of the correct option" },
                points: { type: Type.INTEGER, description: "Points for this question, default 1" },
                explanation: { type: Type.STRING, description: "Brief explanation of the correct answer in Bengali" }
              },
              required: ["question_text", "options", "correct_option_index", "points"]
            }
          }
        }
      });

      if (response.text) {
        const generatedQuestions = JSON.parse(response.text);
        if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
          setNewQuestions(generatedQuestions);
          setTopicInput(''); // Clear input after success
        } else {
          setErrorMsg("Could not generate questions for this topic.");
        }
      }
    } catch (error: any) {
      console.error("Error generating questions from topic:", error);
      setErrorMsg(error.message || "Failed to generate questions from topic.");
    } finally {
      setIsGeneratingFromTopic(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGeneratingQuestions(true);
    setErrorMsg('');

    try {
      let extractedText = "";
      let base64Data = "";
      let mimeType = file.type || 'application/pdf';

      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        const reader = new FileReader();
        const readerPromise = new Promise<string>((resolve, reject) => {
          reader.onload = (event) => resolve((event.target?.result as string).split(',')[1]);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(file);
        base64Data = await readerPromise;
      }

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const parts: any[] = [];
      if (extractedText) {
        parts.push({ text: extractedText });
      } else {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
      parts.push({
        text: "You are a helpful assistant that extracts multiple-choice questions from documents. The document contains Bengali (Bangla) text. You MUST extract the questions and options in their original Bengali language and script. DO NOT translate them to English. Maintain the exact serial order of the questions and the exact order of the options as they appear in the document. Extract the correct answer index (0-3). Also extract the points per question if available, otherwise default to 1. Ensure exactly 4 options per question. Provide a brief explanation for the correct answer if possible. Return the extracted data in JSON format."
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING, description: "The question text" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 options for the multiple choice question"
                },
                correct_option_index: { type: Type.INTEGER, description: "The index (0-3) of the correct option" },
                points: { type: Type.INTEGER, description: "Points for this question, default 1" },
                explanation: { type: Type.STRING, description: "Brief explanation of the correct answer" }
              },
              required: ["question_text", "options", "correct_option_index", "points"]
            }
          }
        }
      });

      if (response.text) {
        const generatedQuestions = JSON.parse(response.text);
        if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
          setNewQuestions(generatedQuestions);
        } else {
          setErrorMsg("Could not extract questions from the file.");
        }
      }
    } catch (error: any) {
      console.error("Error generating questions:", error);
      setErrorMsg(error.message || "Failed to generate questions from file.");
    } finally {
      setIsGeneratingQuestions(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (user?.email !== 'fllimonm1212@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-rose-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md">
          You do not have permission to view this page. This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage users, challenges, and platform settings.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <ShieldCheck size={16} />
          Admin Access
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Manage Users', icon: Users },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'groups', label: 'Groups', icon: Users },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'feedback', label: 'Feedback', icon: MessageSquareWarning }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Study Hours</p>
                      <p className="text-3xl font-bold text-white">{stats.totalHours}h</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Sessions</p>
                      <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.3 }}
                  className="glass-panel p-6 rounded-2xl border border-indigo-500/20"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Server size={20} className="text-indigo-400" />
                        Database & Storage Setup
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Initialize storage buckets for avatars and feedback images. This will ensure that uploaded pictures are visible.
                      </p>
                    </div>
                    <button
                      onClick={handleSetupDatabase}
                      disabled={isSettingUpDB}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                    >
                      {isSettingUpDB ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Database size={18} />
                          Setup Buckets
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
              </>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Class/Section</th>
                        <th className="px-6 py-4 font-medium">Total Stars</th>
                        <th className="px-6 py-4 font-medium">Current Streak</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                  {(u.full_name || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-slate-200">{u.full_name || 'Unknown User'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {u.class_id ? `Class ${u.class_id} - ${u.section || 'A'}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-medium">{u.total_stars || 0} ⭐</td>
                          <td className="px-6 py-4 text-emerald-400 font-medium">{u.current_streak || 0} 🔥</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(u.created_at || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* CHALLENGES TAB */}
            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowChallengeForm(!showChallengeForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus size={16} />
                    {showChallengeForm ? 'Cancel' : 'Create New Challenge'}
                  </button>
                </div>

                {showChallengeForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Create Challenge</h3>
                    <form onSubmit={handleCreateChallenge} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                          <input required type="text" value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g., Weekend Warrior" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Target Hours</label>
                          <input required type="number" min="1" value={newChallenge.target_hours} onChange={e => setNewChallenge({...newChallenge, target_hours: parseInt(e.target.value) || 0})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Reward Stars</label>
                          <input required type="number" min="1" value={newChallenge.reward_stars} onChange={e => setNewChallenge({...newChallenge, reward_stars: parseInt(e.target.value) || 0})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                          <input required type="date" value={newChallenge.start_date} onChange={e => setNewChallenge({...newChallenge, start_date: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                          <input required type="date" value={newChallenge.end_date} onChange={e => setNewChallenge({...newChallenge, end_date: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                          <textarea required value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" rows={3} placeholder="Describe the challenge..."></textarea>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
                          Save Challenge
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challengesList.map(c => (
                    <div key={c.id} className="glass-panel p-5 rounded-2xl flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{c.title}</h4>
                        <button onClick={() => handleDeleteChallenge(c.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 flex-1">{c.description}</p>
                      <div className="flex items-center justify-between text-xs font-medium border-t border-slate-800 pt-4">
                        <span className="text-indigo-400">Target: {c.target_hours}h</span>
                        <span className="text-amber-400">Reward: {c.reward_stars} ⭐</span>
                        <span className="text-slate-500">Ends: {new Date(c.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {challengesList.length === 0 && !showChallengeForm && (
                    <div className="col-span-2 text-center py-12 text-slate-500 glass-panel rounded-2xl">
                      No challenges found. Create one to engage your users!
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* GROUPS TAB */}
            {activeTab === 'groups' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Group Name</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Created By</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {groupsList.map(g => (
                        <tr key={g.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-200">{g.name}</td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={g.description}>{g.description}</td>
                          <td className="px-6 py-4 text-slate-400">{(g.profiles as any)?.full_name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium",
                              g.status === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
                              g.status === 'rejected' ? "bg-rose-500/10 text-rose-400" :
                              "bg-amber-500/10 text-amber-400"
                            )}>
                              {g.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => navigate(`/groups/${g.id}`)}
                              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                            >
                              Open
                            </button>
                            {g.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleGroupStatus(g.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleGroupStatus(g.id, 'rejected')}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {groupsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No groups found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* EXAMS TAB */}
            {activeTab === 'exams' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-white">Manage Exams</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Current Time: {new Date().toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setShowExamForm(!showExamForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <Plus size={18} />
                    {showExamForm ? 'Cancel' : 'Create Exam'}
                  </button>
                </div>

                {showExamForm && (
                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
                    <h3 className="text-lg font-medium text-white mb-4">Create New Exam</h3>
                    <form onSubmit={handleCreateExam} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
                          <input 
                            type="text" 
                            required
                            value={newExam.title}
                            onChange={e => setNewExam({...newExam, title: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            placeholder="e.g., Midterm Exam"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Duration (Minutes) *</label>
                          <input 
                            type="number" 
                            required
                            min="1"
                            value={newExam.duration_minutes}
                            onChange={e => setNewExam({...newExam, duration_minutes: parseInt(e.target.value)})}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Start Time (Optional)</label>
                          <input 
                            type="datetime-local" 
                            value={newExam.start_time}
                            onChange={e => setNewExam({...newExam, start_time: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">End Time (Optional)</label>
                          <input 
                            type="datetime-local" 
                            value={newExam.end_time}
                            onChange={e => setNewExam({...newExam, end_time: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <textarea 
                          value={newExam.description}
                          onChange={e => setNewExam({...newExam, description: e.target.value})}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 min-h-[80px]"
                          placeholder="Brief description of the exam..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Instructions (Optional)</label>
                        <textarea 
                          value={newExam.instructions}
                          onChange={e => setNewExam({...newExam, instructions: e.target.value})}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 min-h-[80px]"
                          placeholder="Instructions for the students before starting..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Passing Percentage (%)</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={newExam.passing_percentage}
                            onChange={e => setNewExam({...newExam, passing_percentage: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input 
                            type="checkbox" 
                            id="is_published"
                            checked={newExam.is_published}
                            onChange={e => setNewExam({...newExam, is_published: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500"
                          />
                          <label htmlFor="is_published" className="text-sm font-medium text-slate-300 cursor-pointer">
                            Public (Visible in list)
                          </label>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input 
                            type="checkbox" 
                            id="randomize_questions"
                            checked={newExam.randomize_questions}
                            onChange={e => setNewExam({...newExam, randomize_questions: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500"
                          />
                          <label htmlFor="randomize_questions" className="text-sm font-medium text-slate-300 cursor-pointer">
                            Randomize Questions
                          </label>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex flex-col gap-4 mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                          <h4 className="text-md font-medium text-white">Auto-Generate Questions</h4>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 flex gap-2">
                              <input 
                                type="text"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="Enter a topic (e.g., Physics, History) to generate in Bangla..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                              />
                              <button 
                                type="button"
                                onClick={handleGenerateFromTopic}
                                disabled={isGeneratingFromTopic || !topicInput.trim()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                              >
                                {isGeneratingFromTopic ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Generate from Topic
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 text-sm">OR</span>
                              <input 
                                type="file" 
                                accept=".pdf,.txt,.docx" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGeneratingQuestions}
                                className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                              >
                                {isGeneratingQuestions ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                Upload Document
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-white">Questions List</h4>
                          <button 
                            type="button"
                            onClick={() => setNewQuestions([...newQuestions, { question_text: '', options: ['', '', '', ''], correct_option_index: 0, points: 1, explanation: '' }])}
                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Manual Question
                          </button>
                        </div>
                        
                        <div className="space-y-6">
                          {newQuestions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 relative">
                              {newQuestions.length > 1 && (
                                <button 
                                  type="button"
                                  onClick={() => setNewQuestions(newQuestions.filter((_, i) => i !== qIndex))}
                                  className="absolute top-4 right-4 text-rose-400 hover:text-rose-300"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              
                              <div className="mb-4 pr-8">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Question {qIndex + 1}</label>
                                <input 
                                  type="text" 
                                  required
                                  value={q.question_text}
                                  onChange={e => {
                                    const updated = [...newQuestions];
                                    updated[qIndex].question_text = e.target.value;
                                    setNewQuestions(updated);
                                  }}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {q.options.map((opt: string, oIndex: number) => (
                                  <div key={oIndex} className="flex items-center gap-2">
                                    <input 
                                      type="radio" 
                                      name={`correct-${qIndex}`}
                                      checked={q.correct_option_index === oIndex}
                                      onChange={() => {
                                        const updated = [...newQuestions];
                                        updated[qIndex].correct_option_index = oIndex;
                                        setNewQuestions(updated);
                                      }}
                                      className="text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <input 
                                      type="text" 
                                      required
                                      placeholder={`Option ${oIndex + 1}`}
                                      value={opt}
                                      onChange={e => {
                                        const updated = [...newQuestions];
                                        updated[qIndex].options[oIndex] = e.target.value;
                                        setNewQuestions(updated);
                                      }}
                                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Points</label>
                                  <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={q.points}
                                    onChange={e => {
                                      const updated = [...newQuestions];
                                      updated[qIndex].points = parseInt(e.target.value);
                                      setNewQuestions(updated);
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Explanation (Optional)</label>
                                  <input 
                                    type="text" 
                                    value={q.explanation || ''}
                                    onChange={e => {
                                      const updated = [...newQuestions];
                                      updated[qIndex].explanation = e.target.value;
                                      setNewQuestions(updated);
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="Why is this answer correct?"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                        >
                          Save Exam
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="glass-panel rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-sm">
                        <th className="px-6 py-4 font-medium">Title</th>
                        <th className="px-6 py-4 font-medium">Schedule</th>
                        <th className="px-6 py-4 font-medium">Duration</th>
                        <th className="px-6 py-4 font-medium">Total Points</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {examsList.map(exam => (
                        <tr key={exam.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{exam.title}</td>
                          <td className="px-6 py-4 text-slate-300">
                            <div className="text-xs">
                              {exam.start_time ? new Date(exam.start_time).toLocaleString() : 'No start'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              to {exam.end_time ? new Date(exam.end_time).toLocaleString() : 'No end'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{exam.duration_minutes} mins</td>
                          <td className="px-6 py-4 text-slate-300">{exam.total_points}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  const url = `${window.location.origin}/exams/${exam.id}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success('Exam link copied to clipboard!');
                                }}
                                className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Copy Exam Link"
                              >
                                <Link size={18} />
                              </button>
                              <button 
                                onClick={() => handleEditExam(exam)}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Edit Exam"
                              >
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteExam(exam.id)}
                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Exam"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {examsList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No exams found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Exam Submissions Section */}
                <div className="mt-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                      Exam Submissions & Results
                    </h2>
                  </div>

                  <div className="glass-panel rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-sm">
                          <th className="px-6 py-4 font-medium">Student</th>
                          <th className="px-6 py-4 font-medium">Exam</th>
                          <th className="px-6 py-4 font-medium">Score</th>
                          <th className="px-6 py-4 font-medium">Percentage</th>
                          <th className="px-6 py-4 font-medium">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {submissionsList.map(sub => {
                          const totalPoints = sub.exams?.total_points || 100;
                          const percentage = Math.round((sub.score / totalPoints) * 100);
                          const passingPercentage = sub.exams?.passing_percentage ?? 50;
                          const isPassed = percentage >= passingPercentage;
                          return (
                            <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-white font-medium">{sub.profiles?.full_name || 'Unknown'}</div>
                                <div className="text-xs text-slate-500">{sub.profiles?.email}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{sub.exams?.title || 'Deleted Exam'}</td>
                              <td className="px-6 py-4">
                                <span className="text-white font-bold">{sub.score}</span>
                                <span className="text-slate-500 text-sm"> / {totalPoints}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full",
                                        isPassed ? "bg-emerald-500" : "bg-rose-500"
                                      )}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isPassed ? "text-emerald-400" : "text-rose-400"
                                  )}>{percentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="text-slate-400 text-sm">
                                    {sub.completed_at ? (
                                      <>
                                        {new Date(sub.completed_at).toLocaleDateString()}
                                      </>
                                    ) : (
                                      'N/A'
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => navigate(`/exams/${sub.exam_id}?userId=${sub.user_id}`)}
                                    className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="View Detailed Result"
                                  >
                                    <FileText size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {submissionsList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No submissions yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquareWarning size={20} className="text-indigo-400" />
                    User Feedback & Requests
                  </h2>
                  <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setFeedbackFilter('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        feedbackFilter === 'all' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFeedbackFilter('complain')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        feedbackFilter === 'complain' ? "bg-rose-500 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      Complains
                    </button>
                    <button
                      onClick={() => setFeedbackFilter('feature_request')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        feedbackFilter === 'feature_request' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      Feature Requests
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {feedbackList
                    .filter(item => feedbackFilter === 'all' || item.type === feedbackFilter)
                    .map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.profiles?.avatar_url ? (
                                <img src={item.profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                  {item.profiles?.full_name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-slate-200">{item.profiles?.full_name || 'Unknown User'}</p>
                                <p className="text-xs text-slate-500">{item.profiles?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                item.type === 'complain' 
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              )}>
                                {item.type === 'complain' ? 'Complain' : 'Feature Request'}
                              </span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                item.status === 'resolved'
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/50">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.message}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Submitted on {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}</span>
                            
                            <div className="flex items-center gap-2">
                              {item.status !== 'resolved' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase.from('feedback').update({ status: 'resolved' }).eq('id', item.id);
                                      if (error) throw error;
                                      setFeedbackList(feedbackList.map(f => f.id === item.id ? { ...f, status: 'resolved' } : f));
                                    } catch (err: any) {
                                      alert('Failed to resolve: ' + err.message);
                                    }
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                >
                                  <CheckCircle2 size={14} />
                                  Mark Resolved
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this feedback?')) return;
                                  try {
                                    const { error } = await supabase.from('feedback').delete().eq('id', item.id);
                                    if (error) throw error;
                                    setFeedbackList(feedbackList.filter(f => f.id !== item.id));
                                  } catch (err: any) {
                                    alert('Failed to delete: ' + err.message);
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {item.image_url && (
                          <div className="md:w-48 shrink-0">
                            <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="block">
                              <img 
                                src={item.image_url} 
                                alt="Feedback attachment" 
                                className="w-full h-32 md:h-full object-cover rounded-lg border border-slate-700 hover:opacity-80 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {feedbackList.filter(item => feedbackFilter === 'all' || item.type === feedbackFilter).length === 0 && (
                    <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-slate-800/50">
                      <MessageSquareWarning size={48} className="mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No feedback or requests found for this filter.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
