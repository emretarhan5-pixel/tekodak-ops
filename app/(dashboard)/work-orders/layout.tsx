import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "İş Emirleri",
  "Saha işleri, atama ve durum takibi",
);

export default function WorkOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
