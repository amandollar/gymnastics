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
  if (!session || (role !== "ADMIN" && role !== "MANAGER")) {
    throw new Error("Unauthorized: only admins and managers can manage batches");
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
    const timing = (formData.get("timing") as string | null)?.trim() ?? "";
    if (!name) return { success: false, message: "Batch name is required" };
    if (!timing) return { success: false, message: "Batch timing is required" };
    await createBatch(name, timing);
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
    const timing = (formData.get("timing") as string | null)?.trim() ?? "";
    if (!id) return { success: false, message: "Batch ID is required" };
    if (!name) return { success: false, message: "Batch name is required" };
    if (!timing) return { success: false, message: "Batch timing is required" };
    await renameBatch(id, name, timing);
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
