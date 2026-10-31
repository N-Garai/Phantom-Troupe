import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MotionProvider } from "@/components/phantom/motion-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Phantom Troupe — the graveyard of CLI scripts",
  description:
    "A local, multi-agent séance for your terminal. It captures failed commands, autopsies dead scripts, and resurrects the ones you still need. Runs on open-weight models. Nothing leaves your machine.",
  keywords: [
    "phantom troupe",
    "cli",
    "terminal",
    "shell history",
    "local ai",
    "ollama",
    "gemma",
    "open source",
    "agent",
  ],
  icons: { icon: "/sigil.svg" },
  openGraph: {
    title: "Phantom Troupe — the graveyard of CLI scripts",
    description:
      "Every command leaves a corpse. A local AI troupe that remembers your failures and resurrects your dead scripts.",
    siteName: "Phantom Troupe",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* ?motion=full — preview every animation even when the OS asks for reduced motion */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(new URLSearchParams(location.search).get("motion")==="full"){document.documentElement.setAttribute("data-motion-full","");}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased bg-background text-foreground noise`}
      >
        <MotionProvider>{children}</MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
