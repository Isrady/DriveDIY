import type { Metadata } from "next";
import { Bebas_Neue, Azeret_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  variable: "--font-azeret",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "DriveDIY — Your Bay. Your Tools. Your Build.",
  description:
    "Al Quoz Dubai's premier DIY car servicing facility. Rent a bay, access professional tools, and build your dream ride.",
  keywords: ["DIY car service", "Al Quoz", "Dubai", "bay rental", "car workshop"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${azeretMono.variable} ${dmSans.variable} h-full`}
    >
      <body className="antialiased min-h-full">{children}</body>
    </html>
  );
}
