// ─────────────────────────────────────────────────────────────────────
//  Courses Listing Page
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { SearchBar } from '@/components/search/SearchBar';
import { api } from '@/lib/api';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const SORT_OPTIONS = [
  { value: '', label: 'Most Relevant' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const levelParam = searchParams.get('level') || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(levelParam);
  const [selectedSort, setSelectedSort] = useState(sortBy);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 12;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data: any;
        if (query) {
          const res = await api.get('/search', {
            params: { q: query, level: selectedLevel, sortBy: selectedSort, page, limit },
          });
          setCourses(res.data.hits || []);
          setTotal(res.data.totalHits || 0);
        } else {
          const res = await api.get('/courses', {
            params: { level: selectedLevel, page, limit },
          });
          setCourses(res.data.data || []);
          setTotal(res.data.meta?.total || 0);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, selectedLevel, selectedSort, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          {query ? `Results for "${query}"` : 'All Courses'}
        </h1>
        <p className="text-slate-400">
          {loading ? 'Loading...' : `${total.toLocaleString()} courses found`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-2xl">
        <SearchBar />
      </div>

      {/* Filters & Sort Row */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Filter Toggle (mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 btn-secondary py-2"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>

        {/* Level Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm">Level:</span>
          {['', ...LEVELS].map((level) => (
            <button
              key={level || 'all'}
              onClick={() => { setSelectedLevel(level); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${selectedLevel === level
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              {level || 'All'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-400 text-sm">Sort by:</span>
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
              className="appearance-none input py-2 pr-8 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2
                                               text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="course-card h-80 animate-pulse bg-surface-800/50" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
          <p className="text-slate-400">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn-secondary py-2 px-4 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors
                ${page === p
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="btn-secondary py-2 px-4 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
