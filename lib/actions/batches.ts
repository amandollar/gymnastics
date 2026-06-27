"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import {
  listBatches,
  createBatch,
  renameBatch,
  deleteBatch,
} from "@/lib/services/batches";

type ActionResult = { success: boolean; message?: string };

async function assertCanManage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    throw new Error("Unauthorized: only admins can manage batches");
  }
}

/** Fetch all batches (with student count) — safe to call from server components or actions. */
export async function listBatchesAction() {
  return listBatches();
}

export async function createBatchAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertCanManage();
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const startTimeVal = (formData.get("startTimeVal") as string | null)?.trim() ?? "";
    const startTimePeriod = (formData.get("startTimePeriod") as string | null)?.trim() ?? "";
    const endTimeVal = (formData.get("endTimeVal") as string | null)?.trim() ?? "";
    const endTimePeriod = (formData.get("endTimePeriod") as string | null)?.trim() ?? "";
    const startTime = startTimeVal && startTimePeriod ? `${startTimeVal} ${startTimePeriod}` : "";
    const endTime = endTimeVal && endTimePeriod ? `${endTimeVal} ${endTimePeriod}` : "";
    const timing = startTime && endTime ? `${startTime} – ${endTime}` : "";
    const startAge = parseInt(formData.get("startAge") as string) ?? 0;
    const endAge = parseInt(formData.get("endAge") as string) ?? 99;
    const useDefaultPricing = formData.get("useDefaultPricing") === "true";

    if (!name) return { success: false, message: "Batch name is required" };
    if (!timing) return { success: false, message: "Batch timing is required" };

    const pricing = {
      price1d: useDefaultPricing ? null : (parseInt(formData.get("price1d") as string) || 0),
      price2d: useDefaultPricing ? null : (parseInt(formData.get("price2d") as string) || 0),
      price3d: useDefaultPricing ? null : (parseInt(formData.get("price3d") as string) || 0),
      price4d: useDefaultPricing ? null : (parseInt(formData.get("price4d") as string) || 0),
      price5d: useDefaultPricing ? null : (parseInt(formData.get("price5d") as string) || 0),
      price6d: useDefaultPricing ? null : (parseInt(formData.get("price6d") as string) || 0),
    };

    await createBatch(name, timing, startAge, endAge, useDefaultPricing, pricing);
    revalidatePath("/admin/plans");
    updateTag("batches");
    return { success: true, message: "Batch created successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create batch",
    };
  }
}

export async function renameBatchAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertCanManage();
    const id = (formData.get("id") as string | null)?.trim() ?? "";
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const startTimeVal = (formData.get("startTimeVal") as string | null)?.trim() ?? "";
    const startTimePeriod = (formData.get("startTimePeriod") as string | null)?.trim() ?? "";
    const endTimeVal = (formData.get("endTimeVal") as string | null)?.trim() ?? "";
    const endTimePeriod = (formData.get("endTimePeriod") as string | null)?.trim() ?? "";
    const startTime = startTimeVal && startTimePeriod ? `${startTimeVal} ${startTimePeriod}` : "";
    const endTime = endTimeVal && endTimePeriod ? `${endTimeVal} ${endTimePeriod}` : "";
    const timing = startTime && endTime ? `${startTime} – ${endTime}` : "";
    const startAge = parseInt(formData.get("startAge") as string) ?? 0;
    const endAge = parseInt(formData.get("endAge") as string) ?? 99;
    const useDefaultPricing = formData.get("useDefaultPricing") === "true";

    if (!id) return { success: false, message: "Batch ID is required" };
    if (!name) return { success: false, message: "Batch name is required" };
    if (!timing) return { success: false, message: "Batch timing is required" };

    const pricing = {
      price1d: useDefaultPricing ? null : (parseInt(formData.get("price1d") as string) || 0),
      price2d: useDefaultPricing ? null : (parseInt(formData.get("price2d") as string) || 0),
      price3d: useDefaultPricing ? null : (parseInt(formData.get("price3d") as string) || 0),
      price4d: useDefaultPricing ? null : (parseInt(formData.get("price4d") as string) || 0),
      price5d: useDefaultPricing ? null : (parseInt(formData.get("price5d") as string) || 0),
      price6d: useDefaultPricing ? null : (parseInt(formData.get("price6d") as string) || 0),
    };

    await renameBatch(id, name, timing, startAge, endAge, useDefaultPricing, pricing);
    revalidatePath("/admin/plans");
    updateTag("batches");
    return { success: true, message: "Batch updated" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update batch",
    };
  }
}

export async function deleteBatchAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertCanManage();
    const id = (formData.get("id") as string | null)?.trim() ?? "";
    if (!id) return { success: false, message: "Batch ID is required" };
    await deleteBatch(id);
    revalidatePath("/admin/plans");
    updateTag("batches");
    updateTag("students");
    return { success: true, message: "Batch deleted and students unassigned" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to delete batch",
    };
  }
}
