export type SectionType = 
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'additional'
  | 'custom';

export type PaperSize = 'a4' | 'letter' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';
export type PageLimit = '1' | '2' | 'unlimited';
export type TemplateTheme = 'classic' | 'modern' | 'minimalist' | 'executive' | 'creative';
export type EditMode = 'richtext' | 'structured';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  techStack: string[];
  link?: string;
  year?: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface AdditionalItem {
  id: string;
  label: string;
  value: string;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  pageBreakBefore?: boolean;
  // Free-form HTML / rich text representation for WYSIWYG mode
  contentHtml: string;
  // Structured data representations
  structuredData?: {
    summaryText?: string;
    experiences?: ExperienceItem[];
    educations?: EducationItem[];
    skillCategories?: SkillCategory[];
    projects?: ProjectItem[];
    certifications?: CertificationItem[];
    achievements?: AchievementItem[];
    additionals?: AdditionalItem[];
  };
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  github?: string;
  website?: string;
  avatarUrl?: string;
}

export interface PageSettings {
  paperSize: PaperSize;
  orientation: PageOrientation;
  margins: {
    top: number;    // in inches, e.g. 0.5
    bottom: number; // in inches
    left: number;   // in inches
    right: number;  // in inches
  };
  typography: {
    fontFamily: string; // 'Inter', 'Lora', 'Roboto', 'Times New Roman', 'Poppins', 'Merriweather', 'Outfit'
    fontSize: number;   // in pt, e.g. 10.5
    lineHeight: number; // e.g. 1.25
    headingScale: number; // e.g. 1.2
  };
  theme: {
    template: TemplateTheme;
    primaryColor: string;
    accentColor: string;
    textColor: string;
    headingColor: string;
  };
  columns: 1 | 2;
  pageLimit: PageLimit;
  autoCompress: boolean;
}

export interface AISuggestion {
  id: string;
  sectionId: string;
  actionTitle: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  metricsAdded?: string[];
  applied: boolean;
}

export interface ChronologicalAnalysis {
  isReverseChronological: boolean;
  score: number; // 0 - 100
  timelineItems: {
    sectionTitle: string;
    textSnippet: string;
    startYear: number;
    endYear: number; // 9999 for Present
    isOutOfOrder: boolean;
  }[];
  warnings: string[];
}

export interface ATSScoreBreakdown {
  overallScore: number; // 0 - 100
  readabilityRating: 'Poor' | 'Average' | 'Good' | 'Excellent';
  actionVerbsScore: number;
  quantificationScore: number;
  sectionCompletenessScore: number;
  contactInfoScore: number;
  chronologicalScore: number;
  chronologicalAnalysis?: ChronologicalAnalysis;
  keywordMatchScore?: number;
  suggestions: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  label: string;
  wordCount: number;
  pageCount: number;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
  pageSettings: PageSettings;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
  pageSettings: PageSettings;
}

export type MergeMode = 'single_with_jd' | 'merge_with_jd' | 'merge_only';

export interface ResumeSourceItem {
  id?: string;
  content: string;
  filename: string;
  isPrimary: boolean;
  parsedData?: ResumeData;
  fileSize?: string;
  sectionsCount?: number;
}

export interface JobDescriptionInput {
  text: string;
  customKeywords?: string[];
}

export interface MergeOptions {
  preservePrimaryStructure?: boolean;
  maxBulletsPerExperience?: number;
  preferredTone?: 'executive' | 'professional' | 'technical';
}

export interface ResumeMergeRequest {
  primaryResume: ResumeSourceItem;
  secondaryResumes: ResumeSourceItem[];
  jobDescription?: JobDescriptionInput;
  mode: MergeMode;
  options?: MergeOptions;
  apiKey?: string;
}

export interface MergeMetadata {
  mode: string;
  sourcesAnalyzed: number;
  sectionsMerged: string[];
  deduplicationCount: number;
  newAchievementsAdded: number;
  jdMatchScore?: number;
  skillGaps: string[];
  suggestedAdditions: string[];
  mustHaveKeywordsFound: string[];
  missingKeywords: string[];
}

export interface ResumeMergeResponse {
  mergedResume: ResumeData;
  mergeMetadata: MergeMetadata;
  changesLog: string[];
}

export interface GenerateJDResponse {
  text: string;
  keywords: string[];
  mustHave: string[];
  preferred: string[];
}

