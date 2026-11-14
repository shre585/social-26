from pathlib import Path
from typing import List, Dict, Any, Tuple

try:
    from fastapi import HTTPException
except ImportError:
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

def extract_pdf_text(file_path: Path) -> str:
    """Extract text from PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        text_parts = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_parts.append(extracted.strip())
        full_text = "\n\n".join(text_parts).strip()
        if not full_text or len(full_text) < 20:
            raise HTTPException(
                status_code=400,
                detail="No extractable text found in PDF. Scanned PDFs or image-only documents are not currently supported."
            )
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF document: {str(e)}")

def extract_docx_text(file_path: Path) -> str:
    """Extract text from Word .docx file using python-docx."""
    try:
        from docx import Document
        doc = Document(str(file_path))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(paragraphs).strip()
        if not full_text or len(full_text) < 20:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in DOCX document."
            )
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read DOCX document: {str(e)}")

def document_to_segments(text: str) -> List[Dict[str, Any]]:
    """
    Convert document paragraphs into virtual timestamped segments
    so the rest of the pipeline (analysis, keyword extraction, carousel)
    can operate uniformly.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    if not paragraphs:
        # Fallback to single sentences
        import re
        paragraphs = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]

    segments = []
    curr_time = 0.0
    for idx, para in enumerate(paragraphs):
        # Estimate ~150 words per minute reading speed
        word_count = len(para.split())
        est_duration = max(5.0, min(30.0, (word_count / 150.0) * 60.0))
        segments.append({
            "start": round(curr_time, 2),
            "end": round(curr_time + est_duration, 2),
            "text": para
        })
        curr_time += est_duration

    return segments
