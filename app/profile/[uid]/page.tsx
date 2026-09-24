"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Page(){
  const { uid } = useParams() as {uid:string};
  const router = useRouter();
  const [myUid, setMyUid] = useState<string|null>(null);
  const [status, setStatus] = useState<"none"|"sent"|"accepted">("none");

  useEffect(()=> onAuthStateChanged(auth, u=>setMyUid(u?.uid||null)),[]);

  useEffect(()=>{
    if(!myUid ||!uid || myUid===uid) return;
    const unsub = onSnapshot(doc(db,"friendRequests",`${myUid}_${uid}`), s=>{
      if(!s.exists()) setStatus("none");
      else if(s.data().status==="accepted") setStatus("accepted");
      else setStatus("sent");
    });
    const unsub2 = onSnapshot(doc(db,"friendRequests",`${uid}_${myUid}`), s=>{
      if(s.exists() && s.data().status==="accepted") setStatus("accepted");
    });
    return ()=>{unsub(); unsub2();};
  },[myUid, uid]);

  const addFriend = async()=>{
    if(!myUid) return;
    await setDoc(doc(db,"friendRequests",`${myUid}_${uid}`),{
      from:myUid, to:uid, status:"pending", createdAt:serverTimestamp()
    });
    setStatus("sent");
  };

  if(!myUid) return null;
  if(myUid===uid) return <div className="p-10 bg-black text-white">بروفايلك</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#050a0a] p-4 text-white">
      <div className="max-w-[420px] mx-auto mt-20">
        {/* الزرين الثابتين - الاتنين دايما ظاهرين */}
        <div className="grid grid-cols-2 gap-3">

          {/* الزر الاول: الصداقة */}
          {status==="none" && (
            <button onClick={addFriend} className="h-[48px] rounded-full bg-white text-black font-black text-[15px]">+ إضافة صديق</button>
          )}
          {status==="sent" && (
            <button className="h-[48px] rounded-full bg-white/20 text-white font-black text-[15px]" disabled>✓ تم الإرسال</button>
          )}
          {status==="accepted" && (
            <button className="h-[48px] rounded-full bg-white/10 border border-white/20 text-white font-black text-[15px]">✓ أصدقاء</button>
          )}

          {/* الزر التاني: المراسلة - ثابت لا يختفي ابدا */}
          {status!=="accepted"? (
            <button onClick={()=>router.push(`/messages/request/${uid}`)} className="h-[48px] rounded-full bg-transparent border-2 border-[#00E5FF] text-[#00E5FF] font-black text-[15px]">طلب مراسلة</button>
          ) : (
            <button onClick={()=>router.push(`/chat/${uid}`)} className="h-[48px] rounded-full bg-[#00E5FF] text-black font-black text-[15px]">مراسلة</button>
          )}

        </div>
        <p className="text-center text-white/30 text-xs mt-4">الحالة الحالية: {status}</p>
      </div>
    </div>
  )
}