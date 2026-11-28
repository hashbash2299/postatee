"use client"
import { useState } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { ROOM_DECORATIONS, ROOM_ICONS } from "@/lib/chatRoomsData"

export default function CreateRoomPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [icon, setIcon] = useState("🏠")
  const [decoId, setDecoId] = useState("none")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { return onAuthStateChanged(auth, setUser) }, [])

  const createRoom = async () => {
    if (!user) return alert("سجل دخول أول")
    if (!name.trim()) return alert("اكتب اسم الغرفة")
    setLoading(true)
    try {
      // ✅ ما في أي فحص لغرفة قديمة - أي زول يعمل كم غرفة عايزها
      const deco = ROOM_DECORATIONS.find(d => d.id === decoId)
      const decoratedName = deco ? deco.fn(name.trim()) : name.trim()

      const docRef = await addDoc(collection(db, "customRooms"), {
        name: name.trim(),
        decoratedName,
        desc: desc.trim() || "❤️💜💚 لكل الناس الحلوين",
        icon,
        decoration: decoId,
        ownerUid: user.uid,
        ownerName: user.displayName || "سوداني",
        ownerPhoto: user.photoURL || "",
        type: isPrivate ? "private" : "public",
        isPrivate,
        bg: "bg-[#1A2E35]",
        createdAt: serverTimestamp(),
        membersCount: 0,
      })
      router.push(`/chat-rooms/${docRef.id}`)
    } catch (e) {
      alert("حصل خطأ، حاول تاني")
    }
    setLoading(false)
  }

  if (!user) return (
    <div className="min-h-screen bg-[#0B1416] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[50px]">🔒</div>
      <p className="font-black mt-2">سجل دخول أول عشان تعمل غرفة</p>
      <Link href="/chat-rooms" className="mt-4 bg-[#00E676] text-black font-black px-6 py-3 rounded-full">رجوع للغرف</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0B1416] text-white p-4">
      <div className="max-w-[500px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/chat-rooms" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">←</Link>
          <h1 className="font-black text-[18px]">+ إنشاء غرفة جديدة</h1>
        </div>

        <div className="bg-[#122025] border border-white/10 rounded-[24px] p-5 space-y-4">
          <div>
            <label className="text-[13px] font-black text-white/70">اسم الغرفة</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مملكة القلوب" className="w-full mt-1.5 bg-white/10 rounded-full px-4 py-3.5 text-[14px] outline-none focus:border-[#00E676]/50 border border-transparent" />
            {name && <p className="text-[13px] mt-2 text-center bg-white/5 py-2 rounded-full">المعاينة: {ROOM_DECORATIONS.find(d => d.id === decoId)?.fn(name)}</p>}
          </div>

          <div>
            <label className="text-[13px] font-black text-white/70">وصف الغرفة</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="عن شنو غرفتك؟" className="w-full mt-1.5 bg-white/10 rounded-full px-4 py-3.5 text-[14px] outline-none border border-transparent" />
          </div>

          <div>
            <label className="text-[13px] font-black text-white/70">أيقونة الغرفة</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROOM_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`w-11 h-11 rounded-full text-[20px] flex items-center justify-center ${icon === ic ? "bg-[#00E676] text-black" : "bg-white/10"}`}>{ic}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-black text-white/70">زخرفة الاسم</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROOM_DECORATIONS.map(d => (
                <button key={d.id} onClick={() => setDecoId(d.id)} className={`px-4 py-2 rounded-full text-[12px] font-black ${decoId === d.id ? "bg-white text-black" : "bg-white/10"}`}>{d.label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-full px-4 py-3">
            <span className="text-[13px] font-black">🔒 غرفة خاصة؟</span>
            <button onClick={() => setIsPrivate(!isPrivate)} className={`w-12 h-7 rounded-full p-1 transition ${isPrivate ? "bg-[#00E676]" : "bg-white/20"}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition ${isPrivate ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <button onClick={createRoom} disabled={loading} className="w-full bg-[#00E676] text-black font-black py-4 rounded-full text-[15px] disabled:opacity-50">
            {loading ? "جاري الإنشاء..." : "إنشاء الغرفة 🚀"}
          </button>
          <p className="text-[11px] text-white/40 text-center">ممكن تعمل أكتر من غرفة عادي - كل غرفة براها</p>
        </div>
      </div>
    </div>
  )
}