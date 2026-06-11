"use server";

import { revalidatePath } from "next/cache";

import { deactivateUser } from "@/lib/api/users/deactivate-user";
import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type { ActionResult, DeleteUserInput } from "@/lib/api/users/types";
import { createClient } from "@/lib/supabase/server";

export async function deleteUser(
  input: DeleteUserInput,
): Promise<ActionResult> {
  try {
    const ctx = await getAdminUserContext();
    const { userId, reassignToTechnicianId } = input;

    if (userId === ctx.user.id) {
      return {
        success: false,
        error: "Kendi hesabınızı silemezsiniz",
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

    if (target.is_active) {
      const deactivateResult = await deactivateUser({
        userId,
        reassignToTechnicianId,
      });

      if (!deactivateResult.success) {
        return { success: false, error: deactivateResult.error };
      }
    } else if (reassignToTechnicianId) {
      const { reassignUserTasks } = await import(
        "@/lib/api/users/reassign-user-tasks"
      );
      const reassignResult = await reassignUserTasks(
        userId,
        reassignToTechnicianId,
      );

      if (!reassignResult.success) {
        return { success: false, error: reassignResult.error };
      }
    }

    const now = new Date().toISOString();

    const { error: softDeleteError } = await supabase
      .from("users")
      .update({
        deleted_at: now,
        is_active: false,
        updated_by: ctx.user.id,
        updated_at: now,
      })
      .eq("id", userId);

    if (softDeleteError) {
      throw new Error(softDeleteError.message);
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw new Error(authDeleteError.message);
    }

    revalidatePath("/settings");

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
