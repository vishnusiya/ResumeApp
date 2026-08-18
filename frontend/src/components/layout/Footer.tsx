import React from 'react';
import { History, Maximize2, Minimize2, Sliders } from 'lucide-react';
import type { ATSScoreBreakdown } from '../../types/resume';

interface FooterProps {
  atsScore: ATSScoreBreakdown;
  pageCount: number;
  wordCount: number;
  lastUpdated: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenATSModal: () => void;
  onOpenVersionHistory: () => void;
  onOpenPageSetup: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  atsScore,
  pageCount,
  wordCount,
  lastUpdated,
  isFullscreen,
  onToggleFullscreen,
  onOpenATSModal,
  onOpenVersionHistory,
  onOpenPageSetup,
}) => {
  const getBadgeBg = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#2563eb';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <footer className="no-print h-12 bg-white border-t border-slate-200 px-5 flex items-center justify-between text-xs text-slate-600 shrink-0 z-20 select-none shadow-xs">
      {/* Left Section: ATS Score & Live Metrics */}
      <div className="flex items-center gap-5">
        {/* ATS Score Clickable Badge */}
        <button
          onClick={onOpenATSModal}
          className="flex items-center gap-2.5 px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
          title="Click to view full ATS Optimization report & Job Description match"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg className="w-6 h-6 transform -rotate-90">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke={getBadgeBg(atsScore.overallScore)}
                strokeWidth="2.5"
                strokeDasharray={56.5}
                strokeDashoffset={56.5 - (56.5 * atsScore.overallScore) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-slate-800">
              {atsScore.overallScore}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              ATS Score:
            </span>
            <span className="font-bold text-slate-900">
              {atsScore.overallScore} / 100
            </span>
          </div>
        </button>

        {/* Readability Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Readability:</span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {atsScore.readabilityRating}
          </span>
        </div>

        {/* Live Page Count */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
          <span className="text-slate-500">Pages:</span>
          <span className="font-semibold text-slate-800">{pageCount}</span>
        </div>

        {/* Word Count */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
          <span className="text-slate-500">Word Count:</span>
          <span className="font-semibold text-slate-800">{wordCount}</span>
        </div>

        {/* Last Updated */}
        <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200 pl-4 text-slate-400">
          <span>Last Updated:</span>
          <span className="text-slate-600">{lastUpdated}</span>
        </div>
      </div>

      {/* Right Section: Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenVersionHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Version History</span>
        </button>

        <button
          onClick={onOpenPageSetup}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Page Setup</span>
        </button>

        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Fullscreen</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
