"use server";

import { revalidatePath } from "next/cache";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import type { ActionResult } from "@/lib/api/users/types";
import {
  assertTargetUserExists,
  createUsersAdminClient,
  unbanAuthUser,
} from "@/lib/api/users/user-lifecycle-core";

export async function activateUser(userId: string): Promise<ActionResult> {
  try {
    const ctx = await getAdminUserContext();
    const admin = createUsersAdminClient();
    const target = await assertTargetUserExists(admin, userId);

    if (target.is_active) {
      return { success: false, error: "Kullanıcı zaten aktif" };
    }

    const { data, error } = await admin
      .from("users")
      .update({
        is_active: true,
        updated_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return { success: false, error: "Kullanıcı aktifleştirilemedi" };
    }

    await unbanAuthUser(userId);

    revalidatePath("/settings");

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
