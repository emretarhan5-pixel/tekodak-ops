import type { DeviceDetail } from "@/lib/api/devices/types";
import type { UpdateDeviceInput } from "@/schemas/device";

export function deviceDetailToFormValues(
  device: DeviceDetail,
): UpdateDeviceInput {
  return {
    id: device.id,
    customer_id: device.customer_id,
    brand_id: device.brand_id,
    model_id: device.model_id,
    serial_number: device.serial_number,
    manufacturing_year: device.manufacturing_year,
    installation_date: device.installation_date,
    warranty_end_date: device.warranty_end_date,
    location_address: device.location_address ?? "",
    status: device.status,
    notes: device.notes ?? "",
  };
}
