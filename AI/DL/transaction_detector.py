import json
import re
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional
import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
import torch
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TransactionDetector:

    CLASS_NAMES = {0: 'date', 1: 'amount'}
    
    def __init__(self, model_path: str, confidence_threshold: float, use_gpu: bool = None):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        
        if use_gpu is None:
            use_gpu = torch.cuda.is_available()
            if use_gpu:
                logger.info(f"GPU is available, using GPU for OCR")
            else:
                logger.info(f"GPU not available, using CPU")

        self.reader = easyocr.Reader(['en', 'vi'], gpu=use_gpu)
        
    def detect(self, image_path: str, save_debug: bool = False) -> dict:
        image = cv2.imread(image_path)

        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        results = self.model.predict(
            source=image,
            conf=self.confidence_threshold,
            verbose=False
        )
        
        extracted_data = {
            "amount": None,
            "date": None
        }
        
        best_detections = {
            'amount': {'conf': 0, 'value': None},
            'date': {'conf': 0, 'value': None}
        }
        
        if save_debug:
            debug_image = image.copy()
        else:
            debug_image = None

        for result in results:
            boxes = result.boxes

            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                cropped = image[y1:y2, x1:x2]
                
                text = self._extract_text(cropped)
                
                class_name = self.CLASS_NAMES.get(cls_id, 'unknown')
                
                logger.debug(f"Detected {class_name} with conf={conf:.2f}, text='{text}'")
                
                if class_name == 'date' and conf > best_detections['date']['conf']:
                    parsed_date = self._parse_date(text)
                    if parsed_date is not None:
                        best_detections['date'] = {'conf': conf, 'value': parsed_date}
                        
                elif class_name == 'amount' and conf > best_detections['amount']['conf']:
                    parsed_amount = self._parse_amount(text)
                    if parsed_amount is not None:
                        best_detections['amount'] = {'conf': conf, 'value': parsed_amount}
                
                # Debug visualization
                if save_debug and debug_image is not None:
                    if class_name == 'amount':
                        color = (0, 255, 0)
                    else:
                        color = (255, 0, 0)
                        
                    cv2.rectangle(debug_image, (x1, y1), (x2, y2), color, 2)
                    label = f"{class_name}: {conf:.2f}"

                    cv2.putText(debug_image, label, (x1, y1 - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    cv2.putText(debug_image, text[:30], (x1, y2 + 20), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        extracted_data['date'] = best_detections['date']['value']
        extracted_data['amount'] = best_detections['amount']['value']
        
        # Save debug image
        if save_debug and debug_image is not None:
            debug_path = Path(image_path).with_stem(Path(image_path).stem + "_debug")
            cv2.imwrite(str(debug_path), debug_image)
            logger.info(f"Debug image saved to: {debug_path}")
        
        return extracted_data
    
    def _extract_text(self, image: np.ndarray) -> str:
        if image.size == 0:
            return ""
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        results = self.reader.readtext(thresh)
        
        # bbox, text, conf
        text_parts = [result[1] for result in results]
        return " ".join(text_parts)
    
    def _fix_ocr_miss(self, text: str) -> str:
        replacements = {
            'O': '0',
            'o': '0',
            'l': '1',
            'I': '1',
            'i': '1',
            'S': '5',
            's': '5',
            'B': '8',
            'Z': '2',
            'z': '2',
            'g': '9',
            'q': '9',
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text

    def _parse_date(self, text: str) -> Optional[str]:
        if text == "":
            return None

        digits = re.sub(r'\D', '', text)
        
        if len(digits) >= 8:
            day = int(digits[0:2])
            month = int(digits[2:4])
            year = int(digits[4:8])
        elif len(digits) >= 6:
            day = int(digits[0:2])
            month = int(digits[2:4])
            year = int(digits[4:6])
            year = 2000 + year if year < 30 else 1900 + year
        else:
            return None
        
        return f"{day:02d}-{month:02d}-{year}"
    
    def _parse_amount(self, text: str) -> Optional[int]:
        if text == "":
            return None

        text = self._fix_ocr_miss(text)
        is_positive = '+' in text
        text = re.sub(r'\D', '', text)
        
        return int(text) * (1 if is_positive else -1) if text else None

    # debugging functions
    def process_image(self, image_path: str, output_file: str) -> dict:
        image_path = Path(image_path)
        output_file = Path(output_file)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        data = self.detect(str(image_path))
        data['source_image'] = image_path.name
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        return data

    def process_batch(self, image_folder: str, output_file: str) -> list:
        image_folder = Path(image_folder)
        output_file = Path(output_file)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        
        results = []
        for image_path in image_folder.iterdir():
            if image_path.suffix.lower() in extensions:
                try:
                    data = self.detect(str(image_path))
                    # data['source_image'] = image_path.name
                    results.append(data)
                except Exception as e:
                    logger.error(f"Error processing {image_path.name}: {e}")
            else:
                logger.warning(f"Skipping unsupported file: {image_path.name}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            for item in results:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
        return results


# debugging functions
def image_processing():
    detector = TransactionDetector(
        model_path="AI/DL/models/detector_v8s.pt",
        confidence_threshold=0.3
    )
    
    image_path = "AI\\DL\\money_dts\\money\\z7499764603042_44c88951be6057ba204ba3b963638fd7.jpg"
    output_file = "AI\\DL\\output_single.json"
    
    result = detector.process_image(image_path, output_file)
    print(json.dumps(result, indent=4, ensure_ascii=False))

def batch_processing():
    detector = TransactionDetector(
        model_path="AI/DL/models/detector_v8s.pt",
        confidence_threshold=0.3,
        use_gpu=True
    )
    
    image_folder = "AI/DL/money_dts/money"
    output_file = "AI/DL/output.jsonl"
    
    results = detector.process_batch(image_folder, output_file)
    
    # total = sum(r.get('amount', 0) or 0 for r in results)
    # print(f"Total amount: {total:,}")


def main():
    start = time.time()

    batch_processing()
    
    end = time.time()
    print(f"\nExecution time: {end - start:.2f} seconds")


if __name__ == "__main__":
    main()
