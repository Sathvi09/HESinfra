from fastapi import File, UploadFile, Form, FastAPI
from fastapi.responses import JSONResponse
from google.cloud import vision
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = vision.ImageAnnotatorClient()

def extract_text_from_bytes(image_bytes: bytes) -> str:
    image = vision.Image(content=image_bytes)
    response = client.text_detection(image=image)
    annotations = response.text_annotations
    return annotations[0].description if annotations else ""

def extract_name_from_aadhaar(text: str) -> str:
    lines = text.split('\n')
    name_candidate = None
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or "government" in line.lower() or "unique" in line.lower():
            continue
        if "DOB" in line.upper() or "Year of Birth" in line:
            if i > 0:
                name_candidate = lines[i - 1].strip()
            break
    if name_candidate:
        name_candidate = re.sub(r"^(Name|S/O|D/O|W/O):?\s*", "", name_candidate, flags=re.IGNORECASE)
        return name_candidate.strip()
    return None

def extract_dob_from_pan(text: str) -> str:
    match = re.search(r'\b(\d{2})[\/-](\d{2})[\/-](\d{4})\b', text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    return None

@app.post("/verify-identity")
async def verify_identity(
    aadhaar_file: UploadFile = File(...),
    pan_file: UploadFile = File(...)
):
    aadhaar_bytes = await aadhaar_file.read()
    pan_bytes = await pan_file.read()

    aadhaar_text = extract_text_from_bytes(aadhaar_bytes)
    pan_text = extract_text_from_bytes(pan_bytes)

    name = extract_name_from_aadhaar(aadhaar_text)
    dob = extract_dob_from_pan(pan_text)

    if not name or not dob:
        return JSONResponse(status_code=400, content={"error": "Could not extract required fields."})

    return {
        "aadhaar_name": name,
        "pan_dob": dob,
        "success": True
    }

# ✅ Driving Licence route — requires all 3 fields to set success=True
@app.post("/verify-driving-licence")
async def verify_dl(licence_file: UploadFile = File(...)):
    licence_bytes = await licence_file.read()
    text = extract_text_from_bytes(licence_bytes)

    # Extract DL number
    licence_number = None
    match = re.search(r'\b[A-Z]{2}\d{2}\s?\d{11}\b', text.replace(" ", ""))
    if match:
        licence_number = match.group(0)

    # Extract issue date and expiry date
    issue_date = None
    valid_till = None
    date_matches = re.findall(r'\b(\d{2})[/-](\d{2})[/-](\d{4})\b', text)
    if date_matches:
        dates = [f"{y}-{m}-{d}" for d, m, y in date_matches]
        if len(dates) >= 2:
            issue_date, valid_till = dates[0], dates[1]
        elif len(dates) == 1:
            issue_date = dates[0]

    # ✅ Success only if all three are found
    success = bool(licence_number and issue_date and valid_till)

    return JSONResponse({
        "success": success,
        "licence_number": licence_number,
        "issue_date": issue_date,
        "valid_till": valid_till,
    })
