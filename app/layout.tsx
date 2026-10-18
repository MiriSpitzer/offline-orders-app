import type { Metadata } from "next";
import StatusBar from "@/components/StatusBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Order App",
  description: "Record offline orders for Zoho Inventory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StatusBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
