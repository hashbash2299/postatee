"use client"
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [method, setMethod] = useState<"email"|"phone">("email");
  return (
    <div className="min-h-screen flex bg-[#081a1a]" dir="rtl">
      <div className="hidden lg:flex w-1/2 p-10 bg-[#0a2020] flex-col justify-between">
        <span className="text-white font-black text-xl">Postatee 💎</span>
        <h1 className="text-5xl font-black text-white">أول منصة<br/><span className="text-cyan-300">سودانية</span></h1>
        <span className="text-white/20 text-xs">© Postatee</span>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-[#0d2d2d]">
        <div className="w-full max-w-[400px] bg-white/[0.07] border border-white/10 rounded-[28px] p-7 space-y-4">
          <h2 className="text-xl font-black text-white text-center">تسجيل الدخول</h2>
          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setMethod("phone")} className={`flex-1 py-2 rounded-full text-sm ${method==="phone"?"bg-white text-black font-bold":"text-white/50"}`}>برقم الجوال</button>
            <button onClick={()=>setMethod("email")} className={`flex-1 py-2 rounded-full text-sm ${method==="email"?"bg-white text-black font-bold":"text-white/50"}`}>بالإيميل</button>
          </div>
          <input placeholder="example@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
          <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
          <button className="w-full bg-[#8ef0d5] text-black font-black py-3.5 rounded-xl">دخول</button>
          <p className="text-center text-xs text-white/50">ما عندك حساب؟ <Link href="/register" className="text-cyan-300 font-bold">إنشاء حساب جديد</Link></p>
        </div>
      </div>
    </div>
  )
}