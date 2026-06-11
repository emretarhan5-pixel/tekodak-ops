"use server";

import { revalidatePath } from "next/cache";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type { ActionResult } from "@/lib/api/users/types";
import { createClient } from "@/lib/supabase/server";

export async function activateUser(userId: string): Promise<ActionResult> {
  try {
    const ctx = await getAdminUserContext();
    const supabase = await createClient();

    const { data: target, error: fetchError } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!target) {
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    if (target.is_active) {
      return { success: false, error: "Kullanıcı zaten aktif" };
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    revalidatePath("/settings");

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
