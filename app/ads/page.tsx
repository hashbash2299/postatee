"use client"
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function AdWall() {
  const [ads, setAds] = useState<any[]>([]);

  const fetchAds = async () => {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setAds(snap.docs.map(d => ({ id: d.id,...d.data() })));
  };
  useEffect(() => { fetchAds(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("تحذف الإعلان ده نهائي؟")) return;
    await deleteDoc(doc(db, "ads", id));
    setAds(prev => prev.filter(a => a.id!== id));
  };

  const AdCard = ({ ad, h }: any) => (
    <div className={`relative rounded-xl p-3 text-white flex flex-col justify-center bg-gradient-to-r ${ad.color} ${h}`}>
      <button onClick={() => handleDelete(ad.id)} className="absolute top-2 right-2 bg-black/60 w-7 h-7 rounded-full text-xs z-10">✕</button>
      <p className="font-bold text-sm">Banner • {ad.size}</p>
      <p className="text-xs mt-1">{ad.title}</p>
      <span className="absolute bottom-2 left-2 bg-white/90 text-black text-[9px] px-2 py-0.5 rounded-full">{ad.size}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col max-w-[480px] mx-auto">
      {/* الشريط العلوي ثابت */}
      <div className="sticky top-0 z-30 bg-amber-100 border-y py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-xs">📢 Top Ticker Ad • حملتك هنا • وصول 100k يوميا •</div>
      </div>

      <div className="bg-white p-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">Ad Gallery</h1>
        <Link href="/ads/add" className="bg-black text-white text-sm px-4 py-2 rounded-full">+ إضافة</Link>
      </div>

      {/* الفيد المتحرك */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 bg-white">
        {/* 100% */}
        <div className="space-y-3">
          {ads.filter(a => a.size === "100%").map(ad => (
            <AdCard key={ad.id} ad={ad} h="h-[80px]" />
          ))}
        </div>
        {/* 50% */}
        <div className="grid grid-cols-2 gap-3">
          {ads.filter(a => a.size === "50%").map(ad => (
            <AdCard key={ad.id} ad={ad} h="h-[95px]" />
          ))}
        </div>
        {/* 25% */}
        <div className="grid grid-cols-4 gap-2">
          {ads.filter(a => a.size === "25%").map(ad => (
            <AdCard key={ad.id} ad={ad} h="h-[70px]" />
          ))}
        </div>

        {ads.length === 0 && <p className="text-center text-gray-400 text-sm py-10">لا يوجد إعلانات حاليا</p>}
      </div>

      {/* الشريط السفلي ثابت */}
      <div className="sticky bottom-0 z-30 bg-amber-50 border-t py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-[11px]">📢 Bottom Ticker Ad • Track Impressions •</div>
      </div>
    </div>
  );
}