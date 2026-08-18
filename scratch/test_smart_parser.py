import re
from typing import List, Tuple, Optional, Dict, Any

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b(?:(?:\+91[\-\s]?)?[6-9]\d{9})\b')
LINKEDIN_REGEX = re.compile(r'(?:linkedin\.com\/in\/[a-zA-Z0-9\-_]+|[a-zA-Z0-9\-_]+\/in\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:github\.com\/[a-zA-Z0-9\-_]+)', re.IGNORECASE)
LOCATION_REGEX = re.compile(r'(?:[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z\s]+,\s*[A-Z]{2})')

SECTION_MATCHERS = [
    ('summary', 'SUMMARY', re.compile(r'^(?:professional\s*summary|executive\s*summary|career\s*objective|career\s*profile|objective|summary|profile|about\s*me|synopsis|professional\s*synopsis)$', re.IGNORECASE)),
    ('skills', 'TECHNICAL SKILLS', re.compile(r'^(?:technical\s*skills|technologies\s*used|technology\s*used|key\s*competencies|core\s*competencies|competencies|skills|technologies|tools\s*&\s*technologies|programming\s*languages|technical\s*expertise|tech\s*stack|tools\s*used|skills\s*&\s*tools|areas\s*of\s*expertise)$', re.IGNORECASE)),
    ('experience', 'EXPERIENCE', re.compile(r'^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history|work\s*history|experience\s*summary)$', re.IGNORECASE)),
    ('projects', 'PROJECTS', re.compile(r'^(?:academic\s*projects|key\s*projects|personal\s*projects|project\s*details|projects\s*handled|projects\s*undertaken|project\s*experience|projects|key\s*project\s*details)$', re.IGNORECASE)),
    ('education', 'EDUCATION', re.compile(r'^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education|degrees|academic\s*details)$', re.IGNORECASE)),
    ('certifications', 'CERTIFICATIONS', re.compile(r'^(?:certifications|certificates|courses|trainings|credentials|licenses)$', re.IGNORECASE)),
    ('achievements', 'ACHIEVEMENTS', re.compile(r'^(?:achievements|awards|honors|extracurricular\s*activities|activities)$', re.IGNORECASE)),
    ('additional', 'ADDITIONAL INFO', re.compile(r'^(?:additional\s*info|additional\s*information|languages|personal\s*details|interests|hobbies)$', re.IGNORECASE)),
]

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
    # If it's a year range like 2018-2019, it is NOT contact info
    if re.search(r'\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b', clean, re.IGNORECASE):
        return False
    if EMAIL_REGEX.search(clean) or PHONE_REGEX.search(clean):
        text_without_contact = EMAIL_REGEX.sub('', PHONE_REGEX.sub('', clean)).strip(' ,|•-📍📞✉️🔗')
        if len(text_without_contact) < 25:
            return True
    if clean.startswith(('📍', '📞', '✉️', '🔗')) and len(clean) < 35:
        return True
    return False

def extract_candidate_name_and_title(lines: List[str]) -> Tuple[str, str]:
    # Check if lines[0] is an obvious header
    name = "YOUR NAME"
    job_title = "Software Developer"

    # Common non-name words
    non_names = {
        'CAREER OBJECTIVE', 'OBJECTIVE', 'SUMMARY', 'PROFESSIONAL SUMMARY',
        'RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'EXPERIENCE', 'PROJECT DETAILS',
        'TECHNOLOGIES USED', 'TECHNICAL SKILLS', 'EDUCATION'
    }

    # 1. Search for name in top 15 lines or any standalone uppercase line matching name pattern
    candidate_names = []
    for idx, l in enumerate(lines[:15]):
        norm = normalize_header_text(l).upper()
        if norm in non_names or match_section_header(l):
            continue
        if is_pure_contact_line(l):
            continue
        # Names are usually 1-4 words, 2-35 chars, letters and dots only
        if re.match(r'^[A-Z][A-Za-z\.\s]{1,35}$', l.strip()):
            words = l.strip().split()
            if 1 <= len(words) <= 4 and not any(w.lower() in ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst'] for w in words):
                candidate_names.append((idx, l.strip()))

    # If lines further down have an all-caps isolated name like "JILNA P M"
    for idx, l in enumerate(lines):
        norm = normalize_header_text(l).upper()
        if norm in non_names or match_section_header(l) or is_pure_contact_line(l):
            continue
        if re.match(r'^[A-Z\s\.]{3,25}$', l.strip()) and len(l.strip().split()) in [2, 3, 4]:
            words = l.strip().split()
            if not any(w.lower() in ['developer', 'engineer', 'manager', 'lead', 'fresher', 'consultant', 'analyst', 'technology', 'used', 'role', 'responsibilities'] for w in words):
                # Prioritize explicit isolated all-caps names
                name = l.strip().upper()
                break

    if name == "YOUR NAME" and candidate_names:
        name = candidate_names[0][1].upper()
    elif name == "YOUR NAME" and lines:
        first_clean = normalize_header_text(lines[0])
        if first_clean.upper() not in non_names and not match_section_header(first_clean):
            name = first_clean.upper()

    # 2. Search for job title
    title_keywords = ['engineer', 'developer', 'architect', 'consultant', 'lead', 'analyst', 'designer', 'fresher', 'programmer', 'specialist']
    for l in lines[:10]:
        clean = l.strip()
        if match_section_header(clean) or clean.upper() == name:
            continue
        if any(tk in clean.lower() for tk in title_keywords):
            # Extract clean title: "Creative Software developer around 5 years..." -> "Software Developer"
            m = re.search(r'\b((?:Senior\s+|Junior\s+|Lead\s+|Creative\s+)?(?:Software\s+Developer|Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer|Frontend\s+Developer|Backend\s+Developer|\w+\s+Engineer|\w+\s+Developer))\b', clean, re.IGNORECASE)
            if m:
                job_title = m.group(1).title()
            elif len(clean) < 40:
                job_title = clean
            break

    return name, job_title

def parse_smart_resume(raw_text: str) -> Dict[str, Any]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if not lines:
        return {"name": "YOUR NAME", "title": "Software Developer", "sections": []}

    name, job_title = extract_candidate_name_and_title(lines)
    all_text = " ".join(lines)
    
    # Phone extraction (ignoring year ranges)
    phone = ""
    for match in PHONE_REGEX.finditer(all_text):
        candidate_phone = match.group(0).strip()
        if not re.search(r'\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d)\b', candidate_phone):
            phone = candidate_phone
            break

    email = (EMAIL_REGEX.search(all_text) or [None])[0] or ""
    linkedin = (LINKEDIN_REGEX.search(all_text) or [None])[0] or ""

    # Section Parsing
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
                # Skip isolated candidate name if repeated in section body
                if clean_l.upper() == name:
                    continue
                if curr_type == 'summary' and is_pure_contact_line(clean_l):
                    continue

                # Bullet points
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

    # Detect implicit section triggers
    for i, line in enumerate(lines):
        clean = line.strip()
        if not clean: continue
        if clean.upper() == name and i < 5:
            continue

        header_match = match_section_header(clean)
        
        # Check implicit experience patterns: "Software Engineer : Zealogics..."
        if not header_match and re.match(r'^(?:Software\s+Engineer|Software\s+Developer|Junior\s+Software\s+Engineer|Senior\s+Software\s+Engineer|Full\s*Stack\s+Developer|Web\s+Developer)\s*[:\-–|]', clean, re.IGNORECASE):
            if curr_type != 'experience':
                flush_section()
                curr_type = 'experience'
                curr_title = 'WORK EXPERIENCE'

        # Check implicit project patterns: "TeamsRegistry" / "SupportTool" followed by "Technology Used"
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
                if not is_pure_contact_line(line) and clean.upper() != name:
                    curr_type = "summary"
                    curr_title = "SUMMARY"
                    curr_lines.append(line)

    flush_section()

    return {
        "name": name,
        "jobTitle": job_title,
        "phone": phone,
        "email": email,
        "linkedin": linkedin,
        "sections": sections
    }

from scratch.test_jilna_resume import sample_resume_jilna
res = parse_smart_resume(sample_resume_jilna)

print("=== PARSED JILNA RESUME ===")
print("Name:", res["name"])
print("Job Title:", res["jobTitle"])
print("Phone:", res["phone"] or "None (Clean)")
print("Sections Found:", len(res["sections"]))
for s in res["sections"]:
    print(f"  [{s['type'].upper()}] - {s['title']}")
    print(f"    Content preview: {s['contentHtml'][:120]}...")
