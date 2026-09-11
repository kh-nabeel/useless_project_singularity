import type { Metadata } from "next";
import { Nanum_Pen_Script, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

const nanumPen = Nanum_Pen_Script({
  weight: "400",
  variable: "--font-nanum-pen",
  subsets: ["latin"],
});

const rubikMono = Rubik_Mono_One({
  weight: "400",
  variable: "--font-rubik-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Quest — Game-Gated QR Codes",
  description:
    "Generate QR codes that challenge scanners with a mini-game before revealing the destination. Maze, chase, or puzzle — unlock links the fun way!",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nanumPen.variable} ${rubikMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
