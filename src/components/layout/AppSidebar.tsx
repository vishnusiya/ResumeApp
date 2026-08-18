import React from 'react';
import {
  LayoutDashboard,
  FileEdit,
  Sparkles,
  FileText
} from 'lucide-react';

export type AppView = 'dashboard' | 'editor';

interface AppSidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenGenerateResume: () => void;
  candidateName?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeView,
  onNavigate,
  onOpenGenerateResume,
  candidateName,
}) => {
  const initials = candidateName
    ? candidateName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RS';

  return (
    <aside className="no-print w-20 md:w-24 bg-white border-r border-slate-200 flex flex-col items-center py-5 select-none shrink-0 z-40 justify-between shadow-xs">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="AI Resume Studio Home"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>
        <span className="text-[10px] font-bold text-slate-800 tracking-tight mt-0.5 text-center leading-tight">
          Resume<br />Studio
        </span>
      </div>

      {/* Navigation Items (Only Dashboard, Resume Editor, Generate Resume) */}
      <nav className="flex flex-col items-center gap-3 w-full px-2">
        {/* 1. Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
            activeView === 'dashboard'
              ? 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
          title="Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="truncate">Dashboard</span>
        </button>

        {/* 2. Resume Editor */}
        <button
          onClick={() => onNavigate('editor')}
          className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
            activeView === 'editor'
              ? 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
          }`}
          title="Resume Editor"
        >
          <FileEdit className={`w-5 h-5 ${activeView === 'editor' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="truncate">Editor</span>
        </button>

        {/* 3. Generate Resume */}
        <button
          onClick={onOpenGenerateResume}
          className="w-full py-2.5 px-1 rounded-xl flex flex-col items-center gap-1 text-[11px] font-bold text-purple-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100 hover:border-purple-200 transition-all cursor-pointer group"
          title="Generate Resume (AI Tailoring & Merger)"
        >
          <div className="relative">
            <FileText className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="truncate text-center">Generate</span>
        </button>
      </nav>

      {/* Bottom User Avatar */}
      <div className="flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-default"
          title={candidateName || 'Candidate Profile'}
        >
          {initials}
        </div>
      </div>
    </aside>
  );
};
