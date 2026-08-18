import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  RotateCw, 
  Save, 
  Download, 
  Printer, 
  FileCode, 
  Upload, 
  Check, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import type { ResumeData } from '../../types/resume';
import { exportToPrint, exportToDocx, exportToJson } from '../../utils/exportEngine';
import confetti from 'canvas-confetti';

interface HeaderProps {
  resumeData: ResumeData;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenUploadModal: () => void;
  onOpenMergeStudio?: () => void;
  autosaveStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  resumeData,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onOpenUploadModal,
  onOpenMergeStudio,
  autosaveStatus,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleManualSave = () => {
    onSave();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.2 } });
    exportToPrint();
  };

  const handleExportDocx = async () => {
    setShowExportMenu(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
    await exportToDocx(resumeData, `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`);
  };

  const handleExportJson = () => {
    setShowExportMenu(false);
    exportToJson(resumeData, `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.json`);
  };

  return (
    <header className="no-print h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
      {/* Brand & Autosave Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            AI Resume Editor
          </h1>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-700 font-medium">✓ Autosaved</span>
          <span className="text-slate-400">·</span>
          <span>{autosaveStatus}</span>
        </div>
      </div>

      {/* Action Controls: Undo/Redo, Studio, Upload, Save, Export */}
      <div className="flex items-center gap-2">
        {/* Tailoring & Merger Studio Button */}
        {onOpenMergeStudio && (
          <button
            onClick={onOpenMergeStudio}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer mr-1 group"
            title="Open AI Resume Merger & Tailoring Studio"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Merger & Tailoring Studio</span>
          </button>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Resume Button */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors shadow-2xs cursor-pointer"
          title="Upload PDF, DOCX, TXT, or JSON resume"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Upload</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleManualSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        >
          {showSavedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4 text-slate-500" />}
          <span>{showSavedToast ? 'Saved!' : 'Save'}</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Export Options
                </div>

                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Export PDF / Print</div>
                    <div className="text-xs text-slate-400">Exact print layout pagination</div>
                  </div>
                </button>

                <button
                  onClick={handleExportDocx}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-medium">Word Document (.docx)</div>
                    <div className="text-xs text-slate-400">Editable in Microsoft Word</div>
                  </div>
                </button>

                <button
                  onClick={handleExportJson}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">JSON Backup (.json)</div>
                    <div className="text-xs text-slate-400">Export structured resume data</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
