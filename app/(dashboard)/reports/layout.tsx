import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Raporlar",
  "Müşteri, sözleşme, iş emri ve stok raporları",
);

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
