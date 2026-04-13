import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Layout/Sidebar";
import LayoutClientWrapper from "@/components/Layout/LayoutClientWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HireAI — Voice-Powered Recruitment Platform | Bolna",
  description: "Bolna Full Stack Assignment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter antialiased`}>
        <AppProvider>
          <div className="min-h-screen bg-[#0b0b14] text-white">
            <Sidebar />
            <LayoutClientWrapper>
              {children}
            </LayoutClientWrapper>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#1a1a2e",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "13px",
                },
                success: {
                  iconTheme: { primary: "#6366f1", secondary: "#fff" },
                },
              }}
            />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
