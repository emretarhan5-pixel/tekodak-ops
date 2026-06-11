"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Pencil, Plus, UserPlus } from "lucide-react";
import { useState } from "react";

import { DeactivateUserButton } from "@/components/settings/deactivate-user-button";
import { EditUserDialog } from "@/components/settings/edit-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BranchOption,
  DeactivateUserAction,
  GetOpenWorkOrdersAction,
  UpdateUserAction,
  UserListItem,
} from "@/lib/api/users/types";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";

type UsersListProps = {
  users: UserListItem[];
  branches: BranchOption[];
  currentUserId: string;
  onInviteClick: () => void;
  updateUserAction: UpdateUserAction;
  deactivateUserAction: DeactivateUserAction;
  getOpenWorkOrdersAction: GetOpenWorkOrdersAction;
};

function formatLastLogin(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

export function UsersList({
  users,
  branches,
  currentUserId,
  onInviteClick,
  updateUserAction,
  deactivateUserAction,
  getOpenWorkOrdersAction,
}: UsersListProps) {
  const [editUser, setEditUser] = useState<UserListItem | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} kullanıcı · {users.filter((u) => u.is_active).length}{" "}
          aktif
        </p>
        <Button
          type="button"
          className="h-10 gap-2"
          onClick={onInviteClick}
        >
          <UserPlus className="size-4" />
          Yeni Kullanıcı Davet Et
        </Button>
      </div>

      <div className="hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Şube</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Son giriş</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "outline"}
                  >
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.branch_name
                    ? `${user.branch_name} (${user.branch_code})`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      user.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {user.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatLastLogin(user.last_login_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => setEditUser(user)}
                    >
                      <Pencil className="size-3.5" />
                      Düzenle
                    </Button>
                    <DeactivateUserButton
                      user={user}
                      disabled={user.id === currentUserId}
                      deactivateUserAction={deactivateUserAction}
                      getOpenWorkOrdersAction={getOpenWorkOrdersAction}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge
                className={cn(
                  user.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "",
                )}
              >
                {user.is_active ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
              {user.branch_name ? (
                <span className="text-muted-foreground">
                  {user.branch_name}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Son giriş: {formatLastLogin(user.last_login_at)}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 flex-1"
                onClick={() => setEditUser(user)}
              >
                <Pencil className="size-4" />
                Düzenle
              </Button>
              <DeactivateUserButton
                user={user}
                disabled={user.id === currentUserId}
                deactivateUserAction={deactivateUserAction}
                getOpenWorkOrdersAction={getOpenWorkOrdersAction}
              />
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <Plus className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Henüz başka kullanıcı yok. TEKODAK ekibini davet edin.
          </p>
          <Button type="button" onClick={onInviteClick}>
            İlk kullanıcıyı ekle
          </Button>
        </div>
      ) : null}

      <EditUserDialog
        user={editUser}
        open={editUser !== null}
        onOpenChange={(next) => {
          if (!next) setEditUser(null);
        }}
        branches={branches}
        updateUserAction={updateUserAction}
      />
    </>
  );
}
