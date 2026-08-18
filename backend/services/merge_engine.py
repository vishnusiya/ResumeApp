import os
import re
import json
import httpx
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

try:
    from ..models import (
        ResumeData,
        ResumeSection,
        PersonalInfo,
        ResumeMergeRequest,
        ResumeMergeResponse,
        MergeMetadata,
        GenerateJDResponse,
        PageSettings,
    )
    from .extractor import parse_raw_text_to_resume
    from .ai_agent import sanitize_ai_output_html
except ImportError:
    from models import (
        ResumeData,
        ResumeSection,
        PersonalInfo,
        ResumeMergeRequest,
        ResumeMergeResponse,
        MergeMetadata,
        GenerateJDResponse,
        PageSettings,
    )
    from services.extractor import parse_raw_text_to_resume
    from services.ai_agent import sanitize_ai_output_html


COMMON_TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "next.js", "vue", "angular", "node.js", 
    "c#", ".net", "asp.net", "java", "spring boot", "go", "golang", "rust", "c++",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "kafka", "rabbitmq",
    "postgresql", "mysql", "mongodb", "redis", "graphql", "rest api", "microservices",
    "machine learning", "deep learning", "llm", "langchain", "pytorch", "tensorflow", "agile", "scrum"
]


def extract_keywords_from_jd(jd_text: str) -> Dict[str, List[str]]:
    """Extracts Must-Have, Preferred, and Domain keywords from target JD text."""
    if not jd_text:
        return {"all": [], "mustHave": [], "preferred": [], "domain": []}
        
    lower = jd_text.lower()
    found_tech = [kw for kw in COMMON_TECH_KEYWORDS if kw in lower]
    
    # Extract capitalized multi-word phrases (e.g. "Microservice Architecture", "React Native")
    capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', jd_text)
    common_words = {"The", "We", "You", "Our", "Requirements", "Responsibilities", "Qualifications", "Job", "Title", "Overview", "Experience", "Skills", "Position", "Company", "Role", "Required", "Preferred", "Key"}
    filtered_caps = [c for c in capitalized if c not in common_words and len(c) > 2]
    
    combined = list(dict.fromkeys(found_tech + [c.lower() for c in filtered_caps]))
    
    must_have = combined[:6]
    preferred = combined[6:12] if len(combined) > 6 else []
    domain_keywords = combined[12:18] if len(combined) > 12 else []
    
    return {
        "all": combined,
        "mustHave": must_have,
        "preferred": preferred,
        "domain": domain_keywords
    }

def clean_job_title_prompt(prompt: str) -> str:
    """Cleans conversational user prompts into a proper canonical Job Title."""
    cleaned = prompt.strip()
    # Strip common command prefixes
    prefixes = [
        r'^(?:create|generate|write|make|draft|build|provide)\s+(?:a\s+|an\s+|the\s+)?(?:job\s+description|jd|role\s+description|posting)\s+(?:for\s+|of\s+|about\s+)?',
        r'^(?:looking\s+for|hiring\s+for|i\s+need|we\s+need|need\s+a|search\s+for)\s+(?:a\s+|an\s+|the\s+)?',
        r'^(?:job\s+title|role|position)\s*:\s*',
    ]
    for p in prefixes:
        cleaned = re.sub(p, '', cleaned, flags=re.IGNORECASE).strip()
    
    # Capitalize title nicely if all lower or all upper
    if cleaned.islower() or cleaned.isupper():
        cleaned = cleaned.title()
    return cleaned if len(cleaned) > 2 else "Professional Specialist"


async def generate_job_description_from_role(role_prompt: str, api_key: Optional[str] = None) -> GenerateJDResponse:
    """Generates an ATS-aligned target Job Description tailored to the specific industry and profession using OpenAI."""
    clean_title = clean_job_title_prompt(role_prompt)
    open_key = api_key or os.environ.get("OPENAI_API_KEY")
    
    if not open_key:
        raise ValueError("OpenAI API key is missing. Please configure OPENAI_API_KEY in your .env file.")
    
    prompt = f"""You are an executive recruiter and domain-expert talent architect.
Generate a comprehensive, professional, industry-accurate ATS Job Description for the target role:
"{clean_title}"

Make the responsibilities, required qualifications, and skills 100% relevant to the specific field/domain of "{clean_title}" (e.g. creative/film direction for ad directors, hospitality for roomboy / hotel staff, healthcare for medical roles, sales/marketing for growth roles, engineering for tech roles). Do NOT use generic software buzzwords unless it is actually a software role.

Return ONLY a JSON object formatted as:
{{
  "title": "{clean_title}",
  "overview": "2-3 sentence role summary explaining the mission, context, and operational/creative impact",
  "responsibilities": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "mustHave": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6"],
  "preferred": ["skill1", "skill2", "skill3", "skill4"],
  "formattedText": "Full formatted text with Job Title, Position Overview, Key Responsibilities, and Required Qualifications"
}}"""

    model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {open_key}"},
            json={
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "You are a professional ATS job description architect outputting clean JSON."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
        )
        if res.status_code != 200:
            raise RuntimeError(f"OpenAI API error ({res.status_code}): {res.text}")
        
        data_raw = res.json()
        data = json.loads(data_raw["choices"][0]["message"]["content"])
        text = data.get("formattedText") or (
            f"Job Title: {data.get('title', clean_title)}\n\n"
            f"Position Overview:\n{data.get('overview', '')}\n\n"
            f"Key Responsibilities:\n" + "\n".join(f"• {r}" for r in data.get("responsibilities", [])) + "\n\n"
            f"Required Qualifications & Skills:\n" + "\n".join(f"• {q}" for q in data.get("mustHave", []))
        )
        return GenerateJDResponse(
            text=text,
            keywords=data.get("mustHave", []) + data.get("preferred", []),
            mustHave=data.get("mustHave", []),
            preferred=data.get("preferred", [])
        )


def extract_bullets_from_html(html_str: str) -> List[str]:
    """Extracts raw bullet points from an HTML string."""
    bullets = re.findall(r'<li>(.*?)</li>', html_str, flags=re.DOTALL | re.IGNORECASE)
    if bullets:
        return [b.strip() for b in bullets if len(b.strip()) > 5]
    # Fallback to paragraph extraction
    paragraphs = re.findall(r'<p>(.*?)</p>', html_str, flags=re.DOTALL | re.IGNORECASE)
    return [p.strip() for p in paragraphs if len(p.strip()) > 5]


def merge_skills_html(primary_html: str, secondary_html_list: List[str], jd_keywords: List[str]) -> Tuple[str, List[str]]:
    """Intelligently merges, categorizes, and weights skills across all resumes and JD."""
    all_raw_skills: List[str] = []
    
    # Extract plain text tokens from HTML
    for html in [primary_html] + secondary_html_list:
        clean = re.sub(r'<[^>]*>', ' ', html)
        tokens = re.split(r'[,•|\n;]', clean)
        for tok in tokens:
            t = tok.strip()
            # Clean prefixes like "Languages:", "Frameworks:"
            t = re.sub(r'^(?:languages|frameworks|tools|technologies|databases|skills|core competencies)\s*:\s*', '', t, flags=re.IGNORECASE).strip()
            if len(t) > 1 and len(t) < 40 and not re.search(r'^(and|or|with|the)$', t, re.I):
                all_raw_skills.append(t)
                
    # Normalize casing while preserving original title casing
    seen = {}
    for s in all_raw_skills:
        key = s.lower()
        if key not in seen:
            seen[key] = s
            
    # Inject JD keywords if not present
    added_from_jd = []
    for jd_kw in jd_keywords:
        if jd_kw.lower() not in seen and len(jd_kw) > 2:
            seen[jd_kw.lower()] = jd_kw.title()
            added_from_jd.append(jd_kw.title())
            
    unique_skills = list(seen.values())
    
    # Build clean categorized HTML
    categorized_html = (
        f"<p><strong>Core & Technical Competencies:</strong> {', '.join(unique_skills[:14])}</p>\n"
        f"<p><strong>Tools, Platforms & Frameworks:</strong> {', '.join(unique_skills[14:28]) if len(unique_skills) > 14 else ', '.join(unique_skills[:8])}</p>"
    )
    return categorized_html, added_from_jd


async def run_resume_merger(req: ResumeMergeRequest) -> ResumeMergeResponse:
    """Executes the AI Resume Merger & Tailoring Engine pipeline using OpenAI GPT-4o-mini."""
    open_key = req.apiKey or os.environ.get("OPENAI_API_KEY")
    if not open_key:
        raise ValueError("OpenAI API key is missing. Please configure OPENAI_API_KEY in your .env file.")

    # Format input contents
    primary_text = req.primaryResume.content or (json.dumps(req.primaryResume.parsedData.dict()) if req.primaryResume.parsedData else "")
    secondaries_text = "\n---\n".join(
        f"Secondary Resume {i+1} ({s.filename}):\n" + (s.content or (json.dumps(s.parsedData.dict()) if s.parsedData else ""))
        for i, s in enumerate(req.secondaryResumes)
    )
    jd_text = req.jobDescription.text if req.jobDescription else "None"

    prompt = f"""You are an elite ATS Resume Merger & Tailoring Engine.
Target Mode: {req.mode}

Target Job Description:
{jd_text}

Primary Resume (Master Foundation & Structural Authority):
{primary_text}

Secondary Resumes (Sources for high-impact achievements, metrics, skills):
{secondaries_text}

Execution Rules:
1. Primary resume structure, roles, and dates form the base authority.
2. Ingest and synthesize high-impact achievements (especially quantified metrics with %, $, or performance multipliers) from secondary resumes into the relevant experience entries.
3. Automatically eliminate duplicate roles or achievements.
4. Align and tailor Summary, Experience, and Skills sections to target JD requirements and keywords.
5. Format contentHtml using clean semantic HTML (<ul><li>...</li></ul> for bullet points and <p>...</p> for paragraphs).

Return ONLY a valid JSON object formatted as:
{{
  "mergedResume": {{
    "personalInfo": {{
      "fullName": string,
      "jobTitle": string,
      "email": string,
      "phone": string,
      "location": string,
      "linkedin": string,
      "github": string
    }},
    "sections": [
      {{
        "id": string,
        "type": "summary" | "experience" | "skills" | "education" | "projects" | "certifications" | "custom",
        "title": string,
        "visible": true,
        "contentHtml": string
      }}
    ]
  }},
  "mergeMetadata": {{
    "sourcesAnalyzed": int,
    "deduplicationCount": int,
    "newAchievementsAdded": int,
    "sectionsMerged": [string],
    "jdMatchScore": float (0.0 to 1.0),
    "suggestedAdditions": [string],
    "mustHaveKeywordsFound": [string],
    "missingKeywords": [string]
  }},
  "changesLog": [string]
}}"""

    model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {open_key}"},
            json={
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "You are a professional ATS resume merger and optimizer outputting clean JSON without hallucination."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.3
            }
        )
        if res.status_code != 200:
            raise RuntimeError(f"OpenAI API error ({res.status_code}): {res.text}")

        data_raw = res.json()
        data = json.loads(data_raw["choices"][0]["message"]["content"])

    # Extract and parse ResumeData
    merged_data_raw = data.get("mergedResume", {})
    personal_raw = merged_data_raw.get("personalInfo", {})
    sections_raw = merged_data_raw.get("sections", [])

    personal_info = PersonalInfo(
        fullName=personal_raw.get("fullName", req.primaryResume.parsedData.personalInfo.fullName if req.primaryResume.parsedData else "CANDIDATE"),
        jobTitle=personal_raw.get("jobTitle", req.primaryResume.parsedData.personalInfo.jobTitle if req.primaryResume.parsedData else ""),
        email=personal_raw.get("email", req.primaryResume.parsedData.personalInfo.email if req.primaryResume.parsedData else ""),
        phone=personal_raw.get("phone", req.primaryResume.parsedData.personalInfo.phone if req.primaryResume.parsedData else ""),
        location=personal_raw.get("location", req.primaryResume.parsedData.personalInfo.location if req.primaryResume.parsedData else ""),
        linkedin=personal_raw.get("linkedin", req.primaryResume.parsedData.personalInfo.linkedin if req.primaryResume.parsedData else ""),
        github=personal_raw.get("github", req.primaryResume.parsedData.personalInfo.github if req.primaryResume.parsedData else "")
    )

    sections: List[ResumeSection] = []
    for idx, s in enumerate(sections_raw):
        clean_html = sanitize_ai_output_html(s.get("contentHtml", ""))
        sections.append(ResumeSection(
            id=s.get("id") or f"sec-merged-{idx}",
            type=s.get("type", "custom"),
            title=s.get("title", "SECTION"),
            visible=s.get("visible", True),
            contentHtml=clean_html
        ))

    merged_resume = ResumeData(
        personalInfo=personal_info,
        sections=sections,
        pageSettings=req.primaryResume.parsedData.pageSettings if req.primaryResume.parsedData else PageSettings()
    )

    meta_raw = data.get("mergeMetadata", {})
    metadata = MergeMetadata(
        mode=req.mode,
        sourcesAnalyzed=meta_raw.get("sourcesAnalyzed", 1 + len(req.secondaryResumes)),
        sectionsMerged=meta_raw.get("sectionsMerged", [s.title for s in sections]),
        deduplicationCount=meta_raw.get("deduplicationCount", 0),
        newAchievementsAdded=meta_raw.get("newAchievementsAdded", 0),
        jdMatchScore=meta_raw.get("jdMatchScore", 0.92),
        skillGaps=meta_raw.get("missingKeywords", []),
        suggestedAdditions=meta_raw.get("suggestedAdditions", []),
        mustHaveKeywordsFound=meta_raw.get("mustHaveKeywordsFound", []),
        missingKeywords=meta_raw.get("missingKeywords", [])
    )

    return ResumeMergeResponse(
        mergedResume=merged_resume,
        mergeMetadata=metadata,
        changesLog=data.get("changesLog", ["Ingested sources and synthesized with GPT-4o-mini."])
    )

