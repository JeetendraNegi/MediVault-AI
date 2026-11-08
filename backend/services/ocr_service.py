import os
import logging
import concurrent.futures
from PIL import Image

logger = logging.getLogger(__name__)

def _run_pytesseract(file_path: str) -> str:
    try:
        import pytesseract
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip() if text else ""
    except Exception:
        return ""

def extract_text_from_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""

    extracted_lines = []
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        try:
            import fitz
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text("text")
                if text and text.strip():
                    extracted_lines.append(text.strip())
            if extracted_lines:
                return "\n".join(extracted_lines)
        except Exception as e:
            logger.debug("PyMuPDF parser note: %s", e)

        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text and text.strip():
                        extracted_lines.append(text.strip())
            if extracted_lines:
                return "\n".join(extracted_lines)
        except Exception as e:
            logger.debug("pdfplumber parser note: %s", e)

        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                text = page.extract_text()
                if text and text.strip():
                    extracted_lines.append(text.strip())
            if extracted_lines:
                return "\n".join(extracted_lines)
        except Exception as e:
            logger.debug("pypdf parser note: %s", e)

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run_pytesseract, file_path)
            res = future.result(timeout=6)
            if res and len(res) > 10:
                return res
    except Exception as e:
        logger.debug("PyTesseract OCR note: %s", e)

    return ""
