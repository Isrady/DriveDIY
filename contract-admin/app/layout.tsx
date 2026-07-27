import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Administration Manager",
  description: "UAE construction contract administration — correspondence analysis and legal risk management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
