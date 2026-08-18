import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Link2, Globe, Check, Briefcase } from 'lucide-react';
import type { PersonalInfo } from '../../types/resume';

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalInfo: PersonalInfo;
  onSave: (updatedInfo: PersonalInfo) => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  isOpen,
  onClose,
  personalInfo,
  onSave,
}) => {
  const [formData, setFormData] = useState<PersonalInfo>(personalInfo);

  useEffect(() => {
    if (isOpen) {
      setFormData(personalInfo);
    }
  }, [isOpen, personalInfo]);

  if (!isOpen) return null;

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Header & Contact Details</h2>
              <p className="text-[11px] text-slate-500">Edit your name, job title, email, and contact links</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white font-medium"
                required
              />
            </div>

            {/* Job Title / Role */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Professional Title / Target Role</span>
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                placeholder="e.g. Senior Full Stack Developer"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. +1 (555) 000-0000"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Location */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Location (City, State / Remote)</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. San Francisco, CA (Open to Remote)"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn URL / Handle</span>
              </label>
              <input
                type="text"
                value={formData.linkedin || ''}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/username"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* GitHub / Website */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>GitHub / Portfolio URL</span>
              </label>
              <input
                type="text"
                value={formData.github || formData.website || ''}
                onChange={(e) => {
                  handleChange('github', e.target.value);
                  handleChange('website', e.target.value);
                }}
                placeholder="github.com/username"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
