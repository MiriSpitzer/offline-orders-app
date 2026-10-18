"use client";

// Stores screen: the importer's customers, synced from Zoho. For each one,
// drag-and-drop the order in which product groups (categories) should
// appear when taking an order there, e.g. the order you walk through it.

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Store } from "@/lib/types";

export default function StoresPage() {
  const stores = useLiveQuery(() => db.stores.orderBy("name").toArray(), []);
  const items = useLiveQuery(() => db.items.toArray(), []);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.category_name))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [items]);

  if (!stores || !items) return <p>Loading...</p>;

  return (
    <div className="stack">
      <h1>Stores</h1>
      <p className="muted">
        Set the product layout per store so products show up in the order you walk through it.
      </p>

      {stores.length === 0 && (
        <p className="muted">No stores yet. Sync first on the home screen.</p>
      )}

      {stores.map((store) => (
        <section key={store.store_id} className="card">
          <div className="row">
            <strong>{store.name}</strong>
            <button
              className="secondary"
              onClick={() => setEditingId(editingId === store.store_id ? null : store.store_id)}
            >
              {editingId === store.store_id ? "Close" : "Edit layout"}
            </button>
          </div>

          {editingId === store.store_id && (
            <CategoryOrderEditor store={store} allCategories={allCategories} />
          )}
        </section>
      ))}
    </div>
  );
}

function CategoryOrderEditor({
  store,
  allCategories,
}: {
  store: Store;
  allCategories: string[];
}) {
  const [order, setOrder] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Keep the list in sync with the store's saved order, and append any
  // categories that didn't exist yet when this store's layout was last saved.
  useEffect(() => {
    const known = store.categoryOrder.filter((c) => allCategories.includes(c));
    const missing = allCategories.filter((c) => !known.includes(c));
    setOrder([...known, ...missing]);
  }, [store.store_id, store.categoryOrder, allCategories]);

  function persist(next: string[]) {
    setOrder(next);
    db.stores.update(store.store_id, { categoryOrder: next });
  }

  function moveTo(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next);
  }

  return (
    <ul className="category-order-list">
      {order.map((category, index) => (
        <li
          key={category}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragIndex === null || dragIndex === index) return;
            moveTo(dragIndex, index);
            setDragIndex(index);
          }}
          onDragEnd={() => setDragIndex(null)}
          className={dragIndex === index ? "dragging" : ""}
        >
          <span className="drag-handle" aria-hidden>
            ⠿
          </span>
          <span className="category-order-name">{category}</span>
          <div className="move-buttons">
            <button
              type="button"
              className="secondary"
              onClick={() => moveTo(index, index - 1)}
              disabled={index === 0}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => moveTo(index, index + 1)}
              disabled={index === order.length - 1}
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
