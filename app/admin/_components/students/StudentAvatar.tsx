"use client";

import Image from "next/image";
import { getStudentAvatarUrl, isDiceBearUrl } from "@/lib/utils/avatar";

type StudentLike = {
  id: string;
  name: string;
  studentNumber: number;
  gender?: string | null;
  avatarUrl?: string | null;
};

const sizeMap = {
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
  96: 96,
  128: 128,
} as const;

type StudentAvatarSize = keyof typeof sizeMap | number;

export default function StudentAvatar({
  student,
  size = 40,
  className = "",
}: {
  student: StudentLike;
  size?: StudentAvatarSize;
  className?: string;
}) {
  const src = getStudentAvatarUrl(student);
  const px = typeof size === "number" ? size : sizeMap[size];

  return (
    <Image
      src={src}
      alt=""
      width={px}
      height={px}
      className={`rounded-full object-cover bg-zinc-100 shrink-0 ${className}`}
      style={{ width: px, height: px }}
      unoptimized={isDiceBearUrl(src)}
    />
  );
}


