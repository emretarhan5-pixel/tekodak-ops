import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ResponsiblePersonCell({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const primary = names[0] ?? "";
  const extra = names.length - 1;

  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback className="text-[10px] font-medium">
          {getInitials(primary)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm" title={names.join(", ")}>
        {primary}
        {extra > 0 ? (
          <span className="text-muted-foreground"> +{extra}</span>
        ) : null}
      </span>
    </div>
  );
}
