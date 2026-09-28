import "./globals.css";
import FixedHeaderWrapper from "@/components/layout/FixedHeaderWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#0B1418] text-white">
        <FixedHeaderWrapper />
        <div className="pt-[88px]">{children}</div>
      </body>
    </html>
  );
}