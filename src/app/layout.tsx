import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Case Prep Agent",
  description: "Live, interactive consulting case-interview practice",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/upload", label: "Upload a case" },
  { href: "/admin/cases", label: "Admin" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Case Prep Agent
            </Link>
            <nav className="flex gap-5 text-sm text-neutral-600">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-neutral-900">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
