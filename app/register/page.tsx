"use client"
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [type, setType] = useState<"personal"|"business">("personal");
  const [method, setMethod] = useState<"email"|"phone">("email");
  return (
    <div className="min-h-screen flex bg-[#081a1a]" dir="rtl">
      <div className="hidden lg:flex w-1/2 p-10 bg-[#0a2020] flex-col justify-between">
        <span className="text-white font-black text-xl">Postatee 💎</span>
        <div><h1 className="text-5xl font-black text-white">إنشاء حساب<br/><span className="text-cyan-300">جديد</span></h1><p className="text-white/50 mt-3">@username ملكك للأبد</p></div>
        <span className="text-white/20 text-xs">© Postatee</span>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-[#0d2d2d]">
        <div className="w-full max-w-[400px] bg-white/[0.07] border border-white/10 rounded-[28px] p-7 space-y-4">
          <h2 className="text-xl font-black text-white text-center">إنشاء حساب جديد</h2>
          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setType("personal")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="personal"?"bg-white text-black":"text-white/50"}`}>شخصي 👤</button>
            <button onClick={()=>setType("business")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="business"?"bg-white text-black":"text-white/50"}`}>تجاري 🏢</button>
          </div>
          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setMethod("phone")} className={`flex-1 py-2 rounded-full text-sm ${method==="phone"?"bg-white text-black font-bold":"text-white/50"}`}>برقم الجوال</button>
            <button onClick={()=>setMethod("email")} className={`flex-1 py-2 rounded-full text-sm ${method==="email"?"bg-white text-black font-bold":"text-white/50"}`}>بالإيميل</button>
          </div>
          <input placeholder="@username - فريد" className="w-full bg-white/5 border border-cyan-400/20 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input placeholder="example@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <button className="w-full bg-gradient-to-r from-[#8ef0d5] to-[#c4fff4] text-black font-black py-3.5 rounded-xl">إنشاء الحساب</button>
          <p className="text-center text-xs text-white/50">عندك حساب؟ <Link href="/login" className="text-cyan-300 font-bold">سجل دخول</Link></p>
        </div>
      </div>
    </div>
  )
}