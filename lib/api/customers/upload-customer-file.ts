"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertCanAccessBranch,
  assertCanEdit,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";
import {
  CUSTOMER_FILE_BUCKET,
  CUSTOMER_FILE_CATEGORIES,
  CUSTOMER_FILE_MAX_BYTES,
  type CustomerFileCategory,
} from "@/lib/constants/customer-file";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const categoryValues = CUSTOMER_FILE_CATEGORIES.map(
  (c) => c.value,
) as [CustomerFileCategory, ...CustomerFileCategory[]];

const uploadSchema = z.object({
  customerId: z.string().uuid(),
  category: z.enum(categoryValues),
  description: z.string().max(2000).optional().nullable(),
});

export async function uploadCustomerFile(
  formData: FormData,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getCustomerApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Dosya seçilmedi" };
    }

    if (file.size > CUSTOMER_FILE_MAX_BYTES) {
      return {
        success: false,
        error: "Dosya boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadSchema.parse({
      customerId: formData.get("customerId"),
      category: formData.get("category"),
      description: (formData.get("description") as string) || null,
    });

    const { data: customer, error: customerError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", parsed.customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (!customer) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const fileId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.customerId}/${fileId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await ctx.supabase.storage
      .from(CUSTOMER_FILE_BUCKET)
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

    const { data: row, error: insertError } = await ctx.supabase
      .from("customer_files")
      .insert({
        id: fileId,
        customer_id: parsed.customerId,
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

    if (insertError || !row) {
      await ctx.supabase.storage
        .from(CUSTOMER_FILE_BUCKET)
        .remove([storagePath]);
      throw new Error(insertError?.message ?? "Dosya kaydı oluşturulamadı");
    }

    revalidatePath(`/customers/${parsed.customerId}`);

    return { success: true, data: { fileId: row.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
