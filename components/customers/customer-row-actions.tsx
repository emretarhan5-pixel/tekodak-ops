"use client";

import { Eye, Mail, Pencil, Phone } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatTurkishPhoneDisplay } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";

type CustomerRowActionsProps = {
  customerId: string;
  phone: string;
  email: string | null;
};

const actionClass = cn(
  buttonVariants({ variant: "ghost", size: "icon-xs" }),
  "text-muted-foreground",
);

export function CustomerRowActions({
  customerId,
  phone,
  email,
}: CustomerRowActionsProps) {
  return (
    <div
      className="flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <a
        href={`tel:+90${phone}`}
        className={actionClass}
        title={formatTurkishPhoneDisplay(phone)}
        aria-label="Ara"
      >
        <Phone className="size-3.5" />
      </a>

      {email ? (
        <a
          href={`mailto:${email}`}
          className={actionClass}
          title={email}
          aria-label="E-posta gönder"
        >
          <Mail className="size-3.5" />
        </a>
      ) : (
        <span
          className={cn(actionClass, "pointer-events-none opacity-40")}
          aria-hidden
        >
          <Mail className="size-3.5" />
        </span>
      )}

      <Link
        href={`/customers/${customerId}`}
        className={actionClass}
        title="Detay"
        aria-label="Detay"
      >
        <Eye className="size-3.5" />
      </Link>

      <Link
        href={`/customers/${customerId}/edit`}
        className={actionClass}
        title="Düzenle"
        aria-label="Düzenle"
      >
        <Pencil className="size-3.5" />
      </Link>
    </div>
  );
}
