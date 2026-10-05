import "./globals.css";
import FixedHeaderWrapper from "@/components/layout/FixedHeaderWrapper";
import PresenceProvider from "@/components/PresenceProvider";
import GlobalCall from "@/components/GlobalCall";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Postatee - منصة سودانية",
  description: "منصة سودانية - تواصل ومكالمات صوتية",
  manifest: "/manifest.json",
  themeColor: "#00E5FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Postatee",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#0B1418] text-white">
        <PresenceProvider>
          <FixedHeaderWrapper />
          {/* ✅ اهم سطر - يخلي المكالمة تظهر في كل الموقع */}
          <GlobalCall />
          <div className="pt-[110px] min-h-screen">{children}</div>

          <footer className="bg-[#0B1418] border-t border-white/10 mt-10 py-10 text-center">
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-300 mb-4">
              <Link href="/about" className="hover:text-white hover:underline">من نحن</Link>
              <Link href="/contact" className="hover:text-white hover:underline">اتصل بنا</Link>
              <Link href="/privacy" className="hover:text-white hover:underline">سياسة الخصوصية</Link>
              <Link href="/terms" className="hover:text-white hover:underline">شروط الاستخدام</Link>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} بوستاتي Postatee - جميع الحقوق محفوظة.
            </p>
          </footer>
        </PresenceProvider>
      </body>
    </html>
  );
}