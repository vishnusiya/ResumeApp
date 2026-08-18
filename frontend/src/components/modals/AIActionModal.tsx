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
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSideBySide, setIsSideBySide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [suggestion, setSuggestion] = useState<DualPassAIResult>(() => ({
    id: `init-${section?.id || 'sec'}`,
    sectionId: section?.type || 'summary',
    actionTitle: 'Original Section',
    originalText: section?.contentHtml || '',
    suggestedText: section?.contentHtml || '',
    explanation: 'Ready for AI Enhancement based on the original section.',
    applied: false,
    metricsAdded: [],
    editorAgentPlan: {
      intent: 'Ready for AI execution',
      factsPreserved: ['Original content preserved'],
      actionSteps: ['Awaiting prompt or goal selection'],
    },
  }));

  useEffect(() => {
    if (isOpen && section) {
      setSelectedActionId('');
      setCustomPrompt('');
      setHasGenerated(false);
      setSuggestion({
        id: `init-${section.id}`,
        sectionId: section.type,
        actionTitle: 'Original Section',
        originalText: section.contentHtml,
        suggestedText: section.contentHtml,
        explanation: 'Ready for AI Enhancement based on the original section.',
        applied: false,
        metricsAdded: [],
        editorAgentPlan: {
          intent: 'Ready for AI execution',
          factsPreserved: ['Original content preserved'],
          actionSteps: ['Awaiting prompt or goal selection'],
        },
      });
    }
  }, [isOpen, section?.id, section?.contentHtml]);

  if (!isOpen || !section) return null;

  const actions = SECTION_AI_ACTIONS[section.type] || SECTION_AI_ACTIONS.summary || [];

  // Execute custom prompt directly against the original section content
  const handleExecutePrompt = async () => {
    if (!customPrompt.trim()) return;
    setSelectedActionId('');
    setIsLoading(true);
    try {
      const newSug = await aiRewriteApi(
        section.type,
        section.title,
        section.contentHtml, // ALWAYS based strictly on original section content
        'custom_prompt',
        customPrompt.trim()
      );
      setSuggestion(newSug);
      setHasGenerated(true);
    } catch {
      const fallback = generateAISuggestion(section.type, section.title, section.contentHtml, 'results_driven', customPrompt.trim());
      setSuggestion(fallback);
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute goal tile directly against the original section content
  const handleGoalClick = async (actionId: string) => {
    setSelectedActionId(actionId);
    setCustomPrompt('');
    setIsLoading(true);
    try {
      const newSug = await aiRewriteApi(
        section.type,
        section.title,
        section.contentHtml, // ALWAYS based strictly on original section content
        actionId,
        undefined
      );
      setSuggestion(newSug);
      setHasGenerated(true);
    } catch {
      const fallback = generateAISuggestion(section.type, section.title, section.contentHtml, actionId);
      setSuggestion(fallback);
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (customPrompt.trim()) {
      handleExecutePrompt();
    } else if (selectedActionId) {
      handleGoalClick(selectedActionId);
    } else {
      handleGoalClick('results_driven');
    }
  };

  const handleApply = () => {
    if (hasGenerated) {
      onApplyAISuggestion(suggestion);
    }
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* 1. Comparison View: Formatter Agent Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pass 2: Formatter Agent Output</span>
              </label>
              {hasGenerated && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                  <span>{isLoading ? 'Enhancing...' : 'Regenerate'}</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 border border-blue-200 rounded-xl bg-blue-50/20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">Running Dual-Pass AI Agent on original content...</span>
              </div>
            ) : isSideBySide ? (
              /* Side-by-Side Comparison */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 max-h-[220px] overflow-y-auto">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Original Section
                  </div>
                  <div
                    className="text-xs leading-relaxed text-slate-700"
                    dangerouslySetInnerHTML={{ __html: suggestion.originalText }}
                  />
                </div>

                {hasGenerated ? (
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1.5 max-h-[220px] overflow-y-auto animate-in fade-in">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-blue-700 flex items-center justify-between">
                      <span>AI Rewritten (Original-Based)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
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
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 space-y-2 flex flex-col items-center justify-center text-center max-h-[220px] min-h-[140px]">
                    <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                    <span className="font-bold text-xs text-slate-800">Ready for AI Enhancement</span>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      Type custom instructions in the prompt box below and click <strong>Execute</strong>, or click any goal tile.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Single Diff View */
              hasGenerated ? (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 text-xs leading-relaxed text-slate-800 max-h-[220px] overflow-y-auto animate-in fade-in">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatDiffHtml(suggestion.originalText, suggestion.suggestedText),
                    }}
                  />
                </div>
              ) : (
                <div className="p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50/40 text-center space-y-1.5">
                  <span className="font-bold text-xs text-slate-800">Ready for AI Enhancement</span>
                  <p className="text-[11px] text-slate-500">
                    Type instructions below and click Execute, or select a goal to generate an AI rewrite based on the original section.
                  </p>
                </div>
              )
            )}

            {hasGenerated && (
              <p className="text-[11px] text-slate-500 italic">
                💡 {suggestion.explanation}
              </p>
            )}
          </div>

          {/* 2. Custom Instruction Box (Spacious Textarea + Isolated Execution) */}
          <div className="pt-1 space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-900 block text-[11px]">
              Custom Prompt or Specific Job Description Focus
            </label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleExecutePrompt();
                  }
                }}
                placeholder="e.g. Optimize for Senior Python / Azure Architect role with STAR format, emphasize team leadership and quantifiable revenue metrics..."
                rows={3}
                className="w-full p-3 pr-24 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={handleExecutePrompt}
                disabled={isLoading || !customPrompt.trim()}
                className="absolute bottom-2.5 right-2.5 py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Execute</span>
              </button>
            </div>
          </div>

          {/* 3. Goal Action Chips (Minimized Compact Tiles) */}
          <div className="pt-1 space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-slate-900 block text-[11px]">
              Or Select Transformation Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {actions.map((act) => {
                const isSelected = selectedActionId === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleGoalClick(act.id)}
                    className={`py-1.5 px-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <span className="text-sm shrink-0">{act.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h5 className={`font-bold text-[11px] truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {act.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 truncate leading-tight">
                        {act.description}
                      </p>
                    </div>
                  </button>
                );
              })}
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
            disabled={!hasGenerated}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Resume</span>
          </button>
        </div>
      </div>
    </div>
  );
};
