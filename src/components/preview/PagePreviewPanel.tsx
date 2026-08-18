import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Sliders, 
  ChevronDown,
  AlertTriangle,
  Columns
} from 'lucide-react';
import type { ResumeData, PaperSize, PageSettings } from '../../types/resume';
import { getPageDimensions, getPrintableArea, paginateSections, binarySearchAutoFit } from '../../utils/pagination';

interface PagePreviewPanelProps {
  resumeData: ResumeData;
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  onOpenPageSetup: () => void;
  onUpdatePageSettings: (settings: Partial<PageSettings>) => void;
  onPageCountChange?: (count: number) => void;
  onOpenPersonalInfoModal?: () => void;
}

export const PagePreviewPanel: React.FC<PagePreviewPanelProps> = ({
  resumeData,
  activeSectionId,
  onSelectSection,
  onOpenPageSetup,
  onUpdatePageSettings,
  onPageCountChange,
  onOpenPersonalInfoModal,
}) => {
  const [zoomLevel, setZoomLevel] = useState(88);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [paperSizeDropdown, setPaperSizeDropdown] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { personalInfo, sections, pageSettings } = resumeData;
  const dimensions = getPageDimensions(pageSettings.paperSize, pageSettings.orientation);
  const printable = getPrintableArea(pageSettings);

  // Auto-fit binary search computation if autoCompress is enabled
  const autoFitParams = useMemo(() => {
    if (!pageSettings.autoCompress || pageSettings.pageLimit === 'unlimited') {
      return {
        fontSize: pageSettings.typography.fontSize,
        lineHeight: pageSettings.typography.lineHeight,
      };
    }
    const totalContentLen = sections.reduce((acc, s) => acc + (s.visible ? s.contentHtml.length : 0), 0);
    const targetPages = parseInt(pageSettings.pageLimit, 10) || 1;
    const { optimizedFontSize, optimizedLineHeight } = binarySearchAutoFit(
      totalContentLen,
      targetPages,
      pageSettings.typography.fontSize
    );
    return { fontSize: optimizedFontSize, lineHeight: optimizedLineHeight };
  }, [sections, pageSettings]);

  // Paginate with orphan detection
  const pages = useMemo(() => {
    return paginateSections(sections, printable.printableHeightPx);
  }, [sections, printable.printableHeightPx]);

  const totalPages = pages.length;
  const prevCountRef = useRef<number>(totalPages);

  useEffect(() => {
    if (onPageCountChange && prevCountRef.current !== totalPages) {
      prevCountRef.current = totalPages;
      onPageCountChange(totalPages);
    }
  }, [totalPages, onPageCountChange]);

  useEffect(() => {
    if (activeSectionId) {
      const el = document.getElementById(`preview-section-${activeSectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSectionId]);

  const scrollToPage = (pageIdx: number) => {
    setActivePageIndex(pageIdx);
    if (pageRefs.current[pageIdx]) {
      pageRefs.current[pageIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(50, Math.min(150, prev + delta)));
  };

  const handlePaperSizeSelect = (size: PaperSize) => {
    onUpdatePageSettings({ paperSize: size });
    setPaperSizeDropdown(false);
  };

  const exceedsPageLimit = 
    (pageSettings.pageLimit === '1' && totalPages > 1) ||
    (pageSettings.pageLimit === '2' && totalPages > 2);

  // Helper to categorize sections for 2-column layout
  const sidebarSectionTypes = new Set(['skills', 'education', 'certifications', 'additional']);

  return (
    <section className={`flex-1 flex flex-col ${darkCanvas ? 'bg-slate-900' : 'bg-slate-100'} select-none transition-colors duration-200 overflow-hidden`}>
      {/* Top Controls Bar */}
      <div className="preview-top-bar no-print h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          PAGE PREVIEW
        </span>

        <div className="flex items-center gap-3">
          {/* Column Layout Switcher */}
          <button
            onClick={() => onUpdatePageSettings({ columns: pageSettings.columns === 1 ? 2 : 1 })}
            className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              pageSettings.columns === 2
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle 1-Column vs 2-Column Sidebar Layout"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{pageSettings.columns === 1 ? '1-Col' : '2-Col'}</span>
          </button>

          {/* Paper Size dropdown */}
          <div className="relative">
            <button
              onClick={() => setPaperSizeDropdown(!paperSizeDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 uppercase cursor-pointer"
            >
              <span>{pageSettings.paperSize}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {paperSizeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setPaperSizeDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    onClick={() => handlePaperSizeSelect('a4')}
                    className={`w-full text-left px-3 py-1.5 font-medium hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${pageSettings.paperSize === 'a4' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                  >
                    A4 (210 × 297mm)
                  </button>
                  <button
                    onClick={() => handlePaperSizeSelect('letter')}
                    className={`w-full text-left px-3 py-1.5 font-medium hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${pageSettings.paperSize === 'letter' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                  >
                    Letter (8.5 × 11in)
                  </button>
                  <button
                    onClick={() => handlePaperSizeSelect('legal')}
                    className={`w-full text-left px-3 py-1.5 font-medium hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${pageSettings.paperSize === 'legal' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                  >
                    Legal (8.5 × 14in)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center border border-slate-200 rounded-md p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => handleZoom(-10)}
              className="p-1 text-slate-600 hover:bg-white rounded cursor-pointer"
              title="Zoom out"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-medium text-slate-700 min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              className="p-1 text-slate-600 hover:bg-white rounded cursor-pointer"
              title="Zoom in"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Dark/Light Canvas Toggle */}
          <button
            onClick={() => setDarkCanvas(!darkCanvas)}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Toggle Canvas Theme"
          >
            {darkCanvas ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Page Setup quick trigger */}
          <button
            onClick={onOpenPageSetup}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Page Setup"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Page Limit Warning if violated */}
      {exceedsPageLimit && (
        <div className="no-print bg-amber-500 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Content exceeds target {pageSettings.pageLimit}-page limit ({totalPages} pages total).</span>
          </div>
          <button
            onClick={onOpenPageSetup}
            className="underline font-bold text-amber-100 hover:text-white cursor-pointer"
          >
            Adjust Margins & Font Size
          </button>
        </div>
      )}

      {/* Page Navigator Strip */}
      <div className="preview-navigator no-print h-24 bg-white/70 backdrop-blur-xs border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="text-xs font-bold text-slate-600 tracking-tight">
          Page Navigator
        </div>

        {/* Thumbnail Cards */}
        <div className="flex items-center gap-4">
          {pages.map((_p, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx)}
              className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${
                activePageIndex === idx ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-12 h-16 bg-white rounded border-2 shadow-xs flex flex-col p-1 gap-0.5 overflow-hidden transition-all ${
                activePageIndex === idx ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300'
              }`}>
                <div className="w-8 h-1 bg-slate-800 rounded-xs mb-0.5 mx-auto" />
                <div className="w-full h-0.5 bg-slate-300 rounded-xs" />
                <div className="w-full h-0.5 bg-slate-200 rounded-xs" />
                <div className="w-5/6 h-0.5 bg-slate-200 rounded-xs" />
                <div className="w-full h-0.5 bg-slate-200 rounded-xs mt-1" />
                <div className="w-4/5 h-0.5 bg-slate-200 rounded-xs" />
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activePageIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {idx + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Arrow Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex === 0}
            className="p-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-semibold text-slate-700 min-w-[70px] text-center">
            Page {activePageIndex + 1} of {totalPages}
          </span>
          <button
            onClick={() => scrollToPage(Math.min(totalPages - 1, activePageIndex + 1))}
            disabled={activePageIndex === totalPages - 1}
            className="p-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main Multi-Page Canvas Area */}
      <div
        ref={previewContainerRef}
        className="preview-canvas-area flex-1 overflow-y-auto p-8 flex flex-col items-center gap-10"
      >
        {pages.map((page, pageIdx) => {
          return (
            <div
              key={page.pageNumber}
              ref={(el) => {
                pageRefs.current[pageIdx] = el;
              }}
              style={{
                width: `${dimensions.widthPx}px`,
                minHeight: `${dimensions.heightPx}px`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                fontFamily: pageSettings.typography.fontFamily,
                fontSize: `${autoFitParams.fontSize}pt`,
                lineHeight: autoFitParams.lineHeight,
                padding: `${printable.topMarginPx}px ${printable.rightMarginPx}px ${printable.bottomMarginPx}px ${printable.leftMarginPx}px`,
                color: pageSettings.theme.textColor,
                marginBottom: `${(dimensions.heightPx * (zoomLevel / 100 - 1)) + 40}px`,
              }}
              className="page-container relative bg-white resume-paper-shadow rounded-sm text-slate-900 transition-all duration-200 shrink-0"
            >
              {/* Page 1 Header */}
              {page.isFirstPage && (
                <div
                  onClick={() => onOpenPersonalInfoModal?.()}
                  title="Click to edit Name, Job Title, Email, Phone, & Social Links"
                  className="text-center pb-4 mb-4 border-b border-slate-300 group cursor-pointer hover:bg-blue-50/50 rounded-xl transition-all p-2 relative select-none"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-2 text-[10px] font-semibold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-md shadow-xs transition-opacity flex items-center gap-1 pointer-events-none">
                    <span>✏️ Edit Header & Contact Info</span>
                  </div>

                  <h1
                    className="font-bold tracking-tight uppercase"
                    style={{
                      fontSize: `${autoFitParams.fontSize * 1.65}pt`,
                      color: pageSettings.theme.headingColor,
                    }}
                  >
                    {personalInfo.fullName}
                  </h1>

                  <div
                    className="font-medium mt-1"
                    style={{
                      fontSize: `${autoFitParams.fontSize * 1.1}pt`,
                      color: '#475569',
                    }}
                  >
                    {personalInfo.jobTitle}
                  </div>

                  {/* Contact Info Line (Cleaned against null / empty values) */}
                  {(() => {
                    const isVal = (v?: string) => {
                      if (!v || typeof v !== 'string') return false;
                      const s = v.trim().toLowerCase();
                      return s.length > 0 && !['null', 'undefined', 'none', 'n/a', 'nil', 'false'].includes(s);
                    };

                    const items: { key: string; el: React.ReactNode }[] = [];
                    if (isVal(personalInfo.phone)) {
                      items.push({ key: 'phone', el: <span>📞 {personalInfo.phone?.trim()}</span> });
                    }
                    if (isVal(personalInfo.email)) {
                      items.push({ key: 'email', el: <span>✉️ {personalInfo.email?.trim()}</span> });
                    }
                    if (isVal(personalInfo.location)) {
                      items.push({ key: 'loc', el: <span>📍 {personalInfo.location?.trim()}</span> });
                    }
                    if (isVal(personalInfo.linkedin)) {
                      items.push({
                        key: 'li',
                        el: <span className="text-blue-600 font-medium">🔗 {personalInfo.linkedin?.trim()}</span>,
                      });
                    }
                    if (isVal(personalInfo.github)) {
                      items.push({
                        key: 'gh',
                        el: <span className="text-slate-700 font-medium">💻 {personalInfo.github?.trim()}</span>,
                      });
                    }
                    if (isVal(personalInfo.website)) {
                      items.push({
                        key: 'web',
                        el: <span className="text-blue-600 font-medium">🌐 {personalInfo.website?.trim()}</span>,
                      });
                    }

                    if (items.length === 0) return null;

                    return (
                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[0.88em] text-slate-600">
                        {items.map((item, idx) => (
                          <React.Fragment key={item.key}>
                            {idx > 0 && <span className="text-slate-300">|</span>}
                            {item.el}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Multi-Column or Single Column Rendering */}
              {pageSettings.columns === 2 ? (
                /* 2-Column Modern Sidebar Layout */
                <div className="grid grid-cols-12 gap-5 items-start">
                  {/* Left Column (Sidebar ~35%) */}
                  <div className="col-span-4 space-y-4 border-r border-slate-200 pr-4">
                    {page.sections
                      .filter(sec => sidebarSectionTypes.has(sec.type))
                      .map((sec) => {
                        const isSecActive = sec.id === activeSectionId;
                        return (
                          <div
                            key={sec.id}
                            id={`preview-section-${sec.id}`}
                            onClick={() => onSelectSection(sec.id)}
                            className={`cursor-pointer transition-all duration-300 p-1.5 -m-1.5 rounded ${
                              isSecActive ? 'highlight-pulse bg-blue-50/40 ring-1 ring-blue-400/40' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <h2
                              className="font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
                              style={{
                                fontSize: `${autoFitParams.fontSize * 1.05}pt`,
                                color: pageSettings.theme.primaryColor,
                                borderColor: pageSettings.theme.primaryColor,
                              }}
                            >
                              {sec.title}
                            </h2>
                            <div
                              className="leading-relaxed text-[0.92em]"
                              dangerouslySetInnerHTML={{ __html: sec.contentHtml }}
                            />
                          </div>
                        );
                      })}
                  </div>

                  {/* Right Column (Main ~65%) */}
                  <div className="col-span-8 space-y-4">
                    {page.sections
                      .filter(sec => !sidebarSectionTypes.has(sec.type))
                      .map((sec) => {
                        const isSecActive = sec.id === activeSectionId;
                        return (
                          <div
                            key={sec.id}
                            id={`preview-section-${sec.id}`}
                            onClick={() => onSelectSection(sec.id)}
                            className={`cursor-pointer transition-all duration-300 p-1.5 -m-1.5 rounded ${
                              isSecActive ? 'highlight-pulse bg-blue-50/40 ring-1 ring-blue-400/40' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <h2
                              className="font-bold uppercase tracking-wider pb-0.5 mb-1.5 border-b"
                              style={{
                                fontSize: `${autoFitParams.fontSize * pageSettings.typography.headingScale}pt`,
                                color: pageSettings.theme.primaryColor,
                                borderColor: pageSettings.theme.primaryColor,
                              }}
                            >
                              {sec.title}
                            </h2>
                            <div
                              className="leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: sec.contentHtml }}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                /* 1-Column Standard Layout */
                <div className="space-y-4">
                  {page.sections.map((sec) => {
                    const isSecActive = sec.id === activeSectionId;
                    return (
                      <div
                        key={sec.id}
                        id={`preview-section-${sec.id}`}
                        onClick={() => onSelectSection(sec.id)}
                        className={`cursor-pointer transition-all duration-300 p-1.5 -m-1.5 rounded ${
                          isSecActive ? 'highlight-pulse bg-blue-50/40 ring-1 ring-blue-400/40' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <h2
                          className="font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                          style={{
                            fontSize: `${autoFitParams.fontSize * pageSettings.typography.headingScale}pt`,
                            color: pageSettings.theme.primaryColor,
                            borderColor: pageSettings.theme.primaryColor,
                          }}
                        >
                          {sec.title}
                        </h2>

                        <div
                          className="leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sec.contentHtml }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Page Number Stamp Footer */}
              <div className="absolute bottom-3 right-6 text-[9px] font-medium text-slate-400">
                Page {page.pageNumber} of {totalPages}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
