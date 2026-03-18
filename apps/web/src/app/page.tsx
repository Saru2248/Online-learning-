// ─────────────────────────────────────────────────────────────────────
//  Home Page — Hero + Recommendations + Featured Courses
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, BookOpen, Users, Star, ArrowRight, PlayCircle } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { SearchBar } from '@/components/search/SearchBar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// ─── Stats ─────────────────────────────────────────────────────────────
const stats = [
  { icon: BookOpen, value: '10,000+', label: 'Courses' },
  { icon: Users, value: '500K+', label: 'Students' },
  { icon: Star, value: '4.8', label: 'Avg Rating' },
  { icon: TrendingUp, value: '95%', label: 'Completion Rate' },
];

// ─── Category pills ────────────────────────────────────────────────────
const categories = [
  'Web Development', 'Data Science', 'Machine Learning', 'Mobile Apps',
  'Cloud & DevOps', 'UI/UX Design', 'Cybersecurity', 'Blockchain',
];

export default function HomePage() {
  const { user } = useAuthStore();
  const [trendingCourses, setTrendingCourses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [trending, recs] = await Promise.all([
          api.get('/courses/trending?limit=8').then((r) => r.data),
          user
            ? api.get('/recommendations/me?limit=8').then((r) => r.data)
            : Promise.resolve([]),
        ]);
        setTrendingCourses(trending);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient pt-20 pb-32">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                          bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px]
                          bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-brand-500/15 border border-brand-500/25 mb-8 animate-fade-in">
            <Sparkles size={16} className="text-brand-400" />
            <span className="text-brand-300 text-sm font-medium">
              AI-Powered Personalized Learning
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6
                         animate-slide-up leading-tight">
            Learn Without
            <span className="text-gradient block">Limits</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-fade-in">
            Join 500,000+ learners mastering new skills with AI-curated courses
            taught by world-class instructors.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <SearchBar />
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16 flex-wrap">
            <Link href="/courses" className="btn-primary text-lg px-8 py-4">
              <BookOpen size={20} /> Explore Courses
            </Link>
            {!user && (
              <Link href="/auth/register" className="btn-secondary text-lg px-8 py-4">
                Start Learning Free
                <ArrowRight size={20} />
              </Link>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon size={24} className="text-brand-400 mx-auto mb-2" />
                <div className="text-2xl font-display font-bold text-white">{value}</div>
                <div className="text-slate-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Category Pills ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/courses?category=${encodeURIComponent(cat)}`}
              className="px-5 py-2.5 rounded-full bg-surface-800 border border-white/5
                         text-slate-300 text-sm font-medium
                         hover:bg-brand-500/15 hover:border-brand-500/30 hover:text-brand-300
                         transition-all duration-200"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* ─── AI Recommendations (if logged in) ──────────────────────── */}
      {user && recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-brand-400" />
                <h2 className="section-heading !mb-0">Recommended for You</h2>
              </div>
              <p className="section-sub !mb-0">Personalized by our AI based on your learning history</p>
            </div>
            <Link href="/dashboard" className="btn-secondary">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <CourseGrid courses={recommendations} loading={loading} />
        </section>
      )}

      {/* ─── Trending Courses ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={20} className="text-accent-400" />
              <h2 className="section-heading !mb-0">Trending This Week</h2>
            </div>
            <p className="section-sub !mb-0">Most popular courses among learners right now</p>
          </div>
          <Link href="/courses?sortBy=popular" className="btn-secondary">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <CourseGrid courses={trendingCourses} loading={loading} />
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────── */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r
                          from-brand-600 to-purple-600 p-12 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <PlayCircle size={48} className="text-white/80 mx-auto mb-4" />
              <h2 className="text-4xl font-display font-bold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Join over 500,000 students. Get access to 10,000+ courses with a free account.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/auth/register" className="btn-accent text-lg px-8 py-4">
                  Get Started Free
                </Link>
                <Link href="/courses" className="btn-secondary bg-white/10 border-white/20 text-lg px-8 py-4">
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Course Grid Helper ──────────────────────────────────────────────
function CourseGrid({ courses, loading }: { courses: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="course-card h-72 animate-pulse bg-surface-800/50" />
        ))}
      </div>
    );
  }

  if (!courses.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
