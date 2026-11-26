"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

type Room = { id: string; name: string; decoratedName: string; icon: string; desc: string; type: string; ownerUid: string }

export default function ChatRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("postatee_update_v2")
    if (!seen) setShowUpdate(true)

    const q = query(collection(db, "customRooms"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)))
    })
    return () => unsub()
  }, [])

  const closeUpdate = () => {
    localStorage.setItem("postatee_update_v2", "1")
    setShowUpdate(false)
  }

  return (
    <div className="min-h-screen bg-[#0B1416] text-white p-4">
      <div className="flex items-center gap-3 max-w-[640px] mx-auto">
        <Link href="/" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        <h1 className="font-black text-[20px]">غرف الدردشة 🇸🇩 v2.0</h1>
        <button onClick={()=>setShowUpdate(true)} className="ml-auto bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-[12px]">✨ الجديد</button>
      </div>

      <div className="max-w-[640px] mx-auto mt-6 grid gap-3">
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[70px]">🏜️</div>
            <p className="mt-3 font-black">ما في غرف لسه</p>
          </div>
        ) : rooms.map(r => (
          <Link key={r.id} href={`/chat-rooms/${r.id}`} className="bg-[#122025] p-4 rounded-[20px] border border-white/10 flex gap-3">
            <div className="text-[30px]">{r.icon}</div>
            <div>
              <p className="font-black">{r.decoratedName || r.name}</p>
              <p className="text-[12px] text-white/50">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {showUpdate && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={closeUpdate}>
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-[400px] bg-[#122025] rounded-[28px] p-6 border border-[#FFD700]/20">
            <div className="text-center text-[50px]">🎉</div>
            <h2 className="text-center font-black text-[20px] mt-2">تحديث Postatee الكبير</h2>
            <div className="mt-4 bg-black/30 rounded-2xl p-4 text-[13px] space-y-2">
              <p>✨ تقدر تعمل غرفتك الخاصة باسم مزخرف</p>
              <p>⭐ نظام مستويات و XP جديد</p>
              <p>🧹 حذفنا كل الغرف القديمة - بداية نظيفة</p>
              <p>🇸🇩 غرفتك الحالية "مملكة القلوب" هي أول غرفة في النظام الجديد</p>
            </div>
            <button onClick={closeUpdate} className="w-full mt-5 bg-[#00E676] text-black font-black p-4 rounded-2xl">فهمت - خليني أبدأ 🚀</button>
          </div>
        </div>
      )}
    </div>
  )
}