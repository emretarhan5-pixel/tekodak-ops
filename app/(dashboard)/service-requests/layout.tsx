import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Servis Talepleri",
  "Servis taleplerini listeleyin; kayıt, arıza tespiti, teklif ve bakım süreçlerini yönetin",
);

export default function ServiceRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
