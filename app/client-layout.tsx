"use client";
import AuthSync from "@/components/AuthSync";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthSync />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </>
  );
} 