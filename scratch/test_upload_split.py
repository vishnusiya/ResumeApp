import httpx

sample_resume = """ANITHA V
Fresher - Software Developer
8590905348 | anithaanurudhan24@gmail.com | Cherthala, Kerala

P R O F E S S I O N A L S U M M A R Y
Enthusiastic and detail-oriented Computer Engineering diploma student with a strong foundation in programming, problem-solving, and web development. Proficient in Python, Java, and Django with hands-on experience through academic projects. Passionate about building scalable applications and eager to contribute to innovative software development teams.

T E C H N I C A L S K I L L S
• Languages: Python, Java, C
• Web Tech : HTML, CSS, Django
• Tools : MS Office, Git (Basic)
• Concepts : OOP, Problem Solving

K E Y C O M P E T E N C I E S
• Teamwork
• Communication
• Adaptability
• Quick Learning
• Attention to Detail
• Eager to Learn

P R O J E C T S
Main Project
AI-Powered Attendance Tracker
• Developed face-recognition attendance system using Python and OpenCV.
• Reduced manual entry time by 80%.

E D U C A T I O N
Diploma in Computer Engineering
Govt. Polytechnic College | 2021 - 2024
"""

files = {"file": ("anitha_resume.txt", sample_resume.encode("utf-8"), "text/plain")}
r = httpx.post("http://127.0.0.1:8000/api/upload", files=files)
print("Status code:", r.status_code)
data = r.json()
print("Personal info:")
print("  Name:", data["personalInfo"]["fullName"])
print("  Job Title:", data["personalInfo"]["jobTitle"])
print("  Email:", data["personalInfo"]["email"])
print("  Phone:", data["personalInfo"]["phone"])
print("  Location:", data["personalInfo"]["location"])

print(f"\nSections Created ({len(data['sections'])}):")
for s in data["sections"]:
    print(f"  [{s['type'].upper()}] - {s['title']}")

assert len(data["sections"]) >= 4, f"Expected at least 4 sections, got {len(data['sections'])}"
print("\n[SUCCESS] Resume successfully split into separate sections!")
