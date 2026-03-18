// ─────────────────────────────────────────────────────────────────────
//  Course Card Component — Reusable card for course listings
// ─────────────────────────────────────────────────────────────────────

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDesc?: string;
    thumbnail?: string;
    price: number;
    level: string;
    avgRating: number;
    totalStudents: number;
    duration?: number;
    instructor?: { name: string; avatar?: string };
    courseSkills?: Array<{ skill: { name: string } }>;
    tags?: string[];
  };
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'badge-green',
  INTERMEDIATE: 'badge-blue',
  ADVANCED: 'badge-orange',
};

// Fallback gradient thumbnails
const GRADIENT_COLORS = [
  'from-brand-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-yellow-500 to-amber-600',
];

export function CourseCard({ course }: CourseCardProps) {
  const gradientIndex = course.id.charCodeAt(0) % GRADIENT_COLORS.length;
  const gradient = GRADIENT_COLORS[gradientIndex];

  return (
    <Link href={`/courses/${course.id}`} className="course-card group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}
                           flex items-center justify-center`}>
            <BookOpen size={40} className="text-white/60" />
          </div>
        )}
        {/* Level badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={LEVEL_COLORS[course.level] || 'badge-blue'}>
            {course.level}
          </span>
        </div>
        {/* Free badge */}
        {course.price === 0 && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-emerald-500 text-white border-0 font-bold">FREE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-brand-500/30 flex items-center
                            justify-center text-brand-300 text-xs font-bold overflow-hidden">
              {course.instructor.avatar ? (
                <Image src={course.instructor.avatar} alt="" width={24} height={24} />
              ) : (
                course.instructor.name[0]
              )}
            </div>
            <span className="text-slate-400 text-xs">{course.instructor.name}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-snug mb-2 line-clamp-2
                       group-hover:text-brand-300 transition-colors">
          {course.title}
        </h3>

        {/* Short desc */}
        {course.shortDesc && (
          <p className="text-slate-500 text-xs mb-3 line-clamp-2">{course.shortDesc}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{course.avgRating.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {course.totalStudents.toLocaleString()}
          </span>
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {Math.round(course.duration / 60)}h
            </span>
          )}
        </div>

        {/* Skills */}
        {course.courseSkills && course.courseSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {course.courseSkills.slice(0, 3).map(({ skill }) => (
              <span key={skill.name} className="badge badge-blue text-xs">
                {skill.name}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            {course.price === 0 ? (
              <span className="text-emerald-400 font-bold">Free</span>
            ) : (
              <span className="text-white font-bold text-lg">
                {formatPrice(course.price)}
              </span>
            )}
          </div>
          <span className="text-brand-400 text-sm font-medium group-hover:translate-x-1
                           transition-transform duration-200">
            Learn →
          </span>
        </div>
      </div>
    </Link>
  );
}
