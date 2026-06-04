"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertCanAccessCustomerBranch,
  assertCanEdit,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";
import {
  DEVICE_FILE_BUCKET,
  DEVICE_FILE_CATEGORIES,
  DEVICE_FILE_MAX_BYTES,
  type DeviceFileCategory,
} from "@/lib/constants/device-file";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const categoryValues = DEVICE_FILE_CATEGORIES.map(
  (c) => c.value,
) as [DeviceFileCategory, ...DeviceFileCategory[]];

const uploadSchema = z.object({
  deviceId: z.string().uuid(),
  category: z.enum(categoryValues),
  description: z.string().max(2000).optional().nullable(),
});

export async function uploadDeviceFile(
  formData: FormData,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getDeviceApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Dosya seçilmedi" };
    }

    if (file.size > DEVICE_FILE_MAX_BYTES) {
      return {
        success: false,
        error: "Dosya boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadSchema.parse({
      deviceId: formData.get("deviceId"),
      category: formData.get("category"),
      description: (formData.get("description") as string) || null,
    });

    const { data: device, error: deviceError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        customer_id,
        customers!devices_customer_id_fkey!inner ( branch_id, deleted_at )
      `,
      )
      .eq("id", parsed.deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as typeof device & {
      customers: { branch_id: string; deleted_at: string | null };
    };

    if (row.customers.deleted_at) {
      throw new DeviceApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const fileId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.deviceId}/${fileId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await ctx.supabase.storage
      .from(DEVICE_FILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || "Dosya yüklenemedi",
      };
    }

    const description =
      parsed.description?.trim() ? parsed.description.trim() : null;

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("device_files")
      .insert({
        id: fileId,
        device_id: parsed.deviceId,
        file_name: safeName,
        storage_path: storagePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        category: parsed.category,
        description,
        uploaded_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await ctx.supabase.storage
        .from(DEVICE_FILE_BUCKET)
        .remove([storagePath]);
      throw new Error(insertError?.message ?? "Dosya kaydı oluşturulamadı");
    }

    revalidatePath(`/devices/${parsed.deviceId}`);

    return { success: true, data: { fileId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
