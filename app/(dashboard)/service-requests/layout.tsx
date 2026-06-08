import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Servis Talepleri",
  "Müşteri cihaz kaydı, arıza tespiti, teklif ve bakım süreci",
);

export default function ServiceRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
