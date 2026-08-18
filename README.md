# AI Resume Studio

A modern AI-powered Resume Editor, ATS Tailoring & Merger application built with React, TypeScript, Vite, and FastAPI.

---

## Project Structure

```
ResumeApp/
├── backend/          # FastAPI Backend (Python)
│   ├── .env          # Backend Environment & OpenAI API Keys
│   ├── main.py
│   ├── models.py
│   └── services/
├── frontend/         # React + Vite + TypeScript Frontend
│   ├── package.json
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── vite.config.ts
└── README.md
```

---

## Getting Started

### 1. Run the Backend API (FastAPI)

```bash
# Activate your virtual environment
.venv\Scripts\activate

# Start the FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

The backend will be running at `http://127.0.0.1:8000`.

---

### 2. Run the Frontend (React + Vite)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:5173`.
