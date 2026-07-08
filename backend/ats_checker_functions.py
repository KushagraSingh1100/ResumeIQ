from dotenv import load_dotenv
load_dotenv()

import os
import io
import pdf2image
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def get_gemini_latex_response(prompt, latex_resume, job_description):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            "JOB DESCRIPTION:\n" + job_description,
            "LATEX RESUME:\n" + latex_resume,
        ],
    )
    return response.text

def get_gemini_pdf_response(prompt, image_bytes, job_description):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            job_description,
        ],
    )
    return response.text

async def input_pdf_setup(uploaded_file):
    if uploaded_file is None:
        raise FileNotFoundError("No file uploaded")
    pdf_bytes = await uploaded_file.read()
    images = pdf2image.convert_from_bytes(pdf_bytes, poppler_path=r"C:\poppler-26.02.0\Library\bin")
    if not images:
        raise ValueError("The uploaded PDF contains no pages.")
    first_page=images[0]
    img_byte_arr = io.BytesIO()
    first_page.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

def input_pdf_bytes_setup(pdf_bytes):
    if pdf_bytes is None:
        raise FileNotFoundError("No PDF found")

    images = pdf2image.convert_from_bytes(
        pdf_bytes,
        poppler_path=r"C:\poppler-26.02.0\Library\bin"
    )
    if not images:
        raise ValueError("The PDF contains no pages.")
    first_page = images[0]
    img_byte_arr = io.BytesIO()
    first_page.save(img_byte_arr, format="JPEG")
    return img_byte_arr.getvalue()


input_prompt1 = """
 You are an experienced Technical Human Resource Manager,your task is to review the provided resume against the job description. 
  Please share your professional evaluation on whether the candidate's profile aligns with the role. 
 Highlight the strengths and weaknesses of the applicant in relation to the specified job requirements.
"""

input_prompt3 = """
You are an skilled ATS (Applicant Tracking System) scanner with a deep understanding of software engineering 
your task is to evaluate the resume against the provided job description. give me the percentage of match if the resume matches
the job description. First the output should come as percentage and then keywords missing and last final thoughts.
"""
