import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Kontrol Paneli",
  "Günlük özet, uyarılar ve hızlı erişim",
);

export default function DashboardHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
