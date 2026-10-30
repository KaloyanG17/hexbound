import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hexbound",
  description: "An auto-battler with an original cast, playable offline against bots.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
