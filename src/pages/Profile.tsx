import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Save, User, Mail, BookOpen, Hash, Camera, Globe, Star, Flame, Clock, Plus, X, Shield, ShieldOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    class_id: '',
    section: '',
    bio: '',
    avatar_url: '',
    interests: [] as string[],
    facebook_url: '',
    instagram_url: '',
    is_public: true,
    social_links_public: true
  });

  const [stats, setStats] = useState({
    total_stars: 0,
    current_streak: 0,
    total_minutes: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfileData({
            full_name: data.full_name || '',
            class_id: data.class_id || '',
            section: data.section || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
            interests: data.interests || [],
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            is_public: data.is_public !== undefined ? data.is_public : true,
            social_links_public: data.social_links_public !== undefined ? data.social_links_public : true
          });

          setStats({
            total_stars: data.total_stars || 0,
            current_streak: data.current_streak || 0,
            total_minutes: 0 // Will fetch from sessions
          });
        }

        // Fetch total study time
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .eq('is_counted', true);
        
        if (sessions) {
          const total = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
          setStats(prev => ({ ...prev, total_minutes: total }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setProfileData({
      ...profileData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleInterestAdd = (interest: string) => {
    if (interest && !profileData.interests.includes(interest)) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, interest]
      });
    }
  };

  const handleInterestRemove = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter(i => i !== interest)
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      setMessage({ type: '', text: '' });

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user?.id,
          ...profileData,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: error.message || 'Error uploading image.' });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information and settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer block">
                    {profileData.avatar_url ? (
                      <img 
                        src={profileData.avatar_url} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/50" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center text-3xl font-bold text-indigo-400">
                        {profileData.full_name ? profileData.full_name.substring(0, 2).toUpperCase() : (user?.email || 'ST').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                    </div>
                  </label>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    hidden 
                    onChange={handleAvatarUpload} 
                    disabled={uploadingAvatar} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{profileData.full_name || 'Student'}</h2>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                      {profileData.is_public ? (
                        <Shield size={14} className="text-emerald-400" />
                      ) : (
                        <ShieldOff size={14} className="text-rose-400" />
                      )}
                      <span className="text-[10px] font-bold uppercase text-slate-300">
                        {profileData.is_public ? 'Public Profile' : 'Private Profile'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 flex items-center gap-2 mt-1">
                    <Mail size={14} />
                    {user?.email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <User size={16} className="text-indigo-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-400" />
                      Class / Grade
                    </label>
                    <input
                      type="text"
                      name="class_id"
                      value={profileData.class_id}
                      onChange={handleChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="e.g. 10, 11, College"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Hash size={16} className="text-indigo-400" />
                      Section
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={profileData.section}
                      onChange={handleChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="e.g. A, B, Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Shield size={16} className="text-indigo-400" />
                      Visibility
                    </label>
                    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                      <input
                        type="checkbox"
                        name="is_public"
                        id="is_public"
                        checked={profileData.is_public}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                      />
                      <label htmlFor="is_public" className="text-sm text-slate-300 cursor-pointer">
                        Make profile public to others
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Plus size={16} className="text-indigo-400" />
                    Interests & Subjects
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profileData.interests.map(interest => (
                      <span key={interest} className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-indigo-500/20">
                        {interest}
                        <button type="button" onClick={() => handleInterestRemove(interest)} className="hover:text-white">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="interest-input"
                      className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Add a subject (e.g. Physics, Coding)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInterestAdd((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('interest-input') as HTMLInputElement;
                        handleInterestAdd(input.value);
                        input.value = '';
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Tell us a bit about your study goals..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Globe size={16} className="text-indigo-400" />
                      Social Links
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="social_links_public"
                        id="social_links_public"
                        checked={profileData.social_links_public}
                        onChange={handleChange}
                        className="w-3 h-3 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                      />
                      <label htmlFor="social_links_public" className="text-[10px] font-bold uppercase text-slate-400 cursor-pointer">
                        Public
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                      <input
                        type="text"
                        name="facebook_url"
                        value={profileData.facebook_url}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Facebook Profile URL"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </div>
                      <input
                        type="text"
                        name="instagram_url"
                        value={profileData.instagram_url}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Instagram Username"
                      />
                    </div>
                  </div>
                </div>

                {message.text && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-800/60">
                  <button
                    type="submit"
                    disabled={saving || uploadingAvatar}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Study Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                  <Star className="text-yellow-400" size={20} fill="currentColor" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Stars</p>
                  <p className="text-xl font-bold text-white">{stats.total_stars}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="text-orange-500" size={20} fill="currentColor" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Current Streak</p>
                  <p className="text-xl font-bold text-white">{stats.current_streak} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Clock className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Study Time</p>
                  <p className="text-xl font-bold text-white">
                    {Math.floor(stats.total_minutes / 60)}h {stats.total_minutes % 60}m
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Profile Tips</h3>
            <ul className="space-y-3">
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                Add your subjects to find study partners with similar interests.
              </li>
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                A detailed bio helps other students know your goals.
              </li>
              <li className="text-xs text-slate-300 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                Keep your profile public to appear on the leaderboard and friend suggestions.
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
