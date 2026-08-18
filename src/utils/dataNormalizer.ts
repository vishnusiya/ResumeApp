import type { ResumeData, PersonalInfo, ResumeSection, PageSettings, SectionType } from '../types/resume';
import { defaultPageSettings, initialResumeData } from '../constants/initialResume';

/**
 * Deeply sanitizes and normalizes any resume data object (from JSON, file upload, or localStorage)
 * to guarantee that no undefined or null property accesses can ever crash React.
 */
export function sanitizeResumeData(raw: any): ResumeData {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(initialResumeData));
  }

  // 1. Sanitize Personal Info
  const rawInfo = raw.personalInfo || {};
  const personalInfo: PersonalInfo = {
    fullName: typeof rawInfo.fullName === 'string' && rawInfo.fullName.trim()
      ? rawInfo.fullName.trim()
      : 'YOUR FULL NAME',
    jobTitle: typeof rawInfo.jobTitle === 'string' && rawInfo.jobTitle.trim()
      ? rawInfo.jobTitle.trim()
      : 'Professional Title',
    phone: typeof rawInfo.phone === 'string' ? rawInfo.phone : '',
    email: typeof rawInfo.email === 'string' ? rawInfo.email : '',
    location: typeof rawInfo.location === 'string' ? rawInfo.location : '',
    linkedin: typeof rawInfo.linkedin === 'string' ? rawInfo.linkedin : '',
    github: typeof rawInfo.github === 'string' ? rawInfo.github : '',
    website: typeof rawInfo.website === 'string' ? rawInfo.website : '',
    avatarUrl: typeof rawInfo.avatarUrl === 'string' ? rawInfo.avatarUrl : '',
  };

  // 2. Sanitize Sections
  let sections: ResumeSection[] = [];
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    sections = raw.sections.map((sec: any, idx: number) => {
      const type: SectionType = sec?.type || 'summary';
      const title: string = typeof sec?.title === 'string' && sec.title.trim()
        ? sec.title.trim().toUpperCase()
        : 'SECTION';
      const contentHtml: string = typeof sec?.contentHtml === 'string'
        ? sec.contentHtml
        : '<p></p>';
      const id: string = sec?.id || `sec-${idx + 1}-${Date.now()}`;
      const visible: boolean = sec?.visible !== false;

      return {
        id,
        type,
        title,
        visible,
        pageBreakBefore: Boolean(sec?.pageBreakBefore),
        contentHtml,
        structuredData: sec?.structuredData && typeof sec.structuredData === 'object'
          ? sec.structuredData
          : undefined,
      };
    });
  }

  // Fallback if no valid sections exist
  if (sections.length === 0) {
    sections = JSON.parse(JSON.stringify(initialResumeData.sections));
  }

  // 3. Sanitize Page Settings
  const rawSettings = raw.pageSettings || {};
  const rawMargins = rawSettings.margins || {};
  const rawTypo = rawSettings.typography || {};
  const rawTheme = rawSettings.theme || {};

  const pageSettings: PageSettings = {
    paperSize: ['a4', 'letter', 'legal'].includes(rawSettings.paperSize)
      ? rawSettings.paperSize
      : defaultPageSettings.paperSize,
    orientation: ['portrait', 'landscape'].includes(rawSettings.orientation)
      ? rawSettings.orientation
      : defaultPageSettings.orientation,
    margins: {
      top: typeof rawMargins.top === 'number' ? rawMargins.top : defaultPageSettings.margins.top,
      bottom: typeof rawMargins.bottom === 'number' ? rawMargins.bottom : defaultPageSettings.margins.bottom,
      left: typeof rawMargins.left === 'number' ? rawMargins.left : defaultPageSettings.margins.left,
      right: typeof rawMargins.right === 'number' ? rawMargins.right : defaultPageSettings.margins.right,
    },
    typography: {
      fontFamily: typeof rawTypo.fontFamily === 'string' && rawTypo.fontFamily.trim()
        ? rawTypo.fontFamily
        : defaultPageSettings.typography.fontFamily,
      fontSize: typeof rawTypo.fontSize === 'number' ? rawTypo.fontSize : defaultPageSettings.typography.fontSize,
      lineHeight: typeof rawTypo.lineHeight === 'number' ? rawTypo.lineHeight : defaultPageSettings.typography.lineHeight,
      headingScale: typeof rawTypo.headingScale === 'number' ? rawTypo.headingScale : defaultPageSettings.typography.headingScale,
    },
    theme: {
      template: ['classic', 'modern', 'minimalist', 'executive', 'creative'].includes(rawTheme.template)
        ? rawTheme.template
        : defaultPageSettings.theme.template,
      primaryColor: typeof rawTheme.primaryColor === 'string' && rawTheme.primaryColor.trim()
        ? rawTheme.primaryColor
        : defaultPageSettings.theme.primaryColor,
      accentColor: typeof rawTheme.accentColor === 'string' && rawTheme.accentColor.trim()
        ? rawTheme.accentColor
        : defaultPageSettings.theme.accentColor,
      textColor: typeof rawTheme.textColor === 'string' && rawTheme.textColor.trim()
        ? rawTheme.textColor
        : defaultPageSettings.theme.textColor,
      headingColor: typeof rawTheme.headingColor === 'string' && rawTheme.headingColor.trim()
        ? rawTheme.headingColor
        : defaultPageSettings.theme.headingColor,
    },
    columns: rawSettings.columns === 2 ? 2 : 1,
    pageLimit: ['1', '2', 'unlimited'].includes(rawSettings.pageLimit)
      ? rawSettings.pageLimit
      : defaultPageSettings.pageLimit,
    autoCompress: Boolean(rawSettings.autoCompress),
  };

  return {
    personalInfo,
    sections,
    pageSettings,
  };
}
