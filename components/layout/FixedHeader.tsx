"use client"
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Users, Bell, MessageCircle, Circle } from "lucide-react";
import TickerBar from "./TickerBar";

export default function FixedHeader({ onOpenContacts }: { onOpenContacts: () => void }){
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reqCount, setReqCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return;
      const snap = await import("firebase/firestore").then(m=> m.getDoc(doc(db,'users',u.uid)));
      setCurrentUser({uid:u.uid,...snap.data()});
      onSnapshot(query(collection(db,'friendRequests'), where('to','==', u.uid), where('status','==','pending')), s=> setReqCount(s.size));
      onSnapshot(query(collection(db,'notifications'), where('toUid','==', u.uid)), s=> setNotifCount(s.docs.filter(d=>!d.data().read).length));
      onSnapshot(query(collection(db,'chats'), where('members','array-contains', u.uid)), s=> setMsgCount(s.size));
      onSnapshot(collection(db,'users'), s=> setOnlineCount(s.docs.filter(d=>d.data().isOnline).length));
    });
    return ()=> unsub();
  },[]);

  if(!currentUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full">
      <TickerBar />
      {/* Desktop - بدون زر خروج */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35] w-full">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${currentUser?.uid}`} className="flex items-center gap-2"><img src={currentUser?.photoURL || currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-[#00E5FF] object-cover"/><span className="font-bold text-sm">{currentUser?.displayName}</span></Link>
          <button onClick={onOpenContacts} className="relative w-10 h-10 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-5 h-5 text-[#00E5FF] fill-[#00E5FF]" />{onlineCount>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{onlineCount}</span>}</button>
          <Link href="/messages" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-5 h-5"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <Link href="/friends" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-5 h-5"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-5 h-5"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right"><h1 className="font-black text-[22px] leading-none">Posta<span className="text-[#00E5FF]">tee</span></h1><p className="text-[9px] text-gray-400">منصة سودانية</p></div><div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center text-black font-black">P</div>
        </div>
      </header>

      {/* Mobile - الترتيب الجديد الثابت: بروفايل | متصلين | رسائل | اصدقاء | تنبيهات */}
      <header className="flex lg:hidden items-center justify-between px-3 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35]">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${currentUser?.uid}`}><img src={currentUser?.photoURL || currentUser?.avatar} className="w-9 h-9 rounded-full border-2 border-[#00E5FF] object-cover"/></Link>
          <button onClick={onOpenContacts} className="relative w-8 h-8 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-4 h-4 text-[#00E5FF] fill-[#00E5FF]" />{onlineCount>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{onlineCount}</span>}</button>
          <Link href="/messages" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <Link href="/friends" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-4 h-4"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/notifications" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-4 h-4"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{notifCount > 9? '9+' : notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-2"><h1 className="font-black text-[18px]">Posta<span className="text-[#00E5FF]">tee</span></h1><div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div></div>
      </header>
    </div>
  )
}