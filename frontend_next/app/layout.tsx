import type { Metadata } from "next";
import { McLaren, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import StoreProvider from "@/lib/store/StoreProvider";
import { AnimatedBackground, ScrollToTop, Header, Footer } from "@/components/layout";

const mclaren = McLaren({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mclaren",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Event Management System",
  description: "Manage and book events with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${mclaren.variable} ${inter.variable}`}>
      <body className="font-(family-name:--font-inter) antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <AnimatedBackground />
            <Header />
            <ScrollToTop />
            {children}
            <Footer />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
