import os
import cv2
import numpy as np
from detector import letterbox, nms, decode_yolov8_output, INPUT_SIZE, CONF_THRESHOLD, NMS_THRESHOLD, TARGET_CLASS_ID

points = []
scale_factor = 1.0
detect_mode = False

# Reload NCNN model for roi_config (separate from detector's _main)
import ncnn
current_dir = os.path.dirname(os.path.abspath(__file__))
param_path = os.path.join(current_dir, "yolov8n_ncnn_model", "model.ncnn.param")
bin_path = os.path.join(current_dir, "yolov8n_ncnn_model", "model.ncnn.bin")
net = ncnn.Net()
net.opt.num_threads = 4
net.opt.use_packing_layout = True
net.opt.use_bf16_storage = True
net.opt.lightmode = True
if hasattr(ncnn, 'build_with_vulkan') and ncnn.build_with_vulkan():
    net.opt.use_vulkan_compute = True
net.load_param(param_path)
net.load_model(bin_path)
print("NCNN model loaded for ROI config.")

def mouse_click(event, x, y, flags, param):
    global points
    if event == cv2.EVENT_LBUTTONDOWN:
        points.append([x, y])
    elif event == cv2.EVENT_RBUTTONDOWN:
        if len(points) > 0:
            points.pop()

def run_detection(raw_frame):
    orig_h, orig_w = raw_frame.shape[:2]
    letterboxed_img, scale_ratio, (pad_left, pad_top) = letterbox(raw_frame, (INPUT_SIZE, INPUT_SIZE))
    rgb_img = cv2.cvtColor(letterboxed_img, cv2.COLOR_BGR2RGB)
    mat_in = ncnn.Mat.from_pixels(rgb_img.tobytes(), ncnn.Mat.PixelType.PIXEL_RGB, INPUT_SIZE, INPUT_SIZE)
    mean_vals = [0.0, 0.0, 0.0]
    norm_vals = [1/255.0, 1/255.0, 1/255.0]
    mat_in.substract_mean_normalize(mean_vals, norm_vals)
    ex = net.create_extractor()
    ex.input("in0", mat_in)
    _, mat_out = ex.extract("out0")
    boxes, scores = decode_yolov8_output(mat_out, scale_ratio, pad_left, pad_top, orig_w, orig_h)
    return boxes, scores

src_default = "04.mp4"
src = input(f"Source file/URL (Enter for default '{src_default}'): ").strip()
if not src:
    src = src_default

cap = cv2.VideoCapture(src)
orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

MAX_WIDTH = 1280
MAX_HEIGHT = 720

if orig_w > MAX_WIDTH or orig_h > MAX_HEIGHT:
    scale_w = MAX_WIDTH / orig_w
    scale_h = MAX_HEIGHT / orig_h
    scale_factor = min(scale_w, scale_h)

new_w = int(orig_w * scale_factor)
new_h = int(orig_h * scale_factor)

cv2.namedWindow("Define ROI")
cv2.setMouseCallback("Define ROI", mouse_click)

playing = False
ret, frame = cap.read()
if not ret:
    print("Error: Could not read the video source.")
    exit()

print("\n=== ROI Configuration Tool ===")
print(f"Source: {src}  ({orig_w}x{orig_h})")
print("\nControls:")
print("- [SPACEBAR] : Play / Pause video")
print("- [Left Click] : Add a point")
print("- [Right Click]: Undo last point")
print("- 'c' : Clear all points")
print("- 'd' : Toggle detection overlay (verify ROI)")
print("- 's' or [ENTER] : Save ROI and exit")
print("- 'q' : Quit without saving\n")

while True:
    if playing:
        ret, next_frame = cap.read()
        if ret:
            frame = next_frame
        else:
            print("End of video reached. Pausing.")
            playing = False

    display_frame = cv2.resize(frame, (new_w, new_h))

    for i, pt in enumerate(points):
        cv2.circle(display_frame, tuple(pt), 6, (0, 0, 255), -1)
        if i > 0:
            cv2.line(display_frame, tuple(points[i-1]), tuple(pt), (0, 255, 0), 2)

    if len(points) > 2:
        cv2.line(display_frame, tuple(points[-1]), tuple(points[0]), (0, 255, 0), 2)
        overlay = display_frame.copy()
        pts_array = np.array(points, np.int32).reshape((-1, 1, 2))
        cv2.fillPoly(overlay, [pts_array], (0, 255, 0))
        cv2.addWeighted(overlay, 0.3, display_frame, 0.7, 0, display_frame)

    if detect_mode and len(points) > 2:
        boxes, scores = run_detection(frame)
        pts_array = np.array(points, np.int32).reshape((-1, 1, 2))
        any_inside = False
        for i in range(len(boxes)):
            box = boxes[i]
            score = scores[i]
            x1 = int(box[0] * scale_factor)
            y1 = int(box[1] * scale_factor)
            x2 = int(box[2] * scale_factor)
            y2 = int(box[3] * scale_factor)
            cx = int((box[0] + box[2]) / 2 * scale_factor)
            by = int(box[3] * scale_factor)
            inside = cv2.pointPolygonTest(pts_array, (float(cx), float(by)), False) >= 0
            if inside:
                any_inside = True
            color = (0, 255, 0) if inside else (0, 0, 255)
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            cv2.circle(display_frame, (cx, by), 6, color, -1)
            cv2.putText(display_frame, f"{score:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        det_color = (0, 255, 0) if any_inside else (0, 0, 255)
        cv2.putText(display_frame, f"Detection: {len(boxes)} truck(s)", (20, new_h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, det_color, 2)

    status = "PLAYING" if playing else "PAUSED"
    status_color = (0, 255, 0) if playing else (0, 0, 255)
    cv2.putText(display_frame, f"Status: {status}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
    cv2.putText(display_frame, f"Points: {len(points)}  |  Detection: {'ON' if detect_mode else 'OFF'}", 
                (20, new_h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cv2.imshow("Define ROI", display_frame)
    key = cv2.waitKey(30) & 0xFF

    if key == ord(' '):
        playing = not playing
    elif key == ord('c'):
        points = []
    elif key == ord('d'):
        detect_mode = not detect_mode
        print(f"Detection overlay: {'ON' if detect_mode else 'OFF'}")
    elif key == 13 or key == ord('s'):
        if len(points) > 2:
            true_coords = [(int(pt[0] / scale_factor), int(pt[1] / scale_factor)) for pt in points]
            break
        else:
            print("Need at least 3 points to form a polygon.")
    elif key == ord('q'):
        points = []
        break

cap.release()
cv2.destroyAllWindows()

if len(points) > 2:
    print("\n" + "="*60)
    print(" ✅ ROI CONFIGURED SUCCESSFULLY!")
    print(" Copy the camera_configs entry below into detector.py:\n")
    print("    {")
    print(f'        "id": 1,')
    print(f'        "name": "Cam 1 - Delivery Area",')
    print(f'        "source": "{src}",  # Mapped to video source file')
    print(f'        "roi_coords": {true_coords},  # ROI specific to Cam 1')
    print('        "tracker": BoundingBoxTracker(alpha=0.35, max_missing_frames=12),')
    print('        "truck_in_zone": False,')
    print('        "consecutive_present": 0,')
    print('        "consecutive_missing": 0,')
    print('        "scaled_roi_coords": None,')
    print('        "roi_polygon": None,')
    print('        "roi_min_x": None, "roi_min_y": None, "roi_max_x": None, "roi_max_y": None,')
    print('        "scale_x": None, "scale_y": None,')
    print('        "reader": None,')
    print('        # Performance optimization tracking variables')
    print('        "prev_roi_gray": None,')
    print('        "last_inference_time": 0.0,')
    print('        "last_raw_detections": []')
    print("    },")
    print()
else:
    print("\n No ROI defined.")
