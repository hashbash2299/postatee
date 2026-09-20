"use client"
import { useState } from "react";
import Link from "next/link";

export default function RegisterLanding() {
  const [mode, setMode] = useState<"login"|"register">("register");
  const [type, setType] = useState<"personal"|"business">("personal");
  const [method, setMethod] = useState<"email"|"phone">("email");

  return (
    <div className="min-h-screen flex bg-[#081a1a]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>

      {/* نص الاعلان 50% */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-10 bg-[#0a2020]">
        <div className="flex items-center gap-2"><img src="/logo.png" className="w-10 h-10 rounded-xl"/><span className="text-white font-black">Postatee</span></div>
        <div>
          <h1 className="text-5xl font-black text-white leading-tight">أول منصة<br/><span className="text-cyan-300">سودانية 💎</span></h1>
          <p className="text-white/50 mt-4">اليوزرنيم ملكك للأبد - ما بتكرر.</p>
        </div>
        <div className="text-white/20 text-xs">© Postatee 2026</div>
      </div>

      {/* نص التسجيل 50% - نفس تصميمك */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-[#0d2d2d]">
        <div className="w-full max-w-[400px] bg-white/[0.07] border border-white/10 rounded-[28px] p-7 space-y-4">
          <h2 className="text-xl font-black text-white text-center">{mode==="login"?"تسجيل الدخول":"إنشاء حساب جديد"}</h2>

          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setType("personal")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="personal"?"bg-white text-black":"text-white/50"}`}>شخصي 👤</button>
            <button onClick={()=>setType("business")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="business"?"bg-white text-black":"text-white/50"}`}>تجاري 🏢</button>
          </div>

          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setMethod("phone")} className={`flex-1 py-2 rounded-full text-sm ${method==="phone"?"bg-white text-black font-bold":"text-white/50"}`}>برقم الجوال</button>
            <button onClick={()=>setMethod("email")} className={`flex-1 py-2 rounded-full text-sm ${method==="email"?"bg-white text-black font-bold":"text-white/50"}`}>بالإيميل</button>
          </div>

          <input placeholder="اليوزرنيم @username" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          <input placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          <input placeholder="example@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />

          <button className="w-full bg-gradient-to-r from-[#8ef0d5] to-[#c4fff4] text-black font-black py-3.5 rounded-xl">إنشاء الحساب</button>

          <p className="text-center text-xs text-white/50">
            {mode==="login"?"ما عندك حساب؟":"عندك حساب؟"}
            <button onClick={()=>setMode(mode==="login"?"register":"login")} className="text-cyan-300 font-bold mr-1">{mode==="login"?"إنشاء حساب":"سجل دخول"}</button>
          </p>
        </div>
      </div>
    </div>
  )
}