"use server";

import { revalidatePath } from "next/cache";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import { reassignUserTasks } from "@/lib/api/users/reassign-user-tasks";
import type {
  ActionResult,
  DeactivateUserInput,
  DeactivateUserResult,
} from "@/lib/api/users/types";
import {
  assertNotLastActiveAdmin,
  assertTargetUserExists,
  banAuthUser,
  createUsersAdminClient,
  deactivateUserProfile,
} from "@/lib/api/users/user-lifecycle-core";

export async function deactivateUser(
  input: DeactivateUserInput,
): Promise<ActionResult<DeactivateUserResult>> {
  try {
    const ctx = await getAdminUserContext();
    const { userId, reassignToTechnicianId } = input;

    if (userId === ctx.user.id) {
      return {
        success: false,
        error: "Kendi hesabınızı pasifleştiremezsiniz",
      };
    }

    const admin = createUsersAdminClient();
    const target = await assertTargetUserExists(admin, userId);

    if (!target.is_active) {
      return { success: false, error: "Kullanıcı zaten pasif" };
    }

    await assertNotLastActiveAdmin(admin, userId, target.role);

    if (reassignToTechnicianId) {
      const reassignResult = await reassignUserTasks(
        userId,
        reassignToTechnicianId,
      );

      if (!reassignResult.success) {
        return { success: false, error: reassignResult.error };
      }
    }

    await deactivateUserProfile(admin, userId, ctx.user.id);
    await banAuthUser(userId);

    revalidatePath("/settings");

    return {
      success: true,
      data: {},
    };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
