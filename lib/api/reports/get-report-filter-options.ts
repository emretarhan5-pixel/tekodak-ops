"use server";

import {
  getReportApiContext,
  ReportApiError,
  toActionError,
} from "@/lib/api/reports/auth";
import type { ReportFilterOptions } from "@/lib/api/reports/types";

export async function getReportFilterOptions(): Promise<ReportFilterOptions> {
  try {
    const ctx = await getReportApiContext();

    if (ctx.branchScope) {
      const { data, error } = await ctx.supabase
        .from("branches")
        .select("id, name, code")
        .eq("id", ctx.branchScope)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return {
        branches: data ? [data] : [],
      };
    }

    const { data, error } = await ctx.supabase
      .from("branches")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return {
      branches: data ?? [],
    };
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
