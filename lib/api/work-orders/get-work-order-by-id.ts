"use server";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type {
  WorkOrderActivityItem,
  WorkOrderDetail,
  WorkOrderFileItem,
  WorkOrderPartItem,
  WorkOrderPhotoItem,
} from "@/lib/api/work-orders/types";
import type {
  WorkOrderActivityType,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/lib/constants/work-order";

const WORK_ORDER_DETAIL_SELECT = `
  id,
  work_order_number,
  customer_id,
  device_id,
  contract_id,
  work_type,
  priority,
  status,
  problem_description,
  service_location,
  service_location_note,
  internal_notes,
  assigned_to,
  assigned_at,
  scheduled_date,
  scheduled_time,
  work_started_at,
  work_ended_at,
  actual_duration_hours,
  total_paused_seconds,
  sla_deadline,
  sla_breached,
  is_under_contract,
  resolution_status,
  work_performed,
  hold_reason,
  cancelled_at,
  cancellation_reason,
  branch_id,
  created_at,
  updated_at,
  customers!work_orders_customer_id_fkey!inner (
    id,
    name
  ),
  branches!work_orders_branch_id_fkey!inner (
    name,
    code
  ),
  devices!work_orders_device_id_fkey (
    serial_number,
    brands!devices_brand_id_fkey ( name ),
    device_models!devices_model_id_fkey ( model_name )
  ),
  contracts!work_orders_contract_id_fkey (
    contract_number
  ),
  assignee:users!work_orders_assigned_to_fkey (
    full_name
  ),
  creator:users!work_orders_created_by_fkey (
    full_name
  )
`;

const ACTIVITIES_SELECT = `
  id,
  activity_type,
  description,
  old_value,
  new_value,
  created_at,
  user_id,
  users!work_order_activities_user_id_fkey (
    full_name
  )
`;

const PARTS_SELECT = `
  id,
  part_id,
  quantity,
  unit_price,
  total_price,
  is_chargeable,
  notes,
  inventory_movement_id,
  added_at,
  parts!work_order_parts_part_id_fkey (
    part_code,
    description,
    unit
  ),
  added_by_user:users!work_order_parts_added_by_fkey (
    full_name
  )
`;

const PHOTOS_SELECT = `
  id,
  storage_path,
  thumbnail_path,
  photo_type,
  caption,
  taken_at,
  uploaded_by,
  uploader:users!work_order_photos_uploaded_by_fkey (
    full_name
  )
`;

const FILES_SELECT = `
  id,
  file_name,
  storage_path,
  file_size_bytes,
  mime_type,
  category,
  description,
  uploaded_at,
  uploaded_by,
  uploader:users!work_order_files_uploaded_by_fkey (
    full_name
  )
`;

export async function getWorkOrderById(
  workOrderId: string,
): Promise<WorkOrderDetail> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data, error } = await ctx.supabase
      .from("work_orders")
      .select(WORK_ORDER_DETAIL_SELECT)
      .eq("id", workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    const row = data as unknown as {
      id: string;
      work_order_number: string;
      customer_id: string;
      device_id: string | null;
      contract_id: string | null;
      work_type: WorkOrderType;
      priority: WorkOrderPriority;
      status: WorkOrderStatus;
      problem_description: string;
      service_location: string | null;
      service_location_note: string | null;
      internal_notes: string | null;
      assigned_to: string | null;
      assigned_at: string | null;
      scheduled_date: string | null;
      scheduled_time: string | null;
      work_started_at: string | null;
      work_ended_at: string | null;
      actual_duration_hours: number | null;
      total_paused_seconds: number | null;
      sla_deadline: string | null;
      sla_breached: boolean | null;
      is_under_contract: boolean | null;
      resolution_status: string | null;
      work_performed: string | null;
      hold_reason: string | null;
      cancelled_at: string | null;
      cancellation_reason: string | null;
      branch_id: string;
      created_at: string;
      updated_at: string;
      customers: { id: string; name: string };
      branches: { name: string; code: string };
      devices: {
        serial_number: string;
        brands: { name: string } | null;
        device_models: { model_name: string } | null;
      } | null;
      contracts: { contract_number: string } | null;
      assignee: { full_name: string } | null;
      creator: { full_name: string } | null;
    };

    assertCanAccessBranch(ctx, row.branch_id);

    const [activitiesRes, partsRes, photosRes, filesRes] = await Promise.all([
      ctx.supabase
        .from("work_order_activities")
        .select(ACTIVITIES_SELECT)
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("work_order_parts")
        .select(PARTS_SELECT)
        .eq("work_order_id", workOrderId)
        .order("added_at", { ascending: false }),
      ctx.supabase
        .from("work_order_photos")
        .select(PHOTOS_SELECT)
        .eq("work_order_id", workOrderId)
        .order("taken_at", { ascending: false }),
      ctx.supabase
        .from("work_order_files")
        .select(FILES_SELECT)
        .eq("work_order_id", workOrderId)
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false }),
    ]);

    if (activitiesRes.error) {
      throw new Error(activitiesRes.error.message);
    }
    if (partsRes.error) {
      throw new Error(partsRes.error.message);
    }
    if (photosRes.error) {
      throw new Error(photosRes.error.message);
    }
    if (filesRes.error) {
      throw new Error(filesRes.error.message);
    }

    const activities: WorkOrderActivityItem[] = (
      activitiesRes.data ?? []
    ).map((a) => {
      const item = a as unknown as {
        id: string;
        activity_type: WorkOrderActivityType;
        description: string;
        old_value: Record<string, unknown> | null;
        new_value: Record<string, unknown> | null;
        created_at: string;
        user_id: string;
        users: { full_name: string } | null;
      };
      return {
        id: item.id,
        activity_type: item.activity_type,
        description: item.description,
        old_value: item.old_value,
        new_value: item.new_value,
        created_at: item.created_at,
        user_id: item.user_id,
        user_name: item.users?.full_name ?? "—",
      };
    });

    const parts: WorkOrderPartItem[] = (partsRes.data ?? []).map((p) => {
      const item = p as unknown as {
        id: string;
        part_id: string;
        quantity: number;
        unit_price: number | null;
        total_price: number | null;
        is_chargeable: boolean | null;
        notes: string | null;
        inventory_movement_id: string | null;
        added_at: string;
        parts: { part_code: string; description: string; unit: string } | null;
        added_by_user: { full_name: string } | null;
      };
      return {
        id: item.id,
        part_id: item.part_id,
        part_code: item.parts?.part_code ?? "—",
        part_description: item.parts?.description ?? "—",
        part_unit: (item.parts?.unit ?? "piece") as WorkOrderPartItem["part_unit"],
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        is_chargeable: item.is_chargeable ?? false,
        notes: item.notes,
        inventory_movement_id: item.inventory_movement_id,
        added_at: item.added_at,
        added_by_name: item.added_by_user?.full_name ?? "—",
      };
    });

    const photos: WorkOrderPhotoItem[] = (photosRes.data ?? []).map((ph) => {
      const item = ph as unknown as {
        id: string;
        storage_path: string;
        thumbnail_path: string | null;
        photo_type: string | null;
        caption: string | null;
        taken_at: string;
        uploaded_by: string;
        uploader: { full_name: string } | null;
      };
      return {
        id: item.id,
        storage_path: item.storage_path,
        thumbnail_path: item.thumbnail_path,
        photo_type: item.photo_type,
        caption: item.caption,
        taken_at: item.taken_at,
        uploaded_by: item.uploaded_by,
        uploaded_by_name: item.uploader?.full_name ?? "—",
      };
    });

    const files: WorkOrderFileItem[] = (filesRes.data ?? []).map((f) => {
      const item = f as unknown as {
        id: string;
        file_name: string;
        storage_path: string;
        file_size_bytes: number;
        mime_type: string;
        category: string | null;
        description: string | null;
        uploaded_at: string;
        uploaded_by: string;
        uploader: { full_name: string } | null;
      };
      return {
        id: item.id,
        file_name: item.file_name,
        storage_path: item.storage_path,
        file_size_bytes: item.file_size_bytes,
        mime_type: item.mime_type,
        category: item.category,
        description: item.description,
        uploaded_at: item.uploaded_at,
        uploaded_by: item.uploaded_by,
        uploaded_by_name: item.uploader?.full_name ?? "—",
      };
    });

    return {
      id: row.id,
      work_order_number: row.work_order_number,
      customer_id: row.customers.id,
      customer_name: row.customers.name,
      device_id: row.device_id,
      device_serial: row.devices?.serial_number ?? null,
      device_brand_name: row.devices?.brands?.name ?? null,
      device_model_name: row.devices?.device_models?.model_name ?? null,
      contract_id: row.contract_id,
      contract_number: row.contracts?.contract_number ?? null,
      work_type: row.work_type,
      priority: row.priority,
      status: row.status,
      problem_description: row.problem_description,
      service_location: row.service_location,
      service_location_note: row.service_location_note,
      internal_notes: row.internal_notes,
      assigned_to: row.assigned_to,
      assignee_name: row.assignee?.full_name ?? null,
      assigned_at: row.assigned_at,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      work_started_at: row.work_started_at,
      work_ended_at: row.work_ended_at,
      actual_duration_hours: row.actual_duration_hours,
      total_paused_seconds: row.total_paused_seconds,
      sla_deadline: row.sla_deadline,
      sla_breached: row.sla_breached ?? false,
      is_under_contract: row.is_under_contract ?? false,
      resolution_status: row.resolution_status,
      work_performed: row.work_performed,
      hold_reason: row.hold_reason,
      cancelled_at: row.cancelled_at,
      cancellation_reason: row.cancellation_reason,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      branch_code: row.branches.code,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by_name: row.creator?.full_name ?? "—",
      activities,
      parts,
      photos,
      files,
    };
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
