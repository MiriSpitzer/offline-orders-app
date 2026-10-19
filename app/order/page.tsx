"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { sendPendingOrders } from "@/lib/sync";
import type { Item, Order } from "@/lib/types";

export default function OrderPage() {
  const router = useRouter();
  const items = useLiveQuery(() => db.items.toArray(), []);
  const stores = useLiveQuery(() => db.stores.orderBy("name").toArray(), []);

  const [storeId, setStoreId] = useState("");
  const storeOrders = useLiveQuery(async () => {
    if (!storeId) return [];
    const orders = await db.orders.where("store_id").equals(storeId).toArray();
    return orders.sort((a, b) => b.created_at - a.created_at);
  }, [storeId]);

  const suggestedQuantities = useMemo(() => {
    const map = new Map<string, number>();
    const quantitiesByItem = new Map<string, number[]>();
    for (const order of storeOrders ?? []) {
      for (const line of order.lines) {
        const list = quantitiesByItem.get(line.item_id) ?? [];
        if (list.length < 3) {
          list.push(line.quantity);
          quantitiesByItem.set(line.item_id, list);
        }
      }
    }
    for (const [itemId, qtys] of quantitiesByItem) {
      map.set(itemId, Math.round(qtys.reduce((sum, q) => sum + q, 0) / qtys.length));
    }
    return map;
  }, [storeOrders]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedStore = stores?.find((s) => s.store_id === storeId);

  const categoryRank = useMemo(() => {
    const map = new Map<string, number>();
    selectedStore?.categoryOrder.forEach((category, index) => map.set(category, index));
    return map;
  }, [selectedStore]);

  const visibleItems = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    const rankOf = (category: string) => categoryRank.get(category) ?? Number.MAX_SAFE_INTEGER;
    return items
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          rankOf(a.category_name) - rankOf(b.category_name) ||
          a.category_name.localeCompare(b.category_name) ||
          (a.group_name ?? a.name).localeCompare(b.group_name ?? b.name) ||
          a.name.localeCompare(b.name)
      );
  }, [items, search, categoryRank]);

  function qtyFor(itemId: string) {
    return quantities[itemId] ?? suggestedQuantities.get(itemId) ?? 0;
  }

  const lines = (items ?? [])
    .filter((i) => qtyFor(i.item_id) > 0)
    .map((i) => ({ item_id: i.item_id, name: i.name, rate: i.rate, quantity: qtyFor(i.item_id) }));

  const total = lines.reduce((sum, l) => sum + l.quantity * l.rate, 0);

  function setQty(item: Item, value: number) {
    setQuantities((q) => ({ ...q, [item.item_id]: Math.max(0, Math.floor(value) || 0) }));
  }

  async function saveOrder() {
    if (!selectedStore || lines.length === 0) return;
    setSaving(true);

    const order: Order = {
      id: crypto.randomUUID(),
      store_id: selectedStore.store_id,
      store_name: selectedStore.name,
      date: new Date().toISOString().slice(0, 10),
      lines,
      status: "pending",
      created_at: Date.now(),
    };

    await db.orders.add(order);
    sendPendingOrders();
    router.push("/orders");
  }

  if (!items || !stores) return <p>Loading...</p>;
  if (items.length === 0)
    return <p className="muted">No products. Sync first on the home screen.</p>;
  if (stores.length === 0)
    return <p className="muted">No stores yet. Sync first on the home screen.</p>;

  let lastCategory = "";
  let lastGroup: string | null = null;

  return (
    <div className="stack">
      <h1>New order</h1>

      <label className="field">
        Store
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">— Choose a store —</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {!storeId ? (
        <p className="muted">Choose a store first to see the products in the right order.</p>
      ) : (
        <>
          <input
            type="search"
            placeholder="Search product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul className="product-list">
            {visibleItems.map((item) => {
              const showCategory = item.category_name !== lastCategory;
              const showGroup = item.group_id !== null && item.group_id !== lastGroup;
              lastCategory = item.category_name;
              lastGroup = item.group_id;
              const qty = qtyFor(item.item_id);

              return (
                <li key={item.item_id}>
                  {showCategory && <h3 className="category">{item.category_name}</h3>}
                  {showGroup && <div className="group-title">{item.group_name}</div>}
                  <div className={"product" + (item.group_id ? " in-group" : "") + (qty > 0 ? " selected" : "")}>
                    <div>
                      <div>{item.name}</div>
                      <div className="muted small">
                        {item.sku} · €{item.rate.toFixed(2)} / {item.unit}
                      </div>
                    </div>
                    <div className="qty">
                      <button onClick={() => setQty(item, qty - 1)} aria-label="Less">−</button>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => setQty(item, Number(e.target.value))}
                      />
                      <button onClick={() => setQty(item, qty + 1)} aria-label="More">+</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="footer-bar">
            <span>
              {lines.length} products · €{total.toFixed(2)}
            </span>
            <button onClick={saveOrder} disabled={!storeId || lines.length === 0 || saving}>
              {saving ? "Saving..." : "Save order"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
