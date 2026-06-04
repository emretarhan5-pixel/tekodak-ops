"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { useDashboardUser } from "@/components/providers/dashboard-user-provider";
import { getPermissions } from "@/lib/utils/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const user = useDashboardUser();
  const { isAdmin } = getPermissions(user);

  const branchLabel =
    user.role === "admin"
      ? "Tüm şubeler"
      : (user.branch_name ?? "Şube atanmamış");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-2"
            aria-label="Kullanıcı menüsü"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-medium">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">
          {user.full_name}
        </span>
        <ChevronDown className="hidden size-4 opacity-60 lg:inline" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]} · {branchLabel}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push("/profile");
          }}
        >
          <User className="size-4" />
          Profilim
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem
            onClick={() => {
              router.push("/settings");
            }}
          >
            <Settings className="size-4" />
            Ayarlar
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOutAction();
          }}
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
