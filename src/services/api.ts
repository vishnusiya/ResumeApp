import type { ResumeData, SectionType } from '../types/resume';
import type { DualPassAIResult } from '../utils/aiEngine';
import { parseRawResumeText } from '../utils/parser';

const API_BASE = '/api';

/**
 * Upload and parse resume file (PDF, DOCX, TXT, JSON) via FastAPI backend
 */
export async function uploadResumeApi(file: File): Promise<ResumeData> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || `Server returned ${response.status}`);
    }

    const data: ResumeData = await response.json();
    return data;
  } catch (backendError) {
    console.warn('[API] Backend upload error, attempting client fallback for text/json:', backendError);

    // If it's a JSON or plain text file, we can parse it in browser
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.personalInfo && parsed.sections) {
        return parsed;
      }
      throw new Error('Invalid JSON structure');
    } else if (file.name.endsWith('.txt')) {
      const text = await file.text();
      return parseRawResumeText(text, file.name);
    } else {
      // For PDF/DOCX where backend is needed
      throw new Error(`Backend processing failed for ${file.name}: ${(backendError as Error).message}. Ensure FastAPI backend is running.`);
    }
  }
}

/**
 * Request Dual-Pass AI rewrite from backend
 */
export async function aiRewriteApi(
  sectionType: SectionType,
  sectionTitle: string,
  currentContent: string,
  actionId?: string,
  customPrompt?: string,
  targetJobDescription?: string
): Promise<DualPassAIResult> {
  const response = await fetch(`${API_BASE}/ai/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionType,
      sectionTitle,
      currentContent,
      actionId: actionId || 'results_driven',
      customPrompt,
      targetJobDescription,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'AI rewrite failed' }));
    throw new Error(err.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data as DualPassAIResult;
}

/**
 * Health check to verify backend status
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Merge multiple resumes and/or tailor to Job Description
 */
export async function mergeResumesApi(
  req: import('../types/resume').ResumeMergeRequest
): Promise<import('../types/resume').ResumeMergeResponse> {
  const response = await fetch(`${API_BASE}/resume/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Resume merge failed' }));
    throw new Error(err.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Generate an ATS-aligned Job Description from role prompt
 */
export async function generateJDApi(
  rolePrompt: string
): Promise<import('../types/resume').GenerateJDResponse> {
  const response = await fetch(`${API_BASE}/ai/generate-jd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rolePrompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'JD generation failed' }));
    throw new Error(err.detail || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data;
}
