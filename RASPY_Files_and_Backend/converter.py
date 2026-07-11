from ultralytics import YOLO

# 1. Load the model from the current directory
model = YOLO("best.pt")

# 2. Export to NCNN
# This will output a folder named 'best_ncnn_model' in the same folder
model.export(format="ncnn", imgsz=640)

print("✅ Conversion complete! Look for the 'best_ncnn_model' folder.")