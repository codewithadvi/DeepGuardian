
# Deepfake Voice Detection using MFCC & Neural Networks

This repository contains the code for a deep learning model designed to detect synthetic or "deepfake" audio. The model leverages **Mel-Frequency Cepstral Coefficients (MFCCs)** as features and uses a Multi-Layer Perceptron (MLP) with Batch Normalization and Dropout to classify audio clips as either `REAL` or `FAKE`. The system is trained on the Deep Voice & Deepfake Voice Recognition dataset and achieves outstanding performance on the test set.



---
## 📋 Key Features

* **High-Accuracy Classification**: Achieves **100% accuracy** on the held-out test set.
* **MFCC Feature Extraction**: Uses the mean of 40 MFCCs to capture the unique timbral characteristics of a voice.
* **Robust Preprocessing**: Includes critical steps like handling class imbalance with `RandomOverSampler` and feature scaling with `StandardScaler`.
* **Optimized Neural Network**: A simple yet powerful MLP architecture with `BatchNormalization` for stability and `Dropout` for regularization.
* **Efficient Training**: Implements `EarlyStopping` to prevent overfitting and find the optimal model without unnecessary training epochs.

---
## ⚙️ Methodology & Workflow

The project follows a standard machine learning pipeline from data ingestion to model evaluation.

### 1. Data Loading & Feature Extraction
* Audio files from the `REAL` and `FAKE` directories are loaded using `librosa`.
* For each audio file, the `extract_features_mean_mfcc` function computes 40 MFCCs.
* The temporal dimension of the MFCCs is averaged to produce a single, fixed-size feature vector (40,) for each audio clip. This ensures all inputs to the model are uniform.

### 2. Data Preprocessing
* **Label Encoding**: The categorical labels (`REAL`, `FAKE`) are converted into numerical format (`1`, `0`).
* **Handling Class Imbalance**: `RandomOverSampler` is used to resample the minority class, ensuring the model is trained on a balanced dataset to prevent bias.
* **Feature Scaling**: A `StandardScaler` is fitted on the training data to normalize the feature vectors. This is a crucial step for neural networks, as it helps stabilize the learning process and speed up convergence.
* **Data Splitting**: The scaled, resampled data is split into training (80%) and testing (20%) sets.

---
## 🧠 Model Architecture

The model is a Sequential Multi-Layer Perceptron (MLP) built with TensorFlow/Keras. The architecture is designed for effective classification while preventing overfitting.

| Layer Type | Parameters | Activation | Notes |
| :--- | :--- | :--- | :--- |
| **Dense** (Input) | 256 neurons | - | Input shape: (40,) |
| BatchNormalization | - | - | Normalizes activations |
| Activation | ReLU | - | - |
| Dropout | Rate: 0.4 | - | Regularization |
| **Dense** (Hidden 1) | 128 neurons | - | - |
| BatchNormalization | - | - | Normalizes activations |
| Activation | ReLU | - | - |
| Dropout | Rate: 0.4 | - | Regularization |
| **Dense** (Hidden 2) | 64 neurons | - | - |
| BatchNormalization | - | - | Normalizes activations |
| Activation | ReLU | - | - |
| Dropout | Rate: 0.3 | - | Regularization |
| **Dense** (Output) | 2 neurons | Softmax | Outputs class probabilities |

The model is compiled with the **Adam optimizer** (`learning_rate=0.001`) and **categorical cross-entropy** loss function.

---
## 📊 Performance & Results

The model was trained for a maximum of 100 epochs with an `EarlyStopping` patience of 10 on the validation loss. Training stopped at epoch 70, restoring the best weights from epoch 60.

* **Test Loss**: **0.0288**
* **Test Accuracy**: **100.00%**

The training history below shows the model converging perfectly on the validation set without signs of overfitting.

<img width="1189" height="490" alt="image" src="https://github.com/user-attachments/assets/9fb91eb4-eddb-4eaa-9592-fa4765943b34" />


)

---
## 📜 License

This project is licensed under the MIT License.
