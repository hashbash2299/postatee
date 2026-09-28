"use client"
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, LogOut, Bell, MessageCircle, Circle, X } from "lucide-react";
import TickerBar from "./TickerBar";

function MobileContactsDrawer({ open, onClose }: { open: boolean; onClose: () => void }){
  const [allUsers, setAllUsers] = useState<any[]>([]);
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"users"), (snap)=>{
      setAllUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=> unsub();
  },[]);
  if(!open) return null;
  const onlineUsers = allUsers.filter((u:any)=> u.isOnline);
  const offlineUsers = allUsers.filter((u:any)=>!u.isOnline);
  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-[85%] max-w-[340px] bg-[#122025] border-l border-[#1A2E35] p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg">جهات الاتصال</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5"/></button>
        </div>
        <div className="mb-5">
          <p className="text-xs font-bold text-green-400 mb-2">● متصلون الآن ({onlineUsers.length})</p>
          <div className="flex flex-col gap-1">
            {onlineUsers.map((u:any)=>(
              <Link href={`/profile/${u.uid || u.id}`} key={u.id} onClick={onClose} className="flex items-center gap-3 p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full object-cover"/><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#122025]"></div></div>
                <div><p className="text-sm font-bold truncate">{u.displayName || u.email}</p><p className="text-[11px] text-green-400">متصل الآن</p></div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-white/60 mb-2">○ غير متصلين ({offlineUsers.length})</p>
          <div className="flex flex-col gap-1">
            {offlineUsers.map((u:any)=>(
              <Link href={`/profile/${u.uid || u.id}`} key={u.id} onClick={onClose} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10">
                <img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full object-cover grayscale"/>
                <div><p className="text-sm font-bold truncate">{u.displayName || u.email}</p><p className="text-[11px] text-white/50">غير متصل</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FixedHeader({ onOpenContacts }: { onOpenContacts: () => void }){
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reqCount, setReqCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const router = useRouter();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return;
      const snap = await getDoc(doc(db,'users',u.uid));
      if(snap.exists()) setCurrentUser({uid:u.uid,...snap.data()});
      onSnapshot(query(collection(db,'friendRequests'), where('to','==', u.uid), where('status','==','pending')), s=> setReqCount(s.size));
      onSnapshot(query(collection(db,'notifications'), where('toUid','==', u.uid)), s=> setNotifCount(s.docs.filter(d=>!d.data().read).length));
      onSnapshot(query(collection(db,'chats'), where('members','array-contains', u.uid)), s=> setMsgCount(s.size));
      onSnapshot(collection(db,'users'), s=> setOnlineCount(s.docs.filter(d=>d.data().isOnline).length));
    });
    return ()=> unsub();
  },[]);

  const logout = async ()=>{
    if(confirm('متأكد تبي تطلع؟')){
      const u = auth.currentUser;
      if(u) await updateDoc(doc(db,'users',u.uid),{isOnline:false}).catch(()=>{});
      await signOut(auth);
      router.push('/login');
    }
  };
  if(!currentUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full">
      <TickerBar />
      <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35] w-full">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${currentUser?.uid}`} className="flex items-center gap-2"><img src={currentUser?.photoURL || currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-[#00E5FF] object-cover"/><span className="font-bold text-sm">{currentUser?.displayName}</span></Link>
          <Link href="/friends" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-5 h-5"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/messages" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-5 h-5"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-5 h-5"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={logout} className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"><LogOut className="w-5 h-5 text-red-400"/></button>
          <div className="text-right"><h1 className="font-black text-[22px] leading-none">Posta<span className="text-[#00E5FF]">tee</span></h1></div><div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center text-black font-black">P</div>
        </div>
      </header>
      <header className="flex lg:hidden items-center justify-between px-3 py-3 bg-[#122025]/95 backdrop-blur-xl border-b border-[#1A2E35]">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${currentUser?.uid}`}><img src={currentUser?.photoURL || currentUser?.avatar} className="w-9 h-9 rounded-full border-2 border-[#00E5FF] object-cover"/></Link>
          <Link href="/friends" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-4 h-4"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/messages" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4"/></Link>
          <button onClick={onOpenContacts} className="relative w-8 h-8 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-4 h-4 text-[#00E5FF] fill-[#00E5FF]" />{onlineCount>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{onlineCount}</span>}</button>
          <button onClick={logout} className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center"><LogOut className="w-4 h-4 text-red-400"/></button>
        </div>
        <div className="flex items-center gap-2"><h1 className="font-black text-[18px]">Posta<span className="text-[#00E5FF]">tee</span></h1><div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div></div>
      </header>
    </div>
  )
}

export default function FixedHeaderWrapper(){
  const [show, setShow] = useState(false);
  return (
    <>
      <FixedHeader onOpenContacts={()=>setShow(true)} />
      <MobileContactsDrawer open={show} onClose={()=>setShow(false)} />
    </>
  )
}