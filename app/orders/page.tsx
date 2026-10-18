"use client";

// Overview of all orders with their sync status.

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { sendPendingOrders } from "@/lib/sync";
import type { OrderStatus } from "@/lib/types";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Waiting to be sent",
  sending: "Sending...",
  sent: "In Zoho",
  failed: "Failed",
};

export default function OrdersPage() {
  const orders = useLiveQuery(() => db.orders.orderBy("created_at").reverse().toArray(), []);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setBusy(true);
    await sendPendingOrders();
    setBusy(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this order?")) await db.orders.delete(id);
  }

  if (!orders) return <p>Loading...</p>;

  const hasPending = orders.some((o) => o.status === "pending" || o.status === "failed");

  return (
    <div className="stack">
      <div className="row">
        <h1>Orders</h1>
        {hasPending && (
          <button onClick={handleSend} disabled={busy}>
            {busy ? "Sending..." : "Send now"}
          </button>
        )}
      </div>

      {orders.length === 0 && <p className="muted">No orders yet.</p>}

      {orders.map((order) => {
        const total = order.lines.reduce((s, l) => s + l.quantity * l.rate, 0);
        return (
          <section key={order.id} className="card">
            <div className="row">
              <strong>{order.store_name}</strong>
              <span className={"status-pill " + order.status}>{statusLabel[order.status]}</span>
            </div>
            <p className="muted small">
              {new Date(order.created_at).toLocaleString("en-GB")} · {order.lines.length} products · €
              {total.toFixed(2)}
              {order.zoho_salesorder_id && ` · ${order.zoho_salesorder_id}`}
            </p>
            <ul className="small">
              {order.lines.map((l) => (
                <li key={l.item_id}>
                  {l.quantity} × {l.name}
                </li>
              ))}
            </ul>
            {order.error && <p className="error small">Error: {order.error}</p>}
            {order.status !== "sent" && order.status !== "sending" && (
              <button className="secondary" onClick={() => handleDelete(order.id)}>
                Delete
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
