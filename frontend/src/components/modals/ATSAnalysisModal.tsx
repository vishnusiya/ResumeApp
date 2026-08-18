import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Sparkles, FileSearch, ArrowRight, Clock } from 'lucide-react';
import type { ATSScoreBreakdown, ResumeData } from '../../types/resume';
import { calculateATSScore } from '../../utils/atsCalculator';

interface ATSAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onApplyOptimization?: () => void;
  onOpenBatchOptimize?: () => void;
}

export const ATSAnalysisModal: React.FC<ATSAnalysisModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onApplyOptimization,
  onOpenBatchOptimize,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [analyzedScore, setAnalyzedScore] = useState<ATSScoreBreakdown>(
    calculateATSScore(resumeData)
  );

  if (!isOpen) return null;

  const handleAnalyzeJD = () => {
    const score = calculateATSScore(resumeData, jobDescription);
    setAnalyzedScore(score);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>ATS Resume Score & Optimizer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Top Score Banner */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-blue-600 shadow-sm flex flex-col items-center justify-center font-black text-slate-900">
                <span className="text-xl leading-none">{analyzedScore.overallScore}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">/ 100</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {analyzedScore.overallScore >= 85 ? 'Strong ATS Readiness' : 'Optimization Recommended'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Readability: <strong className="text-emerald-700">{analyzedScore.readabilityRating}</strong> · Scanned across 5 standard ATS dimensions.
                </p>
              </div>
            </div>

            {onOpenBatchOptimize ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenBatchOptimize();
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Optimize Full Resume</span>
              </button>
            ) : onApplyOptimization && (
              <button
                onClick={() => {
                  onApplyOptimization();
                  onClose();
                }}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-all text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Optimize</span>
              </button>
            )}
          </div>

          {/* Dimension Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-500">Action Verbs</div>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {analyzedScore.actionVerbsScore} <span className="text-xs text-slate-400 font-normal">/ 25</span>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-500">Metrics</div>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {analyzedScore.quantificationScore} <span className="text-xs text-slate-400 font-normal">/ 25</span>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-500">Section Flow</div>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {analyzedScore.sectionCompletenessScore} <span className="text-xs text-slate-400 font-normal">/ 30</span>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-500">Contact Details</div>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                {analyzedScore.contactInfoScore} <span className="text-xs text-slate-400 font-normal">/ 20</span>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <span>Timeline</span>
              </div>
              <div className={`text-lg font-extrabold mt-1 ${analyzedScore.chronologicalScore === 100 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {analyzedScore.chronologicalScore}%
              </div>
            </div>
          </div>

          {/* Chronological Flow Status Banner */}
          {analyzedScore.chronologicalAnalysis && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              analyzedScore.chronologicalAnalysis.isReverseChronological
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Reverse Chronological Order:</strong>{' '}
                  {analyzedScore.chronologicalAnalysis.isReverseChronological
                    ? 'Verified ✓ (Latest roles & degrees appear first)'
                    : 'Timeline inconsistency detected'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analyzedScore.chronologicalAnalysis.isReverseChronological
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-amber-200 text-amber-900'
              }`}>
                {analyzedScore.chronologicalAnalysis.isReverseChronological ? 'Standard Compliant' : 'Needs Review'}
              </span>
            </div>
          )}

          {/* Job Description Matching Scanner */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <FileSearch className="w-4 h-4 text-blue-600" />
                <span>Target Job Description Matcher</span>
              </div>
              {analyzedScore.keywordMatchScore !== undefined && (
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {analyzedScore.keywordMatchScore}% Match Rate
                </span>
              )}
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description (JD) requirements here to scan for matched & missing keywords..."
              rows={3}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <button
              onClick={handleAnalyzeJD}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Scan Keywords</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            {/* Keyword Results */}
            {analyzedScore.matchedKeywords && analyzedScore.matchedKeywords.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-bold text-emerald-700 block mb-1">✓ Matched Keywords ({analyzedScore.matchedKeywords.length}):</span>
                  <div className="flex flex-wrap gap-1">
                    {analyzedScore.matchedKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {analyzedScore.missingKeywords && analyzedScore.missingKeywords.length > 0 && (
                  <div className="mt-2">
                    <span className="font-bold text-amber-700 block mb-1">⚠️ Missing Keywords ({analyzedScore.missingKeywords.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {analyzedScore.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actionable Recommendations Checklist */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-900">
              ATS Optimization Checklist
            </h4>
            <div className="space-y-2">
              {analyzedScore.suggestions.map((sug, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{sug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-slate-200 flex items-center justify-end shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
