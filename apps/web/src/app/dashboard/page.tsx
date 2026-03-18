// ─────────────────────────────────────────────────────────────────────
//  Dashboard — Student's learning hub
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen, Award, Clock, TrendingUp, Play, CheckCircle, Star, Target,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }

    const load = async () => {
      try {
        const [enrollRes, recoRes] = await Promise.all([
          api.get('/enrollments'),
          api.get('/recommendations/me?limit=4'),
        ]);
        setEnrollments(enrollRes.data);
        setRecommendations(recoRes.data);
      } catch (error) {
        console.error('Dashboard load failed:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, router]);

  if (!user) return null;

  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length;
  const inProgress = enrollments.filter((e) => e.status === 'ACTIVE').length;
  const totalHours = enrollments.reduce((sum, e) => sum + (e.course?.duration || 0) / 60, 0);

  const stats = [
    { icon: BookOpen, label: 'Enrolled', value: enrollments.length, color: 'text-brand-400' },
    { icon: CheckCircle, label: 'Completed', value: completed, color: 'text-emerald-400' },
    { icon: TrendingUp, label: 'In Progress', value: inProgress, color: 'text-amber-400' },
    { icon: Clock, label: 'Hours Learned', value: Math.round(totalHours), color: 'text-purple-400' },
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="bg-surface-900 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white">
                Welcome back, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-slate-400 mt-1">Continue your learning journey</p>
            </div>
            <div className="flex items-center gap-3">
              {(user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && (
                <Link href="/courses/new" className="btn-secondary">
                  Create Course
                </Link>
              )}
              <Link href="/courses" className="btn-primary">
                <BookOpen size={16} /> Find Courses
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card p-5">
                <Icon size={22} className={`${color} mb-3`} />
                <div className="text-3xl font-display font-bold text-white">{value}</div>
                <div className="text-slate-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── My Courses ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white">My Courses</h2>
              <Link href="/dashboard/courses" className="text-brand-400 text-sm hover:text-brand-300">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-surface-800/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <BookOpen size={40} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No courses yet</h3>
                <p className="text-slate-400 mb-4">Start learning something amazing today</p>
                <Link href="/courses" className="btn-primary">Browse Courses</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 5).map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Skill-Gap Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-accent-400" />
                <h3 className="text-white font-semibold">Career Goal</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Set a target role to get personalized skill-gap recommendations
              </p>
              <select className="input mb-3 text-sm">
                <option value="">Select target role...</option>
                <option value="data_scientist">Data Scientist</option>
                <option value="full_stack_developer">Full Stack Developer</option>
                <option value="machine_learning_engineer">ML Engineer</option>
                <option value="devops_engineer">DevOps Engineer</option>
              </select>
              <button className="w-full btn-accent py-2 text-sm">
                Find Skill Gaps
              </button>
            </div>

            {/* Recommended for You */}
            {recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-brand-400" />
                  <h3 className="text-white font-semibold">Recommended for You</h3>
                </div>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-800
                                 hover:bg-surface-700 transition-colors border border-white/5"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500
                                      to-purple-600 flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-white/80" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium leading-tight line-clamp-2">
                          {course.title}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {course.instructor?.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Enrollment Card Component ─────────────────────────────────────────
function EnrollmentCard({ enrollment }: { enrollment: any }) {
  const { course, progress } = enrollment;
  if (!course) return null;

  const pct = progress?.percentage || 0;

  return (
    <div className="glass-card p-5 hover:border-brand-500/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                        flex items-center justify-center shrink-0">
          <BookOpen size={22} className="text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm leading-snug line-clamp-1">
            {course.title}
          </h4>
          <p className="text-slate-400 text-xs mt-0.5">{course.instructor?.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-slate-400 text-xs shrink-0">{pct}%</span>
          </div>
        </div>
        <Link
          href={`/learn/${course.id}`}
          className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/20
                     flex items-center justify-center hover:bg-brand-500/30 transition-colors"
        >
          <Play size={14} className="text-brand-400 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
