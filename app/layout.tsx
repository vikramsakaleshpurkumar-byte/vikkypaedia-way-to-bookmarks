import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://waymark-rescue-alpha.sri-rc.chatgpt.site"),
  title: "Waymark — Rescue your bookmarks",
  description:
    "A private personal action memory that helps you find and use what you saved.",
  openGraph: {
    title: "Waymark — Rescue your bookmarks",
    description:
      "Find what you remember and turn saved material into action.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Waymark" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waymark — Rescue your bookmarks",
    description:
      "Find what you remember and turn saved material into action.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
