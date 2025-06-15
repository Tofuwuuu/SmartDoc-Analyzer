from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid
from processing import process_document
from utils import save_upload_file

app = FastAPI(title="SmartDoc Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartDoc Analyzer API"}

@app.post("/upload/")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Save the uploaded file
        file_path = await save_upload_file(file)
        
        # Process the document
        result = process_document(file_path)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 