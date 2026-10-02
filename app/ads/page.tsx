"use client"
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function AdWall() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    try {
      const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAds(snap.docs.map(d => ({ id: d.id,...d.data() })));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("متأكد عايز تحذف الإعلان ده نهائي؟")) return;
    await deleteDoc(doc(db, "ads", id));
    setAds(prev => prev.filter(a => a.id!== id));
  };

  const AdCard = ({ ad, h }: { ad: any; h: string }) => (
    <div className={`relative rounded-xl overflow-hidden bg-[#1A2E35] border border-[#1A2E35] group ${h}`}>
      {ad.imageUrl? (
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-r ${ad.color || "from-blue-500 to-blue-700"} flex items-center justify-center p-2`}>
          <p className="text-white font-bold text-xs text-center">{ad.title}</p>
        </div>
      )}
      {/* تظليل للنص */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>

      {/* معلومات */}
      <span className="absolute top-2 left-2 bg-white text-black text-[9px] font-black px-2 py-1 rounded-full">{ad.size}</span>
      <p className="absolute bottom-2 left-2 right-10 text-white text-[11px] font-bold leading-tight line-clamp-2">{ad.title}</p>

      {/* زر الحذف */}
      <button
        onClick={() => handleDelete(ad.id)}
        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 w-7 h-7 rounded-full text-white text-[12px] font-black flex items-center justify-center shadow-lg transition-colors"
      >
        ✕
      </button>

      {/* رابط */}
      {ad.link && (
        <a href={ad.link} target="_blank" className="absolute inset-0 z-0" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1418] flex flex-col max-w-[480px] mx-auto border-x border-[#1A2E35]" dir="rtl">
      {/* الشريط العلوي ثابت - Top Ticker */}
      <div className="sticky top-0 z-30 bg-[#FFD700] text-black border-b border-black/10 py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-[12px] font-black">
          📢 Top Ticker Ad • أعلن هنا يصلك 100k يوميا • Postatee Ads • تواصل معنا •
        </div>
      </div>

      <div className="bg-[#122025] p-4 flex justify-between items-center border-b border-[#1A2E35]">
        <h1 className="font-black text-xl text-white">جدار الإعلانات</h1>
        <Link href="/ads/add" className="bg-[#00E5FF] text-black text-sm px-5 py-2 rounded-full font-black">
          + إضافة
        </Link>
      </div>

      {/* الفيد - بسكرول لتحت */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 bg-[#0B1418]">
        {loading && <p className="text-center text-white/50 text-sm py-10">جاري تحميل البنرات...</p>}

        {!loading && ads.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-white/50 text-sm">لا يوجد إعلانات حاليا</p>
            <Link href="/ads/add" className="inline-block mt-3 bg-white text-black px-4 py-2 rounded-full text-xs font-bold">أضف أول بنر</Link>
          </div>
        )}

        {/* بنرات 100% - عرض كامل */}
        {ads.filter(a => a.size === "100%").length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] text-white/40 font-bold px-1">بنرات 100% - عرض كامل</p>
            {ads.filter(a => a.size === "100%").map(ad => (
              <AdCard key={ad.id} ad={ad} h="h-[90px]" />
            ))}
          </div>
        )}

        {/* بنرات 50% - متوسط */}
        {ads.filter(a => a.size === "50%").length > 0 && (
          <div>
            <p className="text-[11px] text-white/40 font-bold px-1 mt-2">بنرات 50% - متوسط</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {ads.filter(a => a.size === "50%").map(ad => (
                <AdCard key={ad.id} ad={ad} h="h-[150px]" />
              ))}
            </div>
          </div>
        )}

        {/* بنرات 25% - صغير */}
        {ads.filter(a => a.size === "25%").length > 0 && (
          <div>
            <p className="text-[11px] text-white/40 font-bold px-1 mt-2">بنرات 25% - صغير</p>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {ads.filter(a => a.size === "25%").map(ad => (
                <AdCard key={ad.id} ad={ad} h="h-[90px]" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* الشريط السفلي ثابت - Bottom Ticker */}
      <div className="sticky bottom-0 z-30 bg-[#122025] text-white border-t border-[#1A2E35] py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-[11px] font-bold opacity-70">
          📢 Bottom Ticker Ad • Track Impressions • Featured Ads • إعلانك هنا •
        </div>
      </div>
    </div>
  );
}