"use client"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, onSnapshot, updateDoc, increment, collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

const isOwnerRole = (role: any) => role === "owner" || role === "مالك"

// 1. زخارف الاسم - السعر من عندي
const NAME_DECORATIONS = [
  { id: "none", label: "بدون", preview: "الاسم", price: 0 },
  { id: "crown", label: "👑 تاج", preview: "👑 الاسم 👑", prefix: "👑 ", suffix: " 👑", price: 400 },
  { id: "fire", label: "🔥 ناري", preview: "🔥 الاسم 🔥", prefix: "🔥 ", suffix: " 🔥", price: 350 },
  { id: "heart", label: "❤️ قلوب", preview: "❤️ الاسم ❤️", prefix: "❤️ ", suffix: " ❤️", price: 250 },
  { id: "star", label: "⭐ نجمة", preview: "⭐ الاسم ⭐", prefix: "⭐ ", suffix: " ⭐", price: 250 },
  { id: "brackets", label: "〖زخرفة〗", preview: "〖الاسم〗", prefix: "〖", suffix: "〗", price: 300 },
  { id: "angel", label: "😇 ملاك", preview: "😇 الاسم 😇", prefix: "😇 ", suffix: " 😇", price: 500 },
  { id: "king", label: "♔ ملك", preview: "♔ الاسم ♔", prefix: "♔ ", suffix: " ♔", price: 800 },
]

// 2. إطارات الصورة الشخصية - السعر من عندي
const AVATAR_FRAMES = [
  { id: "none", label: "عادي", class: "border-transparent", price: 0 },
  { id: "gold_ring", label: "🟡 حلقة ذهبية", class: "border-yellow-400 border-[3px] shadow-[0_0_12px_rgba(250,204,21,0.6)]", price: 400 },
  { id: "green_neon", label: "🟢 نيون أخضر", class: "border-[#00E676] border-[3px] shadow-[0_0_15px_rgba(0,230,118,0.7)]", price: 600 },
  { id: "fire_ring", label: "🔥 حلقة نار", class: "border-orange-500 border-[3px] shadow-[0_0_15px_rgba(249,115,22,0.8)]", price: 800 },
  { id: "rainbow_ring", label: "🌈 قوس قزح", class: "border-transparent bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 p-[3px]", price: 1200 },
  { id: "diamond_ring", label: "💎 ماسي", class: "border-white border-[3px] shadow-[0_0_20px_rgba(255,255,255,0.9)]", price: 2000 },
  { id: "king_frame", label: "👑 تاج ملكي", class: "border-yellow-300 border-[4px] shadow-[0_0_20px_rgba(250,204,21,0.9)]", price: 2500 },
]

// 3. إطارات المقعد - السعر من عندي
const SEAT_FRAMES = [
  { id: "none", label: "عادي", class: "bg-white/20", price: 0 },
  { id: "gold", label: "👑 ذهبي", class: "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]", price: 500 },
  { id: "fire", label: "🔥 ناري", class: "bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse", price: 800 },
  { id: "ice", label: "❄️ ثلجي", class: "bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]", price: 800 },
  { id: "rainbow", label: "🌈 قوس قزح", class: "bg-gradient-to-br from-pink-500 via-yellow-500 to-green-500 shadow-[0_0_20px_rgba(236,72,153,0.6)]", price: 1500 },
  { id: "diamond", label: "💎 ماسي", class: "bg-gradient-to-br from-white via-cyan-200 to-white shadow-[0_0_20px_rgba(255,255,255,0.8)]", price: 2000 },
]

// 4. دخول مميز - السعر من عندي
const ENTRANCES = [
  { id: "none", label: "عادي", desc: "دخول عادي", price: 0, icon: "🚶" },
  { id: "fire_entry", label: "🔥 دخول ناري", desc: "الشاشة تولع نار", price: 1000, icon: "🔥" },
  { id: "hearts", label: "❤️ قلوب متطايرة", desc: "قلوب تطير في الشاشة", price: 1200, icon: "💕" },
  { id: "gold_rain", label: "💰 مطر ذهب", desc: "كوينز بتنزل من فوق", price: 1500, icon: "💸" },
  { id: "king_entry", label: "👑 دخول الملوك", desc: "تاج + هيبة + ذهب", price: 3000, icon: "👑" },
  { id: "legend", label: "⚡ دخول أسطوري", desc: "أفخم دخول في المنصة", price: 5000, icon: "⚡" },
]

const DAILY_TASKS = [
  { id: "login", title: "سجّل دخول اليوم", reward: 50, icon: "📅" },
  { id: "chat_10", title: "ارسل 10 رسائل", reward: 100, icon: "💬" },
  { id: "post", title: "انشر منشور", reward: 80, icon: "📝" },
  { id: "friend", title: "أضف صديق", reward: 120, icon: "👥" },
]

type Tab = "all" | "deco" | "avatar" | "seat" | "entrance" | "tasks"

export default function StorePage(){
  const [user, setUser] = useState<any>(null)
  const [uid, setUid] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  const router = useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.replace("/login"); return }
      setUid(u.uid)
      onSnapshot(doc(db, "users", u.uid), snap=>{
        if(snap.exists()) setUser({uid: u.uid, ...snap.data()})
      })
      const today = new Date().toISOString().slice(0,10)
      const tq = query(collection(db, "taskClaims"), where("uid","==", u.uid), where("date","==", today))
      onSnapshot(tq, snap=> setClaimedTasks(snap.docs.map(d=>d.data().taskId)))
    })
    return ()=> unsub()
  },[router])

  const coins = user?.coins ?? 0
  const isOwner = isOwnerRole(user?.role)

  const ownedDecos = user?.ownedDecos || ["none"]
  const ownedAvatarFrames = user?.ownedAvatarFrames || ["none"]
  const ownedSeatFrames = user?.ownedFrames || ["none"]
  const ownedEntrances = user?.ownedEntrances || ["none"]

  const buy = async(item:any, type:string)=>{
    const fieldMap:any = {
      deco: { owned: "ownedDecos", current: "decoPrefix", idField: "decoId", suffixField: "decoSuffix" },
      avatar: { owned: "ownedAvatarFrames", current: "avatarFrame" },
      seat: { owned: "ownedFrames", current: "seatFrame" },
      entrance: { owned: "ownedEntrances", current: "entrance" },
    }
    const map = fieldMap[type]
    const owned = type==="deco"? ownedDecos : type==="avatar"? ownedAvatarFrames : type==="seat"? ownedSeatFrames : ownedEntrances

    // المالك مجاني
    if(isOwner){
      if(type==="deco") await updateDoc(doc(db,"users",uid),{ decoPrefix: item.prefix || "", decoSuffix: item.suffix || "", decoId: item.id })
      else await updateDoc(doc(db,"users",uid),{ [map.current]: item.id })
      alert("تم التفعيل 👑 انت المالك")
      return
    }

    if(owned.includes(item.id)){
      if(type==="deco") await updateDoc(doc(db,"users",uid),{ decoPrefix: item.prefix || "", decoSuffix: item.suffix || "", decoId: item.id })
      else await updateDoc(doc(db,"users",uid),{ [map.current]: item.id })
      return
    }

    if(coins < item.price) return alert(`كوينزك ${coins} ما كافية! تحتاج ${item.price} 💰`)

    const newOwned = [...owned, item.id]
    if(type==="deco") await updateDoc(doc(db,"users",uid),{ coins: increment(-item.price), ownedDecos: newOwned, decoPrefix: item.prefix || "", decoSuffix: item.suffix || "", decoId: item.id })
    else await updateDoc(doc(db,"users",uid),{ coins: increment(-item.price), [map.owned]: newOwned, [map.current]: item.id })
    alert(`مبروك! اشتريت ${item.label} 🎉`)
  }

  const claimTask = async(task:any)=>{
    if(claimedTasks.includes(task.id)) return
    const today = new Date().toISOString().slice(0,10)
    await updateDoc(doc(db,"users",uid),{ coins: increment(task.reward) })
    await addDoc(collection(db,"taskClaims"),{ uid, taskId: task.id, date: today, reward: task.reward, createdAt: serverTimestamp() })
    alert(`+${task.reward} كوينز 🎉`)
  }

  if(!user) return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">تحميل...</div>

  return (
    <div className="min-h-screen bg-[#0B1416] text-white pb-24" dir="rtl">
      <header className="sticky top-0 z-50 bg-[#0B1416]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/chat-rooms" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">←</Link>
        <h1 className="font-black text-[18px]">🛍️ متجر الكوينز</h1>
        <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[12px] font-black">💰 {coins}</div>
      </header>

      {/* التبويبات */}
      <div className="mx-4 mt-4 flex gap-2 bg-white/[0.05] p-1.5 rounded-full border border-white/10 overflow-x-auto scrollbar-hide">
        {[
          {id:"all", label:"🔥 الكل"},
          {id:"deco", label:"✨ زخرفة اسم"},
          {id:"avatar", label:"🖼️ إطار صورة"},
          {id:"seat", label:"🪑 إطار مقعد"},
          {id:"entrance", label:"⚡ دخول مميز"},
          {id:"tasks", label:"🎯 مهام"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-black ${tab===t.id ? "bg-white text-black" : "text-white/60"}`}>{t.label}</button>
        ))}
      </div>

      {/* الكل */}
      {tab==="all" && (
        <div className="mx-4 mt-4 space-y-6">
          <Section title="✨ زخرفة الاسم - 250-800 كوينز" items={NAME_DECORATIONS} type="deco" user={user} owned={ownedDecos} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <p className="font-black text-[14px]">{it.preview}</p>} />
          <Section title="🖼️ إطار الصورة - 400-2500 كوينز" items={AVATAR_FRAMES} type="avatar" user={user} owned={ownedAvatarFrames} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center bg-[#1A2E35] ${it.class} ${it.class.includes('bg-gradient')?'p-[3px]':''}`}>{it.class.includes('bg-gradient')?<div className="w-full h-full rounded-full bg-[#1A2E35] flex items-center justify-center">😊</div>:"😊"}</div>} />
          <Section title="🪑 إطار المقعد - 500-2000 كوينز" items={SEAT_FRAMES} type="seat" user={user} owned={ownedSeatFrames} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className={`w-12 h-12 rounded-full p-[2px] ${it.class}`}><div className="w-full h-full rounded-full bg-[#1A2E35]" /></div>} />
          <Section title="⚡ دخول مميز - 1000-5000 كوينز" items={ENTRANCES} type="entrance" user={user} owned={ownedEntrances} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className="text-[24px]">{it.icon}</div>} />
        </div>
      )}

      {tab==="deco" && <div className="mx-4 mt-4"><Section title="✨ زخارف الاسم" items={NAME_DECORATIONS} type="deco" user={user} owned={ownedDecos} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <p className="font-black">{it.preview}</p>} /></div>}
      {tab==="avatar" && <div className="mx-4 mt-4"><Section title="🖼️ إطارات الصورة" items={AVATAR_FRAMES} type="avatar" user={user} owned={ownedAvatarFrames} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center bg-[#1A2E35] ${it.class} ${it.class.includes('bg-gradient')?'p-[3px]':''}`}>{it.class.includes('bg-gradient')?<div className="w-full h-full rounded-full bg-[#1A2E35] flex items-center justify-center">😊</div>:"😊"}</div>} /></div>}
      {tab==="seat" && <div className="mx-4 mt-4"><Section title="🪑 إطارات المقعد" items={SEAT_FRAMES} type="seat" user={user} owned={ownedSeatFrames} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className={`w-12 h-12 rounded-full p-[2px] ${it.class}`}><div className="w-full h-full rounded-full bg-[#1A2E35]" /></div>} /></div>}
      {tab==="entrance" && <div className="mx-4 mt-4"><Section title="⚡ دخول مميز" items={ENTRANCES} type="entrance" user={user} owned={ownedEntrances} coins={coins} isOwner={isOwner} onBuy={buy} renderPreview={(it:any)=> <div className="text-center"><div className="text-[28px]">{it.icon}</div><p className="text-[10px] text-white/50 mt-1">{it.desc}</p></div>} /></div>}

      {tab==="tasks" && (
        <div className="mx-4 mt-4 space-y-3">
          {DAILY_TASKS.map(t=>{
            const claimed = claimedTasks.includes(t.id)
            return (
              <div key={t.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[22px]">{t.icon}</div>
                <div className="flex-1"><p className="font-bold text-[14px]">{t.title}</p><p className="text-[11px] text-white/50">+{t.reward} كوينز</p></div>
                <button disabled={claimed} onClick={()=>claimTask(t)} className={`px-4 py-2 rounded-full font-black text-[12px] ${claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500 text-black"}`}>{claimed ? "✅ تم" : "استلم"}</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Section({title, items, type, user, owned, coins, isOwner, onBuy, renderPreview}: any){
  return (
    <div>
      <h3 className="font-black mb-3 text-[14px]">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it:any)=>{
          const isOwned = owned.includes(it.id) || isOwner
          const isActive = type==="deco" ? user.decoId===it.id : type==="avatar" ? user.avatarFrame===it.id : type==="seat" ? user.seatFrame===it.id : user.entrance===it.id
          const canBuy = isOwner || coins >= it.price
          return (
            <div key={it.id} className={`bg-white/[0.04] border rounded-2xl p-3 text-center ${isActive ? "border-[#00E676] bg-[#00E676]/5" : "border-white/10"}`}>
              <div className="h-[50px] flex items-center justify-center">{renderPreview(it)}</div>
              <p className="font-bold text-[13px] mt-1">{it.label}</p>
              {it.price > 0 && <p className="text-[11px] text-yellow-400 font-black">💰 {it.price}</p>}
              {it.price === 0 && <p className="text-[11px] text-white/30">مجاني</p>}
              <button onClick={()=>onBuy(it,type)} className={`w-full mt-2 py-2 rounded-full font-black text-[12px] ${isActive ? "bg-[#00E676] text-black" : isOwned ? "bg-white/15" : !canBuy ? "bg-white/5 text-white/20" : "bg-yellow-500 text-black"}`}>{isActive ? "✅ مفعل" : isOwned ? "تفعيل" : !canBuy ? `ناقص ${it.price - coins}` : `اشتري`}</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}