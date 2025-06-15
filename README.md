# SmartDoc Analyzer

An AI-powered document analysis and processing application that extracts text, analyzes content, and generates insights from PDFs and images.

## Features

- Document upload (PDF and images)
- Text extraction using OCR for scanned documents
- Document classification
- Entity extraction
- Sentiment analysis
- Text summarization
- Statistical analysis

## Tech Stack

### Backend
- FastAPI
- PyMuPDF (PDF processing)
- Pytesseract & PIL (OCR processing)
- Scikit-learn (for document classification)
- Python 3.9+

### Frontend
- React 18
- Axios
- Chart.js for visualizations

## Project Structure

```
smartdoc-analyzer/
├── backend/
│   ├── app.py                  # Main FastAPI application
│   ├── processing.py           # Document processing pipeline
│   ├── ai_analysis.py          # AI analysis modules
│   ├── utils.py                # Helper functions
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadArea.js
│   │   │   ├── ResultsPanel.js
│   │   │   ├── StatsCard.js
│   │   │   └── AIInsights.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── models/
│   ├── document_classifier.pkl # Pre-trained classifier
│   └── ner_model/              # spaCy NER model
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Setup & Installation

### Prerequisites
- Docker and Docker Compose
- Python 3.9+
- Node.js 16+

### Running with Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smartdoc-analyzer.git
cd smartdoc-analyzer
```

2. Start the containers:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Development Setup

#### Backend

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend server:
```bash
uvicorn app:app --reload
```

#### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm start
```

## API Endpoints

- `GET /` - API health check
- `POST /upload/` - Upload and process a document
- `GET /documents/` - List all processed documents
- `GET /document/{document_id}` - Get specific document details

## License

MIT

---

This project demonstrates modern web development, AI/ML integration, and cloud deployment using only free and open-source tools.

