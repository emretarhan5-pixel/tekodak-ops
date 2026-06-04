import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Müşteriler",
  "Müşteri listesi, detay ve iletişim yönetimi",
);

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
