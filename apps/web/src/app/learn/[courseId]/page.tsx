// ─────────────────────────────────────────────────────────────────────
//  Video Player / Learn Page — The actual course player UI
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactPlayer from 'react-player';
import {
  ChevronLeft, CheckCircle, Circle, ChevronDown, ChevronRight,
  Award, BookOpen, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function LearnPage({ params }: { params: { courseId: string } }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const watchedSeconds = useRef(0);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }

    const load = async () => {
      try {
        // Verify enrollment
        const { data: enrollData } = await api.get(`/enrollments/${params.courseId}/check`);
        if (!enrollData.isEnrolled) {
          toast.error('Please enroll to access this course');
          router.push(`/courses/${params.courseId}`);
          return;
        }

        const [courseRes, progressRes] = await Promise.all([
          api.get(`/courses/${params.courseId}`),
          api.get(`/progress/${params.courseId}`),
        ]);

        setCourse(courseRes.data);
        setProgress(progressRes.data);

        // Open first section by default
        if (courseRes.data.sections?.length) {
          setOpenSection(courseRes.data.sections[0].id);
          // Start with first non-completed lesson
          const firstLesson = courseRes.data.sections[0]?.lessons?.[0];
          if (firstLesson) setActiveLesson(firstLesson);
        }
      } catch (error) {
        console.error('Failed to load course:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.courseId, user, router]);

  const isLessonCompleted = (lessonId: string) => {
    return progress?.lessons?.find((l: any) => l.id === lessonId)?.progress?.isCompleted || false;
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    watchedSeconds.current = Math.round(state.playedSeconds);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    setCompletingLesson(true);
    try {
      await api.post('/progress', {
        lessonId: activeLesson.id,
        watchedSeconds: watchedSeconds.current,
        isCompleted: true,
      });
      toast.success('Lesson completed! ✅');

      // Refresh progress
      const { data } = await api.get(`/progress/${params.courseId}`);
      setProgress(data);

      // Auto-advance to next lesson
      goToNextLesson();
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setCompletingLesson(false);
    }
  };

  const goToNextLesson = () => {
    if (!course) return;
    let found = false;
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (found) { setActiveLesson(lesson); setOpenSection(section.id); return; }
        if (lesson.id === activeLesson?.id) found = true;
      }
    }
  };

  if (isLoading) return (
    <div className="h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return null;

  const completedCount = progress?.completedLessons || 0;
  const totalLessons = progress?.totalLessons || 0;
  const pct = progress?.percentage || 0;

  return (
    <div className="h-screen flex overflow-hidden bg-surface-950">

      {/* ─── Left Sidebar (Curriculum) ─────────────────────────────── */}
      <div className="w-80 bg-surface-900 border-r border-white/5 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <Link
            href={`/courses/${params.courseId}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ChevronLeft size={16} /> Back to course
          </Link>
          <h2 className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {course.title}
          </h2>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>{completedCount}/{totalLessons} completed</span>
              <span className="text-brand-400 font-medium">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="flex-1 overflow-y-auto py-2">
          {course.sections?.map((section: any, sIdx: number) => (
            <div key={section.id}>
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-3
                           hover:bg-white/3 text-left transition-colors"
              >
                <div>
                  <span className="text-white text-xs font-medium">
                    Section {sIdx + 1}: {section.title}
                  </span>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {section.lessons?.filter((l: any) => isLessonCompleted(l.id)).length}/
                    {section.lessons?.length} completed
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform
                    ${openSection === section.id ? 'rotate-180' : ''}`}
                />
              </button>

              {openSection === section.id && (
                <div className="bg-surface-950/50">
                  {section.lessons?.map((lesson: any, lIdx: number) => {
                    const completed = isLessonCompleted(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left
                                    transition-colors border-l-2 text-xs
                          ${isActive
                            ? 'border-brand-500 bg-brand-500/8 text-white'
                            : 'border-transparent hover:bg-white/3 text-slate-400'
                          }`}
                      >
                        {completed ? (
                          <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="leading-snug">{lesson.title}</div>
                          <div className="text-slate-500 mt-0.5">{lesson.duration}m</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Certificate Button */}
        {pct === 100 && (
          <div className="p-4 border-t border-white/5">
            <button className="w-full btn-accent py-2.5 text-sm">
              <Award size={16} /> Download Certificate
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Player Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {activeLesson?.videoUrl ? (
            <ReactPlayer
              url={activeLesson.videoUrl}
              width="100%"
              height="100%"
              controls
              onProgress={handleProgress}
              config={{
                youtube: { playerVars: { modestbranding: 1 } },
              }}
            />
          ) : (
            <div className="text-center text-slate-500">
              <BookOpen size={48} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Select a lesson to start learning</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        {activeLesson && (
          <div className="bg-surface-900 border-t border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{activeLesson.title}</h3>
                <p className="text-slate-400 text-sm">{activeLesson.duration} min</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={goToNextLesson} className="btn-secondary py-2 text-sm">
                  Next <ChevronRight size={16} />
                </button>
                {!isLessonCompleted(activeLesson.id) && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={completingLesson}
                    className="btn-primary py-2 text-sm disabled:opacity-70"
                  >
                    <CheckCircle size={16} />
                    {completingLesson ? 'Saving...' : 'Mark Complete'}
                  </button>
                )}
                {isLessonCompleted(activeLesson.id) && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle size={16} className="fill-emerald-400" />
                    Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
