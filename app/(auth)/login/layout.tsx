import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata("Giriş Yap");

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
