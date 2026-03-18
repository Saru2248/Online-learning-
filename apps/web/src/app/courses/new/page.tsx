// ─────────────────────────────────────────────────────────────────────
//  Create Course Page
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, DollarSign, Tag, Info, CheckCircle2, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDesc: '',
    price: 0,
    level: 'BEGINNER',
    language: 'English',
    thumbnail: '',
    tags: '',
  });

  // Ensure only instructors can access this
  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        title: formData.title,
        description: formData.description,
        shortDesc: formData.shortDesc || undefined,
        price: Number(formData.price),
        level: formData.level,
        language: formData.language,
        thumbnail: formData.thumbnail || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      };

      const res = await api.post('/courses', payload);
      router.push(`/courses/${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create course. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <BookOpen className="text-brand-400" size={32} />
            Create a New Course
          </h1>
          <p className="text-slate-400 mt-2">
            Share your knowledge with the world. Fill out the details below to get started.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Info */}
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Info className="text-brand-400" size={20} />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  minLength={5}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Complete Web Development Bootcamp"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Short Summary</label>
                <input
                  type="text"
                  name="shortDesc"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  placeholder="A catchy one-liner for your course..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Detailed Description *</label>
                <textarea
                  name="description"
                  required
                  minLength={20}
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What will students learn? Why should they take this course?"
                  className="input resize-y"
                />
              </div>
            </div>
          </div>

          {/* Details & Settings */}
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Target className="text-accent-400" size={20} />
              Details &amp; Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (USD) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="input pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input appearance-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags (comma separated)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="react, javascript, frontend"
                    className="input pl-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Upload className="text-purple-400" size={20} />
              Media
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Thumbnail URL</label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
                className="input"
              />
              <p className="text-xs text-slate-500 mt-2">
                Provide a high-quality image URL. Leave blank for an auto-generated gradient.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : (
                <>
                  <CheckCircle2 size={18} /> Publish Course
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
