import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import type { PageSettings, PaperSize, PageOrientation, PageLimit, TemplateTheme } from '../../types/resume';
import { defaultPageSettings } from '../../constants/initialResume';

interface PageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSettings: PageSettings;
  onSave: (newSettings: PageSettings) => void;
}

const TEMPLATE_THEMES: Record<TemplateTheme, { name: string; primary: string; accent: string; font: string }> = {
  modern: { name: 'Modern', primary: '#2563EB', accent: '#0D9488', font: 'Inter' },
  classic: { name: 'Classic', primary: '#1E3A5F', accent: '#C9A96E', font: 'Times New Roman' },
  minimalist: { name: 'Minimalist', primary: '#374151', accent: '#3B82F6', font: 'Roboto' },
  executive: { name: 'Executive', primary: '#111827', accent: '#F59E0B', font: 'Lora' },
  creative: { name: 'Creative', primary: '#7C3AED', accent: '#EC4899', font: 'Poppins' },
};

export const PageSetupModal: React.FC<PageSetupModalProps> = ({
  isOpen,
  onClose,
  pageSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<PageSettings>({ ...pageSettings });

  if (!isOpen) return null;

  const handleMarginPreset = (preset: 'normal' | 'narrow' | 'compact' | 'wide') => {
    switch (preset) {
      case 'normal':
        setSettings({ ...settings, margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 } });
        break;
      case 'narrow':
        setSettings({ ...settings, margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } });
        break;
      case 'compact':
        setSettings({ ...settings, margins: { top: 0.35, bottom: 0.35, left: 0.35, right: 0.35 } });
        break;
      case 'wide':
        setSettings({ ...settings, margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 } });
        break;
    }
  };

  const handleThemePreset = (themeKey: TemplateTheme) => {
    const t = TEMPLATE_THEMES[themeKey];
    setSettings({
      ...settings,
      theme: {
        template: themeKey,
        primaryColor: t.primary,
        accentColor: t.accent,
        textColor: '#1e293b',
        headingColor: t.primary,
      },
      typography: {
        ...settings.typography,
        fontFamily: t.font,
      },
    });
  };

  const handleApply = () => {
    onSave(settings);
    onClose();
  };

  const handleResetDefaults = () => {
    setSettings({ ...defaultPageSettings });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Page Setup & Formatting</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Paper Size */}
          <div>
            <label className="font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Paper Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['a4', 'letter', 'legal'] as PaperSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setSettings({ ...settings, paperSize: size })}
                  className={`py-2 px-3 rounded-lg border font-semibold uppercase text-center transition-all cursor-pointer ${
                    settings.paperSize === size
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {size === 'a4' ? 'A4 (210×297mm)' : size === 'letter' ? 'Letter (8.5×11in)' : 'Legal (8.5×14in)'}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['portrait', 'landscape'] as PageOrientation[]).map((ori) => (
                <button
                  key={ori}
                  onClick={() => setSettings({ ...settings, orientation: ori })}
                  className={`py-2 px-3 rounded-lg border font-semibold capitalize text-center transition-all cursor-pointer ${
                    settings.orientation === ori
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ori === 'portrait' ? '📄 Portrait' : '📄 Landscape'}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 uppercase tracking-wider">
                Margins (Inches)
              </label>
              {/* Presets */}
              <div className="flex gap-1.5">
                {(['compact', 'narrow', 'normal', 'wide'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleMarginPreset(preset)}
                    className="text-[10px] px-2 py-0.5 border border-slate-200 rounded capitalize hover:bg-slate-100 font-medium text-slate-600 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Top</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="2.0"
                  value={settings.margins.top}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      margins: { ...settings.margins, top: parseFloat(e.target.value) || 0.5 },
                    })
                  }
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Bottom</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="2.0"
                  value={settings.margins.bottom}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      margins: { ...settings.margins, bottom: parseFloat(e.target.value) || 0.5 },
                    })
                  }
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Left</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="2.0"
                  value={settings.margins.left}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      margins: { ...settings.margins, left: parseFloat(e.target.value) || 0.5 },
                    })
                  }
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Right</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="2.0"
                  value={settings.margins.right}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      margins: { ...settings.margins, right: parseFloat(e.target.value) || 0.5 },
                    })
                  }
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                />
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Typography & Spacing
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Font Family</label>
                <select
                  value={settings.typography.fontFamily}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      typography: { ...settings.typography, fontFamily: e.target.value },
                    })
                  }
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Lora">Lora</option>
                  <option value="Merriweather">Merriweather</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium">
                  Font Size ({settings.typography.fontSize}pt)
                </label>
                <input
                  type="range"
                  min="9"
                  max="13"
                  step="0.5"
                  value={settings.typography.fontSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      typography: { ...settings.typography, fontSize: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full mt-2 accent-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium">
                  Line Height ({settings.typography.lineHeight})
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="1.6"
                  step="0.05"
                  value={settings.typography.lineHeight}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      typography: { ...settings.typography, lineHeight: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full mt-2 accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Template Theme Presets */}
          <div>
            <label className="font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Color & Style Presets
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(TEMPLATE_THEMES) as TemplateTheme[]).map((themeKey) => {
                const t = TEMPLATE_THEMES[themeKey];
                const isSelected = settings.theme.template === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => handleThemePreset(themeKey)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: t.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Limit Constraint */}
          <div>
            <label className="font-bold text-slate-900 uppercase tracking-wider block mb-2">
              Page Limit
            </label>
            <div className="flex items-center gap-4">
              {(['1', '2', 'unlimited'] as PageLimit[]).map((limit) => (
                <label key={limit} className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="pageLimit"
                    value={limit}
                    checked={settings.pageLimit === limit}
                    onChange={() => setSettings({ ...settings, pageLimit: limit })}
                    className="accent-blue-600"
                  />
                  <span>{limit === 'unlimited' ? 'Unlimited' : `${limit} Page${limit === '2' ? 's' : ''}`}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer font-medium text-slate-600">
              <input
                type="checkbox"
                checked={settings.autoCompress}
                onChange={(e) => setSettings({ ...settings, autoCompress: e.target.checked })}
                className="accent-blue-600 rounded"
              />
              <span>Auto-compress font and margins to fit target page limit</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-16 px-6 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
          >
            Reset to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
