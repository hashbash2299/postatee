import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";
import RightContacts from "@/components/RightContacts";

export const metadata = { title: "Postatee", description: "منصة سودانية" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="fb-font bg-[#0B1418] text-white">
        <div className="flex w-full min-h-screen max-w-[1600px] mx-auto">
          <LeftSidebar />
          <main className="flex-1 min-w-0 border-x border-white/10 bg-[#050a0a] min-h-screen">
            {children}
          </main>
          <RightContacts />
        </div>
      </body>
    </html>
  );
}