# SmartDoc Analyzer

A cloud-based document intelligence platform that extracts insights from uploaded documents (PDFs, images) using AI.

## Features

- Document Upload & OCR
  - Accept PDF/images via drag-and-drop UI
  - Extract text using OCR and PyMuPDF

- Document Analysis
  - Extract text from documents
  - Optical Character Recognition (OCR) for images

- Interactive UI
  - Modern React frontend with Tailwind CSS
  - Real-time document processing
  - Responsive design

## Tech Stack

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI
- **Document Processing**: PyMuPDF, Tesseract OCR
- **Storage**: SQLite (local) / PostgreSQL (production)

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.7+)
- Tesseract OCR installed on your system

### Setup Backend

```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

### Setup Frontend

```bash
cd frontend
npm install
```

### Running the Application

**Backend:**
```bash
cd backend
# Activate virtual environment
python run.py
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Project Structure

```
smartdoc-analyzer/
├── frontend/               # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── context/        # React context for state management
│       └── ...
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── ...
│   ├── uploads/            # Uploaded documents
│   └── ...
└── ...
```

## License

This project is licensed under the MIT License.

---

This project demonstrates modern web development, AI/ML integration, and cloud deployment using only free and open-source tools.

