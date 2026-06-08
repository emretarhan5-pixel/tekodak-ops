"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import {
  assertStatus,
  loadServiceRequestForEdit,
} from "@/lib/api/service-requests/service-request-helpers";
import { revalidateServiceRequestPaths } from "@/lib/api/service-requests/service-request-revalidate-paths";
import type { ActionResult } from "@/lib/api/service-requests/types";
import { refreshCurrentStock } from "@/lib/api/stock/stock-helpers";

export async function removeServiceRequestPart(
  partRowId: string,
): Promise<ActionResult<{ partRowId: string }>> {
  try {
    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    const { data: partRow, error: loadError } = await ctx.supabase
      .from("service_request_parts")
      .select("id, service_request_id, part_id")
      .eq("id", partRowId)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!partRow) {
      throw new ServiceRequestApiError("Parça kaydı bulunamadı", "NOT_FOUND");
    }

    const row = await loadServiceRequestForEdit(ctx, partRow.service_request_id);
    assertStatus(row, ["teklif_onaylandi"]);

    const { error: deleteError } = await ctx.supabase
      .from("service_request_parts")
      .delete()
      .eq("id", partRowId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await refreshCurrentStock(ctx.supabase);
    revalidateServiceRequestPaths(partRow.service_request_id);
    revalidatePath("/stock");
    revalidatePath(`/stock/${partRow.part_id}`);

    return { success: true, data: { partRowId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
