"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

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

  // Crop & zoom states
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const defaultSrc = useMemo(() => {
    const genderLower = (gender || "").toLowerCase();
    if (genderLower === "female") {
      return "/women.png";
    }
    return "/man.png";
  }, [gender]);

  // Priority: user-selected file > existing avatar > local default
  const displaySrc = previewFile ?? currentAvatarUrl ?? defaultSrc;

  const scaleBase = useMemo(() => {
    if (!imgSize.w || !imgSize.h) return 1;
    return Math.max(300 / imgSize.w, 300 / imgSize.h);
  }, [imgSize]);

  const getClampedPan = (x: number, y: number, currentZoom: number) => {
    if (!imgSize.w || !imgSize.h) return { x: 0, y: 0 };
    const wScaled = imgSize.w * scaleBase * currentZoom;
    const hScaled = imgSize.h * scaleBase * currentZoom;
    const maxPanX = Math.max(0, (wScaled - 300) / 2);
    const minPanX = -maxPanX;
    const maxPanY = Math.max(0, (hScaled - 300) / 2);
    const minPanY = -maxPanY;
    return {
      x: Math.min(Math.max(x, minPanX), maxPanX),
      y: Math.min(Math.max(y, minPanY), maxPanY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPan(getClampedPan(newX, newY, zoom));
  };

  const handleMouseUpOrLeave = () => {
    setDragStart(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setPan(getClampedPan(newX, newY, zoom));
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setPan((prev) => getClampedPan(prev.x, prev.y, newZoom));
  };

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCropApply = () => {
    if (!cropSrc || !imgSize.w || !imgSize.h) return;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill canvas background with white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);

      // Replicate visually-seen zoom, pan, and base scale to 512x512
      ctx.scale(512 / 300, 512 / 300);
      ctx.translate(150 + pan.x, 150 + pan.y);
      ctx.scale(zoom, zoom);

      const drawW = imgSize.w * scaleBase;
      const drawH = imgSize.h * scaleBase;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          const nameWithoutExt = (fileInfo?.name || "avatar.jpg").replace(/\.[^/.]+$/, "");
          const croppedFile = new File([blob], `${nameWithoutExt}_cropped.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          setFileInfo({ name: croppedFile.name, size: croppedFile.size });
          setPreviewFile(URL.createObjectURL(croppedFile));

          // Set the file input files
          if (inputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(croppedFile);
            inputRef.current.files = dataTransfer.files;
          }

          setCropSrc(null);
        },
        "image/jpeg",
        0.85
      );
    };
    img.src = cropSrc;
  };

  const handleCancelCrop = () => {
    setCropSrc(null);
    if (!previewFile) {
      setFileInfo(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported format. Please use JPG, PNG, or WebP.");
      e.target.value = "";
      return;
    }

    setFileInfo({ name: file.name, size: file.size });

    // Load file as data URL to pass to cropper
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span className="text-[10px] text-white font-bold uppercase tracking-wider mt-1">Upload</span>
          </div>
        </div>

        {/* Camera Indicator Badge (Outside overflow-hidden boundary) */}
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-zinc-900/90 dark:bg-zinc-800 text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-md pointer-events-none group-hover:scale-110 transition-transform duration-300 z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
        </div>
      </div>

      {/* Success state: file info + remove button */}
      {previewFile && fileInfo && (
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-tight">
            {uploadError}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Image Crop Modal Popup */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Crop Profile Photo</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">
                Drag to position, slider to zoom. Will be resized to a square photo.
              </p>
            </div>

            {/* Viewport Frame */}
            <div className="flex justify-center">
              <div
                className="relative h-[300px] w-[300px] overflow-hidden rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 cursor-move select-none shadow-inner"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
              >
                {/* Visual Viewport Circle Guide overlay if wanted, or just standard crop border */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-black/10 ring-inset z-10" />

                {/* The Image inside crop viewport */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoaded}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scaleBase * zoom})`,
                    transformOrigin: "center",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  className="pointer-events-none"
                />
              </div>
            </div>

            {/* Slider zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-brand-orange-500 cursor-pointer focus:outline-none"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropApply}
                className="flex-1 rounded-xl bg-brand-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-600 transition-colors"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
