"use client"
import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const [type, setType] = useState<"personal"|"business">("personal");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleRegister = async () => {
    if(!username ||!name ||!email ||!pass) return setStatus("❌ أكمل كل الحقول");
    if(username.includes(" ")) return setStatus("❌ اليوزرنيم بدون مسافات");

    setLoading(true); setStatus("⏳ بنفحص اليوزرنيم...");
    try {
      const cleanUser = username.toLowerCase().replace("@","");
      const userRef = doc(db, "usernames", cleanUser);
      const exists = await getDoc(userRef);
      if(exists.exists()){ setStatus("❌ @"+cleanUser+" محجوز، جرب واحد تاني"); setLoading(false); return; }

      setStatus("⏳ بننشئ حسابك...");
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        username: cleanUser,
        displayName: name,
        email: email,
        accountType: type,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, "usernames", cleanUser), { uid: cred.user.uid });

      setStatus("✅ تم! يوزرنيمك @"+cleanUser+" محفوظ للأبد");
      window.location.href = "/feed";
    } catch(e:any){
      setStatus("❌ "+ e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-[#081a1a]" dir="rtl">
      <div className="hidden lg:flex w-1/2 p-10 bg-[#0a2020] flex-col justify-between">
        <span className="text-white font-black text-xl">Postatee 💎</span>
        <h1 className="text-5xl font-black text-white">إنشاء حساب<br/><span className="text-cyan-300">حقيقي</span></h1>
        <span className="text-white/20 text-xs">يوزرنيم فريد للأبد</span>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-[#0d2d2d]">
        <div className="w-full max-w-[400px] bg-white/[0.07] border border-white/10 rounded-[28px] p-7 space-y-3">
          <h2 className="text-xl font-black text-white text-center">إنشاء حساب جديد</h2>

          <div className="bg-black/40 rounded-full p-1 flex">
            <button onClick={()=>setType("personal")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="personal"?"bg-white text-black":"text-white/50"}`}>شخصي 👤</button>
            <button onClick={()=>setType("business")} className={`flex-1 py-2 rounded-full text-sm font-bold ${type==="business"?"bg-white text-black":"text-white/50"}`}>تجاري 🏢</button>
          </div>

          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username - فريد وما بتكرر" className="w-full bg-white/5 border border-cyan-400/30 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="كلمة المرور (6 حروف على الأقل)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none" />

          {status && <p className="text-xs text-center text-cyan-200 bg-cyan-500/10 py-2 rounded-lg">{status}</p>}

          <button onClick={handleRegister} disabled={loading} className="w-full bg-gradient-to-r from-[#8ef0d5] to-[#c4fff4] text-black font-black py-3.5 rounded-xl disabled:opacity-50">
            {loading? "جاري..." : "إنشاء الحساب الحقيقي"}
          </button>
          <p className="text-center text-xs text-white/50">عندك حساب؟ <Link href="/login" className="text-cyan-300 font-bold">سجل دخول</Link></p>
        </div>
      </div>
    </div>
  )
}