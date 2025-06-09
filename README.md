# SmartDoc Analyzer

SmartDoc Analyzer is a cloud-based document intelligence platform that leverages AI to extract insights from uploaded documents (PDFs, images). It enables users to upload documents, automatically extract text using OCR, and perform advanced analyses such as sentiment analysis, key information extraction, document classification, and summarization.

## Features
- **Document Upload & OCR:** Upload PDFs or images and extract text using Tesseract OCR.
- **AI-Powered Analysis:**
  - Sentiment analysis (detect positive/negative language)
  - Key information extraction (names, dates, amounts)
  - Document classification (e.g., resume, contract, article)
  - Abstractive summarization
- **Visual Dashboard:** Interactive results display with charts and highlights.
- **Downloadable Reports:** Export analysis results.
- **Searchable Document History:** Quickly find and review past uploads.
- **User Accounts (Optional):** Secure login and saved document history.

## Tech Stack
- **Frontend:** React.js + Tailwind CSS (Vite)
- **Backend:** Python FastAPI
- **AI Engine:** PyTorch/TensorFlow, Hugging Face Transformers, Tesseract OCR
- **Storage:** SQLite (local) / PostgreSQL (cloud)
- **Cloud:** Netlify/Vercel (frontend), Fly.io (backend)

## Getting Started
1. Clone the repository
2. See `frontend/` and `backend/` folders for setup instructions

---

This project demonstrates modern web development, AI/ML integration, and cloud deployment using only free and open-source tools.

