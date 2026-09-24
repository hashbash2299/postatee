"use client"
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function TestProfile() {
  const { uid } = useParams();
  const [user, setUser] = useState<any>(null);
  useEffect(()=>{
    if(!uid) return;
    return onSnapshot(doc(db,'users',uid as string), s=> setUser(s.data()));
  },[uid]);

  if(!user) return <div className="bg-black min-h-screen text-white p-10">تحميل...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4" dir="rtl">
      <h1 className="text-2xl font-black mb-6">{user.displayName}</h1>

      {/* اختبار الزرين - لازم يظهرو */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[400px]">
        <button className="h-14 rounded-full bg-white text-black font-black text-lg">إضافة صديق</button>
        <button className="h-14 rounded-full border-2 border-cyan-400 text-cyan-400 font-black text-lg">طلب مراسلة</button>
      </div>

      <p className="mt-10 text-white/50">لو شفت الزرين ديل، معناها الملف اتحدث. بعدها نرجع الكود الكامل.</p>
    </div>
  )
}