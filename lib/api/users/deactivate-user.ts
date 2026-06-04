"use server";

import { revalidatePath } from "next/cache";

import { getOpenWorkOrdersForUser } from "@/lib/api/users/count-open-work-orders";
import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type { ActionResult, DeactivateUserResult } from "@/lib/api/users/types";
import { createClient } from "@/lib/supabase/server";

export async function deactivateUser(
  userId: string,
): Promise<ActionResult<DeactivateUserResult>> {
  try {
    const ctx = await getAdminUserContext();

    if (userId === ctx.user.id) {
      return {
        success: false,
        error: "Kendi hesabınızı pasifleştiremezsiniz",
      };
    }

    const supabase = await createClient();

    const { data: target, error: fetchError } = await supabase
      .from("users")
      .select("id, is_active, role")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!target) {
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    if (!target.is_active) {
      return { success: false, error: "Kullanıcı zaten pasif" };
    }

    if (target.role === "admin") {
      const { count: adminCount, error: adminCountError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true)
        .is("deleted_at", null);

      if (adminCountError) {
        throw new Error(adminCountError.message);
      }

      if ((adminCount ?? 0) <= 1) {
        return {
          success: false,
          error: "Sistemde en az bir aktif yönetici kalmalıdır",
        };
      }
    }

    const openWorkOrders = await getOpenWorkOrdersForUser(userId);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: false,
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
      ban_duration: "876000h",
    });

    revalidatePath("/settings");

    return {
      success: true,
      data: { openWorkOrders },
    };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
