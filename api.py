from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
from pydantic import BaseModel
import numpy as np
import pydicom
from skimage.transform import resize
from torchvision import transforms
from PIL import Image
import io
import base64

# Initialize FastAPI app
app = FastAPI()

# Configure CORS (for development, allow all; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can change this to a specific origin, e.g., ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the response model
class PredictionResult(BaseModel):
    class_label: str
    confidence: float
    prediction: int
    image_base64: str

# Set device (use CUDA if available)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# -------------------------------
# Model Definition (Must Match Training Code)
# -------------------------------
class CapsNetWithDecoder(torch.nn.Module):
    def __init__(self, num_capsules, capsule_dim, num_classes, reconstruction_weight=0.0005, routing_iters=3):
        super(CapsNetWithDecoder, self).__init__()
        self.reconstruction_weight = reconstruction_weight
        self.routing_iters = routing_iters

        self.conv1 = torch.nn.Sequential(
            torch.nn.Conv2d(1, 256, kernel_size=9, stride=1, padding=0),
            torch.nn.BatchNorm2d(256),
            torch.nn.PReLU(),
            torch.nn.Dropout2d(0.3)
        )
        self.primary_capsules = torch.nn.Sequential(
            torch.nn.Conv2d(256, num_capsules * capsule_dim, kernel_size=9, stride=2, padding=0),
            torch.nn.BatchNorm2d(num_capsules * capsule_dim),
            torch.nn.PReLU(),
            torch.nn.Dropout2d(0.3)
        )
        self.num_capsules = num_capsules
        self.capsule_dim = capsule_dim
        self.num_classes = num_classes

        self.classification_head = torch.nn.Sequential(
            torch.nn.Linear(num_capsules * capsule_dim, 256),
            torch.nn.BatchNorm1d(256),
            torch.nn.PReLU(),
            torch.nn.Dropout(0.5),
            torch.nn.Linear(256, 128),
            torch.nn.BatchNorm1d(128),
            torch.nn.PReLU(),
            torch.nn.Dropout(0.4),
            torch.nn.Linear(128, num_classes)
        )

        self.decoder = torch.nn.Sequential(
            torch.nn.Linear(num_capsules * capsule_dim, 512),
            torch.nn.ReLU(inplace=True),
            torch.nn.Linear(512, 1024),
            torch.nn.ReLU(inplace=True),
            torch.nn.Linear(1024, 32 * 32),
            torch.nn.Sigmoid()
        )

        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, (torch.nn.Conv2d, torch.nn.Linear)):
            torch.nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            if m.bias is not None:
                torch.nn.init.zeros_(m.bias)
        elif isinstance(m, (torch.nn.BatchNorm2d, torch.nn.BatchNorm1d)):
            torch.nn.init.ones_(m.weight)
            torch.nn.init.zeros_(m.bias)

    def squash(self, x):
        squared_norm = (x ** 2).sum(dim=-1, keepdim=True)
        scale = squared_norm / (1 + squared_norm + 1e-8)
        return scale * x / (torch.sqrt(squared_norm) + 1e-8)

    def dynamic_routing(self, u_hat):
        batch_size, input_capsules, output_capsules, capsule_dim = u_hat.shape
        b_ij = torch.zeros(batch_size, input_capsules, output_capsules, device=u_hat.device)
        for iteration in range(self.routing_iters):
            c_ij = torch.nn.functional.softmax(b_ij, dim=2)
            s_j = torch.sum(c_ij.unsqueeze(-1) * u_hat, dim=1)
            v_j = self.squash(s_j)
            if iteration < self.routing_iters - 1:
                b_ij = b_ij + torch.sum(u_hat * v_j.unsqueeze(1), dim=-1)
        return v_j

    def forward(self, x):
        x = self.conv1(x)
        u_hat = self.primary_capsules(x)
        batch_size = u_hat.size(0)
        # Reshape and permute to prepare for routing
        u_hat = u_hat.view(batch_size, self.num_capsules, self.capsule_dim, -1)
        u_hat = u_hat.permute(0, 3, 1, 2)
        v_j = self.dynamic_routing(u_hat)
        v_j_flat = v_j.view(batch_size, -1)
        class_output = self.classification_head(v_j_flat)
        reconstruction = self.decoder(v_j_flat)
        reconstruction = reconstruction.view(-1, 1, 32, 32)
        return class_output, reconstruction

# Global model variable
model = None

# -------------------------------
# Load the Saved Model on Startup
# -------------------------------
@app.on_event("startup")
async def load_model():
    global model
    model = CapsNetWithDecoder(num_capsules=12, capsule_dim=16, num_classes=2, reconstruction_weight=0.0005, routing_iters=3)
    # Update the path below to the location of your saved model file
    state_dict_path = r"C:\Users\User\Desktop\FYP-frontend\lung_capsnet_model_desktop_v1_improved.pth" # Update this path as needed
    model.load_state_dict(torch.load(state_dict_path, map_location=device))
    model.to(device)
    model.eval()
    print("Model loaded and ready for inference.")

# -------------------------------
# Preprocess DICOM File
# -------------------------------
def preprocess_dicom(file_bytes):
    ds = pydicom.dcmread(io.BytesIO(file_bytes))
    pixel_array = ds.pixel_array.astype(np.float32)
    # Resize to 32x32; note: adjust anti_aliasing as needed
    resized = resize(pixel_array, (32, 32), anti_aliasing=True)
    normalized = (resized - np.mean(resized)) / (np.std(resized) + 1e-8)
    
    # Option 1: Use 2D array directly (ToPILImage treats a 2D array as grayscale)
    # pil_img = transforms.ToPILImage()(normalized)
    
    # Option 2: Add channel dimension as the last axis so shape becomes (32, 32, 1)
    img = np.expand_dims(normalized, axis=-1)
    pil_img = transforms.ToPILImage()(img)
    
    transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((32, 32)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    tensor_img = transform(pil_img).unsqueeze(0)  # shape: [1, 1, 32, 32]
    return tensor_img

# -------------------------------
# /predict Endpoint
# -------------------------------
@app.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    # Read the file contents
    contents = await file.read()
    
    # Preprocess the DICOM file into a tensor
    input_tensor = preprocess_dicom(contents).to(device)
    
    # For display: create a base64-encoded PNG from the original DICOM pixel array
    ds = pydicom.dcmread(io.BytesIO(contents))
    pixel_array = ds.pixel_array
    pil_img = Image.fromarray(pixel_array).convert("L")
    buffered = io.BytesIO()
    pil_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    # Get model predictions (ignore reconstruction)
    with torch.no_grad():
        class_output, _ = model(input_tensor)
        probabilities = torch.nn.functional.softmax(class_output, dim=1)
    
    predicted_class = torch.argmax(probabilities, dim=1).item()
    confidence = probabilities[0, predicted_class].item()
    
    return {
        "class_label": "Malignant" if predicted_class == 1 else "Benign",
        "confidence": confidence,
        "prediction": predicted_class,
        "image_base64": img_str
    }

# If you want to run the API with: uvicorn api:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
