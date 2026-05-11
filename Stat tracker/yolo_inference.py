from ultralytics import YOLO

model = YOLO('C:\\Korner flag\\Models\\best.pt')

results = model.predict(
      'C:\\Korner flag\\Input video\\08fd33_4.mp4',
      save=True,
      project='C:\\Korner flag\\runs\\detect'  # Force output location
  )