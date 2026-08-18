from backend.services.extractor import extract_text_from_docx, parse_raw_text_to_resume

with open(r"C:\Users\vishn\Downloads\Resumes\LALBI.docx", "rb") as f:
    raw_bytes = f.read()

raw_text = extract_text_from_docx(raw_bytes)
res = parse_raw_text_to_resume(raw_text, "LALBI.docx")

print("=== PARSED RESUME DATA ===")
print("Full Name:", res.personalInfo.fullName)
print("Job Title:", res.personalInfo.jobTitle)
print("Email:", res.personalInfo.email)
print("Phone:", res.personalInfo.phone)
print("Location:", res.personalInfo.location)
print(f"\n=== SECTIONS ({len(res.sections)} found) ===")
for idx, s in enumerate(res.sections):
    print(f"\n--- Section {idx+1}: [{s.type.upper()}] \"{s.title}\" ---")
    print(s.contentHtml)
