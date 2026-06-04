import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Cihazlar",
  "Müşteri cihaz envanteri ve garanti bilgileri",
);

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
