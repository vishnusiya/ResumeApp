import type { ResumeData, PageSettings } from '../types/resume';

export const defaultPageSettings: PageSettings = {
  paperSize: 'a4',
  orientation: 'portrait',
  margins: {
    top: 0.5,
    bottom: 0.5,
    left: 0.5,
    right: 0.5,
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.25,
    headingScale: 1.15,
  },
  theme: {
    template: 'modern',
    primaryColor: '#1e293b',
    accentColor: '#0d9488',
    textColor: '#1e293b',
    headingColor: '#0f172a',
  },
  columns: 1,
  pageLimit: 'unlimited',
  autoCompress: false,
};

export const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: 'YOUR FULL NAME',
    jobTitle: 'Professional Title / Target Role',
    phone: '+1 (555) 000-0000',
    email: 'your.email@example.com',
    location: 'City, State / Remote',
    linkedin: 'linkedin.com/in/yourname',
    github: 'github.com/yourname',
    website: 'yourwebsite.dev',
  },
  sections: [
    {
      id: 'sec-summary',
      type: 'summary',
      title: 'SUMMARY',
      visible: true,
      contentHtml: `<p>Results-driven and strategic professional with experience in designing, developing, and executing high-impact solutions. Proven track record of driving operational efficiency, leading cross-functional initiatives, and delivering scalable outcomes aligned with organizational goals.</p>`,
      structuredData: {
        summaryText: 'Results-driven and strategic professional with experience in designing, developing, and executing high-impact solutions. Proven track record of driving operational efficiency, leading cross-functional initiatives, and delivering scalable outcomes aligned with organizational goals.',
      },
    },
    {
      id: 'sec-experience',
      type: 'experience',
      title: 'EXPERIENCE',
      visible: true,
      contentHtml: `
        <div class="resume-item" data-item-id="exp-1">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Company Name <span style="font-weight: 400; color: #64748b;">|</span> Job Title</span>
            <span style="color: #64748b; font-size: 0.9em;">Month Year – Present</span>
          </div>
          <ul>
            <li>Spearheaded core team initiatives, delivering key projects on schedule and decreasing operational bottlenecks by <strong>30%</strong>.</li>
            <li>Collaborated with cross-functional stakeholders to design and deploy scalable solutions serving high user volumes.</li>
            <li>Mentored junior team members and established best practices for code reviews and workflow quality assurance.</li>
          </ul>
        </div>
        <div class="resume-item" data-item-id="exp-2" style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Previous Company <span style="font-weight: 400; color: #64748b;">|</span> Previous Role</span>
            <span style="color: #64748b; font-size: 0.9em;">Month Year – Month Year</span>
          </div>
          <ul>
            <li>Developed and maintained key system components, improving overall uptime and reliability.</li>
            <li>Integrated automated reporting pipelines and third-party APIs with high accuracy and low latency.</li>
            <li>Optimized database queries and backend processes, reducing query execution times by <strong>40%</strong>.</li>
          </ul>
        </div>
      `,
      structuredData: {
        experiences: [
          {
            id: 'exp-1',
            role: 'Job Title',
            company: 'Company Name',
            location: 'City, Country',
            startDate: 'Month Year',
            endDate: 'Present',
            current: true,
            bullets: [
              'Spearheaded core team initiatives, delivering key projects on schedule and decreasing operational bottlenecks by 30%.',
              'Collaborated with cross-functional stakeholders to design and deploy scalable solutions serving high user volumes.',
              'Mentored junior team members and established best practices for code reviews and workflow quality assurance.',
            ],
          },
          {
            id: 'exp-2',
            role: 'Previous Role',
            company: 'Previous Company',
            location: 'City, Country',
            startDate: 'Month Year',
            endDate: 'Month Year',
            current: false,
            bullets: [
              'Developed and maintained key system components, improving overall uptime and reliability.',
              'Integrated automated reporting pipelines and third-party APIs with high accuracy and low latency.',
              'Optimized database queries and backend processes, reducing query execution times by 40%.',
            ],
          },
        ],
      },
    },
    {
      id: 'sec-education',
      type: 'education',
      title: 'EDUCATION',
      visible: true,
      contentHtml: `
        <div class="resume-item" data-item-id="edu-1">
          <div style="display: flex; justify-content: space-between;">
            <strong>Degree / Major Title</strong>
            <span style="color: #64748b; font-size: 0.9em;">Year – Year</span>
          </div>
          <div style="color: #475569;">University or College Name</div>
        </div>
      `,
      structuredData: {
        educations: [
          {
            id: 'edu-1',
            degree: 'Degree / Major Title',
            institution: 'University or College Name',
            location: 'City, Country',
            startDate: 'Year',
            endDate: 'Year',
          },
        ],
      },
    },
    {
      id: 'sec-skills',
      type: 'skills',
      title: 'SKILLS',
      visible: true,
      contentHtml: `<p><strong>Core Technical Competencies:</strong> Add primary technical skills, frameworks, programming languages, and methodologies here</p>
<p><strong>Tools, Platforms & Systems:</strong> Add cloud platforms, databases, developer tools, and workflow systems here</p>`,
      structuredData: {
        skillCategories: [
          {
            id: 'skill-1',
            category: 'Core Competencies',
            skills: ['Core Skill 1', 'Core Skill 2', 'Core Skill 3', 'Core Skill 4'],
          },
          {
            id: 'skill-2',
            category: 'Tools & Technologies',
            skills: ['Tool 1', 'Tool 2', 'Tool 3', 'Tool 4'],
          },
        ],
      },
    },
    {
      id: 'sec-projects',
      type: 'projects',
      title: 'PROJECTS',
      visible: true,
      contentHtml: `
        <div class="resume-item" data-item-id="proj-1">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Featured Project Title <span style="font-weight: normal; color: #64748b;">(Technologies / Tools Used)</span></span>
            <span style="color: #64748b; font-size: 0.9em;">Year</span>
          </div>
          <p style="margin-top: 2px;">Architected and delivered an impactful solution solving key business bottlenecks with measurable performance improvements.</p>
        </div>
      `,
      structuredData: {
        projects: [
          {
            id: 'proj-1',
            title: 'Featured Project Title',
            techStack: ['Technology 1', 'Technology 2'],
            year: 'Year',
            bullets: ['Architected and delivered an impactful solution solving key business bottlenecks with measurable performance improvements.'],
          },
        ],
      },
    },
    {
      id: 'sec-certifications',
      type: 'certifications',
      title: 'CERTIFICATIONS',
      visible: true,
      contentHtml: `
        <div class="resume-item">
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Certification Name</strong> (Issuing Organization)</span>
            <span style="color: #64748b; font-size: 0.9em;">Year</span>
          </div>
        </div>
      `,
      structuredData: {
        certifications: [
          {
            id: 'cert-1',
            name: 'Certification Name',
            issuer: 'Issuing Organization',
            date: 'Year',
          },
        ],
      },
    },
    {
      id: 'sec-achievements',
      type: 'achievements',
      title: 'ACHIEVEMENTS',
      visible: true,
      contentHtml: `
        <ul>
          <li>Received recognition or award for technical excellence and leading high-impact initiatives.</li>
        </ul>
      `,
      structuredData: {
        achievements: [
          {
            id: 'ach-1',
            title: 'Recognition / Award Name',
            description: 'Description of the award, scope, and impact.',
            date: 'Year',
          },
        ],
      },
    },
    {
      id: 'sec-additional',
      type: 'additional',
      title: 'ADDITIONAL INFO',
      visible: true,
      contentHtml: `<p><strong>Languages:</strong> English (Fluent), Other Languages</p>
<p><strong>Interests & Affiliations:</strong> Open Source Contribution, Industry Memberships</p>`,
      structuredData: {
        additionals: [
          { id: 'add-1', label: 'Languages', value: 'English (Fluent), Other Languages' },
          { id: 'add-2', label: 'Interests', value: 'Open Source Contribution, Industry Memberships' },
        ],
      },
    },
  ],
  pageSettings: defaultPageSettings,
};
