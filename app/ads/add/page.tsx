"use client"
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AddAd() {
  const [size, setSize] = useState("100%");
  const [title, setTitle] = useState("");
  const router = useRouter();

  const colors: any = { "100%": "from-blue-500 to-blue-700", "50%": "from-green-400 to-green-600", "25%": "from-orange-300 to-orange-500" };

  const save = async () => {
    if (!title) return alert("اكتب عنوان الإعلان");
    await addDoc(collection(db, "ads"), { title, size, color: colors[size], createdAt: serverTimestamp(), expiresAt: new Date(Date.now() + 7*24*60*60*1000) });
    router.push("/ads");
  };

  return (
    <div className="max-w-[480px] mx-auto p-4">
      <h1 className="font-bold text-xl">إضافة بنر</h1>
      <select value={size} onChange={e => setSize(e.target.value)} className="w-full border p-3 rounded-xl mt-4">
        <option>100%</option><option>50%</option><option>25%</option>
      </select>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الإعلان - مثلا: Summer Sale" className="w-full border p-3 rounded-xl mt-3" />
      <div className={`mt-4 h-20 rounded-xl bg-gradient-to-r ${colors[size]} flex items-center justify-center text-white font-bold`}>معاينة {size}</div>
      <button onClick={save} className="w-full bg-black text-white py-3 rounded-xl mt-4 font-bold">حفظ ونشر</button>
    </div>
  );
}