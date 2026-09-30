"use client"
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Users, MessageCircle } from "lucide-react";

export default function FixedHeaderWrapper(){
  const [myUid, setMyUid] = useState<string|null>(null);
  const [myData, setMyData] = useState<any>(null);
  const router = useRouter();

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, (u)=>{
      if(!u){ setMyUid(null); return; }
      setMyUid(u.uid);
      const unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap)=>{
        if(snap.exists()) setMyData(snap.data());
      });
      return ()=>unsubUser();
    });
    return ()=>unsubAuth();
  },[]);

  if(!myUid) return null;

  const rawAvatar = myData?.avatar || myData?.photoURL || null;
  const isDataUrl = rawAvatar?.startsWith('data:');
  // ✅ لا تضيف timestamp لو الصورة base64
  const avatarUrl = rawAvatar? (isDataUrl? rawAvatar : `${rawAvatar}${rawAvatar.includes('?')?'&':'?'}t=${myData?.lastSeen?.seconds || ''}`) : null;
  const fallback = `https://i.pravatar.cc/100?u=${myUid}`;

  return (
    <header dir="rtl" className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-[#0B1418] border-b border-white/10 flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#00E5FF] rounded-xl flex items-center justify-center font-black text-black text-[18px]">P</div>
          <span className="font-black text-white">Postatee</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={()=>router.push('/notifications')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-5 h-5 text-white"/></button>
        <button onClick={()=>router.push('/friends')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-5 h-5 text-white"/></button>
        <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-white"/></button>

        <img
          src={avatarUrl || fallback}
          onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src=fallback; }}
          onClick={()=>router.push(`/profile/${myUid}`)}
          className="w-9 h-9 rounded-full object-cover border-2 border-cyan-400/30 cursor-pointer bg-white/5"
        />
      </div>
    </header>
  );
}