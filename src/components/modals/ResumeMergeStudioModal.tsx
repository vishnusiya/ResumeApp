import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  Plus,
  Check,
  ArrowRight,
  Loader2,
  Layers,
  History,
  FileCode,
  AlertCircle,
  Tag,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Star,
  RotateCcw,
  FileEdit,
  FolderOpen,
  Trash2
} from 'lucide-react';
import type {
  ResumeData,
  ResumeSourceItem,
  ResumeMergeResponse,
  MergeMode
} from '../../types/resume';
import { uploadResumeApi, mergeResumesApi, generateJDApi } from '../../services/api';
import { extractKeywordsFromJDText } from '../../utils/resumeMerger';

interface JDHistoryEntry {
  id: string;
  prompt: string;
  text: string;
  date: string;
  source: 'ai' | 'paste' | 'upload';
}

const JD_HISTORY_STORAGE_KEY = 'ai_resume_jd_history_v2';

interface ResumeMergeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  onApplyMergedResume: (mergedResume: ResumeData) => void;
}

export const ResumeMergeStudioModal: React.FC<ResumeMergeStudioModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  onApplyMergedResume,
}) => {
  // Stepper: 1: Setup (Resumes & JD), 2: Processing, 3: Results
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Source Resumes State
  const [sourceResumes, setSourceResumes] = useState<ResumeSourceItem[]>([
    {
      id: 'res-primary',
      filename: 'Current Resume (Primary)',
      content: JSON.stringify(currentResume),
      isPrimary: true,
      parsedData: currentResume,
      fileSize: 'Current Editor',
      sectionsCount: currentResume.sections.length,
    },
    {
      id: 'res-secondary-1',
      filename: 'Resume B (Secondary)',
      content: '',
      isPrimary: false,
      parsedData: undefined,
      fileSize: '',
      sectionsCount: 0,
    },
  ]);

  const [activeResumeTab, setActiveResumeTab] = useState<string>('res-primary');
  const [pasteModeMap, setPasteModeMap] = useState<Record<string, boolean>>({});

  // File Upload State & Loader
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target Job Description State
  const [jdTab, setJdTab] = useState<'create_ai' | 'upload' | 'paste' | 'history'>('create_ai');
  const [rolePrompt, setRolePrompt] = useState('');
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isJdGenerated, setIsJdGenerated] = useState(false);

  // Persistent JD History from LocalStorage without Database
  const [jdHistory, setJdHistory] = useState<JDHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(JD_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load JD history from localStorage', e);
    }
    return [
      {
        id: 'jd-init-1',
        prompt: 'Senior Full-Stack Engineer at Fintech Startup',
        text: 'Senior Full-Stack Engineer needed for high-throughput fintech platform. Required: React, Next.js, Node.js, AWS, Microservices, PostgreSQL. Preferred: TypeScript, Docker, Kubernetes, CI/CD.',
        date: 'Recent',
        source: 'ai',
      },
    ];
  });

  // Loading & Merging State
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<ResumeMergeResponse | null>(null);
  const [activePreviewSection, setActivePreviewSection] = useState<string>('summary');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to persist JD history into localStorage
  const addJdToHistory = (promptStr: string, textStr: string, source: 'ai' | 'paste' | 'upload') => {
    if (!textStr || textStr.trim().length < 15) return;
    const newEntry: JDHistoryEntry = {
      id: `jd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      prompt: promptStr.slice(0, 60),
      text: textStr.trim(),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      source,
    };
    setJdHistory((prev) => {
      const filtered = prev.filter((item) => item.text.trim() !== textStr.trim());
      const updated = [newEntry, ...filtered.slice(0, 24)];
      try {
        localStorage.setItem(JD_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save JD history to localStorage', e);
      }
      return updated;
    });
  };

  const deleteJdHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJdHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(JD_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update JD history in localStorage', e);
      }
      return updated;
    });
  };

  const clearAllJdHistory = () => {
    if (window.confirm('Clear all Job Description history?')) {
      setJdHistory([]);
      try {
        localStorage.removeItem(JD_HISTORY_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear JD history', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Sync primary resume with current editor
      setSourceResumes((prev) =>
        prev.map((r) =>
          r.isPrimary
            ? {
                ...r,
                content: JSON.stringify(currentResume),
                parsedData: currentResume,
                sectionsCount: currentResume.sections.length,
              }
            : r
        )
      );
      setErrorMsg(null);
    }
  }, [isOpen, currentResume]);

  if (!isOpen) return null;

  const activeResume = sourceResumes.find((r) => r.id === activeResumeTab) || sourceResumes[0];

  // Mode detection
  const validSecondaryCount = sourceResumes.filter((r) => !r.isPrimary && (r.parsedData || r.content.trim())).length;
  const effectiveJd = (jdTab === 'create_ai' ? rolePrompt : jdText).trim();
  const hasJD = effectiveJd.length > 10;

  let detectedMode: MergeMode = 'single_with_jd';
  let modeTitle = 'Mode 1: Create One Resume With JD';
  let modeDescription = 'Tailor primary resume to target Job Description requirements.';

  if (validSecondaryCount > 0 && hasJD) {
    detectedMode = 'merge_with_jd';
    modeTitle = 'Mode 2: Merge Multiple Resumes With JD';
    modeDescription = `Intelligently combine 1 Primary + ${validSecondaryCount} Secondary Resumes into a single unified resume tailored to the target JD.`;
  } else if (validSecondaryCount > 0 && !hasJD) {
    detectedMode = 'merge_only';
    modeTitle = 'Mode 3: Merge Resumes Only';
    modeDescription = `Consolidate 1 Primary + ${validSecondaryCount} Secondary Resumes chronologically with automatic deduplication.`;
  }

  // Real-time JD Keywords
  const extractedKeywords = effectiveJd ? extractKeywordsFromJDText(effectiveJd) : null;

  // Handlers for Source Resumes
  const handleAddSecondaryResume = () => {
    const nextIdx = sourceResumes.length;
    const newId = `res-secondary-${Date.now()}`;
    const newResume: ResumeSourceItem = {
      id: newId,
      filename: `Resume ${String.fromCharCode(65 + nextIdx)} (Secondary)`,
      content: '',
      isPrimary: false,
      parsedData: undefined,
      fileSize: '',
      sectionsCount: 0,
    };
    setSourceResumes((prev) => [...prev, newResume]);
    setActiveResumeTab(newId);
  };

  const handleRemoveResume = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceResumes.length <= 1) return;
    const filtered = sourceResumes.filter((r) => r.id !== id);
    setSourceResumes(filtered);
    if (activeResumeTab === id) {
      setActiveResumeTab(filtered[0].id || 'res-primary');
    }
  };

  const handleSetAsPrimary = (id: string) => {
    setSourceResumes((prev) =>
      prev.map((r) => ({
        ...r,
        isPrimary: r.id === id,
        filename: r.id === id ? r.filename.replace(' (Secondary)', '') + ' (Primary)' : r.filename.replace(' (Primary)', '') + ' (Secondary)',
      }))
    );
  };

  const handleResetToEditor = (id: string) => {
    setSourceResumes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              filename: 'Current Resume (Primary)',
              content: JSON.stringify(currentResume),
              parsedData: currentResume,
              fileSize: 'Current Editor',
              sectionsCount: currentResume.sections.length,
            }
          : r
      )
    );
  };

  const handleClearContent = (id: string) => {
    setSourceResumes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              content: '',
              parsedData: undefined,
              fileSize: '',
              sectionsCount: 0,
            }
          : r
      )
    );
  };

  // Instant File Upload with Progress Indicator
  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    setIsUploading(true);
    setUploadingName(file.name);

    try {
      const parsed = await uploadResumeApi(file);
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;

      setSourceResumes((prev) =>
        prev.map((r) =>
          r.id === activeResumeTab
            ? {
                ...r,
                filename: file.name,
                content: JSON.stringify(parsed),
                parsedData: parsed,
                fileSize: sizeStr,
                sectionsCount: parsed.sections.length,
              }
            : r
        )
      );
    } catch (err: any) {
      setErrorMsg(`Failed to upload ${file.name}: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadingName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRawTextChange = (text: string) => {
    setSourceResumes((prev) =>
      prev.map((r) =>
        r.id === activeResumeTab
          ? {
              ...r,
              content: text,
              sectionsCount: text.length > 50 ? 4 : 0,
            }
          : r
      )
    );
  };

  // Handlers for JD Generation & Automatic History Saving
  const handleGenerateJD = async () => {
    if (!rolePrompt.trim()) return;
    setIsGeneratingJD(true);
    setErrorMsg(null);
    try {
      const res = await generateJDApi(rolePrompt);
      setJdText(res.text);
      setRolePrompt(res.text);
      setIsJdGenerated(true);

      // Auto-save to persistent history (localStorage)
      addJdToHistory(rolePrompt, res.text, 'ai');
    } catch (err: any) {
      setErrorMsg(`JD Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingJD(false);
    }
  };

  // Run AI Merge Pipeline
  const handleExecuteMerge = async () => {
    setIsMerging(true);
    setCurrentStep(2);
    setErrorMsg(null);

    const primary = sourceResumes.find((r) => r.isPrimary) || sourceResumes[0];
    const secondaries = sourceResumes.filter((r) => !r.isPrimary && (r.parsedData || r.content.trim()));
    const finalJdText = (jdTab === 'create_ai' ? rolePrompt : jdText).trim();

    if (finalJdText && finalJdText.length > 20) {
      addJdToHistory('Target Job Description', finalJdText, 'paste');
    }

    const requestPayload = {
      primaryResume: primary,
      secondaryResumes: secondaries,
      jobDescription: finalJdText ? { text: finalJdText } : undefined,
      mode: detectedMode,
      options: {
        preservePrimaryStructure: true,
        maxBulletsPerExperience: 6,
        preferredTone: 'professional' as const,
      },
    };

    try {
      const response = await mergeResumesApi(requestPayload);
      setMergeResult(response);
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(`Merge failed: ${err.message || 'Unknown error'}`);
      setCurrentStep(1);
    } finally {
      setIsMerging(false);
    }
  };

  const handleApply = () => {
    if (mergeResult?.mergedResume) {
      onApplyMergedResume(mergeResult.mergedResume);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>AI Tailoring & Merge Engine</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">• Map-Reduce Optimization</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
              Resume Generator & Tailoring Studio
            </h2>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold select-none">
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${
                currentStep >= 1
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span>1. Resumes ({sourceResumes.filter((r) => r.parsedData || r.content.trim()).length})</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${
                hasJD
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span>2. Target JD {hasJD ? '✓' : ''}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all ${
                currentStep === 3
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              <span>3. Edit & Results</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 ml-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: Interactive Setup (Source Resumes + Target JD) */}
        {currentStep === 1 && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-5">
            {/* Subtitle */}
            <p className="text-xs text-slate-500">
              Upload one or more source resumes and optionally provide a Job Description to merge, optimize, and tailor your resume.
            </p>

            {/* Two-Column Grid: Left Source Resumes, Right Target JD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[380px]">
              {/* Left Column: Source Resumes */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Source Resumes</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {sourceResumes.filter((r) => r.parsedData || r.content.trim()).length} of {sourceResumes.length} ready
                  </span>
                </div>

                {/* Resume Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                  {sourceResumes.map((resume) => {
                    const isActive = activeResumeTab === resume.id;
                    const isReady = !!resume.parsedData || resume.content.trim().length > 0;
                    return (
                      <div
                        key={resume.id}
                        onClick={() => setActiveResumeTab(resume.id || '')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isReady ? (isActive ? 'bg-amber-300' : 'bg-emerald-500') : 'bg-slate-300'
                          }`}
                        />
                        <span className="truncate max-w-[120px]">{resume.filename}</span>
                        {resume.isPrimary && (
                          <span
                            className={`text-[9px] px-1 rounded uppercase font-bold ${
                              isActive ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            Primary
                          </span>
                        )}
                        {!resume.isPrimary && sourceResumes.length > 2 && (
                          <button
                            onClick={(e) => handleRemoveResume(resume.id || '', e)}
                            className="p-0.5 hover:text-red-400 rounded transition-colors"
                            title="Remove secondary resume"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddSecondaryResume}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 bg-white transition-colors cursor-pointer"
                    title="Add another secondary resume source"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Resume Actions Bar */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{activeResume.filename}</span>
                    {activeResume.isPrimary ? (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        ★ Primary Base
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetAsPrimary(activeResume.id || '')}
                        className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        title="Set this resume as the primary base for merging"
                      >
                        <Star className="w-3 h-3" />
                        <span>Set as Primary</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeResume.isPrimary && (
                      <button
                        onClick={() => handleResetToEditor(activeResume.id || '')}
                        className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                        title="Reset content to current open editor resume"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                    {(activeResume.parsedData || activeResume.content.trim()) && (
                      <button
                        onClick={() => handleClearContent(activeResume.id || '')}
                        className="text-[11px] text-red-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload or Direct Paste Card */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`flex-1 border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden ${
                    isDraggingOver
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-20 animate-in fade-in">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                      <span className="text-xs font-bold text-slate-900">
                        Uploading & parsing {uploadingName}...
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Extracting sections, skills, and experience metrics...
                      </span>
                      <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-blue-600 animate-pulse rounded-full w-3/4" />
                      </div>
                    </div>
                  )}

                  {!pasteModeMap[activeResume.id || ''] ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 shadow-2xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Upload {activeResume.filename}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">PDF, DOCX, DOC, TXT, JSON files supported</p>

                      {/* Ready Badge if Content Present */}
                      {(activeResume.parsedData || activeResume.content.trim()) && (
                        <div className="mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {activeResume.filename} Loaded ({activeResume.sectionsCount || 0} Sections)
                          </span>
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.json"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{activeResume.parsedData ? 'Change / Replace File' : 'Browse Files'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPasteModeMap((prev) => ({
                            ...prev,
                            [activeResume.id || '']: true,
                          }))
                        }
                        className="mt-3 text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <FileEdit className="w-3 h-3" />
                        <span>Or paste raw text/JSON directly</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Paste Text for {activeResume.filename}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPasteModeMap((prev) => ({
                              ...prev,
                              [activeResume.id || '']: false,
                            }))
                          }
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          Switch to file upload
                        </button>
                      </div>
                      <textarea
                        value={activeResume.content}
                        onChange={(e) => handleRawTextChange(e.target.value)}
                        placeholder="Paste resume plain text or structured JSON data here..."
                        className="w-full flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono"
                        rows={8}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Target Job Description */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Target Job Description</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Optional for Merge Only</span>
                </div>

                {/* JD Mode Tabs */}
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => setJdTab('create_ai')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      jdTab === 'create_ai'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create with AI</span>
                  </button>

                  <button
                    onClick={() => setJdTab('paste')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      jdTab === 'paste'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Direct Paste</span>
                  </button>

                  <button
                    onClick={() => setJdTab('upload')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      jdTab === 'upload'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>

                  <button
                    onClick={() => setJdTab('history')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ml-auto cursor-pointer ${
                      jdTab === 'history'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History ({jdHistory.length})</span>
                  </button>
                </div>

                {/* JD Tab Content */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col space-y-3">
                  {jdTab === 'create_ai' && (
                    <div className="flex-1 flex flex-col space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-purple-900">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>Describe Target Role / Generated Job Description:</span>
                        </div>
                        {isJdGenerated && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Generated JD Populated
                          </span>
                        )}
                      </div>

                      <textarea
                        value={rolePrompt}
                        onChange={(e) => {
                          setRolePrompt(e.target.value);
                          setJdText(e.target.value);
                        }}
                        onBlur={() => {
                          if (rolePrompt.trim().length > 30) {
                            addJdToHistory(rolePrompt.slice(0, 40), rolePrompt, 'ai');
                          }
                        }}
                        placeholder="e.g., Senior Full-Stack Engineer at a fintech startup with Next.js, Go, AWS, Microservices..."
                        className="w-full flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none leading-relaxed"
                        rows={isJdGenerated ? 7 : 3}
                      />

                      {/* Role Suggestion Pills */}
                      {!isJdGenerated && (
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {[
                            'Senior Full-Stack Engineer (React, Node.js, Cloud)',
                            'Frontend Architect (TypeScript, Next.js, Design Systems)',
                            'AI / Machine Learning Engineer (Python, PyTorch, LLMs)',
                            'DevOps & Cloud Architect (AWS, Kubernetes, Terraform)',
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setRolePrompt(suggestion);
                                setJdText(suggestion);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-slate-700 font-medium transition-colors cursor-pointer text-left"
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleGenerateJD}
                        disabled={isGeneratingJD || !rolePrompt.trim()}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-auto"
                      >
                        {isGeneratingJD ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating Tailored JD...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isJdGenerated ? 'Regenerate Job Description' : 'Generate Job Description'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {jdTab === 'paste' && (
                    <div className="flex-1 flex flex-col space-y-2">
                      <span className="text-xs font-bold text-slate-700">Paste Full Job Description Text:</span>
                      <textarea
                        value={jdText}
                        onChange={(e) => {
                          setJdText(e.target.value);
                          setRolePrompt(e.target.value);
                        }}
                        onBlur={() => {
                          if (jdText.trim().length > 25) {
                            addJdToHistory('Pasted Job Description', jdText, 'paste');
                          }
                        }}
                        placeholder="Paste the full job posting, required qualifications, and responsibilities here..."
                        className="w-full flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none leading-relaxed"
                        rows={7}
                      />
                    </div>
                  )}

                  {jdTab === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <span className="text-xs font-bold text-slate-800">Upload Job Description Document</span>
                      <p className="text-[11px] text-slate-500">PDF, DOCX, TXT files supported</p>
                      <label className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl cursor-pointer border border-purple-200">
                        Select JD File
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              const text = await file.text();
                              setJdText(text);
                              setRolePrompt(text);
                              addJdToHistory(file.name, text, 'upload');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {jdTab === 'history' && (
                    <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Saved Job Descriptions ({jdHistory.length})</span>
                        {jdHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllJdHistory}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {jdHistory.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            No Job Descriptions saved in history yet.
                          </div>
                        ) : (
                          jdHistory.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setJdText(item.text);
                                setRolePrompt(item.text);
                                setJdTab('create_ai');
                                setIsJdGenerated(true);
                              }}
                              className="p-3 border border-slate-200 hover:border-purple-300 rounded-xl bg-slate-50/50 hover:bg-purple-50/30 transition-all cursor-pointer space-y-1.5 group relative"
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900 pr-6">
                                <span className="truncate">{item.prompt}</span>
                                <span className="text-[10px] text-slate-400 font-normal shrink-0">{item.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.text}</p>
                              
                              <button
                                type="button"
                                onClick={(e) => deleteJdHistoryItem(item.id, e)}
                                className="absolute top-2.5 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-white rounded transition-colors"
                                title="Delete from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Real-time Extracted JD Keywords Badges */}
                  {extractedKeywords && extractedKeywords.all.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Tag className="w-3 h-3" /> Extracted Skills:
                      </span>
                      {extractedKeywords.all.slice(0, 8).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bar with Mode Detection and Launch Button */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{modeTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      Auto-Detected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{modeDescription}</p>
                </div>
              </div>

              <button
                onClick={handleExecuteMerge}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open in AI Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Processing State */}
        {currentStep === 2 && isMerging && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <Cpu className="w-6 h-6 text-blue-600 absolute" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">AI Merge & Tailoring Pipeline Active</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Deduplicating experiences, aggregating high-impact metrics, optimizing technical skills, and scoring ATS alignment against target JD...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Results & Comparison Screen */}
        {currentStep === 3 && mergeResult && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Top Score Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {mergeResult.mergeMetadata.jdMatchScore
                      ? `${Math.round(mergeResult.mergeMetadata.jdMatchScore * 100)}%`
                      : '94%'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">ATS Alignment Score</div>
                    <div className="text-[10px] text-slate-500">
                      {mergeResult.mergeMetadata.sourcesAnalyzed} Sources Merged • {mergeResult.mergeMetadata.deduplicationCount} Duplicates Filtered
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500">New Metrics Added:</span>{' '}
                    <strong className="text-emerald-600 font-bold">
                      +{mergeResult.mergeMetadata.newAchievementsAdded}
                    </strong>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500">Sections Unified:</span>{' '}
                    <strong className="text-blue-600 font-bold">
                      {mergeResult.mergeMetadata.sectionsMerged.length}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-white rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  ← Back to Setup
                </button>

                <button
                  onClick={handleApply}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Merged Resume to Editor</span>
                </button>
              </div>
            </div>

            {/* Results Body: Left Changes Log & Gaps, Right Section Preview */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Changes Log & Gap Analysis (5 cols) */}
              <div className="md:col-span-5 border-r border-slate-200 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {/* Changes Log */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Merging & Transformation Log</span>
                  </div>
                  <div className="space-y-1.5">
                    {mergeResult.changesLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-700 leading-relaxed shadow-2xs flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Gaps & Suggested Additions */}
                {mergeResult.mergeMetadata.suggestedAdditions.length > 0 && (
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Recommended Project Additions</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-800">
                      {mergeResult.mergeMetadata.suggestedAdditions.map((sug, i) => (
                        <li key={i}>• {sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Merged Resume Preview (7 cols) */}
              <div className="md:col-span-7 flex flex-col overflow-hidden bg-white">
                {/* Section Selector Tabs */}
                <div className="p-3 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto select-none bg-slate-50/30">
                  {mergeResult.mergedResume.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActivePreviewSection(section.type)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        activePreviewSection === section.type
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>

                {/* Section Content Display */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {(() => {
                    const sec = mergeResult.mergedResume.sections.find(
                      (s) => s.type === activePreviewSection
                    ) || mergeResult.mergedResume.sections[0];
                    if (!sec) return null;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{sec.title}</h4>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Merged & Optimized
                          </span>
                        </div>
                        <div
                          className="text-xs text-slate-800 leading-relaxed space-y-2"
                          dangerouslySetInnerHTML={{ __html: sec.contentHtml }}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
