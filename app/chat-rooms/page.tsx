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

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    const q = query(collection(db, "customRooms"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {
      // fallback if no index
      onSnapshot(collection(db, "customRooms"), s => setRooms(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    })
    return () => unsub()
  }, [])

  // فلترة حسب كلامك
  const isMyRoom = (r: any) => r.ownerUid === user?.uid
  const isPrivate = (r: any) => r.type === "private" || r.isPrivate === true

  let displayed = rooms.filter(r => {
    if (search && !((r.decoratedName || r.name || "").includes(search))) return false
    if (filter === "غرفي") return isMyRoom(r)
    if (filter === "الخاصة") return isPrivate(r)
    if (filter === "الرسمية" || filter === "الكل") return !isPrivate(r) || isMyRoom(r) // العامة يظهر فيها العامة + غرفك انت
    return true
  })

  // لو الزول ما مسجل دخول، غرفي فاضية
  if (filter === "غرفي" && !user) displayed = []

  return (
    <div className="min-h-screen bg-[#0B1416] text-white">
      <div className="p-4 max-w-[600px] mx-auto">
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/chat-rooms/create" className="bg-[#00E676] text-black font-black px-5 py-2.5 rounded-full text-[14px]">+ غرفتي</Link>
          <div className="text-center">
            <h1 className="font-black text-[18px]">🇸🇩 غرف الدردشة</h1>
            <p className="text-[11px] text-white/50">v2.0 • {rooms.length} غرفة</p>
          </div>
          <Link href="/" className="w-10 h-10 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        </div>

        {/* البحث - رجع */}
        <div className="relative mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن غرفة..." className="w-full bg-[#122025] border border-[#1E3A42] rounded-full px-4 py-3.5 text-[14px] outline-none placeholder:text-white/40" />
        </div>

        {/* الفلاتر - رجعت */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: "الكل", label: "الكل" },
            { id: "الرسمية", label: "الرسمية" },
            { id: "الخاصة", label: "🔒 الخاصة" },
            { id: "غرفي", label: "👑 غرفي" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-5 py-2.5 rounded-full text-[13px] font-black whitespace-nowrap transition ${filter === f.id ? "bg-white text-black" : "bg-[#1A2E35] text-white/60 border border-[#1E3A42]"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* شريط الـ XP */}
        <div className="bg-[#122025] rounded-2xl p-3 mb-5 border border-[#1E3A42] flex items-center gap-3">
          <span className="text-[22px]">⭐</span>
          <div className="flex-1">
            <div className="flex justify-between text-[12px] font-bold">
              <span>مستوى 1 - جديد</span><span className="text-[#FFD700]">XP 0/100</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full mt-1"><div className="h-full bg-[#FFD700] w-[0%]" /></div>
          </div>
        </div>

        {/* الغرف */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-[#122025] rounded-[24px] border border-[#1E3A42]">
            <div className="text-[50px]">🏠</div>
            <p className="font-black mt-2">
              {filter === "غرفي" ? "ما عندك غرف خاصة لسه" : filter === "الكل" ? "ما في غرف عامة - كن أول من ينشئ!" : "لا توجد غرف في هذا القسم"}
            </p>
            <Link href="/chat-rooms/create" className="mt-4 inline-block bg-[#00E676] text-black font-black px-6 py-3 rounded-full">+ إنشاء غرفة جديدة</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayed.map(r => (
              <Link key={r.id} href={`/chat-rooms/${r.id}`} className="bg-[#122025] rounded-[20px] p-4 border border-[#1E3A42] flex gap-3">
                <div className={`w-12 h-12 rounded-2xl ${r.bg || "bg-[#1A2E35]"} flex items-center justify-center text-[24px]`}>{r.icon || "🏠"}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[15px] truncate">{r.decoratedName || r.name}</h3>
                  <p className="text-[12px] text-white/50 truncate">{r.desc || "❤️💜💚 لكل الناس الحلوين"}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">🟢 0 متصل</span>
                    {isMyRoom(r) && <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded-full font-black">👑 غرفتي</span>}
                    {isPrivate(r) && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">🔒 خاصة</span>}
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