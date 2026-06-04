import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Ayarlar",
  "Şirket profili, kullanıcılar ve sistem yapılandırması",
);

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
