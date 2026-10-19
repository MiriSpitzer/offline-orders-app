import { NextResponse } from "next/server";
import { zohoFetchAll } from "@/lib/zoho";
import type { RemoteStore } from "@/lib/types";

type ZohoContact = {
  contact_id: string;
  contact_name: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contacts = await zohoFetchAll<ZohoContact>("/contacts", "contacts", {
      contact_type: "customer",
      filter_by: "Status.Active",
    });

    const stores: RemoteStore[] = contacts.map((c) => ({
      store_id: c.contact_id,
      name: c.contact_name,
    }));

    return NextResponse.json(stores);
  } catch (err) {
    console.error("[api/stores]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
