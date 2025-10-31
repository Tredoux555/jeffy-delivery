import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jeffy Delivery - Driver App",
  description: "Delivery driver application for Jeffy Commerce",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FCD34D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
