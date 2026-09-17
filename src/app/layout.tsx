import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Chatworld — Enter a world that remembers you",
    template: "%s | Chatworld",
  },
  description:
    "AI character roleplay & interactive storytelling. Create characters, build worlds, and live stories that remember you.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon-180.png",
  },
  openGraph: {
    siteName: "Chatworld",
    title: "Chatworld — Enter a world that remembers you",
    description:
      "AI character roleplay & interactive storytelling. Create characters, build worlds, and live stories that remember you.",
  },
};

export const viewport: Viewport = {
  themeColor: "#130E0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
