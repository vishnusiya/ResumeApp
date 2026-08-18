import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  RotateCw, 
  Wand2, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Target,
  TrendingUp,
  Award,
  Minimize2
} from 'lucide-react';
import type { ResumeSection } from '../../types/resume';
import { generateAllSectionSuggestions, applyBatchOptimizations, formatDiffHtml } from '../../utils/aiEngine';
import type { BatchSectionSuggestion } from '../../utils/aiEngine';
import { aiRewriteApi } from '../../services/api';

interface BatchAIOptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ResumeSection[];
  onApplyAll: (updatedSections: ResumeSection[]) => void;
}

interface StrategyOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const STRATEGIES: StrategyOption[] = [
  {
    id: 'results_driven',
    title: 'Results-Driven & Quantified Metrics',
    description: 'Injects performance multipliers, cost reductions, throughput improvements, and validated metrics across all sections.',
    icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
    badge: 'Max Impact',
  },
  {
    id: 'star_method',
    title: 'STAR Method & Strong Action Verbs',
    description: 'Converts duties into Situation-Task-Action-Result achievement statements with executive verbs.',
    icon: <Target className="w-4 h-4 text-blue-600" />,
    badge: 'ATS Standard',
  },
  {
    id: 'executive_tone',
    title: 'Executive Leadership & Strategic Tone',
    description: 'Elevates vocabulary with strategic, C-suite authority, program governance, and scale.',
    icon: <Award className="w-4 h-4 text-purple-600" />,
    badge: 'Senior & C-Level',
  },
  {
    id: 'condense_1page',
    title: 'Condense for Strict 1-Page Layout',
    description: 'Tightens phrasing and eliminates fluff while preserving 100% of crucial keywords.',
    icon: <Minimize2 className="w-4 h-4 text-amber-600" />,
    badge: 'High Density',
  },
];

export const BatchAIOptimizeModal: React.FC<BatchAIOptimizeModalProps> = ({
  isOpen,
  onClose,
  sections,
  onApplyAll,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<BatchSectionSuggestion[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string>('');

  useEffect(() => {
    if (isOpen && sections.length > 0) {
      const allIds = new Set(sections.map((s) => s.id));
      setSelectedSectionIds(allIds);
      setActivePreviewId(sections[0].id);
      setSelectedStrategy('');
      setHasGenerated(false);
      setCustomPrompt('');
      setIsCustomMode(false);

      // Default: show exact current/original content without running any AI modifications
      const initialSuggestions: BatchSectionSuggestion[] = sections.map((sec) => ({
        sectionId: sec.id,
        sectionTitle: sec.title,
        sectionType: sec.type,
        originalText: sec.contentHtml,
        suggestedText: sec.contentHtml,
        actionTitle: 'Current Content (Unchanged)',
        metricsAdded: [],
      }));
      setSuggestions(initialSuggestions);
    }
  }, [isOpen, sections]);

  if (!isOpen) return null;

  const runBatchGeneration = async (strategy: string, prompt?: string) => {
    setIsLoading(true);
    setHasGenerated(true);
    try {
      // Only process selected sections, preserve unselected as-is
      const targetSections = sections.filter((s) => selectedSectionIds.has(s.id));
      
      // 1. Cross-section deduplication and batch generation
      const batchResults = generateAllSectionSuggestions(targetSections, strategy, prompt);

      // 2. Try remote API enhancement in parallel if available
      const promises = targetSections.map(async (sec) => {
        try {
          const res = await aiRewriteApi(
            sec.type,
            sec.title,
            sec.contentHtml,
            strategy,
            prompt
          );
          return {
            sectionId: sec.id,
            sectionTitle: sec.title,
            sectionType: sec.type,
            originalText: sec.contentHtml,
            suggestedText: res.suggestedText,
            actionTitle: res.actionTitle,
            metricsAdded: res.metricsAdded || [],
          };
        } catch {
          const fallback = batchResults.find((b) => b.sectionId === sec.id) || {
            sectionId: sec.id,
            sectionTitle: sec.title,
            sectionType: sec.type,
            originalText: sec.contentHtml,
            suggestedText: sec.contentHtml,
            actionTitle: 'Optimized',
            metricsAdded: [],
          };
          return fallback;
        }
      });

      const updatedSelected = await Promise.all(promises);

      // Merge back with unselected sections
      const mergedSuggestions = sections.map((sec) => {
        const found = updatedSelected.find((u) => u.sectionId === sec.id);
        if (found) return found;
        return {
          sectionId: sec.id,
          sectionTitle: sec.title,
          sectionType: sec.type,
          originalText: sec.contentHtml,
          suggestedText: sec.contentHtml,
          actionTitle: 'Preserved Original',
          metricsAdded: [],
        };
      });

      setSuggestions(mergedSuggestions);
    } catch (err) {
      console.warn('Batch generation fallback:', err);
      const fallbackResults = generateAllSectionSuggestions(sections, strategy, prompt);
      setSuggestions(fallbackResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategyChange = (stratId: string) => {
    setSelectedStrategy(stratId);
    setIsCustomMode(false);
    runBatchGeneration(stratId, undefined);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setIsCustomMode(true);
    setSelectedStrategy('');
    runBatchGeneration('results_driven', customPrompt);
  };

  const toggleSectionSelect = (id: string) => {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllSections = () => {
    setSelectedSectionIds(new Set(sections.map((s) => s.id)));
  };

  const handleApply = () => {
    const filteredSuggestions = suggestions.filter((s) => selectedSectionIds.has(s.sectionId));
    const updated = applyBatchOptimizations(sections, filteredSuggestions);
    onApplyAll(updated);
    onClose();
  };

  const activeSuggestion = suggestions.find((s) => s.sectionId === activePreviewId) || suggestions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Batch AI Resume Transformation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {sections.length} Sections
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Select an optimization goal or enter a unified custom prompt to transform selected sections
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* 1. Review Sections Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Review Sections ({selectedSectionIds.size} of {sections.length} Selected)</span>
              </div>
              <div className="flex items-center gap-3">
                {selectedSectionIds.size < sections.length && (
                  <button
                    onClick={selectAllSections}
                    className="text-[11px] text-slate-600 hover:text-blue-600 font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                )}
                {hasGenerated && (
                  <button
                    onClick={() => runBatchGeneration(selectedStrategy || 'results_driven', isCustomMode ? customPrompt : undefined)}
                    disabled={isLoading}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                    <span>{isLoading ? 'Transforming...' : 'Re-run'}</span>
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 border border-blue-200 rounded-2xl bg-blue-50/30 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  Dual-Pass AI analyzing and unifying {selectedSectionIds.size} selected sections...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {/* Left Section List Tabs */}
                <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-2 space-y-1 max-h-[260px] overflow-y-auto">
                  {suggestions.map((sug) => {
                    const isSelected = selectedSectionIds.has(sug.sectionId);
                    const isActive = sug.sectionId === activePreviewId;
                    return (
                      <div
                        key={sug.sectionId}
                        onClick={() => setActivePreviewId(sug.sectionId)}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSectionSelect(sug.sectionId);
                            }}
                            className="rounded text-blue-600 cursor-pointer accent-blue-600"
                          />
                          <span className="font-semibold text-xs truncate">
                            {sug.sectionTitle}
                          </span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    );
                  })}
                </div>

                {/* Right Diff Preview */}
                <div className="md:col-span-8 p-4 max-h-[260px] overflow-y-auto space-y-2">
                  {activeSuggestion && (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {activeSuggestion.sectionTitle}
                          </h4>
                          <span className="text-[10px] text-blue-600 font-medium">
                            {activeSuggestion.actionTitle}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          hasGenerated
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-slate-600 bg-slate-100'
                        }`}>
                          {hasGenerated ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AI Optimized
                            </>
                          ) : (
                            'Original (Unchanged)'
                          )}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        hasGenerated
                          ? 'bg-blue-50/30 border-blue-100 text-slate-800'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700'
                      }`}>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: hasGenerated
                              ? formatDiffHtml(activeSuggestion.originalText, activeSuggestion.suggestedText)
                              : activeSuggestion.originalText,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Custom Prompt Input */}
          <form onSubmit={handleCustomSubmit} className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-900 block text-[11px]">
                Prompt AI Across Selected Sections (e.g. Deduplication, Job Tailoring, Skill Injections)
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Takes all selected sections together</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. please remove duplicate contents and align skills across all sections..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/40"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || isLoading}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Apply to Selected ({selectedSectionIds.size})</span>
              </button>
            </div>
          </form>

          {/* 3. Strategy Selection Cards (Optimized & Compact) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold uppercase tracking-wider text-slate-900 block text-[11px]">
                Or Select Resume-Wide Optimization Goal
              </label>
              <span className="text-[10px] text-slate-400">1-click preset transformations</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STRATEGIES.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => handleStrategyChange(strat.id)}
                  title={strat.description}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                    selectedStrategy === strat.id && !isCustomMode
                      ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                      {strat.icon}
                    </div>
                    <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {strat.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-1">
                      {strat.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {strat.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Will update <strong>{selectedSectionIds.size}</strong> of {sections.length} sections
            </span>
            <button
              onClick={handleApply}
              disabled={selectedSectionIds.size === 0 || isLoading || !hasGenerated}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {selectedSectionIds.size === sections.length ? 'Apply to Entire Resume' : `Apply to ${selectedSectionIds.size} Selected Sections`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
