import React, { useState } from 'react';
import { 
  GripVertical, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  FolderGit2, 
  ShieldCheck, 
  Award, 
  Info, 
  Plus, 
  Sparkles, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  FileText,
  User
} from 'lucide-react';
import type { ResumeSection, SectionType, EditMode } from '../../types/resume';

interface SectionsPanelProps {
  sections: ResumeSection[];
  activeSectionId: string;
  editMode?: EditMode;
  onSelectSection: (id: string) => void;
  onReorderSections: (newSections: ResumeSection[]) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onDeleteSection: (id: string) => void;
  onResetSection: (id: string) => void;
  onToggleEditMode?: () => void;
  onOpenAIAssist: (sectionId: string) => void;
  onOpenAddSectionModal: () => void;
  onOpenBatchAIOptimize?: () => void;
  onOpenPersonalInfoModal?: () => void;
}

export const SectionsPanel: React.FC<SectionsPanelProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  onReorderSections,
  onMoveSection,
  onDeleteSection,
  onResetSection,
  onOpenAIAssist,
  onOpenAddSectionModal,
  onOpenBatchAIOptimize,
  onOpenPersonalInfoModal,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getSectionIcon = (type: SectionType) => {
    switch (type) {
      case 'summary':
        return <Home className="w-4 h-4 text-blue-600" />;
      case 'experience':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'education':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'skills':
        return <Code2 className="w-4 h-4 text-blue-600" />;
      case 'projects':
        return <FolderGit2 className="w-4 h-4 text-blue-600" />;
      case 'certifications':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'achievements':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'additional':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'custom':
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...sections];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(targetIndex);
    onReorderSections(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <aside className="no-print w-72 bg-slate-50/80 border-r border-slate-200 flex flex-col justify-between shrink-0 select-none overflow-hidden">
      {/* Top Header & Global AI Action */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              SECTIONS
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {sections.length}
            </span>
          </div>

          <button
            onClick={onOpenAddSectionModal}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Add a new section"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Global Batch AI Banner */}
        {onOpenBatchAIOptimize && (
          <button
            onClick={onOpenBatchAIOptimize}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xs shadow-blue-500/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Batch AI Optimize</div>
                <div className="text-[10px] text-blue-100/90 leading-tight">Enhance all {sections.length} sections</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
              1-Click
            </span>
          </button>
        )}
      </div>

      {/* Scrollable Section List with Integrated Inline Controls */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Pinned Contact & Header Details Card */}
        {onOpenPersonalInfoModal && (
          <div
            onClick={onOpenPersonalInfoModal}
            className="p-2.5 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 hover:from-blue-100/70 hover:to-indigo-100/70 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">Header & Contact Info</div>
                <div className="text-[10px] text-slate-500 truncate">Name, Email, Phone, Socials</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 group-hover:underline px-1.5 py-0.5 rounded bg-white border border-blue-200 shadow-2xs">
              Edit
            </span>
          </div>
        )}

        {sections.map((section, index) => {
          const isActive = section.id === activeSectionId;
          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectSection(section.id)}
              className={`rounded-xl transition-all duration-150 border group cursor-pointer ${
                isActive
                  ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/15'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              } ${draggedIndex === index ? 'opacity-40 scale-98' : 'opacity-100'}`}
            >
              {/* Section Header Row */}
              <div className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors shrink-0"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Section Icon */}
                  <span className="shrink-0 p-1 rounded-md bg-slate-50 border border-slate-100">
                    {getSectionIcon(section.type)}
                  </span>

                  {/* Section Title */}
                  <span className={`text-xs truncate font-semibold ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                    {section.title}
                  </span>
                </div>

                {/* Inactive Hover Quick Action: AI Button */}
                {!isActive && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAIAssist(section.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="AI Assist for this section"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Active Section Inline Controls Bar */}
              {isActive && (
                <div 
                  className="px-2.5 pb-2.5 pt-1 border-t border-slate-100 flex items-center justify-between gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* AI Assist Pill Button */}
                  <button
                    onClick={() => onOpenAIAssist(section.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI Assist</span>
                  </button>

                  {/* Move Up Button */}
                  <button
                    onClick={() => onMoveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Move section up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  {/* Move Down Button */}
                  <button
                    onClick={() => onMoveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Move section down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  {/* Reset Section Button */}
                  <button
                    onClick={() => onResetSection(section.id)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Reset to template default"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  {/* Delete Section Button */}
                  <button
                    onClick={() => onDeleteSection(section.id)}
                    disabled={sections.length <= 1}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Delete section"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section Dotted Button */}
        <button
          onClick={onOpenAddSectionModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Section</span>
        </button>
      </div>

      {/* Sleek Bottom Bar (Quick Tip / Status) */}
      <div className="p-3 border-t border-slate-200/80 bg-white flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-500 font-medium">Auto-Sync</span>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Preview
        </span>
      </div>
    </aside>
  );
};
