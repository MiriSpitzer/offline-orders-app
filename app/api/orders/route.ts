import { NextResponse } from "next/server";
import { ZohoUnreachableError, zohoFetch } from "@/lib/zoho";

type SalesOrderPayload = {
  customer_id: string;
  date: string;
  reference_number: string;
  line_items: { item_id: string; quantity: number; rate: number }[];
};

type ZohoSalesOrder = { salesorder_id: string; reference_number?: string };

export async function POST(request: Request) {
  let payload: SalesOrderPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload?.customer_id || !payload.reference_number || !payload.line_items?.length) {
    return NextResponse.json(
      { error: "customer_id, reference_number and at least one line item are required" },
      { status: 400 }
    );
  }

  try {
    const existing = await zohoFetch<{ salesorders: ZohoSalesOrder[] }>("/salesorders", {
      query: { reference_number: payload.reference_number },
    });
    const duplicate = existing.salesorders.find(
      (so) => so.reference_number === payload.reference_number
    );
    if (duplicate) return NextResponse.json({ salesorder_id: duplicate.salesorder_id });

    const created = await zohoFetch<{ salesorder: ZohoSalesOrder }>("/salesorders", {
      method: "POST",
      body: payload,
    });
    return NextResponse.json({ salesorder_id: created.salesorder.salesorder_id });
  } catch (err) {
    if (err instanceof ZohoUnreachableError) {
      return NextResponse.json({ error: err.message, offline: true }, { status: 503 });
    }
    console.error("[api/orders]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
