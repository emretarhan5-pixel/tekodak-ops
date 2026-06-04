export const CUSTOMER_TYPES = ["public", "private", "individual"] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  public: "Kamu",
  private: "Özel",
  individual: "Bireysel",
};

export const DEFAULT_CUSTOMER_PAGE_SIZE = 50;
