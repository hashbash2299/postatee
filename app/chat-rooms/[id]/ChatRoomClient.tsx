"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, increment } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

const TOTAL_SEATS = 12
const EMOJIS = ["❤️","😂","😍","🔥","👏","🇸🇩","💚","😭"]
const AUCTION_SEATS: Record<number, number> = { 2: 500, 3: 300 } // مزاد

export default function ChatRoomClient({ id }: { id: string }) {
  const [room, setRoom] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ return onAuthStateChanged(auth, setUser) },[])
  useEffect(()=>{ if(id && id!=="0") getDoc(doc(db,"customRooms",id)).then(s=>{ if(s.exists()) setRoom({id:s.id,...s.data()}) }) },[id])

  useEffect(()=>{
    if(!user) return
    getDoc(doc(db,"users",user.uid)).then(s=>{ if(s.exists()) setMyCoins(s.data().coins ?? 1000) })
  },[user])

  useEffect(()=>{
    if(!id) return
    return onSnapshot(collection(db, `chatRooms/${id}/seats`), snap=>{
      const m:any={}; snap.docs.forEach(d=> m[Number(d.id)]=d.data()); setSeats(m)
    })
  },[id])

  useEffect(()=>{
    if(!id || !user) return
    const myRef = doc(db, `chatRooms/${id}/online/${user.uid}`)
    setDoc(myRef, { uid:user.uid, joinedAt:serverTimestamp(), name:user.displayName }, { merge:true })
    const unsub = onSnapshot(collection(db, `chatRooms/${id}/online`), s=>{ setOnlineCount(s.size); setJoinedCount(s.size) })
    setIsJoined(true)
    return ()=>{ deleteDoc(myRef).catch(()=>{}); unsub() }
  },[id,user])

  useEffect(()=>{
    if(!id) return
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt","asc"))
    return onSnapshot(q, snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
      setTimeout(()=> scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight),100)
    })
  },[id])

  // 🔥 تفاعل طائر
  const sendReaction = (emoji:string) => {
    const idR = Date.now() + Math.random()
    const left = 20 + Math.random()*60
    setFlying(prev=>[...prev, {id:idR, emoji, left}])
    setTimeout(()=> setFlying(prev=>prev.filter(f=>f.id!==idR)), 2500)
    // ابعتها لكل الناس عبر Firestore
    addDoc(collection(db, `chatRooms/${id}/reactions`), { emoji, uid: user?.uid, createdAt: serverTimestamp() })
  }

  // استقبال تفاعلات الناس
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
    await setDoc(doc(db, `chatRooms/${id}/seats/${num}`), { occupiedBy:user.uid, name:user.displayName||"سوداني", photo:user.photoURL||"", joinedAt:serverTimestamp() })
  }

  // 💰 شراء مزاد
  const buyAuctionSeat = async (num:number) => {
    const price = AUCTION_SEATS[num]
    if(myCoins < price) return alert(`كوينزك ${myCoins} ما كافية! تحتاج ${price}`)
    setMyCoins(c=>c-price)
    await updateDoc(doc(db,"users",user.uid), { coins: increment(-price) }).catch(()=>{})
    // الفلوس للمالك
    if(room?.ownerUid) await updateDoc(doc(db,"users",room.ownerUid), { coins: increment(price) }).catch(()=>{})
    const myOld = Object.entries(seats).find(([_,v]:any)=> v.occupiedBy===user.uid)
    if(myOld) await deleteDoc(doc(db, `chatRooms/${id}/seats/${myOld[0]}`))
    await setDoc(doc(db, `chatRooms/${id}/seats/${num}`), { occupiedBy:user.uid, name:user.displayName||"سوداني", photo:user.photoURL||"", isAuction:true, price, joinedAt:serverTimestamp() })
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
    await addDoc(collection(db, `chatRooms/${id}/messages`), { text:text.trim(), uid:user.uid, displayName:user.displayName||"سوداني", photo:user.photoURL, createdAt:serverTimestamp() })
    setText("")
  }

  const isOwner = room?.ownerUid===user?.uid
  const renderSeat = (num:number) => {
    const s=seats[num]; const isMe=s?.occupiedBy===user?.uid; const isAuction = !!AUCTION_SEATS[num]
    if(s?.locked) return <div key={num} className="flex flex-col items-center gap-1"><div className="w-[62px] h-[62px] rounded-full bg-white/10 flex items-center justify-center">🔒</div><span className="text-[12px] font-bold">{num}</span></div>
    if(s?.occupiedBy) return (
      <div key={num} onClick={()=> isMe||isOwner?leaveSeat(num):{}} className="flex flex-col items-center gap-1 relative cursor-pointer">
        {num===1 && <span className="absolute -top-1 -right-1 z-10 text-[10px] bg-yellow-400 text-black rounded-full w-4 h-4 flex items-center justify-center font-black">👑</span>}
        {s.isAuction && <span className="absolute -top-2 left-0 z-10 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-full">💰 VIP</span>}
        <div className={`w-[62px] h-[62px] rounded-full p-[2px] ${isMe?"bg-[#00E676]":"bg-white/20"}`}><img src={s.photo||`https://i.pravatar.cc/100?u=${s.occupiedBy}`} className="w-full h-full rounded-full object-cover bg-[#1A2E35]" /></div>
        <span className="text-[12px] font-bold truncate max-w-[60px]">{s.name?.slice(0,6)}{num===1?" 👑":""}</span>
      </div>
    )
    return (
      <div key={num} onClick={()=>takeSeat(num)} className="flex flex-col items-center gap-1 cursor-pointer relative">
        {isAuction && <span className="absolute -top-2 z-10 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">💰 {AUCTION_SEATS[num]}</span>}
        <div className={`w-[62px] h-[62px] rounded-full bg-white/5 border-2 border-dashed flex items-center justify-center ${isAuction?"border-yellow-400/50":"border-white/15"}`}><span className="text-white/40 text-[20px]">🪑</span></div>
        <span className="text-[12px] font-bold text-white/60">{num===1?"المالك":num}</span>
      </div>
    )
  }

  if(!room) return <div className="min-h-screen bg-[#0B1416] flex items-center justify-center text-white">تحميل...</div>

  return (
    <div className="h-[100dvh] flex flex-col text-white relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute inset-0 bg-gradient-to-b from-[#0F2A2E] via-[#122025] to-[#0B1416]" /><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#00E676]/10 rounded-full blur-[80px]" /><div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[90px]" /></div>

      {/* 🔥 تفاعلات طائرة */}
      <div className="absolute inset-0 pointer-events-none z-[50] overflow-hidden">
        {flying.map(f=> <div key={f.id} className="absolute bottom-[180px] text-[38px] animate-[flyUp_2.5s_ease-out_forwards]" style={{ left: `${f.left}%` }}>{f.emoji}</div>)}
        <style>{`@keyframes flyUp { 0%{ transform: translateY(0) scale(0.5); opacity:0 } 20%{ opacity:1 } 100%{ transform: translateY(-400px) scale(1.4); opacity:0 } }`}</style>
      </div>

      <div className="relative z-10 bg-black/20 backdrop-blur p-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2"><Link href="/chat-rooms" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">✕</Link><button className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">↗️</button></div>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button onClick={()=>!isJoined&&setIsJoined(true)} className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${isJoined?"bg-white/20":"bg-[#00E676] text-black"}`}>+</button>
          <div className="text-center"><h2 className="font-black text-[14px] truncate max-w-[160px]">{room.decoratedName||room.name}</h2><p className="text-[10px] text-white/60">{joinedCount} الأعضاء • 🟢 {onlineCount} • 💰 {myCoins}</p></div>
        </div>
        <div className="flex items-center gap-1.5"><div className="bg-white/10 px-2.5 py-1 rounded-full text-[11px]">🏆 الترتيب</div><div className="bg-yellow-500/20 px-2 py-1 rounded-full text-[11px]">👜</div></div>
      </div>

      <div className="relative z-10 p-4"><div className="grid grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8,9,10,11,12].map(renderSeat)}</div></div>

      {/* أزرار تفاعل سريعة */}
      <div className="relative z-10 flex justify-center gap-2 -mt-1 mb-1">
        {["🔥","❤️","🎉","👏","🇸🇩"].map(e=> <button key={e} onClick={()=>sendReaction(e)} className="w-9 h-9 bg-white/10 rounded-full text-[18px] hover:bg-white/20 active:scale-125 transition">{e}</button>)}
      </div>

      <div className="relative z-10 mx-4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-3 text-[12px] text-white/70 text-center">💬 ممنوع الإساءة - خليك محترم • استمتع بالونسة السودانية 🇸🇩</div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-auto p-3 space-y-2 mt-2">
        {messages.slice(-30).map(m=> m.isSystem ? <div key={m.id} className="flex items-center gap-2 text-[12px] text-white/60 bg-white/5 w-fit px-3 py-1.5 rounded-full"><span>👋</span><p>{m.text}</p></div> : (
          <div key={m.id} className="flex gap-2"><img src={m.photo||`https://i.pravatar.cc/100?u=${m.uid}`} className="w-7 h-7 rounded-full" /><div className="bg-white/10 rounded-2xl px-3 py-1.5 max-w-[75%]"><span className="text-[11px] font-black text-[#00E676]">{m.displayName}:</span><span className="text-[13px] ml-1">{m.text}</span></div></div>
        ))}
      </div>

      <div className="relative z-10 bg-black/40 backdrop-blur border-t border-white/10 p-2.5 flex items-center gap-2">
        <button className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full">🎁</button><button className="w-10 h-10 bg-white/10 rounded-full">🌹</button><button className="w-10 h-10 bg-white/10 rounded-full">⊞</button>
        <div className="flex-1 bg-white/10 rounded-full flex items-center px-3"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="قول حاجة..." className="flex-1 bg-transparent py-2.5 text-[14px] outline-none" /><button onClick={()=>setShowEmoji(!showEmoji)} className="text-[20px]">😊</button></div>
        <button className="w-10 h-10 bg-white/10 rounded-full">🎙️</button>
      </div>

      {/* مودال المزاد */}
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
      {showEmoji && <div className="relative z-10 bg-[#122025] p-2 grid grid-cols-8 gap-1">{EMOJIS.map(e=> <button key={e} onClick={()=>setText(t=>t+e)} className="text-[20px] p-2">{e}</button>)}</div>}
    </div>
  )
}