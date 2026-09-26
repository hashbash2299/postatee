import "./globals.css";

export const metadata = { title: "Postatee", description: "منصة سودانية" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="fb-font bg-[#0B1418] text-white">
        <main className="w-full min-w-0 bg-[#050a0a] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}