import "./globals.css";
import FixedHeaderWrapper from "@/components/layout/FixedHeaderWrapper";
import PresenceProvider from "@/components/PresenceProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#0B1418] text-white">
        <PresenceProvider>
          <FixedHeaderWrapper />
          <div className="pt-[110px]">{children}</div>
        </PresenceProvider>
      </body>
    </html>
  );
}