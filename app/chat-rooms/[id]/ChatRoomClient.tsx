"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, increment } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

// ✅ دالة واحدة للأونر - بتقبل "owner" و "مالك"
const isOwnerRole = (role: any) => role === "owner" || role === "مالك"

const SEAT_FRAMES = [
  { id: "none", label: "عادي", class: "bg-white/20", price: 0 },
  { id: "gold", label: "👑 ذهبي", class: "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]", price: 500 },
  { id: "fire", label: "🔥 ناري", class: "bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse", price: 800 },
  { id: "ice", label: "❄️ ثلجي", class: "bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]", price: 800 },
  { id: "rainbow", label: "🌈 قوس قزح", class: "bg-gradient-to-br from-pink-500 via-yellow-500 to-green-500 shadow-[0_0_20px_rgba(236,72,153,0.6)]", price: 1500 },
  { id: "diamond", label: "💎 ماسي", class: "bg-gradient-to-br from-white via-cyan-200 to-white shadow-[0_0_20px_rgba(255,255,255,0.8)]", price: 2000 },
]
const NAME_COLORS = [
  { id: "white", label: "أبيض", class: "text-white", price: 0 },
  { id: "gold", label: "ذهبي", class: "text-yellow-400 font-black", price: 300 },
  { id: "green", label: "أخضر نيون", class: "text-[#00E676] font-black", price: 300 },
  { id: "rainbow", label: "قوس قزح", class: "bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent font-black", price: 1000 },
]

const TOTAL_SEATS = 12
const EMOJIS = ["❤️","😂","😍","🔥","👏","🇸🇩","💚","😭"]
const AUCTION_SEATS: Record<number, number> = { 2: 500, 3: 300 }

export default function ChatRoomClient({ id }: { id: string }) {
  const [room, setRoom] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [seats, setSeats] = useState<Record<number, any>>({})
  const [messages, setMessages] = useState<any[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [joinedCount, setJoinedCount] = useState(0)
  const [text, setText] = useState("")
  const [isJoined, setIsJoined] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [myCoins, setMyCoins] = useState(1000)
  const [flying, setFlying] = useState<{id:number, emoji:string, left:number}[]>([])
  const [showAuction, setShowAuction] = useState<number | null>(null)
  const [legendEntry, setLegendEntry] = useState<any>(null)
  const [showAd, setShowAd] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ return onAuthStateChanged(auth, setUser) },[])

  useEffect(()=>{
    if(!id) return
    const load = async () => {
      let snap = await getDoc(doc(db, "customRooms", id))
      if(snap.exists()){ setRoom({id: snap.id, ...snap.data()}); return }
      snap = await getDoc(doc(db, "chatRooms", id))
      if(snap.exists()){ setRoom({id: snap.id, ...snap.data()}); return }
      setRoom({ id, name: "مملكة القلوب", decoratedName: "مملكة القلوب ❤️", ownerUid: user?.uid })
    }
    load()
  },[id])

  useEffect(()=>{
    if(!user) return
    getDoc(doc(db,"users",user.uid)).then(s=>{ if(s.exists()){ setMyCoins(s.data().coins ?? 1000); setUserProfile(s.data()) } })
  },[user])

  useEffect(()=>{
    if(!id) return
    return onSnapshot(collection(db, `chatRooms/${id}/seats`), snap=>{
      const m:any={}; snap.docs.forEach(d=> m[Number(d.id)]=d.data()); setSeats(m)
    })
  },[id])

  // ===== دخول الهيبة - owner بس 🔥 =====
  useEffect(()=>{
    if(!id || !user) return
    const isLegend = isOwnerRole(userProfile?.role)
    const myRef = doc(db, `chatRooms/${id}/online/${user.uid}`)
    setDoc(myRef, { uid:user.uid, joinedAt:serverTimestamp(), name:user.displayName, photo:user.photoURL || userProfile?.avatar || "", role: userProfile?.role || "member", isLegend }, { merge:true })
    const unsub = onSnapshot(collection(db, `chatRooms/${id}/online`), s=>{
      setOnlineCount(s.size); setJoinedCount(s.size)
      s.docChanges().forEach(change=>{
        if(change.type === "added" && change.doc.id !== user.uid){
          const d = change.doc.data()
          if(d.isLegend){
            setLegendEntry(d)
            setTimeout(()=> setLegendEntry(null), 4500)
          }
        }
      })
    })
    if(isLegend){
      setLegendEntry({ name: user.displayName, role: userProfile?.role, photo: user.photoURL })
      setTimeout(()=> setLegendEntry(null), 4500)
    }
    setIsJoined(true)
    return ()=>{ deleteDoc(myRef).catch(()=>{}); unsub() }
  },[id,user,userProfile?.role])

  useEffect(()=>{
    if(!id) return
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt","asc"))
    return onSnapshot(q, snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
      setTimeout(()=> scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight),100)
    })
  },[id])

  const sendReaction = (emoji:string) => {
    const idR = Date.now() + Math.random()
    const left = 20 + Math.random()*60
    setFlying(prev=>[...prev, {id:idR, emoji, left}])
    setTimeout(()=> setFlying(prev=>prev.filter(f=>f.id!==idR)), 2500)
    addDoc(collection(db, `chatRooms/${id}/reactions`), { emoji, uid: user?.uid, createdAt: serverTimestamp() })
  }

  useEffect(()=>{
    if(!id) return
    const q = query(collection(db, `chatRooms/${id}/reactions`), orderBy("createdAt","desc"))
    return onSnapshot(q, snap=>{
      snap.docs.slice(0,1).forEach(d=>{
        const data=d.data()
        if(data.uid !== user?.uid){
          const idR = Date.now()+Math.random()
          setFlying(prev=>[...prev, {id:idR, emoji:data.emoji, left: 20+Math.random()*60}])
          setTimeout(()=> setFlying(prev=>prev.filter(f=>f.id!==idR)),2500)
        }
      })
    })
  },[id, user])

  const takeSeat = async (num:number) => {
    if(!user) return alert("سجل دخول أول")
    if(num===1 && room?.ownerUid !== user.uid) return alert("مقعد 1 محجوز لصاحب الغرفة 👑")
    const seat = seats[num]
    if(seat?.locked) return alert("المقعد مقفل 🔒")
    if(seat?.occupiedBy) return alert("المقعد مشغول")
    if(AUCTION_SEATS[num]){
      setShowAuction(num); return
    }
    const myOld = Object.entries(seats).find(([_,v]:any)=> v.occupiedBy===user.uid)
    if(myOld) await deleteDoc(doc(db, `chatRooms/${id}/seats/${myOld[0]}`))
    await setDoc(doc(db, `chatRooms/${id}/seats/${num}`), { occupiedBy:user.uid, name:user.displayName||"سوداني", photo:userProfile?.avatar || user.photoURL||"", frame: userProfile?.seatFrame || "none", nameColor: userProfile?.nameColor || "white", decoPrefix: userProfile?.decoPrefix || "", level: userProfile?.level || 1, role: userProfile?.role || "member", joinedAt:serverTimestamp() })
  }

  const buyAuctionSeat = async (num:number) => {
    const price = AUCTION_SEATS[num]
    if(myCoins < price) return alert(`كوينزك ${myCoins} ما كافية! تحتاج ${price}`)
    setMyCoins(c=>c-price)
    await updateDoc(doc(db,"users",user.uid), { coins: increment(-price) }).catch(()=>{})
    if(room?.ownerUid) await updateDoc(doc(db,"users",room.ownerUid), { coins: increment(price) }).catch(()=>{})
    const myOld = Object.entries(seats).find(([_,v]:any)=> v.occupiedBy===user.uid)
    if(myOld) await deleteDoc(doc(db, `chatRooms/${id}/seats/${myOld[0]}`))
    await setDoc(doc(db, `chatRooms/${id}/seats/${num}`), { occupiedBy:user.uid, name:user.displayName||"سوداني", photo:userProfile?.avatar || user.photoURL||"", isAuction:true, price, frame: userProfile?.seatFrame || "gold", nameColor: userProfile?.nameColor || "gold", decoPrefix: userProfile?.decoPrefix || "", level: userProfile?.level || 1, role: userProfile?.role || "member", joinedAt:serverTimestamp() })
    await addDoc(collection(db, `chatRooms/${id}/messages`), { text:`💰 ${user.displayName} اشترى مقعد ${num} بـ ${price} كوينز`, isSystem:true, createdAt:serverTimestamp() })
    setShowAuction(null)
  }

  const leaveSeat = async (num:number) => {
    const seat=seats[num]
    if(seat?.occupiedBy!==user?.uid && room?.ownerUid!==user?.uid) return
    await deleteDoc(doc(db, `chatRooms/${id}/seats/${num}`))
  }

  const sendMessage = async () => {
    if(!text.trim()||!user) return
    await addDoc(collection(db, `chatRooms/${id}/messages`), { text:text.trim(), uid:user.uid, displayName:user.displayName||"سوداني", photo:userProfile?.avatar || user.photoURL, nameColor: userProfile?.nameColor || "white", decoPrefix: userProfile?.decoPrefix || "", role: userProfile?.role || "member", createdAt:serverTimestamp() })
    setText("")
  }

  const isOwner = room?.ownerUid===user?.uid

  // ✅ كراسي صغيرة - كانت 62px بقت 48px عشان نفضي مساحة للونسة
  const renderSeat = (num:number) => {
    const s=seats[num]; const isMe=s?.occupiedBy===user?.uid; const isAuction = !!AUCTION_SEATS[num]
    const frame = SEAT_FRAMES.find(f=> f.id === s?.frame) || SEAT_FRAMES[0]
    const nameColor = NAME_COLORS.find(c=> c.id === s?.nameColor) || NAME_COLORS[0]
    const isLegendSeat = isOwnerRole(s?.role)
    if(s?.locked) return <div key={num} className="flex flex-col items-center gap-0.5"><div className="w-[46px] h-[46px] rounded-full bg-white/10 flex items-center justify-center text-[15px]">🔒</div><span className="text-[10px] font-bold">{num}</span></div>
    if(s?.occupiedBy) return (
      <div key={num} onClick={()=> isMe||isOwner?leaveSeat(num):{}} className="flex flex-col items-center gap-0.5 relative cursor-pointer">
        {num===1 && <span className="absolute -top-1 -right-1 z-10 text-[8px] bg-yellow-400 text-black rounded-full w-4 h-4 flex items-center justify-center font-black">👑</span>}
        {s.isAuction && <span className="absolute -top-1.5 left-0 z-10 bg-yellow-500 text-black text-[6px] font-black px-1 rounded-full">💰</span>}
        {isLegendSeat && <span className="absolute -top-1 -left-1 z-10 text-[10px]">✨</span>}
        <div className={`w-[50px] h-[50px] rounded-full p-[2px] ${frame.class} ${isMe ? "ring-2 ring-[#00E676]" : ""} ${isLegendSeat ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.7)]" : ""}`}><img src={s.photo||`https://i.pravatar.cc/100?u=${s.occupiedBy}`} className="w-full h-full rounded-full object-cover bg-[#1A2E35] border border-[#0B1416]" /></div>
        <span className={`text-[9px] font-bold truncate max-w-[56px] ${nameColor.class}`}>{s.decoPrefix || ""} {s.name?.slice(0,5)} {num===1?"👑":""}</span>
        {s.level && <span className="text-[7px] bg-white/10 px-1 py-0 rounded-full font-black">Lv.{s.level} {isOwnerRole(s.role) ? "👑" : ""}</span>}
      </div>
    )
    return (
      <div key={num} onClick={()=>takeSeat(num)} className="flex flex-col items-center gap-0.5 cursor-pointer relative">
        {isAuction && <span className="absolute -top-1.5 z-10 bg-yellow-500 text-black text-[7px] font-black px-1 py-0 rounded-full">💰 {AUCTION_SEATS[num]}</span>}
        <div className={`w-[46px] h-[46px] rounded-full bg-white/[0.04] border border-dashed flex items-center justify-center ${isAuction?"border-yellow-400/50":"border-white/15"} hover:border-[#00E676]/50`}><span className="text-white/30 text-[15px]">🪑</span></div>
        <span className="text-[10px] font-bold text-white/50">{num===1?"المالك":num}</span>
      </div>
    )
  }

  if(!room) return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">تحميل...</div>

  return (
    <div className="h-[100dvh] flex flex-col text-white relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute inset-0 bg-gradient-to-b from-[#0F2A2E] via-[#122025] to-[#0B1416]" /><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#00E676]/10 rounded-full blur-[80px]" /><div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[90px]" /></div>

      {/* ===== دخول الهيبة ===== */}
      {legendEntry && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E676]/30 via-yellow-400/20 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,118,0.3),transparent_70%)]" />
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(18)].map((_,i)=>(
              <div key={i} className="absolute text-[22px] animate-[flyUp_3s_ease-out_forwards]" style={{ left: `${(i*53)%100}%`, top: `${60 + (i%3)*15}%` }}>{["⭐","🔥","💚","❤️","👑","✨"][i%6]}</div>
            ))}
          </div>
          <div className="relative text-center animate-[scaleUp_0.5s_ease-out]">
            <div className="text-[70px] animate-bounce">👑</div>
            <h1 className="text-[28px] font-black bg-gradient-to-r from-yellow-300 via-green-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,230,118,0.8)]">{legendEntry.name}</h1>
            <p className="text-[18px] font-black text-white mt-1 drop-shadow">ملك المنصة دخل الغرفة... الشاشة ولعت 🔥</p>
            <p className="text-[13px] text-white/80 mt-2">🇸🇩 هيبة وحضور • مالك الموقع</p>
          </div>
          <style>{`@keyframes scaleUp{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-[50] overflow-hidden">
        {flying.map(f=> <div key={f.id} className="absolute bottom-[180px] text-[38px] animate-[flyUp_2.5s_ease-out_forwards]" style={{ left: `${f.left}%` }}>{f.emoji}</div>)}
        <style>{`@keyframes flyUp { 0%{ transform: translateY(0) scale(0.5); opacity:0 } 20%{ opacity:1 } 100%{ transform: translateY(-400px) scale(1.4); opacity:0 } }`}</style>
      </div>

      {/* هيدر */}
      <div className="relative z-10 bg-black/20 backdrop-blur p-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2"><Link href="/chat-rooms" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">✕</Link><button className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">↗️</button></div>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button onClick={()=>!isJoined&&setIsJoined(true)} className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${isJoined?"bg-white/20":"bg-[#00E676] text-black"}`}>+</button>
          <div className="text-center"><h2 className="font-black text-[14px] truncate max-w-[160px]">{room.decoratedName||room.name}</h2><p className="text-[10px] text-white/60">{joinedCount} الأعضاء • 🟢 {onlineCount} • 💰 {myCoins}</p></div>
        </div>
        <div className="flex items-center gap-1.5"><div className="bg-white/10 px-2.5 py-1 rounded-full text-[11px]">🏆 الترتيب</div><div className="bg-yellow-500/20 px-2 py-1 rounded-full text-[11px]">👜</div></div>
      </div>

      {/* ✅ كراسي - صغيرة ومضغوطة */}
      <div className="relative z-10 p-2.5 px-3 shrink-0"><div className="grid grid-cols-4 gap-y-2.5 gap-x-2">{[1,2,3,4,5,6,7,8,9,10,11,12].map(renderSeat)}</div></div>

      {/* ✅ مساحة إعلان - بين الكراسي والونسة */}
      {showAd && (
        <div className="relative z-10 mx-3 mb-2 shrink-0">
          <div className="bg-gradient-to-r from-[#1A2E35] to-[#122025] border border-white/10 rounded-[16px] overflow-hidden">
            <div className="flex items-center gap-3 p-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[20px] shrink-0">📢</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black truncate">🔥 عرض اليوم - اشحن 5000 كوينز وخد 1000 هدية</p>
                <p className="text-[10px] text-white/50 truncate">اضغط هنا للشحن • الدفع عبر بنكك / رصيد</p>
              </div>
              <Link href="/profile" className="bg-yellow-500 text-black text-[11px] font-black px-3 py-2 rounded-full shrink-0">اشحن</Link>
              <button onClick={()=>setShowAd(false)} className="text-white/40 text-[12px] px-1">✕</button>
            </div>
            <div className="h-[3px] bg-white/5"><div className="h-full w-2/3 bg-yellow-500" /></div>
          </div>
        </div>
      )}

      {/* أزرار التفاعل - صغيرة */}
      <div className="relative z-10 flex justify-center gap-2 mb-1.5 shrink-0">
        {["🔥","❤️","🎉","👏","🇸🇩"].map(e=> <button key={e} onClick={()=>sendReaction(e)} className="w-8 h-8 bg-white/10 rounded-full text-[16px] hover:bg-white/20 active:scale-125 transition">{e}</button>)}
      </div>

      {/* ✅ منطقة النصوص - بقت أكبر وأوسع */}
      <div className="relative z-10 mx-3 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-2.5 text-[11px] text-white/70 text-center shrink-0">💬 ممنوع الإساءة - خليك محترم • استمتع بالونسة السودانية 🇸🇩</div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-auto p-3 space-y-2 mt-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-[12px] py-6">
            <p className="text-[30px]">💬</p>
            <p className="mt-1 font-bold">لسه مافي رسائل - كن أول من يبدأ الونسة!</p>
          </div>
        )}
        {messages.slice(-50).map(m=> m.isSystem ? <div key={m.id} className="flex items-center gap-2 text-[12px] text-white/60 bg-white/5 w-fit px-3 py-1.5 rounded-full"><span>👋</span><p>{m.text}</p></div> : (
          <div key={m.id} className="flex gap-2"><img src={m.photo||`https://i.pravatar.cc/100?u=${m.uid}`} className="w-7 h-7 rounded-full shrink-0" /><div className="bg-white/10 rounded-2xl px-3 py-1.5 max-w-[80%]"><span className={`text-[11px] font-black ${isOwnerRole(m.role) ? "text-yellow-400" : "text-[#00E676]"}`}>{m.decoPrefix || ""} {m.displayName}{isOwnerRole(m.role) ? " 👑" : ""}:</span><span className="text-[13px] ml-1 break-words">{m.text}</span></div></div>
        ))}
      </div>

      {/* إدخال الرسالة */}
      <div className="relative z-10 bg-black/40 backdrop-blur border-t border-white/10 p-2.5 flex items-center gap-2 shrink-0">
        <button className="w-10 h-10 shrink-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-[18px]">🎁</button>
        <button className="w-10 h-10 shrink-0 bg-white/10 rounded-full flex items-center justify-center text-[18px]">🌹</button>
        <div className="flex-1 min-w-0 bg-white/10 rounded-full flex items-center px-3">
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="قول حاجة..." className="flex-1 min-w-0 bg-transparent py-2.5 text-[14px] outline-none" />
          <button onClick={()=>setShowEmoji(!showEmoji)} className="text-[20px] shrink-0 ml-1">😊</button>
        </div>
        <button className="w-10 h-10 shrink-0 bg-white/10 rounded-full flex items-center justify-center text-[18px]">🎙️</button>
        <button onClick={sendMessage} className="w-10 h-10 shrink-0 bg-[#00E676] rounded-full flex items-center justify-center text-black font-black">➤</button>
      </div>

      {showAuction && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6" onClick={()=>setShowAuction(null)}>
          <div onClick={e=>e.stopPropagation()} className="bg-[#122025] rounded-[24px] p-6 w-full max-w-[320px] text-center border border-yellow-400/30">
            <div className="text-[50px]">💰</div><h3 className="font-black text-[18px] mt-2">مزاد مقعد {showAuction}</h3>
            <p className="text-[13px] text-white/60 mt-1">مقعد VIP - السعر {AUCTION_SEATS[showAuction]} كوينز<br/>كوينزك: {myCoins} • الفلوس بتمشي لصاحب الغرفة</p>
            <button onClick={()=>buyAuctionSeat(showAuction)} className="w-full mt-4 bg-yellow-500 text-black font-black py-3.5 rounded-full">اشتري الآن - {AUCTION_SEATS[showAuction]} 💰</button>
            <button onClick={()=>setShowAuction(null)} className="w-full mt-2 bg-white/10 py-3 rounded-full font-bold">إلغاء</button>
          </div>
        </div>
      )}
      {showEmoji && <div className="relative z-10 bg-[#122025] p-2 grid grid-cols-8 gap-1 shrink-0">{EMOJIS.map(e=> <button key={e} onClick={()=>setText(t=>t+e)} className="text-[20px] p-2">{e}</button>)}</div>}
    </div>
  )
}