"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/utils/format-relative-time";

type RelativeTimeProps = {
  date: string | null | undefined;
  className?: string;
};

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!date) {
      setLabel("");
      return;
    }

    setLabel(formatRelativeTime(date));
    const interval = window.setInterval(
      () => setLabel(formatRelativeTime(date)),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, [date]);

  if (!date) {
    return null;
  }

  return (
    <time dateTime={date} className={className} suppressHydrationWarning>
      {label || "…"}
    </time>
  );
}
