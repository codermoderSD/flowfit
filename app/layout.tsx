import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster as HotToaster } from "react-hot-toast";
import { TimerProvider } from "@/contexts/TimerContext";
import FloatingTimer from "@/components/FloatingTimer";
import "./globals.css";
import { Suspense } from "react";

import {
  Inter,
  JetBrains_Mono,
  Source_Serif_4 as V0_Font_Source_Serif_4,
} from "next/font/google";

// Initialize fonts
const _sourceSerif_4 = V0_Font_Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-source-serif-4",
});
const _v0_fontVariables = `${_sourceSerif_4.variable}`;

// Initialize fonts with proper weights
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowFit - Stay Active While Working",
  description:
    "An app that helps remote workers stay active with timed movement reminders",
  manifest: "/manifest.json",
  themeColor: "#14b8a6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlowFit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased ${_v0_fontVariables}`}
      >
        <TimerProvider>
          <Suspense fallback={null}>
            {children}
            <FloatingTimer />
            <HotToaster position="top-right" />
            <Analytics />
          </Suspense>
        </TimerProvider>
      </body>
    </html>
  );
}
