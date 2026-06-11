"use server";

import {
  DashboardApiError,
  getDashboardApiContext,
  toDashboardError,
} from "@/lib/api/dashboard/auth";
import type {
  GlobalSearchContractItem,
  GlobalSearchCustomerItem,
  GlobalSearchDeviceItem,
  GlobalSearchResponse,
  GlobalSearchResult,
  GlobalSearchServiceRequestItem,
} from "@/lib/api/search/types";
import {
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/constants/contract";
import {
  SERVICE_REQUEST_STATUS_LABELS,
  type ServiceRequestStatus,
} from "@/lib/constants/service-request";

const DISPLAY_LIMIT = 3;
const MIN_QUERY_LENGTH = 2;
const LOOKUP_LIMIT = 50;

function escapeIlikeTerm(raw: string): string {
  return raw.trim().replace(/%/g, "\\%");
}

function emptyResult(): GlobalSearchResult {
  return {
    customers: { items: [], total: 0 },
    devices: { items: [], total: 0 },
    contracts: { items: [], total: 0 },
    service_requests: { items: [], total: 0 },
  };
}

function mergeUniqueById<T extends { id: string }>(
  rows: T[],
  limit: number,
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
    if (merged.length >= limit) break;
  }

  return merged;
}

async function searchCustomers(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  term: string,
  branchId?: string,
): Promise<{ items: GlobalSearchCustomerItem[]; total: number }> {
  const pattern = `%${term}%`;

  const { data: contactRows } = await supabase
    .from("customer_contacts")
    .select("customer_id")
    .ilike("full_name", pattern)
    .limit(LOOKUP_LIMIT);

  const contactCustomerIds = [
    ...new Set((contactRows ?? []).map((row) => row.customer_id)),
  ];

  let byNameQuery = supabase
    .from("customers")
    .select("id, name, city")
    .is("deleted_at", null)
    .ilike("name", pattern);

  if (branchId) {
    byNameQuery = byNameQuery.eq("branch_id", branchId);
  }

  const byNamePromise = byNameQuery.order("name", { ascending: true }).limit(
    LOOKUP_LIMIT,
  );

  const byContactPromise =
    contactCustomerIds.length > 0
      ? (() => {
          let query = supabase
            .from("customers")
            .select("id, name, city")
            .is("deleted_at", null)
            .in("id", contactCustomerIds);

          if (branchId) {
            query = query.eq("branch_id", branchId);
          }

          return query.order("name", { ascending: true }).limit(LOOKUP_LIMIT);
        })()
      : Promise.resolve({ data: [], error: null });

  const [{ data: byName, error: nameError }, { data: byContact, error: contactError }] =
    await Promise.all([byNamePromise, byContactPromise]);

  if (nameError) {
    throw new Error(nameError.message);
  }
  if (contactError) {
    throw new Error(contactError.message);
  }

  const merged = mergeUniqueById(
    [...(byName ?? []), ...(byContact ?? [])],
    DISPLAY_LIMIT,
  );

  return {
    items: merged.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
    })),
    total: mergeUniqueById([...(byName ?? []), ...(byContact ?? [])], LOOKUP_LIMIT)
      .length,
  };
}

type RawDeviceRow = {
  id: string;
  serial_number: string;
  customer_id: string;
  brand_id: string;
  model_id: string;
};

type SearchSupabaseClient = Awaited<
  ReturnType<typeof getDashboardApiContext>
>["supabase"];

function createDevicesBaseQuery(
  supabase: SearchSupabaseClient,
  branchId?: string,
) {
  let query = supabase
    .from("devices")
    .select("id, serial_number, customer_id, brand_id, model_id")
    .is("deleted_at", null);

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  return query;
}

type DevicesBaseQuery = ReturnType<typeof createDevicesBaseQuery>;

async function enrichDevices(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  rows: RawDeviceRow[],
): Promise<GlobalSearchDeviceItem[]> {
  if (rows.length === 0) {
    return [];
  }

  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const brandIds = [...new Set(rows.map((row) => row.brand_id))];
  const modelIds = [...new Set(rows.map((row) => row.model_id))];

  const [customersRes, brandsRes, modelsRes] = await Promise.all([
    supabase.from("customers").select("id, name").in("id", customerIds),
    supabase.from("brands").select("id, name").in("id", brandIds),
    supabase
      .from("device_models")
      .select("id, model_name")
      .in("id", modelIds),
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);
  if (brandsRes.error) throw new Error(brandsRes.error.message);
  if (modelsRes.error) throw new Error(modelsRes.error.message);

  const customerMap = new Map(
    (customersRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const brandMap = new Map(
    (brandsRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const modelMap = new Map(
    (modelsRes.data ?? []).map((row) => [row.id, row.model_name]),
  );

  return rows.map((row) => ({
    id: row.id,
    serial_number: row.serial_number,
    brand_model: `${brandMap.get(row.brand_id) ?? ""} ${modelMap.get(row.model_id) ?? ""}`.trim(),
    customer_name: customerMap.get(row.customer_id) ?? "—",
  }));
}

async function fetchDevicesByFilter(
  supabase: SearchSupabaseClient,
  applyFilter: (query: DevicesBaseQuery) => DevicesBaseQuery,
  branchId?: string,
): Promise<RawDeviceRow[]> {
  const { data, error } = await applyFilter(
    createDevicesBaseQuery(supabase, branchId),
  )
    .order("serial_number", { ascending: true })
    .limit(LOOKUP_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RawDeviceRow[];
}

async function searchDevices(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  term: string,
  branchId?: string,
): Promise<{ items: GlobalSearchDeviceItem[]; total: number }> {
  const pattern = `%${term}%`;

  const [bySerial, matchingCustomers, matchingBrands, matchingModels] =
    await Promise.all([
      fetchDevicesByFilter(
        supabase,
        (query) => query.ilike("serial_number", pattern),
        branchId,
      ),
      supabase
        .from("customers")
        .select("id")
        .is("deleted_at", null)
        .ilike("name", pattern)
        .limit(LOOKUP_LIMIT),
      supabase
        .from("brands")
        .select("id")
        .ilike("name", pattern)
        .limit(LOOKUP_LIMIT),
      supabase
        .from("device_models")
        .select("id")
        .ilike("model_name", pattern)
        .limit(LOOKUP_LIMIT),
    ]);

  if (matchingCustomers.error) {
    throw new Error(matchingCustomers.error.message);
  }
  if (matchingBrands.error) {
    throw new Error(matchingBrands.error.message);
  }
  if (matchingModels.error) {
    throw new Error(matchingModels.error.message);
  }

  const customerIds = (matchingCustomers.data ?? []).map((row) => row.id);
  const brandIds = (matchingBrands.data ?? []).map((row) => row.id);
  const modelIds = (matchingModels.data ?? []).map((row) => row.id);

  const [byCustomer, byBrand, byModel] = await Promise.all([
    customerIds.length > 0
      ? fetchDevicesByFilter(
          supabase,
          (query) => query.in("customer_id", customerIds),
          branchId,
        )
      : Promise.resolve([]),
    brandIds.length > 0
      ? fetchDevicesByFilter(
          supabase,
          (query) => query.in("brand_id", brandIds),
          branchId,
        )
      : Promise.resolve([]),
    modelIds.length > 0
      ? fetchDevicesByFilter(
          supabase,
          (query) => query.in("model_id", modelIds),
          branchId,
        )
      : Promise.resolve([]),
  ]);

  const mergedRows = mergeUniqueById(
    [...bySerial, ...byCustomer, ...byBrand, ...byModel],
    DISPLAY_LIMIT,
  );
  const totalRows = mergeUniqueById(
    [...bySerial, ...byCustomer, ...byBrand, ...byModel],
    LOOKUP_LIMIT,
  );

  return {
    items: await enrichDevices(supabase, mergedRows),
    total: totalRows.length,
  };
}

type RawContractRow = {
  id: string;
  contract_number: string;
  status: string;
  customer_id: string;
};

async function enrichContracts(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  rows: RawContractRow[],
): Promise<GlobalSearchContractItem[]> {
  if (rows.length === 0) {
    return [];
  }

  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name")
    .in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  const customerMap = new Map(
    (customers ?? []).map((row) => [row.id, row.name]),
  );

  return rows.map((row) => {
    const status = row.status as ContractStatus;
    return {
      id: row.id,
      contract_number: row.contract_number,
      customer_name: customerMap.get(row.customer_id) ?? "—",
      status: row.status,
      status_label: CONTRACT_STATUS_LABELS[status] ?? row.status,
    };
  });
}

async function searchContracts(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  term: string,
  branchId?: string,
): Promise<{ items: GlobalSearchContractItem[]; total: number }> {
  const pattern = `%${term}%`;

  let byNumberQuery = supabase
    .from("contracts")
    .select("id, contract_number, status, customer_id")
    .is("deleted_at", null)
    .ilike("contract_number", pattern);

  if (branchId) {
    byNumberQuery = byNumberQuery.eq("branch_id", branchId);
  }

  const { data: matchingCustomers, error: customerLookupError } = await supabase
    .from("customers")
    .select("id")
    .is("deleted_at", null)
    .ilike("name", pattern)
    .limit(LOOKUP_LIMIT);

  if (customerLookupError) {
    throw new Error(customerLookupError.message);
  }

  const customerIds = (matchingCustomers ?? []).map((row) => row.id);

  let byCustomerPromise: Promise<{ data: RawContractRow[] | null; error: Error | null }>;

  if (customerIds.length > 0) {
    let byCustomerQuery = supabase
      .from("contracts")
      .select("id, contract_number, status, customer_id")
      .is("deleted_at", null)
      .in("customer_id", customerIds);

    if (branchId) {
      byCustomerQuery = byCustomerQuery.eq("branch_id", branchId);
    }

    byCustomerPromise = (async () => {
      const result = await byCustomerQuery
        .order("contract_number", { ascending: true })
        .limit(LOOKUP_LIMIT);

      return {
        data: (result.data ?? []) as RawContractRow[],
        error: result.error ? new Error(result.error.message) : null,
      };
    })();
  } else {
    byCustomerPromise = Promise.resolve({ data: [], error: null });
  }

  const [{ data: byNumber, error: numberError }, { data: byCustomer, error: byCustomerError }] =
    await Promise.all([
      byNumberQuery.order("contract_number", { ascending: true }).limit(LOOKUP_LIMIT),
      byCustomerPromise,
    ]);

  if (numberError) {
    throw new Error(numberError.message);
  }
  if (byCustomerError) {
    throw new Error(byCustomerError.message);
  }

  const mergedRows = mergeUniqueById(
    [...((byNumber ?? []) as RawContractRow[]), ...(byCustomer ?? [])],
    DISPLAY_LIMIT,
  );
  const totalRows = mergeUniqueById(
    [...((byNumber ?? []) as RawContractRow[]), ...(byCustomer ?? [])],
    LOOKUP_LIMIT,
  );

  return {
    items: await enrichContracts(supabase, mergedRows),
    total: totalRows.length,
  };
}

async function searchServiceRequests(
  supabase: Awaited<ReturnType<typeof getDashboardApiContext>>["supabase"],
  term: string,
  branchId?: string,
): Promise<{ items: GlobalSearchServiceRequestItem[]; total: number }> {
  const pattern = `%${term}%`;

  let query = supabase
    .from("service_requests")
    .select("id, request_number, company_name, status", { count: "exact" })
    .is("deleted_at", null)
    .or(
      `request_number.ilike.${pattern},company_name.ilike.${pattern},serial_number.ilike.${pattern}`,
    );

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .limit(DISPLAY_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []).map((row) => {
      const status = row.status as ServiceRequestStatus;
      return {
        id: row.id,
        request_number: row.request_number,
        company_name: row.company_name,
        status: row.status,
        status_label: SERVICE_REQUEST_STATUS_LABELS[status] ?? row.status,
      };
    }),
    total: count ?? data?.length ?? 0,
  };
}

export async function globalSearch(
  rawQuery: string,
): Promise<GlobalSearchResponse> {
  try {
    const term = escapeIlikeTerm(rawQuery);

    if (term.length < MIN_QUERY_LENGTH) {
      return { success: true, data: emptyResult() };
    }

    const ctx = await getDashboardApiContext();
    const branchId = ctx.branchScope ?? undefined;

    const [customers, devices, contracts, service_requests] = await Promise.all([
      searchCustomers(ctx.supabase, term, branchId),
      searchDevices(ctx.supabase, term, branchId),
      searchContracts(ctx.supabase, term, branchId),
      searchServiceRequests(ctx.supabase, term, branchId),
    ]);

    return {
      success: true,
      data: {
        customers,
        devices,
        contracts,
        service_requests,
      },
    };
  } catch (error) {
    if (error instanceof DashboardApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: toDashboardError(error) };
  }
}
