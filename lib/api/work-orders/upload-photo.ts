"use server";

import type { ActionResult } from "@/lib/api/work-orders/types";
import { uploadWorkOrderPhoto } from "@/lib/api/work-orders/upload-work-order-photo";

export async function uploadPhoto(
  formData: FormData,
): Promise<ActionResult<{ photoId: string }>> {
  return uploadWorkOrderPhoto(formData);
}
