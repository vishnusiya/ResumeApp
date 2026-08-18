import re
from typing import List, Tuple, Optional, Dict, Any

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b(?:(?:\+91[\-\s]?)?[6-9]\d{9})\b')
LINKEDIN_REGEX = re.compile(r'(?:linkedin\.com\/in\/[a-zA-Z0-9\-_]+|[a-zA-Z0-9\-_]+\/in\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:github\.com\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)

SECTION_MATCHERS = [
    ('summary', 'SUMMARY', re.compile(r'^(?:professional\s*summary|executive\s*summary|career\s*objective|career\s*profile|objective|summary|profile|about\s*me|synopsis|professional\s*synopsis)$', re.IGNORECASE)),
    ('skills', 'TECHNICAL SKILLS', re.compile(r'^(?:technical\s*skills|other\s*skills|key\s*skills|core\s*skills|additional\s*skills|technologies\s*used|technology\s*used|key\s*competencies|core\s*competencies|competencies|skills|technologies|tools\s*&\s*technologies|programming\s*languages|technical\s*expertise|tech\s*stack|tools\s*used|skills\s*&\s*tools|areas\s*of\s*expertise)$', re.IGNORECASE)),
    ('experience', 'EXPERIENCE', re.compile(r'^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history|work\s*history|experience\s*summary)$', re.IGNORECASE)),
    ('projects', 'PROJECTS', re.compile(r'^(?:academic\s*projects|key\s*projects|personal\s*projects|project\s*details|projects\s*handled|projects\s*undertaken|project\s*experience|projects|key\s*project\s*details)$', re.IGNORECASE)),
    ('education', 'EDUCATION', re.compile(r'^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education|degrees|academic\s*details)$', re.IGNORECASE)),
    ('certifications', 'CERTIFICATIONS', re.compile(r'^(?:certifications|certificates|courses|trainings|credentials|licenses)$', re.IGNORECASE)),
    ('achievements', 'ACHIEVEMENTS', re.compile(r'^(?:achievements|awards|honors|extracurricular\s*activities|activities)$', re.IGNORECASE)),
    ('additional', 'ADDITIONAL INFO', re.compile(r'^(?:additional\s*info|additional\s*information|languages|personal\s*details|interests|hobbies)$', re.IGNORECASE)),
]

NON_NAME_HEADERS = {
    'CAREER OBJECTIVE', 'OBJECTIVE', 'SUMMARY', 'PROFESSIONAL SUMMARY',
    'RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'EXPERIENCE', 'PROJECT DETAILS',
    'TECHNOLOGIES USED', 'TECHNICAL SKILLS', 'EDUCATION', 'KEY COMPETENCIES',
    'WORK EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'OTHER SKILLS',
    'KEY SKILLS', 'SKILLS', 'ADDITIONAL INFO'
}

def normalize_header_text(line: str) -> str:
    unspaced = re.sub(r'(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)', '', line.strip())
    clean = re.sub(r'^[•\-\*\d\.\s#_❖➢▪]+|[:_]+$', '', unspaced).strip()
    return clean

def match_section_header(line: str) -> Optional[Tuple[str, str]]:
    norm = normalize_header_text(line)
    if not norm or len(norm) > 40:
        return None
    for sec_type, sec_title, regex in SECTION_MATCHERS:
        if regex.match(norm):
            return sec_type, sec_title
    return None

def is_pure_contact_line(line: str) -> bool:
    clean = line.strip()
    if not clean: return True
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

def parse_docx_resume_test(file_path: str):
    from docx import Document
    doc = Document(file_path)
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    name, job_title, location = extract_candidate_name_and_title(lines)
    all_text = " ".join(lines)
    email = (EMAIL_REGEX.search(all_text) or [None])[0] or ""
    phone = ""
    for match in PHONE_REGEX.finditer(all_text):
        cand = match.group(0).strip()
        if not re.search(r'\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d)\b', cand):
            phone = cand
            break

    sections = []
    curr_type = None
    curr_title = ""
    curr_lines = []

    def flush_section():
        nonlocal curr_type, curr_title, curr_lines
        if curr_type and curr_lines:
            html = ""
            list_items = []
            paragraphs = []

            for l in curr_lines:
                clean_l = l.strip()
                if not clean_l: continue
                if clean_l.upper() == name: continue
                if curr_type == 'summary' and is_pure_contact_line(clean_l): continue

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
                sections.append({
                    "id": f"sec-{len(sections) + 1}",
                    "type": curr_type,
                    "title": curr_title,
                    "contentHtml": html
                })
            curr_lines = []

    for i, line in enumerate(lines):
        clean = line.strip()
        if not clean: continue
        if clean.upper() == name and i < 5: continue
        if is_pure_contact_line(clean) and i < 5: continue

        header_match = match_section_header(clean)

        # Only check implicit summary if NO section has been started yet
        if curr_type is None and not header_match and re.match(r'^(?:Creative|Enthusiastic|Results-driven|Experienced|Passionate|Seeking|Dedicated|Dynamic|Motivated|Detail-oriented|Professional)\b', clean, re.IGNORECASE):
            curr_type = 'summary'
            curr_title = 'SUMMARY'

        if header_match:
            flush_section()
            curr_type, curr_title = header_match
        else:
            if curr_type:
                curr_lines.append(line)
            else:
                if not is_pure_contact_line(line) and clean.upper() != name:
                    curr_type = "summary"
                    curr_title = "SUMMARY"
                    curr_lines.append(line)

    flush_section()

    return {
        "fullName": name,
        "jobTitle": job_title,
        "email": email,
        "phone": phone,
        "location": location,
        "sections": sections
    }

res = parse_docx_resume_test(r"C:\Users\vishn\Downloads\Resumes\LALBI.docx")
print("=== PARSED LALBI.DOCX RESULT ===")
print("Full Name:", res["fullName"])
print("Job Title:", res["jobTitle"])
print("Email:", res["email"])
print("Phone:", res["phone"])
print("Location:", res["location"])
print(f"\nSections Created ({len(res['sections'])}):")
for idx, s in enumerate(res["sections"]):
    print(f"\n[{s['type'].upper()}] - {s['title']}")
    print(s["contentHtml"][:180] + "...")
