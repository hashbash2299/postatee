"use client"
import { useEffect, useState, useRef } from "react"
import { GIFTS, DAILY_TASKS, getLevelFromXP, getDecoratedUserName, USER_DECORATIONS } from "@/lib/chatRoomsData"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore"
import Link from "next/link"

const EMOJIS = ["❤️", "😂", "😍", "😭", "🔥", "👏", "😡", "💔", "🙏", "😳", "🥺", "😎", "🇸🇩", "💚"]
const IMGBB_KEY = "b23f0a50b5c1a8f7e9d4c2a1b8c7d6e5f"

export default function ChatRoomClient({ id }: { id: string }) {
  const [customRoom, setCustomRoom] = useState<any>(null)
  const [roomLoaded, setRoomLoaded] = useState(false)
  const room = customRoom
  const [messages, setMessages] = useState<any[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [text, setText] = useState("")
  const [myRole, setMyRole] = useState<any>(null)
  const [myXP, setMyXP] = useState(0)
  const [myCoins, setMyCoins] = useState(1000)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGifts, setShowGifts] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [giftAnim, setGiftAnim] = useState<string | null>(null)
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({ login: 1, messages: 0, stay: 0, gift: 0, create: 0 })
  const [claimed, setClaimed] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id || id === "0") { setRoomLoaded(true); return; }
    getDoc(doc(db, "customRooms", id)).then(s => {
      if (s.exists()) setCustomRoom({ id: s.id, ...s.data() })
      setRoomLoaded(true)
    }).catch(() => setRoomLoaded(true))
  }, [id])

  useEffect(() => {
    const u = auth.currentUser
    if (!u) return
    getDoc(doc(db, "users", u.uid)).then(s => {
      if (s.exists()) { setMyRole(s.data()); setMyXP(s.data().xp || 0); setMyCoins(s.data().coins ?? 1000) }
    })
  }, [])

  const isMeMod = myRole?.role === 'مالك' || myRole?.role === 'مؤسس' || myRole?.role === 'مشرف عام' || myRole?.isModerator || myRole?.role === 'مشرف' || customRoom?.ownerUid === auth.currentUser?.uid
  const myLevel = getLevelFromXP(myXP)

  useEffect(() => {
    const user = auth.currentUser
    if (!user || !id || id === "0") return
    const myOnlineRef = doc(db, `chatRooms/${id}/online/${user.uid}`)
    setDoc(myOnlineRef, { uid: user.uid, joinedAt: serverTimestamp() }).catch(() => {})
    const interval = setInterval(() => {
      setDoc(myOnlineRef, { uid: user.uid, joinedAt: serverTimestamp() }, { merge: true })
      setTaskProgress(p => ({ ...p, stay: Math.min(10, p.stay + 0.5) }))
    }, 30000)
    const unsub = onSnapshot(collection(db, `chatRooms/${id}/online`), snap => setOnlineCount(snap.size))
    return () => { clearInterval(interval); deleteDoc(myOnlineRef).catch(() => {}); unsub() }
  }, [id])

  useEffect(() => {
    if (!id || id === "0") return
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100)
    })
    return () => unsub()
  }, [id])

  useEffect(() => {
    const giftMsg = [...messages].reverse().find(m => m.isGift)
    if (giftMsg) { setGiftAnim(giftMsg.giftIcon); setTimeout(() => setGiftAnim(null), 2500) }
  }, [messages.length])

  const addXP = async (amount: number) => {
    const user = auth.currentUser
    if (!user) return
    setMyXP(prev => prev + amount)
    await updateDoc(doc(db, "users", user.uid), { xp: increment(amount) }).catch(() => setDoc(doc(db, "users", user.uid), { xp: amount }, { merge: true }))
  }

  const sendMessage = async (imageUrl?: string) => {
    const user = auth.currentUser
    if ((!text.trim() && !imageUrl) || !user || sending) return
    setSending(true)
    try {
      const displayName = getDecoratedUserName(user.displayName || myRole?.displayName || "سوداني", myXP, myRole?.decoration)
      await addDoc(collection(db, `chatRooms/${id}/messages`), {
        text: text.trim(), imageUrl: imageUrl || null, uid: user.uid, displayName,
        photoURL: user.photoURL || "", role: myRole?.role || 'عضو', isModerator: isMeMod, userXP: myXP, createdAt: serverTimestamp()
      })
      await addXP(5)
      setTaskProgress(p => ({ ...p, messages: Math.min(20, p.messages + 1) }))
      setText(""); setShowEmoji(false)
    } finally { setSending(false) }
  }

  const sendGift = async (gift: any, targetName?: string) => {
    const user = auth.currentUser
    if (!user) return
    if (gift.price > 0 && myCoins < gift.price) { alert(`كوينزك ما كافية!`); return }
    if (gift.price > 0) {
      setMyCoins(c => c - gift.price)
      await updateDoc(doc(db, "users", user.uid), { coins: increment(-gift.price) }).catch(() => {})
    }
    await addDoc(collection(db, `chatRooms/${id}/messages`), {
      text: `🎁 ${user.displayName || "زول"} أرسل ${gift.icon} ${gift.name} ${targetName ? `لـ ${targetName}` : "للغرفة"}`, uid: user.uid, displayName: getDecoratedUserName(user.displayName || "سوداني", myXP), isGift: true, giftIcon: gift.icon, giftName: gift.name, createdAt: serverTimestamp()
    })
    await addXP(gift.xp)
    setTaskProgress(p => ({ ...p, gift: 1 }))
    setShowGifts(false)
  }

  const handleImage = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("الصورة كبيرة"); return }
    setUploading(true)
    try {
      const form = new FormData(); form.append("image", file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: form })
      const data = await res.json()
      if (data.data?.url) await sendMessage(data.data.url)
    } catch { alert("النت ضعيف") }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const getBadge = (m: any) => {
    if (m.role === 'مالك' || m.uid === customRoom?.ownerUid) return <span className="bg-[#00E5FF] text-black text-[9px] font-black px-2 py-0.5 rounded-full">👑 المالك</span>
    if (m.isModerator || m.role === 'مشرف عام' || m.role === 'مشرف') return <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ مشرف</span>
    return null
  }

  // هذا يمنع خطأ الـ build للـ id=0
  if (id === "0") {
    return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">Postatee Chat</div>
  }

  if (!roomLoaded) return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">جاري التحميل... ⏳</div>

  if (!room) return (
    <div className="min-h-screen bg-[#0B1416] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="text-[60px]">😕</div>
      <p className="font-black text-[18px] mt-3">الغرفة غير موجودة</p>
      <Link href="/chat-rooms" className="mt-6 bg-[#00E676] text-black font-black px-6 py-3 rounded-full">ارجع للغرف ←</Link>
    </div>
  )

  return (
    <div className="h-[100dvh] bg-[#0B1416] flex flex-col text-white relative overflow-hidden">
      {giftAnim && <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center"><div className="text-[120px] animate-bounce">{giftAnim}</div></div>}
      <div className="bg-[#122025] border-b border-[#1E3A42] p-3">
        <div className="flex items-center gap-3">
          <Link href="/chat-rooms" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
          <div className={`w-10 h-10 rounded-xl ${room?.bg || "bg-purple-500/20"} flex items-center justify-center text-xl`}>{room?.icon || "💬"}</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-[15px] truncate">{room?.decoratedName || room?.name} • 🟢 {onlineCount}</h2>
            <p className="text-[11px] text-white/50 truncate">{room?.type === "private" ? "🔒 غرفة خاصة" : room?.desc}</p>
          </div>
          <button onClick={() => setShowGifts(true)} className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-lg">🎁</button>
        </div>
        <div className="flex items-center gap-2 mt-2 bg-black/20 rounded-full px-3 py-1.5">
          <span className="text-[11px] font-black">{myLevel.title} • Lv {myLevel.level}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF9800]" style={{ width: `${Math.min(100, (myXP / myLevel.nextXP) * 100)}%` }} /></div>
          <span className="text-[10px] text-[#FFD700] font-bold">{myXP} XP</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map(m => m.isSystem ? <p key={m.id} className="text-center text-[11px] bg-white/10 py-1.5 px-3 rounded-full mx-auto w-fit text-yellow-300">{m.text}</p> : m.isGift ? <div key={m.id} className="mx-auto w-fit bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl px-4 py-3 text-center"><div className="text-4xl">{m.giftIcon}</div><p className="text-[13px] font-bold mt-1">{m.text}</p></div> : (
          <div key={m.id} className={`flex gap-2 ${m.uid === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.uid === auth.currentUser?.uid ? 'bg-[#00E676] text-black' : 'bg-[#1A2E35]'} p-2.5 rounded-2xl max-w-[78%] text-[14px]`}>
              {m.uid !== auth.currentUser?.uid && <div className="flex gap-1.5 mb-1"><p className="text-[11px] font-black opacity-70">{m.displayName}</p>{getBadge(m)}</div>}
              {m.imageUrl && <img src={m.imageUrl} className="rounded-xl max-w-[220px] mb-1.5" />}
              {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-[#122025] flex gap-2 items-center">
        <input type="file" ref={fileRef} onChange={handleImage} accept="image/*" className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="w-11 h-11 bg-[#1A2E35] rounded-full flex items-center justify-center">🖼️</button>
        <button onClick={() => setShowEmoji(!showEmoji)} className="w-11 h-11 bg-[#1A2E35] rounded-full">😊</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="اكتب رسالتك..." className="flex-1 bg-[#1A2E35] rounded-full px-4 py-3 text-[14px] outline-none" />
        <button onClick={() => sendMessage()} className="w-12 h-12 bg-[#00E676] rounded-full text-black font-black">➤</button>
      </div>
      {showEmoji && <div className="bg-[#122025] p-2 grid grid-cols-7 gap-1">{EMOJIS.map(e => <button key={e} onClick={() => setText(prev => prev + e)} className="text-[22px] p-2">{e}</button>)}</div>}
      {showGifts && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setShowGifts(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full bg-[#122025] p-4 rounded-t-[24px]">
            <p className="font-black mb-3">أرسل هدية 🎁</p>
            <div className="grid grid-cols-5 gap-2">{GIFTS.map(g => <button key={g.id} onClick={() => sendGift(g)} className="bg-white/5 rounded-2xl p-3 flex flex-col items-center"><span className="text-3xl">{g.icon}</span><span className="text-[11px]">{g.name}</span></button>)}</div>
            <button onClick={() => setShowGifts(false)} className="w-full mt-3 bg-white/10 p-3.5 rounded-2xl font-bold">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  )
}