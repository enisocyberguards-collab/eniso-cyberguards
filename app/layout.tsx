import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "ENISo CyberGuards — Application",
  description:
    "Join ENISo's cybersecurity club. Submit your application in just a few seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jbmono.variable}>
      <body className="font-mono antialiased bg-void">
        <div className="crt-overlay" />
        <div className="crt-vignette" />
        {children}
      </body>
    </html>
  );
}
