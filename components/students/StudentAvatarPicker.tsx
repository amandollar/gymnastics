"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { buildDiceBearAvatarUrl } from "@/lib/utils/avatar";

export default function StudentAvatarPicker({
  name,
  defaultSeed = "new-student",
  currentAvatarUrl,
}: {
  name: string;
  defaultSeed?: string;
  currentAvatarUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const dicebearSrc = useMemo(() => {
    const seed = name.trim() || defaultSeed;
    return buildDiceBearAvatarUrl(seed, 160);
  }, [name, defaultSeed]);

  // Priority: user-selected file > existing avatar > dicebear
  const displaySrc = previewFile ?? currentAvatarUrl ?? dicebearSrc;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewFile(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }
    setPreviewFile(URL.createObjectURL(file));
  }

  function clearUpload() {
    setPreviewFile(null);
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

      {previewFile && (
        <button
          type="button"
          onClick={clearUpload}
          className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
        >
          Remove Photo
        </button>
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
