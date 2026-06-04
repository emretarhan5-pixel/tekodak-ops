import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";

export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "";
  }

  const date = parseISO(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) {
    return "Az önce";
  }

  const dayDiff = differenceInCalendarDays(now, date);

  if (dayDiff === 0) {
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  }

  if (dayDiff === 1) {
    return "Dün";
  }

  if (dayDiff <= 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  }

  return format(date, "d MMM yyyy, HH:mm", { locale: tr });
}
