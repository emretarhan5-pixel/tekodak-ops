import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import type { TablesInsert } from "@/lib/supabase/types";

type Client = SupabaseClient<Database, "public", Database["public"]>;

declare const client: Client;

const payload: TablesInsert<"customers"> = {
  name: "Test",
  tax_number: "1234567890",
  customer_type: "public",
  branch_id: "00000000-0000-0000-0000-000000000001",
  created_by: "00000000-0000-0000-0000-000000000002",
};

void client.from("customers").insert(payload);
