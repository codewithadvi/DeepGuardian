import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import torch
from transformers import CLIPProcessor, CLIPModel
import tempfile

# Load CLIP model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def enhanced_ela(pil_image):
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        temp_path = tmp.name
        pil_image.save(temp_path, "JPEG", quality=90)
    compressed = Image.open(temp_path)
    ela_image = ImageChops.difference(pil_image, compressed)
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    max_diff = max_diff if max_diff != 0 else 1
    scale = 255.0 / max_diff
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    return ela_image

def blur_detector(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def noise_analysis(image_cv):
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    residual = cv2.absdiff(gray, denoised)
    return residual

def classify_clip(image_pil):
    inputs = processor(text=["This is a real face", "This is a deepfake"], images=image_pil, return_tensors="pt", padding=True)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1).detach().numpy()[0]
    return "Real" if probs[0] > probs[1] else "Deepfake", probs

def classify_category(image_pil):
    categories = [
        "a photo of a person", "a photo of an animal", "a painting", "a digital artwork",
        "a landscape", "a cityscape", "an object", "a cartoon", "a sculpture", "a car"
    ]
    inputs = processor(text=categories, images=image_pil, return_tensors="pt", padding=True)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1).detach().numpy()[0]
    best_idx = np.argmax(probs)
    return categories[best_idx], probs[best_idx]

def analyze_image(image_path):
    image_cv = cv2.imread(image_path)
    image_pil = Image.open(image_path).convert("RGB")

    # CLIP zero-shot fake detection
    zsl_pred, zsl_probs = classify_clip(image_pil)
    zsl_confidence = float(np.max(zsl_probs))

    # Noise and blur analysis
    residual_img = noise_analysis(image_cv)
    blur_score = blur_detector(image_cv)

    # Heuristic final verdict
    suspicious = (zsl_pred == "Deepfake") or blur_score < 100 or np.mean(residual_img) > 20
    final_result = "Fake" if suspicious else "Real"

    # Category detection
    category_label, category_conf = classify_category(image_pil)

    # Return as tuple instead of dict
    return final_result,round(float(category_conf), 2), category_label
