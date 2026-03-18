'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }

    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}&limit=5`);
        setSuggestions(data.hits || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <Search
            size={18}
            className="absolute left-4 text-slate-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search for courses, skills, topics..."
            className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10
                       text-white placeholder-slate-500 text-base
                       focus:outline-none focus:border-brand-500/50 focus:bg-white/10
                       transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-14 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 btn-primary py-2 px-4 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50">
          {suggestions.map((hit: any) => (
            <button
              key={hit.id}
              onClick={() => {
                router.push(`/courses/${hit.id}`);
                setOpen(false);
                setQuery('');
              }}
              className="w-full flex items-center gap-3 px-5 py-3 text-left
                         hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <Search size={14} className="text-slate-500 shrink-0" />
              <div>
                <div className="text-white text-sm font-medium">{hit.title}</div>
                <div className="text-slate-400 text-xs">{hit.instructorName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
