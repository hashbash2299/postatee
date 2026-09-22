"use client"
import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getErrorArabic = (code: string) => {
    if(code.includes("invalid-email")) return "صيغة الإيميل غير صحيحة، اتأكد مافي مسافة";
    if(code.includes("user-not-found")) return "المستخدم غير موجود";
    if(code.includes("wrong-password")) return "كلمة السر غلط";
    if(code.includes("too-many-requests")) return "محاولات كتيرة، انتظر دقيقة";
    if(code.includes("network")) return "مشكلة في النت";
    return code;
  }

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailClean = email.trim().toLowerCase(); // ده الحل لـ invalid-email
      const cred = await signInWithEmailAndPassword(auth, emailClean, password);

      // هنا كان بفشل بسبب الرولز القديمة
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (!snap.exists() ||!snap.data().profileCompleted) {
          router.push('/profile/setup');
        } else {
          router.push('/');
        }
      } catch {
        // لو الدوكيومنت لسه ما اتعمل، وديهو يكمل بروفايلو
        router.push('/profile/setup');
      }

    } catch (err: any) {
      alert("خطأ في الدخول: " + getErrorArabic(err.code || err.message));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          username: cred.user.displayName?.replace(/\s+/g,'_') || 'user_'+Date.now(),
          displayName: cred.user.displayName || 'مستخدم',
          avatar: cred.user.photoURL || `https://i.pravatar.cc/100?u=${cred.user.uid}`,
          profileCompleted: false,
          created_at: serverTimestamp()
        });
        router.push('/profile/setup');
      } else if (!snap.data().profileCompleted) {
        router.push('/profile/setup');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      alert(getErrorArabic(err.code || err.message));
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px]"></div>

        <div className="w-full max-w-[420px] bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <img src="/logo.png" className="w-16 h-16 mx-auto rounded-2xl bg-white/5 p-2 border border-cyan-400/20 mb-4"/>
            <h1 className="text-3xl font-black text-white">مرحباً بعودتك</h1>
            <p className="text-white/50 text-sm mt-2">سجل دخولك لمنصة Postatee</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" required
                className="w-full bg-white/[0.05] border border-white/10 rounded-full px-5 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50 focus:bg-white/[0.08] transition-all"/>
            </div>
            <div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر" required
                className="w-full bg-white/[0.05] border border-white/10 rounded-full px-5 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50 focus:bg-white/[0.08] transition-all"/>
            </div>
            <button disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black py-3.5 rounded-full hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50">
              {loading? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6"><div className="flex-1 h-[1px] bg-white/10"></div><span className="text-white/30 text-xs">أو</span><div className="flex-1 h-[1px] bg-white/10"></div></div>

          <button onClick={handleGoogle} className="w-full bg-white text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white/90 transition-all">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> الدخول بـ Google
          </button>

          <p className="text-center text-white/40 text-sm mt-8">
            ما عندك حساب؟ <Link href="/register" className="text-cyan-400 font-bold hover:underline">إنشاء حساب جديد</Link>
          </p>
        </div>
      </div>
    </>
  );
}