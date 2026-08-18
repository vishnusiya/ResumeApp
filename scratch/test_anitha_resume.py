import re

sample_resume_text = """ANITHA V
Fresher - Software Developer
8590905348 | anithaanurudhan24@gmail.com | Cherthala, Kerala

P R O F E S S I O N A L S U M M A R Y
Enthusiastic and detail-oriented Computer Engineering diploma student with a strong foundation in programming, problem-solving, and web development. Proficient in Python, Java, and Django with hands-on experience through academic projects. Passionate about building scalable applications and eager to contribute to innovative software development teams.

T E C H N I C A L S K I L L S
Languages: Python, Java, C
Web Tech : HTML, CSS, Django
Tools : MS Office, Git (Basic)
Concepts : OOP, Problem Solving

K E Y C O M P E T E N C I E S
Teamwork
Communication
Adaptability
Quick Learning
Attention to Detail
Eager to Learn

P R O J E C T S
Main Project
AI-Powered Attendance Tracker
• Developed face-recognition attendance system using Python and OpenCV.
• Reduced manual entry time by 80%.

E D U C A T I O N
Diploma in Computer Engineering
Govt. Polytechnic College | 2021 - 2024
"""

def normalize_header_text(line: str) -> str:
    # 1. Un-space single characters: "P R O F E S S I O N A L" -> "PROFESSIONAL"
    unspaced = re.sub(r'(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)', '', line.strip())
    # 2. Clean punctuation/numbers: "1. TECHNICAL SKILLS:" -> "TECHNICAL SKILLS"
    clean = re.sub(r'^[•\-\*\d\.\s#_]+|[:_]+$', '', unspaced).strip()
    return clean

SECTION_MATCHERS = [
    ('summary', 'SUMMARY', re.compile(r'^(?:professional\s*summary|executive\s*summary|career\s*objective|objective|summary|profile|about\s*me)$', re.IGNORECASE)),
    ('skills', 'SKILLS', re.compile(r'^(?:technical\s*skills|key\s*competencies|core\s*competencies|competencies|skills|technologies|tools\s*&\s*technologies|programming\s*languages)$', re.IGNORECASE)),
    ('experience', 'EXPERIENCE', re.compile(r'^(?:work\s*experience|employment\s*history|professional\s*experience|internships|internship\s*experience|experience|career\s*history)$', re.IGNORECASE)),
    ('projects', 'PROJECTS', re.compile(r'^(?:academic\s*projects|key\s*projects|personal\s*projects|main\s*project|projects)$', re.IGNORECASE)),
    ('education', 'EDUCATION', re.compile(r'^(?:educational\s*qualifications|academic\s*background|academics|qualifications|education)$', re.IGNORECASE)),
    ('certifications', 'CERTIFICATIONS', re.compile(r'^(?:certifications|certificates|courses|trainings|credentials)$', re.IGNORECASE)),
    ('achievements', 'ACHIEVEMENTS', re.compile(r'^(?:achievements|awards|honors|extracurricular\s*activities|activities)$', re.IGNORECASE)),
    ('additional', 'ADDITIONAL INFO', re.compile(r'^(?:additional\s*info|additional\s*information|languages|personal\s*details|interests)$', re.IGNORECASE)),
]

def match_section_header(line: str):
    norm = normalize_header_text(line)
    if len(norm) > 40:  # Headers shouldn't be very long paragraphs
        return None
    for sec_type, sec_title, regex in SECTION_MATCHERS:
        if regex.match(norm):
            return sec_type, sec_title
    return None

lines = sample_resume_text.splitlines()
found = []
for idx, l in enumerate(lines):
    if not l.strip(): continue
    matched = match_section_header(l)
    if matched:
        found.append((l, matched))

print("Found headers:")
for orig, (stype, stitle) in found:
    print(f"  '{orig}' -> {stitle} ({stype})")
