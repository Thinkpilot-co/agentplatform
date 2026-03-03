import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/dashboard/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentPlatform — OpenClaw Control Plane",
  description: "Multi-instance OpenClaw agent management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden">
        <Providers>
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
