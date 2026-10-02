"use client"
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AddAd() {
  const [size, setSize] = useState("100%");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sizesInfo: any = {
    "100%": { w: "728x90", h: "h-[90px]", label: "عريض" },
    "50%": { w: "300x250", h: "h-[160px]", label: "متوسط" },
    "25%": { w: "250x250", h: "h-[110px]", label: "صغير" },
  };

  const onPick = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) return alert("الصورة كبيرة - اختار أقل من 800KB");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!preview) return alert("اختار صورة البنر أول");
    if (!title) return alert("اكتب عنوان");
    setLoading(true);
    try {
      await addDoc(collection(db, "ads"), {
        title, link, size,
        imageUrl: preview, // Base64 مباشرة
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
    <div className="max-w-[480px] mx-auto p-4 bg-white min-h-screen" dir="rtl">
      <h1 className="font-black text-xl">إضافة إعلان بصورة</h1>

      <select value={size} onChange={e => setSize(e.target.value)} className="w-full border p-3 rounded-xl mt-4 font-bold">
        <option value="100%">100% - {sizesInfo["100%"].w}</option>
        <option value="50%">50% - {sizesInfo["50%"].w}</option>
        <option value="25%">25% - {sizesInfo["25%"].w}</option>
      </select>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الإعلان" className="w-full border p-3 rounded-xl mt-3" />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="رابط (اختياري)" className="w-full border p-3 rounded-xl mt-3" />

      <label className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 mt-4 overflow-hidden ${sizesInfo[size].h}`}>
        {preview? (
          <img src={preview} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-2">
            <div className="text-2xl">📸</div>
            <p className="text-xs font-bold">ارفع صورة {size}</p>
            <p className="text-[10px] text-gray-400">{sizesInfo[size].w} - أقل من 800KB</p>
          </div>
        )}
        <input type="file" accept="image/*" hidden onChange={onPick} />
      </label>

      <button onClick={save} disabled={loading} className="w-full bg-black text-white py-3 rounded-xl mt-5 font-black disabled:opacity-50">
        {loading? "جاري الحفظ..." : "نشر الإعلان"}
      </button>

      <p className="text-[10px] text-gray-400 mt-3 text-center">لو عايز صور أكبر من 800KB فعل الـ Storage في Firebase</p>
    </div>
  );
}