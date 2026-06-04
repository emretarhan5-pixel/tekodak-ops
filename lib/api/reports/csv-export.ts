export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function buildCsvBase64(rows: string[][]): {
  contentBase64: string;
  mimeType: string;
} {
  const csv = buildCsv(rows);
  const bom = "\uFEFF";
  return {
    contentBase64: Buffer.from(bom + csv, "utf-8").toString("base64"),
    mimeType: "text/csv;charset=utf-8",
  };
}

export function reportExportFilename(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}
