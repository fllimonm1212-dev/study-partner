import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, Plus, Search, Trash2, Edit3, X, Save, Loader2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
}

const NOTE_COLORS = [
  'bg-slate-800',
  'bg-indigo-900/50',
  'bg-rose-900/50',
  'bg-emerald-900/50',
  'bg-amber-900/50',
  'bg-purple-900/50'
];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setErrorMsg('Notes table is missing. Please run the SQL setup.');
        } else {
          throw error;
        }
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setSaving(true);
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({ title, content, color, updated_at: new Date().toISOString() })
          .eq('id', editingNote.id);
          
        if (error) throw error;
        
        setNotes(notes.map(n => n.id === editingNote.id ? { ...n, title, content, color } : n));
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ user_id: user?.id, title, content, color }])
          .select()
          .single();
          
        if (error) throw error;
        if (data) setNotes([data, ...notes]);
      }
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving note:', error);
      alert('Failed to save note: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note.');
    }
  };

  const openModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color || NOTE_COLORS[0]);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setColor(NOTE_COLORS[0]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setColor(NOTE_COLORS[0]);
    }, 200);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <StickyNote className="text-indigo-400" />
            Study Notes
          </h1>
          <p className="text-slate-400 mt-2">Jot down important points, summaries, and ideas.</p>
        </div>
        
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {errorMsg && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl">
          <p className="font-bold mb-2">Database Setup Required</p>
          <p className="text-sm mb-2">{errorMsg}</p>
          <p className="text-sm opacity-80">Please ask the AI to run the SQL setup for the Notes feature.</p>
        </div>
      )}

      <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
        <Search size={20} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search your notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={note.id}
                onClick={() => openModal(note)}
                className={`group relative p-5 rounded-2xl border border-white/5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl ${note.color || 'bg-slate-800'}`}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 pr-8 truncate">{note.title || 'Untitled Note'}</h3>
                <p className="text-slate-300 text-sm line-clamp-6 whitespace-pre-wrap">
                  {note.content || 'No content...'}
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400">
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredNotes.length === 0 && !errorMsg && (
            <div className="col-span-full py-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
              <StickyNote size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-1">No notes found</h3>
              <p className="text-slate-500">
                {searchQuery ? "No notes match your search." : "Create your first study note to get started!"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 ${color}`}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${c} ${color === c ? 'border-white' : 'border-transparent'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={saving || (!title.trim() && !content.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save
                  </button>
                  <button
                    onClick={closeModal}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white placeholder-white/30"
                />
                <textarea
                  placeholder="Start typing your notes here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 min-h-[300px] bg-transparent border-none outline-none text-slate-200 placeholder-white/30 resize-none leading-relaxed"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
