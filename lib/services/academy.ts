import { prisma } from "@/lib/prisma";

export async function getAcademyProfile() {
  let profile = await prisma.academyProfile.findFirst();
  if (!profile) {
    profile = await prisma.academyProfile.create({
      data: {
        email: "",
        phone: "7977177463",
        phone2: "7757965651",
        address: "Office No 7, 2nd floor, Nine Hills Plaza\nopposite Tribeca High street NIBM Annexe\nPune 411060",
        website: "www.theacademyofgymnastics.com",
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
