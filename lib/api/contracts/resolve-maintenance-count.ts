/** Sözleşme kaydında total ve annual bakım sayaçlarını senkron tutar. */
export function resolveContractMaintenanceCount(input: {
  total_maintenance_count?: number;
  annual_maintenance_count?: number;
}): number {
  const total = input.total_maintenance_count ?? 0;
  const annual = input.annual_maintenance_count ?? 0;
  return Math.max(total, annual, 0);
}
