// ─────────────────────────────────────────────────────────────────────
//  Course Detail Page
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Users, Clock, Play, Check, BookOpen, Award,
  Heart, Share2, ChevronDown, Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDuration, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CourseCard } from '@/components/courses/CourseCard';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, similarRes] = await Promise.all([
          api.get(`/courses/${params.id}`),
          api.get(`/recommendations/similar/${params.id}?limit=4`),
        ]);
        setCourse(courseRes.data);
        setSimilar(similarRes.data);

        if (user) {
          const enrollRes = await api.get(`/enrollments/${params.id}/check`);
          setIsEnrolled(enrollRes.data.isEnrolled);
        }
      } catch (error) {
        console.error('Failed to load course:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, user]);

  // Log VIEW interaction
  useEffect(() => {
    if (user && course) {
      api.post('/interactions', { courseId: course.id, type: 'VIEW' }).catch(() => {});
    }
  }, [user, course]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll');
      return;
    }
    setEnrolling(true);
    try {
      await api.post(`/enrollments/${params.id}`);
      setIsEnrolled(true);
      toast.success('Successfully enrolled! 🎉');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    try {
      const { data } = await api.post(`/wishlist/${params.id}`);
      setIsWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div className="pt-20 animate-pulse">
      <div className="bg-surface-900 h-64 w-full" />
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="h-8 bg-surface-800 rounded w-3/4" />
          <div className="h-4 bg-surface-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (!course) return <div className="pt-24 text-center text-slate-400">Course not found</div>;

  const totalLessons = course.sections?.reduce(
    (sum: number, s: any) => sum + (s.lessons?.length || 0), 0
  ) || 0;

  return (
    <div className="pt-16 min-h-screen">
      {/* ─── Hero Banner ───────────────────────────────────────────── */}
      <div className="bg-surface-900 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left content */}
            <div className="lg:col-span-8">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {course.category && (
                  <span className="badge-blue">{course.category.name}</span>
                )}
                <span className={`badge ${
                  course.level === 'BEGINNER' ? 'badge-green' :
                  course.level === 'INTERMEDIATE' ? 'badge-blue' : 'badge-orange'
                }`}>
                  {course.level}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4 leading-tight">
                {course.title}
              </h1>

              <p className="text-slate-300 text-lg mb-6">{course.shortDesc}</p>

              {/* Rating row */}
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= Math.round(course.avgRating)
                          ? 'fill-amber-400' : 'fill-slate-600'}
                      />
                    ))}
                  </div>
                  <span className="text-amber-400 font-bold">{course.avgRating.toFixed(1)}</span>
                  <span className="text-slate-400 text-sm">
                    ({course._count?.ratings?.toLocaleString()} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Users size={14} />
                  {course.totalStudents.toLocaleString()} students
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Clock size={14} />
                  {formatDuration(course.duration)}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <BookOpen size={14} />
                  {totalLessons} lessons
                </div>
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/30 flex items-center
                                  justify-center text-brand-300 font-bold text-sm">
                    {course.instructor.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{course.instructor.name}</div>
                    <div className="text-slate-400 text-xs">Instructor</div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Enrollment Card ─────────────────────────────────── */}
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <div className="glass-card p-6 glow-sm">
                {/* Preview thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-surface-800">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-600
                                    flex items-center justify-center">
                      <Play size={40} className="text-white/80" />
                    </div>
                  )}
                  {course.previewVideo && (
                    <button className="absolute inset-0 flex items-center justify-center
                                       bg-black/40 hover:bg-black/50 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm
                                      flex items-center justify-center hover:scale-110 transition-transform">
                        <Play size={22} className="text-white fill-white ml-1" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-white">
                    {formatPrice(course.price)}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="ml-3 text-slate-500 line-through text-lg">
                      {formatPrice(course.originalPrice)}
                    </span>
                  )}
                </div>

                {/* CTA Buttons */}
                {isEnrolled ? (
                  <Link
                    href={`/learn/${course.id}`}
                    className="w-full btn-primary justify-center text-base mb-3"
                  >
                    <Play size={18} /> Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full btn-primary justify-center text-base mb-3
                               disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleWishlist}
                    className={`flex-1 btn-secondary py-2.5 justify-center
                      ${isWishlisted ? 'text-rose-400 border-rose-500/30 bg-rose-500/5' : ''}`}
                  >
                    <Heart size={16} className={isWishlisted ? 'fill-rose-400' : ''} />
                    {isWishlisted ? 'Saved' : 'Wishlist'}
                  </button>
                  <button className="flex-1 btn-secondary py-2.5 justify-center">
                    <Share2 size={16} /> Share
                  </button>
                </div>

                {/* Includes */}
                <div className="mt-6 space-y-2">
                  <p className="text-white font-semibold text-sm mb-3">This course includes:</p>
                  {[
                    { icon: Clock, text: `${formatDuration(course.duration)} of content` },
                    { icon: BookOpen, text: `${totalLessons} lessons` },
                    { icon: Award, text: 'Certificate of completion' },
                    { icon: Check, text: 'Full lifetime access' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-slate-300 text-sm">
                      <Icon size={14} className="text-brand-400 shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-12">
          <div className="lg:col-span-8">

            {/* What you'll learn */}
            {course.objectives?.length > 0 && (
              <section className="glass-card p-8 mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  What You'll Learn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.objectives.map((obj: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={16} className="text-brand-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300 text-sm">{obj}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Curriculum */}
            {course.sections?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  Course Curriculum
                </h2>
                <div className="space-y-3">
                  {course.sections.map((section: any) => (
                    <div key={section.id} className="glass-card overflow-hidden">
                      <button
                        onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform
                              ${openSection === section.id ? 'rotate-180' : ''}`}
                          />
                          <span className="text-white font-medium">{section.title}</span>
                        </div>
                        <span className="text-slate-400 text-sm">
                          {section.lessons?.length || 0} lessons
                        </span>
                      </button>

                      {openSection === section.id && (
                        <div className="border-t border-white/5">
                          {section.lessons?.map((lesson: any) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-4 px-6 py-3
                                         border-b border-white/3 last:border-0"
                            >
                              {lesson.isFree ? (
                                <Play size={14} className="text-brand-400 shrink-0" />
                              ) : (
                                <Lock size={14} className="text-slate-500 shrink-0" />
                              )}
                              <span className={`text-sm flex-1
                                ${lesson.isFree ? 'text-white' : 'text-slate-400'}`}>
                                {lesson.title}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {lesson.duration}m
                              </span>
                              {lesson.isFree && (
                                <span className="badge badge-blue text-xs">Preview</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {course.courseSkills?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-4">
                  Skills You'll Gain
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.courseSkills.map(({ skill }: any) => (
                    <span key={skill.name} className="badge-blue">{skill.name}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {course.ratings?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  Student Reviews
                </h2>
                <div className="space-y-4">
                  {course.ratings.map((rating: any) => (
                    <div key={rating.id} className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center
                                        justify-center text-brand-300 font-bold text-sm">
                          {rating.user.name[0]}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{rating.user.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={12} className={s <= rating.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-slate-300 text-sm">{rating.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Similar Courses */}
            {similar.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  You Might Also Like
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {similar.map((c: any) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
