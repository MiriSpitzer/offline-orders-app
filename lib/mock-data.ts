// Fake data in "Zoho shape". Once you have a Zoho account, this file goes away
// and the data comes in through the API instead (see lib/api.ts).

import type { Item } from "./types";

// Remote shape for a store/customer as it comes from Zoho: just id + name.
// The layout (categoryOrder) is local-only and is merged in during sync.
export type RemoteStore = { store_id: string; name: string };

export const mockStores: RemoteStore[] = [
  { store_id: "c1", name: "Buurtwinkel De Hoek" },
  { store_id: "c2", name: "Supermarkt Centrum" },
  { store_id: "c3", name: "Nachtwinkel Station" },
];

export const mockItems: Item[] = [
  // Dranken
  { item_id: "i1", name: "Cola 1,5L", sku: "COLA-15", rate: 1.2, unit: "bottle",
    category_name: "Dranken", group_id: null, group_name: null },
  { item_id: "i2", name: "Spuitwater 1,5L", sku: "WATER-15", rate: 0.6, unit: "bottle",
    category_name: "Dranken", group_id: null, group_name: null },
  { item_id: "i3", name: "Limonade Citroen 1L", sku: "LIMO-CIT", rate: 1.1, unit: "bottle",
    category_name: "Dranken", group_id: "g2", group_name: "Limonade 1L" },
  { item_id: "i4", name: "Limonade Sinaas 1L", sku: "LIMO-SIN", rate: 1.1, unit: "bottle",
    category_name: "Dranken", group_id: "g2", group_name: "Limonade 1L" },

  // Snacks
  { item_id: "i5", name: "Chips Paprika 200g", sku: "CHIPS-PAP", rate: 1.5, unit: "bag",
    category_name: "Snacks", group_id: "g1", group_name: "Chips 200g" },
  { item_id: "i6", name: "Chips Naturel 200g", sku: "CHIPS-NAT", rate: 1.5, unit: "bag",
    category_name: "Snacks", group_id: "g1", group_name: "Chips 200g" },
  { item_id: "i7", name: "Chips Zout & Peper 200g", sku: "CHIPS-ZP", rate: 1.5, unit: "bag",
    category_name: "Snacks", group_id: "g1", group_name: "Chips 200g" },
  { item_id: "i8", name: "Chocoladereep 50g", sku: "CHOCO-50", rate: 0.9, unit: "piece",
    category_name: "Snacks", group_id: null, group_name: null },

  // Diepvries
  { item_id: "i9", name: "Frieten 1kg", sku: "FRIET-1KG", rate: 2.4, unit: "bag",
    category_name: "Diepvries", group_id: null, group_name: null },
  { item_id: "i10", name: "IJs Vanille 1L", sku: "IJS-VAN", rate: 3.2, unit: "box",
    category_name: "Diepvries", group_id: "g3", group_name: "IJs 1L" },
  { item_id: "i11", name: "IJs Chocolade 1L", sku: "IJS-CHO", rate: 3.2, unit: "box",
    category_name: "Diepvries", group_id: "g3", group_name: "IJs 1L" },
];
