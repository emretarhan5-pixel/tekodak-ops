import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

export async function assertTargetUserExists(
  admin: AdminClient,
  userId: string,
): Promise<{ id: string; is_active: boolean; role: "admin" | "staff" }> {
  const { data: target, error } = await admin
    .from("users")
    .select("id, is_active, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!target || target.is_active == null) {
    throw new Error("Kullanıcı bulunamadı");
  }

  if (target.role !== "admin" && target.role !== "staff") {
    throw new Error("Geçersiz kullanıcı rolü");
  }

  return {
    id: target.id,
    is_active: target.is_active,
    role: target.role,
  };
}

export async function assertNotLastActiveAdmin(
  admin: AdminClient,
  userId: string,
  role: "admin" | "staff",
): Promise<void> {
  if (role !== "admin") {
    return;
  }

  const { count, error } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const { data: targetIsActive } = await admin
    .from("users")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle();

  const activeAdminCount = count ?? 0;

  if (targetIsActive?.is_active && activeAdminCount <= 1) {
    throw new Error("Sistemde en az bir aktif yönetici kalmalıdır");
  }
}

export async function deactivateUserProfile(
  admin: AdminClient,
  userId: string,
  updatedBy: string,
): Promise<void> {
  const { data, error } = await admin
    .from("users")
    .update({
      is_active: false,
      updated_by: updatedBy,
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
    throw new Error("Kullanıcı pasifleştirilemedi");
  }
}

export async function banAuthUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function unbanAuthUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function softDeleteUserProfile(
  admin: AdminClient,
  userId: string,
  deletedBy: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("users")
    .update({
      deleted_at: now,
      deleted_by: deletedBy,
      is_active: false,
      updated_by: deletedBy,
      updated_at: now,
    })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Kullanıcı kaydı silinemedi");
  }
}

export async function removeAuthUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (!error) {
    return;
  }

  const message = error.message.toLowerCase();
  if (
    message.includes("not found") ||
    message.includes("user not found") ||
    message.includes("unable to find")
  ) {
    return;
  }

  throw new Error(error.message);
}

export function createUsersAdminClient(): AdminClient {
  return createAdminClient();
}
