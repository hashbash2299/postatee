"use client"
import { useVoiceCall } from "@/lib/hooks/useVoiceCall"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Phone, PhoneOff, Volume2 } from "lucide-react"
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

  const { incoming, status, answerCall, endCall, remoteAudioRef, needsTap, forcePlayRemote } = useVoiceCall(uid, me);

  const handleAnswer = async () => {
    await answerCall();
    if(incoming?.from){
      setTimeout(()=> router.push(`/messages/${incoming.from}`), 400);
    }
  };

  return (
    <>
      {/* عنصر الصوت - لازم يكون موجود دائما ومش hidden */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{display:'none'}} />

      {needsTap && status==='inCall' && (
        <button onClick={()=>forcePlayRemote()} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] bg-[#00E5FF] text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 animate-bounce">
          <Volume2 className="w-5 h-5"/> اضغط لتشغيل الصوت
        </button>
      )}

      {status==='ringing' && incoming && (
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
      )}
    </>
  )
}