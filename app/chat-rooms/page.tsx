"use client"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"

export default function ChatRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [filter, setFilter] = useState("الكل")
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState("")

  useEffect(() => { return onAuthStateChanged(auth, setUser) }, [])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customRooms"), s => setRooms(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [])

  const isMyRoom = (r: any) => r.ownerUid === user?.uid
  const isPrivate = (r: any) => r.type === "private" || r.isPrivate === true
  let displayed = rooms.filter(r => {
    if (search && !((r.decoratedName || r.name || "").includes(search))) return false
    if (filter === "غرفي") return isMyRoom(r)
    if (filter === "الخاصة") return isPrivate(r)
    return !isPrivate(r) || isMyRoom(r)
  })
  if (filter === "غرفي" && !user) displayed = []

  return (
    <div className="min-h-screen text-white relative">
      {/* الخلفية الحيوية - رقم 2 */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/bg-chat.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[#0B1416]/75 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0B1416]/90" />
      </div>

      <div className="relative z-10 p-4 max-w-[600px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/chat-rooms/create" className="bg-[#00E676] text-black font-black px-5 py-2.5 rounded-full text-[14px] shadow-lg shadow-green-500/20">+ غرفتي</Link>
          <div className="text-center">
            <h1 className="font-black text-[18px] drop-shadow">🇸🇩 غرف الدردشة</h1>
            <p className="text-[11px] text-white/60">v2.0 • {rooms.length} غرفة</p>
          </div>
          <Link href="/" className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/10">←</Link>
        </div>

        <div className="relative mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن غرفة..." className="w-full bg-[#122025]/80 backdrop-blur border border-white/10 rounded-full px-4 py-3.5 text-[14px] outline-none focus:border-[#00E676]/50" />
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {["الكل","الرسمية","الخاصة","غرفي"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-full text-[13px] font-black whitespace-nowrap border transition ${filter===f ? "bg-white text-black border-white shadow-lg" : "bg-[#1A2E35]/70 backdrop-blur text-white/60 border-white/10"}`}>
              {f==="الخاصة"?"🔒 الخاصة":f==="غرفي"?"👑 غرفي":f}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-[#122025]/60 backdrop-blur rounded-[24px] border border-white/10">
            <div className="text-[50px]">🏠</div>
            <p className="font-black mt-2">ما في غرف هنا</p>
            <Link href="/chat-rooms/create" className="mt-4 inline-block bg-[#00E676] text-black font-black px-6 py-3 rounded-full">+ إنشاء غرفة جديدة</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayed.map(r => (
              <Link key={r.id} href={`/chat-rooms/${r.id}`} className="bg-[#122025]/70 backdrop-blur border border-white/10 rounded-[20px] p-4 flex gap-3 hover:bg-[#122025]/90 transition">
                <div className={`w-12 h-12 rounded-2xl ${r.bg || "bg-[#1A2E35]"} flex items-center justify-center text-[24px]`}>{r.icon || "🏠"}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[15px] truncate">{r.decoratedName || r.name}</h3>
                  <p className="text-[12px] text-white/50 truncate">{r.desc || "❤️💜💚 لكل الناس الحلوين"}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">🟢 0</span>
                    {isMyRoom(r) && <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded-full font-black">👑 غرفتي</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}