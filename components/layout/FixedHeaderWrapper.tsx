"use client"
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Bell, MessageCircle, Circle, X } from "lucide-react";
import TickerBar from "./TickerBar";

export default function FixedHeaderWrapper(){
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reqCount, setReqCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      setLoading(true);
      if(!u){ setCurrentUser(null); setLoading(false); return; }
      try{
        const snap = await getDoc(doc(db,'users',u.uid));
        if(snap.exists()) setCurrentUser({uid:u.uid,...snap.data()});
        else setCurrentUser({uid:u.uid, displayName: u.displayName, photoURL: u.photoURL});
      }catch(e){ setCurrentUser({uid:u.uid}); }
      onSnapshot(query(collection(db,'friendRequests'), where('to','==', u.uid), where('status','==','pending')), s=> setReqCount(s.size));
      onSnapshot(query(collection(db,'notifications'), where('toUid','==', u.uid)), s=> setNotifCount(s.docs.filter(d=>!d.data().read).length));
      onSnapshot(query(collection(db,'chats'), where('members','array-contains', u.uid)), s=> setMsgCount(s.size));
      onSnapshot(collection(db,'users'), s=> {
        const all = s.docs.map(d=>({id:d.id,...d.data() as any}));
        const filtered = all.filter((x:any)=>x.isOnline && x.id!==u.uid);
        setOnlineCount(filtered.length);
        setOnlineUsers(filtered.slice(0,30));
      });
      setLoading(false);
    });
    return ()=> unsub();
  },[]);

  const avatarSrc = currentUser?.avatar || currentUser?.photoURL || `https://i.pravatar.cc/100?u=${currentUser?.uid || 'guest'}`;

  // لو لسه بيحمل - اظهر الشريط بس
  if(loading){
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] w-full">
        <TickerBar />
        <header className="h-[56px] bg-[#122025] border-b border-white/10 flex items-center justify-center">
          <div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black animate-pulse">P</div>
        </header>
      </div>
    );
  }

  // لو ما مسجل دخول - اظهر الشريط + هيدر مبسط
  if(!currentUser){
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] w-full">
        <TickerBar />
        <header dir="rtl" className="h-[56px] bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35] flex items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div>
            <h1 className="font-black text-white">Posta<span className="text-[#00E5FF]">tee</span></h1>
          </Link>
          <Link href="/login" className="text-sm bg-[#00E5FF] text-black px-4 py-1.5 rounded-full font-bold">دخول</Link>
        </header>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full">
      <TickerBar />
      {/* Desktop */}
      <header dir="rtl" className="hidden lg:flex items-center justify-between px-6 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35] w-full">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${currentUser?.uid}`} className="flex items-center gap-2">
            <img src={avatarSrc} onError={(e:any)=>e.currentTarget.src=`https://i.pravatar.cc/100?u=${currentUser.uid}`} className="w-10 h-10 rounded-full border-2 border-[#00E5FF] object-cover bg-white/10"/>
            <span className="font-bold text-sm text-white">{currentUser?.displayName || 'مستخدم'}</span>
          </Link>
          <button onClick={()=>setShowContacts(true)} className="relative w-10 h-10 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-5 h-5 text-[#00E5FF] fill-[#00E5FF]" />{onlineCount>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{onlineCount}</span>}</button>
          <Link href="/messages" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-white"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <Link href="/friends" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-5 h-5 text-white"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-5 h-5 text-white"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-3"><div className="text-right"><h1 className="font-black text-[22px] leading-none text-white">Posta<span className="text-[#00E5FF]">tee</span></h1><p className="text-[9px] text-gray-400">منصة سودانية</p></div><div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center text-black font-black">P</div></div>
      </header>

      {/* Mobile */}
      <header dir="rtl" className="flex lg:hidden items-center justify-between px-3 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35]">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${currentUser?.uid}`}><img src={avatarSrc} onError={(e:any)=>e.currentTarget.src=`https://i.pravatar.cc/100?u=${currentUser.uid}`} className="w-9 h-9 rounded-full border-2 border-[#00E5FF] object-cover bg-white/10"/></Link>
          <button onClick={()=>setShowContacts(true)} className="relative w-8 h-8 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-4 h-4 text-[#00E5FF] fill-[#00E5FF]" />{onlineCount>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{onlineCount}</span>}</button>
          <Link href="/messages" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-white"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <Link href="/friends" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-4 h-4 text-white"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/notifications" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-4 h-4 text-white"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{notifCount>9?'9+':notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-2"><h1 className="font-black text-[18px] text-white">Posta<span className="text-[#00E5FF]">tee</span></h1><div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div></div>
      </header>

      {showContacts && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={()=>setShowContacts(false)}>
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[360px] bg-[#122025] border-l border-white/10 p-4 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white">متصلون الآن ({onlineCount})</h2><button onClick={()=>setShowContacts(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white"/></button></div>
            {onlineUsers.length===0 && <p className="text-gray-400 text-sm text-center mt-10">لا يوجد متصلون حاليا</p>}
            {onlineUsers.map((u:any)=><div key={u.id} onClick={()=>{router.push(`/profile/${u.id}`); setShowContacts(false);}} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer"><img src={u.avatar||u.photoURL||`https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full bg-white/10 object-cover"/><div><p className="text-sm font-bold text-white">{u.displayName||'مستخدم'}</p><p className="text-[11px] text-green-400">متصل الآن</p></div></div>)}
          </div>
        </div>
      )}
    </div>
  )
}