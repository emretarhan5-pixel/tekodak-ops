"use client";

import { useTransition, type ReactNode } from "react";
import {
  Building2,
  FileText,
  Package,
  Printer,
  Settings,
  Tag,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BrandsSettings } from "@/components/settings/BrandsSettings";
import { CategoriesSettings } from "@/components/settings/CategoriesSettings";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { DeviceModelsSettings } from "@/components/settings/DeviceModelsSettings";
import { UsersSettingsSection } from "@/components/settings/UsersSettingsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsPageData } from "@/lib/api/settings/types";
import {
  SETTINGS_TAB_LABELS,
  SETTINGS_TABS,
  type SettingsTab,
} from "@/lib/constants/settings";
import type { SettingsSearchInput } from "@/schemas/settings";
import type {
  DeactivateUserAction,
  GetOpenWorkOrdersAction,
  InviteUserAction,
  UpdateUserAction,
} from "@/lib/api/users/types";
import type {
  DeactivateBrandAction,
  DeactivateCategoryAction,
  DeactivateDeviceModelAction,
  SaveBrandAction,
  SaveCategoryAction,
  SaveCompanyProfileAction,
  SaveDeviceModelAction,
} from "@/lib/api/settings/types";

const TAB_ICONS: Record<SettingsTab, ReactNode> = {
  users: <Users className="size-4" />,
  brands: <Tag className="size-4" />,
  "device-models": <Printer className="size-4" />,
  "contract-types": <FileText className="size-4" />,
  "stock-categories": <Package className="size-4" />,
  company: <Building2 className="size-4" />,
};

type SettingsPageProps = {
  pageData: SettingsPageData;
  search: SettingsSearchInput;
  currentUserId: string;
  inviteUserAction: InviteUserAction;
  updateUserAction: UpdateUserAction;
  deactivateUserAction: DeactivateUserAction;
  getOpenWorkOrdersAction: GetOpenWorkOrdersAction;
  saveBrandAction: SaveBrandAction;
  deactivateBrandAction: DeactivateBrandAction;
  saveDeviceModelAction: SaveDeviceModelAction;
  deactivateDeviceModelAction: DeactivateDeviceModelAction;
  saveCategoryAction: SaveCategoryAction;
  deactivateCategoryAction: DeactivateCategoryAction;
  saveCompanySettingsAction: SaveCompanyProfileAction;
};

export function SettingsPage({
  pageData,
  search,
  currentUserId,
  inviteUserAction,
  updateUserAction,
  deactivateUserAction,
  getOpenWorkOrdersAction,
  saveBrandAction,
  deactivateBrandAction,
  saveDeviceModelAction,
  deactivateDeviceModelAction,
  saveCategoryAction,
  deactivateCategoryAction,
  saveCompanySettingsAction,
}: SettingsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleTabChange(nextTab: string) {
    const next = new URLSearchParams(urlSearchParams?.toString() ?? "");
    next.set("tab", nextTab);
    if (nextTab !== "device-models") {
      next.delete("brandId");
    }
    startTransition(() => {
      router.push(`${pathname ?? "/"}?${next.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Sistem yapılandırması ve referans verileri
        </p>
      </div>

      <Tabs value={search.tab} onValueChange={handleTabChange}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {SETTINGS_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={isPending}
              className="gap-1.5"
            >
              {TAB_ICONS[tab]}
              {SETTINGS_TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {pageData.tab === "users" ? (
            <UsersSettingsSection
              data={pageData.data}
              currentUserId={currentUserId}
              inviteUserAction={inviteUserAction}
              updateUserAction={updateUserAction}
              deactivateUserAction={deactivateUserAction}
              getOpenWorkOrdersAction={getOpenWorkOrdersAction}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="brands" className="mt-4">
          {pageData.tab === "brands" ? (
            <BrandsSettings
              brands={pageData.data}
              saveBrandAction={saveBrandAction}
              deactivateBrandAction={deactivateBrandAction}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="device-models" className="mt-4">
          {pageData.tab === "device-models" ? (
            <DeviceModelsSettings
              models={pageData.data.models}
              brands={pageData.data.brands}
              brandId={pageData.brandId}
              saveDeviceModelAction={saveDeviceModelAction}
              deactivateDeviceModelAction={deactivateDeviceModelAction}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="contract-types" className="mt-4">
          {pageData.tab === "contract-types" ? (
            <CategoriesSettings
              title="Sözleşme tipi"
              description="Sözleşme formlarında görünen tip etiketleri. Kod değerleri veritabanı ile senkron olmalıdır."
              categoryType="contract_type"
              categories={pageData.data}
              saveCategoryAction={saveCategoryAction}
              deactivateCategoryAction={deactivateCategoryAction}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="stock-categories" className="mt-4">
          {pageData.tab === "stock-categories" ? (
            <CategoriesSettings
              title="Stok kategorisi"
              description="Stok ürün kartlarında kullanılan kategori etiketleri."
              categoryType="part_category"
              categories={pageData.data}
              saveCategoryAction={saveCategoryAction}
              deactivateCategoryAction={deactivateCategoryAction}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          {pageData.tab === "company" ? (
            <CompanySettingsForm
              initial={pageData.data}
              saveCompanySettingsAction={saveCompanySettingsAction}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
