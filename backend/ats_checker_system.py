from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from ats_checker_functions import input_pdf_bytes_setup, get_gemini_pdf_response, get_gemini_latex_response
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm, OAuth2PasswordBearer
from database import users_collection
from models import RegisterRequest, LoginRequest
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    try:
        payload = decode_token(token)
        username = payload["username"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users_collection.find_one({"username": username})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

ATS_PROMPT="""You are an expert Technical Recruiter, ATS optimization specialist, professional resume writer, and LaTeX expert.

You will receive:

1. A Job Description
2. A candidate's resume in LaTeX format.

Your goal is to optimize the resume for the provided Job Description while remaining 100% truthful.

=========================
RULES (VERY IMPORTANT)
=========================

1. NEVER invent:
- skills
- technologies
- projects
- certifications
- internships
- work experience
- education
- achievements
- metrics

2. NEVER claim the candidate knows something unless it already appears somewhere in the resume.

3. If the JD requires a skill that does not exist anywhere in the resume:
   - DO NOT add it.
   - Instead record it in the "Missing Skills" section.

4. You may:
- rewrite bullet points
- improve wording
- reorder content
- highlight relevant experience
- emphasize existing technologies
- expand existing bullets
- improve ATS keyword matching
- improve action verbs
- improve readability
- improve formatting

5. Preserve valid LaTeX syntax.

6. Do not break compilation.

7. Keep the resume to one page whenever possible.

=========================
OPTIMIZATION GOALS
=========================

Optimize the resume for ATS by:

- matching terminology used in the JD
- increasing keyword coverage
- emphasizing relevant projects
- emphasizing relevant technical skills
- emphasizing measurable achievements
- improving bullet quality
- improving action verbs
- removing unnecessary wording
- improving recruiter readability

=========================
WHEN A SKILL IS MISSING
=========================

If the JD requires something absent from the resume:

DO NOT ADD IT.

Instead include it under:

## Missing Skills

For each missing item provide:

- Skill
- Importance (Critical / Important / Nice to Have)
- Why it matters
- Suggestion for acquiring it

Example:

Critical
Skill: Docker
Reason: Mentioned multiple times in the JD.
Suggestion: Learn Docker fundamentals and build one project using Docker before adding it to the resume.

=========================
OUTPUT FORMAT
=========================

Return ONLY a JSON object.

{
  "ats_score_before": number,
  "estimated_ats_score_after": number,
  "summary": "...",
  "changes_made": [
    "...",
    "...",
    "..."
  ],
  "missing_skills": [
    {
      "skill": "...",
      "importance": "Critical",
      "reason": "...",
      "suggestion": "..."
    }
  ],
  "updated_latex": "FULL UPDATED LATEX DOCUMENT"
}

Return the ENTIRE modified LaTeX document inside "updated_latex".

Do not truncate.

Do not omit any section.

Do not use markdown fences.

=========================
JOB DESCRIPTION
=========================

{{JOB_DESCRIPTION}}

=========================
LATEX RESUME
=========================

{{LATEX_RESUME}}"""

@app.post("/register")
async def register(request: RegisterRequest):

    existing = await users_collection.find_one(
        {"username": request.username}
    )

    if existing:
        raise HTTPException(400, "Username already exists")
    await users_collection.insert_one(
        {
            "username": request.username,
            "password": hash_password(request.password),
            "resume_pdf": None,
            "resume_filename": None,
            "resume_tex": None,
            "resume_tex_filename": None,
        }
    )

    return {"message": "User created successfully"}

@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = await users_collection.find_one(
        {"username": form_data.username}
    )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    if not verify_password(
        form_data.password,
        user["password"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    token = create_access_token(
        {"username": form_data.username}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@app.post("/upload-resume")
async def upload_resume(
    pdf: UploadFile = File(...),
    tex: UploadFile = File(...),
    current_user=Depends(get_current_user),
):

    if pdf.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed",
        )
    if not tex.filename.endswith(".tex"):
        raise HTTPException(400, "TeX file required")

    pdf_bytes = await pdf.read()
    latex_content = (await tex.read()).decode("utf-8")

    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "resume_pdf": pdf_bytes,
                "resume_filename": pdf.filename,
                "resume_tex": latex_content,
                "resume_tex_filename": tex.filename,
            }
        },
    )

    return {
        "message": "Resume uploaded successfully"
    }


@app.post("/check-ats-score")
async def ask(
    job_description: str = Form(...),
    ai_prompt: str = Form(...),
    current_user=Depends(get_current_user),
):
    try:
        pdf_bytes = current_user.get("resume_pdf")
        if pdf_bytes is None:
            raise HTTPException(
                status_code=404,
                detail="No resume uploaded."
            )
        pdf_content = input_pdf_bytes_setup(pdf_bytes)
        response = get_gemini_pdf_response(
            ai_prompt,
            pdf_content,
            job_description,
        )

        return {"response": response}
    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred."
        )

@app.post("/optimize")
async def optimize_resume(
    job_description: str = Form(...),
    current_user=Depends(get_current_user),
):
    latex_resume = current_user.get("resume_tex")

    if latex_resume is None:
        raise HTTPException(
            status_code=404,
            detail="No LaTeX resume uploaded."
        )

    response = get_gemini_latex_response(
        ATS_PROMPT,
        latex_resume,
        job_description,
    )

    response = response.strip()
    if response.startswith("```json"):
        response = response[7:]
    if response.startswith("```"):
        response = response[3:]
    if response.endswith("```"):
        response = response[:-3]
    response = response.strip()
    data = json.loads(response)
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "resume_tex": data["updated_latex"]
            }
        }
    )
    return data