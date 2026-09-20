"use client"
import { useState } from "react";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function RegisterPage(){
  const [method, setMethod] = useState<"email"|"phone">("email");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({name:"", email:"", phone:"", password:""});

  const handleRegister = () => {
    if(!form.name) return alert("اكتب اسمك");
    if(method==="email" &&!form.email.includes("@")) return alert("الايميل غلط");
    if(method==="phone" && form.phone.length < 9) return alert("رقم الجوال غلط");
    if(form.password.length < 6) return alert("كلمة السر لازم 6 احرف على الاقل");
    alert(`مبروك يا ${form.name}! سجلت بـ ${method==="email"?form.email:form.phone} 🎉`);
    window.location.href = "/";
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-[420px] bg-white/[0.04] border border-white/10 rounded-[24px] p-6">
          <div className="flex items-center gap-2 mb-6"><img src="/logo.png" className="w-10 h-10 rounded-xl border border-cyan-400/20 p-1 bg-white/5"/><span className="font-black text-xl text-white">Postatee</span></div>
          <h1 className="text-2xl font-black text-white">إنشاء حساب جديد</h1>
          <p className="text-white/50 text-sm mb-6 mt-1">انضم لأول منصة سودانية 🖤💎</p>
          <div className="flex bg-black/40 border border-white/10 rounded-full p-1 mb-6">
            <button onClick={()=>setMethod("email")} className={`flex-1 flex gap-2 justify-center py-2 rounded-full text-sm font-bold transition ${method==="email"?"bg-cyan-400 text-black":"text-white/60"}`}><Mail className="w-4 h-4"/>بالإيميل</button>
            <button onClick={()=>setMethod("phone")} className={`flex-1 flex gap-2 justify-center py-2 rounded-full text-sm font-bold transition ${method==="phone"?"bg-cyan-400 text-black":"text-white/60"}`}><Phone className="w-4 h-4"/>برقم الجوال</button>
          </div>
          <div className="space-y-3">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/40 text-white"/>
            {method==="email"? <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="example@email.com" dir="ltr" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"/> : <div className="relative"><span className="absolute left-3 top-3.5 text-white/30 text-sm">+249</span><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="91 123 4567" dir="ltr" className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-sm outline-none text-white"/></div>}
            <div className="relative"><input type={showPass?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"/><button onClick={()=>setShowPass(!showPass)} className="absolute left-3 top-3 text-white/40">{showPass?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button></div>
            <button onClick={handleRegister} className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black py-3 rounded-xl mt-2">إنشاء الحساب</button>
          </div>
          <p className="text-center text-white/40 text-sm mt-6">عندك حساب؟ <Link href="/login" className="text-cyan-400 font-bold">سجل دخول</Link></p>
        </div>
      </div>
    </>
  )
}