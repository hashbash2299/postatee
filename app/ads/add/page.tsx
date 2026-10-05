"use client"
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddAd() {
  const [size, setSize] = useState("100%");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sizesInfo: any = {
    "100%": { w: "728x90", h: "h-[90px]", label: "عريض - للعروض الكبيرة" },
    "50%": { w: "300x250", h: "h-[160px]", label: "متوسط - مطاعم وخدمات" },
    "25%": { w: "250x250", h: "h-[110px]", label: "صغير - تطبيقات" },
  };

  const onPick = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) return alert("الصورة كبيرة - اختار أقل من 800KB عشان تظهر لكل الناس بسرعة");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!preview) return alert("اختار صورة البنر أول");
    if (!title) return alert("اكتب عنوان الإعلان");
    setLoading(true);
    try {
      await addDoc(collection(db, "ads"), {
        title, link, size,
        imageUrl: preview,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      router.push("/ads");
    } catch (err: any) {
      alert("خطأ: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1418] text-white" dir="rtl">
      <div className="max-w-[480px] mx-auto p-4 bg-[#0B1418] min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <Link href="/ads" className="text-white/60 text-sm">← رجوع</Link>
          <h1 className="font-black text-xl">إضافة إعلان</h1>
          <div className="w-10"></div>
        </div>

        <div className="bg-[#122025] rounded-2xl p-4 border border-[#1A2E35] space-y-4">
          {/* المقاس */}
          <div>
            <label className="text-[12px] font-bold text-white/70 mb-1 block">مقاس البنر</label>
            <select value={size} onChange={e => setSize(e.target.value)} className="w-full border border-[#1A2E35] p-3 rounded-xl font-bold bg-white text-black outline-none focus:border-[#00E5FF]">
              <option value="100%">100% - {sizesInfo["100%"].w} - {sizesInfo["100%"].label}</option>
              <option value="50%">50% - {sizesInfo["50%"].w} - {sizesInfo["50%"].label}</option>
              <option value="25%">25% - {sizesInfo["25%"].w} - {sizesInfo["25%"].label}</option>
            </select>
          </div>

          {/* العنوان */}
          <div>
            <label className="text-[12px] font-bold text-white/70 mb-1 block">اسم الإعلان</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثلا: تخفيضات متجر الخرطوم 50%"
              className="w-full border border-[#1A2E35] p-3 rounded-xl bg-white text-black placeholder:text-gray-500 font-bold outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* الرابط */}
          <div>
            <label className="text-[12px] font-bold text-white/70 mb-1 block">رابط الإعلان (اختياري)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full border border-[#1A2E35] p-3 rounded-xl bg-white text-black placeholder:text-gray-500 outline-none focus:border-[#00E5FF] text-left"
              dir="ltr"
            />
          </div>

          {/* رفع الصورة - بنفس حجم البنر */}
          <div>
            <label className="text-[12px] font-bold text-white/70 mb-1 block">صورة البنر - {sizesInfo[size].w}</label>
            <label className={`w-full border-2 border-dashed border-[#2A4A5A] rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-gray-50 overflow-hidden transition-colors ${sizesInfo[size].h}`}>
              {preview? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <div className="text-2xl">📸</div>
                  <p className="text-xs font-black text-black">اضغط لرفع صورة {size}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{sizesInfo[size].w} • أقل من 800KB</p>
                </div>
              )}
              <input type="file" accept="image/*" hidden onChange={onPick} />
            </label>
          </div>

          <button onClick={save} disabled={loading} className="w-full bg-[#00E5FF] text-black py-3 rounded-xl font-black text-[15px] disabled:opacity-50 hover:bg-[#00D4EC] transition-colors">
            {loading? "جاري الحفظ..." : "نشر الإعلان الآن 🚀"}
          </button>

          <p className="text-[10px] text-white/40 text-center">مفتوح حاليا مجانا لكل الناس • قريبا مدفوع</p>
        </div>
      </div>
    </div>
  );
}