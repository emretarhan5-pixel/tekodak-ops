"use server";

import { revalidatePath } from "next/cache";

import { getAdminUserContext } from "@/lib/api/users/auth";
import {
  toUsersActionError,
  UsersApiError,
} from "@/lib/api/users/auth.types";
import { generateTemporaryPassword } from "@/lib/api/users/generate-password";
import type { ActionResult, InviteUserResult } from "@/lib/api/users/types";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/email/config";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";
import { inviteUserSchema, type InviteUserInput } from "@/schemas/user";

export async function inviteUser(
  rawInput: InviteUserInput,
): Promise<ActionResult<InviteUserResult>> {
  try {
    const input = inviteUserSchema.parse(rawInput);
    const ctx = await getAdminUserContext();
    const supabase = await createClient();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const email = input.email.trim().toLowerCase();

    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingProfile) {
      return {
        success: false,
        error: "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var",
      };
    }

    const temporaryPassword =
      input.temporary_password?.trim() || generateTemporaryPassword();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name.trim(),
        },
      });

    if (authError || !authData.user) {
      if (authError?.message?.includes("already been registered")) {
        return {
          success: false,
          error: "Bu e-posta adresi zaten kayıtlı",
        };
      }
      throw new Error(authError?.message ?? "Auth kullanıcısı oluşturulamadı");
    }

    const userId = authData.user.id;
    const branchId =
      input.role === USER_ROLES.STAFF ? input.branch_id ?? null : null;

    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      email,
      full_name: input.full_name.trim(),
      role: input.role,
      branch_id: branchId,
      is_active: true,
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      if (profileError.code === "23505") {
        return {
          success: false,
          error: "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var",
        };
      }
      throw new Error(profileError.message);
    }

    let recoveryLink: string | null = null;

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

    if (!linkError && linkData.properties?.action_link) {
      recoveryLink = linkData.properties.action_link;
    }

    revalidatePath("/settings");

    try {
      const loginUrl = recoveryLink ?? `${getAppBaseUrl()}/login`;
      await sendWelcomeEmail({
        to: email,
        fullName: input.full_name.trim(),
        loginUrl,
        temporaryPassword,
      });
    } catch (emailErr) {
      console.error(
        "[email] Davet e-postası gönderilemedi:",
        email,
        emailErr instanceof Error ? emailErr.message : emailErr,
      );
    }

    return {
      success: true,
      data: {
        userId,
        email,
        temporaryPassword,
        recoveryLink,
      },
    };
  } catch (error) {
    if (error instanceof UsersApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toUsersActionError(error) };
  }
}
