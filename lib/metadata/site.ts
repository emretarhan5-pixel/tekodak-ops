import type { Metadata } from "next";

export const SITE_NAME = "TEKODAK OPS";
export const SITE_DESCRIPTION =
  "TEKODAK saha servis, sözleşme, stok ve iş emri operasyon yönetim platformu";

export const rootMetadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
};

export function pageMetadata(
  title: string,
  description?: string,
): Metadata {
  return {
    title,
    description: description ?? SITE_DESCRIPTION,
  };
}
