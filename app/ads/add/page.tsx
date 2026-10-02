"use client"
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AddAd() {
  const [size, setSize] = useState("100%");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sizesInfo: any = {
    "100%": { w: "728x90", h: "h-[90px]", label: "بنر عريض - مناسب للعروض الكبيرة" },
    "50%": { w: "300x250", h: "h-[160px]", label: "بنر متوسط - مطاعم وخدمات" },
    "25%": { w: "250x250", h: "h-[110px]", label: "بنر صغير - تطبيقات وأيقونات" },
  };

  const onPick = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!file) return alert("اختار صورة البنر أول");
    setLoading(true);
    const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "ads"), {
      title, link, size, imageUrl,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    router.push("/ads");
  };

  return (
    <div className="max-w-[480px] mx-auto p-4 bg-white min-h-screen" dir="rtl">
      <h1 className="font-black text-xl">إضافة إعلان بصورة</h1>

      <select value={size} onChange={e => setSize(e.target.value)} className="w-full border p-3 rounded-xl mt-4 font-bold">
        <option value="100%">100% - {sizesInfo["100%"].w}</option>
        <option value="50%">50% - {sizesInfo["50%"].w}</option>
        <option value="25%">25% - {sizesInfo["25%"].w}</option>
      </select>
      <p className="text-[11px] text-gray-500 mt-1">{sizesInfo[size].label}</p>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان - مثلا: تخفيضات الصيف" className="w-full border p-3 rounded-xl mt-3" />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="رابط الإعلان (اختياري)" className="w-full border p-3 rounded-xl mt-3" />

      {/* زر رفع بنفس مقاس البنر */}
      <div className="mt-4">
        <label className={`w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 ${sizesInfo[size].h}`}>
          {preview? (
            <img src={preview} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="text-center p-2">
              <div className="text-2xl">📸</div>
              <p className="text-xs font-bold">ارفع صورة {size}</p>
              <p className="text-[10px] text-gray-400">{sizesInfo[size].w} - سيظهر بنفس المقاس</p>
            </div>
          )}
          <input type="file" accept="image/*" hidden onChange={e => e.target.files && onPick(e.target.files[0])} />
        </label>
      </div>

      <button onClick={save} disabled={loading} className="w-full bg-black text-white py-3 rounded-xl mt-5 font-black disabled:opacity-50">
        {loading? "جاري الرفع..." : "نشر الإعلان"}
      </button>
    </div>
  );
}