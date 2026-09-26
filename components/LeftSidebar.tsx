"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, MessageCircle, Bell, User, LogOut } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

const menu = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/friends", icon: Users, label: "الأصدقاء" },
  { href: "/messages", icon: MessageCircle, label: "الرسائل" },
  { href: "/notifications", icon: Bell, label: "الإشعارات" },
];

export default function LeftSidebar(){
  const path = usePathname();
  const router = useRouter();
  const [uid, setUid] = useState<string|null>(null);

  useEffect(()=>{
    return auth.onAuthStateChanged((u)=>{ if(u) setUid(u.uid); });
  },[]);

  const logout = async()=>{
    try{ if(auth.currentUser) await updateDoc(doc(db,'users', auth.currentUser.uid), {isOnline:false}); }catch{}
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="hidden lg:flex w-[280px] h-screen sticky top-0 flex-col bg-[#0B1418] border-l border-white/10 p-3 shrink-0">
      <h1 className="font-black text-[22px] text-white px-3 py-4 tracking-widest">POSTATEE</h1>
      <nav className="flex-1 space-y-1 mt-2">
        {menu.map(m=>{
          const active = path === m.href;
          return (
            <Link key={m.href} href={m.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[14px] transition ${active? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}>
              <m.icon className="w-5 h-5"/> {m.label}
            </Link>
          )
        })}
        <Link href={uid? `/profile/${uid}` : `/profile`} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[14px] ${path?.startsWith('/profile')? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.06]'}`}>
          <User className="w-5 h-5"/> الملف الشخصي
        </Link>
      </nav>
      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-[14px] mt-auto">
        <LogOut className="w-5 h-5"/> خروج
      </button>
    </div>
  )
}