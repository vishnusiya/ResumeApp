import io
import re
import time
from typing import List, Tuple, Optional, Dict, Any
from pypdf import PdfReader
from docx import Document
try:
    from ..models import ResumeData, PersonalInfo, ResumeSection, PageSettings
except ImportError:
    from models import ResumeData, PersonalInfo, ResumeSection, PageSettings

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b(?:(?:\+91[\-\s]?)?[6-9]\d{9})\b')
LINKEDIN_REGEX = re.compile(r'(?:linkedin\.com\/in\/[a-zA-Z0-9\-_]+|[a-zA-Z0-9\-_]+\/in\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:github\.com\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)
LOCATION_REGEX = re.compile(r'(?:[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z\s]+,\s*[A-Z]{2})')

SECTION_MATCHERS = [
    ('summary', 'SUMMARY', re.compile(r'^(?:professional\s*summary|executive\s*summary|career\s*objective|career\s*profile|objective|summary|profile|about\s*me|synopsis|professional\s*synopsis|executive\s*profile|personal\s*statement)$', re.IGNORECASE)),
    ('skills', 'TECHNICAL SKILLS', re.compile(r'^(?:technical\s*skills|other\s*skills|key\s*skills|core\s*skills|additional\s*skills|technologies\s*used|technology\s*used|key\s*competencies|core\s*competencies|competencies|skills\s*&\s*abilities|skills|technologies|tools\s*&\s*technologies|tools\s*and\s*technologies|programming\s*languages|technical\s*expertise|tech\s*stack|tools\s*used|skills\s*&\s*tools|areas\s*of\s*expertise|domain\s*expertise|core\s*strengths|technical\s*proficiencies|cloud\s*&\s*devops|frameworks|methodologies|expertise)$', re.IGNORECASE)),
    ('experience', 'EXPERIENCE', re.compile(r'^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history|work\s*history|experience\s*summary|professional\s*background|employment\s*details|industry\s*experience|enterprise\s*program\s*experience|delivery\s*&\s*operations|leadership\s*experience)$', re.IGNORECASE)),
    ('projects', 'PROJECTS', re.compile(r'^(?:academic\s*projects|key\s*projects|personal\s*projects|project\s*details|projects\s*handled|projects\s*undertaken|project\s*experience|projects|key\s*project\s*details|selected\s*projects|major\s*projects|client\s*engagements)$', re.IGNORECASE)),
    ('education', 'EDUCATION', re.compile(r'^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education|degrees|academic\s*details|academic\s*credentials|education\s*&\s*training|education\s*&\s*qualifications)$', re.IGNORECASE)),
    ('certifications', 'CERTIFICATIONS', re.compile(r'^(?:certifications?\s*(?:&|and|\/|\+)\s*achievements?|certifications?\s*(?:&|and|\/|\+)\s*licenses?|certifications?\s*(?:&|and|\/|\+)\s*trainings?|licenses?\s*&\s*certifications?|certifications?|certificates?|courses|trainings?|credentials?|licenses?|professional\s*certifications?)$', re.IGNORECASE)),
    ('achievements', 'ACHIEVEMENTS', re.compile(r'^(?:achievements?\s*(?:&|and|\/|\+)\s*certifications?|key\s*achievements?|selected\s*achievements?|notable\s*achievements?|achievements?|awards?\s*(?:&|and|\/|\+)?\s*recognitions?|awards?|honors?\s*(?:&|and|\/|\+)?\s*awards?|honors?|patents?\s*(?:&|and|\/|\+)?\s*publications?|patents?\s*(?:&|and|\/|\+)?\s*innovations?|patents?|publications?|innovations?|extracurricular\s*activities|activities)$', re.IGNORECASE)),
    ('additional', 'ADDITIONAL INFO', re.compile(r'^(?:additional\s*info|additional\s*information|languages?\s*(?:known|proficiency)?|personal\s*details|interests|hobbies|volunteer\s*experience|community\s*service)$', re.IGNORECASE)),
]

NON_NAME_HEADERS = {
    'CAREER OBJECTIVE', 'OBJECTIVE', 'SUMMARY', 'PROFESSIONAL SUMMARY',
    'RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'EXPERIENCE', 'PROJECT DETAILS',
    'TECHNOLOGIES USED', 'TECHNICAL SKILLS', 'EDUCATION', 'KEY COMPETENCIES',
    'WORK EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'OTHER SKILLS',
    'KEY SKILLS', 'SKILLS', 'ADDITIONAL INFO', 'CERTIFICATIONS & ACHIEVEMENTS',
    'AWARDS & RECOGNITION', 'PATENTS & INNOVATIONS'
}

def normalize_header_text(line: str) -> str:
    # 1. Un-space single characters: "P R O F E S S I O N A L" -> "PROFESSIONAL"
    unspaced = re.sub(r'(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)', '', line.strip())
    # 2. Remove leading Roman numerals, numbers, list markers, markdown, decorations
    clean = re.sub(r'^(?:(?:[IVXLCDM]+\b|\d+(?:\.\d+)*)\s*[\.\:\-\)\>]|#+|\*+|={2,}|_{2,}|\-{2,}|\[|\(|\~|\•|\❖|\➢|\▪|\*)', '', unspaced, flags=re.IGNORECASE)
    clean = re.sub(r'[:_\~\[\]\(\)\-=#*]+$', '', clean).strip()
    return clean

def match_section_header(line: str) -> Optional[Tuple[str, str]]:
    norm = normalize_header_text(line)
    if not norm or len(norm) > 60:
        return None
    
    words = norm.split()
    if len(words) > 8:
        return None
    if line.strip() and line.strip()[0].islower():
        return None
        
    # 1. Direct Regex Match
    for sec_type, sec_title, regex in SECTION_MATCHERS:
        if regex.match(norm):
            display_title = norm.upper() if len(norm) >= 3 else sec_title
            return sec_type, display_title
            
    # 2. Compound and semantic header keywords fallback
    lower = norm.lower()

    # Summary / Profile
    if any(k in lower for k in ['summary', 'objective', 'synopsis', 'profile', 'about me', 'overview', 'biography']):
        return 'summary', norm.upper()

    # Certifications & Accreditations & Licenses
    if any(k in lower for k in ['certif', 'license', 'credential', 'accredit', 'training', 'course', 'workshop']):
        return 'certifications', norm.upper()

    # Achievements, Awards, Patents & Publications
    if any(k in lower for k in ['patent', 'publication', 'award', 'honor', 'achievement', 'recognition', 'innovation', 'speaking', 'keynote', 'whitepaper']):
        return 'achievements', norm.upper()

    # Projects & Portfolio
    if any(k in lower for k in ['project', 'portfolio', 'case stud', 'engagement', 'capstone', 'hackathon']):
        return 'projects', norm.upper()

    # Education & Academics
    if any(k in lower for k in ['educat', 'academic', 'degree', 'qualification', 'university', 'college', 'school']):
        return 'education', norm.upper()

    # Skills, Tools & Competencies
    if any(k in lower for k in ['competenc', 'proficienc', 'tech stack', 'technolog', 'tool', 'programming', 'framework', 'expertise']) or ('skill' in lower and 'responsible' not in lower):
        return 'skills', norm.upper()

    # Experience, Work History & Leadership
    if any(k in lower for k in ['experien', 'employment', 'career', 'work history', 'background', 'internship', 'leadership', 'delivery & operation', 'consulting']):
        return 'experience', norm.upper()

    # Languages & Additional
    if any(k in lower for k in ['language', 'interest', 'hobby', 'hobbies', 'volunteer', 'affiliat', 'membership', 'extracurricular', 'reference', 'additional']):
        return 'additional', norm.upper()
        
    return None

def is_pure_contact_line(line: str) -> bool:
    clean = line.strip()
    if not clean: return True
    # Ignore year ranges like 2018-2019
    if re.search(r'\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b', clean, re.IGNORECASE):
        return False
    if EMAIL_REGEX.search(clean) or PHONE_REGEX.search(clean):
        text_without_contact = EMAIL_REGEX.sub('', PHONE_REGEX.sub('', clean)).strip(' ,|•-📍📞✉️🔗')
        if len(text_without_contact) < 25:
            return True
    if clean.startswith(('📍', '📞', '✉️', '🔗')) and len(clean) < 35:
        return True
    return False

def extract_candidate_name_and_title(lines: List[str]) -> Tuple[str, str, str]:
    name = "YOUR NAME"
    job_title = "Professional"
    location = "Kerala, India"

    # Check line 0 first (standard single-column resume format)
    if lines:
        first_clean = normalize_header_text(lines[0])
        first_upper = first_clean.upper()
        if (first_upper not in NON_NAME_HEADERS and 
            not match_section_header(first_clean) and 
            not is_pure_contact_line(first_clean) and 
            len(first_clean) < 40 and 
            not re.search(r'\b(engineer|developer|coordinator|manager|specialist|artist|photographer)\b', first_clean, re.IGNORECASE)):
            name = first_clean.upper()

    # If not found on line 0, scan top lines for a standalone name
    if name == "YOUR NAME":
        for l in lines[:15]:
            norm = normalize_header_text(l).upper()
            if norm in NON_NAME_HEADERS or match_section_header(l) or is_pure_contact_line(l):
                continue
            if re.match(r'^[A-Z][A-Za-z\.\s]{1,35}$', l.strip()):
                words = l.strip().split()
                if 1 <= len(words) <= 4 and not any(w.upper() in NON_NAME_HEADERS or w.lower() in ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst', 'technology', 'used', 'role', 'responsibilities', 'skills', 'other'] for w in words):
                    name = l.strip().upper()
                    break

    # If still not found, search for isolated uppercase names throughout document
    if name == "YOUR NAME":
        for l in lines:
            norm = normalize_header_text(l).upper()
            if norm in NON_NAME_HEADERS or match_section_header(l) or is_pure_contact_line(l):
                continue
            if re.match(r'^[A-Z\s\.]{3,25}$', l.strip()) and len(l.strip().split()) in [2, 3, 4]:
                words = l.strip().split()
                if not any(w.upper() in NON_NAME_HEADERS or w.lower() in ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst', 'technology', 'used', 'role', 'responsibilities', 'project', 'academic', 'college', 'university', 'skills', 'other'] for w in words):
                    name = l.strip().upper()
                    break

    # Extract location from contact lines (e.g. "email | phone | Cherthala")
    for l in lines[:6]:
        if EMAIL_REGEX.search(l) or PHONE_REGEX.search(l):
            parts = [p.strip() for p in re.split(r'[|•,]', l) if p.strip()]
            for p in parts:
                if not EMAIL_REGEX.search(p) and not PHONE_REGEX.search(p) and len(p) >= 3 and len(p) <= 30:
                    if not re.search(r'\b(college|university|school|drama|degree|diploma)\b', p, re.IGNORECASE):
                        location = p
                        break

    # Search for job title in lines 1-5 or summary
    title_pattern = re.compile(
        r'\b((?:Senior\s+|Junior\s+|Lead\s+|Creative\s+)?(?:Photographer(?:\s+and\s+Visual\s+Artist)?|Visual\s+Artist|Technical\s+Coordinator|Stage\s+Manager|Software\s+Developer|Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer|Frontend\s+Developer|Backend\s+Developer|\w+\s+Coordinator|\w+\s+Manager|\w+\s+Artist|\w+\s+Engineer|\w+\s+Developer))\b',
        re.IGNORECASE
    )

    for l in lines[:6]:
        clean = l.strip()
        if match_section_header(clean) or clean.upper() == name:
            continue
        m = title_pattern.search(clean)
        if m:
            job_title = m.group(1).title()
            break
        elif len(clean) < 40 and any(w in clean.lower() for w in ['photographer', 'artist', 'developer', 'engineer', 'coordinator', 'manager']):
            job_title = clean.title()
            break

    return name, job_title, location

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    extracted = []
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            extracted.append(txt)
    return "\n".join(extracted)

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)

def parse_raw_text_to_resume(raw_text: str, filename: str = "Uploaded_Resume") -> ResumeData:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    if not lines:
        return ResumeData(
            personalInfo=PersonalInfo(),
            sections=[
                ResumeSection(
                    id=f"sec-{int(time.time()*1000)}",
                    type="summary",
                    title="SUMMARY",
                    contentHtml="<p>Paste or edit your resume content here.</p>"
                )
            ],
            pageSettings=PageSettings()
        )

    # 1. Contact & Identity Extraction
    full_name, job_title, location_str = extract_candidate_name_and_title(lines)
    all_text = " ".join(lines)
    
    email_match = EMAIL_REGEX.search(all_text)
    
    # Phone number extraction (excluding year ranges)
    phone_str = ""
    for match in PHONE_REGEX.finditer(all_text):
        candidate_phone = match.group(0).strip()
        if not re.search(r'\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d)\b', candidate_phone):
            phone_str = candidate_phone
            break

    linkedin_match = LINKEDIN_REGEX.search(all_text)
    github_match = GITHUB_REGEX.search(all_text)

    personal_info = PersonalInfo(
        fullName=full_name[:35] if len(full_name) > 35 else full_name,
        jobTitle=job_title,
        email=email_match.group(0) if email_match else "",
        phone=phone_str,
        location=location_str,
        linkedin=linkedin_match.group(0) if linkedin_match else "",
        github=github_match.group(0) if github_match else ""
    )

    # 2. Multi-Section Separation
    sections: List[ResumeSection] = []
    curr_type = None
    curr_title = ""
    curr_lines: List[str] = []

    def flush_section():
        nonlocal curr_type, curr_title, curr_lines
        if curr_type and curr_lines:
            html = ""
            list_items = []
            paragraphs = []

            for l in curr_lines:
                clean_l = l.strip()
                if not clean_l: continue
                if clean_l.upper() == full_name:
                    continue
                if curr_type == 'summary' and is_pure_contact_line(clean_l):
                    continue

                if clean_l.startswith(('•', '-', '*', '❖', '➢', '▪')) or re.match(r'^\d+\.', clean_l):
                    clean = re.sub(r'^[•\-\*\d\.\s❖➢▪]+', '', clean_l)
                    list_items.append(f"<li>{clean}</li>")
                elif clean_l.lower().startswith(('technology used:', 'technologies used:', 'tech stack:', 'tools:', 'role and responsibilities:', 'roles & responsibilities:')):
                    if list_items:
                        html += f"<ul>{''.join(list_items)}</ul>"
                        list_items = []
                    parts = clean_l.split(':', 1)
                    html += f"<p><strong>{parts[0]}:</strong> {parts[1].strip() if len(parts)>1 else ''}</p>"
                else:
                    if list_items:
                        html += f"<ul>{''.join(list_items)}</ul>"
                        list_items = []
                    paragraphs.append(f"<p>{clean_l}</p>")

            if list_items:
                html += f"<ul>{''.join(list_items)}</ul>"
            if paragraphs:
                html = "".join(paragraphs) + html

            if html.strip():
                sections.append(
                    ResumeSection(
                        id=f"sec-{len(sections) + 1}-{int(time.time()*1000)}",
                        type=curr_type,
                        title=curr_title,
                        contentHtml=html
                    )
                )
            curr_lines = []

    # Iterate lines and detect sections
    for i, line in enumerate(lines):
        clean = line.strip()
        if not clean: continue
        if i < 6:
            if clean.upper() == full_name.upper(): continue
            if clean.lower() == job_title.lower(): continue
            if is_pure_contact_line(clean): continue

        header_match = match_section_header(clean)

        # Implicit summary trigger if no section started yet
        if curr_type is None and not header_match and re.match(r'^(?:Creative|Enthusiastic|Results-driven|Experienced|Passionate|Seeking|Dedicated|Dynamic|Motivated|Detail-oriented|Professional)\b', clean, re.IGNORECASE):
            curr_type = 'summary'
            curr_title = 'SUMMARY'

        # Implicit experience section trigger
        if not header_match and re.match(r'^(?:Software\s+Engineer|Software\s+Developer|Junior\s+Software\s+Engineer|Senior\s+Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer)\s*[:\-–|]', clean, re.IGNORECASE):
            if curr_type != 'experience':
                flush_section()
                curr_type = 'experience'
                curr_title = 'WORK EXPERIENCE'

        # Implicit project section trigger
        if not header_match and i + 1 < len(lines) and re.match(r'^Technolog(?:y|ies)\s*Used\s*:', lines[i+1], re.IGNORECASE):
            if curr_type != 'projects':
                flush_section()
                curr_type = 'projects'
                curr_title = 'PROJECT DETAILS'

        if header_match:
            flush_section()
            curr_type, curr_title = header_match
        else:
            if curr_type:
                curr_lines.append(line)
            else:
                if not is_pure_contact_line(line) and clean.upper() != full_name.upper() and len(clean) > 25:
                    curr_type = "summary"
                    curr_title = "SUMMARY"
                    curr_lines.append(line)

    flush_section()

    # Deduplicate sections with identical titles
    deduplicated_sections: List[ResumeSection] = []
    for sec in sections:
        existing = next((s for s in deduplicated_sections if s.title.strip().upper() == sec.title.strip().upper()), None)
        if existing:
            existing.contentHtml = f"{existing.contentHtml}\n{sec.contentHtml}"
        else:
            deduplicated_sections.append(sec)

    # Fallback if no sections were created
    if not deduplicated_sections:
        deduplicated_sections.append(
            ResumeSection(
                id=f"sec-{int(time.time()*1000)}",
                type="summary",
                title="SUMMARY",
                contentHtml="".join(f"<p>{l}</p>" for l in lines if not is_pure_contact_line(l))
            )
        )

    return ResumeData(
        personalInfo=personal_info,
        sections=deduplicated_sections,
        pageSettings=PageSettings()
    )
