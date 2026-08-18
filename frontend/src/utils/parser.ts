import type { ResumeData, PersonalInfo, ResumeSection, SectionType } from '../types/resume';
import { defaultPageSettings } from '../constants/initialResume';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b(?:(?:\+91[\-\s]?)?[6-9]\d{9})\b/;
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/[a-zA-Z0-9\-_]+|[a-zA-Z0-9\-_]+\/in\/[a-zA-Z0-9\-_]+)/i;
const GITHUB_REGEX = /(?:github\.com\/[a-zA-Z0-9\-_]+)/i;

const SECTION_MATCHERS: { type: SectionType; title: string; regex: RegExp }[] = [
  { type: 'summary', title: 'SUMMARY', regex: /^(?:professional\s*summary|executive\s*summary|career\s*objective|career\s*profile|objective|summary|profile|about\s*me|synopsis|professional\s*synopsis|executive\s*profile|personal\s*statement)$/i },
  { type: 'skills', title: 'TECHNICAL SKILLS', regex: /^(?:technical\s*skills|other\s*skills|key\s*skills|core\s*skills|additional\s*skills|technologies\s*used|technology\s*used|key\s*competencies|core\s*competencies|competencies|skills\s*&\s*abilities|skills|technologies|tools\s*&\s*technologies|tools\s*and\s*technologies|programming\s*languages|technical\s*expertise|tech\s*stack|tools\s*used|skills\s*&\s*tools|areas\s*of\s*expertise|domain\s*expertise|core\s*strengths|technical\s*proficiencies|cloud\s*&\s*devops|frameworks|methodologies|expertise)$/i },
  { type: 'experience', title: 'EXPERIENCE', regex: /^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history|work\s*history|experience\s*summary|professional\s*background|employment\s*details|industry\s*experience|enterprise\s*program\s*experience|delivery\s*&\s*operations|leadership\s*experience)$/i },
  { type: 'projects', title: 'PROJECTS', regex: /^(?:academic\s*projects|key\s*projects|personal\s*projects|project\s*details|projects\s*handled|projects\s*undertaken|project\s*experience|projects|key\s*project\s*details|selected\s*projects|major\s*projects|client\s*engagements)$/i },
  { type: 'education', title: 'EDUCATION', regex: /^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education|degrees|academic\s*details|academic\s*credentials|education\s*&\s*training|education\s*&\s*qualifications)$/i },
  { type: 'certifications', title: 'CERTIFICATIONS', regex: /^(?:certifications?\s*(?:&|and|\/|\+)\s*achievements?|certifications?\s*(?:&|and|\/|\+)\s*licenses?|certifications?\s*(?:&|and|\/|\+)\s*trainings?|licenses?\s*&\s*certifications?|certifications?|certificates?|courses|trainings?|credentials?|licenses?|professional\s*certifications?)$/i },
  { type: 'achievements', title: 'ACHIEVEMENTS', regex: /^(?:achievements?\s*(?:&|and|\/|\+)\s*certifications?|key\s*achievements?|selected\s*achievements?|notable\s*achievements?|achievements?|awards?\s*(?:&|and|\/|\+)?\s*recognitions?|awards?|honors?\s*(?:&|and|\/|\+)?\s*awards?|honors?|patents?\s*(?:&|and|\/|\+)?\s*publications?|patents?\s*(?:&|and|\/|\+)?\s*innovations?|patents?|publications?|innovations?|extracurricular\s*activities|activities)$/i },
  { type: 'additional', title: 'ADDITIONAL INFO', regex: /^(?:additional\s*info|additional\s*information|languages?\s*(?:known|proficiency)?|personal\s*details|interests|hobbies|volunteer\s*experience|community\s*service)$/i },
];

const NON_NAME_HEADERS = new Set([
  'CAREER OBJECTIVE', 'OBJECTIVE', 'SUMMARY', 'PROFESSIONAL SUMMARY',
  'RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'EXPERIENCE', 'PROJECT DETAILS',
  'TECHNOLOGIES USED', 'TECHNICAL SKILLS', 'EDUCATION', 'KEY COMPETENCIES',
  'WORK EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'OTHER SKILLS',
  'KEY SKILLS', 'SKILLS', 'ADDITIONAL INFO', 'CERTIFICATIONS & ACHIEVEMENTS',
  'AWARDS & RECOGNITION', 'PATENTS & INNOVATIONS'
]);

export function normalizeHeaderText(line: string): string {
  // 1. Un-space single characters: "C E R T I F I C A T I O N S" -> "CERTIFICATIONS"
  const unspaced = line.replace(/(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)/g, '').trim();
  // 2. Remove leading Roman numerals, numbers, list markers, markdown, decorations
  const clean = unspaced
    .replace(/^(?:(?:[IVXLCDM]+\b|\d+(?:\.\d+)*)\s*[\.\:\-\)\>]|#+|\*+|={2,}|_{2,}|\-{2,}|\[|\(|\~|\•|\❖|\➢|\▪|\*)/gi, '')
    .replace(/[:_\~\[\]\(\)\-=#*]+$/g, '')
    .trim();
  return clean;
}

function matchSectionHeader(line: string): { type: SectionType; title: string } | null {
  const norm = normalizeHeaderText(line);
  if (!norm || norm.length > 60) return null;

  // Don't match lines that look like complete sentences
  const words = norm.split(/\s+/);
  if (words.length > 8) return null;
  if (/^[a-z]/.test(line.trim())) return null;

  // 1. Direct Regex Match
  for (const matcher of SECTION_MATCHERS) {
    if (matcher.regex.test(norm)) {
      const displayTitle = norm.length >= 3 ? norm.toUpperCase() : matcher.title;
      return { type: matcher.type, title: displayTitle };
    }
  }

  // 2. Compound and semantic header keywords fallback
  const lower = norm.toLowerCase();

  // Summary / Profile
  if (lower.includes('summary') || lower.includes('objective') || lower.includes('synopsis') || lower.includes('profile') || lower.includes('about me') || lower.includes('overview') || lower.includes('biography')) {
    return { type: 'summary', title: norm.toUpperCase() };
  }

  // Certifications & Accreditations & Licenses
  if (lower.includes('certif') || lower.includes('license') || lower.includes('credential') || lower.includes('accredit') || lower.includes('training') || lower.includes('course') || lower.includes('workshop')) {
    return { type: 'certifications', title: norm.toUpperCase() };
  }

  // Achievements, Awards, Patents & Publications
  if (lower.includes('patent') || lower.includes('publication') || lower.includes('award') || lower.includes('honor') || lower.includes('achievement') || lower.includes('recognition') || lower.includes('innovation') || lower.includes('speaking') || lower.includes('keynote') || lower.includes('whitepaper')) {
    return { type: 'achievements', title: norm.toUpperCase() };
  }

  // Projects & Portfolio
  if (lower.includes('project') || lower.includes('portfolio') || lower.includes('case stud') || lower.includes('engagement') || lower.includes('capstone') || lower.includes('hackathon')) {
    return { type: 'projects', title: norm.toUpperCase() };
  }

  // Education & Academics
  if (lower.includes('educat') || lower.includes('academic') || lower.includes('degree') || lower.includes('qualification') || lower.includes('university') || lower.includes('college') || lower.includes('school')) {
    return { type: 'education', title: norm.toUpperCase() };
  }

  // Skills, Tools & Competencies
  if (lower.includes('competenc') || lower.includes('proficienc') || lower.includes('tech stack') || lower.includes('technolog') || lower.includes('tool') || lower.includes('programming') || lower.includes('framework') || lower.includes('expertise') || (lower.includes('skill') && !lower.includes('responsible'))) {
    return { type: 'skills', title: norm.toUpperCase() };
  }

  // Experience, Work History & Leadership
  if (lower.includes('experien') || lower.includes('employment') || lower.includes('career') || lower.includes('work history') || lower.includes('background') || lower.includes('internship') || lower.includes('leadership') || lower.includes('delivery & operation') || lower.includes('consulting')) {
    return { type: 'experience', title: norm.toUpperCase() };
  }

  // Languages & Additional
  if (lower.includes('language') || lower.includes('interest') || lower.includes('hobby') || lower.includes('hobbies') || lower.includes('volunteer') || lower.includes('affiliat') || lower.includes('membership') || lower.includes('extracurricular') || lower.includes('reference') || lower.includes('additional')) {
    return { type: 'additional', title: norm.toUpperCase() };
  }

  return null;
}

function isPureContactLine(line: string): boolean {
  const clean = line.trim();
  if (!clean) return true;
  if (/\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b/i.test(clean)) {
    return false;
  }
  if (EMAIL_REGEX.test(clean) || PHONE_REGEX.test(clean)) {
    const textWithoutContact = clean.replace(EMAIL_REGEX, '').replace(PHONE_REGEX, '').replace(/[ ,|•-📍📞✉️🔗]/g, '');
    if (textWithoutContact.length < 25) return true;
  }
  if (clean.startsWith('📍') || clean.startsWith('📞') || clean.startsWith('✉️') || clean.startsWith('🔗')) {
    if (clean.length < 35) return true;
  }
  return false;
}

function extractCandidateNameAndTitle(lines: string[]): { fullName: string; jobTitle: string; location: string } {
  let fullName = 'YOUR NAME';
  let jobTitle = 'Professional';
  let location = 'Kerala, India';

  // Check line 0 first (standard resume layout)
  if (lines.length > 0) {
    const firstClean = normalizeHeaderText(lines[0]);
    const firstUpper = firstClean.toUpperCase();
    if (
      !NON_NAME_HEADERS.has(firstUpper) &&
      !matchSectionHeader(firstClean) &&
      !isPureContactLine(firstClean) &&
      firstClean.length < 40 &&
      !/\b(engineer|developer|coordinator|manager|specialist|artist|photographer)\b/i.test(firstClean)
    ) {
      fullName = firstClean.toUpperCase();
    }
  }

  // If not on line 0, scan top lines
  if (fullName === 'YOUR NAME') {
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const l = lines[i];
      const norm = normalizeHeaderText(l).toUpperCase();
      if (NON_NAME_HEADERS.has(norm) || matchSectionHeader(l) || isPureContactLine(l)) continue;
      if (/^[A-Z][A-Za-z\.\s]{1,35}$/.test(l.trim())) {
        const words = l.trim().split(/\s+/);
        if (words.length >= 1 && words.length <= 4 && !words.some(w => NON_NAME_HEADERS.has(w.toUpperCase()) || ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst', 'technology', 'used', 'role', 'responsibilities', 'skills', 'other'].includes(w.toLowerCase()))) {
          fullName = l.trim().toUpperCase();
          break;
        }
      }
    }
  }

  // If still not found, search isolated uppercase lines
  if (fullName === 'YOUR NAME') {
    for (const l of lines) {
      const norm = normalizeHeaderText(l).toUpperCase();
      if (NON_NAME_HEADERS.has(norm) || matchSectionHeader(l) || isPureContactLine(l)) continue;
      if (/^[A-Z\s\.]{3,25}$/.test(l.trim())) {
        const words = l.trim().split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && !words.some(w => NON_NAME_HEADERS.has(w.toUpperCase()) || ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst', 'technology', 'used', 'role', 'responsibilities', 'project', 'academic', 'skills', 'other'].includes(w.toLowerCase()))) {
          fullName = l.trim().toUpperCase();
          break;
        }
      }
    }
  }

  // Extract location from contact lines
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (EMAIL_REGEX.test(l) || PHONE_REGEX.test(l)) {
      const parts = l.split(/[|•,]/).map(p => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (!EMAIL_REGEX.test(p) && !PHONE_REGEX.test(p) && p.length >= 3 && p.length <= 30) {
          if (!/\b(college|university|school|drama|degree|diploma)\b/i.test(p)) {
            location = p;
            break;
          }
        }
      }
    }
  }

  // Search for job title in lines 1-6
  const titlePattern = /\b((?:Senior\s+|Junior\s+|Lead\s+|Creative\s+)?(?:Photographer(?:\s+and\s+Visual\s+Artist)?|Visual\s+Artist|Technical\s+Coordinator|Stage\s+Manager|Software\s+Developer|Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer|Frontend\s+Developer|Backend\s+Developer|\w+\s+Coordinator|\w+\s+Manager|\w+\s+Artist|\w+\s+Engineer|\w+\s+Developer))\b/i;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const clean = lines[i].trim();
    if (matchSectionHeader(clean) || clean.toUpperCase() === fullName) continue;
    const m = clean.match(titlePattern);
    if (m) {
      jobTitle = m[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      break;
    } else if (clean.length < 40 && ['photographer', 'artist', 'developer', 'engineer', 'coordinator', 'manager'].some(w => clean.toLowerCase().includes(w))) {
      jobTitle = clean;
      break;
    }
  }

  return { fullName, jobTitle, location };
}

/**
 * 100% Verbatim Parser: Extracts raw text and splits into distinct sections cleanly.
 */
export function parseRawResumeText(rawText: string, _fileName = 'Uploaded Resume'): ResumeData {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) {
    return {
      personalInfo: {
        fullName: 'YOUR NAME',
        jobTitle: 'Professional Title',
        phone: '',
        email: '',
        location: '',
        linkedin: '',
      },
      sections: [
        {
          id: `sec-${Date.now()}`,
          type: 'summary',
          title: 'SUMMARY',
          visible: true,
          contentHtml: '<p>Paste or edit your resume content here.</p>',
        }
      ],
      pageSettings: defaultPageSettings,
    };
  }

  // 1. Extract Personal Info
  const { fullName, jobTitle, location } = extractCandidateNameAndTitle(lines);
  const allText = lines.join(' ');
  const emailMatch = allText.match(EMAIL_REGEX);
  
  // Phone extraction excluding year ranges
  let phoneStr = '';
  const phoneMatches = allText.matchAll(new RegExp(PHONE_REGEX, 'g'));
  for (const match of phoneMatches) {
    const candidatePhone = match[0].trim();
    if (!/\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d)\b/.test(candidatePhone)) {
      phoneStr = candidatePhone;
      break;
    }
  }

  const linkedinMatch = allText.match(LINKEDIN_REGEX);
  const githubMatch = allText.match(GITHUB_REGEX);

  const personalInfo: PersonalInfo = {
    fullName: fullName.length > 35 ? fullName.slice(0, 35) : fullName,
    jobTitle,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneStr,
    location,
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    github: githubMatch ? githubMatch[0] : undefined,
  };

  // 2. Extract Sections with Header Normalization
  const sections: ResumeSection[] = [];
  let currentSectionType: SectionType | null = null;
  let currentSectionTitle = '';
  let currentLines: string[] = [];

  const flushCurrentSection = () => {
    if (currentSectionType && currentLines.length > 0) {
      let html = '';
      const listItems: string[] = [];
      const paragraphs: string[] = [];

      currentLines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        if (cleanLine.toUpperCase() === fullName) return;
        if (currentSectionType === 'summary' && isPureContactLine(cleanLine)) {
          return;
        }

        if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*') || cleanLine.startsWith('❖') || cleanLine.startsWith('➢') || cleanLine.startsWith('▪') || /^\d+\./.test(cleanLine)) {
          const clean = cleanLine.replace(/^[•\-\*\d\.\s❖➢▪]+/, '');
          listItems.push(`<li>${clean}</li>`);
        } else if (/^(?:technolog(?:y|ies)\s*used|tech\s*stack|tools|roles?\s*(?:and|&)\s*responsibilities)\s*:/i.test(cleanLine)) {
          if (listItems.length > 0) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems.length = 0;
          }
          const parts = cleanLine.split(/:\s*/);
          html += `<p><strong>${parts[0]}:</strong> ${parts.slice(1).join(': ')}</p>`;
        } else {
          if (listItems.length > 0) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems.length = 0;
          }
          paragraphs.push(`<p>${cleanLine}</p>`);
        }
      });

      if (listItems.length > 0) {
        html += `<ul>${listItems.join('')}</ul>`;
      }
      if (paragraphs.length > 0) {
        html = paragraphs.join('') + html;
      }

      if (html.trim()) {
        sections.push({
          id: `sec-${sections.length + 1}-${Date.now()}`,
          type: currentSectionType,
          title: currentSectionTitle,
          visible: true,
          contentHtml: html,
        });
      }
      currentLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clean = line.trim();
    if (!clean) continue;
    if (i < 6) {
      if (clean.toUpperCase() === fullName.toUpperCase()) continue;
      if (clean.toLowerCase() === jobTitle.toLowerCase()) continue;
      if (isPureContactLine(clean)) continue;
    }

    const headerMatch = matchSectionHeader(clean);

    // Implicit summary trigger if no section started yet
    if (currentSectionType === null && !headerMatch && /^(?:Creative|Enthusiastic|Results-driven|Experienced|Passionate|Seeking|Dedicated|Dynamic|Motivated|Detail-oriented|Professional)\b/i.test(clean)) {
      currentSectionType = 'summary';
      currentSectionTitle = 'SUMMARY';
    }

    // Implicit experience trigger
    if (!headerMatch && /^(?:Software\s+Engineer|Software\s+Developer|Junior\s+Software\s+Engineer|Senior\s+Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer)\s*[:\-–|]/i.test(clean)) {
      if (currentSectionType !== 'experience') {
        flushCurrentSection();
        currentSectionType = 'experience';
        currentSectionTitle = 'WORK EXPERIENCE';
      }
    }

    // Implicit project trigger
    if (!headerMatch && i + 1 < lines.length && /^Technolog(?:y|ies)\s*Used\s*:/i.test(lines[i + 1])) {
      if (currentSectionType !== 'projects') {
        flushCurrentSection();
        currentSectionType = 'projects';
        currentSectionTitle = 'PROJECT DETAILS';
      }
    }

    if (headerMatch) {
      flushCurrentSection();
      currentSectionType = headerMatch.type;
      currentSectionTitle = headerMatch.title;
    } else {
      if (currentSectionType) {
        currentLines.push(line);
      } else {
        // Only start implicit section if line has substantive prose
        if (!isPureContactLine(line) && clean.toUpperCase() !== fullName.toUpperCase() && clean.length > 25) {
          currentSectionType = 'summary';
          currentSectionTitle = 'SUMMARY';
          currentLines.push(line);
        }
      }
    }
  }

  flushCurrentSection();

  // Deduplicate sections with identical titles or duplicate summary sections
  const deduplicatedSections: ResumeSection[] = [];
  sections.forEach((sec) => {
    const existing = deduplicatedSections.find(
      (s) => s.title.trim().toUpperCase() === sec.title.trim().toUpperCase()
    );
    if (existing) {
      existing.contentHtml = `${existing.contentHtml}\n${sec.contentHtml}`;
    } else {
      deduplicatedSections.push(sec);
    }
  });

  if (deduplicatedSections.length === 0) {
    deduplicatedSections.push({
      id: `sec-${Date.now()}`,
      type: 'summary',
      title: 'SUMMARY',
      visible: true,
      contentHtml: lines.filter(l => !isPureContactLine(l)).map(l => `<p>${l}</p>`).join(''),
    });
  }

  return {
    personalInfo,
    sections: deduplicatedSections,
    pageSettings: defaultPageSettings,
  };
}
