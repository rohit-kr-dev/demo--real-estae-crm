import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, LayoutDashboard, Users, Calendar, Building2, DollarSign, Settings, BarChart3 } from 'lucide-react';
import { apiRequest } from '../services/api';

const PAGE_SHORTCUTS = [
  { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
  { label: 'Lead Database', icon: Users, tab: 'leads' },
  { label: 'Follow-ups', icon: Calendar, tab: 'followups' },
  { label: 'Site Visits', icon: Building2, tab: 'site-visits' },
  { label: 'Negotiations', icon: DollarSign, tab: 'negotiations' },
  { label: 'Reports', icon: BarChart3, tab: 'reports' },
  { label: 'Settings', icon: Settings, tab: 'settings' },
];

export default function CommandPalette({ onNavigate, onSelectLead }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  // Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setLeads([]);
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setLeads([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiRequest(`/leads?search=${encodeURIComponent(query)}&limit=5`);
        setLeads(res.leads || []);
      } catch (e) {} finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const allResults = query.trim()
    ? leads.map(l => ({ type: 'lead', label: l.name, sub: l.phone, lead: l }))
    : PAGE_SHORTCUTS.map(p => ({ type: 'page', ...p }));

  const handleSelect = (item) => {
    if (item.type === 'lead') { onSelectLead?.(item.lead.id); }
    else if (item.type === 'page') { onNavigate?.(item.tab); }
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { if (allResults[selectedIdx]) handleSelect(allResults[selectedIdx]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4 z-[100]" onClick={() => setOpen(false)}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search leads or jump to a page..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
          />
          <kbd className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded-lg font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {searching && (
            <div className="px-4 py-3 text-sm text-slate-500 flex items-center space-x-2">
              <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>Searching leads...</span>
            </div>
          )}
          {!searching && allResults.length === 0 && query && (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">No leads found for "{query}"</div>
          )}
          {!searching && allResults.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left transition ${i === selectedIdx ? 'bg-cyan-500/10' : 'hover:bg-slate-800/50'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'lead' ? 'bg-blue-500/10' : 'bg-slate-800'}`}>
                {item.type === 'lead'
                  ? <span className="text-xs font-bold text-blue-400">{item.label[0]?.toUpperCase()}</span>
                  : <item.icon className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                {item.type === 'page' && <p className="text-xs text-slate-500">Navigate to page</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 flex items-center space-x-4 text-[10px] text-slate-600">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
          <span className="ml-auto">Press <kbd className="font-mono">Ctrl+K</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}
