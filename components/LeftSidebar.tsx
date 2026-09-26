"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, MessageCircle, Bell, User, LogOut, Video } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

const menu = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/friends", icon: Users, label: "الأصدقاء" },
  { href: "/messages", icon: MessageCircle, label: "الرسائل" },
  { href: "/notifications", icon: Bell, label: "الإشعارات" },
  { href: "/live", icon: Video, label: "البث المباشر" },
];

export default function LeftSidebar(){
  const path = usePathname();
  const router = useRouter();
  const [uid, setUid] = useState<string|null>(null);

  useEffect(()=>{
    // اسمع لليوزر بعد ما يحمل
    const unsub = auth.onAuthStateChanged((u)=>{
      if(u) setUid(u.uid);
    });
    return ()=> unsub();
  },[]);

  const logout = async()=>{
    const u = auth.currentUser;
    if(u) await updateDoc(doc(db,'users', u.uid), {isOnline:false}).catch(()=>{});
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="hidden lg:flex w-[280px] h-screen sticky top-0 flex-col bg-[#0A1A1F] border-l border-white/10 p-3">
      <h1 className="font-black text-[22px] text-white px-3 py-4">POSTATEE</h1>

      <nav className="flex-1 space-y-1 mt-2">
        {menu.map(m=>{
          const active = path === m.href;
          return (
            <Link key={m.href} href={m.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[14px] ${active? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <m.icon className="w-5 h-5"/> {m.label}
            </Link>
          )
        })}
        {uid && (
          <Link href={`/profile/${uid}`} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[14px] ${path?.startsWith('/profile')? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'}`}>
            <User className="w-5 h-5"/> الملف الشخصي
          </Link>
        )}
      </nav>

      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-[14px] mt-auto">
        <LogOut className="w-5 h-5"/> خروج
      </button>
    </div>
  )
}