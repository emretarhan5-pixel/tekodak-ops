import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Stok",
  "Parça kartları, hareketler ve kritik stok uyarıları",
);

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
