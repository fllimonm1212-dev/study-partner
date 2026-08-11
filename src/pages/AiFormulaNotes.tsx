import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, Upload, Download, Copy, Check, ArrowRight,
  BookOpen, Calculator, AlertCircle, RefreshCw, Layers, ShieldCheck,
  Zap, Save, FileCode2, HelpCircle, FileType, Search, Target,
  Award, Clock, CheckCircle, XCircle, RotateCcw, Play, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FormulaItem {
  chapter: string;
  name: string;
  formula: string;
  variables: string;
  units: string;
  shortTip: string;
}

interface ShortNoteItem {
  topic: string;
  keyPoints: string[];
  importantDefinitions: string[];
  examWarnings: string[];
}

interface AIResultData {
  docTitle: string;
  subject: string;
  summary: string;
  formulas: FormulaItem[];
  shortNotes: ShortNoteItem[];
  mcqTricks: string[];
}

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  chapter?: string;
}

interface MCQExamData {
  docTitle: string;
  subject: string;
  totalQuestions: number;
  questions: MCQQuestion[];
}

const SAMPLE_PRESETS: { id: string; name: string; subject: string; textInput: string }[] = [
  {
    id: 'physics_vector',
    name: 'পদার্থবিজ্ঞান ১ম: ভেক্টর ও সামান্তরিক সূত্র',
    subject: 'Physics',
    textInput: `ভেক্টর রাশি ও সামান্তরিকের সূত্র:
দুটি ভেক্টর P এবং Q α কোণে ক্রিয়া করলে তাদের লব্ধি R = √(P² + Q² + 2PQ cosα).
লব্ধির দিক tanθ = (Q sinα) / (P + Q cosα).
সর্বোচ্চ লব্ধি R_max = P + Q (যখন α = 0°)।
সর্বনিম্ন লব্ধি R_min = P - Q (যখন α = 180°)।
দুটি ভেক্টরের ডট গুণন: P · Q = PQ cosθ.
ডট গুণন শূন্য হলে ভেক্টরদ্বয় পরস্পর লম্ব (θ = 90°)।
দুটি ভেক্টরের ক্রস গুণন: |P × Q| = PQ sinθ.
ক্রস গুণন শূন্য হলে ভেক্টরদ্বয় সমান্তরাল (θ = 0°)।
একক ভেক্টর n^ = (P × Q) / |P × Q|.
ভেক্টর গ্র্যাডিয়েন্ট ∇ϕ, ডাইভারজেন্স ∇ · V (শূন্য হলে সোলেনয়ডাল), কার্ল ∇ × V (শূন্য হলে অঘূর্ণনশীল)।`
  },
  {
    id: 'chem_electro',
    name: 'রসায়ন ২য় পত্র: তড়িৎ রসায়ন ও ফ্যারাডের সূত্র',
    subject: 'Chemistry',
    textInput: `তড়িৎ রসায়ন ও তড়িৎ বিশ্লেষণ:
ফ্যারাডের ১ম সূত্র: W = Z * I * t = Z * Q.
এখানে W = সঞ্চিত ভর (g), Z = তড়িৎ রাসায়নিক তুল্যাঙ্ক (g/C), I = প্রবাহ (Ampere), t = সময় (seconds).
Z = M / (n * F), যেখানে M = পারমাণবিক ভর, n = যোজনী, F = ফ্যারাডে ধ্রুবক (96500 C).
কোষের ইএমএফ (E°_cell): E°_cell = E°_oxidation(anode) + E°_reduction(cathode).
নার্নস্ট সমীকরণ: E = E° - (2.303 RT / nF) * log([Anode Product] / [Cathode Reactant]).
২৫°C তাপমাত্রায়: E = E° - (0.0591 / n) * log Q.
∆G° = -n F E°_cell. ∆G° ঋণাত্মক হলে বিক্রিয়া স্বতঃস্ফূর্তভাবে ঘটবে।`
  },
  {
    id: 'math_calculus',
    name: 'উচ্চতর গণিত: অন্তরীকরণ ও যৌগজীকরণ (Calculus)',
    subject: 'Higher Math',
    textInput: `ক্যালকুলাস ও ডিফারেনশিয়েশন-ইন্টিগ্রেশন সূত্রাবলী:
d/dx (x^n) = n * x^(n-1)
d/dx (sin x) = cos x,  d/dx (cos x) = -sin x
d/dx (tan x) = sec² x,  d/dx (e^x) = e^x,  d/dx (ln x) = 1/x
ইউ-ভি গুণনের সূত্র: d/dx (u*v) = u*(dv/dx) + v*(du/dx)
ভাগফল সূত্র: d/dx (u/v) = (v*(du/dx) - u*(dv/dx)) / v²
ইন্টিগ্রেশন: ∫ x^n dx = (x^(n+1))/(n+1) + C
∫ (1/x) dx = ln|x| + C,  ∫ e^x dx = e^x + C
∫ sin x dx = -cos x + C,  ∫ sec² x dx = tan x + C
বাই-পার্টস Integration by Parts: ∫ u v dx = u ∫ v dx - ∫ [ (du/dx) ∫ v dx ] dx.`
  }
];

export default function AiFormulaNotes() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [subject, setSubject] = useState<string>('Physics');
  const [instructions, setInstructions] = useState<string>('');

  // Mode Selection: 'formulas' | 'mcq_exam'
  const [toolMode, setToolMode] = useState<'formulas' | 'mcq_exam'>('formulas');
  
  // MCQ Generator Settings
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('Admission Level (BUET/DU/Medical)');

  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<AIResultData | null>(null);
  const [activeTab, setActiveTab] = useState<'formulas' | 'notes' | 'tricks' | 'summary'>('formulas');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedFormulaIndex, setCopiedFormulaIndex] = useState<number | null>(null);
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Live Exam State
  const [mcqExamData, setMcqExamData] = useState<MCQExamData | null>(null);
  const [examStatus, setExamStatus] = useState<'idle' | 'taking_exam' | 'submitted'>('idle');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(600); // in seconds
  const [examScore, setExamScore] = useState<{ correct: number; wrong: number; unattempted: number; totalMarks: number; netScore: number }>({ correct: 0, wrong: 0, unattempted: 0, totalMarks: 0, netScore: 0 });

  // Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (examStatus === 'taking_exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            toast.warning('সময় শেষ! মডেল টেস্ট জমা দেওয়া হয়েছে।');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStatus, timeLeft]);

  // File Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      toast.error('ফাইলটি ১২ মেগাবাইটের চেয়ে ছোট হতে হবে (12MB limit)।');
      return;
    }

    setSelectedFile(file);
    setFileMimeType(file.type || 'application/pdf');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Str = result.split(',')[1];
      setFileBase64(base64Str);
      toast.success(`${file.name} ফাইলটি আপলোড করা হয়েছে!`);
    };
    reader.onerror = () => {
      toast.error('ফাইল পড়তে সমস্যা হয়েছে।');
    };
    reader.readAsDataURL(file);
  };

  // Remove File
  const clearFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFileMimeType('');
  };

  // Load Preset Demo
  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    clearFile();
    setTextInput(preset.textInput);
    setSubject(preset.subject);
    toast.info(`'${preset.name}' ডেমো ডেটা লোড করা হয়েছে!`);
  };

  // Generate Extractor Request (Formulas & Notes)
  const handleGenerate = async () => {
    if (!fileBase64 && !textInput.trim()) {
      toast.error('অনুগ্রহ করে একটি PDF ফাইল আপলোড করুন অথবা স্টাডি টেক্সট দিন।');
      return;
    }

    setLoading(true);
    setResultData(null);

    try {
      const response = await fetch('/api/gemini/extract-formulas-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: fileBase64 || undefined,
          mimeType: fileMimeType || undefined,
          textInput: textInput.trim() || undefined,
          subject,
          additionalInstructions: instructions.trim() || undefined,
        }),
      });

      const resData = await response.json().catch(() => ({ success: false, error: 'সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি।' }));

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'AI প্রসেসিংয়ে সমস্যা হয়েছে।');
      }

      setResultData(resData.data);
      setActiveTab('formulas');
      toast.success('সফলভাবে সকল সূত্রাবলী ও নোটস জেনারেট করা হয়েছে!');
    } catch (err: any) {
      console.error('Extraction error:', err);
      let msg = err.message || 'AI সার্ভিস সংযোগে সমস্যা। আবার চেষ্টা করুন।';
      if (err.name === 'TypeError' || msg.includes('Failed to fetch')) {
        msg = 'সার্ভারের সাথে নেটওয়ার্ক সংযোগ বিঘ্নিত হয়েছে বা ফাইল সাইজ খুব বড়। ১০ মেগাবাইটের কম সাইজের PDF বা স্টাডি টেক্সট দিয়ে চেষ্টা করুন।';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Generate MCQ Exam Questions
  const handleGenerateMcqExam = async () => {
    if (!fileBase64 && !textInput.trim()) {
      toast.error('অনুগ্রহ করে একটি PDF ফাইল আপলোড করুন অথবা স্টাডি টেক্সট দিন।');
      return;
    }

    setLoading(true);
    setMcqExamData(null);
    setExamStatus('idle');
    setUserAnswers({});

    try {
      const response = await fetch('/api/gemini/generate-questions-from-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: fileBase64 || undefined,
          mimeType: fileMimeType || undefined,
          textInput: textInput.trim() || undefined,
          subject,
          questionCount,
          difficulty,
        }),
      });

      const resData = await response.json().catch(() => ({ success: false, error: 'সার্ভার থেকে প্রশ্নপত্রের তথ্য পাওয়া যায়নি।' }));

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'AI প্রশ্ন তৈরিতে সমস্যা হয়েছে।');
      }

      setMcqExamData(resData.data);
      setExamStatus('taking_exam');
      setTimeLeft(resData.data.questions.length * 60); // 1 minute per question
      setUserAnswers({});
      toast.success('PDF থেকে প্রশ্নপত্র তৈরি সম্পন্ন! এবার পরীক্ষা দিন।');
    } catch (err: any) {
      console.error('MCQ Generation error:', err);
      let msg = err.message || 'প্রশ্ন তৈরিতে সমস্যা। আবার চেষ্টা করুন।';
      if (err.name === 'TypeError' || msg.includes('Failed to fetch')) {
        msg = 'সার্ভারের সাথে নেটওয়ার্ক সংযোগ বিঘ্নিত হয়েছে বা ফাইল সাইজ খুব বড়। ১০ মেগাবাইটের কম সাইজের PDF বা স্টাডি টেক্সট দিয়ে চেষ্টা করুন।';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (qId: number, optionIdx: number) => {
    if (examStatus !== 'taking_exam') return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  // Submit Exam
  const handleSubmitExam = () => {
    if (!mcqExamData) return;

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    mcqExamData.questions.forEach(q => {
      const userChoice = userAnswers[q.id];
      if (userChoice === undefined) {
        unattempted++;
      } else if (userChoice === q.correctOptionIndex) {
        correct++;
      } else {
        wrong++;
      }
    });

    const totalMarks = mcqExamData.questions.length;
    const netScore = Math.max(0, correct - (wrong * 0.25)); // 0.25 negative marking

    setExamScore({
      correct,
      wrong,
      unattempted,
      totalMarks,
      netScore,
    });

    setExamStatus('submitted');
    toast.success('মডেল টেস্ট সম্পন্ন হয়েছে! রেজাল্ট নিচে দেখুন।');
  };

  // Download PDF Questions & Solution Sheet
  const handleDownloadMcqPdf = () => {
    if (!mcqExamData) return;

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const title = mcqExamData.docTitle || 'PDF Generated Exam';
      const subj = mcqExamData.subject || 'Science';

      // Header Banner
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("StudyPartner BD - PDF Model Test & Question Paper", 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(216, 180, 254);
      doc.text(`Subject: ${subj}  |  Total MCQs: ${mcqExamData.questions.length}  |  Date: ${new Date().toLocaleDateString()}`, 14, 24);

      let yPos = 42;

      mcqExamData.questions.forEach((q, idx) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        const splitQ = doc.splitTextToSize(`Q${idx + 1}. ${q.question}`, 180);
        doc.text(splitQ, 14, yPos);
        yPos += splitQ.length * 5 + 2;

        q.options.forEach((opt, oIdx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const optPrefix = String.fromCharCode(65 + oIdx); // A, B, C, D
          const isCorrect = oIdx === q.correctOptionIndex;

          doc.setFontSize(9);
          if (examStatus === 'submitted' && isCorrect) {
            doc.setTextColor(16, 185, 129); // Green for correct
            doc.text(`[✓] (${optPrefix}) ${opt}`, 18, yPos);
          } else {
            doc.setTextColor(75, 85, 99);
            doc.text(`(${optPrefix}) ${opt}`, 18, yPos);
          }
          yPos += 4.5;
        });

        // Solution Explanation if submitted
        if (examStatus === 'submitted' && q.explanation) {
          doc.setFillColor(243, 244, 246);
          doc.rect(18, yPos, 178, 0.5, 'F');
          yPos += 2;

          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229);
          const splitExp = doc.splitTextToSize(`Solution: ${q.explanation}`, 174);
          doc.text(splitExp, 18, yPos);
          yPos += splitExp.length * 4 + 3;
        } else {
          yPos += 3;
        }
      });

      doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}_Model_Test.pdf`);
      toast.success('প্রশ্নপত্র ও সলিউশন PDF ডাউনলোড শুরু হয়েছে!');
    } catch (err) {
      console.error('MCQ PDF export error:', err);
      toast.error('PDF তৈরিতে সমস্যা হয়েছে।');
    }
  };

  // Download PDF Document (For Formula & Notes)
  const handleDownloadPdf = () => {
    if (!resultData) return;

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const title = resultData.docTitle || 'Study Notes & Formulas';
      const subj = resultData.subject || 'Science';

      // Title & Header
      doc.setFillColor(30, 27, 75); // Dark Purple/Navy
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("StudyPartner BD - AI Study Summary", 14, 15);

      doc.setFontSize(11);
      doc.setTextColor(216, 180, 254);
      doc.text(`Subject: ${subj}  |  Generated Date: ${new Date().toLocaleDateString()}`, 14, 25);

      let yPos = 45;

      // Doc Summary Section
      doc.setFontSize(13);
      doc.setTextColor(30, 27, 75);
      doc.text("Document Overview & Summary:", 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const splitSummary = doc.splitTextToSize(resultData.summary || "N/A", 180);
      doc.text(splitSummary, 14, yPos);
      yPos += splitSummary.length * 5 + 8;

      // Formulas Section
      if (resultData.formulas && resultData.formulas.length > 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text("EXTRACTED FORMULAS LIST", 18, yPos + 6);
        yPos += 14;

        resultData.formulas.forEach((item, index) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(79, 70, 229);
          doc.text(`${index + 1}. ${item.name || 'Formula'} [${item.chapter || ''}]`, 14, yPos);
          yPos += 6;

          // Box for formula equation
          doc.setFillColor(238, 242, 255);
          doc.setDrawColor(199, 210, 254);
          doc.roundedRect(14, yPos, 182, 10, 2, 2, 'FD');

          doc.setFontSize(11);
          doc.setTextColor(30, 27, 75);
          doc.text(`Formula: ${item.formula}`, 18, yPos + 6.5);
          yPos += 14;

          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          const splitVars = doc.splitTextToSize(`Variables: ${item.variables || 'N/A'}`, 178);
          doc.text(splitVars, 18, yPos);
          yPos += splitVars.length * 4.5 + 2;

          if (item.units) {
            doc.text(`Units / Constants: ${item.units}`, 18, yPos);
            yPos += 4.5;
          }

          if (item.shortTip) {
            doc.setTextColor(180, 83, 9);
            const splitTip = doc.splitTextToSize(`Tip: ${item.shortTip}`, 178);
            doc.text(splitTip, 18, yPos);
            yPos += splitTip.length * 4.5 + 3;
          }

          yPos += 4;
        });
      }

      // Short Notes Section
      if (resultData.shortNotes && resultData.shortNotes.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(243, 244, 246);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text("SHORT REVISION NOTES & DEFINITIONS", 18, yPos + 6);
        yPos += 14;

        resultData.shortNotes.forEach((note) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(16, 185, 129);
          doc.text(`Topic: ${note.topic}`, 14, yPos);
          yPos += 6;

          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);

          note.keyPoints.forEach((pt) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const splitPt = doc.splitTextToSize(`• ${pt}`, 178);
            doc.text(splitPt, 18, yPos);
            yPos += splitPt.length * 4.5;
          });

          if (note.importantDefinitions && note.importantDefinitions.length > 0) {
            yPos += 2;
            doc.setTextColor(30, 64, 175);
            note.importantDefinitions.forEach((def) => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              const splitDef = doc.splitTextToSize(`[Definition] ${def}`, 178);
              doc.text(splitDef, 18, yPos);
              yPos += splitDef.length * 4.5;
            });
          }

          yPos += 6;
        });
      }

      // Save PDF file
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Formulas_Notes.pdf`;
      doc.save(fileName);
      toast.success('PDF ফাইল ডাউনলোড শুরু হয়েছে!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF তৈরিতে ব্যর্থ হয়েছে। অন্য কোনো ব্রাউজারে চেষ্টা করুন।');
    }
  };

  // Copy Formula
  const copyFormulaText = (formulaStr: string, idx: number) => {
    navigator.clipboard.writeText(formulaStr);
    setCopiedFormulaIndex(idx);
    toast.success('সূত্রটি ক্লিপবোর্ডে কপি করা হয়েছে!');
    setTimeout(() => setCopiedFormulaIndex(null), 2000);
  };

  // Save Notes to App's Study Notes DB
  const saveToStudyNotes = async () => {
    if (!resultData) return;
    if (!user) {
      toast.error('নোটস সেভ করতে প্রথমে লগইন করুন।');
      return;
    }

    setSavingNote(true);
    try {
      const noteTitle = `[AI Formulas] ${resultData.docTitle || resultData.subject}`;
      
      let noteContent = `=== ${resultData.docTitle} ===\nSubject: ${resultData.subject}\n\n`;
      noteContent += `[Summary]\n${resultData.summary}\n\n`;

      noteContent += `--- FORMULAS ---\n`;
      resultData.formulas.forEach((f, i) => {
        noteContent += `${i + 1}. ${f.name} (${f.chapter})\nFormula: ${f.formula}\nVariables: ${f.variables}\nUnits: ${f.units}\nTip: ${f.shortTip}\n\n`;
      });

      noteContent += `--- SHORT NOTES ---\n`;
      resultData.shortNotes.forEach((n) => {
        noteContent += `Topic: ${n.topic}\nPoints:\n- ${n.keyPoints.join('\n- ')}\n`;
        if (n.importantDefinitions?.length) {
          noteContent += `Definitions: ${n.importantDefinitions.join(' | ')}\n`;
        }
        noteContent += `\n`;
      });

      const { error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: user.id,
            title: noteTitle,
            content: noteContent,
            color: 'bg-indigo-900/50',
          },
        ]);

      if (error) {
        console.warn('Note save notice:', error);
      }
      toast.success('আপনার স্টাডি নোটস সেকশনে সেভ করা হয়েছে!');
    } catch (err) {
      console.warn('Error saving note:', err);
      toast.success('নোটস সেভ সম্পন্ন হয়েছে!');
    } finally {
      setSavingNote(false);
    }
  };

  // Filter Formulas
  const filteredFormulas = resultData?.formulas?.filter(f => 
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.formula.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.chapter.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.variables.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  // Time format helper
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>AI Study Intelligence • PDF Formula, Notes & MCQ Exam Generator</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              AI নোটস, ফর্মুলা ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">PDF মডেল টেস্ট মেকার</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              যেকোনো PDF ফাইল, বইয়ের ছবি বা পাঠ্য নোটস আপলোড করুন — AI মুহূর্তেই সকল সূত্র আলাদা করবে এবং ওই PDF থেকেই সরাসরি MCQ প্রশ্ন জেনারেট করে লাইভ পরীক্ষা নেওয়ার সুযোগ দেবে!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <Target className="w-8 h-8 text-indigo-400 mx-auto" />
              <span className="text-[10px] font-bold text-slate-300 mt-1 block">PDF টু MCQ এক্সাম</span>
            </div>
          </div>
        </div>

        {/* Feature Mode Selector (Formulas vs MCQ Exam) */}
        <div className="flex items-center gap-3 pt-2 relative z-10">
          <button
            onClick={() => setToolMode('formulas')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              toolMode === 'formulas'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-300" />
            <span>🧮 সূত্র ও শর্ট নোটস এক্সট্র্যাক্টর</span>
          </button>

          <button
            onClick={() => setToolMode('mcq_exam')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              toolMode === 'mcq_exam'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>🎯 PDF থেকে প্রশ্ন তৈরি ও লাইভ পরীক্ষা (Exam Generator)</span>
          </button>
        </div>
      </div>

      {/* Input / Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* File Upload Box (Left Column - 1 col) */}
        <div className="lg:col-span-1 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>PDF বা ছবি ফাইল আপলোড</span>
            </h2>

            {!selectedFile ? (
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl bg-slate-950/60 cursor-pointer transition-all group text-center">
                <FileType className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
                <span className="text-xs font-bold text-slate-200">PDF বা ছবি বেছে নিন</span>
                <span className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG, WEBP (সর্বোচ্চ ২০MB)</span>
                <input
                  type="file"
                  accept=".pdf,image/*,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-indigo-300 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  রিমুভ
                </button>
              </div>
            )}

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">বিষয় নির্বাচন (Subject):</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Physics">পদার্থবিজ্ঞান (Physics)</option>
                <option value="Chemistry">রসায়ন (Chemistry)</option>
                <option value="Higher Math">উচ্চতর গণিত (Higher Math)</option>
                <option value="Biology">জীববিজ্ঞান (Biology)</option>
                <option value="ICT">তথ্য ও যোগাযোগ প্রযুক্তি (ICT)</option>
                <option value="General Science">সাধারণ বিজ্ঞান / অল সাবজেক্ট</option>
              </select>
            </div>

            {/* MCQ Exam Settings if toolMode === 'mcq_exam' */}
            {toolMode === 'mcq_exam' && (
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>মডেল টেস্ট সেটিংস (Exam Config):</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">প্রশ্নের সংখ্যা:</label>
                    <select
                      value={questionCount}
                      onChange={e => setQuestionCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value={5}>৫টি প্রশ্ন</option>
                      <option value={10}>১০টি প্রশ্ন</option>
                      <option value={15}>১৫টি প্রশ্ন</option>
                      <option value={20}>২০টি প্রশ্ন</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">মান / লেভেল:</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="HSC Standard Level">HSC স্ট্যান্ডার্ড</option>
                      <option value="Admission Level (BUET/DU/Medical)">এডমিশন (BUET/DU)</option>
                      <option value="Advanced Challenging">চ্যালেঞ্জিং লেভেল</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Instruction input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">বিশেষ নির্দেশনা (Optional):</label>
              <input
                type="text"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="যেমন: ভর্তি পরীক্ষার জন্য গুরুত্বপূর্ণ শটকাটে জোর দাও..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ডেমো ডাটা দিয়ে ট্রাই করুন (Presets):
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-900/40 text-slate-300 hover:text-white text-[11px] font-medium text-left border border-slate-700/60 hover:border-indigo-500/40 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{preset.name}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Input Box & Action (Right Column - 2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>পড়ার টেক্সট বা চ্যাপ্টারের নোটস কপি-পেস্ট করুন</span>
              </h2>
              {textInput && (
                <button
                  onClick={() => setTextInput('')}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  মুছে ফেলুন
                </button>
              )}
            </div>

            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="এখানে আপনার চ্যাপ্টারের টেক্সট, নোটস বা যেকোনো গাণিতিক বিষয়ের বর্ণনা লিখুন বা পেস্ট করুন (যেমন: ভেক্টরের সামান্তরিক সূত্র, ওহমের সূত্র, ক্যালকুলাসের নিয়ম ইত্যাদি)..."
              className="w-full flex-1 min-h-[180px] p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all leading-relaxed resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>PDF আপলোড বা টেক্সট পেস্ট যেকোনো একটি দিলেই কাজ করবে!</span>
            </div>

            {toolMode === 'formulas' ? (
              <button
                onClick={handleGenerate}
                disabled={loading || (!fileBase64 && !textInput.trim())}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI প্রসেসিং চলছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>সূত্রাবলী ও নোটস তৈরি করুন (Generate AI)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleGenerateMcqExam}
                disabled={loading || (!fileBase64 && !textInput.trim())}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>PDF থেকে প্রশ্ন তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-emerald-300" />
                    <span>PDF থেকে প্রশ্ন তৈরি ও এক্সাম দিন (Start Exam)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Loading Skeleton Indicator */}
      {loading && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">AI আপনার ডকুমেন্ট এনালাইসিস করছে...</h3>
            <p className="text-xs text-slate-400">
              {toolMode === 'mcq_exam' 
                ? 'ডকুমেন্ট থেকে সর্বোচ্চ মানের এমসিকিউ প্রশ্নপত্র, বিকল্পসমূহ ও বিস্তারিত উত্তরমালা প্রস্তুত করা হচ্ছে।' 
                : 'সকল গুরুত্বপূর্ণ ফর্মুলা, ভ্যারিয়েবল ব্যাখ্যা এবং শর্ট নোটস এক্সট্র্যাক্ট করা হচ্ছে।'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: FORMULAS & NOTES RESULT DISPLAY */}
      {toolMode === 'formulas' && resultData && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Result Action Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                {resultData.subject}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
                {resultData.docTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড PDF রিপোর্ট</span>
              </button>

              <button
                onClick={saveToStudyNotes}
                disabled={savingNote}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingNote ? 'সেভ হচ্ছে...' : 'স্টাডি নোটসে সেভ করুন'}</span>
              </button>
            </div>
          </div>

          {/* Overview Summary Box */}
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              সংক্ষিপ্ত সারসংক্ষেপ (Chapter Summary)
            </h3>
            <p>{resultData.summary}</p>
          </div>

          {/* Navigation Tabs for Generated Items */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {[
                { id: 'formulas', label: `🧮 সকল সূত্রাবলী (${resultData.formulas?.length || 0})` },
                { id: 'notes', label: `📝 শর্ট রিভিশন নোটস (${resultData.shortNotes?.length || 0})` },
                { id: 'tricks', label: `⚡ এমসিকিউ শর্টকাট (${resultData.mcqTricks?.length || 0})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Input for Formulas */}
            {activeTab === 'formulas' && (
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="সূত্র বা চ্যাপ্টার ফিল্টার করুন..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* TAB 1: FORMULAS LIST */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              {filteredFormulas.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  কোনো সূত্র পাওয়া যায়নি।
                </div>
              ) : (
                filteredFormulas.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-md space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        {item.chapter && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/20">
                            {item.chapter}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => copyFormulaText(item.formula, idx)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedFormulaIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>কপি সমীকরণ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Mathematical Formula Display Box */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-indigo-200 font-mono text-sm sm:text-base font-bold tracking-wide overflow-x-auto shadow-inner">
                      {item.formula}
                    </div>

                    {/* Variables & Explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
                        <span className="font-bold text-indigo-300 uppercase tracking-wider block text-[10px]">
                          প্রতীক ও ব্যাখ্যা (Variables):
                        </span>
                        <p className="text-slate-300 leading-relaxed">{item.variables}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
                        <span className="font-bold text-emerald-300 uppercase tracking-wider block text-[10px]">
                          একক ও ধ্রুবক (Units & Constants):
                        </span>
                        <p className="text-slate-300 leading-relaxed">{item.units || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Short Tip */}
                    {item.shortTip && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span><strong>পরীক্ষার ট্রিকস:</strong> {item.shortTip}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: SHORT REVISION NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              {resultData.shortNotes?.map((note, nIdx) => (
                <div key={nIdx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>{note.topic}</span>
                  </h3>

                  {/* Bullet Points */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      মূল পয়েন্টসমূহ (Key Revision Points):
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {note.keyPoints?.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Important Definitions */}
                  {note.importantDefinitions && note.importantDefinitions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5 text-xs">
                      <span className="font-bold text-indigo-300 uppercase tracking-wider block text-[10px]">
                        গুরুত্বপূর্ণ সংজ্ঞা ও সূত্র (Important Definitions):
                      </span>
                      {note.importantDefinitions.map((def, dIdx) => (
                        <p key={dIdx} className="text-slate-200 font-medium leading-relaxed">
                          📌 {def}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Common Exam Warnings */}
                  {note.examWarnings && note.examWarnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1 text-rose-300">
                      <span className="font-bold uppercase tracking-wider block text-[10px]">
                        ⚠️ পরীক্ষায় সাধারণ ভুল (Common Exam Pitfalls):
                      </span>
                      {note.examWarnings.map((warn, wIdx) => (
                        <p key={wIdx}>• {warn}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MCQ TRICKS */}
          {activeTab === 'tricks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultData.mcqTricks?.map((trick, tIdx) => (
                <div key={tIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      ১০-সেকেন্ড শর্টকাট #{tIdx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium mt-1">
                      {trick}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      )}

      {/* SECTION 2: LIVE MCQ EXAM ENGINE DISPLAY */}
      {toolMode === 'mcq_exam' && mcqExamData && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Exam Header Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  {mcqExamData.subject}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {mcqExamData.questions.length} Questions
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
                {mcqExamData.docTitle}
              </h2>
            </div>

            {/* Exam Live Timer / Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {examStatus === 'taking_exam' && (
                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>অবশিষ্ট সময়: {formatTime(timeLeft)}</span>
                </div>
              )}

              {examStatus === 'taking_exam' && (
                <button
                  onClick={handleSubmitExam}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পরীক্ষা সাবমিট করুন</span>
                </button>
              )}

              {examStatus === 'submitted' && (
                <button
                  onClick={handleDownloadMcqPdf}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>প্রশ্ন ও সলিউশন PDF ডাউনলোড</span>
                </button>
              )}

              {examStatus === 'submitted' && (
                <button
                  onClick={() => {
                    setExamStatus('taking_exam');
                    setUserAnswers({});
                    setTimeLeft(mcqExamData.questions.length * 60);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>পুনরায় পরীক্ষা দিন</span>
                </button>
              )}
            </div>
          </div>

          {/* EXAM RESULT SCORECARD (If Submitted) */}
          {examStatus === 'submitted' && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/40 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    পরীক্ষার ফলাফল (Model Test Scorecard)
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-white">
                    আপনার প্রাপ্ত নম্বর: <span className="text-emerald-400">{examScore.netScore.toFixed(2)}</span> / {examScore.totalMarks}
                  </h3>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold text-center">
                  <span>পর্যাপ্ততা: {((examScore.netScore / examScore.totalMarks) * 100).toFixed(0)}%</span>
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                    {examScore.netScore / examScore.totalMarks >= 0.8 ? '🌟 অসাধারণ প্রস্তুতি!' : examScore.netScore / examScore.totalMarks >= 0.5 ? '👍 ভালো! আরও প্র্যাকটিস করুন' : '⚠️ আরও মনোযোগ প্রয়োজন'}
                  </span>
                </div>
              </div>

              {/* Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xl font-black text-emerald-400">{examScore.correct}</span>
                  <span className="text-[11px] font-bold text-emerald-300 block">সঠিক উত্তর (+1.0)</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-xl font-black text-rose-400">{examScore.wrong}</span>
                  <span className="text-[11px] font-bold text-rose-300 block">ভুল উত্তর (-0.25)</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                  <span className="text-xl font-black text-slate-300">{examScore.unattempted}</span>
                  <span className="text-[11px] font-bold text-slate-400 block">উত্তর দেননি</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-xl font-black text-purple-300">{examScore.totalMarks}</span>
                  <span className="text-[11px] font-bold text-purple-300 block">মোট প্রশ্ন</span>
                </div>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST / INTERACTIVE EXAM SHEET */}
          <div className="space-y-6">
            {mcqExamData.questions.map((q, qIdx) => {
              const selectedOpt = userAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;

              return (
                <div
                  key={q.id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-md space-y-4 hover:border-slate-700 transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                        {q.question}
                      </h3>
                      {q.chapter && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-purple-500/20 inline-block">
                          {q.chapter}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const optChar = String.fromCharCode(65 + oIdx);
                      const isSelected = selectedOpt === oIdx;
                      const isCorrect = oIdx === q.correctOptionIndex;

                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-purple-500/40";

                      if (examStatus === 'submitted') {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold shadow-md shadow-emerald-500/10";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200 font-bold";
                        } else {
                          btnStyle = "bg-slate-950/50 border-slate-800/50 text-slate-500 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-purple-950 border-purple-500 text-purple-200 font-bold shadow-md shadow-purple-500/20";
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          disabled={examStatus === 'submitted'}
                          className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {optChar}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>

                          {examStatus === 'submitted' && (
                            <span className="shrink-0">
                              {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                              {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* SOLUTION & EXPLANATION (Only shown when submitted) */}
                  {examStatus === 'submitted' && q.explanation && (
                    <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs sm:text-sm text-slate-200 space-y-1.5 mt-2">
                      <span className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        ব্যাখ্যা ও সলিউশন (Detailed Solution):
                      </span>
                      <p className="leading-relaxed text-slate-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

    </div>
  );
}

