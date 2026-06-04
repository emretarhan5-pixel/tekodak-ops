import { pageMetadata } from "@/lib/metadata/site";

export const metadata = pageMetadata(
  "Hedefler",
  "Satış ve operasyon hedefleri ile ilerleme takibi",
);

export default function TargetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
