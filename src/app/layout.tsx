import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://guilloguambi.com"),
  title: {
    default: "Guillo Guambi | Reformas y restauración en Barcelona",
    template: "%s | Guillo Guambi",
  },
  description:
    "Reformas integrales, saneado de humedades, pladur, pintura, cocinas, baños y reparación de espacios en Barcelona y alrededores.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://guilloguambi.com",
    siteName: "Guillo Guambi",
    title: "Guillo Guambi | Reformas con criterio, de principio a fin",
    description:
      "Reparamos lo que falla, saneamos lo que se ha deteriorado y transformamos el espacio completo.",
    images: [{
      url: "/images/hero-restauracion.webp",
      width: 1672,
      height: 941,
      alt: "Profesional restaurando el interior de una vivienda",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guillo Guambi | Reformas y restauración",
    description: "Reformas con criterio, trato directo y ejecución cuidada.",
    images: ["/images/hero-restauracion.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
