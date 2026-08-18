import React, { useState } from 'react';
import { X, Plus, Home, Briefcase, GraduationCap, Code2, FolderGit2, ShieldCheck, Award, Info } from 'lucide-react';
import type { SectionType, ResumeSection } from '../../types/resume';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (section: ResumeSection) => void;
}

interface SectionOption {
  type: SectionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultHtml: string;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onAddSection,
}) => {
  const [customTitle, setCustomTitle] = useState('');

  if (!isOpen) return null;

  const sectionOptions: SectionOption[] = [
    {
      type: 'summary',
      title: 'Summary',
      description: 'Professional summary highlighting years of experience and core skills.',
      icon: <Home className="w-5 h-5 text-blue-600" />,
      defaultHtml: '<p>Experienced professional with a strong track record of success in software development and project leadership.</p>',
    },
    {
      type: 'experience',
      title: 'Experience',
      description: 'Work history, responsibilities, and quantified achievements.',
      icon: <Briefcase className="w-5 h-5 text-blue-600" />,
      defaultHtml: `
        <div class="resume-item">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Company Name | Job Title</span>
            <span style="color: #64748b; font-size: 0.9em;">2022 – Present</span>
          </div>
          <ul>
            <li>Led cross-functional team initiatives resulting in 25% efficiency gains.</li>
            <li>Delivered high-quality software solutions on schedule and within budget.</li>
          </ul>
        </div>
      `,
    },
    {
      type: 'education',
      title: 'Education',
      description: 'Degrees, certifications, academic institutions, and honors.',
      icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
      defaultHtml: `
        <div class="resume-item">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Bachelor of Science in Computer Science</span>
            <span style="color: #64748b; font-size: 0.9em;">2018 – 2022</span>
          </div>
          <div style="color: #475569;">University Name</div>
        </div>
      `,
    },
    {
      type: 'skills',
      title: 'Skills',
      description: 'Core competencies, programming languages, and tools.',
      icon: <Code2 className="w-5 h-5 text-blue-600" />,
      defaultHtml: '<p><strong>Technical Skills:</strong> Python, React, TypeScript, Node.js, SQL, AWS, Docker, Git</p>',
    },
    {
      type: 'projects',
      title: 'Projects',
      description: 'Key personal, open-source, or client projects with tech stack and outcomes.',
      icon: <FolderGit2 className="w-5 h-5 text-blue-600" />,
      defaultHtml: `
        <div class="resume-item">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Project Name (React, Node.js, PostgreSQL)</span>
            <span style="color: #64748b; font-size: 0.9em;">2024</span>
          </div>
          <p>Developed full-stack application serving 10k+ monthly active users with 99.9% uptime.</p>
        </div>
      `,
    },
    {
      type: 'certifications',
      title: 'Certifications',
      description: 'Professional credentials and accredited certifications.',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      defaultHtml: '<p><strong>AWS Certified Solutions Architect – Associate</strong> (2024)</p>',
    },
    {
      type: 'achievements',
      title: 'Achievements',
      description: 'Awards, hackathon wins, honors, or notable publications.',
      icon: <Award className="w-5 h-5 text-blue-600" />,
      defaultHtml: '<ul><li>Winner, Global Hackathon 2024 (Top 1% out of 500 teams).</li></ul>',
    },
    {
      type: 'additional',
      title: 'Additional Info',
      description: 'Languages spoken, interests, volunteer work, or clearances.',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      defaultHtml: '<p><strong>Languages:</strong> English (Native), Spanish (Fluent)</p>',
    },
  ];

  const handleSelectOption = (opt: SectionOption) => {
    const newSection: ResumeSection = {
      id: `sec-${Date.now()}`,
      type: opt.type,
      title: opt.title.toUpperCase(),
      visible: true,
      contentHtml: opt.defaultHtml,
    };
    onAddSection(newSection);
    onClose();
  };

  const handleAddCustom = () => {
    if (!customTitle.trim()) return;
    const newSection: ResumeSection = {
      id: `sec-${Date.now()}`,
      type: 'custom',
      title: customTitle.trim().toUpperCase(),
      visible: true,
      contentHtml: '<p>Enter your custom section content here...</p>',
    };
    onAddSection(newSection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Plus className="w-5 h-5 text-blue-600" />
            <span>Add Resume Section</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Grid */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectionOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleSelectOption(opt)}
                className="p-3.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer shadow-2xs"
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100/60 transition-colors shrink-0">
                  {opt.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {opt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Section */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Or Create Custom Section
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Volunteer Experience, Publications, Patents..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customTitle.trim()}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
              >
                Add Custom
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
