// Types that follow the shape of Zoho Inventory data.
// Field names such as item_id, store_id and rate match the Zoho API
// (store_id is the Zoho contact/customer id), so little will need to change later.

export interface Item {
  item_id: string;
  name: string;
  sku: string;
  rate: number; // sale price
  unit: string;
  category_name: string; // e.g. "Dranken", "Snacks" (used for the store layout)
  group_id: string | null; // item group = product with variants (flavors)
  group_name: string | null;
}

// A store = the importer's customer. Synced from Zoho (id + name), with a
// locally-managed layout: the order in which product groups (categories)
// should appear when taking an order there, e.g. the order you walk the aisles.
export interface Store {
  store_id: string; // Zoho contact_id
  name: string; // Zoho contact_name
  categoryOrder: string[]; // category_name values, in display order
}

export interface OrderLine {
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
}

export type OrderStatus = "pending" | "sending" | "sent" | "failed";

export interface Order {
  id: string; // unique ID, created on the device (prevents duplicate orders)
  store_id: string;
  store_name: string;
  date: string; // YYYY-MM-DD
  lines: OrderLine[];
  status: OrderStatus;
  created_at: number;
  error?: string;
  zoho_salesorder_id?: string; // filled in once Zoho has the order
}

export interface MetaEntry {
  key: string;
  value: string | number;
}
