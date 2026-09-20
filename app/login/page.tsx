"use client"
import { useState } from "react";
import Link from "next/link";

export default function LoginPage(){
  const [method, setMethod] = useState<"email"|"phone">("email");
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-[420px] bg-white/[0.04] border border-white/10 rounded-[24px] p-6">
          <h1 className="text-2xl font-black text-white mb-2">تسجيل الدخول</h1>
          <p className="text-white/50 text-sm mb-6">مرحب بيك راجع في بوستاتي 💎</p>
          <div className="flex bg-black/40 border border-white/10 rounded-full p-1 mb-6">
            <button onClick={()=>setMethod("email")} className={`flex-1 py-2 rounded-full text-sm font-bold ${method==="email"?"bg-cyan-400 text-black":"text-white/60"}`}>بالإيميل</button>
            <button onClick={()=>setMethod("phone")} className={`flex-1 py-2 rounded-full text-sm font-bold ${method==="phone"?"bg-cyan-400 text-black":"text-white/60"}`}>برقم الجوال</button>
          </div>
          <div className="space-y-3">
            {method==="email"? <input placeholder="الإيميل" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"/> : <input placeholder="رقم الجوال +249" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"/>}
            <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"/>
            <button onClick={()=>window.location.href="/"} className="w-full bg-cyan-400 text-black font-black py-3 rounded-xl">دخول</button>
          </div>
          <p className="text-center text-white/40 text-sm mt-6">ما عندك حساب؟ <Link href="/register" className="text-cyan-400 font-bold">إنشاء حساب</Link></p>
        </div>
      </div>
    </>
  )
}