const fs = require('fs');

const rawText = `ANITHA V
Fresher - Software Developer
8590905348 | anithaanurudhan24@gmail.com | Cherthala, Kerala

📍 Cherthala, Kerala
📞 8590905348
✉️ anithaanurudhan24@gmail.com
P R O F E S S I O N A L S U M M A R Y
Enthusiastic and detail-oriented Computer Engineering diploma student with a strong foundation in programming,
problem-solving, and web development. Proficient in Python, Java, and Django with hands-on experience through
academic projects. Passionate about building scalable applications and eager to contribute to inovative software
development teams.
T E C H N I C A L S K I L L S
❖ Languages: Python, Java, C
❖ Web Tech : HTML, CSS, Django
❖ Tools : MS Office, Git (Basic)
❖ Concepts : OOP, Problem Solving
K E Y C O M P E T E N C I E S
❖ Teamwork
❖ Communication
❖ Adaptability
❖ Quick Learning
❖ Attention to Detail
❖ Eager to Learn
P R O J E C T S`;

const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/;
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/[a-zA-Z0-9\-_]+|[a-zA-Z0-9\-_]+\/in\/[a-zA-Z0-9\-_]+)/i;
const GITHUB_REGEX = /(?:github\.com\/[a-zA-Z0-9\-_]+)/i;
const LOCATION_REGEX = /(?:[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/;

const SECTION_MATCHERS = [
  { type: 'summary', title: 'SUMMARY', regex: /^(?:professional\s*summary|executive\s*summary|career\s*objective|objective|summary|profile|about\s*me)$/i },
  { type: 'skills', title: 'TECHNICAL SKILLS', regex: /^(?:technical\s*skills|key\s*competencies|core\s*competencies|competencies|skills|technologies|tools\s*&\s*technologies|programming\s*languages)$/i },
  { type: 'experience', title: 'EXPERIENCE', regex: /^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history)$/i },
  { type: 'projects', title: 'PROJECTS', regex: /^(?:academic\s*projects|key\s*projects|personal\s*projects|projects)$/i },
  { type: 'education', title: 'EDUCATION', regex: /^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education)$/i },
  { type: 'certifications', title: 'CERTIFICATIONS', regex: /^(?:certifications|certificates|courses|trainings|credentials)$/i },
  { type: 'achievements', title: 'ACHIEVEMENTS', regex: /^(?:achievements|awards|honors|extracurricular\s*activities|activities)$/i },
  { type: 'additional', title: 'ADDITIONAL INFO', regex: /^(?:additional\s*info|additional\s*information|languages|personal\s*details|interests)$/i },
];

function normalizeHeaderText(line) {
  const unspaced = line.replace(/(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)/g, '').trim();
  return unspaced.replace(/^[•\-\*\d\.\s#_]+|[:_]+$/g, '').trim();
}

function matchSectionHeader(line) {
  const norm = normalizeHeaderText(line);
  if (!norm || norm.length > 40) return null;
  for (const matcher of SECTION_MATCHERS) {
    if (matcher.regex.test(norm)) {
      return { type: matcher.type, title: matcher.title };
    }
  }
  return null;
}

function isPureContactLine(line) {
  const clean = line.trim();
  if (!clean) return true;
  if (EMAIL_REGEX.test(clean) || PHONE_REGEX.test(clean)) {
    const textWithoutContact = clean.replace(EMAIL_REGEX, '').replace(PHONE_REGEX, '').replace(/[ ,|•-📍📞✉️🔗]/g, '');
    if (textWithoutContact.length < 25) return true;
  }
  if (clean.startsWith('📍') || clean.startsWith('📞') || clean.startsWith('✉️') || clean.startsWith('🔗')) {
    if (clean.length < 35) return true;
  }
  return false;
}

function parseRawResumeText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const fullName = normalizeHeaderText(lines[0]).toUpperCase();
  let jobTitle = 'Fresher / Software Developer';
  
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    const l = lines[i];
    if (!isPureContactLine(l) && !matchSectionHeader(l) && l.length < 45) {
      jobTitle = l;
      break;
    }
  }

  const sections = [];
  let currentSectionType = null;
  let currentSectionTitle = '';
  let currentLines = [];

  const flushCurrentSection = () => {
    if (currentSectionType && currentLines.length > 0) {
      let html = '';
      const listItems = [];
      const paragraphs = [];

      currentLines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        if (currentSectionType === 'summary' && isPureContactLine(cleanLine)) {
          return;
        }

        if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*') || cleanLine.startsWith('❖') || cleanLine.startsWith('➢') || /^\d+\./.test(cleanLine)) {
          const clean = cleanLine.replace(/^[•\-\*\d\.\s❖➢▪]+/, '');
          listItems.push(`<li>${clean}</li>`);
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
          type: currentSectionType,
          title: currentSectionTitle,
          contentHtml: html,
        });
      }
      currentLines = [];
    }
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = matchSectionHeader(line);

    if (headerMatch) {
      flushCurrentSection();
      currentSectionType = headerMatch.type;
      currentSectionTitle = headerMatch.title;
    } else {
      if (currentSectionType) {
        currentLines.push(line);
      } else {
        if (!isPureContactLine(line) && line !== jobTitle) {
          currentSectionType = 'summary';
          currentSectionTitle = 'SUMMARY';
          currentLines.push(line);
        }
      }
    }
  }

  flushCurrentSection();
  return sections;
}

try {
  const result = parseRawResumeText(rawText);
  console.log('Resulting sections count:', result.length);
  result.forEach(s => console.log(' ->', s.type, s.title));
} catch (e) {
  console.error('Crash in parseRawResumeText:', e);
}
