"use server";

import {
  getTargetApiContext,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import type { TargetFilterOptions } from "@/lib/api/targets/types";

export async function getTargetFilterOptions(): Promise<TargetFilterOptions> {
  try {
    const ctx = await getTargetApiContext();

    const branchesRes = ctx.branchScope
      ? await ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("id", ctx.branchScope)
          .maybeSingle()
      : await ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("is_active", true)
          .order("name", { ascending: true });

    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }

    let branches: TargetFilterOptions["branches"] = [];

    if (ctx.branchScope) {
      const row = branchesRes.data as {
        id: string;
        name: string;
        code: string;
      } | null;
      if (row) {
        branches = [row];
      }
    } else {
      branches = (branchesRes.data ?? []) as TargetFilterOptions["branches"];
    }

    return { branches };
  } catch (error) {
    if (error instanceof TargetApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
