import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("1. Testing Healthcheck...")
    r = httpx.get(f"{BASE_URL}/api/health")
    print("Health response:", r.status_code, r.json())
    assert r.status_code == 200

    print("\n2. Testing AI Rewrite Endpoint...")
    rewrite_payload = {
        "sectionType": "experience",
        "sectionTitle": "EXPERIENCE",
        "currentContent": "<p>worked on building backend services and handled databases.</p>",
        "actionId": "star_method"
    }
    r_ai = httpx.post(f"{BASE_URL}/api/ai/rewrite", json=rewrite_payload)
    print("AI Rewrite response status:", r_ai.status_code)
    print("Suggested text sample:", r_ai.json().get("suggestedText")[:120])
    assert r_ai.status_code == 200

    print("\n3. Testing Text Upload Ingestion...")
    sample_text = """JOHN DOE
Senior Full Stack Engineer
john.doe@example.com | +1 555 123 4567 | San Francisco, CA | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 6+ years designing cloud systems.

EXPERIENCE
Tech Solutions Inc. | Lead Developer
2021 - Present
• Spearheaded migration of legacy monolith to FastAPI microservices.
• Reduced API response latency by 45%.

EDUCATION
B.S. in Computer Science
University of California | 2017 - 2021

SKILLS
Python, FastAPI, React, TypeScript, Docker, PostgreSQL
"""
    files = {"file": ("test_resume.txt", sample_text.encode("utf-8"), "text/plain")}
    r_upload = httpx.post(f"{BASE_URL}/api/upload", files=files)
    print("Upload response status:", r_upload.status_code)
    upload_data = r_upload.json()
    print("Parsed Name:", upload_data["personalInfo"]["fullName"])
    print("Parsed Email:", upload_data["personalInfo"]["email"])
    print("Parsed Sections count:", len(upload_data["sections"]))
    assert upload_data["personalInfo"]["email"] == "john.doe@example.com"
    assert len(upload_data["sections"]) >= 3

    print("\n[SUCCESS] All Backend Endpoints Working 100% Correctly!")

if __name__ == "__main__":
    test_api()
