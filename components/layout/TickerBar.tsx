"use client"
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function TickerBar() {
  const [text, setText] = useState("🇸🇩 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩");

  useEffect(() => {
    // بنقرأ النص من settings/ticker - تقدر تغيرو من Firebase مباشرة
    const unsub = onSnapshot(doc(db, "settings", "ticker"), (snap) => {
      if (snap.exists() && snap.data().text) {
        setText(snap.data().text);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full bg-[#00E5FF] text-black overflow-hidden py-1.5 text-sm font-bold sticky top-0 z-[60]">
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="mx-10">{text}</span>
        <span className="mx-10">{text}</span>
        <span className="mx-10">{text}</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
       .animate-marquee {
          animation: marquee 30s linear infinite;
          display: flex;
          width: max-content;
        }
      `}</style>
    </div>
  );
}