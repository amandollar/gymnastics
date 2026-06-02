import { prisma } from "@/lib/prisma";
import type { EnquiryStatus } from "@prisma/client";

export async function getNextEnquiryNumber(): Promise<number> {
  const result = await prisma.enquiry.aggregate({
    _max: { enquiryNumber: true },
  });
  return (result._max.enquiryNumber ?? 0) + 1;
}

export async function listEnquiries(filters?: {
  search?: string;
  status?: EnquiryStatus | "ALL";
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.search) {
    const q = filters.search;
    where.OR = [
      { childName: { contains: q, mode: "insensitive" } },
      { parentName: { contains: q, mode: "insensitive" } },
      { contactNumber: { contains: q } },
    ];
  }

  return prisma.enquiry.findMany({
    where,
    orderBy: { enquiryNumber: "desc" },
  });
}

export async function getEnquiryById(id: string) {
  return prisma.enquiry.findUnique({
    where: { id },
  });
}

export async function createEnquiry(data: {
  childName: string;
  childAge?: number;
  gender?: string;
  parentName: string;
  contactNumber: string;
  source?: string;
  interestedIn?: string;
  notes?: string;
  followUpDate?: Date | null;
}) {
  const enquiryNumber = await getNextEnquiryNumber();

  return prisma.enquiry.create({
    data: {
      enquiryNumber,
      childName: data.childName,
      childAge: data.childAge ?? null,
      gender: data.gender ?? null,
      parentName: data.parentName,
      contactNumber: data.contactNumber,
      source: data.source ?? null,
      interestedIn: data.interestedIn ?? null,
      notes: data.notes ?? null,
      followUpDate: data.followUpDate ?? null,
    },
  });
}

export async function updateEnquiry(
  id: string,
  data: {
    childName: string;
    childAge?: number;
    gender?: string;
    parentName: string;
    contactNumber: string;
    source?: string;
    interestedIn?: string;
    status: EnquiryStatus;
    notes?: string;
    followUpDate?: Date | null;
  }
) {
  return prisma.enquiry.update({
    where: { id },
    data: {
      childName: data.childName,
      childAge: data.childAge ?? null,
      gender: data.gender ?? null,
      parentName: data.parentName,
      contactNumber: data.contactNumber,
      source: data.source ?? null,
      interestedIn: data.interestedIn ?? null,
      status: data.status,
      notes: data.notes ?? null,
      followUpDate: data.followUpDate ?? null,
    },
  });
}

export async function deleteEnquiry(id: string) {
  return prisma.enquiry.delete({
    where: { id },
  });
}
