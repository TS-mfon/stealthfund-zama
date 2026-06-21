import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: "StealthFund — Confidential Capital Formation",
  description: "Raise, govern and distribute startup capital privately with Zama FHE.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers>{children}</Providers></body></html>}
