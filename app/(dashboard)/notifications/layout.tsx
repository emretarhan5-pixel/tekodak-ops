import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Bildirimler",
  "Sistem bildirimleri ve okundu takibi",
);

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
