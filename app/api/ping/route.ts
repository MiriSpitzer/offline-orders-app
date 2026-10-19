import { NextResponse } from "next/server";
import { isZohoReachable } from "@/lib/zoho";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ reachable: await isZohoReachable() });
}
