import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ResumeData, ResumeSection, VersionSnapshot, AISuggestion } from './types/resume';
import { initialResumeData } from './constants/initialResume';
import { AppSidebar, type AppView } from './components/layout/AppSidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SectionsPanel } from './components/sections/SectionsPanel';
import { ContentEditor } from './components/editor/ContentEditor';
import { PagePreviewPanel } from './components/preview/PagePreviewPanel';
import { PageSetupModal } from './components/modals/PageSetupModal';
import { ATSAnalysisModal } from './components/modals/ATSAnalysisModal';
import { AddSectionModal } from './components/modals/AddSectionModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { AIActionModal } from './components/modals/AIActionModal';
import { UploadResumeModal } from './components/modals/UploadResumeModal';
import { BatchAIOptimizeModal } from './components/modals/BatchAIOptimizeModal';
import { PersonalInfoModal } from './components/modals/PersonalInfoModal';
import { ResumeMergeStudioModal } from './components/modals/ResumeMergeStudioModal';
import { calculateATSScore } from './utils/atsCalculator';
import { sanitizeResumeData } from './utils/dataNormalizer';

export function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('ai_resume_editor_data_v2');
      if (saved) {
        return sanitizeResumeData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved resume data', e);
    }
    return sanitizeResumeData(initialResumeData);
  });

  const [activeSectionId, setActiveSectionId] = useState<string>('sec-summary');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('Just now');
  const [pageCount, setPageCount] = useState(2);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  const [atsAnalysisOpen, setAtsAnalysisOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [aiActionOpen, setAiActionOpen] = useState(false);
  const [batchAiOpen, setBatchAiOpen] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [mergeStudioOpen, setMergeStudioOpen] = useState(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<ResumeData[]>([resumeData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Snapshots for version history
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([
    {
      id: 'snap-init',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: 'Initial Template Loaded',
      wordCount: 512,
      pageCount: 2,
      personalInfo: resumeData.personalInfo,
      sections: resumeData.sections,
      pageSettings: resumeData.pageSettings,
    },
  ]);

  const activeSection = useMemo(
    () =>
      (resumeData?.sections || []).find((s) => s.id === activeSectionId) ||
      resumeData?.sections?.[0] ||
      initialResumeData.sections[0],
    [resumeData.sections, activeSectionId]
  );

  const pushToHistory = useCallback((newData: ResumeData) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newData];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const updateResumeData = useCallback(
    (updater: (prev: ResumeData) => ResumeData, pushHistory = true) => {
      setResumeData((prev) => {
        const next = sanitizeResumeData(updater(prev));
        if (pushHistory) {
          pushToHistory(next);
        }
        return next;
      });
      setAutosaveStatus('Saving...');
    },
    [pushToHistory]
  );

  const totalWordCount = useMemo(() => {
    const pInfo = resumeData?.personalInfo || {};
    let text = `${pInfo.fullName || ''} ${pInfo.jobTitle || ''} `;
    (resumeData?.sections || []).forEach((s) => {
      if (s && s.visible && s.contentHtml) {
        text += `${s.contentHtml.replace(/<[^>]*>?/gm, ' ')} `;
      }
    });
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, [resumeData]);

  const atsScore = useMemo(() => {
    return calculateATSScore(resumeData);
  }, [resumeData]);

  // Autosave effect
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('ai_resume_editor_data_v2', JSON.stringify(resumeData));
      setAutosaveStatus('Just now');
    }, 1500);
    return () => clearTimeout(timer);
  }, [resumeData]);

  // Global Keybindings (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveManual();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Section Handlers
  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
  };

  const handleReorderSections = (newSections: ResumeSection[]) => {
    updateResumeData((prev) => ({ ...prev, sections: newSections }));
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const index = resumeData.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resumeData.sections.length) return;

    const newSections = [...resumeData.sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    updateResumeData((prev) => ({ ...prev, sections: newSections }));
  };

  const handleDeleteSection = (id: string) => {
    if (resumeData.sections.length <= 1) return;
    const filtered = resumeData.sections.filter((s) => s.id !== id);
    updateResumeData((prev) => ({ ...prev, sections: filtered }));
    if (activeSectionId === id) {
      setActiveSectionId(filtered[0]?.id || '');
    }
  };

  const handleResetSection = (id: string) => {
    const initialSec = initialResumeData.sections.find((s) => s.id === id);
    if (!initialSec) return;
    updateResumeData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...initialSec } : s)),
    }));
  };

  const handleUpdateContentHtml = (sectionId: string, contentHtml: string) => {
    updateResumeData(
      (prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, contentHtml } : s)),
      }),
      false
    );
  };

  const handleApplyAISuggestion = (suggestion: AISuggestion) => {
    updateResumeData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === activeSectionId
          ? {
              ...s,
              contentHtml: suggestion.suggestedText.includes('<p>') || suggestion.suggestedText.includes('<div>')
                ? suggestion.suggestedText
                : `<p>${suggestion.suggestedText}</p>`,
            }
          : s
      ),
    }));
  };

  const handleInsertPageBreak = () => {
    updateResumeData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === activeSectionId ? { ...s, pageBreakBefore: !s.pageBreakBefore } : s
      ),
    }));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevData = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setResumeData(prevData);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextData = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setResumeData(nextData);
    }
  };

  const handleSaveManual = () => {
    const newSnapshot: VersionSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: `Manual Save (${totalWordCount} words)`,
      wordCount: totalWordCount,
      pageCount,
      personalInfo: resumeData.personalInfo,
      sections: resumeData.sections,
      pageSettings: resumeData.pageSettings,
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);
    localStorage.setItem('ai_resume_editor_data_v2', JSON.stringify(resumeData));
    setAutosaveStatus('Just now');
  };

  const handleRestoreSnapshot = (snapshot: VersionSnapshot) => {
    const restored: ResumeData = {
      personalInfo: snapshot.personalInfo,
      sections: snapshot.sections,
      pageSettings: snapshot.pageSettings,
    };
    updateResumeData(() => restored);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveManual();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAiActionOpen(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPageSetupOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveManual, handleUndo, handleRedo]);

  const handlePageCountChange = useCallback((count: number) => {
    setPageCount((prev) => (prev === count ? prev : count));
  }, []);

  const handleResetSession = useCallback(() => {
    const cleanData = sanitizeResumeData(initialResumeData);
    updateResumeData(() => cleanData);
    setActiveSectionId(cleanData.sections[0]?.id || 'sec-summary');
    localStorage.removeItem('ai_resume_editor_data_v2');
  }, [updateResumeData]);

  return (
    <div className="h-screen w-screen flex flex-row bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Global Sidebar Navigation (Dashboard, Resume Editor, Generate Resume) */}
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenGenerateResume={() => setMergeStudioOpen(true)}
        candidateName={resumeData.personalInfo.fullName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navigation */}
        <Header
          resumeData={resumeData}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSaveManual}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          onOpenMergeStudio={() => setMergeStudioOpen(true)}
          autosaveStatus={autosaveStatus}
        />

        {/* Active View: Dashboard or Three-Panel Resume Editor */}
        {activeView === 'dashboard' ? (
          <DashboardView
            resumeData={resumeData}
            onNavigateToEditor={() => setActiveView('editor')}
            onOpenGenerateResume={() => setMergeStudioOpen(true)}
            onOpenImportResume={() => setUploadModalOpen(true)}
            onResetSession={handleResetSession}
          />
        ) : (
          /* Main Workspace: Three-Panel Architecture */
          <div className="flex-1 flex overflow-hidden">
            {/* Panel 1: Left - Sections Navigation */}
            {!isFullscreen && (
              <SectionsPanel
                sections={resumeData.sections}
                activeSectionId={activeSectionId}
                onSelectSection={handleSelectSection}
                onReorderSections={handleReorderSections}
                onMoveSection={handleMoveSection}
                onDeleteSection={handleDeleteSection}
                onResetSection={handleResetSection}
                onOpenAIAssist={() => setAiActionOpen(true)}
                onOpenAddSectionModal={() => setAddSectionOpen(true)}
                onOpenBatchAIOptimize={() => setBatchAiOpen(true)}
                onOpenPersonalInfoModal={() => setPersonalInfoOpen(true)}
              />
            )}

            {/* Panel 2: Center - Content Editor */}
            {!isFullscreen && activeSection && (
              <ContentEditor
                activeSection={activeSection}
                onUpdateContentHtml={handleUpdateContentHtml}
                onInsertPageBreak={handleInsertPageBreak}
                onOpenAIAssist={() => setAiActionOpen(true)}
              />
            )}

            {/* Panel 3: Right - Live Page Preview & Navigator */}
            <PagePreviewPanel
              resumeData={resumeData}
              activeSectionId={activeSectionId}
              onSelectSection={handleSelectSection}
              onOpenPageSetup={() => setPageSetupOpen(true)}
              onUpdatePageSettings={(newSettings) =>
                updateResumeData((prev) => ({
                  ...prev,
                  pageSettings: { ...prev.pageSettings, ...newSettings },
                }))
              }
              onPageCountChange={handlePageCountChange}
              onOpenPersonalInfoModal={() => setPersonalInfoOpen(true)}
            />
          </div>
        )}

        {/* Bottom Status Bar */}
        <Footer
          atsScore={atsScore}
          pageCount={pageCount}
          wordCount={totalWordCount}
          lastUpdated={autosaveStatus}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onOpenATSModal={() => setAtsAnalysisOpen(true)}
          onOpenVersionHistory={() => setVersionHistoryOpen(true)}
          onOpenPageSetup={() => setPageSetupOpen(true)}
        />
      </div>

      {/* Upload Modal */}
      <UploadResumeModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onImportResume={(data) => {
          const cleanData = sanitizeResumeData(data);
          updateResumeData(() => cleanData);
          const firstSection = cleanData.sections[0];
          const firstId = firstSection?.id || 'sec-summary';
          setActiveSectionId(firstId);
        }}
      />

      {/* Modals */}
      <PersonalInfoModal
        isOpen={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        personalInfo={resumeData.personalInfo}
        onSave={(updatedInfo) => {
          updateResumeData((prev) => ({
            ...prev,
            personalInfo: updatedInfo,
          }));
        }}
      />

      <PageSetupModal
        isOpen={pageSetupOpen}
        onClose={() => setPageSetupOpen(false)}
        pageSettings={resumeData.pageSettings}
        onSave={(newSettings) =>
          updateResumeData((prev) => ({ ...prev, pageSettings: newSettings }))
        }
      />

      <ATSAnalysisModal
        isOpen={atsAnalysisOpen}
        onClose={() => setAtsAnalysisOpen(false)}
        resumeData={resumeData}
        onOpenBatchOptimize={() => {
          setAtsAnalysisOpen(false);
          setBatchAiOpen(true);
        }}
        onApplyOptimization={() => {
          setAtsAnalysisOpen(false);
          setAiActionOpen(true);
        }}
      />

      <AddSectionModal
        isOpen={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        onAddSection={(newSection) => {
          updateResumeData((prev) => ({
            ...prev,
            sections: [...prev.sections, newSection],
          }));
          setActiveSectionId(newSection.id);
        }}
      />

      <VersionHistoryModal
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        snapshots={snapshots}
        onRestoreSnapshot={handleRestoreSnapshot}
        onCreateSnapshot={handleSaveManual}
      />

      {activeSection && (
        <AIActionModal
          isOpen={aiActionOpen}
          onClose={() => setAiActionOpen(false)}
          section={activeSection}
          onApplyAISuggestion={handleApplyAISuggestion}
        />
      )}

      <BatchAIOptimizeModal
        isOpen={batchAiOpen}
        onClose={() => setBatchAiOpen(false)}
        sections={resumeData.sections}
        onApplyAll={(updatedSections) => {
          updateResumeData((prev) => ({
            ...prev,
            sections: updatedSections,
          }));
        }}
      />

      <ResumeMergeStudioModal
        isOpen={mergeStudioOpen}
        onClose={() => setMergeStudioOpen(false)}
        currentResume={resumeData}
        onApplyMergedResume={(mergedResume) => {
          updateResumeData(() => mergedResume);
          const firstSecId = mergedResume.sections[0]?.id || 'sec-summary';
          setActiveSectionId(firstSecId);
        }}
      />
    </div>
  );
}

export default App;
