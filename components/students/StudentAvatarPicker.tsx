"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentAvatarPicker({
  name,
  gender,
  currentAvatarUrl,
}: {
  name: string;
  gender?: string | null;
  currentAvatarUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);

  const defaultSrc = useMemo(() => {
    const genderLower = (gender || "").toLowerCase();
    if (genderLower === "female") {
      return "/women.png";
    }
    return "/man.png";
  }, [gender]);

  // Priority: user-selected file > existing avatar > local default
  const displaySrc = previewFile ?? currentAvatarUrl ?? defaultSrc;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError(null);
    setFileInfo(null);

    if (!file) {
      setPreviewFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported format. Please use JPG, PNG, or WebP.");
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(
        `File is ${formatFileSize(file.size)} — exceeds the ${MAX_SIZE_MB} MB limit. Try a smaller photo or compress it.`
      );
      e.target.value = "";
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    setPreviewFile(URL.createObjectURL(file));
  }

  function clearUpload() {
    setPreviewFile(null);
    setUploadError(null);
    setFileInfo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div 
        onClick={() => inputRef.current?.click()}
        className="group relative h-24 w-24 cursor-pointer"
      >
        <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-zinc-100 dark:ring-zinc-800/80 group-hover:ring-brand-orange-500/30 transition-all duration-300">
          <Image
            src={displaySrc}
            alt="Avatar"
            width={96}
            height={96}
            className="h-24 w-24 object-cover bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-[10px] text-white font-bold uppercase tracking-wider mt-1">Upload</span>
          </div>
        </div>

        {/* Camera Indicator Badge (Outside overflow-hidden boundary) */}
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-zinc-900/90 dark:bg-zinc-800 text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-md pointer-events-none group-hover:scale-110 transition-transform duration-300 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </div>
      </div>

      {/* Success state: file info + remove button */}
      {previewFile && fileInfo && (
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            {formatFileSize(fileInfo.size)}
          </span>
          <button
            type="button"
            onClick={clearUpload}
            className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            Remove Photo
          </button>
        </div>
      )}

      {/* Error state: inline error message */}
      {uploadError && (
        <div className="flex items-start gap-1.5 max-w-[220px] text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-tight">
            {uploadError}
          </p>
        </div>
      )}

      {/* Guidance hint — shown only when no file is selected and no error */}
      {!previewFile && !uploadError && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed max-w-[200px]">
          JPG recommended · Max 2 MB
          <br />
          <span className="text-zinc-350 dark:text-zinc-600">
            PNG, WebP, GIF also supported
          </span>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
