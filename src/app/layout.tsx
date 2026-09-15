import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Rink Rats",
  description: "Track your kid's ice time and stats in one tap.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Rink Rats" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-slate-950 text-slate-50 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
