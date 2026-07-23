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
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white"
      }`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
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
      <p className="text-sm font-medium text-slate-700">
        Drag & drop a PDF or image here, or{" "}
        <label className="cursor-pointer text-brand-600 underline underline-offset-2">
          browse
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
      </p>
      <p className="mt-1 text-xs text-slate-400">PDF, PNG, JPG, TIFF, BMP, WEBP up to 25MB</p>
      {isUploading && <p className="mt-4 text-sm font-medium text-brand-600">Uploading & analyzing...</p>}
    </div>
  );
}
