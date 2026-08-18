import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Sparkles, 
  FilePlus2, 
  Type, 
  ChevronDown
} from 'lucide-react';
import type { 
  ResumeSection, 
  EditMode, 
  AISuggestion 
} from '../../types/resume';

interface ContentEditorProps {
  activeSection: ResumeSection;
  editMode?: EditMode;
  aiSuggestion?: AISuggestion | null;
  onUpdateContentHtml: (sectionId: string, contentHtml: string) => void;
  onUpdateStructuredData?: (sectionId: string, structuredData: any) => void;
  onToggleEditMode?: () => void;
  onApplyAISuggestion?: (suggestion: AISuggestion) => void;
  onRejectAISuggestion?: () => void;
  onRegenerateAISuggestion?: (sectionId: string, actionId?: string) => void;
  onInsertPageBreak: () => void;
  onOpenAIAssist?: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  activeSection,
  onUpdateContentHtml,
  onInsertPageBreak,
  onOpenAIAssist,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFormat, setSelectedFormat] = useState('p');
  const [activeFormatDropdown, setActiveFormatDropdown] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== activeSection.contentHtml) {
        editorRef.current.innerHTML = activeSection.contentHtml;
      }
    }
  }, [activeSection.id, activeSection.contentHtml]);

  const formatDoc = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onUpdateContentHtml(activeSection.id, editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onUpdateContentHtml(activeSection.id, editorRef.current.innerHTML);
    }
  };

  const handleFormatBlock = (tag: string) => {
    formatDoc('formatBlock', `<${tag}>`);
    setSelectedFormat(tag);
    setActiveFormatDropdown(false);
  };

  const getCounts = () => {
    const rawText = activeSection.contentHtml.replace(/<[^>]*>?/gm, ' ').trim();
    const words = rawText.length > 0 ? rawText.split(/\s+/).filter(w => w.length > 0).length : 0;
    const characters = rawText.length;
    return { words, characters };
  };

  const { words, characters } = getCounts();

  return (
    <main className="no-print flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200">
      {/* Panel Top Header */}
      <div className="h-12 border-b border-slate-200 px-5 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Editing:</span>
          <span className="text-sm font-bold text-blue-600 capitalize">
            {activeSection.title}
          </span>
        </div>

        {/* Section Title & Clean Rich Text Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200">
            <Type className="w-3.5 h-3.5 text-blue-600" />
            <span>Rich Text Editor</span>
          </span>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="h-11 border-b border-slate-200 px-4 flex items-center gap-1 shrink-0 bg-slate-50/70 text-slate-700 text-xs overflow-x-auto select-none">
        {/* Paragraph Dropdown */}
        <div className="relative">
          <button
            onClick={() => setActiveFormatDropdown(!activeFormatDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 bg-white rounded-md hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
          >
            <span className="capitalize">
              {selectedFormat === 'p' ? 'Paragraph' : selectedFormat === 'h1' ? 'Heading 1' : selectedFormat === 'h2' ? 'Heading 2' : 'Heading 3'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {activeFormatDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setActiveFormatDropdown(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40">
                <button
                  onClick={() => handleFormatBlock('p')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-600"
                >
                  Paragraph
                </button>
                <button
                  onClick={() => handleFormatBlock('h1')}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-blue-50 hover:text-blue-600"
                >
                  Heading 1
                </button>
                <button
                  onClick={() => handleFormatBlock('h2')}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600"
                >
                  Heading 2
                </button>
                <button
                  onClick={() => handleFormatBlock('h3')}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-600"
                >
                  Heading 3
                </button>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Text Styles */}
        <button
          onClick={() => formatDoc('bold')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => formatDoc('italic')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => formatDoc('underline')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => formatDoc('strikeThrough')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Lists */}
        <button
          onClick={() => formatDoc('insertUnorderedList')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => formatDoc('insertOrderedList')}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Link Insertion */}
        <button
          onClick={() => {
            const url = prompt('Enter hyperlink URL:');
            if (url) formatDoc('createLink', url);
          }}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded border border-transparent hover:border-slate-200 cursor-pointer"
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* AI Quick Button */}
        <button
          onClick={() => onOpenAIAssist?.()}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-semibold text-xs ml-1 shadow-xs transition-all cursor-pointer"
          title="Enhance active section with Dual-Pass AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Assist</span>
        </button>

        {/* Insert Page Break */}
        <button
          onClick={onInsertPageBreak}
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-xs font-medium text-slate-700 ml-auto cursor-pointer"
          title="Insert Page Break (Ctrl+Enter)"
        >
          <FilePlus2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Page Break</span>
        </button>
      </div>

      {/* Main Content Workspace (Clean Rich Text) */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-6">
        <div className="flex-1 flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                onInsertPageBreak();
              }
            }}
            className="editor-content flex-1 min-h-[340px] p-4 text-sm text-slate-800 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none leading-relaxed transition-all"
          />
        </div>

        {/* Word and Character Count Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 select-none">
          <div className="flex items-center gap-4">
            <span>Words: <strong className="text-slate-700 font-semibold">{words}</strong></span>
            <span>Characters: <strong className="text-slate-700 font-semibold">{characters}</strong></span>
          </div>
        </div>
      </div>
    </main>
  );
};
