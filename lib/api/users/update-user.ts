"use server";

import { revalidatePath } from "next/cache";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type { ActionResult } from "@/lib/api/users/types";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { updateUserSchema, type UpdateUserInput } from "@/schemas/user";

export async function updateUser(
  rawInput: UpdateUserInput,
): Promise<ActionResult> {
  try {
    const input = updateUserSchema.parse(rawInput);
    const ctx = await getAdminUserContext();
    const supabase = await createClient();

    if (input.id === ctx.user.id && input.role !== USER_ROLES.ADMIN) {
      return {
        success: false,
        error: "Kendi hesabınızın rolünü personel yapamazsınız",
      };
    }

    const { data: target, error: fetchError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", input.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!target) {
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    const branchId =
      input.role === USER_ROLES.STAFF ? input.branch_id ?? null : null;

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: input.full_name.trim(),
        role: input.role,
        branch_id: branchId,
        updated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) {
      throw new Error(updateError.message);
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
