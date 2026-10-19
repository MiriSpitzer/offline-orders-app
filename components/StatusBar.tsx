"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { resetStuckOrders, sendPendingOrders } from "@/lib/sync";

const CHECK_INTERVAL_MS = 30_000;

type Connection = "online" | "offline" | "no-zoho";

const connectionLabel: Record<Connection, string> = {
  online: "Online",
  offline: "Offline",
  "no-zoho": "No connection to Zoho",
};

async function checkConnection(): Promise<Connection> {
  if (!navigator.onLine) return "offline";
  try {
    const res = await fetch("/api/ping", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return data.reachable ? "online" : "no-zoho";
  } catch {
    return "no-zoho";
  }
}

export default function StatusBar() {
  const pathname = usePathname();
  const [connection, setConnection] = useState<Connection>("online");

  const pendingCount = useLiveQuery(
    () => db.orders.where("status").anyOf("pending", "failed", "sending").count(),
    [],
    0
  );

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const result = await checkConnection();
      if (cancelled) return;
      setConnection(result);
      if (result === "online") sendPendingOrders({ includeFailed: false });
    };

    resetStuckOrders().then(check);

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const timer = setInterval(check, CHECK_INTERVAL_MS);

    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/order", label: "New order" },
    { href: "/stores", label: "Stores" },
    { href: "/orders", label: "Orders" },
  ];

  return (
    <header className="statusbar">
      <nav>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="status">
        {pendingCount > 0 && <span className="badge">{pendingCount} pending</span>}
        <span className={"dot " + connection} />
        {connectionLabel[connection]}
      </div>
    </header>
  );
}
