import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Sözleşmeler",
  "Bakım sözleşmeleri, yenileme takibi ve dosyalar",
);

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
