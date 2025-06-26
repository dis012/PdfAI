from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from .request import process_pdf_file

app = FastAPI(
    title="PDF Data Extractor",
    description="Extract structured data from PDF documents using AI"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to save extracted JSON data
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "c:/WolfsAI/output")

@app.post("/extract-pdf-data/")
async def extract_pdf_data(file: UploadFile = File(...), model: str = "gemma3:4b"):
    """
    Extract structured data from an uploaded PDF file
    
    Args:
        file: The uploaded PDF file
        model: The AI model to use for extraction
        
    Returns:
        JSON with extracted data
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_path = temp_file.name
            contents = await file.read()
            temp_file.write(contents)
        
        # Process the PDF
        result = process_pdf_file(
            file_path=temp_path,
            save_dir=OUTPUT_DIR,
            model=model
        )
        
        # Remove temporary file
        os.unlink(temp_path)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "filename": file.filename,
                "output_path": result["file_path"],
                "data": result["data"]
            }
        )
    except Exception as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
