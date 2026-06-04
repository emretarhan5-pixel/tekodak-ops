export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "dosya";
  const cleaned = base
    .replace(/[^\w.\-()ğüşıöçĞÜŞİÖÇ\s]/gi, "_")
    .replace(/\s+/g, "_")
    .slice(0, 200);
  return cleaned.length > 0 ? cleaned : "dosya";
}
