#  Zero-Shot Deepfake Detection using CLIP + Digital Forensics

##  Project Overview

This project presents a **revolutionary Deepfake Detection Pipeline** that combines the power of **Zero-Shot Learning (ZSL)** using **OpenAI's CLIP** model with classic **Digital Image Forensics**. Unlike conventional models that are fine-tuned on specific deepfake datasets (usually human face datasets), this pipeline makes **generalized predictions** — capable of detecting **deepfakes of faces, landscapes, animals, objects, artworks**, and more — **without any retraining**.

>  The model also provides **human-interpretable reasoning** for its verdict based on measurable features like **sharpness, noise residuals**, and **ELA artifacts**.

---

##  Key Features

- **Zero-Shot Classification**: Uses CLIP to classify images into `real` or `deepfake` without any additional training.
- **Digital Forensics Analysis**:
  - **ELA (Error Level Analysis)**: Identifies abnormal compression artifacts common in manipulated images.
  - **Blur Score (Sharpness)**: Measures image sharpness — deepfakes often appear unnaturally smooth or blurry.
  - **Noise Residual Mean**: Detects inconsistent noise patterns caused by editing or synthesis.
- **Explainability**: For each prediction, the model provides reasoning such as:
  - `"Low blur score → possibly fake"`
  - `"High noise mean → tampered content likely"`
- **Multi-Domain Generalization**: Unlike traditional models, it’s **not limited to facial deepfakes**. Can detect deepfakes across:
  - Human faces
  - Landscapes and scenes
  - Digital and traditional art
  - Animals, objects, synthetic images, etc.
- **Image Display**: Visualizes the original input image alongside results for transparency and review.

---

##  How It Works

###  Full Pipeline

1. **Input Image**
2. **CLIP Zero-Shot Prediction**
   - CLIP computes similarity between the image and the textual labels `"a real image"` and `"a deepfake image"`.
3. **Error Level Analysis (ELA)**
   - Detects inconsistencies in JPEG compression that can expose tampering.
4. **Blur Detection**
   - Calculates Laplacian variance as a sharpness metric.
5. **Noise Residual Estimation**
   - Measures residual image noise that may indicate manipulation.
6. **Final Verdict**
   - Combines forensic metrics and CLIP scores to output:
     - `Real` or `Deepfake`
     - Category of image (e.g., face, landscape, etc.)
     - Explanation: why this decision was made.

---

##  Example Output

- Image Category : Artwork
- CLIP Prediction : Deepfake (Real=0.28, Deepfake=0.72)
- Blur Score (sharpness): 288.06 (Low → more fake-like)
- Noise Residual Mean : 4.18 (High → more manipulation)
- Final Verdict : Deepfake
- Explanation : Low sharpness and high residual noise with CLIP favoring 'deepfake'

---

##  Why This Approach is Novel

-  **No Training Required**: Works out-of-the-box via Zero-Shot Inference.
-  **Multimodal Fusion**: Combines **language + image** similarity with **classic image forensics** — a hybrid method not commonly seen in existing literature.
-  **Explainability Matters**: Provides interpretable outputs for humans — not just black-box probabilities.
-  **Not Face-Only**: Most deepfake detectors rely on facial datasets — this pipeline generalizes to all image domains.
-  **Lightweight & Portable**: Can be deployed via Flask or Streamlit without GPU-heavy training.

---

##  Key Concepts Explained

###  Zero-Shot Learning (ZSL)
Zero-shot learning allows models to **classify samples from unseen classes** using semantic understanding — in this case, CLIP uses text descriptions to determine similarity with images.

###  Error Level Analysis (ELA)
ELA helps identify parts of an image that have been edited. Areas with different compression levels stand out, making deepfake regions visible under analysis.

###  Blur Detection
Measures the **sharpness** of an image. Deepfakes, especially GAN-based ones, often appear overly smooth or blurry due to generation artifacts.

###  Noise Residuals
Natural images contain consistent sensor noise. Synthetic or edited images disrupt this pattern, resulting in abnormal noise residuals.

---

##  Tech Stack

- **Python**
- **CLIP (OpenAI)**
- **Pillow (for ELA)**
- **NumPy / OpenCV (for sharpness & noise)**
- **Matplotlib / Streamlit / Flask** (for visualization or deployment)

---

##  Example Visualization

![Example ELA Output](path/to/ela_output.jpg)  
*A deepfake detected through noise inconsistency and low blur score*

---

