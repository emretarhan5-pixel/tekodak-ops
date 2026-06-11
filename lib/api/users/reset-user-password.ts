"use server";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import { createUsersAdminClient } from "@/lib/api/users/user-lifecycle-core";
import type { ActionResult } from "@/lib/api/users/types";
import { getAppBaseUrl } from "@/lib/email/config";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { setUserPasswordSchema } from "@/schemas/user";

async function getTargetUser(userId: string, email: string) {
  const admin = createUsersAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: user, error } = await admin
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!user || user.email.trim().toLowerCase() !== normalizedEmail) {
    return null;
  }

  return user;
}

export async function sendPasswordReset(
  userId: string,
  email: string,
): Promise<ActionResult> {
  try {
    await getAdminUserContext();

    const user = await getTargetUser(userId, email);
    if (!user) {
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    const admin = createUsersAdminClient();
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email: user.email,
        options: {
          redirectTo: `${getAppBaseUrl()}/reset-password`,
        },
      });

    if (linkError) {
      throw new Error(linkError.message);
    }

    const resetUrl = linkData.properties?.action_link;
    if (!resetUrl) {
      throw new Error("Sıfırlama bağlantısı oluşturulamadı");
    }

    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.full_name,
      resetUrl,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}

export async function setUserPassword(
  userId: string,
  password: string,
  confirmPassword: string,
): Promise<ActionResult> {
  try {
    await getAdminUserContext();
    setUserPasswordSchema.parse({ password, confirmPassword });

    const admin = createUsersAdminClient();

    const { data: user, error: fetchError } = await admin
      .from("users")
      .select("id")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!user) {
      return { success: false, error: "Kullanıcı bulunamadı" };
    }

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
