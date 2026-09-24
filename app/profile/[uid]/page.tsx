"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfilePage(){
  const { uid: targetUid } = useParams() as {uid:string};
  const router = useRouter();
  const [myUid, setMyUid] = useState<string|null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<"none"|"pending_sent"|"pending_received"|"accepted">("none");

  useEffect(()=> onAuthStateChanged(auth, u=> setMyUid(u?.uid||null)),[]);
  useEffect(()=>{
    if(!targetUid) return;
    return onSnapshot(doc(db,"users",targetUid), s=> setProfile(s.data()));
  },[targetUid]);

  useEffect(()=>{
    if(!myUid ||!targetUid || myUid===targetUid) return;
    const id1 = `${myUid}_${targetUid}`;
    const id2 = `${targetUid}_${myUid}`;
    const unsub1 = onSnapshot(doc(db,"friendRequests",id1), s=>{
      if(s.exists()){
        const d=s.data() as any;
        if(d.status==="accepted") setFriendStatus("accepted");
        else setFriendStatus("pending_sent");
      }
    });
    const unsub2 = onSnapshot(doc(db,"friendRequests",id2), s=>{
      if(s.exists() && s.data().status==="pending"){
        setFriendStatus("pending_received");
      } else if(!s.exists()){
        // لو مافي طلب تاني، ما نرجع لـ none لو الاول موجود
      }
    });
    return ()=>{unsub1(); unsub2();};
  },[myUid, targetUid]);

  const handleAdd = async()=>{
    if(!myUid) return;
    await setDoc(doc(db,"friendRequests",`${myUid}_${targetUid}`),{
      from:myUid, to:targetUid, status:"pending", createdAt:serverTimestamp()
    });
    setFriendStatus("pending_sent");
  };

  const isOther = myUid && targetUid && myUid!== targetUid;

  if(!profile) return <div className="min-h-screen bg-black text-white p-10">تحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#050a0a] text-white p-4">
      <h1 className="text-2xl font-black">{profile.displayName}</h1>
      <p className="text-white/50 mb-6">@{profile.username} • {profile.role}</p>

      {/* هنا الزرين - لازم يظهرو سوا */}
      {isOther && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-[420px]">
          {friendStatus==="none" && (
            <button onClick={handleAdd} className="h-12 rounded-full bg-white text-black font-black">إضافة صديق</button>
          )}
          {friendStatus==="pending_sent" && (
            <button className="h-12 rounded-full bg-white/20 text-white font-black" disabled>تم الإرسال</button>
          )}
          {friendStatus==="accepted" && (
            <button onClick={()=>router.push(`/chat/${targetUid}`)} className="h-12 rounded-full bg-white text-black font-black">مراسلة</button>
          )}
          {friendStatus==="pending_received" && (
            <button className="h-12 rounded-full bg-yellow-400 text-black font-black">قبول الطلب</button>
          )}

          {/* زر طلب المراسلة ثابت - دايما ظاهر */}
          <button onClick={()=>router.push(`/chat/request/${targetUid}`)} className="h-12 rounded-full border-2 border-cyan-400 text-cyan-400 font-black">طلب مراسلة</button>
        </div>
      )}

      {!isOther && <p className="text-white/30 text-sm mt-4">ده بروفايلك انت - الزرين ما بيظهرو هنا، جرب بروفايل تاني</p>}
    </div>
  )
}