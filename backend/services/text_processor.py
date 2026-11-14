from pathlib import Path
from typing import List, Dict, Any

try:
    from fastapi import HTTPException
except ImportError:
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
from backend.services.pdf_processor import document_to_segments

def extract_raw_text(file_path: Path) -> str:
    """Read plaintext or markdown file with utf-8 encoding."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or len(content) < 15:
            raise HTTPException(status_code=400, detail="Text file is empty or too short to process.")
        return content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read text file: {str(e)}")

def text_to_segments(text: str) -> List[Dict[str, Any]]:
    return document_to_segments(text)
