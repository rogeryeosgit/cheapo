import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cheapo Singapore",
  description: "Find the cheapest visible online grocery prices in Singapore."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
