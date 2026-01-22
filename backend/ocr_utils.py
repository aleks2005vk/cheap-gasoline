import re
import os
import logging
from typing import List
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)

PRICE_RE = re.compile(r"(\d{1,3}[\.,]\d{1,2})")

# Allow overriding tesseract binary via environment variable (Windows users)
TESSERACT_CMD = os.environ.get("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    logger.info(f"Tesseract path set to: {TESSERACT_CMD}")


def extract_text(image_path: str) -> str:
    """Extract text from image using Tesseract OCR."""
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        logger.info(f"Processing image: {image_path}")
        img = Image.open(image_path)
        
        # Get image info for debugging
        logger.info(f"Image size: {img.size}, mode: {img.mode}")
        
        # Convert to grayscale for better OCR
        img = img.convert("L")
        
        # Try English + Russian languages for better recognition
        text = pytesseract.image_to_string(img, lang='eng+rus+kat+osd')
        logger.info(f"OCR extracted {len(text)} characters")
        
        return text
    except Exception as e:
        logger.error(f"OCR extraction error: {type(e).__name__}: {e}")
        raise


def parse_prices(text: str) -> List[float]:
    """Return a list of price floats found in text."""
    try:
        matches = PRICE_RE.findall(text)
        prices = []
        for m in matches:
            normalized = m.replace(',', '.')
            try:
                prices.append(float(normalized))
            except ValueError:
                continue
        
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for p in prices:
            if p not in seen:
                seen.add(p)
                unique.append(p)
        
        logger.info(f"Found {len(unique)} unique prices: {unique}")
        return unique
    except Exception as e:
        logger.error(f"Price parsing error: {type(e).__name__}: {e}")
        return []
