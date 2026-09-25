export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PAGES = 10;

const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "tiff", "tif", "bmp", "webp"]);

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisError";
  }
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export function assertSupportedFile(file: File): string {
  if (!file.name.trim()) {
    throw new AnalysisError("Choose a PDF or an image.");
  }
  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new AnalysisError("Use a PDF or an image (PNG, JPG, JPEG, TIFF, BMP, or WEBP).");
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new AnalysisError(`This file is ${mb} MB. The limit is 5 MB.`);
  }
  return extension;
}

export function assertPageCount(pageCount: number): void {
  if (pageCount > MAX_PAGES) {
    throw new AnalysisError(`This PDF has ${pageCount} pages. The limit is 10 pages.`);
  }
}
