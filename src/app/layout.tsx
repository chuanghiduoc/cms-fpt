import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "react-hot-toast";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "FPT Hệ thống Quản lý Nội dung",
  description: "Hệ thống Quản lý Nội dung nội bộ dành cho FPT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${robotoSans.variable} ${robotoMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000
          }}
          reverseOrder={false}
        />
      </body>
    </html>
  );
}
