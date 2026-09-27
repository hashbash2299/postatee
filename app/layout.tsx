import "./globals.css";

export const metadata = {
  title: "Postatee",
  description: "منصة سودانية",
  manifest: "/manifest.json",
  themeColor: "#00E5FF",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icon-192.png"
  }
};

export const viewport = {
  themeColor: "#00E5FF",
  backgroundColor: "#0B1418",
};

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