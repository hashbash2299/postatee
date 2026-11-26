"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { sudaneseRooms, ROOM_DECORATIONS, ROOM_ICONS, getLevelFromXP } from "@/lib/chatRoomsData"
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

type CustomRoom = { id: string; name: string; decoratedName: string; icon: string; desc: string; type: "public" | "private"; ownerUid: string; color: string; bg: string; createdAt: any }

export default function ChatRoomsPage() {
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({})
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([])
  const [myXP, setMyXP] = useState(0)
  const [filter, setFilter] = useState<"all" | "official" | "private" | "mine">("all")
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState<"public" | "private">("public")
  const [decoIndex, setDecoIndex] = useState(1)
  const [iconIndex, setIconIndex] = useState(0)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return
      const unsubUser = onSnapshot(collection(db, "users"), () => {})
      // جيب XP حقي
      import("firebase/firestore").then(({ doc, getDoc }) => {
        getDoc(doc(db, "users", u.uid)).then(s => { if (s.exists()) setMyXP(s.data().xp || 0) })
      })
      return unsubUser
    })
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    const unsubs: any[] = []
    sudaneseRooms.forEach(room => {
      const unsub = onSnapshot(collection(db, `chatRooms/${room.id}/online`), snap => setOnlineCounts(p => ({ ...p, [room.id]: snap.size })))
      unsubs.push(unsub)
    })
    const unsubCustom = onSnapshot(query(collection(db, "customRooms"), orderBy("createdAt", "desc")), snap => {
      setCustomRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomRoom)))
      snap.docs.forEach(d => {
        onSnapshot(collection(db, `chatRooms/${d.id}/online`), s => setOnlineCounts(p => ({ ...p, [d.id]: s.size })))
      })
    })
    unsubs.push(unsubCustom)
    return () => unsubs.forEach(u => u())
  }, [])

  const myLevel = getLevelFromXP(myXP)

  const createRoom = async () => {
    if (!newName.trim() || !auth.currentUser) { alert("اكتب اسم الغرفة وسجل دخول"); return }
    setCreating(true)
    try {
      const decorated = ROOM_DECORATIONS[decoIndex].fn(newName.trim())
      const docRef = await addDoc(collection(db, "customRooms"), {
        name: newName.trim(), decoratedName: decorated, icon: ROOM_ICONS[iconIndex],
        desc: newDesc.trim() || "غرفة خاصة من Postatee",
        type: newType, ownerUid: auth.currentUser.uid,
        color: "from-purple-500 to-pink-500", bg: "bg-purple-500/20",
        createdAt: serverTimestamp(),
      })
      await addDoc(collection(db, `chatRooms/${docRef.id}/messages`), {
        text: `🎉 أهلاً بيكم في ${decorated} - غرفة جديدة!`, uid: "system", displayName: "النظام", isSystem: true, createdAt: serverTimestamp()
      })
      setShowCreate(false); setNewName(""); setNewDesc("")
      window.location.href = `/chat-rooms/${docRef.id}`
    } catch (e) { alert("حصل خطأ، حاول تاني") }
    setCreating(false)
  }

  const allRooms: any[] = [
    ...sudaneseRooms.map(r => ({ ...r, decoratedName: r.name, type: "public", isOfficial: true, ownerUid: "" })),
    ...customRooms,
  ]

  const filtered = allRooms.filter(r => {
    if (filter === "official" && !r.isOfficial) return false
    if (filter === "private" && r.type !== "private") return false
    if (filter === "mine" && r.ownerUid !== auth.currentUser?.uid) return false
    if (search && !r.name.includes(search) && !r.decoratedName?.includes(search)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#0B1416] text-white pb-24">
      <div className="sticky top-0 z-10 bg-[#0B1416]/90 backdrop-blur-md border-b border-[#1A2E35] p-4">
        <div className="flex items-center gap-3 max-w-[640px] mx-auto">
          <Link href="/" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center shrink-0">←</Link>
          <div className="flex-1">
            <h1 className="font-black text-[18px] leading-none">غرف الدردشة 🇸🇩</h1>
            <p className="text-[11px] text-white/50 mt-1">⭐ مستواك {myLevel.level} • {myLevel.title} • {myXP} XP</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-[#00E676] text-black font-black text-[13px] px-4 py-2.5 rounded-full active:scale-95">+ غرفتي</button>
        </div>
        <div className="max-w-[640px] mx-auto mt-3 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن غرفة..." className="flex-1 bg-[#1A2E35] rounded-full px-4 py-2.5 text-[13px] outline-none" />
        </div>
        <div className="max-w-[640px] mx-auto mt-2 flex gap-2 overflow-x-auto">
          {([["all", "الكل"], ["official", "الرسمية"], ["private", "الخاصة 🔒"], ["mine", "غرفي"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap ${filter === k ? "bg-white text-black" : "bg-[#1A2E35] text-white/70"}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* شريط المستوى */}
      <div className="max-w-[640px] mx-auto p-3">
        <div className="bg-gradient-to-r from-[#122025] to-[#1E3520] border border-[#FFD700]/20 rounded-[20px] p-3 flex items-center gap-3">
          <span className="text-2xl">{"⭐".repeat(Math.min(3, myLevel.stars))}</span>
          <div className="flex-1">
            <p className="text-[13px] font-black">مستواك {myLevel.level} - {myLevel.title}</p>
            <div className="h-2 bg-white/10 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF9800] rounded-full" style={{ width: `${Math.min(100, (myXP / myLevel.nextXP) * 100)}%` }} /></div>
          </div>
          <span className="text-[11px] text-[#FFD700] font-bold">{myXP}/{myLevel.nextXP} XP</span>
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-3 max-w-[640px] mx-auto">
        {filtered.map((room: any) => {
          const count = onlineCounts[room.id] ?? room.online ?? 0
          return (
            <Link key={room.id} href={`/chat-rooms/${room.id}`} className={`${room.isBig ? "col-span-2" : ""}`}>
              <div className={`bg-[#122025] rounded-[26px] border border-[#1E3A42] p-4 flex justify-between hover:border-[#00E676] hover:scale-[1.02] active:scale-[0.98] transition-all group ${room.isBig ? "h-[115px] flex-row items-center bg-gradient-to-r from-[#122025] to-[#1E3520] border-[#FFD700]/30" : "aspect-square flex-col"}`}>
                <div className={`flex ${room.isBig ? "items-center gap-4" : "justify-between items-start"}`}>
                  <div className={`w-[56px] h-[56px] rounded-[18px] ${room.bg} flex items-center justify-center text-[28px] shrink-0`}>{room.icon}</div>
                  {room.isBig ? <div><h3 className="font-black text-[18px] flex items-center gap-2">{room.decoratedName}<span className="bg-[#FFD700] text-black text-[9px] px-2 py-0.5 rounded-full">الأكثر نشاطا 🔥</span></h3><p className="text-[12px] text-white/50 mt-1">{room.desc}</p></div>
                    : <div className="bg-[#00E676]/10 text-[#00E676] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 h-fit"><span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse" />{count}</div>}
                </div>
                {!room.isBig && <div><h3 className="font-black text-[16px] leading-tight truncate">{room.decoratedName}</h3><p className="text-[12px] text-white/50 mt-1 line-clamp-1">{room.desc}</p>{room.type === "private" && <span className="inline-block mt-1 bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full">🔒 خاصة</span>}{room.ownerUid === auth.currentUser?.uid && <span className="inline-block mt-1 mr-1 bg-[#00E676]/20 text-[#00E676] text-[10px] px-2 py-0.5 rounded-full">غرفتي 👑</span>}<div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#00E676] to-cyan-400" style={{ width: `${Math.min(100, 20 + count * 5)}%` }} /></div><p className="mt-2 text-[10px] text-white/30">🟢 {count} متصل</p></div>}
                {room.isBig && <div className="bg-[#FFD700]/15 text-[#FFD700] text-[11px] font-bold px-3 py-1.5 rounded-full">🟢 {count} متصل</div>}
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && <p className="col-span-2 text-center text-white/40 py-10">لا توجد غرف - أنشئ أول غرفة 🔥</p>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[480px] bg-[#122025] rounded-t-[28px] sm:rounded-[28px] p-5 max-h-[92dvh] overflow-auto">
            <h2 className="font-black text-[18px] mb-1">أنشئ غرفتك الخاصة ✨</h2><p className="text-[12px] text-white/50 mb-4">مجانية - تظهر للكل لو عامة</p>
            <label className="text-[12px] font-bold">اسم الغرفة</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: مملكة القلوب" maxLength={30} className="w-full bg-[#0B1416] border border-white/10 rounded-2xl p-3.5 mt-1 mb-1 outline-none" />
            <p className="text-[12px] text-white/50 mb-3">المعاينة: <span className="text-white font-black">{newName ? ROOM_DECORATIONS[decoIndex].fn(newName) : "---"}</span></p>
            <label className="text-[12px] font-bold">ستايل الاسم</label>
            <div className="flex gap-2 overflow-x-auto py-2 mb-2">{ROOM_DECORATIONS.map((d, i) => <button key={d.id} onClick={() => setDecoIndex(i)} className={`px-3 py-2 rounded-full text-[12px] whitespace-nowrap ${decoIndex === i ? "bg-white text-black font-black" : "bg-white/10"}`}>{d.label}</button>)}</div>
            <label className="text-[12px] font-bold">أيقونة الغرفة</label>
            <div className="flex gap-2 overflow-x-auto py-2 mb-3">{ROOM_ICONS.map((ic, i) => <button key={i} onClick={() => setIconIndex(i)} className={`w-11 h-11 shrink-0 rounded-xl text-[20px] ${iconIndex === i ? "bg-[#00E676] scale-110" : "bg-white/10"}`}>{ic}</button>)}</div>
            <label className="text-[12px] font-bold">وصف الغرفة</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="عن شنو غرفتك؟" className="w-full bg-[#0B1416] border border-white/10 rounded-2xl p-3.5 mt-1 mb-4 outline-none" />
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setNewType("public")} className={`p-3.5 rounded-2xl font-bold text-[13px] ${newType === "public" ? "bg-[#00E676] text-black" : "bg-white/10"}`}>🌍 عامة - الكل يشوفها</button>
              <button onClick={() => setNewType("private")} className={`p-3.5 rounded-2xl font-bold text-[13px] ${newType === "private" ? "bg-purple-500 text-white" : "bg-white/10"}`}>🔒 خاصة - برابط فقط</button>
            </div>
            <div className="flex gap-2"><button onClick={() => setShowCreate(false)} className="flex-1 bg-white/10 p-3.5 rounded-2xl font-bold">إلغاء</button><button onClick={createRoom} disabled={creating || !newName.trim()} className="flex-1 bg-[#00E676] text-black p-3.5 rounded-2xl font-black disabled:opacity-50">{creating ? "جاري..." : "إنشاء مجاني ✨"}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}