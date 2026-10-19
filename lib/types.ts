export interface Item {
  item_id: string;
  name: string;
  sku: string;
  rate: number;
  unit: string;
  category_name: string;
  group_id: string | null;
  group_name: string | null;
}

export interface Store {
  store_id: string;
  name: string;
  categoryOrder: string[];
}

export type RemoteStore = { store_id: string; name: string };

export interface OrderLine {
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
}

export type OrderStatus = "pending" | "sending" | "sent" | "failed";

export interface Order {
  id: string;
  store_id: string;
  store_name: string;
  date: string;
  lines: OrderLine[];
  status: OrderStatus;
  created_at: number;
  error?: string;
  zoho_salesorder_id?: string;
}

export interface MetaEntry {
  key: string;
  value: string | number;
}
