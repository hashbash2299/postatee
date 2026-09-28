"use client"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { sudaneseRooms } from "@/lib/chatRoomsData"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
import Link from "next/link"

export default function RoomPage(){
  const { id } = useParams()
  const room = sudaneseRooms.find(r=>r.id===id) || sudaneseRooms[1]
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. جلب الرسائل الحية
  useEffect(()=>{
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
      setTimeout(()=> scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100)
    })
    return ()=>unsub()
  },[id])

  // 2. ارسال رسالة
  const sendMessage = async ()=>{
    if(!text.trim() ||!auth.currentUser) return
    await addDoc(collection(db, `chatRooms/${id}/messages`),{
      text: text.trim(),
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || "سوداني",
      photoURL: auth.currentUser.photoURL || "",
      roomId: id,
      createdAt: serverTimestamp()
    })
    setText("")
  }

  return (
    <div className="h-[100dvh] bg-[#0B1416] flex flex-col text-white">
      {/* هيدر */}
      <div className="bg-[#122025] border-b border-[#1E3A42] p-3 flex items-center gap-3">
        <Link href="/chat-rooms" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        <div className={`w-10 h-10 rounded-xl ${room.bg} flex items-center justify-center text-xl`}>{room.icon}</div>
        <div className="flex-1">
          <h2 className="font-black text-[15px]">{room.name} • 🟢 {messages.length}</h2>
          <p className="text-[11px] text-white/50">{room.desc} - دردشة جماعية</p>
        </div>
      </div>

      {/* الرسائل */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-[#0B1416]">
        {messages.length===0 && <p className="text-center text-white/30 mt-20 text-[13px]">كون أول زول يبدأ الونسة في {room.name} 👋</p>}
        {messages.map(m=>(
          <div key={m.id} className={`flex gap-2 ${m.uid===auth.currentUser?.uid? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.uid===auth.currentUser?.uid? 'bg-[#00E676] text-black rounded-bl-sm' : 'bg-[#1A2E35] rounded-br-sm'} p-3 rounded-2xl max-w-[78%] text-[14px]`}>
              {m.uid!==auth.currentUser?.uid && <p className="text-[11px] font-bold opacity-60 mb-1">{m.displayName}</p>}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* كتابة */}
      <div className="p-3 bg-[#122025] flex gap-2 safe-bottom">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=> e.key==="Enter" && sendMessage()}
          placeholder="اكتب رسالتك..."
          className="flex-1 bg-[#1A2E35] rounded-full px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#00E676]"
        />
        <button onClick={sendMessage} className="w-12 h-12 bg-[#00E676] rounded-full flex items-center justify-center text-black font-black active:scale-90 transition-transform">➤</button>
      </div>
    </div>
  )
}