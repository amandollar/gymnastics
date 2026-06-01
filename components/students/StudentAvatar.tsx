"use client";

import Image from "next/image";
import { getStudentAvatarUrl, isDiceBearUrl } from "@/lib/utils/avatar";

type StudentLike = {
  id: string;
  name: string;
  studentNumber: number;
  avatarUrl?: string | null;
};

const sizeMap = {
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
} as const;

export default function StudentAvatar({
  student,
  size = 40,
  className = "",
}: {
  student: StudentLike;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const src = getStudentAvatarUrl(student);
  const px = sizeMap[size];

  return (
    <Image
      src={src}
      alt=""
      width={px}
      height={px}
      className={`rounded-full object-cover bg-zinc-100 ring-1 ring-zinc-200/80 shrink-0 ${className}`}
      style={{ width: px, height: px }}
      unoptimized={isDiceBearUrl(src)}
    />
  );
}
