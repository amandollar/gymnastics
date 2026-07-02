import { prisma } from "@/lib/prisma";

export async function getAcademyProfile() {
  let profile = await prisma.academyProfile.findFirst();
  if (!profile) {
    profile = await prisma.academyProfile.create({
      data: {
        email: "",
        phone: "9999999999",
        phone2: "9999999999",
        address: "Academy Address\nCity, State\nPincode",
        website: "www.academy.com",
      },
    });
  }
  return profile;
}

export async function updateAcademyProfile(data: {
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  website?: string;
  parentPortalUrl?: string;
}) {
  const profile = await getAcademyProfile();
  return prisma.academyProfile.update({
    where: { id: profile.id },
    data: {
      email: data.email ?? null,
      phone: data.phone ?? null,
      phone2: data.phone2 ?? null,
      address: data.address ?? null,
      website: data.website ?? null,
      parentPortalUrl: data.parentPortalUrl ?? null,
    },
  });
}
