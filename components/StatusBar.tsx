"use client";

// Navigation + online/offline indicator + count of unsent orders.
// When the connection comes back, pending orders are sent automatically.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { resetStuckOrders, sendPendingOrders } from "@/lib/sync";
import { isForcedOffline, setForcedOffline } from "@/lib/devOffline";

export default function StatusBar() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [forced, setForced] = useState(false);

  const pendingCount = useLiveQuery(
    () => db.orders.where("status").anyOf("pending", "failed", "sending").count(),
    [],
    0
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine && !isForcedOffline());

    update();
    resetStuckOrders().then(() => sendPendingOrders());

    const goOnline = () => {
      update();
      sendPendingOrders();
    };
    const goOffline = () => update();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  function toggleForcedOffline() {
    const next = !isForcedOffline();
    setForcedOffline(next);
    setForced(next);
    setOnline(navigator.onLine && !next);
    if (!next) sendPendingOrders(); // back "online": try sending again
  }

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
        <span className={online ? "dot online" : "dot offline"} />
        {online ? "Online" : "Offline"}
        {process.env.NODE_ENV === "development" && (
          <button type="button" className="secondary" onClick={toggleForcedOffline}>
            {forced ? "Simulate online" : "Simulate offline"}
          </button>
        )}
      </div>
    </header>
  );
}
