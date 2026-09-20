"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";

export default function RegisterLanding() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"register">("register");
  const [accountType, setAccountType] = useState<"personal"|"business">("personal");
  const [loginMethod, setLoginMethod] = useState<"email"|"phone">("email");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const checkUsername = async (val:string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g,"");
    setUsername(clean);
    if(clean.length < 3){ setUsernameStatus(""); return; }
    const ref = doc(db, "usernames", clean);
    const snap = await getDoc(ref);
    setUsernameStatus(snap.exists()? "❌ محجوز" : "✅ متاح - ملكك للأبد");
  };

  const handleAction = async () => {
    if(mode==="register"){
      if(usernameStatus.includes("محجوز")) return alert("اليوزرنيم محجوز");
      if(!username ||!form.email ||!form.password) return alert("املا البيانات");
      setLoading(true);
      try{
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "usernames", username), { uid: cred.user.uid, createdAt: serverTimestamp() });
        await setDoc(doc(db, "users", cred.user.uid), {
          username, displayName: form.name, email: form.email,
          type: accountType, createdAt: serverTimestamp()
        });
        router.push("/feed");
      } catch(e:any){ alert(e.message); }
      setLoading(false);
    } else {
      setLoading(true);
      try{ await signInWithEmailAndPassword(auth, form.email, form.password); router.push("/feed"); }
      catch(e:any){ alert(e.message); }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#081a1a]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>

      {/* 50% إعلان */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-10 bg-gradient-to-br from-black via-[#0a2020] to-[#0e3333] overflow-hidden">
        <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1000" className="w-full h-full object-cover opacity-20"/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/></div>
        <div className="relative z-10 flex items-center gap-3"><img src="/logo.png" className="w-12 h-12 rounded-2xl bg-white/5 border border-cyan-400/20 p-1"/><span className="text-white font-black text-2xl">Postatee</span></div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-5xl font-black text-white leading-[1.1]">أول منصة<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-300">سودانية 💎</span></h1>
          <p className="text-white/50 text-lg">اليوزرنيم ملكك للأبد. ما بتكرر نهائي زي انستغرام.</p>
          <div className="flex gap-2 pt-4"><div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white">👤 شخصي</div><div className="bg-white/5 border border-yellow-500/20 rounded-2xl px-3 py-2 text-sm text-white">🏢 تجاري</div></div>
        </div>
        <div className="relative z-10 text-white/20 text-xs">© Postatee 2026 - أمدرمان</div>
      </div>

      {/* 50% تسجيل / دخول - ده نفس تصميمك */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-[#0d2d2d]">
        <div className="w-full max-w-[400px] bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-[28px] p-7 space-y-4 shadow-2xl">
          <div className="text-center space-y-1">
            <h2 className="text-[22px] font-black text-white">{mode==="login"? "تسجيل الدخول" : "إنشاء حساب جديد"}</h2>
            <p className="text-cyan-200/70 text-sm">💎 انضم لأول منصة سودانية 🖤</p>
          </div>

          <div className="bg-black/40 rounded-full p-1 flex"><button onClick={()=>setAccountType("personal")} className={`flex-1 py-2 rounded-full text-sm font-bold ${accountType==="personal"?"bg-white text-black":"text-white/50"}`}>شخصي 👤</button><button onClick={()=>setAccountType("business")} className={`flex-1 py-2 rounded-full text-sm font-bold ${accountType==="business"?"bg-white text-black":"text-white/50"}`}>تجاري 🏢</button></div>

          <div className="bg-black/40 rounded-full p-1 flex"><button onClick={()=>setLoginMethod("phone")} className={`flex-1 py-2 rounded-full text-sm ${loginMethod==="phone"?"bg-white text-black font-bold":"text-white/50"}`}>📞 برقم الجوال</button><button onClick={()=>setLoginMethod("email")} className={`flex-1 py-2 rounded-full text-sm ${loginMethod==="email"?"bg-white text-black font-bold":"text-white/50"}`}>✉️ بالإيميل</button></div>

          {mode==="register" && (
            <div className="relative">
              <input value={username} onChange={e=>checkUsername(e.target.value)} placeholder="اليوزرنيم @username" className="w-full bg-white/[0.06] border border-cyan-400/20 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-400" />
              <span className={`absolute left-3 top-3.5 text-[11px] font-bold ${usernameStatus.includes("متاح")?"text-green-400":"text-red-400"}`}>{usernameStatus}</span>
            </div>
          )}

          {mode==="register" && <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="الاسم الكامل" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />}
          <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="example@email.com" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input value={form.password} onChange={e=>setForm({...form, password:e.target.value})} type="password" placeholder="كلمة المرور" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />

          <button onClick={handleAction} disabled={loading} className="w-full bg-gradient-to-r from-[#8ef0d5] to-[#c4fff4] text-black font-black py-3.5 rounded-xl disabled:opacity-50">{loading? "جاري..." : mode==="login"? "دخول" : `إنشاء حساب ${accountType==="business"?"تجاري":"شخصي"} - احجز @${username||'يوزرنيمك'}`}</button>

          <p className="text-center text-[13px] text-cyan-200/60">
            {mode==="login"? "ما عندك حساب؟" : "عندك حساب؟"} <button onClick={()=>setMode(mode==="login"?"register":"login")} className="text-cyan-300 font-black">{mode==="login"? "إنشاء حساب" : "سجل دخول"}</button>
          </p>
        </div>
      </div>
    </div>
  )
}