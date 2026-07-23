import hashlib
import os
import uuid
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from fastapi import UploadFile
from PIL import Image

from app.core.config import get_settings

settings = get_settings()

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "tiff", "bmp", "webp"}


class UnsupportedFileTypeError(Exception):
    pass


class FileTooLargeError(Exception):
    pass


def get_extension(filename: str) -> str:
    return Path(filename).suffix.lower().lstrip(".")


def validate_file(filename: str, size_bytes: int) -> str:
    ext = get_extension(filename)
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '.{ext}'. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise FileTooLargeError(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB")
    return ext


def compute_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def save_upload(content: bytes, filename: str) -> str:
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    ext = get_extension(filename)
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(content)
    return stored_path


def extract_text_from_pdf(file_path: str) -> str:
    text_parts: list[str] = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_parts.append(page.get_text())
    return "\n".join(text_parts).strip()


def extract_text_from_image(file_path: str) -> str:
    with Image.open(file_path) as img:
        return pytesseract.image_to_string(img).strip()


def extract_text(file_path: str, ext: str) -> str:
    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    if ext in IMAGE_EXTENSIONS:
        return extract_text_from_image(file_path)
    raise UnsupportedFileTypeError(f"Unsupported file type '.{ext}'")


async def read_upload_file(upload_file: UploadFile) -> bytes:
    content = await upload_file.read()
    await upload_file.seek(0)
    return content
