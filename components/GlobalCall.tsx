"use client"
import { useVoiceCall } from "@/lib/hooks/useVoiceCall"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Phone, PhoneOff } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function GlobalCall(){
  const [uid,setUid]=useState(""); const [me,setMe]=useState<any>(null);
  const pathname = usePathname(); const router = useRouter();
  useEffect(()=> onAuthStateChanged(auth, async u=>{ if(u){ setUid(u.uid); const s=await getDoc(doc(db,'users',u.uid)); setMe(s.data()); }}),[]);
  const { incoming, status, answerCall, endCall, remoteAudioRef } = useVoiceCall(uid, me);

  // لو انت جوه الدردشة مع المتصل خلي الصفحة نفسها تتصرف
  const isInChat = pathname?.includes(incoming?.from);
  if(!incoming || status!=='ringing' || isInChat) return <><audio ref={remoteAudioRef} autoPlay playsInline style={{position:'fixed',top:-1000}} /></>;

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{position:'fixed',top:-1000}} />
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={incoming.fromAvatar} className="w-28 h-28 rounded-full border-4 border-green-500 animate-pulse"/>
        <h2 className="text-white font-black text-xl mt-4">{incoming.fromName} يتصل بك...</h2>
        <div className="flex gap-10 mt-10">
          <button onClick={answerCall} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"><Phone className="w-10 h-10 text-white"/></button>
          <button onClick={()=>endCall()} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center"><PhoneOff className="w-10 h-10 text-white"/></button>
        </div>
        <button onClick={()=>{ router.push(`/messages/${incoming.from}`); }} className="mt-6 text-white/50 text-sm underline">افتح الدردشة للرد</button>
      </div>
    </>
  )
}