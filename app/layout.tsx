import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Script from "next/script";
import { ANALYTICS_ON } from "@/lib/site";
import { THEME_KEY } from "@/lib/storage";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Folio · Free resume builder, no sign-up",
  description:
    "Build an ATS-friendly resume for free. Job match, honest AI, nine templates, PDF and Word downloads. No sign-up, no watermark.",
  openGraph: {
    title: "Folio · The resume builder that's actually free",
    description: "Job match, honest AI, nine ATS-safe templates, PDF and Word downloads. No sign-up, no watermark.",
    images: ["/screenshots/editor.png"],
  },
};

// Runs before the page paints, so someone who chose light mode never sees a flash of dark
const applyTheme = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light")document.documentElement.dataset.theme="light"}catch{}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme on <html> before React loads
    <html lang="en" className={`${figtree.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: applyTheme }} />
        {children}
        {/* Vercel Web Analytics: cookieless page-view counts, once switched on (see lib/site.ts) */}
        {ANALYTICS_ON && (
          <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
