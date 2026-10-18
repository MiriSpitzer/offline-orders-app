"use client";

// Home screen: sync and an overview of what's stored locally.

import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { syncMasterData } from "@/lib/sync";

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const itemCount = useLiveQuery(() => db.items.count(), [], 0);
  const storeCount = useLiveQuery(() => db.stores.count(), [], 0);
  const lastSync = useLiveQuery(() => db.meta.get("lastSync"), []);

  async function handleSync() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await syncMasterData();
      setMessage(`${result.items} products and ${result.stores} stores fetched.`);
    } catch (err) {
      setMessage("Sync failed: " + (err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>Order App</h1>

      <section className="card">
        <h2>Local data</h2>
        <p>
          {itemCount} products · {storeCount} stores
        </p>
        <p className="muted">
          Last synced:{" "}
          {lastSync ? new Date(Number(lastSync.value)).toLocaleString("en-GB") : "never"}
        </p>
        <button onClick={handleSync} disabled={busy}>
          {busy ? "Syncing..." : "Sync"}
        </button>
        {message && <p>{message}</p>}
      </section>

      {itemCount > 0 && storeCount > 0 ? (
        <Link href="/order" className="button-link">
          Create new order →
        </Link>
      ) : (
        <p className="muted">Sync first to load products and stores.</p>
      )}
    </div>
  );
}
