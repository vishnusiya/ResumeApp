import re
from typing import Dict, Any, List
try:
    from ..models import ResumeData
except ImportError:
    from models import ResumeData

STRONG_ACTION_VERBS = [
    'spearheaded', 'architected', 'accelerated', 'championed', 'engineered',
    'orchestrated', 'designed', 'developed', 'deployed', 'scaled', 'optimized',
    'streamlined', 'delivered', 'mentored', 'executed', 'implemented', 'transformed'
]

METRIC_PATTERNS = [
    re.compile(r'\b\d+%\b'),
    re.compile(r'\$\d+[\w]*'),
    re.compile(r'\b\d+M\+?\b', re.IGNORECASE),
    re.compile(r'\b\d+k\+?\b', re.IGNORECASE),
    re.compile(r'\b\d+\+\s*(?:years|users|engineers|projects)\b', re.IGNORECASE),
    re.compile(r'99\.\d+%\s*uptime', re.IGNORECASE)
]

def calculate_backend_ats_score(resume: ResumeData, target_jd: str = "") -> Dict[str, Any]:
    full_text = f"{resume.personalInfo.fullName} {resume.personalInfo.jobTitle} "
    for s in resume.sections:
        if s.visible:
            clean = re.sub(r'<[^>]*>', ' ', s.contentHtml)
            full_text += f"{s.title} {clean} "

    text_lower = full_text.lower()

    # 1. Action Verbs Score (Max 25)
    found_verbs = set()
    for verb in STRONG_ACTION_VERBS:
        if re.search(rf'\b{verb}\b', text_lower):
            found_verbs.add(verb.capitalize())
    action_score = min(25, len(found_verbs) * 5)

    # 2. Measurable Metrics Score (Max 25)
    found_metrics = set()
    for pat in METRIC_PATTERNS:
        matches = pat.findall(full_text)
        for m in matches:
            found_metrics.add(m)
    metrics_score = min(25, len(found_metrics) * 6)

    # 3. Section Completeness (Max 25)
    sec_types = {s.type for s in resume.sections if s.visible}
    req_secs = {'summary', 'experience', 'education', 'skills'}
    matched_secs = sec_types.intersection(req_secs)
    completeness_score = int((len(matched_secs) / len(req_secs)) * 25)

    # 4. Contact Details (Max 25)
    contact_score = 0
    if resume.personalInfo.fullName.strip(): contact_score += 7
    if resume.personalInfo.email.strip(): contact_score += 6
    if resume.personalInfo.phone.strip(): contact_score += 6
    if resume.personalInfo.location.strip() or resume.personalInfo.linkedin: contact_score += 6

    total_score = min(100, action_score + metrics_score + completeness_score + contact_score)

    # JD Keyword Matcher
    jd_analysis = None
    if target_jd and target_jd.strip():
        words = re.findall(r'[a-zA-Z]{3,}', target_jd.lower())
        stop_words = {'the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'your', 'will', 'you', 'are'}
        keywords = list({w for w in words if w not in stop_words})[:20]
        
        matched_keywords = [k for k in keywords if k in text_lower]
        missing_keywords = [k for k in keywords if k not in text_lower][:6]
        match_rate = round((len(matched_keywords) / max(1, len(keywords))) * 100)

        jd_analysis = {
            "matchRate": match_rate,
            "matchedKeywords": matched_keywords,
            "missingKeywords": missing_keywords
        }

    readability = "Excellent" if total_score >= 85 else "Good" if total_score >= 70 else "Needs Improvement"

    return {
        "overallScore": total_score,
        "readability": readability,
        "actionVerbsScore": action_score,
        "actionVerbsFound": list(found_verbs),
        "metricsScore": metrics_score,
        "metricsFound": list(found_metrics),
        "sectionCompletenessScore": completeness_score,
        "contactScore": contact_score,
        "jdAnalysis": jd_analysis
    }
