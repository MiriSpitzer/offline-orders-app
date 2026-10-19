import { NextResponse } from "next/server";
import { zohoFetchAll } from "@/lib/zoho";
import type { Item } from "@/lib/types";

type ZohoItem = {
  item_id: string;
  name: string;
  sku?: string;
  rate?: number;
  unit?: string;
  cf_category?: string;
  group_id?: string;
  group_name?: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zohoItems = await zohoFetchAll<ZohoItem>("/items", "items", {
      filter_by: "Status.Active",
    });

    const groupSize = new Map<string, number>();
    for (const z of zohoItems) {
      if (z.group_id) groupSize.set(z.group_id, (groupSize.get(z.group_id) ?? 0) + 1);
    }

    const items: Item[] = zohoItems.map((z) => {
      const isVariant = !!z.group_id && groupSize.get(z.group_id)! > 1;
      return {
        item_id: z.item_id,
        name: z.name,
        sku: z.sku ?? "",
        rate: z.rate ?? 0,
        unit: z.unit ?? "",
        category_name: z.cf_category || "Overig",
        group_id: isVariant ? z.group_id! : null,
        group_name: isVariant ? z.group_name ?? null : null,
      };
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[api/items]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
