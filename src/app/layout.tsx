import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Code Delivery Dashboard",
  description: "Operational visibility into Firefox code delivery flow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
