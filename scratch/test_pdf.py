import io
import httpx
from pypdf import PdfWriter

# Create a small valid test PDF in memory
writer = PdfWriter()
page = writer.add_blank_page(width=612, height=792)

pdf_bytes = io.BytesIO()
writer.write(pdf_bytes)
pdf_bytes.seek(0)

# Send to backend
files = {"file": ("sample_resume.pdf", pdf_bytes.getvalue(), "application/pdf")}
r = httpx.post("http://127.0.0.1:8000/api/upload", files=files)
print("PDF Upload Status:", r.status_code)
print("PDF Upload Parsed Output:", r.json())
assert r.status_code == 200
print("[SUCCESS] PDF parser processed binary PDF successfully!")
