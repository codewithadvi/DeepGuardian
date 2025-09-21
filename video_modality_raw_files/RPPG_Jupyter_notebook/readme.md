# 🩺 PhysNet3D — Contactless Heartbeat Estimation for Deepfake Detection

**PhysNet3D** is a deep learning model that extracts **human heart rate signals directly from a face video** — completely contactless, using only a camera. This is made possible by analyzing **invisible changes in skin color** due to blood flow, a field known as **remote photoplethysmography (rPPG)**.

But we go even further.

This project leverages rPPG to tackle one of today's biggest digital threats: **Deepfakes**. Unlike traditional methods that detect visual artifacts or inconsistencies, we introduce a **physiological approach**. Since most deepfakes fail to reproduce natural blood flow patterns, our model uses the absence (or irregularity) of rPPG signals as a powerful tool to differentiate **real humans from synthetic ones**.

---

## 🌍 Why This Matters

> "The human face hides more than it reveals — unless you know where to look."

In the age of AI-generated faces and manipulated identities, it’s no longer enough to detect visual errors. This project taps into **human physiology**, using subtle biological signals that are incredibly hard to fake.

- **Contactless**: No sensors or wearables — just a video is enough.
- **Non-invasive**: Works on passive video streams without any user interaction.
- **Real vs Fake**: Leverages the fact that synthetic videos often **fail to show physiological signals** like pulse and blood volume changes.

This physiological fingerprint adds a **new security layer** to deepfake detection that is not based on facial structure — but on **how alive a face behaves**.

---

## 🔬 What Is rPPG?

rPPG stands for **remote photoplethysmography** — a technique that estimates a person’s pulse by analyzing **minute changes in skin color** over time, caused by the blood pumping beneath the skin surface.

When your heart beats, your skin becomes slightly redder due to increased blood flow. This color change is **most visible in the green channel** of an RGB video, though invisible to the human eye. PhysNet3D is trained to spot and track these changes to reconstruct your pulse wave.

---

## 🧠 How Does PhysNet3D Work?

PhysNet3D is a **3D Convolutional Neural Network** based on an encoder-decoder architecture. Here's how it processes a facial video:

1. **Video Preprocessing**: The face region is extracted from each frame using a face detector (like MediaPipe or MTCNN). All frames are resized (e.g., 36×36), normalized, and stacked into a tensor of shape (Batch, Channels, Time, Height, Width).

2. **3D Convolutional Encoding**: The encoder part uses a series of 3D convolutional blocks to extract **spatiotemporal features**. Unlike 2D CNNs that see one image at a time, 3D CNNs learn how pixels change over time — which is perfect for capturing heartbeat-induced color changes.

3. **Residual Blocks**: To help the model go deeper without losing information, we include residual connections. These act like shortcuts and prevent vanishing gradients during training.

4. **Temporal Upsampling**: The decoder part uses transpose convolutions (deconvolutions) to recover the temporal structure of the input, ensuring the final output has the same time resolution as the input video.

5. **Signal Generation**: After decoding, a final 3D convolution produces one output per frame. This is spatially averaged across height and width, resulting in a 1D rPPG signal — one pulse value per frame.

6. **rPPG Signal Analysis**: This signal is plotted or processed to visualize the heartbeat pattern. Real human signals show periodic, smooth waves, while deepfakes often have flat or noisy signals with no rhythm.

![Alt text for the image](Deepfake\RPPG_Jupyter_notebook\Readme_imgs\flowchart.png)

---

## 📊 Output Examples

- **Real Video**: Produces a clean, rhythmic signal. Peak detection or Fourier analysis reveals a strong heartbeat frequency.
- **Deepfake Video**: Signal is flat, erratic, or has unnatural frequency spikes — exposing the synthetic origin.

This makes rPPG-based detection highly resistant to visual trickery, as it goes **beyond what deepfake generators are currently able to synthesize**.

---

## 🧭 Full Workflow (Step-by-Step)

**Input: A short face video**

→ Frame extraction and face detection  
→ Resize and normalize all frames  
→ Stack frames into a 5D tensor: (Batch, Channels=3, Time, Height, Width)  
→ Pass tensor into PhysNet3D model  
→ Encoder extracts temporal + spatial features  
→ Decoder upsamples temporal features  
→ Output: (Batch, 1, Time, Height, Width)  
→ Spatially average over Height and Width  
→ Final Output: (Batch, 1, Time) = rPPG signal  

→ Analyze the signal for periodicity  
→ Detect whether the video shows a real human or a deepfake based on rPPG quality  

---

## ✨ Why This Is Novel

Traditional deepfake detection focuses on:

- Visual flaws (weird eyes, teeth, artifacts)
- Audio-visual sync errors
- GAN fingerprints

But these can be bypassed by better generators.

**Our method detects something far deeper — real biology.**

- It's **hard to synthesize natural rPPG signals** in GANs or autoencoders.
- Even the most realistic faces rarely include subtle green channel shifts frame-by-frame.
- rPPG offers a **robust feature that current deepfake tools cannot easily fake**.

This is why our approach adds a **physiological layer of security** to existing visual deepfake detectors.

---

## 🧪 Real-World Use Cases

- Remote health monitoring (contactless pulse tracking)
- Deepfake detection in video calls, interviews, ID verifications
- Passive biometric authentication (live-ness check without interaction)

---

## 🧩 Model Architecture Summary

PhysNet3D is built using:

- **ConvBlock3D**: Basic 3D conv + batch norm + ReLU
- **ResidualBlock3D**: Two ConvBlocks with a skip connection
- **Encoder**: Conv3D layers compressing input into deeper features
- **Decoder**: Transposed Conv3D layers recovering temporal detail
- **OutConv**: Final Conv3D that outputs the rPPG signal per frame

After forward pass, we average the spatial dimensions to get a clean signal like:

`[0.14, 0.15, 0.18, 0.17, 0.16, 0.19, ...]` ← This is the pulse signal.

---

## 📍 Conclusion

PhysNet3D proves that even in an era dominated by powerful visual generation tools, **the body tells the truth** — through blood flow, heartbeats, and physiological rhythms.

By capturing and analyzing these signals from plain video, we not only build the foundation for contactless health monitoring, but also unlock a **new frontier in deepfake detection** — one based not on how a face looks, but **how alive it is**.

---

## 👨‍🔬 Future Work

- Apply signal filtering (e.g., Butterworth) to clean noise  
- Train with adversarial examples to improve robustness  
- Combine rPPG signal with CNN-based real/fake classifiers  
- Deploy lightweight models for mobile edge applications

---

## 📜 License

This project is released under the MIT License.

---
