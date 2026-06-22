from ultralytics import YOLO
import easyocr
import cv2
import re

# Load once
model = YOLO("yolov8n.pt")
reader = easyocr.Reader(['en'], gpu=False)

CLASS_MAP = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}


def clean_plate(text):
    text = text.upper()
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text


def extract_plate(vehicle_crop):
    try:
        h = vehicle_crop.shape[0]

        # lower 40% only
        plate_region = vehicle_crop[int(h * 0.6):, :]

        # preprocess
        gray = cv2.cvtColor(plate_region, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2, fy=2)  # upscale 2x
        gray = cv2.GaussianBlur(gray, (3,3), 0)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        results = reader.readtext(thresh)

        best_plate = None
        best_conf = 0

        for (_, text, conf) in results:
            cleaned = clean_plate(text)
            if (len(cleaned) >= 6 and len(cleaned) <= 12 and conf > best_conf):
                best_plate = cleaned
                best_conf = conf

        return best_plate or "UNDETECTED"

    except Exception:
        return "UNDETECTED"


def analyze_video(video_path, latitude, longitude):
    cap = cv2.VideoCapture(video_path)
    detections = []
    frame_count = 0
    
    prev_boxes = []  # boxes from previous sampled frame
    stationary_detections = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if frame_count % 30 != 0:
            continue

        results = model(frame, classes=[2, 3, 5, 7], verbose=False)
        current_boxes = []

        for box in results[0].boxes:
            conf = float(box.conf[0])
            if conf < 0.5:
                continue
            cls = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx, cy = (x1+x2)//2, (y1+y2)//2  # center point
            current_boxes.append((cx, cy, cls, conf, x1, y1, x2, y2))

        # Check which boxes barely moved from previous frame
        for (cx, cy, cls, conf, x1, y1, x2, y2) in current_boxes:
            is_stationary = False
            for (px, py, *_) in prev_boxes:
                dist = ((cx-px)**2 + (cy-py)**2)**0.5
                if dist < 20:  # moved less than 20px across 30 frames = likely parked
                    is_stationary = True
                    break

            if is_stationary or len(prev_boxes) == 0:
                crop = frame[y1:y2, x1:x2]
                plate = extract_plate(crop)

                detections.append({
                    "latitude": latitude,
                    "longitude": longitude,
                    "vehicle_type": CLASS_MAP.get(cls, "unknown"),
                    "license_plate": plate,
                    "confidence": round(conf, 3),
                    "frame": frame_count,
                    "status": "parked_vehicle_detected",  # ← now meaningful
                    "is_stationary": is_stationary
                })

        prev_boxes = current_boxes

        if frame_count >= 90:  # process 3 sampled frames (frame 30, 60, 90)
            break

    cap.release()
    # deduplicate — same plate, same location
    return detections