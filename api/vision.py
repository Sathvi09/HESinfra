from fastapi import File, UploadFile, FastAPI
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
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- GOOGLE CLOUD VISION CLIENT SETUP ----------------
if os.getenv("GOOGLE_CREDENTIALS"):
    creds_dict = json.loads(os.getenv("GOOGLE_CREDENTIALS"))
    credentials = service_account.Credentials.from_service_account_info(creds_dict)
    client = vision.ImageAnnotatorClient(credentials=credentials)
elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    client = vision.ImageAnnotatorClient()
else:
    raise RuntimeError("Google Cloud Vision credentials not found!")

# ---------------- OCR HELPERS ----------------
def extract_text_from_bytes(image_bytes: bytes) -> str:
    image = vision.Image(content=image_bytes)
    response = client.text_detection(image=image)
    annotations = response.text_annotations
    return annotations[0].description if annotations else ""

# List of states for matching
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
    "Puducherry", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu"
]

# ---------------- PARSERS ----------------
def parse_aadhaar(text: str):
    data = {}
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Aadhaar number
    aadhaar_match = re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", text)
    if aadhaar_match:
        data["aadhaar_number"] = aadhaar_match.group(0)

    # Name (first line with alphabets before DOB/Address section)
    for line in lines:
        if "government" in line.lower() or "unique" in line.lower():
            continue
        if re.search(r"[A-Za-z]{2,}", line) and not any(c.isdigit() for c in line):
            data["name"] = line
            break

    # Mobile number (10 digit starting with 6/7/8/9)
    mobile_match = re.search(r"\b[6-9]\d{9}\b", text)
    if mobile_match:
        data["mobile_number"] = mobile_match.group(0)

     # Name (2nd line after "To")
    if "To" in lines:
        idx = lines.index("To")
        if idx + 2 < len(lines):
            data["name"] = lines[idx + 2]

    # Address (from 4th line after "To" until mobile number)
    address_lines = []
    if "To" in lines:
        idx = lines.index("To")
        for l in lines[idx+4:]:
            if re.match(r"\b[6-9]\d{9}\b", l):  # stop at mobile number
                break
            if "aadhaar" in l.lower():
                break
            address_lines.append(l)

    if address_lines:
        data["address"] = ", ".join(address_lines)

        # Extract state from address lines
        for st in INDIAN_STATES:
            if any(st.lower() in l.lower() for l in address_lines):
                data["state"] = st
                break

    return data


def parse_pan(text: str):
    data = {}
    # PAN number
    pan_match = re.search(r"[A-Z]{5}\d{4}[A-Z]", text)
    if pan_match:
        data["pan_number"] = pan_match.group(0)

    # DOB
    dob_match = re.search(r"(\d{2}[/-]\d{2}[/-]\d{4})", text)
    if dob_match:
        data["dob"] = dob_match.group(1)

    return data




def parse_driving_license(text: str):
    data = {}
    # License number
    licence_match = re.search(r"\b[A-Z]{2}\d{2}\s?\d{11}\b", text.replace(" ", ""))
    if licence_match:
        data["licence_number"] = licence_match.group(0)

    # Dates
    date_matches = re.findall(r"(\d{2}[/-]\d{2}[/-]\d{4})", text)
    if len(date_matches) >= 2:
        data["issue_date"], data["valid_till"] = date_matches[:2]

    # Name and Father's Name
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for i, line in enumerate(lines):
        if "Name" in line and i+1 < len(lines):
            data["name"] = lines[i+1]
        if "Father" in line and i+1 < len(lines):
            data["father_name"] = lines[i+1]

    return data

# ---------------- ROUTES ----------------
@app.post("/extract-personal-info")
async def extract_personal_info(aadhaar_file: UploadFile = File(...), pan_file: UploadFile = File(...)):
    aadhaar_text = extract_text_from_bytes(await aadhaar_file.read())
    pan_text = extract_text_from_bytes(await pan_file.read())

    aadhaar_data = parse_aadhaar(aadhaar_text)
    pan_data = parse_pan(pan_text)

    merged_data = {
        "aadhaarNumber": aadhaar_data.get("aadhaar_number"),
        "fullName": aadhaar_data.get("name"),
        "mobileNumber": aadhaar_data.get("mobile_number"),
        "presentAddress": aadhaar_data.get("address"),
        "state": aadhaar_data.get("state"),
        "panNumber": pan_data.get("pan_number"),
        "dateOfBirth": pan_data.get("dob"),
        "success": True
    }

    return merged_data

@app.post("/verify-driving-licence")
async def verify_driving_licence(licence_file: UploadFile = File(...)):
    dl_text = extract_text_from_bytes(await licence_file.read())
    dl_data = parse_driving_license(dl_text)
    dl_data["success"] = bool(dl_data.get("licence_number"))
    return dl_data
