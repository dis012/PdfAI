import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pdf_to_prompt import convert_pdf_to_text

app = FastAPI(
    title="PDF Data Extractor",
    description="Extract structured data from PDF documents using AI",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "PDF processing service is running"}


@app.post("/extract-pdf-data/")
async def extract_pdf_data(file: UploadFile = File(...)):
    """
    Extract structured data from an uploaded PDF file

    Args:
        file: The uploaded PDF file

    Returns:
        pdf converted to text
    """
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_path = temp_file.name
            contents = await file.read()
            temp_file.write(contents)

        # Process the PDF
        result = convert_pdf_to_text(temp_path)

        # Remove temporary file
        os.unlink(temp_path)

        return JSONResponse(
            status_code=200, content={"status": "success", "data": result}
        )
    except Exception as e:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
