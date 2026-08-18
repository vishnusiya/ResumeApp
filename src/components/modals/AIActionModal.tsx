import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, RotateCw, Wand2, Columns, Loader2 } from 'lucide-react';
import type { ResumeSection } from '../../types/resume';
import { SECTION_AI_ACTIONS, generateAISuggestion, formatDiffHtml } from '../../utils/aiEngine';
import type { DualPassAIResult } from '../../utils/aiEngine';
import { aiRewriteApi } from '../../services/api';

interface AIActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: ResumeSection;
  onApplyAISuggestion: (suggestion: DualPassAIResult) => void;
}

export const AIActionModal: React.FC<AIActionModalProps> = ({
  isOpen,
  onClose,
  section,
  onApplyAISuggestion,
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string>('results_driven');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSideBySide, setIsSideBySide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<DualPassAIResult>(() =>
    generateAISuggestion(section?.type || 'summary', section?.title || 'SUMMARY', section?.contentHtml || '', 'results_driven')
  );

  useEffect(() => {
    if (isOpen && section) {
      const actions = SECTION_AI_ACTIONS[section.type] || [];
      const defaultAction = actions[0]?.id || 'results_driven';
      setSelectedActionId(defaultAction);
      setSuggestion(generateAISuggestion(section.type, section.title, section.contentHtml, defaultAction));
    }
  }, [isOpen, section?.id, section?.contentHtml]);

  if (!isOpen || !section) return null;

  const actions = SECTION_AI_ACTIONS[section.type] || SECTION_AI_ACTIONS.summary || [];

  const handleGenerate = async (actionId?: string) => {
    const act = actionId || selectedActionId;
    setSelectedActionId(act);
    setIsLoading(true);
    try {
      const newSug = await aiRewriteApi(
        section.type,
        section.title,
        section.contentHtml,
        act,
        customPrompt
      );
      setSuggestion(newSug);
    } catch {
      const fallback = generateAISuggestion(section.type, section.title, section.contentHtml, act, customPrompt);
      setSuggestion(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplyAISuggestion(suggestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Dual-Pass AI Rewrite: {section.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSideBySide(!isSideBySide)}
              className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Side-by-Side Comparison"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSideBySide ? 'Diff View' : 'Side-by-Side'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* 1. Comparison View: Formatter Agent Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pass 2: Formatter Agent Output</span>
              </label>
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                <span>{isLoading ? 'Enhancing...' : 'Regenerate'}</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 border border-blue-200 rounded-xl bg-blue-50/20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">Running Dual-Pass AI Agent analysis...</span>
              </div>
            ) : isSideBySide ? (
              /* Side-by-Side Comparison */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 max-h-[250px] overflow-y-auto">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Original Section
                  </div>
                  <div
                    className="text-xs leading-relaxed text-slate-700"
                    dangerouslySetInnerHTML={{ __html: suggestion.originalText }}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1.5 max-h-[250px] overflow-y-auto">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-blue-700 flex items-center justify-between">
                    <span>AI Rewritten (STAR / Metrics)</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                      Enhanced
                    </span>
                  </div>
                  <div
                    className="text-xs leading-relaxed text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: formatDiffHtml(suggestion.originalText, suggestion.suggestedText),
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Single Diff View */
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 text-xs leading-relaxed text-slate-800 max-h-[250px] overflow-y-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatDiffHtml(suggestion.originalText, suggestion.suggestedText),
                  }}
                />
              </div>
            )}

            <p className="text-[11px] text-slate-500 italic">
              💡 {suggestion.explanation}
            </p>
          </div>

          {/* 2. Custom Instruction Box */}
          <div className="pt-1">
            <label className="font-bold uppercase tracking-wider text-slate-900 block mb-1.5 text-[11px]">
              Custom Prompt or Specific Job Description Focus
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Optimize for Senior Python / Azure Architect role with STAR format..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={() => handleGenerate()}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Execute</span>
              </button>
            </div>
          </div>

          {/* 3. Goal Action Chips */}
          <div className="pt-1">
            <label className="font-bold uppercase tracking-wider text-slate-900 block mb-2 text-[11px]">
              Or Select Transformation Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => handleGenerate(act.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    selectedActionId === act.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-base">{act.icon}</span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 text-xs">{act.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Resume</span>
          </button>
        </div>
      </div>
    </div>
  );
};
