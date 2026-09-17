import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppFrame } from "@/components/shell/AppFrame";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HIYYA Command Center",
  description:
    "Role-based analytics for HIYYA Kitchens — demo build, fabricated data, no authentication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(heading.variable, sans.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
