# Vision-Trak Multi-Camera AI Garbage Truck Detector
import os
import json
try:
    import cv2
except Exception:
    cv2 = None

try:
    import numpy as np
except Exception:
    np = None

try:
    import ncnn
except Exception:
    ncnn = None
import time
import threading
import queue
import socket
import socketserver
from http import server
try:
    from shapely.geometry import Point, Polygon
except Exception:
    Point = None
    Polygon = None
from collections import deque
try:
    import websocket
except Exception:
    websocket = None
import urllib.request
import urllib.error

script_dir = os.path.dirname(os.path.abspath(__file__))

# ==========================================
# WEBSOCKET CONFIGURATION
# ==========================================
def _get_server_url():
    env_url = os.environ.get("DETECTOR_SERVER_URL")
    if env_url:
        return env_url
    tunnel_file = os.path.join(script_dir, "tunnel_be_url.txt")
    if os.path.exists(tunnel_file):
        try:
            with open(tunnel_file, "r") as f:
                url = f.read().strip()
                if url.startswith("http"):
                    return url.replace("https://", "wss://").replace("http://", "ws://") + "/ws"
        except Exception:
            pass
    return "ws://127.0.0.1:8000/ws"

SERVER_URL = _get_server_url()
SNAPSHOT_DIR = os.path.join(script_dir, "snapshots")

_ws = None
_ws_lock = threading.Lock()
_send_queue = queue.Queue()
_last_connect_attempt = 0
_connect_cooldown = 10  # Try to connect at most once every 10 seconds if offline
_last_log_times = {}

# Validate critical dependencies
if cv2 is None or np is None:
    raise RuntimeError(
        "Missing required Python packages: 'opencv-python' and/or 'numpy'.\n"
        "Install with: pip install opencv-python numpy"
    )

# Provide a lightweight fallback for shapely.geometry if not available
def _point_in_polygon(x, y, poly_points):
    # Ray casting algorithm
    inside = False
    n = len(poly_points)
    j = n - 1
    for i in range(n):
        xi, yi = poly_points[i]
        xj, yj = poly_points[j]
        intersect = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi)
        if intersect:
            inside = not inside
        j = i
    return inside

if Point is None or Polygon is None:
    class PointTuple(tuple):
        @property
        def x(self):
            return self[0]
        @property
        def y(self):
            return self[1]

    class FallbackPolygon:
        def __init__(self, points):
            self._points = list(points)
            xs = [p[0] for p in points]
            ys = [p[1] for p in points]
            self._bounds = (min(xs), min(ys), max(xs), max(ys))
        @property
        def bounds(self):
            return self._bounds
        def contains(self, pt):
            if hasattr(pt, 'x') and hasattr(pt, 'y'):
                x, y = pt.x, pt.y
            else:
                x, y = pt[0], pt[1]
            return _point_in_polygon(x, y, self._points)

    Point = lambda x, y: PointTuple((x, y))
    Polygon = FallbackPolygon

# WebSocket client may be optional; if not installed we will only use HTTP fallback
WS_AVAILABLE = websocket is not None


def rate_limit_log(category, message):
    now = time.time()
    last_log = _last_log_times.get(category, 0)
    if now - last_log >= 30:  # log at most once every 30 seconds
        print(message)
        _last_log_times[category] = now


def _get_ws():
    """Get or create a persistent WebSocket connection to the backend."""
    global _ws
    with _ws_lock:
        if _ws is not None:
            try:
                is_connected = getattr(_ws, "connected", False)
                if not is_connected:
                    _ws = None
            except Exception:
                _ws = None

        if _ws is None:
            # Build list of candidate WebSocket URLs to try
            candidates = [SERVER_URL]
            
            # If the primary is not localhost/127.0.0.1
            is_remote = "127.0.0.1" not in SERVER_URL and "localhost" not in SERVER_URL
            
            # Add primary IP with port 8000 if primary is on port 3000
            if ":3000" in SERVER_URL:
                candidates.append(SERVER_URL.replace(":3000", ":8000"))
            
            # Add localhost candidates
            if is_remote:
                candidates.append("ws://127.0.0.1:3000/ws")
                candidates.append("ws://127.0.0.1:8000/ws")
            else:
                # If primary is localhost but on port 3000, add port 8000 candidate
                if ":3000" in SERVER_URL:
                    candidates.append("ws://127.0.0.1:8000/ws")
                elif ":8000" in SERVER_URL:
                    candidates.append("ws://127.0.0.1:3000/ws")

            for url in candidates:
                        if not WS_AVAILABLE:
                            # websocket-client not installed; skip websocket connect
                            continue
                        try:
                            _ws = websocket.create_connection(url, timeout=5.0)
                            print(f"[WS] Connected successfully to: {url}")
                            return _ws
                        except Exception:
                            pass
            
            rate_limit_log(
                "ws_connect_failed",
                f"[WS] Could not connect to any WebSocket servers {candidates}. Will retry in background."
            )
            _ws = None
        return _ws


def http_send(payload):
    """Send payload via HTTP POST as fallback."""
    # Convert ws:// or wss:// to http:// or https:// and /ws to /api/detection/fire
    http_url = SERVER_URL.replace("wss://", "https://").replace("ws://", "http://").replace("/ws", "/api/detection/fire")
    candidates = [http_url]
    
    if ":3000" in http_url:
        candidates.append(http_url.replace(":3000", ":8000"))
        
    is_remote = "127.0.0.1" not in http_url and "localhost" not in http_url
    if is_remote:
        candidates.append("http://127.0.0.1:3000/api/detection/fire")
        candidates.append("http://127.0.0.1:8000/api/detection/fire")
    else:
        if ":3000" in http_url:
            candidates.append("http://127.0.0.1:8000/api/detection/fire")
        elif ":8000" in http_url:
            candidates.append("http://127.0.0.1:3000/api/detection/fire")

    for url in candidates:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=5.0) as response:
                if response.status == 200:
                    print(f"[HTTP] Event sent successfully to {url}")
                    return True
        except Exception:
            pass
            
    rate_limit_log(
        "http_send_failed",
        f"[HTTP] Could not send to any fallbacks {candidates}. Will retry."
    )
    return False


def _send_worker():
    global _ws, _last_connect_attempt
    while True:
        payload = _send_queue.get()
        sent = False
        
        now = time.time()
        ws_connected = False
        if _ws is not None:
            try:
                ws_connected = getattr(_ws, "connected", False)
            except Exception:
                ws_connected = False
                _ws = None

        if not ws_connected:
            if now - _last_connect_attempt >= _connect_cooldown:
                _last_connect_attempt = now
                _ws = _get_ws()
                ws_connected = _ws is not None
            else:
                ws_connected = False

        if ws_connected and _ws is not None:
            try:
                _ws.send(json.dumps(payload))
                sent = True
            except Exception as e:
                rate_limit_log(
                    "ws_send_fail",
                    f"[WS] Send failed, switching to HTTP fallback. Error: {e}"
                )
                _ws = None

        if not sent:
            # Try HTTP fallback
            sent = http_send(payload)

        if not sent:
            # Rate limit retries when offline by sleeping, then put it back at the end of the queue
            time.sleep(2.0)
            _send_queue.put(payload)

        _send_queue.task_done()


# Start background send thread
threading.Thread(target=_send_worker, daemon=True).start()


def ws_send(payload):
    """Queue the JSON payload to be sent to the backend asynchronously."""
    _send_queue.put(payload)
    return True


def save_snapshot(frame, cam_name):
    """Save a frame snapshot and return the relative path."""
    try:
        os.makedirs(SNAPSHOT_DIR, exist_ok=True)
        ts = int(time.time() * 1000)
        safe_name = cam_name.replace(" ", "").replace("-", "")
        filename = f"{safe_name}_{ts}.jpg"
        filepath = os.path.join(SNAPSHOT_DIR, filename)
        cv2.imwrite(filepath, frame)
        return f"snapshots/{filename}"
    except Exception:
        return None


def notify_camera_scan_start(cam_id, cam_name):
    return ws_send({"event_type": "scan_start", "camera_id": int(cam_id), "camera_name": str(cam_name)})


def notify_truck_present(cam_id, cam_name, confidence, image_path=None):
    return ws_send({
        "event_type": "truck_present",
        "camera_id": int(cam_id),
        "camera_name": str(cam_name),
        "confidence": round(float(confidence), 4),
        "image_path": image_path,
    })


def notify_truck_departed(cam_id, cam_name, confidence=0.0):
    return ws_send({
        "event_type": "truck_departed",
        "camera_id": int(cam_id),
        "camera_name": str(cam_name),
        "confidence": round(float(confidence), 4),
    })


def notify_camera_switched(cam_id, cam_name):
    return ws_send({"event_type": "camera_switched", "camera_id": int(cam_id), "camera_name": str(cam_name)})

# ==========================================
# 1. THREADED CAMERA CAPTURE WORKER
# ==========================================
class ThreadedCamera:
    """
    Spins up a dedicated background thread to continuously pull frames
    from a video source (local file, webcam index, or IP RTSP stream).
    Optimized with adjustable frame-skipping (FRAME_SKIP) inside the decoding thread.
    """
    def __init__(self, name, source, frame_skip=3):
        self.name = name
        
        # If source is digit or int (e.g. 0 or "0"), parse as int for OpenCV webcam device
        if isinstance(source, int):
            self.source = source
        elif isinstance(source, str) and source.strip().isdigit():
            self.source = int(source.strip())
        elif isinstance(source, str) and not (source.lower().startswith("rtsp") or source.lower().startswith("http") or os.path.isabs(source)):
            candidate = os.path.join(script_dir, source)
            self.source = candidate if os.path.exists(candidate) else source
        else:
            self.source = source

        self.frame_skip = frame_skip
        self.is_stream = isinstance(self.source, str) and ("rtsp" in str(self.source).lower() or "http" in str(self.source).lower())
        self.is_cam_device = isinstance(self.source, int)
        
        try:
            self.cap = cv2.VideoCapture(self.source)
        except Exception:
            self.cap = None

        self.ret = False
        self.frame = None
        self.frame_id = 0
        self.running = True
        self.active = False  # Controlled dynamically by the main routing loop
        
        fps = self.cap.get(cv2.CAP_PROP_FPS) if (self.cap and self.cap.isOpened()) else 30
        self.frame_delay = (1.0 / fps) * self.frame_skip if (fps and fps > 0) else 0.033 * self.frame_skip
        
        self.thread = threading.Thread(target=self.update, args=(), daemon=True)
        self.thread.start()

    def _generate_placeholder(self):
        img = np.zeros((720, 1280, 3), dtype=np.uint8)
        img[:] = (35, 30, 25)
        cv2.rectangle(img, (20, 20), (1260, 700), (60, 50, 40), 2)
        cv2.putText(img, f"CAMERA: {self.name}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
        cv2.putText(img, f"Source: {self.source} (Waiting for stream / video file)", (50, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)
        cv2.putText(img, f"Status: Active Scanning | Time: {time.strftime('%H:%M:%S')}", (50, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 220, 0), 2)
        cv2.putText(img, "Tip: Use webcam with source=0 or place video files (.mp4) in folder", (50, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 220, 255), 2)
        return img

    def update(self):
        last_placeholder_time = 0
        while self.running:
            if self.cap is not None and self.cap.isOpened():
                if self.active:
                    if self.frame_skip > 1:
                        for _ in range(self.frame_skip - 1):
                            self.cap.grab()
                            
                    ret, frame = self.cap.read()
                    if ret and frame is not None:
                        self.ret = ret
                        self.frame = frame
                        self.frame_id += 1
                        if not self.is_stream and not self.is_cam_device:
                            time.sleep(self.frame_delay)
                        elif self.is_cam_device:
                            time.sleep(0.01)
                    else:
                        if not self.is_stream and not self.is_cam_device:
                            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            time.sleep(0.01)
                        else:
                            self.ret = False
                            time.sleep(2.0)
                            self.reconnect()
                else:
                    self.ret = False
                    self.frame = None
                    time.sleep(0.1)
            else:
                if self.active:
                    now = time.time()
                    if now - last_placeholder_time >= 0.1:
                        self.frame = self._generate_placeholder()
                        self.ret = True
                        self.frame_id += 1
                        last_placeholder_time = now
                    time.sleep(0.05)
                else:
                    self.ret = False
                    self.frame = None
                    time.sleep(0.2)
                
                # Retry reconnecting occasionally
                if int(time.time()) % 10 == 0:
                    self.reconnect()

    def reconnect(self):
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
        try:
            self.cap = cv2.VideoCapture(self.source)
        except Exception:
            self.cap = None
        time.sleep(1.0)

    def get_frame(self):
        return self.ret, self.frame

    def stop(self):
        self.running = False
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass

# ==========================================
# 2. SETUP: NCNN MODEL & PATHS
# ==========================================
param_path = os.path.join(script_dir, "yolov8n_ncnn_model", "model.ncnn.param")
bin_path = os.path.join(script_dir, "yolov8n_ncnn_model", "model.ncnn.bin")

if not os.path.exists(param_path) or not os.path.exists(bin_path):
    raise FileNotFoundError("Please make sure your model.ncnn.param and model.ncnn.bin exist in 'yolov8n_ncnn_model' directory.")

print("Initializing Raw NCNN Net...")
net = ncnn.Net()

# Configure NCNN to utilize multiple CPU threads on the Pi 5
net.opt.num_threads = 4
net.opt.use_packing_layout = True
net.opt.use_bf16_storage = True
net.opt.lightmode = True

# Auto-detect Vulkan GPU acceleration
if hasattr(ncnn, 'build_with_vulkan') and ncnn.build_with_vulkan():
    net.opt.use_vulkan_compute = True
    print("[OK] NCNN built with Vulkan — GPU acceleration enabled")
else:
    print("[INFO] NCNN built without Vulkan — using CPU (fast enough on Pi 5)")

net.load_param(param_path)
net.load_model(bin_path)

# ==========================================
# 3. TRACKING & SMOOTHING MODULE
# ==========================================
class BoundingBoxTracker:
    """
    [Inference] Tracks detected objects across frames using IoU overlap
    and smooths coordinate transitions over time using Exponential Moving Average (EMA).
    """
    def __init__(self, alpha=0.35, max_missing_frames=12):
        self.alpha = alpha  # Smoothing coefficient (lower means smoother but slower response)
        self.max_missing_frames = max_missing_frames
        # List of tracked targets: {"box": [x1, y1, x2, y2], "score": float, "missing_count": int}
        self.targets = []

    def compute_iou(self, box_a, box_b):
        x_left = max(box_a[0], box_b[0])
        y_top = max(box_a[1], box_b[1])
        x_right = min(box_a[2], box_b[2])
        y_bottom = min(box_a[3], box_b[3])

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
        union_area = float(area_a + area_b - intersection_area)

        return intersection_area / union_area if union_area > 0 else 0.0

    def update(self, detections):
        updated_targets = []
        
        # Attempt to associate incoming detections with existing tracked targets
        for det_box, det_score in detections:
            best_iou = 0.0
            best_idx = -1
            
            for idx, target in enumerate(self.targets):
                iou = self.compute_iou(det_box, target["box"])
                if iou > best_iou:
                    best_iou = iou
                    best_idx = idx
            
            # If a match is found with significant overlap, smooth coordinates
            if best_iou > 0.35:
                matched_target = self.targets[best_idx]
                smoothed_box = [
                    self.alpha * det_box[i] + (1 - self.alpha) * matched_target["box"][i]
                    for i in range(4)
                ]
                updated_targets.append({
                    "box": smoothed_box,
                    "score": det_score,
                    "missing_count": 0
                })
                self.targets.pop(best_idx)
            else:
                # Register as a new tracked target
                updated_targets.append({
                    "box": list(det_box),
                    "score": det_score,
                    "missing_count": 0
                })
                
        # Keep old targets that failed to match, incrementing their miss counter
        for remaining_target in self.targets:
            if remaining_target["missing_count"] < self.max_missing_frames:
                remaining_target["missing_count"] += 1
                updated_targets.append(remaining_target)
                
        self.targets = updated_targets
        # Only return active targets to help minimize ghosting
        return [t for t in self.targets if t["missing_count"] < 3]

# ==========================================
# 4. CAMERA CONFIGURATIONS & SYSTEM STATE
# ==========================================
# Class 0 corresponds to "garbage_truck" in the trained custom YOLOv8 model.
TARGET_CLASS_ID = 0  

# [Inference] [Unverified] Testing with local video file sources.
# Here we map all three camera channels to the same local "04.mp4" file, 
# but configure distinct, independent ROI coordinates for each virtual camera.
# In production, replace self.source strings with RTSP IP camera links: "rtsp://..."
camera_configs = [
    {
        "id": 1,
        "name": "Cam 1 - Delivery Area",
        "source": "04.mp4",  # Mapped to video source file
        "roi_coords": [(6, 370), (912, 303), (927, 1066), (6, 1074)],  # ROI specific to Cam 1
        "tracker": BoundingBoxTracker(alpha=0.35, max_missing_frames=12),
        "truck_in_zone": False,
        "consecutive_present": 0,
        "consecutive_missing": 0,
        "scaled_roi_coords": None,
        "roi_polygon": None,
        "roi_min_x": None, "roi_min_y": None, "roi_max_x": None, "roi_max_y": None,
        "scale_x": None, "scale_y": None,
        "reader": None,
        # Performance optimization tracking variables
        "prev_roi_gray": None,
        "last_inference_time": 0.0,
        "last_raw_detections": []
    },
    {
        "id": 2,
        "name": "Cam 2 - Side Loading",
        "source": "02.mp4",  # Mapped to video source file
        "roi_coords": [(100, 400), (800, 350), (850, 950), (80, 980)],  # ROI specific to Cam 2
        "tracker": BoundingBoxTracker(alpha=0.35, max_missing_frames=12),
        "truck_in_zone": False,
        "consecutive_present": 0,
        "consecutive_missing": 0,
        "scaled_roi_coords": None,
        "roi_polygon": None,
        "roi_min_x": None, "roi_min_y": None, "roi_max_x": None, "roi_max_y": None,
        "scale_x": None, "scale_y": None,
        "reader": None,
        # Performance optimization tracking variables
        "prev_roi_gray": None,
        "last_inference_time": 0.0,
        "last_raw_detections": []
    },
    {
        "id": 3,
        "name": "Cam 3 - BackBay Area",
        "source": "03.mp4",  # Mapped to video source file
        "roi_coords": [(1141, 193), (1563, 195), (1539, 417), (1327, 564), (1050, 502)],  # ROI specific to Cam 1
        "tracker": BoundingBoxTracker(alpha=0.35, max_missing_frames=12),
        "truck_in_zone": False,
        "consecutive_present": 0,
        "consecutive_missing": 0,
        "scaled_roi_coords": None,
        "roi_polygon": None,
        "roi_min_x": None, "roi_min_y": None, "roi_max_x": None, "roi_max_y": None,
        "scale_x": None, "scale_y": None,
        "reader": None,
        # Performance optimization tracking variables
        "prev_roi_gray": None,
        "last_inference_time": 0.0,
        "last_raw_detections": []
    }
]

# --- DEBOUNCE STATE MACHINE THRESHOLDS ---
# Calibrated for responsive detection (~1.2s confirm / ~1.5s depart)
REQUIRED_PRESENT = 12   # Frames to confirm truck in zone
REQUIRED_MISSING = 15   # Frames to confirm truck left


# --- TIMING CONFIGURATIONS ---
SCAN_DURATION = 1.0  # Seconds per camera before switching (9 cameras = 9s full cycle)

# --- PERFORMANCE CONFIGURATIONS ---
INPUT_SIZE = 640

# --- DECODER FRAME SKIP (Optimized directly inside ThreadedCamera worker) ---
FRAME_SKIP = 2  # Retrieve and decode 1 out of every N frames in active channels

# --- MOTION DETECTION PRE-FILTER ---
MOTION_THRESHOLD = 15       # Minimum pixel change value (0-255)
MOTION_AREA_PERCENT = 1.5   # % of ROI pixels that must change to trigger NCNN

# --- TEMPORAL PACING ---
INFERENCE_INTERVAL = 0.1    # Max ~10 NCNN inferences per second per camera stream

# --- THRESHOLDS ---
CONF_THRESHOLD = 0.25
NMS_THRESHOLD = 0.45

# Unified display rendering sizes
DISPLAY_W = 1280
DISPLAY_H = 720

# Initialize reader threads with frame skip configured
for cam in camera_configs:
    if cam.get("reader") is None:
        cam["reader"] = ThreadedCamera(cam["name"], cam["source"], frame_skip=FRAME_SKIP)

# ==========================================
# 5. HELPER FUNCTIONS: PRE-PROCESSING & POST-PROCESSING
# ==========================================
def letterbox(img, new_shape=(640, 640), color=(114, 114, 114)):
    """
    [Inference] Resizes image to a target shape while maintaining
    aspect ratio, adding neutral borders where necessary to help avoid squishing distortion.
    """
    shape = img.shape[:2]  # Current shape [height, width]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    # Scale factor (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

    # Compute padding
    new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]

    dw /= 2.0  # Divide padding into equal parts for both sides
    dh /= 2.0

    if shape[::-1] != new_unpad:  # Resize
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
    
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    
    img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return img, r, (left, top)

def nms(boxes, scores, iou_threshold):
    """
    Simple Non-Maximum Suppression algorithm.
    """
    if len(boxes) == 0:
        return []
    
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    
    order = scores.argsort()[::-1]
    keep = []
    
    while order.size > 0:
        if order.size == 1:
            keep.append(order[0])
            break
        i = order[0]
        keep.append(i)
        
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        
        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= iou_threshold)[0]
        order = order[inds + 1]
    
    return keep

def decode_yolov8_output(output_tensor, scale_ratio, pad_left, pad_top, orig_w, orig_h):
    """
    Decodes the raw NCNN output tensor using highly optimized, vectorized NumPy operations.
    YOLOv8 typically outputs a tensor of shape (1, 4 + num_classes, 8400).
    Maps coordinates back to display resolution by compensating for letterbox scaling and padding.
    """
    data = np.array(output_tensor)
    
    # Squeeze out batch dimension if present
    if len(data.shape) == 3:
        data = data[0]  
    
    # [Inference] OPTIMIZATION: Dynamically adjust shape orientation.
    if data.shape[0] < data.shape[1]:
        data = data.T  
    
    num_classes = data.shape[1] - 4
    
    # Safely map target class index
    target_class = TARGET_CLASS_ID
    if target_class >= num_classes:
        # Fallback to class 0 if configured target index is out of bounds
        target_class = 0

    # Extract class scores vector
    class_scores = data[:, 4 + target_class]
    
    # Filter indices matching confidence threshold using vector operations
    keep_indices = np.where(class_scores > CONF_THRESHOLD)[0]
    
    if len(keep_indices) == 0:
        return [], []
        
    filtered_data = data[keep_indices]
    filtered_scores = class_scores[keep_indices]
    
    # Vectorized bounding box parameter extraction (center-x, center-y, width, height)
    cx = filtered_data[:, 0]
    cy = filtered_data[:, 1]
    w = filtered_data[:, 2]
    h = filtered_data[:, 3]
    
    # Map coordinates back to original frame size by subtracting padding and dividing by scale ratio
    x_min = (cx - w / 2 - pad_left) / scale_ratio
    y_min = (cy - h / 2 - pad_top) / scale_ratio
    x_max = (cx + w / 2 - pad_left) / scale_ratio
    y_max = (cy + h / 2 - pad_top) / scale_ratio
    
    # Clip coordinates to original resolution boundaries to help avoid coordinate leakages
    x_min = np.clip(x_min, 0, orig_w)
    y_min = np.clip(y_min, 0, orig_h)
    x_max = np.clip(x_max, 0, orig_w)
    y_max = np.clip(y_max, 0, orig_h)
    
    # Stack coordinates together into [x_min, y_min, x_max, y_max] format
    boxes = np.stack([x_min, y_min, x_max, y_max], axis=-1)
    
    # Apply NMS to remove overlapping predictions
    keep_nms = nms(boxes, filtered_scores, NMS_THRESHOLD)
    
    return boxes[keep_nms], filtered_scores[keep_nms]

def detect_motion_in_roi(frame, cam):
    min_x, min_y = int(cam["roi_min_x"]), int(cam["roi_min_y"])
    max_x, max_y = int(cam["roi_max_x"]), int(cam["roi_max_y"])
    
    h, w = frame.shape[:2]
    min_x = max(0, min_x)
    min_y = max(0, min_y)
    max_x = min(w, max_x)
    max_y = min(h, max_y)
    
    if max_x <= min_x or max_y <= min_y:
        return True
        
    crop = frame[min_y:max_y, min_x:max_x]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    roi_gray = cv2.bitwise_and(gray, gray, mask=cam["roi_mask"])
    
    if cam["prev_roi_gray"] is None or cam["prev_roi_gray"].shape != roi_gray.shape:
        cam["prev_roi_gray"] = roi_gray
        return True
        
    frame_diff = cv2.absdiff(roi_gray, cam["prev_roi_gray"])
    _, thresh = cv2.threshold(frame_diff, MOTION_THRESHOLD, 255, cv2.THRESH_BINARY)
    
    non_zero_count = cv2.countNonZero(thresh)
    change_percentage = (non_zero_count / cam["roi_area_pixels"]) * 100
    cam["prev_roi_gray"] = roi_gray
    
    return change_percentage > MOTION_AREA_PERCENT

# ==========================================
# 6. INFERENCE WORKER (multi-core offload)
# ==========================================
def _inference_worker(configs, q, pending, stop_event):
    """Runs NCNN on a background thread so the main loop isn't blocked on inference."""
    while not stop_event.is_set():
        try:
            cam_idx, raw_frame = q.get(timeout=0.5)
        except queue.Empty:
            continue
        cam = configs[cam_idx]
        orig_h, orig_w = raw_frame.shape[:2]

        try:
            letterboxed_img, scale_ratio, (pad_left, pad_top) = letterbox(raw_frame, (INPUT_SIZE, INPUT_SIZE))
            rgb_img = cv2.cvtColor(letterboxed_img, cv2.COLOR_BGR2RGB)
            mat_in = ncnn.Mat.from_pixels(rgb_img.tobytes(), ncnn.Mat.PixelType.PIXEL_RGB, INPUT_SIZE, INPUT_SIZE)
            mean_vals = [0.0, 0.0, 0.0]
            norm_vals = [1/255.0, 1/255.0, 1/255.0]
            mat_in.substract_mean_normalize(mean_vals, norm_vals)
            ex = net.create_extractor()
            ex.input("in0", mat_in)
            ret_code, mat_out = ex.extract("out0")
            if ret_code == 0:
                raw_boxes, raw_scores = decode_yolov8_output(mat_out, scale_ratio, pad_left, pad_top, orig_w, orig_h)
                raw_detections = []
                for box, score in zip(raw_boxes, raw_scores):
                    x_min, y_min, x_max, y_max = box
                    center_x_disp = ((x_min + x_max) / 2) * cam["scale_x"]
                    bottom_y_disp = y_max * cam["scale_y"]
                    if cam["roi_min_x"] <= center_x_disp <= cam["roi_max_x"] and cam["roi_min_y"] <= bottom_y_disp <= cam["roi_max_y"]:
                        truck_point = Point(center_x_disp, bottom_y_disp)
                        if cam["roi_polygon"].contains(truck_point):
                            raw_detections.append((box, score))
                cam["last_raw_detections"] = raw_detections
                cam["last_inference_time"] = time.time()
        except Exception:
            pass
        finally:
            pending[cam_idx] = False

# ==========================================
# 7. ROUTING MONITORING LOOP
# ==========================================
print("Running multi-camera monitoring system using raw NCNN inference...")

# ==========================================
# 8. MJPEG STREAMER (headless HTTP display)
# ==========================================
class MJPEGStreamer:
    """Serves processed frames as an MJPEG HTTP stream, replacing cv2.imshow."""
    def __init__(self, camera_configs, shared_state, host='0.0.0.0', port=8080):
        self.frame = None
        self.lock = threading.Lock()
        self.event = threading.Event()
        self._host = host
        self._port = port
        self._stopped = False
        self.server = None
        self._configs = camera_configs
        self._state = shared_state

    def start(self):
        ref = self
        class Handler(server.BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/stream':
                    self._serve_stream()
                elif self.path in ('/status', '/api/status'):
                    self._serve_status()
                elif self.path in ('/', '/dashboard'):
                    self._serve_dashboard()
                else:
                    self.send_response(404)
                    self.end_headers()
            def _serve_stream(self):
                self.send_response(200)
                self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.end_headers()
                try:
                    last_sent = None
                    while not ref._stopped:
                        data = None
                        with ref.lock:
                            data = ref.frame
                        if data is not None and data != last_sent:
                            last_sent = data
                            self.wfile.write(b'--frame\r\n')
                            self.wfile.write(b'Content-Type: image/jpeg\r\n')
                            self.wfile.write(f'Content-Length: {len(data)}\r\n'.encode())
                            self.wfile.write(b'\r\n')
                            self.wfile.write(data)
                            self.wfile.write(b'\r\n')
                        time.sleep(0.033)
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                    pass
            def _serve_status(self):
                s = ref._state
                active_idx = s.get("active_idx", 0)
                focused_idx = s.get("focused_idx", None)
                configs = ref._configs
                rows = []
                for i, cam in enumerate(configs):
                    rows.append({
                        "index": i,
                        "name": cam["name"],
                        "active": i == active_idx,
                        "locked": focused_idx is not None and focused_idx == i,
                        "truck_in_zone": cam.get("truck_in_zone", False),
                        "consecutive_present": cam.get("consecutive_present", 0),
                        "consecutive_missing": cam.get("consecutive_missing", 0),
                        "has_motion": cam.get("has_motion", False),
                    })
                payload = json.dumps({
                    "fps": round(s.get("fps", 0), 1),
                    "active_idx": active_idx,
                    "focused_idx": focused_idx,
                    "cameras": rows
                })
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(payload.encode())
            def _serve_dashboard(self):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.end_headers()
                dashboard_path = os.path.join(script_dir, 'dashboard.html')
                try:
                    with open(dashboard_path, 'rb') as f:
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    self.wfile.write(b'<h1>dashboard.html not found</h1>')
            def log_message(self, format, *args):
                pass

        class Pool(socketserver.ThreadingMixIn, server.HTTPServer):
            allow_reuse_address = True
            daemon_threads = True

        self.server = Pool((self._host, self._port), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

        # Detect the Pi's LAN IP so the user can open it in a browser
        ips = []
        try:
            # Method 1: connect to a remote address to learn our default route IP
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.settimeout(1)
                s.connect(('8.8.8.8', 80))
                ips.append(s.getsockname()[0])
        except:
            pass
        if not ips:
            try:
                # Method 2: query hostname addresses
                for info in socket.getaddrinfo(socket.gethostname(), None):
                    ip = info[4][0]
                    if info[0] == socket.AF_INET and not ip.startswith('127.'):
                        ips.append(ip)
            except:
                pass
        if not ips:
            ips = ['<unknown>']

        print(f"\n{'='*50}")
        print(f"  STREAM READY — open in browser:")
        for ip in ips:
            print(f"  http://{ip}:{self._port}/")
        print(f"{'='*50}\n")

    def update(self, frame_bgr):
        _, jpeg = cv2.imencode('.jpg', frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 55])
        with self.lock:
            self.frame = jpeg.tobytes()
        self.event.set()

    def _wait_frame(self):
        while not self._stopped:
            if self.event.wait(timeout=1.0):
                self.event.clear()
                with self.lock:
                    return self.frame
        return None

    def stop(self):
        self._stopped = True
        self.event.set()
        if self.server:
            self.server.shutdown()

def _main():
    import argparse
    parser = argparse.ArgumentParser(description="Multi-camera Garbage Truck Detector")
    parser.add_argument("--backend", type=str, default=None, help="Central Backend URL (e.g. https://xxx.trycloudflare.com or http://ip:8000)")
    parser.add_argument("--source", type=str, default=None, help="Global camera source (e.g. 0 for webcam, or video file / RTSP URL)")
    parser.add_argument("--webcam", action="store_true", help="Use local webcam (device 0) for all cameras")
    parser.add_argument("--cam1", type=str, default=None, help="Camera 1 source override")
    parser.add_argument("--cam2", type=str, default=None, help="Camera 2 source override")
    parser.add_argument("--cam3", type=str, default=None, help="Camera 3 source override")
    args, _ = parser.parse_known_args()

    global SERVER_URL
    if args.backend:
        url = args.backend.strip()
        if url.startswith("http"):
            SERVER_URL = url.replace("https://", "wss://").replace("http://", "ws://").rstrip("/") + "/ws"
        else:
            SERVER_URL = url
        print(f"[CONFIG] Backend Event URL set to: {SERVER_URL}")


    for i, cam in enumerate(camera_configs):
        override = None
        if args.webcam:
            override = 0
        elif args.source is not None:
            override = args.source
        elif i == 0 and args.cam1:
            override = args.cam1
        elif i == 1 and args.cam2:
            override = args.cam2
        elif i == 2 and args.cam3:
            override = args.cam3

        if override is not None:
            cam["source"] = override
            if cam.get("reader") is not None:
                cam["reader"].stop()
            cam["reader"] = ThreadedCamera(cam["name"], cam["source"], frame_skip=FRAME_SKIP)
        elif cam.get("reader") is None:
            cam["reader"] = ThreadedCamera(cam["name"], cam["source"], frame_skip=FRAME_SKIP)

    active_idx = 0
    focused_idx = None
    shared_state = {"active_idx": active_idx, "focused_idx": focused_idx, "fps": 0.0}
    last_cam_idx = -1
    cam_switch_time = time.time()
    first_frame_diagnostic = True

    streamer = MJPEGStreamer(camera_configs, shared_state)
    streamer.start()

    # Inference offload queue + worker thread
    inference_queue = queue.Queue()
    inference_pending = [False] * len(camera_configs)
    inference_stop = threading.Event()
    inference_thread = threading.Thread(
        target=_inference_worker,
        args=(camera_configs, inference_queue, inference_pending, inference_stop),
        daemon=True
    )
    inference_thread.start()

    # [Inference] [Unverified] Stores the last 30 frames for a stable FPS reading
    fps_history = deque(maxlen=15)
    fps = 0.0
    last_stream_time = None
    last_frame_ids = {}

    try:
        while True:
            # Determine current camera index to process
            current_idx = active_idx if focused_idx is None else focused_idx
            cam = camera_configs[current_idx]
            
            # [Inference] Set active state flag dynamically on background reader threads.
            # This keeps the active stream fully running while throttling the idle streams.
            for idx, c in enumerate(camera_configs):
                if c["reader"] is not None:
                    c["reader"].active = (idx == current_idx)
            
            ret, raw_frame = cam["reader"].get_frame()
            if not ret or raw_frame is None:
                time.sleep(0.01)
                continue
                
            current_frame_id = cam["reader"].frame_id
            is_new_frame = current_frame_id != last_frame_ids.get(current_idx, -1)
            last_frame_ids[current_idx] = current_frame_id
            
            if cam["roi_polygon"] is None:
                orig_h, orig_w = raw_frame.shape[:2]
                cam["scale_x"] = DISPLAY_W / orig_w if orig_w > 0 else 1.0
                cam["scale_y"] = DISPLAY_H / orig_h if orig_h > 0 else 1.0
                scaled_roi = [(int(x * cam["scale_x"]), int(y * cam["scale_y"])) for x, y in cam["roi_coords"]]
                cam["scaled_roi_coords"] = scaled_roi
                cam["roi_polygon"] = Polygon(scaled_roi)
                cam["roi_min_x"], cam["roi_min_y"], cam["roi_max_x"], cam["roi_max_y"] = cam["roi_polygon"].bounds
                _mx1, _my1 = int(cam["roi_min_x"]), int(cam["roi_min_y"])
                _mx2, _my2 = int(cam["roi_max_x"]), int(cam["roi_max_y"])
                _mx1, _my1 = max(0, _mx1), max(0, _my1)
                _mx2, _my2 = min(DISPLAY_W, _mx2), min(DISPLAY_H, _my2)
                if _mx2 > _mx1 and _my2 > _my1:
                    _local_pts = np.array([(pt[0] - _mx1, pt[1] - _my1) for pt in cam["scaled_roi_coords"]], np.int32)
                    _mask = np.zeros((_my2 - _my1, _mx2 - _mx1), dtype=np.uint8)
                    cv2.fillPoly(_mask, [_local_pts], 255)
                    cam["roi_mask"] = _mask
                    cam["roi_area_pixels"] = cv2.countNonZero(_mask)
                else:
                    cam["roi_mask"] = None
                    cam["roi_area_pixels"] = 1
                
            if last_cam_idx != current_idx:
                cam_switch_time = time.time()
                last_cam_idx = current_idx
                cam["tracker"].targets.clear()
                notify_camera_scan_start(cam["id"], cam["name"])
                
            if is_new_frame:
                frame = cv2.resize(raw_frame, (DISPLAY_W, DISPLAY_H))
                orig_h, orig_w = raw_frame.shape[:2]
                current_time_sec = time.time()
                time_since_last_inf = current_time_sec - cam["last_inference_time"]
                run_ncnn = False
                has_motion = True
                cam["has_motion"] = True
                if time_since_last_inf >= INFERENCE_INTERVAL:
                    has_motion = detect_motion_in_roi(frame, cam)
                    cam["has_motion"] = has_motion
                    if has_motion:
                        run_ncnn = True
                    else:
                        raw_detections = cam["last_raw_detections"]
                else:
                    raw_detections = cam["last_raw_detections"]
                    has_motion = len(raw_detections) > 0
                    cam["has_motion"] = has_motion
                if run_ncnn:
                    if first_frame_diagnostic:
                        # First inference runs synchronously to print model diagnostic
                        letterboxed_img, scale_ratio, (pad_left, pad_top) = letterbox(raw_frame, (INPUT_SIZE, INPUT_SIZE))
                        rgb_img = cv2.cvtColor(letterboxed_img, cv2.COLOR_BGR2RGB)
                        mat_in = ncnn.Mat.from_pixels(rgb_img.tobytes(), ncnn.Mat.PixelType.PIXEL_RGB, INPUT_SIZE, INPUT_SIZE)
                        mean_vals = [0.0, 0.0, 0.0]
                        norm_vals = [1/255.0, 1/255.0, 1/255.0]
                        mat_in.substract_mean_normalize(mean_vals, norm_vals)
                        ex = net.create_extractor()
                        ex.input("in0", mat_in)
                        ret_code, mat_out = ex.extract("out0")
                        print("\n--- NCNN MODEL DIAGNOSTIC ---")
                        pipes_used = getattr(net.opt, 'use_vulkan_compute', False)
                        gpu_count = getattr(ncnn, 'get_gpu_count', lambda: 0)()
                        if pipes_used and gpu_count > 0:
                            print(f"[Vulkan] GPU count: {gpu_count} — compute active")
                        elif pipes_used and gpu_count == 0:
                            print("[Vulkan] Flag set but no Vulkan devices found — running on CPU")
                        else:
                            print("[Vulkan] GPU acceleration disabled — running on CPU")
                        print(f"Extraction ret_code: {ret_code} (0 means success)")
                        if ret_code != 0:
                            print("[WARNING] Extraction failed!")
                        print(f"Output Mat shape -> Channels: {mat_out.c}, Height: {mat_out.h}, Width: {mat_out.w}")
                        raw_shape = np.array(mat_out).shape
                        print(f"Numpy representation shape: {raw_shape}")
                        print("-----------------------------\n")
                        first_frame_diagnostic = False
                        if ret_code == 0:
                            raw_boxes, raw_scores = decode_yolov8_output(mat_out, scale_ratio, pad_left, pad_top, orig_w, orig_h)
                            raw_detections = []
                            for box, score in zip(raw_boxes, raw_scores):
                                x_min, y_min, x_max, y_max = box
                                center_x_disp = ((x_min + x_max) / 2) * cam["scale_x"]
                                bottom_y_disp = y_max * cam["scale_y"]
                                if cam["roi_min_x"] <= center_x_disp <= cam["roi_max_x"] and cam["roi_min_y"] <= bottom_y_disp <= cam["roi_max_y"]:
                                    truck_point = Point(center_x_disp, bottom_y_disp)
                                    if cam["roi_polygon"].contains(truck_point):
                                        raw_detections.append((box, score))
                            cam["last_raw_detections"] = raw_detections
                            cam["last_inference_time"] = current_time_sec
                        else:
                            raw_detections = cam["last_raw_detections"]
                    else:
                        # Offload to background worker — use last known detections
                        if not inference_pending[current_idx]:
                            inference_pending[current_idx] = True
                            inference_queue.put((current_idx, raw_frame))
                        raw_detections = cam["last_raw_detections"]
                        
                tracked_trucks = cam["tracker"].update(raw_detections)
                truck_in_zone_this_frame = False
                detected_trucks = []
                for t in tracked_trucks:
                    x_min, y_min, x_max, y_max = t["box"]
                    score = t["score"]
                    x_min_disp = x_min * cam["scale_x"]
                    y_min_disp = y_min * cam["scale_y"]
                    x_max_disp = x_max * cam["scale_x"]
                    y_max_disp = y_max * cam["scale_y"]
                    center_x = (x_min_disp + x_max_disp) / 2
                    bottom_y = y_max_disp
                    if cam["roi_min_x"] <= center_x <= cam["roi_max_x"] and cam["roi_min_y"] <= bottom_y <= cam["roi_max_y"]:
                        truck_point = Point(center_x, bottom_y)
                        is_inside = cam["roi_polygon"].contains(truck_point)
                    else:
                        is_inside = False
                    if is_inside:
                        truck_in_zone_this_frame = True
                        box_color = (0, 255, 0)
                    else:
                        box_color = (0, 165, 255)
                    detected_trucks.append({
                        "box": [int(x_min_disp), int(y_min_disp), int(x_max_disp), int(y_max_disp)],
                        "anchor": (int(center_x), int(bottom_y)),
                        "color": box_color,
                        "score": score
                    })
                    
                if truck_in_zone_this_frame:
                    if cam["consecutive_present"] < REQUIRED_PRESENT:
                        cam["consecutive_present"] += 1
                    cam["consecutive_missing"] = 0
                else:
                    if cam["consecutive_missing"] < REQUIRED_MISSING:
                        cam["consecutive_missing"] += 1
                    cam["consecutive_present"] = max(0, cam["consecutive_present"] - 1)

                    
                if not cam["truck_in_zone"]:
                    if cam["consecutive_present"] >= REQUIRED_PRESENT:
                        best_conf = max((t["score"] for t in detected_trucks), default=0.0)
                        snap_path = save_snapshot(frame, cam["name"])
                        print(f"\n[!] TRUCK DETECTED - Locking focus on: {cam['name']} (Confirmed across {REQUIRED_PRESENT} frames, conf={best_conf:.2f})")
                        notify_truck_present(cam["id"], cam["name"], best_conf, snap_path)
                        cam["truck_in_zone"] = True
                        focused_idx = current_idx
                        shared_state["focused_idx"] = focused_idx
                else:
                    if cam["consecutive_missing"] >= REQUIRED_MISSING:
                        last_conf = max((t["score"] for t in detected_trucks), default=0.0)
                        print(f"\n[-] TRUCK DEPARTED - Unlocking focus from: {cam['name']} (Confirmed missing across {REQUIRED_MISSING} frames)")
                        notify_truck_departed(cam["id"], cam["name"], last_conf)
                        cam["truck_in_zone"] = False
                        cam["consecutive_missing"] = 0
                        focused_idx = None
                        shared_state["focused_idx"] = focused_idx
                        active_idx = (current_idx + 1) % len(camera_configs)
                        shared_state["active_idx"] = active_idx
                        
                if focused_idx is None:
                    if time.time() - cam_switch_time >= SCAN_DURATION:
                        if has_motion or truck_in_zone_this_frame or cam["consecutive_present"] > 0:
                            cam_switch_time = time.time()
                        else:
                            prev_idx = active_idx
                            active_idx = (active_idx + 1) % len(camera_configs)
                            shared_state["active_idx"] = active_idx
                            if active_idx != prev_idx:
                                notify_camera_switched(prev_idx, camera_configs[prev_idx]["name"])
            else:
                time.sleep(0.001)
            
            # E. RENDERING VISUALS
            for t in detected_trucks:
                x1, y1, x2, y2 = t["box"]
                cv2.rectangle(frame, (x1, y1), (x2, y2), t["color"], 3)
                cv2.circle(frame, t["anchor"], 10, (0, 0, 255), -1)
                cv2.putText(frame, f"Truck: {t['score']:.2f}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, t["color"], 2)
                
            cv2_pts = np.array(cam["scaled_roi_coords"], np.int32)
            roi_color = (0, 0, 255) if cam["consecutive_missing"] > 0 else (0, 255, 0) if cam["truck_in_zone"] else (0, 0, 255)
            cv2.polylines(frame, [cv2_pts], isClosed=True, color=roi_color, thickness=4)
            
            status_label = f"LOCKED - {cam['name']}" if focused_idx is not None else f"SCANNING - {cam['name']}"
            status_color = (0, 255, 0) if focused_idx is not None else (0, 255, 255)
            
            if cam["consecutive_missing"] > 0:
                truck_label = f"Truck: AWAY ({cam['consecutive_missing']}/{REQUIRED_MISSING})"
                truck_color = (0, 0, 255)
            elif cam["truck_in_zone"]:
                truck_label = "Truck: CONFIRMED"
                truck_color = (0, 255, 0)
            elif cam["consecutive_present"] > 0:
                truck_label = f"Truck: DETECTED ({cam['consecutive_present']}/{REQUIRED_PRESENT})"
                truck_color = (0, 255, 255)
            else:
                truck_label = f"Truck: AWAY ({cam['consecutive_missing']}/{REQUIRED_MISSING})"
                truck_color = (0, 0, 255)
            
            motion_status = "ROI Active" if has_motion else "ROI Static"
            motion_color = (0, 255, 0) if has_motion else (180, 180, 180)
            
            cv2.putText(frame, f"FPS: {fps:.1f}", (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            cv2.putText(frame, status_label, (30, 110), cv2.FONT_HERSHEY_SIMPLEX, 1.0, status_color, 2)
            cv2.putText(frame, truck_label, (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, truck_color, 2)
            cv2.putText(frame, f"Motion: {motion_status}", (30, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.8, motion_color, 2)

            if is_new_frame:
                now = time.time()
                if last_stream_time is not None:
                    elapsed = now - last_stream_time
                    if elapsed > 0:
                        fps_history.append(1.0 / elapsed)
                    fps = sum(fps_history) / len(fps_history) if fps_history else 0.0
                    shared_state["fps"] = fps
                last_stream_time = now
                streamer.update(frame)

    except KeyboardInterrupt:
        pass
    finally:
        print("\nShutting down background threads...")
        inference_stop.set()
        inference_thread.join(timeout=3)
        for cam in camera_configs:
            if cam["reader"] is not None:
                cam["reader"].stop()
        streamer.stop()
        print("System terminated cleanly.")

if __name__ == "__main__":
    _main()