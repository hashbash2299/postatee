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
      if(u){
        setMyUid(u.uid);
        // ✅ اسمع مباشر من users - مش من auth
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap)=>{
          if(snap.exists()) setMyData(snap.data());
        });
        return ()=>unsubUser();
      } else {
        setMyUid(null);
      }
    });
    return ()=>unsubAuth();
  },[]);

  if(!myUid) return null;

  // ✅ الصورة الحقيقية من Firestore
  const avatarUrl = myData?.avatar || myData?.photoURL;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-[#0B1418] border-b border-white/10 flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#00E5FF] rounded-xl flex items-center justify-center font-black text-black">P</div>
          <span className="font-black">Postatee</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={()=>router.push('/notifications')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative">
          <Bell className="w-5 h-5"/>
        </button>
        <button onClick={()=>router.push('/friends')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <Users className="w-5 h-5"/>
        </button>
        <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5"/>
        </button>

        {/* ✅ حل مشكلة الكاش - اضافة key و timestamp */}
        <img
          key={avatarUrl}
          src={avatarUrl? `${avatarUrl}${avatarUrl.includes('?')? '&' : '?'}t=${myData?.lastSeen?.seconds || Date.now()}` : `https://i.pravatar.cc/100?u=${myUid}`}
          onClick={()=>router.push(`/profile/${myUid}`)}
          className="w-9 h-9 rounded-full object-cover border-2 border-cyan-400/30 cursor-pointer bg-white/5"
          alt="me"
        />
      </div>
    </header>
  );
}