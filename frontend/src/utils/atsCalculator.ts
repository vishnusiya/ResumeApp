import type { ResumeData, ATSScoreBreakdown, ChronologicalAnalysis } from '../types/resume';

const STRONG_ACTION_VERBS = [
  'spearheaded', 'architected', 'engineered', 'developed', 'designed', 'built',
  'optimized', 'accelerated', 'mentored', 'led', 'integrated', 'orchestrated',
  'automated', 'deployed', 'implemented', 'championed', 'transformed', 'delivered',
  'scaled', 'reduced', 'increased', 'generated', 'improved', 'cut', 'launched'
];

const STANDARD_TECH_KEYWORDS = [
  'python', 'react', 'fastapi', 'django', 'typescript', 'javascript', 'azure',
  'aws', 'docker', 'kubernetes', 'postgresql', 'redis', 'sql', 'rest', 'api',
  'ci/cd', 'git', 'microservices', 'prompt engineering', 'llm', 'rag', 'tailwind', 'selenium'
];

/**
 * Validates whether experience, projects, and education sections follow strict Reverse Chronological Order.
 */
export function analyzeChronologicalOrder(resume: ResumeData): ChronologicalAnalysis {
  const timelineItems: ChronologicalAnalysis['timelineItems'] = [];
  const warnings: string[] = [];
  const currentYear = new Date().getFullYear();

  (resume?.sections || []).forEach((sec) => {
    if (!sec || !sec.visible || !sec.contentHtml) return;
    if (['experience', 'education', 'projects'].includes(sec.type) || sec.title.toLowerCase().includes('experience')) {
      const html = sec.contentHtml;
      
      const divBlocks = html.match(/<div class="resume-item">[\s\S]*?<\/div>\s*<\/div>|<div class="resume-item">[\s\S]*?<\/ul>\s*<\/div>/gi);
      const textToScan = divBlocks ? divBlocks : html.split(/<\/div>|<\/p>|<li>/i);

      let prevEndYear = 99999;

      textToScan.forEach((chunk) => {
        const cleanChunk = chunk.replace(/<[^>]*>?/gm, ' ').trim();
        if (!cleanChunk || cleanChunk.length < 5) return;

        // Match date ranges: "2021 – Present", "2018 - 2021", "Jan 2019 – Mar 2023", "2024"
        const rangeMatch = cleanChunk.match(/\b(19\d\d|20\d\d)\s*[-–—/to\s]+\s*(19\d\d|20\d\d|present|current|now)\b/i);
        const singleYearMatch = !rangeMatch ? cleanChunk.match(/\b(19\d\d|20\d\d)\b/) : null;

        if (rangeMatch) {
          const startYear = parseInt(rangeMatch[1], 10);
          const endStr = rangeMatch[2].toLowerCase();
          const endYear = ['present', 'current', 'now'].includes(endStr) ? 9999 : parseInt(endStr, 10);

          const isOutOfOrder = endYear > prevEndYear && prevEndYear !== 99999;
          if (isOutOfOrder) {
            warnings.push(
              `Timeline disorder in "${sec.title}": Role ending ${endYear === 9999 ? 'Present' : endYear} appears after an older role (${prevEndYear === 9999 ? 'Present' : prevEndYear}). Reverse chronological order is recommended.`
            );
          }

          if (startYear > endYear && endYear !== 9999) {
            warnings.push(`Inverted date detected in "${sec.title}": ${startYear} – ${endYear}.`);
          }

          if (endYear !== 9999 && endYear > currentYear + 1) {
            warnings.push(`Future date anomaly in "${sec.title}": Year ${endYear} exceeds current calendar timeline.`);
          }

          prevEndYear = endYear;

          timelineItems.push({
            sectionTitle: sec.title,
            textSnippet: cleanChunk.slice(0, 40) + '...',
            startYear,
            endYear,
            isOutOfOrder,
          });
        } else if (singleYearMatch) {
          const year = parseInt(singleYearMatch[1], 10);
          const isOutOfOrder = year > prevEndYear && prevEndYear !== 99999;
          if (isOutOfOrder) {
            warnings.push(`Chronological disorder in "${sec.title}": Item from ${year} is listed below an earlier item (${prevEndYear}).`);
          }
          prevEndYear = year;
          timelineItems.push({
            sectionTitle: sec.title,
            textSnippet: cleanChunk.slice(0, 40) + '...',
            startYear: year,
            endYear: year,
            isOutOfOrder,
          });
        }
      });
    }
  });

  const outOfOrderCount = timelineItems.filter((t) => t.isOutOfOrder).length;
  const isReverseChronological = outOfOrderCount === 0 && warnings.length === 0;
  const score = isReverseChronological ? 100 : Math.max(0, 100 - outOfOrderCount * 25 - warnings.length * 10);

  return {
    isReverseChronological,
    score,
    timelineItems,
    warnings,
  };
}

export function calculateATSScore(resume: ResumeData, targetJobDescription?: string): ATSScoreBreakdown {
  const pInfo = resume?.personalInfo || {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
  };

  let fullText = `${pInfo.fullName || ''} ${pInfo.jobTitle || ''} ${pInfo.email || ''} ${pInfo.phone || ''} ${pInfo.location || ''} `;
  
  (resume?.sections || []).forEach(sec => {
    if (sec && sec.visible && sec.contentHtml) {
      fullText += `${sec.title || ''} ${sec.contentHtml} `;
    }
  });

  const cleanText = fullText.replace(/<[^>]*>?/gm, ' ').toLowerCase();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // 1. Contact Information Score (Max 20 pts)
  let contactInfoScore = 0;
  if ((pInfo.fullName || '').trim().length > 2) contactInfoScore += 4;
  if ((pInfo.email || '').includes('@')) contactInfoScore += 4;
  if ((pInfo.phone || '').trim().length > 5) contactInfoScore += 4;
  if ((pInfo.location || '').trim().length > 2) contactInfoScore += 4;
  if ((pInfo.linkedin || '').trim().length > 3) contactInfoScore += 4;

  // 2. Action Verbs Score (Max 25 pts)
  const foundActionVerbs = STRONG_ACTION_VERBS.filter(verb => cleanText.includes(verb));
  const actionVerbsScore = Math.min(25, Math.round((foundActionVerbs.length / 6) * 25));

  // 3. Quantification & Metrics Score (Max 25 pts)
  const metricMatches = cleanText.match(/\d+[\.,]?\d*[%kmb\+]?|\$\d+/gi) || [];
  const quantificationScore = Math.min(25, Math.round((metricMatches.length / 5) * 25));

  // 4. Section Completeness (Max 30 pts)
  let sectionCompletenessScore = 0;
  const activeTypes = new Set((resume?.sections || []).filter(s => s && s.visible).map(s => s.type));
  if (activeTypes.has('summary')) sectionCompletenessScore += 6;
  if (activeTypes.has('experience')) sectionCompletenessScore += 8;
  if (activeTypes.has('education')) sectionCompletenessScore += 5;
  if (activeTypes.has('skills')) sectionCompletenessScore += 6;
  if (activeTypes.has('projects')) sectionCompletenessScore += 5;

  // 5. Chronological Order & Timeline Validation (100% check)
  const chronologicalAnalysis = analyzeChronologicalOrder(resume);
  const chronologicalScore = chronologicalAnalysis.score;

  let overallScore = contactInfoScore + actionVerbsScore + quantificationScore + sectionCompletenessScore;

  // If chronological order has critical violations, adjust overall ATS readiness
  if (!chronologicalAnalysis.isReverseChronological) {
    overallScore = Math.max(20, Math.round(overallScore * 0.9));
  }

  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let keywordMatchScore: number | undefined = undefined;

  if (targetJobDescription && targetJobDescription.trim().length > 10) {
    const jdClean = targetJobDescription.toLowerCase();
    const jdWords = jdClean.split(/[\s,.;:()\/]+/).filter(w => w.length > 3);
    const uniqueJdKeywords = Array.from(new Set(jdWords.filter(w => STANDARD_TECH_KEYWORDS.includes(w) || w.length > 5)));

    if (uniqueJdKeywords.length > 0) {
      matchedKeywords = uniqueJdKeywords.filter(kw => cleanText.includes(kw));
      missingKeywords = uniqueJdKeywords.filter(kw => !cleanText.includes(kw)).slice(0, 10);
      keywordMatchScore = Math.round((matchedKeywords.length / uniqueJdKeywords.length) * 100);
      overallScore = Math.round(overallScore * 0.7 + keywordMatchScore * 0.3);
    }
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  let readabilityRating: 'Poor' | 'Average' | 'Good' | 'Excellent' = 'Good';
  if (wordCount < 150) readabilityRating = 'Poor';
  else if (wordCount < 300) readabilityRating = 'Average';
  else if (overallScore >= 85) readabilityRating = 'Good';
  if (overallScore >= 92) readabilityRating = 'Excellent';

  const suggestions: string[] = [];
  if (!chronologicalAnalysis.isReverseChronological && chronologicalAnalysis.warnings.length > 0) {
    suggestions.push(chronologicalAnalysis.warnings[0]);
  }
  if (foundActionVerbs.length < 5) {
    suggestions.push('Add more strong action verbs (e.g., Spearheaded, Architected, Optimized) to experience bullets.');
  }
  if (metricMatches.length < 4) {
    suggestions.push('Quantify your achievements with concrete metrics (percentages, dollar amounts, performance gains).');
  }
  if (!pInfo.linkedin || !pInfo.linkedin.trim()) {
    suggestions.push('Include your LinkedIn profile URL in contact information.');
  }
  if (wordCount < 350) {
    suggestions.push('Expand your experience and project descriptions to provide richer context for ATS parsers.');
  }
  if (missingKeywords.length > 0) {
    suggestions.push(`Consider adding target keywords found in the job description: ${missingKeywords.slice(0, 4).join(', ')}.`);
  }
  if (suggestions.length === 0) {
    suggestions.push('Excellent ATS readiness! Reverse-chronological timeline, strong action verbs, and verified metrics are intact.');
  }

  return {
    overallScore,
    readabilityRating,
    actionVerbsScore,
    quantificationScore,
    sectionCompletenessScore,
    contactInfoScore,
    chronologicalScore,
    chronologicalAnalysis,
    keywordMatchScore,
    suggestions,
    matchedKeywords,
    missingKeywords,
  };
}
