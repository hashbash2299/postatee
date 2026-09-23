"use client"
import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatList(){
  const [myUid,setMyUid]=useState<string|null>(null);
  const [chats,setChats]=useState<any[]>([]);
  const router=useRouter();

  useEffect(()=>{
    onAuthStateChanged(auth,u=>{
      if(!u) return router.push('/login');
      setMyUid(u.uid);
      const q=query(collection(db,'chats'), where('users','array-contains', u.uid), orderBy('lastAt','desc'));
      onSnapshot(q, async snap=>{
        const list=await Promise.all(snap.docs.map(async d=>{
          const data=d.data();
          const otherId=data.users.find((id:string)=>id!==u.uid);
          const userSnap=await getDoc(doc(db,'users', otherId));
          return {id:d.id,...data, user:userSnap.data(), otherId};
        }));
        setChats(list);
      });
    });
  },[]);

  return (
    <div className="min-h-screen bg-[#0B1418]" dir="rtl">
      <header className="h-[56px] bg-[#122025] border-b border-[#1A2E35] flex items-center justify-between px-4 sticky top-0">
        <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        <span className="font-black text-white">الرسائل</span>
        <div className="w-9"/>
      </header>
      <div className="max-w-[600px] mx-auto">
        {chats.length===0 && <div className="text-center text-white/30 py-20">ما عندك محادثات - ابدأ من الأصدقاء</div>}
        {chats.map(c=>(
          <Link key={c.id} href={`/chat/${c.otherId}`} className="flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/[0.03]">
            <img src={c.user?.avatar} className="w-12 h-12 rounded-full"/>
            <div className="flex-1"><p className="font-bold text-white text-sm">{c.user?.displayName}</p><p className="text-xs text-white/50 truncate">{c.lastMessage}</p></div>
            <div className="text-[11px] text-white/30">{c.lastAt?.toDate? new Date(c.lastAt.toDate()).toLocaleDateString() : ''}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}