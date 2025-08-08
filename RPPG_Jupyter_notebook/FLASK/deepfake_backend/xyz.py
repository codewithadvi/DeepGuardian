# import threading
# import cv2
# import mediapipe as mp

# from processors.image.zeroshot_model import analyze_image
# from processors.image.cnn_model import predict_image

# def face_exists(image_path):
#     image = cv2.imread(image_path)
#     if image is None:
#         print(f"Could not load image: {image_path}")
#         return False

#     image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

#     # Always create a new instance to avoid stale detections
#     with mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.7) as detector:
#         result = detector.process(image_rgb)
#         has_face = result.detections is not None and len(result.detections) > 0

#     print(f"Face detected: {has_face} in {image_path}")
#     return has_face

# def process_image(image_path):
#     results = {}
#     output = {}

#     def run_model(name, func, output_dict):
#         label, confidence, reason = func(image_path)
#         output_dict[name] = {
#             'label': label,
#             'confidence': confidence,
#             'reason': reason
#         }

#     # Check for face strictly
#     has_face = face_exists(image_path)

#     # Only one model runs, based on presence of face
#     if has_face:
#         selected_models = {"cnn": predict_image}
#     else:
#         selected_models = {"zeroshot": analyze_image}

#     threads = []
#     for name, func in selected_models.items():
#         t = threading.Thread(target=run_model, args=(name, func, output))
#         threads.append(t)
#         t.start()

#     for t in threads:
#         t.join()

#     label_votes = [output[m]['label'].lower() for m in output]
#     if label_votes.count("fake") > label_votes.count("real"):
#         overall_label = "fake"
#     else:
#         overall_label = "real"

#     results['overall'] = {
#         'label': overall_label,
#         'model_confidences': output,
#         'fake_by': [m for m in output if output[m]['label'].lower() == 'fake'],
#         'real_by': [m for m in output if output[m]['label'].lower() == 'real']
#     }

#     results['image_models'] = output
#     return results
