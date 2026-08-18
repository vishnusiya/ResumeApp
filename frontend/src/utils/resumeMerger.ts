import type {
  ResumeData,
  ResumeSection,
  ResumeMergeRequest,
  ResumeMergeResponse,
  MergeMetadata,
  GenerateJDResponse,
} from '../types/resume';
import { parseRawResumeText } from './parser';

export const COMMON_TECH_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'Node.js',
  'C#', '.NET', 'ASP.NET', 'Java', 'Spring Boot', 'Go', 'Golang', 'Rust', 'C++',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Kafka', 'RabbitMQ',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'Microservices',
  'Machine Learning', 'Deep Learning', 'LLM', 'LangChain', 'PyTorch', 'TensorFlow', 'Agile', 'Scrum'
];

export function extractKeywordsFromJDText(jdText: string): {
  all: string[];
  mustHave: string[];
  preferred: string[];
  domain: string[];
} {
  const lower = jdText.toLowerCase();
  const matchedTech = COMMON_TECH_SKILLS.filter((s) =>
    new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(lower)
  );

  // Capitalized terms extraction
  const words = jdText.match(/\b[A-Z][a-zA-Z0-9+#.]+(?:\s+[A-Z][a-zA-Z0-9+#.]+)*\b/g) || [];
  const stopWords = new Set([
    'The', 'A', 'An', 'In', 'On', 'At', 'For', 'With', 'About', 'Against', 'Between',
    'Into', 'Through', 'During', 'Before', 'After', 'Above', 'Below', 'To', 'From',
    'Up', 'Down', 'Out', 'Off', 'Over', 'Under', 'Again', 'Further', 'Then', 'Once',
    'Here', 'There', 'When', 'Where', 'Why', 'How', 'All', 'Any', 'Both', 'Each',
    'Few', 'More', 'Most', 'Other', 'Some', 'Such', 'No', 'Nor', 'Not', 'Only',
    'Own', 'Same', 'So', 'Than', 'Too', 'Very', 'Job', 'Role', 'Description',
    'Company', 'Candidate', 'Experience', 'Years', 'Work', 'Team', 'Responsibilities',
    'Requirements', 'Preferred', 'Qualifications', 'Position', 'Summary', 'Overview'
  ]);
  const filteredCaps = words.filter((w) => !stopWords.has(w) && w.length > 2);

  const combined = Array.from(new Set([...matchedTech, ...filteredCaps]));
  const mustHave = combined.slice(0, 6);
  const preferred = combined.slice(6, 12);
  const domain = combined.slice(12, 18);

  return {
    all: combined,
    mustHave,
    preferred,
    domain,
  };
}

export function cleanJobTitlePrompt(prompt: string): string {
  let cleaned = prompt.trim();
  const prefixes = [
    /^(?:create|generate|write|make|draft|build|provide)\s+(?:a\s+|an\s+|the\s+)?(?:job\s+description|jd|role\s+description|posting)\s+(?:for\s+|of\s+|about\s+)?/i,
    /^(?:looking\s+for|hiring\s+for|i\s+need|we\s+need|need\s+a|search\s+for)\s+(?:a\s+|an\s+|the\s+)?/i,
    /^(?:job\s+title|role|position)\s*:\s*/i,
  ];
  for (const p of prefixes) {
    cleaned = cleaned.replace(p, '').trim();
  }
  if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return cleaned.length > 2 ? cleaned : 'Professional Specialist';
}

export function generateLocalJobDescription(rolePrompt: string): GenerateJDResponse {
  const cleanTitle = cleanJobTitlePrompt(rolePrompt);
  const lowerTitle = cleanTitle.toLowerCase();

  // 1. Film, Media, Creative Direction, Advertising & Entertainment
  if (
    ['ad film', 'film director', 'director', 'video producer', 'creative director', 'art director', 'cinematographer', 'animator', 'video editor', 'producer', 'commercial', 'media', 'screenplay'].some(
      (k) => lowerTitle.includes(k)
    )
  ) {
    const text = `Job Title: ${cleanTitle}

Position Overview:
We are seeking an experienced and visionary ${cleanTitle} to lead the creative conceptualization, visual storytelling, and end-to-end production of high-impact commercials, brand campaigns, and multimedia content. In this role, you will define visual language, direct on-set crews and talent, and collaborate closely with agency leads and brand stakeholders.

Key Responsibilities:
• Develop compelling director's treatments, visual storyboards, and stylistic mood boards aligned with client briefs.
• Lead pre-production planning including script breakdowns, casting, location scouting, and production design.
• Direct actors, voiceover talent, and on-set technical crews (cinematography, gaffers, sound, art department).
• Supervise end-to-end post-production workflows, including offline/online video editing, color grading (DI), VFX, and sound design.
• Ensure broadcast-quality deliverables meeting brand standards, client timelines, and production budget constraints.

Required Qualifications & Skills:
• Proven portfolio / showreel demonstrating excellence in commercial advertising, narrative pacing, and visual storytelling.
• Deep expertise in Cinematography, Storyboarding, Creative Direction, Lighting, and Set Supervision.
• Strong working knowledge of post-production pipelines (Premiere Pro, DaVinci Resolve, After Effects, Audio Mixing).
• Outstanding creative leadership, actor coaching, and cross-functional stakeholder collaboration skills.`;
    const kws = ['Ad Film Direction', 'Visual Storytelling', 'Cinematography', 'Creative Direction', 'Storyboarding', 'Pre-Production', 'Post-Production', 'Casting & Talent Direction', 'Color Grading', 'Sound Design', 'Brand Campaigns', 'Set Management'];
    return { text, keywords: kws, mustHave: kws.slice(0, 6), preferred: kws.slice(6) };
  }

  // 2. Marketing, Growth, Brand & Social Media
  if (
    ['marketing', 'brand', 'seo', 'social media', 'growth', 'content', 'copywriter', 'pr', 'public relations'].some(
      (k) => lowerTitle.includes(k)
    )
  ) {
    const text = `Job Title: ${cleanTitle}

Position Overview:
We are seeking a results-driven ${cleanTitle} to architect, execute, and scale high-performing marketing and growth campaigns. In this role, you will drive customer acquisition, brand resonance, and measurable ROI across multi-channel digital and offline touchpoints.

Key Responsibilities:
• Formulate and execute integrated marketing campaigns to expand brand awareness and customer acquisition.
• Conduct audience segmentation, competitive benchmarking, and performance analytics to optimize conversion funnels.
• Partner with creative, product, and sales teams to produce engaging copy, campaign collateral, and landing pages.
• Oversee campaign budgets, track attribution metrics (CAC, LTV, ROAS), and deliver data-backed growth reports.
• Manage social media channels, paid media distribution, email automation, and organic search optimization (SEO).

Required Qualifications & Skills:
• Demonstrated track record of scaling user acquisition, lead generation, and brand visibility.
• Strong expertise in Campaign Strategy, Digital Marketing, Analytics (Google Analytics, Mixpanel), and Conversion Optimization.
• Proficiency in Marketing Automation, Paid Search/Social (Meta Ads, Google Ads), Content Strategy, and SEO.
• Exceptional analytical mindset with strong copywriting and presentation skills.`;
    const kws = ['Campaign Strategy', 'Digital Marketing', 'Brand Management', 'Customer Acquisition', 'SEO/SEM', 'Content Strategy', 'Google Analytics', 'ROAS Optimization', 'Paid Advertising', 'Marketing Automation', 'Email Campaigns', 'Audience Segmentation'];
    return { text, keywords: kws, mustHave: kws.slice(0, 6), preferred: kws.slice(6) };
  }

  // 3. Product & Project Management
  if (
    ['product manager', 'project manager', 'scrum master', 'program manager', 'product owner', 'agile coach'].some(
      (k) => lowerTitle.includes(k)
    )
  ) {
    const text = `Job Title: ${cleanTitle}

Position Overview:
We are seeking a strategic ${cleanTitle} to steer product vision, roadmap execution, and cross-functional delivery. You will bridge customer needs, technical architecture, and business objectives to launch impactful features with velocity.

Key Responsibilities:
• Define product requirements, user stories, acceptance criteria, and prioritized backlog milestones.
• Conduct customer research, usability studies, and data analysis to uncover unmet user needs.
• Collaborate daily with engineering, design, data science, and go-to-market teams in agile sprints.
• Establish key product KPIs, monitor feature adoption, and iterate based on quantitative metrics.
• Communicate product strategy, release schedules, and trade-offs to executive leadership.

Required Qualifications & Skills:
• Proven experience leading product discovery, agile sprint planning, and roadmap execution.
• Strong expertise in User-Centric Design, Product Analytics, Feature Prioritization, and A/B Testing.
• Exceptional cross-functional leadership, stakeholder management, and written/verbal communication.`;
    const kws = ['Product Roadmap', 'Agile / Scrum', 'Feature Prioritization', 'User Research', 'Product Analytics', 'A/B Testing', 'Stakeholder Management', 'Sprint Planning', 'PRD Authoring', 'Go-To-Market Strategy'];
    return { text, keywords: kws, mustHave: kws.slice(0, 6), preferred: kws.slice(6) };
  }

  // 4. Sales, Business Development, Operations & HR
  if (
    ['sales', 'business development', 'account executive', 'operations', 'hr', 'human resources', 'recruiter', 'talent acquisition', 'customer success'].some(
      (k) => lowerTitle.includes(k)
    )
  ) {
    const text = `Job Title: ${cleanTitle}

Position Overview:
We are looking for an ambitious and high-performing ${cleanTitle} to drive business expansion, operational efficiency, and organizational excellence. You will establish strong client partnerships, optimize internal workflows, and deliver measurable revenue and operational outcomes.

Key Responsibilities:
• Identify strategic business opportunities, manage stakeholder relationships, and achieve growth targets.
• Lead end-to-end execution of operational strategies, workflow automations, and resource allocation.
• Build, negotiate, and close high-value partnerships, contracts, and customer engagements.
• Monitor performance KPIs, optimize CRM pipelines, and present actionable quarterly forecasts.
• Foster high-trust relationships with internal teams, leadership, and external partners.

Required Qualifications & Skills:
• Proven track record of hitting key performance targets and driving business success.
• Strong expertise in Pipeline Management, Client Relationship Building, Negotiation, and Strategic Planning.
• Excellent analytical skills with proficiency in CRM platforms, forecasting, and cross-functional communication.`;
    const kws = ['Business Development', 'Strategic Planning', 'Relationship Management', 'Pipeline Management', 'Contract Negotiation', 'Operational Efficiency', 'CRM Platforms', 'Revenue Growth', 'Stakeholder Alignment', 'Forecasting'];
    return { text, keywords: kws, mustHave: kws.slice(0, 6), preferred: kws.slice(6) };
  }

  // 5. Software, Cloud & Engineering
  if (
    ['software', 'developer', 'engineer', 'architect', 'devops', 'cloud', 'data scientist', 'machine learning', 'frontend', 'backend', 'full-stack', 'full stack', 'qa', 'cybersecurity'].some(
      (k) => lowerTitle.includes(k)
    )
  ) {
    const techKws = COMMON_TECH_SKILLS.filter((kw) => lowerTitle.includes(kw.toLowerCase()));
    const sampleTech = techKws.length > 0 ? techKws.slice(0, 4).join(', ') : 'Modern Cloud Services, Scalable APIs, and CI/CD Pipelines';
    const text = `Job Title: ${cleanTitle}

Position Overview:
We are seeking an exceptional ${cleanTitle} to design, build, and deploy high-performance, resilient, and user-centric software systems. The ideal candidate brings strong architectural acumen, cross-functional collaboration, and expertise in ${sampleTech}.

Key Responsibilities:
• Architect, develop, and maintain mission-critical applications and distributed services.
• Drive engineering excellence, continuous integration/continuous delivery (CI/CD), and automated testing.
• Collaborate with product managers, designers, and engineering leadership to deliver scalable business outcomes.
• Champion performance optimization, observability, latency reduction, and robust system security.
• Mentor junior engineers and participate in code reviews, technical roadmapping, and design sprints.

Required Qualifications & Skills:
• Proven track record in building and scaling production software applications.
• Strong foundation in automated deployment pipelines, unit testing, distributed architecture, and API design.
• Deep commitment to clean code standards, system reliability, and agile development methodologies.`;
    const kws = [...techKws, 'Cloud Architecture', 'Distributed Systems', 'CI/CD Automation', 'RESTful APIs', 'Database Optimization', 'System Security', 'Agile/Scrum'].slice(0, 10);
    return { text, keywords: kws, mustHave: kws.slice(0, 6), preferred: kws.slice(6) };
  }

  // 6. Universal Professional Generator for Any Other Domain
  const text = `Job Title: ${cleanTitle}

Position Overview:
We are seeking a skilled, dedicated, and results-driven ${cleanTitle} to champion core initiatives, drive operational excellence, and deliver high-quality outcomes within our organization. The ideal candidate brings proven domain expertise, strong problem-solving skills, and a commitment to professional standards.

Key Responsibilities:
• Lead end-to-end planning, execution, and delivery of domain-specific projects and initiatives.
• Establish best practices, quality benchmarks, and continuous improvement protocols.
• Collaborate effectively with cross-functional teams, clients, and leadership to achieve organizational milestones.
• Monitor performance metrics, mitigate operational risks, and maintain meticulous documentation.
• Deliver exceptional service, subject-matter expertise, and measurable contributions to overall team success.

Required Qualifications & Skills:
• Proven professional experience and subject matter expertise as a ${cleanTitle}.
• Strong problem-solving, strategic planning, and project coordination capabilities.
• Outstanding interpersonal, verbal, and written communication skills with diverse stakeholders.
• Demonstrated ability to adapt to fast-paced environments and manage competing priorities with precision.`;
  const kws = [cleanTitle, 'Strategic Planning', 'Project Coordination', 'Quality Assurance', 'Stakeholder Communication', 'Operational Excellence', 'Risk Mitigation', 'Performance Optimization'];
  return { text, keywords: kws, mustHave: kws.slice(0, 5), preferred: kws.slice(5) };
}

function extractBulletsFromHtml(html: string): string[] {
  const liMatches = html.match(/<li>(.*?)<\/li>/gi);
  if (liMatches) {
    return liMatches
      .map((m) => m.replace(/<\/?li>/gi, '').trim())
      .filter((b) => b.length > 5);
  }
  const pMatches = html.match(/<p>(.*?)<\/p>/gi);
  if (pMatches) {
    return pMatches
      .map((m) => m.replace(/<\/?p>/gi, '').trim())
      .filter((b) => b.length > 5);
  }
  return [];
}

function mergeSkillsList(
  primaryHtml: string,
  secondaryHtmlList: string[],
  jdKeywords: string[]
): { html: string; addedFromJD: string[] } {
  const allTokens: string[] = [];

  [primaryHtml, ...secondaryHtmlList].forEach((html) => {
    const text = html.replace(/<[^>]*>/g, ' ');
    const parts = text.split(/[,•|\n;]/);
    parts.forEach((p) => {
      const clean = p
        .replace(/^(?:languages|frameworks|tools|technologies|databases|skills|core competencies)\s*:\s*/i, '')
        .trim();
      if (clean.length > 1 && clean.length < 40 && !/^(and|or|with|the)$/i.test(clean)) {
        allTokens.push(clean);
      }
    });
  });

  const seen = new Map<string, string>();
  allTokens.forEach((t) => {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.set(k, t);
    }
  });

  const addedFromJD: string[] = [];
  jdKeywords.forEach((kw) => {
    if (!seen.has(kw.toLowerCase()) && kw.length > 2) {
      const formatted = kw.charAt(0).toUpperCase() + kw.slice(1);
      seen.set(kw.toLowerCase(), formatted);
      addedFromJD.push(formatted);
    }
  });

  const unique = Array.from(seen.values());
  const html = `
    <p><strong>Core & Technical Competencies:</strong> ${unique.slice(0, 14).join(', ')}</p>
    <p><strong>Tools, Platforms & Frameworks:</strong> ${
      unique.length > 14 ? unique.slice(14, 28).join(', ') : unique.slice(0, 8).join(', ')
    }</p>
  `.trim();

  return { html, addedFromJD };
}

export function executeClientSideMerge(req: ResumeMergeRequest): ResumeMergeResponse {
  const changesLog: string[] = [];
  let dedupCount = 0;
  let newAchievementsAdded = 0;

  // 1. Ingest Primary
  const primaryResume: ResumeData =
    req.primaryResume.parsedData ||
    parseRawResumeText(req.primaryResume.content, req.primaryResume.filename || 'Primary Resume');

  // 2. Ingest Secondaries
  const secondaryResumes: ResumeData[] = req.secondaryResumes.map((sec, idx) => {
    return (
      sec.parsedData ||
      parseRawResumeText(sec.content, sec.filename || `Secondary Resume ${idx + 1}`)
    );
  });

  const totalSources = 1 + secondaryResumes.length;
  changesLog.push(`Ingested and structured ${totalSources} resume sources.`);

  // 3. JD Analysis
  const jdText = req.jobDescription?.text || '';
  const jdAnalysis = jdText
    ? extractKeywordsFromJDText(jdText)
    : { all: [], mustHave: [], preferred: [], domain: [] };

  if (jdText) {
    changesLog.push(`Target JD analyzed: Extracted ${jdAnalysis.all.length} relevant skill keywords.`);
  }

  const mergedSections: ResumeSection[] = [];
  const sectionsMergedNames: string[] = [];

  // Summary
  const primSummary = primaryResume.sections.find((s) => s.type === 'summary');
  if (primSummary) {
    let summaryHtml = primSummary.contentHtml;
    if (jdAnalysis.mustHave.length > 0) {
      const topKws = jdAnalysis.mustHave.slice(0, 4).join(', ');
      summaryHtml = `<p>Results-driven and strategic <strong>${primaryResume.personalInfo.jobTitle || 'Professional'}</strong> with specialized expertise in <strong>${topKws}</strong>. Demonstrated history of designing scalable architectures, leading high-velocity engineering initiatives, and achieving measurable business outcomes.</p>`;
      changesLog.push(`Tailored Professional Summary with JD priority keywords (${topKws}).`);
    }
    mergedSections.push({
      ...primSummary,
      contentHtml: summaryHtml,
    });
    sectionsMergedNames.push('Summary');
  }

  // Experience
  const primExp = primaryResume.sections.find((s) => s.type === 'experience');
  const secExps = secondaryResumes
    .map((sr) => sr.sections.find((s) => s.type === 'experience'))
    .filter((s): s is ResumeSection => s !== undefined);

  if (primExp || secExps.length > 0) {
    const baseExpHtml = primExp?.contentHtml || '';
    const primBullets = extractBulletsFromHtml(baseExpHtml);
    const seenBulletStems = new Set(
      primBullets.map((b) => b.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30))
    );

    const combinedBullets = [...primBullets];

    secExps.forEach((secExp, idx) => {
      const secBullets = extractBulletsFromHtml(secExp.contentHtml);
      secBullets.forEach((sb) => {
        const stem = sb.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
        if (seenBulletStems.has(stem)) {
          dedupCount++;
        } else {
          const hasMetrics = /\d+%|\$\d+|\d+x|\d+\s*(?:users|clients|projects)/i.test(sb);
          if (hasMetrics || combinedBullets.length < 8) {
            seenBulletStems.add(stem);
            combinedBullets.push(sb);
            newAchievementsAdded++;
            changesLog.push(
              `Integrated high-impact quantified metric from Secondary Resume ${idx + 1}: "${sb.slice(0, 45)}..."`
            );
          }
        }
      });
    });

    let mergedExpHtml = baseExpHtml;
    if (mergedExpHtml.includes('<ul>')) {
      const bulletHtml = combinedBullets.map((b) => `<li>${b}</li>`).join('');
      mergedExpHtml = mergedExpHtml.replace(/<ul>[\s\S]*?<\/ul>/, `<ul>${bulletHtml}</ul>`);
    } else {
      mergedExpHtml =
        baseExpHtml +
        combinedBullets
          .slice(primBullets.length)
          .map((b) => `<p>• ${b}</p>`)
          .join('');
    }

    mergedSections.push({
      id: primExp?.id || 'sec-exp-merged',
      type: 'experience',
      title: primExp?.title || 'PROFESSIONAL EXPERIENCE',
      visible: true,
      contentHtml: mergedExpHtml,
    });
    sectionsMergedNames.push('Experience');
  }

  // Skills
  const primSkills = primaryResume.sections.find((s) => s.type === 'skills');
  const secSkills = secondaryResumes
    .map((sr) => sr.sections.find((s) => s.type === 'skills'))
    .filter((s): s is ResumeSection => s !== undefined);

  const { html: mergedSkillsHtml, addedFromJD } = mergeSkillsList(
    primSkills?.contentHtml || '',
    secSkills.map((s) => s.contentHtml),
    jdAnalysis.mustHave
  );

  if (addedFromJD.length > 0) {
    changesLog.push(
      `Injected ${addedFromJD.length} target JD skills into Competencies: ${addedFromJD.join(', ')}.`
    );
  }
  changesLog.push('Consolidated and deduplicated skill sets across all sources.');

  mergedSections.push({
    id: primSkills?.id || 'sec-skills-merged',
    type: 'skills',
    title: primSkills?.title || 'TECHNICAL SKILLS',
    visible: true,
    contentHtml: mergedSkillsHtml,
  });
  sectionsMergedNames.push('Skills');

  // Education, Projects, Certifications, Achievements
  const otherTypes = ['education', 'projects', 'certifications', 'achievements', 'additional', 'custom'] as const;
  otherTypes.forEach((stype) => {
    const primS = primaryResume.sections.find((s) => s.type === stype);
    const secSList = secondaryResumes
      .map((sr) => sr.sections.find((s) => s.type === stype))
      .filter((s): s is ResumeSection => s !== undefined);

    if (primS || secSList.length > 0) {
      let baseContent = primS?.contentHtml || '';
      const extraContents = secSList
        .map((s) => s.contentHtml)
        .filter((c) => c.trim() && !baseContent.includes(c.trim()));

      if (extraContents.length > 0) {
        baseContent += '\n' + extraContents.join('\n');
        changesLog.push(`Merged additional ${stype} records from secondary resumes.`);
      }

      mergedSections.push({
        id: primS?.id || `sec-${stype}-merged`,
        type: stype,
        title: primS?.title || stype.toUpperCase(),
        visible: true,
        contentHtml: baseContent,
      });
      sectionsMergedNames.push(stype.charAt(0).toUpperCase() + stype.slice(1));
    }
  });

  // Calculate JD Match Score
  const fullText = mergedSections.map((s) => s.contentHtml.replace(/<[^>]*>/g, ' ')).join(' ').toLowerCase();
  const matchedKws = jdAnalysis.all.filter((kw) => fullText.includes(kw.toLowerCase()));
  const missingKws = jdAnalysis.mustHave.filter((kw) => !fullText.includes(kw.toLowerCase()));

  const jdScore = jdText
    ? Math.round(Math.min(0.98, Math.max(0.65, (matchedKws.length / Math.max(1, jdAnalysis.all.length)) * 0.4 + 0.58)) * 100) / 100
    : undefined;

  const metadata: MergeMetadata = {
    mode: req.mode,
    sourcesAnalyzed: totalSources,
    sectionsMerged: sectionsMergedNames,
    deduplicationCount: dedupCount,
    newAchievementsAdded,
    jdMatchScore: jdScore,
    skillGaps: missingKws,
    suggestedAdditions: missingKws.slice(0, 3).map((kw) => `Add concrete project achievement mentioning ${kw}`),
    mustHaveKeywordsFound: matchedKws.slice(0, 10),
    missingKeywords: missingKws,
  };

  return {
    mergedResume: {
      personalInfo: primaryResume.personalInfo,
      sections: mergedSections,
      pageSettings: primaryResume.pageSettings,
    },
    mergeMetadata: metadata,
    changesLog,
  };
}
