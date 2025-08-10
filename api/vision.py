from fastapi import File, UploadFile, FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
from google.oauth2 import service_account
import os
import json
import re

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- GOOGLE CLOUD VISION CLIENT SETUP ----------------
if os.getenv("GOOGLE_CREDENTIALS"):  
    # Load from Render environment variable (JSON string)
    creds_dict = json.loads(os.getenv("GOOGLE_CREDENTIALS"))
    credentials = service_account.Credentials.from_service_account_info(creds_dict)
    client = vision.ImageAnnotatorClient(credentials=credentials)
elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    # Local dev using JSON file path
    client = vision.ImageAnnotatorClient()
else:
    raise RuntimeError("Google Cloud Vision credentials not found!")

# ---------------- OCR HELPERS ----------------
def extract_text_from_bytes(image_bytes: bytes) -> str:
    image = vision.Image(content=image_bytes)
    response = client.text_detection(image=image)
    annotations = response.text_annotations
    return annotations[0].description if annotations else ""

def extract_name_from_aadhaar(text: str) -> str:
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or "government" in line.lower() or "unique" in line.lower():
            continue
        if "DOB" in line.upper() or "Year of Birth" in line:
            if i > 0:
                name_candidate = re.sub(
                    r"^(Name|S/O|D/O|W/O):?\s*", "", lines[i - 1].strip(), flags=re.IGNORECASE
                )
                return name_candidate.strip()
    return None

def extract_dob_from_pan(text: str) -> str:
    match = re.search(r'\b(\d{2})[\/-](\d{2})[\/-](\d{4})\b', text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    return None

# ---------------- ROUTES ----------------
@app.post("/verify-identity")
async def verify_identity(aadhaar_file: UploadFile = File(...), pan_file: UploadFile = File(...)):
    aadhaar_text = extract_text_from_bytes(await aadhaar_file.read())
    pan_text = extract_text_from_bytes(await pan_file.read())

    name = extract_name_from_aadhaar(aadhaar_text)
    dob = extract_dob_from_pan(pan_text)

    if not name or not dob:
        return JSONResponse(status_code=400, content={"error": "Could not extract required fields."})

    return {"aadhaar_name": name, "pan_dob": dob, "success": True}

@app.post("/verify-driving-licence")
async def verify_dl(licence_file: UploadFile = File(...)):
    text = extract_text_from_bytes(await licence_file.read())

    # Extract DL number
    licence_number = None
    match = re.search(r'\b[A-Z]{2}\d{2}\d{11}\b', text.replace(" ", ""))
    if match:
        licence_number = match.group(0)

    # Extract dates
    issue_date, valid_till = None, None
    date_matches = re.findall(r'\b(\d{2})[/-](\d{2})[/-](\d{4})\b', text)
    if date_matches:
        dates = [f"{y}-{m}-{d}" for d, m, y in date_matches]
        if len(dates) >= 2:
            issue_date, valid_till = dates[:2]
        elif len(dates) == 1:
            issue_date = dates[0]

    success = bool(licence_number and issue_date and valid_till)

    return JSONResponse({
        "success": success,
        "licence_number": licence_number,
        "issue_date": issue_date,
        "valid_till": valid_till,
    })
