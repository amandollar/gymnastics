/** DiceBear avatars — used when no custom photo is uploaded */

const DICEBEAR_STYLE = "lorelei";

export function buildDiceBearAvatarUrl(
  seed: string,
  size = 256
): string {
  const params = new URLSearchParams({
    seed: seed.trim() || "student",
    size: String(size),
    backgroundColor: "fff7ed,f4f4f5,e0f2fe",
  });
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/png?${params.toString()}`;
}

export function avatarSeedFromStudent(
  studentNumber: number,
  name: string,
  id?: string
): string {
  return `${studentNumber}-${name.trim().toLowerCase().replace(/\s+/g, "-")}${id ? `-${id.slice(-6)}` : ""}`;
}

export function isDiceBearUrl(url: string): boolean {
  return url.includes("api.dicebear.com");
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/** Real photo URL in DB, or local default avatar when none uploaded */
export function getStudentAvatarUrl(student: {
  id: string;
  name: string;
  studentNumber: number;
  gender?: string | null;
  avatarUrl?: string | null;
}): string {
  if (student.avatarUrl && !isDiceBearUrl(student.avatarUrl)) {
    return student.avatarUrl;
  }
  
  const genderLower = (student.gender || "").toLowerCase();
  if (genderLower === "female") {
    return "/female.PNG";
  }
  return "/male.PNG";
}
