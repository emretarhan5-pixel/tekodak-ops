import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import {
  isTimestampInPeriod,
  resolveReportPeriod,
} from "@/lib/api/reports/report-period";
import type {
  CustomerReportData,
  CustomerReportRow,
  CustomerReportSummary,
} from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type RawCustomerRow = {
  id: string;
  name: string;
  created_at: string | null;
  branches: { name: string } | null;
};

type RawContractRow = {
  customer_id: string;
  status: string;
};

type RawWorkOrderRow = {
  customer_id: string;
  created_at: string;
};

function maxDate(values: Array<string | null | undefined>): string | null {
  const dates = values
    .filter((value): value is string => !!value)
    .map((value) => value.slice(0, 10));
  if (dates.length === 0) return null;
  return dates.sort((a, b) => b.localeCompare(a))[0] ?? null;
}

function buildSummary(
  customers: RawCustomerRow[],
  activeContractCustomerIds: Set<string>,
  periodWorkOrders: RawWorkOrderRow[],
  period: ReturnType<typeof resolveReportPeriod>,
): CustomerReportSummary {
  return {
    totalCustomers: customers.length,
    newCustomers: customers.filter((row) =>
      isTimestampInPeriod(row.created_at, period),
    ).length,
    activeContractCustomers: activeContractCustomerIds.size,
    totalWorkOrdersInPeriod: periodWorkOrders.length,
  };
}

function mapRows(
  customers: RawCustomerRow[],
  activeContractsByCustomer: Map<string, number>,
  workOrdersByCustomer: Map<string, number>,
  lastActivityByCustomer: Map<string, string | null>,
): CustomerReportRow[] {
  return customers
    .map((row) => ({
      customer_name: row.name,
      branch_name: row.branches?.name ?? "—",
      contract_count: activeContractsByCustomer.get(row.id) ?? 0,
      work_order_count: workOrdersByCustomer.get(row.id) ?? 0,
      last_activity: lastActivityByCustomer.get(row.id) ?? null,
    }))
    .sort((a, b) => a.customer_name.localeCompare(b.customer_name, "tr"));
}

export async function fetchCustomerReportData(
  supabase: AppSupabaseClient,
  filters: ReportFilterInput,
  branchId?: string,
): Promise<CustomerReportData> {
  const period = resolveReportPeriod(
    filters.period,
    filters.dateFrom,
    filters.dateTo,
  );

  let customersQuery = supabase
    .from("customers")
    .select(
      `
      id,
      name,
      created_at,
      branches!customers_branch_id_fkey ( name )
    `,
    )
    .is("deleted_at", null)
    .order("name", { ascending: true });

  let contractsQuery = supabase
    .from("contracts")
    .select("customer_id, status, end_date, start_date, created_at")
    .is("deleted_at", null);

  let workOrdersQuery = supabase
    .from("work_orders")
    .select("customer_id, created_at")
    .is("deleted_at", null)
    .gte("created_at", `${period.from}T00:00:00`)
    .lte("created_at", `${period.to}T23:59:59.999`);

  if (branchId) {
    customersQuery = customersQuery.eq("branch_id", branchId);
    contractsQuery = contractsQuery.eq("branch_id", branchId);
    workOrdersQuery = workOrdersQuery.eq("branch_id", branchId);
  }

  const [customersRes, contractsRes, workOrdersRes] = await Promise.all([
    customersQuery,
    contractsQuery,
    workOrdersQuery,
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);
  if (contractsRes.error) throw new Error(contractsRes.error.message);
  if (workOrdersRes.error) throw new Error(workOrdersRes.error.message);

  const customers = (customersRes.data ?? []) as unknown as RawCustomerRow[];
  const contracts = (contractsRes.data ?? []) as RawContractRow[];
  const workOrders = (workOrdersRes.data ?? []) as RawWorkOrderRow[];

  const activeContractCustomerIds = new Set<string>();
  const activeContractsByCustomer = new Map<string, number>();
  const lastActivityByCustomer = new Map<string, string | null>();

  for (const contract of contracts) {
    const last = maxDate([
      lastActivityByCustomer.get(contract.customer_id),
      contract.start_date,
      contract.end_date,
    ]);
    lastActivityByCustomer.set(contract.customer_id, last);

    if (contract.status === "active") {
      activeContractCustomerIds.add(contract.customer_id);
      activeContractsByCustomer.set(
        contract.customer_id,
        (activeContractsByCustomer.get(contract.customer_id) ?? 0) + 1,
      );
    }
  }

  const workOrdersByCustomer = new Map<string, number>();
  for (const workOrder of workOrders) {
    if (!isTimestampInPeriod(workOrder.created_at, period)) continue;
    workOrdersByCustomer.set(
      workOrder.customer_id,
      (workOrdersByCustomer.get(workOrder.customer_id) ?? 0) + 1,
    );
    const last = maxDate([
      lastActivityByCustomer.get(workOrder.customer_id),
      workOrder.created_at,
    ]);
    lastActivityByCustomer.set(workOrder.customer_id, last);
  }

  for (const customer of customers) {
    if (isTimestampInPeriod(customer.created_at, period)) {
      const last = maxDate([
        lastActivityByCustomer.get(customer.id),
        customer.created_at,
      ]);
      lastActivityByCustomer.set(customer.id, last);
    }
  }

  return {
    summary: buildSummary(
      customers,
      activeContractCustomerIds,
      workOrders,
      period,
    ),
    rows: mapRows(
      customers,
      activeContractsByCustomer,
      workOrdersByCustomer,
      lastActivityByCustomer,
    ),
    period,
  };
}

export function customerReportToCsvRows(data: CustomerReportData): string[][] {
  return [
    [
      "Müşteri",
      "Şube",
      "Aktif Sözleşme",
      "İş Emri (Dönem)",
      "Son Aktivite",
    ],
    ...data.rows.map((row) => [
      row.customer_name,
      row.branch_name,
      String(row.contract_count),
      String(row.work_order_count),
      row.last_activity ?? "—",
    ]),
  ];
}
