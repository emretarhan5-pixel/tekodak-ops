import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Periyodik Bakım",
  "Sözleşme kapsamındaki periyodik bakım planlarını görüntüleyin ve tamamlayın",
);

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
