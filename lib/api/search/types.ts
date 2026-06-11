export type GlobalSearchCustomerItem = {
  id: string;
  name: string;
  city: string | null;
};

export type GlobalSearchDeviceItem = {
  id: string;
  serial_number: string;
  brand_model: string;
  customer_name: string;
};

export type GlobalSearchContractItem = {
  id: string;
  contract_number: string;
  customer_name: string;
  status: string;
  status_label: string;
};

export type GlobalSearchServiceRequestItem = {
  id: string;
  request_number: string;
  company_name: string;
  status: string;
  status_label: string;
};

export type GlobalSearchCategory<T> = {
  items: T[];
  total: number;
};

export type GlobalSearchResult = {
  customers: GlobalSearchCategory<GlobalSearchCustomerItem>;
  devices: GlobalSearchCategory<GlobalSearchDeviceItem>;
  contracts: GlobalSearchCategory<GlobalSearchContractItem>;
  service_requests: GlobalSearchCategory<GlobalSearchServiceRequestItem>;
};

export type GlobalSearchResponse =
  | { success: true; data: GlobalSearchResult }
  | { success: false; error: string };
