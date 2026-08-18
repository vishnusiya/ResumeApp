import React from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  ArrowRight,
  Trash2,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import type { ResumeData } from '../../types/resume';

interface DashboardViewProps {
  resumeData: ResumeData;
  onNavigateToEditor: () => void;
  onOpenGenerateResume: () => void;
  onOpenImportResume: () => void;
  onResetSession: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  resumeData,
  onNavigateToEditor,
  onOpenGenerateResume,
  onOpenImportResume,
  onResetSession,
}) => {
  const candidateName = resumeData.personalInfo.fullName || 'Untitled Resume';
  const jobTitle = resumeData.personalInfo.jobTitle || 'Professional Candidate';
  const sectionCount = resumeData.sections.filter((s) => s.visible).length;

  const handleDeleteSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to reset this session to a clean template?')) {
      onResetSession();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8 animate-in fade-in">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 border border-slate-200/80 rounded-3xl p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600/10 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back to AI Resume Studio
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Create, analyze, and optimize your resumes with the power of artificial intelligence.
            </p>
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-purple-200/80 shadow-2xs text-xs font-bold text-purple-700">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span>AI Credits: Unlimited</span>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Generate Resume */}
          <div
            onClick={onOpenGenerateResume}
            className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-purple-50/30 border border-slate-200/90 hover:border-purple-300 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Generate Resume
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                  Upload your current resume and paste a Job Description. AI will create a highly optimized resume tailored to the role.
                </p>
              </div>
            </div>

            <div className="flex items-center text-xs font-bold text-purple-600 group-hover:text-purple-700 gap-1.5 pt-2">
              <span>Open Tailoring Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Import Existing Resume */}
          <div
            onClick={onOpenImportResume}
            className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-7 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Import Existing Resume
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                  Upload a PDF or Word document to instantly digitize your experience.
                </p>
              </div>
            </div>

            <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700 gap-1.5 pt-2">
              <span>Upload Document (PDF / DOCX)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Recent Session Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Session</h2>
            <span className="text-xs text-slate-500 font-medium">Auto-saved to local browser</span>
          </div>

          <div
            onClick={onNavigateToEditor}
            className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{candidateName}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700">{jobTitle}</span>
                  <span>•</span>
                  <span>Currently active in workspace</span>
                  <span>•</span>
                  <span>{sectionCount} Sections</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onNavigateToEditor}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>Continue Editing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDeleteSession}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                title="Reset Session / Clear Resume"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
