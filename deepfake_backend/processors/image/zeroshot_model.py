import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import torch
from transformers import CLIPProcessor, CLIPModel
import tempfile

# Load updated CLIP model and processor
model = CLIPModel.from_pretrained("laion/CLIP-ViT-H-14-laion2B-s32B-b79K")
processor = CLIPProcessor.from_pretrained("laion/CLIP-ViT-H-14-laion2B-s32B-b79K")

# Updated prompt list
text_inputs = [
    "a real human photo",
    "a computer-generated deepfake",
    "an AI-generated synthetic image",
    "a cartoon illustration",
    "a real hand-drawn sketch",
    "a fake or AI-generated hand-drawn sketch"
]

def blur_detector(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def noise_analysis(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    residual = cv2.absdiff(gray, denoised)
    return residual

def classify_image(image_pil):
    inputs = processor(text=text_inputs, images=image_pil, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0].detach().numpy()
    label_scores = {label: float(f"{score:.4f}") for label, score in zip(text_inputs, probs)}
    best_idx = int(np.argmax(probs))
    best_label = text_inputs[best_idx]
    best_confidence = float(probs[best_idx])
    return best_label, best_confidence, label_scores

def analyze_image(image_path):
    image_cv = cv2.imread(image_path)
    image_pil = Image.open(image_path).convert("RGB")

    # CLIP-based classification
    best_label, confidence, label_scores = classify_image(image_pil)

    # Noise and blur analysis
    residual_img = noise_analysis(image_cv)
    blur_score = blur_detector(image_cv)

    # Heuristic final verdict
    suspicious_keywords = ["deepfake", "AI-generated", "fake"]
    suspicious = any(keyword in best_label.lower() for keyword in suspicious_keywords) \
                 or blur_score < 100 \
                 or np.mean(residual_img) > 20

    final_result = "Fake" if suspicious else "Real"
    return final_result, round(confidence, 4), label_scores
