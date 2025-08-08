import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image

# ===== CustomCNN Definition (match your training code) =====
class CustomCNN(nn.Module):
    def __init__(self):
        super(CustomCNN, self).__init__()
        self.model = nn.Sequential(
            nn.BatchNorm2d(3),
            nn.Conv2d(3, 16, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.BatchNorm2d(16),
            nn.Conv2d(16, 32, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.BatchNorm2d(32), nn.Dropout(0.1),
            nn.Conv2d(32, 64, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.BatchNorm2d(64), nn.Dropout(0.1),
            nn.Conv2d(64, 128, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.BatchNorm2d(128), nn.Dropout(0.1),
            nn.Conv2d(128, 256, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.BatchNorm2d(256), nn.Dropout(0.1),
            nn.AdaptiveAvgPool2d(1),
        )
        self.fc = nn.Linear(256, 1)

    def forward(self, x):
        x = self.model(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return torch.sigmoid(x)

# ===== Load model =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CustomCNN().to(device)

checkpoint = torch.load("processors\image\models\custom_model_cuda128_compatible.pth", map_location=device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()
print("✅ Model loaded successfully")

# ===== Transform (same as test_transform) =====
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# ===== Prediction function =====
def predict_image(image_path):
    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(input_tensor)
        prob = output.item()
        label = int(prob > 0.5)

    class_names = ['fake', 'real']
    reason ="temp reason"
    if class_names[label].lower() == "fake":
        prob = 1 - prob

    return class_names[label], prob, reason
