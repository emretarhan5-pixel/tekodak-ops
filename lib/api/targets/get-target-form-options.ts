"use server";

import {
  getTargetApiContext,
  resolveBranchFilter,
  toActionError,
  TargetApiError,
} from "@/lib/api/targets/auth";
import type { TargetFormOptions } from "@/lib/api/targets/types";

export async function getTargetFormOptions(
  branchId?: string,
): Promise<TargetFormOptions> {
  try {
    const ctx = await getTargetApiContext();
    const branchFilter = resolveBranchFilter(ctx, branchId) ?? branchId;

    let branchesQuery = ctx.supabase
      .from("branches")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (branchFilter) {
      branchesQuery = branchesQuery.eq("id", branchFilter);
    }

    let usersQuery = ctx.supabase
      .from("users")
      .select("id, full_name, branch_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name", { ascending: true });

    if (branchFilter) {
      usersQuery = usersQuery.eq("branch_id", branchFilter);
    }

    const [branchesRes, usersRes] = await Promise.all([
      branchesQuery,
      usersQuery,
    ]);

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (usersRes.error) {
      throw new Error(usersRes.error.message);
    }

    const branches = branchesRes.data ?? [];
    const defaultBranchId =
      ctx.branchScope ?? branches[0]?.id ?? null;

    return {
      branches,
      assignees: usersRes.data ?? [],
      defaultBranchId,
    };
  } catch (error) {
    if (error instanceof TargetApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
