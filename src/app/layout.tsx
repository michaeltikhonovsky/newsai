import type { Metadata } from "next";

import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NewsAI - Generate News Clips with AI",
  description:
    "Create realistic news broadcasts with AI powered lipsync technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`min-h-screen ${jetbrainsMono.variable} antialiased bg-background text-white`}
      >
        <div>{children}</div>
      </body>
    </html>
  );
}
