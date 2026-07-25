import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"];

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileInput = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await onUpload(file);
      }
      event.target.value = "";
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex min-h-44 flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-9 text-center transition ${
        isDragging
          ? "border-brand-500 bg-brand-50 shadow-inner"
          : "border-slate-300 bg-slate-50/70 hover:border-brand-300 hover:bg-white"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-brand-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path
            d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="max-w-md text-sm font-medium text-slate-800">
        Drop a PDF or image here, or{" "}
        <label className="cursor-pointer text-brand-700 underline underline-offset-4 hover:text-brand-800">
          browse files
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
      </p>
      <p className="mt-2 text-xs text-slate-500">PDF, PNG, JPG, TIFF, BMP, WEBP</p>
      {isUploading && (
        <div className="mt-5 flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
          Uploading and analyzing
        </div>
      )}
    </div>
  );
}
