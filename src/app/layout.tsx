import type { Metadata } from "next";
import { Gluten, Nunito } from "next/font/google";
import "./globals.css";

const display = Gluten({
  variable: "--font-gluten",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Loficade — Drill the deep well",
  description:
    "Daily mini-game for Lofi the Yeti. Catch meltwater, dodge ice hazards, and fill the Flurry community well.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
