# AI Resume Studio — System Architecture & Technical Specifications

This document outlines the core benefits, AI agents, prompting techniques, and complete technology stack powering **AI Resume Studio**.

---

## 1. Key Benefits & Value Proposition

| Category | Key Benefit | Technical Implementation |
| :--- | :--- | :--- |
| **Real-Time Visual Editing** | **WYSIWYG Dual-Canvas** | Real-time synchronized 3-column layout: Section Manager, Rich Text Editor, and Live A4/Letter Paginated Preview. |
| **Document Ingestion** | **100% Lossless Parsing** | Ingests PDF (`pypdf`), Word (`python-docx`), and plain text without dropping sections, dates, or contact links. |
| **Resume Merging & Tailoring** | **Multi-Resume Map-Reduce** | Merges multiple source resumes (e.g., Master Resume + Specialized Project Portfolio) against a target Job Description into one optimized resume. |
| **ATS Scoring & Optimization** | **Real-Time ATS Feedback** | Dynamic ATS scoring (0–100%) checking keyword density, action verb strength, measurable metrics, and section completeness. |
| **High-Fidelity Exports** | **Canvas-Matching DOCX & PDF** | Exports Word documents (`.docx`) matching custom fonts, colors, section underlines, and margins from the canvas. |
| **Zero Database Footprint** | **Client-Side Persistence** | Secure local-first architecture using browser `localStorage` for revision history, autosave, and saved Job Descriptions. |

---

## 2. AI Agents & Workflows

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AI RESUME STUDIO AGENTS                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│   Dual-Pass AI Agent    │ │   Merge & Map-Reduce    │ │  JD Generator Agent     │
│   (Section Rewriter)    │ │   Synthesis Agent       │ │  (Role Profiler)        │
├─────────────────────────┤ ├─────────────────────────┤ ├─────────────────────────┤
│ • Action verb boost     │ │ • Deduplicates roles    │ │ • Creates full JD       │
│ • Quantifies metrics    │ │ • Unifies skills        │ │ • Extracts key skills   │
│ • Strict HTML output    │ │ • Scores JD alignment   │ │ • History logging       │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

| Agent Name | Location | Function & Workflow |
| :--- | :--- | :--- |
| **Dual-Pass Section Rewrite Agent** | [`backend/services/ai_agent.py`](backend/services/ai_agent.py) | **Pass 1:** Analyzes raw HTML section content against transformation goals (Action Verbs, Metrics, JD Match, Executive Polish).<br>**Pass 2:** Refines tone, verifies chronological integrity, and formats valid semantic HTML (`<p>`, `<ul>`, `<li>`, `<strong>`). |
| **Multi-Resume Synthesis Agent** | [`backend/services/merge_engine.py`](backend/services/merge_engine.py) | Executes a **Map-Reduce** pipeline that deduplicates overlapping work history across multiple resumes, synthesizes technical skills, and aligns content with target JD requirements. |
| **Job Description Profiler Agent** | [`backend/services/merge_engine.py`](backend/services/merge_engine.py) | Generates industry-standard Job Descriptions (Position Overview, Responsibilities, Requirements, Tech Stack) from a role title or short prompt. |
| **ATS Matrix Scoring Engine** | [`frontend/src/utils/atsCalculator.ts`](frontend/src/utils/atsCalculator.ts) / [`backend/services/ats_service.py`](backend/services/ats_service.py) | Performs hybrid client/server lexical and semantic analysis to compute match scores, identify missing keywords, and suggest targeted improvements. |

---

## 3. Prompting Techniques Employed

| Prompting Technique | Where It Is Used | Purpose & Rationale |
| :--- | :--- | :--- |
| **Role Conditioning & Persona Prompting** | All Backend Agents | Configures the LLM as an *"Elite Executive Resume Strategist & ATS Optimization Specialist"* to produce professional recruiter-grade phrasing. |
| **Structured JSON Schema Enforcement** | AI Parsers, Merger & JD Generator | Uses `response_format={"type": "json_object"}` with strict Pydantic schemas to eliminate malformed responses and parsing errors. |
| **Dual-Pass / Self-Correction Prompting** | Section AI Modal | Evaluates metric density and action verb strength in the first pass, then corrects grammar and HTML structure in the second pass. |
| **Isolated Grounding (Anti-Hallucination)** | AI Action Modal | Ensures custom prompt transformations execute strictly on the **original section content** without mixing or compounding prior drafts. |
| **Semantic Map-Reduce Deduplication** | Resume Merger Engine | Compares experience bullets from multiple resumes, merges overlapping achievements, and eliminates duplicate responsibilities. |
| **Few-Shot HTML Formatting Rules** | AI Agent & Merger | Enforces strict generation rules (`<li>` with `<strong>` highlights, `<p>` paragraphs, zero markdown ticks) for direct rich-text rendering. |

---

## 4. Libraries & Technology Stack

### Frontend Stack (`frontend/`)

| Library / Tool | Version | Category | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **React** | `19.2.8` | UI Framework | Core reactive component architecture. |
| **TypeScript** | `6.0.2` | Language | Strict type safety across resume models and editor state. |
| **Vite** | `8.2.0` | Build Tool | Lightning-fast development server and optimized bundle build. |
| **TailwindCSS** | `4.3.3` | Styling | Utility-first styling with modern responsive design system. |
| **docx** | `9.7.1` | Document Engine | Native client-side generation of styled `.docx` files matching canvas fonts and colors. |
| **lucide-react** | `1.31.0` | Iconography | Clean, modern icons for navigation, modals, and toolbars. |
| **canvas-confetti** | `1.9.4` | Micro-Interactions | Visual celebration effects upon resume generation and export. |
| **clsx** & **tailwind-merge** | `2.1.1` / `3.6.0` | Class Utilities | Dynamic class composition and CSS conflict resolution. |

---

### Backend Stack (`backend/`)

| Library / Tool | Version | Category | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **FastAPI** | Latest | Web Framework | High-performance asynchronous REST API backend. |
| **Uvicorn** | Latest | ASGI Server | Production-ready asynchronous server for FastAPI. |
| **Pydantic** | `v2` | Validation | Data modeling, request/response validation, and serialization. |
| **httpx** | Latest | HTTP Client | Asynchronous, non-blocking REST client for OpenAI completion endpoints. |
| **pypdf** | Latest | PDF Parser | Extract text and metadata from uploaded PDF resumes. |
| **python-docx** | Latest | DOCX Parser | Extract text and structure from uploaded Word documents. |
| **python-dotenv** | Latest | Configuration | Automatically loads `OPENAI_API_KEY` and `OPENAI_MODEL` from `backend/.env`. |

---

### AI & LLM Models

| Component | Configuration | Provider | Purpose |
| :--- | :--- | :--- | :--- |
| **OpenAI `gpt-4o-mini`** | Environment-driven (`OPENAI_MODEL`) | OpenAI REST API | Fast, cost-effective LLM powering section rewrites, multi-resume merging, and JD generation. |
