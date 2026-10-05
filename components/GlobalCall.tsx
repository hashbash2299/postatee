"use client"
import { useVoiceCall } from "@/lib/hooks/useVoiceCall"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Phone, PhoneOff } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GlobalCall(){
  const [uid,setUid]=useState(""); const [me,setMe]=useState<any>(null);
  const router = useRouter();

  useEffect(()=> {
    return onAuthStateChanged(auth, async u=>{
      if(u){
        setUid(u.uid);
        const s=await getDoc(doc(db,'users',u.uid));
        if(s.exists()) setMe(s.data());
      }
    });
  },[]);

  const { incoming, status, answerCall, endCall, remoteAudioRef } = useVoiceCall(uid, me);

  const handleAnswer = async () => {
    await answerCall();
    // وديه صفحة الدردشة بعد الرد
    if(incoming?.from){
      setTimeout(()=> router.push(`/messages/${incoming.from}`), 400);
    }
  };

  // لو مافي مكالمة بس خلي عنصر الصوت موجود للمرسل
  if(status==='idle' ||!incoming){
    return <audio ref={remoteAudioRef} autoPlay playsInline hidden />
  }

  // ✅ يظهر في اي صفحة - حتى الصفحة الرئيسية
  if(status==='ringing'){
    return (
      <>
        <audio ref={remoteAudioRef} autoPlay playsInline hidden />
        <div className="fixed inset-0 z-[99999] bg-[#080e0e]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6" dir="rtl">
          <div className="relative">
            <img src={incoming.fromAvatar} className="w-32 h-32 rounded-full border-4 border-green-400 object-cover"/>
            <span className="absolute inset-0 w-32 h-32 rounded-full border-4 border-green-400 animate-ping"/>
          </div>
          <h2 className="text-white font-black text-2xl mt-6">{incoming.fromName}</h2>
          <p className="text-green-400 text-sm mt-2 animate-pulse">مكالمة صوتية واردة...</p>
          <div className="flex gap-16 mt-14">
            <button onClick={handleAnswer} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
              <Phone className="w-9 h-9 text-white"/>
            </button>
            <button onClick={()=>endCall()} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
              <PhoneOff className="w-9 h-9 text-white"/>
            </button>
          </div>
        </div>
      </>
    )
  }

  // لو انت المتصل ولسه بترن
  if(status==='calling' || status==='inCall'){
    return <audio ref={remoteAudioRef} autoPlay playsInline hidden />
  }

  return <audio ref={remoteAudioRef} autoPlay playsInline hidden />
}