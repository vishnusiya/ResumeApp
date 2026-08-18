from backend.services.extractor import parse_raw_text_to_resume
from scratch.test_jilna_resume import sample_resume_jilna

res = parse_raw_text_to_resume(sample_resume_jilna)
print("Candidate Name:", res.personalInfo.fullName)
print("Job Title:", res.personalInfo.jobTitle)
print("Phone:", res.personalInfo.phone or "None (Clean)")
print("Total Sections Found:", len(res.sections))
for idx, s in enumerate(res.sections):
    print(f"  Section {idx+1}: [{s.type.upper()}] - {s.title}")
    print(f"    Content: {s.contentHtml[:90]}...")
