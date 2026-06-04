"use server";

import type { ActionResult } from "@/lib/api/work-orders/types";
import { uploadWorkOrderFile } from "@/lib/api/work-orders/upload-work-order-file";

export async function uploadFile(
  formData: FormData,
): Promise<ActionResult<{ fileId: string }>> {
  return uploadWorkOrderFile(formData);
}
