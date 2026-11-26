"use client"
import { useEffect, useState, useRef } from "react"
import { sudaneseRooms, GIFTS, DAILY_TASKS, getLevelFromXP, getDecoratedUserName, USER_DECORATIONS } from "@/lib/chatRoomsData"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore"
import Link from "next/link"

const EMOJIS = ["❤️", "😂", "😍", "😭", "🔥", "👏", "😡", "💔", "🙏", "😳", "🥺", "😎", "🇸🇩", "💚"]
const IMGBB_KEY = "f3d1a2b4c5d6e7f8g9h0i1j2k3l4m5n6"

export default function ChatRoomClient({ id }: { id: string }) {
  const [customRoom, setCustomRoom] = useState<any>(null)
  const room = customRoom || sudaneseRooms.find(r => r.id === id) || sudaneseRooms[1]
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
  const [showProfile, setShowProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [giftAnim, setGiftAnim] = useState<string | null>(null)
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({ login: 1, messages: 0, stay: 0, gift: 0, create: 0 })
  const [claimed, setClaimed] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // جيب بيانات الغرفة الخاصة
  useEffect(() => {
    getDoc(doc(db, "customRooms", id)).then(s => { if (s.exists()) setCustomRoom({ id: s.id, ...s.data() }) }).catch(() => {})
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

  // اونلاين + عدّاد البقاء للمهام
  useEffect(() => {
    const user = auth.currentUser
    if (!user || !id) return
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
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100)
    })
    return () => unsub()
  }, [id])

  // انيميشن الهدية
  useEffect(() => {
    const giftMsg = [...messages].reverse().find(m => m.isGift)
    if (giftMsg) { setGiftAnim(giftMsg.giftIcon); setTimeout(() => setGiftAnim(null), 2500) }
  }, [messages.length])

  const addXP = async (amount: number, reason: string) => {
    const user = auth.currentUser
    if (!user) return
    setMyXP(prev => prev + amount)
    await updateDoc(doc(db, "users", user.uid), { xp: increment(amount) }).catch(() => setDoc(doc(db, "users", user.uid), { xp: amount }, { merge: true }))
  }

  const checkBlock = async () => {
    const user = auth.currentUser
    if (!user) return null
    const banSnap = await getDoc(doc(db, `chatRooms/${id}/bans/${user.uid}`))
    if (banSnap.exists()) {
      const d = banSnap.data()
      if (d.type === 'permanent') return `محظور نهائي - ${d.reason}`
      if (d.until?.toDate && d.until?.toDate() > new Date()) return `مطرود حتى ${d.until.toDate().toLocaleTimeString('ar-SD')}`
      await deleteDoc(doc(db, `chatRooms/${id}/bans/${user.uid}`))
    }
    const muteSnap = await getDoc(doc(db, `chatRooms/${id}/mutes/${user.uid}`))
    if (muteSnap.exists() && muteSnap.data().until?.toDate() > new Date()) return `مكتوم حتى ${muteSnap.data().until.toDate().toLocaleTimeString('ar-SD')}`
    return null
  }

  const punishUser = async (target: any, type: 'mute' | 'kick' | 'ban', minutes: number) => {
    const user = auth.currentUser
    if (!user) return
    const coll = type === 'mute' ? 'mutes' : 'bans'
    const until = minutes === -1 ? null : new Date(Date.now() + minutes * 60 * 1000)
    await setDoc(doc(db, `chatRooms/${id}/${coll}/${target.uid}`), { targetUid: target.uid, targetName: target.displayName, bannedBy: user.uid, reason: 'مخالفة', type: minutes === -1 ? 'permanent' : 'temp', until, createdAt: serverTimestamp() })
    await addDoc(collection(db, `chatRooms/${id}/messages`), { text: `🚫 تم ${type === 'mute' ? 'كتم' : type === 'ban' ? 'حظر' : 'طرد'} ${target.displayName}`, uid: 'system', displayName: 'النظام', isSystem: true, createdAt: serverTimestamp() })
    setSelectedUser(null)
  }

  const sendMessage = async (imageUrl?: string) => {
    const user = auth.currentUser
    if ((!text.trim() && !imageUrl) || !user || sending) return
    setSending(true)
    try {
      const block = await checkBlock()
      if (block) { alert(block); return }
      const displayName = getDecoratedUserName(user.displayName || myRole?.displayName || "سوداني", myXP, myRole?.decoration)
      await addDoc(collection(db, `chatRooms/${id}/messages`), {
        text: text.trim(), imageUrl: imageUrl || null, uid: user.uid, displayName,
        photoURL: user.photoURL || "", role: myRole?.role || 'عضو', isModerator: isMeMod, userXP: myXP, createdAt: serverTimestamp()
      })
      await addXP(5, "message")
      setTaskProgress(p => ({ ...p, messages: Math.min(20, p.messages + 1) }))
      setText(""); setShowEmoji(false)
    } finally { setSending(false) }
  }

  const sendGift = async (gift: any, targetName?: string) => {
    const user = auth.currentUser
    if (!user) return
    if (gift.price > 0 && myCoins < gift.price) { alert(`كوينزك ما كافية! عندك ${myCoins} - الهدية بـ ${gift.price}`); return }
    if (gift.price > 0) {
      setMyCoins(c => c - gift.price)
      await updateDoc(doc(db, "users", user.uid), { coins: increment(-gift.price) }).catch(() => {})
    }
    await addDoc(collection(db, `chatRooms/${id}/messages`), {
      text: `🎁 ${user.displayName || "زول"} أرسل ${gift.icon} ${gift.name} ${targetName ? `لـ ${targetName}` : "للغرفة"}`, uid: user.uid, displayName: getDecoratedUserName(user.displayName || "سوداني", myXP), isGift: true, giftIcon: gift.icon, giftName: gift.name, createdAt: serverTimestamp()
    })
    await addXP(gift.xp, "gift")
    setTaskProgress(p => ({ ...p, gift: 1 }))
    setShowGifts(false)
  }

  const claimTask = async (task: any) => {
    if (claimed.includes(task.id)) return
    await addXP(task.rewardXP, task.id)
    setClaimed([...claimed, task.id])
    alert(`🎉 مبروك! أخدت +${task.rewardXP} XP`)
  }

  const handleImage = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("الصورة كبيرة - اقل من 5 ميغا"); return }
    setUploading(true)
    try {
      const form = new FormData(); form.append("image", file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: form })
      const data = await res.json()
      if (data.data?.url) await sendMessage(data.data.url)
      else alert("فشل الرفع")
    } catch { alert("النت ضعيف") }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const getBadge = (m: any) => {
    if (m.role === 'مالك' || m.uid === customRoom?.ownerUid) return <span className="bg-[#00E5FF] text-black text-[9px] font-black px-2 py-0.5 rounded-full">👑 المالك</span>
    if (m.isModerator || m.role === 'مشرف عام' || m.role === 'مشرف') return <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ مشرف</span>
    return null
  }

  return (
    <div className="h-[100dvh] bg-[#0B1416] flex flex-col text-white relative overflow-hidden">
      {/* انيميشن الهدية */}
      {giftAnim && <div className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center"><div className="text-[120px] animate-bounce drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">{giftAnim}</div></div>}

      {/* هيدر */}
      <div className="bg-[#122025] border-b border-[#1E3A42] p-3">
        <div className="flex items-center gap-3">
          <Link href="/chat-rooms" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center shrink-0">←</Link>
          <div className={`w-10 h-10 rounded-xl ${room.bg || "bg-purple-500/20"} flex items-center justify-center text-xl shrink-0`}>{room.icon}</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-[15px] truncate">{room.decoratedName || room.name} • 🟢 {onlineCount}</h2>
            <p className="text-[11px] text-white/50 truncate">{room.type === "private" ? "🔒 غرفة خاصة" : room.desc || `${onlineCount} متواجد الآن`}</p>
          </div>
          <button onClick={() => setShowTasks(true)} className="relative w-10 h-10 bg-[#FFD700]/15 rounded-full flex items-center justify-center text-lg">🎯<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] rounded-full flex items-center justify-center font-black">{DAILY_TASKS.length - claimed.length}</span></button>
          <button onClick={() => setShowGifts(true)} className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center text-lg">🎁</button>
        </div>
        {/* شريط مستواي */}
        <div className="flex items-center gap-2 mt-2 bg-black/20 rounded-full px-3 py-1.5">
          <span className="text-[12px]">{"⭐".repeat(Math.min(5, myLevel.stars))}</span>
          <span className="text-[11px] font-black whitespace-nowrap">{myLevel.title} • Lv {myLevel.level}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF9800]" style={{ width: `${Math.min(100, (myXP / myLevel.nextXP) * 100)}%` }} /></div>
          <span className="text-[10px] text-[#FFD700] font-bold">{myXP} XP</span>
          <span className="text-[10px] bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full font-bold">🪙 {myCoins}</span>
        </div>
      </div>

      {/* الرسائل */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && <div className="text-center pt-20"><div className="text-6xl mb-3">{room.icon}</div><p className="font-black">أهلاً بيك في {room.decoratedName || room.name}</p><p className="text-white/50 text-[13px] mt-1">كن أول زول يسلم 👋</p></div>}
        {messages.map(m => m.isSystem ? (
          <p key={m.id} className="text-center text-[11px] bg-white/10 py-1.5 px-3 rounded-full mx-auto w-fit text-yellow-300">{m.text}</p>
        ) : m.isGift ? (
          <div key={m.id} className="mx-auto w-fit max-w-[90%] bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl px-4 py-3 text-center"><div className="text-4xl animate-bounce">{m.giftIcon}</div><p className="text-[13px] font-bold mt-1">{m.text}</p></div>
        ) : (
          <div key={m.id} className={`flex gap-2 ${m.uid === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.uid === auth.currentUser?.uid ? 'bg-[#00E676] text-black' : m.isModerator ? 'bg-[#1A2E35] border border-green-500/30' : 'bg-[#1A2E35]'} p-2.5 rounded-2xl max-w-[78%] text-[14px]`}>
              {m.uid !== auth.currentUser?.uid && <div onClick={() => isMeMod && setSelectedUser(m)} className={`flex items-center gap-1.5 mb-1 ${isMeMod ? 'cursor-pointer' : ''}`}><p className={`text-[11px] font-black ${m.isModerator ? 'text-green-400' : 'opacity-70'}`}>{m.displayName}</p>{getBadge(m)}{m.userXP >= 2000 && <span className="text-[10px]">⭐</span>}</div>}
              {m.imageUrl && <img src={m.imageUrl} className="rounded-xl max-w-[220px] mb-1.5" loading="lazy" />}
              {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
            </div>
          </div>
        ))}
      </div>

      {showEmoji && <div className="bg-[#122025] border-t border-[#1E3A42] p-2 grid grid-cols-7 gap-1">{EMOJIS.map(e => <button key={e} onClick={() => setText(prev => prev + e)} className="text-[22px] p-2 hover:bg-white/10 rounded-xl active:scale-90">{e}</button>)}</div>}

      {/* إدخال */}
      <div className="p-3 bg-[#122025] flex gap-2 items-center">
        <input type="file" ref={fileRef} onChange={handleImage} accept="image/*" className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-11 h-11 bg-[#1A2E35] rounded-full flex items-center justify-center text-lg active:scale-90">🖼️</button>
        <button onClick={() => setShowEmoji(!showEmoji)} className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${showEmoji ? 'bg-[#00E676] text-black' : 'bg-[#1A2E35]'}`}>😊</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={uploading ? "جاري رفع الصورة..." : "اكتب رسالتك..."} disabled={uploading || sending} className="flex-1 bg-[#1A2E35] rounded-full px-4 py-3 text-[14px] outline-none disabled:opacity-50" />
        <button onClick={() => sendMessage()} disabled={uploading || sending || !text.trim()} className="w-12 h-12 bg-[#00E676] rounded-full flex items-center justify-center text-black font-black active:scale-90 disabled:opacity-50">{uploading || sending ? '⌛' : '➤'}</button>
      </div>

      {/* مودال الهدايا */}
      {showGifts && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setShowGifts(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full bg-[#122025] p-4 rounded-t-[24px]">
            <div className="flex justify-between items-center mb-3"><p className="font-black">أرسل هدية 🎁</p><p className="text-[12px] bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full font-bold">🪙 {myCoins} كوين</p></div>
            <div className="grid grid-cols-5 gap-2">{GIFTS.map(g => <button key={g.id} onClick={() => sendGift(g)} className="bg-white/5 rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95"><span className="text-3xl">{g.icon}</span><span className="text-[11px] font-bold">{g.name}</span><span className="text-[10px] text-white/50">{g.price === 0 ? "مجاني" : `${g.price} 🪙`}</span><span className="text-[9px] text-[#FFD700]">+{g.xp} XP</span></button>)}</div>
            <button onClick={() => setShowGifts(false)} className="w-full mt-3 bg-white/10 p-3.5 rounded-2xl font-bold">إغلاق</button>
          </div>
        </div>
      )}

      {/* مودال المهام */}
      {showTasks && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setShowTasks(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full bg-[#122025] p-4 rounded-t-[24px] max-h-[80dvh] overflow-auto">
            <p className="font-black text-center mb-1">🎯 المهام اليومية</p><p className="text-center text-[12px] text-white/50 mb-4">أكمل المهام واجمع XP وارفع مستواك</p>
            <div className="space-y-2">{DAILY_TASKS.map(t => {
              const prog = taskProgress[t.id] || 0
              const done = prog >= t.target
              const isClaimed = claimed.includes(t.id)
              return (
                <div key={t.id} className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1"><p className="font-bold text-[13px]">{t.title}</p><p className="text-[11px] text-white/50">{t.desc} • +{t.rewardXP} XP</p><div className="h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-[#00E676]" style={{ width: `${Math.min(100, (prog / t.target) * 100)}%` }} /></div></div>
                  <span className="text-[11px] font-bold">{prog}/{t.target}</span>
                  {done && !isClaimed ? <button onClick={() => claimTask(t)} className="bg-[#FFD700] text-black px-3 py-2 rounded-full text-[12px] font-black">استلم 🎉</button> : isClaimed ? <span className="text-green-400 text-[12px] font-bold">✅ تم</span> : <span className="text-white/30 text-[12px]">...</span>}
                </div>
              )
            })}</div>
            <div className="mt-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-3"><p className="font-bold text-[13px]">💎 زخارف اسمك (حسب مستواك)</p><div className="flex gap-2 mt-2 flex-wrap">{USER_DECORATIONS.map(d => <span key={d.id} className={`text-[11px] px-2 py-1 rounded-full ${myXP >= d.minLevel ? "bg-white/15" : "bg-white/5 opacity-40 line-through"}`}>{d.label} • Lv {d.minLevel}</span>)}</div></div>
            <button onClick={() => setShowTasks(false)} className="w-full mt-3 bg-white/10 p-3.5 rounded-2xl font-bold">إغلاق</button>
          </div>
        </div>
      )}

      {/* مودال العقوبات - زي القديم بالضبط */}
      {selectedUser && isMeMod && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setSelectedUser(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full bg-[#122025] p-4 rounded-t-[24px]">
            <p className="text-center font-black mb-4">عقوبة لـ {selectedUser.displayName}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => punishUser(selectedUser, 'mute', 5)} className="bg-yellow-500/15 text-yellow-400 p-3.5 rounded-2xl font-bold">🔇 كتم 5د</button>
              <button onClick={() => punishUser(selectedUser, 'kick', 30)} className="bg-orange-500/15 text-orange-400 p-3.5 rounded-2xl font-bold">👢 طرد 30د</button>
              <button onClick={() => punishUser(selectedUser, 'kick', 1440)} className="bg-red-500/15 text-red-400 p-3.5 rounded-2xl font-bold">⏰ 24 ساعة</button>
              <button onClick={() => { if (confirm('حظر نهائي؟')) punishUser(selectedUser, 'ban', -1) }} className="bg-red-600 text-white p-3.5 rounded-2xl font-black">🚫 حظر</button>
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full mt-3 bg-white/10 p-3.5 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}