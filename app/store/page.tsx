"use client"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, onSnapshot, updateDoc, increment, collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

const isOwnerRole = (role: any) => role === "owner" || role === "مالك"

const SEAT_FRAMES = [
  { id: "none", label: "عادي", class: "bg-white/20", price: 0, minLevel: 0 },
  { id: "gold", label: "👑 ذهبي", class: "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]", price: 500, minLevel: 1 },
  { id: "fire", label: "🔥 ناري", class: "bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]", price: 800, minLevel: 3 },
  { id: "ice", label: "❄️ ثلجي", class: "bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]", price: 800, minLevel: 3 },
  { id: "rainbow", label: "🌈 قوس قزح", class: "bg-gradient-to-br from-pink-500 via-yellow-500 to-green-500 shadow-[0_0_20px_rgba(236,72,153,0.6)]", price: 1500, minLevel: 5 },
  { id: "diamond", label: "💎 ماسي", class: "bg-gradient-to-br from-white via-cyan-200 to-white shadow-[0_0_20px_rgba(255,255,255,0.8)]", price: 2000, minLevel: 7 },
]
const NAME_COLORS = [
  { id: "white", label: "أبيض", class: "text-white", price: 0, minLevel: 0 },
  { id: "gold", label: "ذهبي", class: "text-yellow-400 font-black", price: 300, minLevel: 1 },
  { id: "green", label: "أخضر نيون", class: "text-[#00E676] font-black", price: 300, minLevel: 2 },
  { id: "rainbow", label: "قوس قزح", class: "bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent font-black", price: 1000, minLevel: 5 },
]

const DAILY_TASKS = [
  { id: "login", title: "سجّل دخول اليوم", desc: "افتح التطبيق كل يوم", reward: 50, icon: "📅" },
  { id: "chat_10", title: "ارسل 10 رسائل في الغرف", desc: "شارك في الدردشة", reward: 100, icon: "💬" },
  { id: "post", title: "انشر منشور", desc: "انشر أي شي في حائطك", reward: 80, icon: "📝" },
  { id: "friend", title: "أضف صديق جديد", desc: "وسّع دائرتك", reward: 120, icon: "👥" },
]

type Tab = "balance" | "gifts" | "shop" | "myItems"

export default function StorePage(){
  const [user, setUser] = useState<any>(null)
  const [uid, setUid] = useState("")
  const [tab, setTab] = useState<Tab>("balance")
  const [gifts, setGifts] = useState<any[]>([])
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  const router = useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.replace("/login"); return }
      setUid(u.uid)
      onSnapshot(doc(db, "users", u.uid), snap=>{
        if(snap.exists()) setUser({uid: u.uid, ...snap.data()})
      })
      const q = query(collection(db, "gifts"), where("toUid","==", u.uid), orderBy("createdAt","desc"))
      onSnapshot(q, snap=> setGifts(snap.docs.map(d=>({id:d.id, ...d.data()}))))
      const today = new Date().toISOString().slice(0,10)
      const tq = query(collection(db, "taskClaims"), where("uid","==", u.uid), where("date","==", today))
      onSnapshot(tq, snap=> setClaimedTasks(snap.docs.map(d=>d.data().taskId)))
    })
    return ()=> unsub()
  },[router])

  const coins = user?.coins ?? 0
  const level = user?.level || 1
  const ownedFrames = user?.ownedFrames || ["none"]
  const ownedColors = user?.ownedColors || ["white"]
  const isOwner = isOwnerRole(user?.role)

  const claimTask = async(task:any)=>{
    if(claimedTasks.includes(task.id)) return
    const today = new Date().toISOString().slice(0,10)
    await updateDoc(doc(db,"users",uid),{ coins: increment(task.reward) })
    await addDoc(collection(db,"taskClaims"),{ uid, taskId: task.id, date: today, reward: task.reward, createdAt: serverTimestamp() })
    alert(`مبروك! حصلت على ${task.reward} كوينز 🎉`)
  }

  const claimGift = async(gift:any)=>{
    if(gift.claimed) return
    await updateDoc(doc(db,"gifts",gift.id),{ claimed: true })
    await updateDoc(doc(db,"users",uid),{ coins: increment(gift.amount || 0) })
    alert(`استلمت ${gift.amount} كوينز من ${gift.fromName} 🎁`)
  }

  const buyItem = async(item:any, type:"frame"|"color")=>{
    if(isOwner){
      await updateDoc(doc(db,"users",uid),{ [type==="frame"?"seatFrame":"nameColor"]: item.id })
      alert("تم التفعيل - انت المالك 👑")
      return
    }
    const owned = type==="frame" ? ownedFrames : ownedColors
    if(owned.includes(item.id)){
      await updateDoc(doc(db,"users",uid),{ [type==="frame"?"seatFrame":"nameColor"]: item.id })
      return
    }
    if(coins < item.price) return alert(`كوينزك ${coins} ما كافية! تحتاج ${item.price}`)
    if(level < (item.minLevel||0)) return alert(`تحتاج مستوى ${item.minLevel}`)
    const newOwned = [...owned, item.id]
    await updateDoc(doc(db,"users",uid),{
      coins: increment(-item.price),
      [type==="frame"?"ownedFrames":"ownedColors"]: newOwned,
      [type==="frame"?"seatFrame":"nameColor"]: item.id,
    })
    alert(`مبروك! اشتريت ${item.label} 🎉`)
  }

  if(!user) return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">جاري تحميل المتجر...</div>

  return (
    <div className="min-h-screen bg-[#0B1416] text-white pb-24" dir="rtl">
      {/* هيدر */}
      <header className="sticky top-0 z-50 bg-[#0B1416]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/chat-rooms" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">←</Link>
        <h1 className="font-black text-[18px]">🛍️ المتجر</h1>
        <div className="w-9" />
      </header>

      {/* بطاقة الرصيد - نفس ستايل بطاقة الشحن */}
      <div className="mx-4 mt-4 bg-gradient-to-l from-yellow-500 via-amber-400 to-yellow-500 text-black rounded-[24px] p-5 relative overflow-hidden">
        <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-[12px] font-bold opacity-70">رصيدك الحالي</p>
            <p className="text-[32px] font-black leading-none mt-1">💰 {coins} <span className="text-[14px]">كوينز</span></p>
            <p className="text-[12px] font-bold mt-2 opacity-80">Lv.{level} • {user.displayName || "سوداني"}</p>
          </div>
          <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center text-[36px]">🪙</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 relative">
          <div className="bg-black/10 rounded-xl p-2 text-center"><p className="font-black">{ownedFrames.length + ownedColors.length}</p><p className="text-[10px] font-bold opacity-70">سلعة مملوكة</p></div>
          <div className="bg-black/10 rounded-xl p-2 text-center"><p className="font-black">{gifts.filter(g=>!g.claimed).length}</p><p className="text-[10px] font-bold opacity-70">هدية جديدة</p></div>
          <div className="bg-black/10 rounded-xl p-2 text-center"><p className="font-black">{DAILY_TASKS.length - claimedTasks.length}</p><p className="text-[10px] font-bold opacity-70">مهمة متبقية</p></div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="mx-4 mt-4 flex gap-2 bg-white/[0.05] p-1.5 rounded-full border border-white/10 overflow-x-auto">
        {[
          {id:"balance", label:"💰 رصيدي / مهام"},
          {id:"gifts", label:"🎁 هداياي"},
          {id:"shop", label:"🛍️ المتجر"},
          {id:"myItems", label:"🎒 سلعي"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`flex-1 whitespace-nowrap px-3 py-2 rounded-full text-[12px] font-black ${tab===t.id ? "bg-[#00E676] text-black" : "text-white/60"}`}>{t.label}</button>
        ))}
      </div>

      {/* رصيدي + مهام */}
      {tab==="balance" && (
        <div className="mx-4 mt-4 space-y-3">
          <h3 className="font-black">📅 المهام اليومية - جمع كوينز وهمية</h3>
          {DAILY_TASKS.map(task=>{
            const claimed = claimedTasks.includes(task.id)
            return (
              <div key={task.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[22px]">{task.icon}</div>
                <div className="flex-1">
                  <p className="font-bold text-[14px]">{task.title}</p>
                  <p className="text-[11px] text-white/50">{task.desc} • +{task.reward} كوينز</p>
                </div>
                <button disabled={claimed} onClick={()=>claimTask(task)} className={`px-4 py-2 rounded-full font-black text-[12px] ${claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500 text-black"}`}>{claimed ? "✅ تم" : "استلم"}</button>
              </div>
            )
          })}
          <div className="bg-violet-500/10 border border-violet-400/30 rounded-2xl p-4 text-center">
            <p className="font-black text-violet-300">👑 هدايا المالك</p>
            <p className="text-[12px] text-white/60 mt-1">المالك ممكن يرسل ليك هدية كوينز، حتظهر في تبويب هداياي</p>
          </div>
        </div>
      )}

      {/* هداياي */}
      {tab==="gifts" && (
        <div className="mx-4 mt-4 space-y-3">
          {gifts.length===0 && <div className="text-center py-12"><p className="text-[40px]">🎁</p><p className="text-white/50 text-[13px] mt-2">لسه ما جاتك هدايا</p><p className="text-white/30 text-[11px]">المالك ممكن يرسل ليك هدية في أي وقت</p></div>}
          {gifts.map(g=>(
            <div key={g.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-[24px]">🎁</div>
              <div className="flex-1">
                <p className="font-bold text-[14px]">هدية من {g.fromName || "المالك"}</p>
                <p className="text-[11px] text-white/50">{g.message || "هدية كوينز ليك ❤️"} • {g.amount} كوينز</p>
              </div>
              <button disabled={g.claimed} onClick={()=>claimGift(g)} className={`px-4 py-2 rounded-full font-black text-[12px] ${g.claimed ? "bg-white/10 text-white/40" : "bg-yellow-500 text-black"}`}>{g.claimed ? "تم الاستلام" : "استلم"}</button>
            </div>
          ))}
        </div>
      )}

      {/* المتجر */}
      {tab==="shop" && (
        <div className="mx-4 mt-4 space-y-5">
          <div>
            <h3 className="font-black mb-3">🪑 إطارات المقعد</h3>
            <div className="grid grid-cols-2 gap-3">
              {SEAT_FRAMES.map(f=>{
                const owned = ownedFrames.includes(f.id) || isOwner
                const selected = user.seatFrame===f.id
                const locked = !isOwner && level < (f.minLevel||0)
                return (
                  <div key={f.id} className={`bg-white/[0.04] border rounded-2xl p-3 text-center ${selected ? "border-[#00E676]" : "border-white/10"}`}>
                    <div className={`w-14 h-14 rounded-full p-[2px] mx-auto ${f.class}`}><div className="w-full h-full rounded-full bg-[#1a2a2f] flex items-center justify-center font-black text-white/60">{(user.displayName||"?").charAt(0)}</div></div>
                    <p className="font-bold text-[13px] mt-2">{f.label}</p>
                    <p className="text-[11px] text-white/40">مستوى {f.minLevel}+</p>
                    <button disabled={locked} onClick={()=>buyItem(f,"frame")} className={`w-full mt-2 py-2 rounded-full font-black text-[12px] ${selected ? "bg-[#00E676] text-black" : locked ? "bg-white/10 text-white/40" : owned ? "bg-white/15" : "bg-yellow-500 text-black"}`}>{selected ? "✅ مرتدي" : locked ? `🔒 مستوى ${f.minLevel}` : owned ? "ارتداء" : `اشتري - ${f.price} 💰`}</button>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <h3 className="font-black mb-3">🎨 ألوان الاسم</h3>
            <div className="grid grid-cols-2 gap-3">
              {NAME_COLORS.map(c=>{
                const owned = ownedColors.includes(c.id) || isOwner
                const selected = user.nameColor===c.id
                const locked = !isOwner && level < (c.minLevel||0)
                return (
                  <div key={c.id} className={`bg-white/[0.04] border rounded-2xl p-3 text-center ${selected ? "border-[#00E676]" : "border-white/10"}`}>
                    <p className={`font-black text-[16px] ${c.class}`}>{user.displayName || "اسمك"}</p>
                    <p className="text-[11px] text-white/40 mt-1">{c.label} • مستوى {c.minLevel}+</p>
                    <button disabled={locked} onClick={()=>buyItem(c,"color")} className={`w-full mt-2 py-2 rounded-full font-black text-[12px] ${selected ? "bg-[#00E676] text-black" : locked ? "bg-white/10 text-white/40" : owned ? "bg-white/15" : "bg-yellow-500 text-black"}`}>{selected ? "✅ مفعل" : locked ? `🔒 مستوى ${c.minLevel}` : owned ? "تفعيل" : `اشتري - ${c.price} 💰`}</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* سلعي */}
      {tab==="myItems" && (
        <div className="mx-4 mt-4 space-y-3">
          <h3 className="font-black">🎒 سلعك المملوكة</h3>
          <p className="text-[12px] text-white/50">كل شي اشتريتو أو جاتك هدية بيظهر هنا، وتقدر تلبسو طوالي</p>
          {SEAT_FRAMES.filter(f=>ownedFrames.includes(f.id)).map(f=>(
            <div key={f.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full p-[2px] ${f.class}`}><div className="w-full h-full rounded-full bg-[#1a2a2f] flex items-center justify-center font-black">{(user.displayName||"?").charAt(0)}</div></div>
              <div className="flex-1"><p className="font-bold text-[14px]">{f.label}</p><p className="text-[11px] text-white/40">إطار مقعد</p></div>
              <button onClick={()=>buyItem(f,"frame")} className={`px-4 py-2 rounded-full font-black text-[12px] ${user.seatFrame===f.id ? "bg-[#00E676] text-black" : "bg-white/10"}`}>{user.seatFrame===f.id ? "مرتدي ✅" : "ارتداء"}</button>
            </div>
          ))}
          {NAME_COLORS.filter(c=>ownedColors.includes(c.id)).map(c=>(
            <div key={c.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <p className={`font-black text-[16px] ${c.class} w-12 text-center`}>{(user.displayName||"A").charAt(0)}</p>
              <div className="flex-1"><p className="font-bold text-[14px]">{c.label}</p><p className="text-[11px] text-white/40">لون اسم</p></div>
              <button onClick={()=>buyItem(c,"color")} className={`px-4 py-2 rounded-full font-black text-[12px] ${user.nameColor===c.id ? "bg-[#00E676] text-black" : "bg-white/10"}`}>{user.nameColor===c.id ? "مفعل ✅" : "تفعيل"}</button>
            </div>
          ))}
          {ownedFrames.length<=1 && ownedColors.length<=1 && <p className="text-center text-white/40 py-8 text-[13px]">لسه ما عندك سلع، اشتري من المتجر أو اجمع من المهام</p>}
        </div>
      )}
    </div>
  )
}