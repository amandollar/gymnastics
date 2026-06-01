"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { buildDiceBearAvatarUrl } from "@/lib/utils/avatar";

export default function StudentAvatarPicker({
  name,
  defaultSeed = "new-student",
}: {
  name: string;
  defaultSeed?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const dicebearSrc = useMemo(() => {
    const seed = name.trim() || defaultSeed;
    return buildDiceBearAvatarUrl(seed, 160);
  }, [name, defaultSeed]);

  const displaySrc = previewFile ?? dicebearSrc;

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
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="relative shrink-0">
        <Image
          src={displaySrc}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-full object-cover bg-zinc-100 ring-2 ring-zinc-200/80"
          unoptimized
        />
        {!previewFile && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-white">
            Auto
          </span>
        )}
      </div>

      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
        <p className="text-sm font-medium text-zinc-900">Profile photo</p>
        <p className="text-xs text-zinc-500">
          {previewFile
            ? "Photo will be uploaded to Cloudinary when you save."
            : "A unique avatar is generated from the student’s name. Upload a real photo to replace it."}
        </p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            Upload photo
          </button>
          {previewFile && (
            <button
              type="button"
              onClick={clearUpload}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 cursor-pointer"
            >
              Use generated avatar
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
