import re
import os
import logging
from typing import Dict
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)

# Регулярка для цен
PRICE_RE = re.compile(r"(\d{1}[\.,]\d{2,3})")

def extract_text(image_path: str) -> str:
    try:
        # Пытаемся найти путь к tesseract из переменной окружения
        tess_path = os.environ.get("TESSERACT_CMD", r"C:\Users\User\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
        pytesseract.pytesseract.tesseract_cmd = tess_path
        
        if not os.path.exists(image_path):
            return "Файл не найден"
        
        img = Image.open(image_path)
        img = img.convert("L") # ЧБ для лучшего распознавания
        
        # Если tesseract не установлен, эта строка вызовет ошибку
        text = pytesseract.image_to_string(img, lang='eng+rus')
        return text
    except Exception as e:
        print(f"!!! ОШИБКА OCR: Возможно, Tesseract не установлен. {e}")
        return f"Ошибка распознавания: проверьте установлен ли Tesseract OCR"

def parse_prices(text: str) -> Dict:
    matches = PRICE_RE.findall(text)
    unique_prices = [m.replace(',', '.') for m in list(dict.fromkeys(matches))]
    
    # Заглушка, если ничего не нашли
    return {
        "brand": "Определите бренд",
        "prices": {
            "regular": unique_prices[0] if len(unique_prices) > 0 else "0.00",
            "premium": unique_prices[1] if len(unique_prices) > 1 else "0.00",
            "diesel": unique_prices[2] if len(unique_prices) > 2 else "0.00",
        }
    }