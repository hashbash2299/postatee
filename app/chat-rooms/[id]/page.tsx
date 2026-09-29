"use client"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { sudaneseRooms } from "@/lib/chatRoomsData"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"
import Link from "next/link"

const EMOJIS = ["❤️","😂","😍","😭","🔥","👏","😡","💔","🙏","😳","🥺","😎","🇸🇩","💚"]
const IMGBB_KEY = "f3d1a2b4c5d6e7f8g9h0i1j2k3l4m5n6" // <-- غير ده بمفتاحك المجاني من imgbb.com

export default function RoomPage(){
  const { id } = useParams()
  const room = sudaneseRooms.find(r=>r.id===id) || sudaneseRooms[1]
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [myRole, setMyRole] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    if(!auth.currentUser) return
    getDoc(doc(db, "users", auth.currentUser.uid)).then(s=> s.exists() && setMyRole(s.data()))
  },[])

  const isMeMod = myRole?.role === 'مالك' || myRole?.role === 'مؤسس' || myRole?.role === 'مشرف عام' || myRole?.isModerator

  useEffect(()=>{
    const q = query(collection(db, `chatRooms/${id}/messages`), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
      setTimeout(()=> scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100)
    })
    return ()=>unsub()
  },[id])

  const checkBlock = async () => {
    if(!auth.currentUser) return null
    const banSnap = await getDoc(doc(db, `chatRooms/${id}/bans/${auth.currentUser.uid}`))
    if(banSnap.exists()){
      const d = banSnap.data()
      if(d.type === 'permanent') return `محظور نهائي - ${d.reason}`
      if(d.until?.toDate() > new Date()) return `مطرود حتى ${d.until.toDate().toLocaleTimeString('ar-SD')}`
      await deleteDoc(doc(db, `chatRooms/${id}/bans/${auth.currentUser.uid}`))
    }
    const muteSnap = await getDoc(doc(db, `chatRooms/${id}/mutes/${auth.currentUser.uid}`))
    if(muteSnap.exists() && muteSnap.data().until?.toDate() > new Date()) return `مكتوم حتى ${muteSnap.data().until.toDate().toLocaleTimeString('ar-SD')}`
    return null
  }

  const punishUser = async (target: any, type: 'mute' | 'kick' | 'ban', minutes: number) => {
    if(!auth.currentUser) return
    const coll = type === 'mute'? 'mutes' : 'bans'
    const until = minutes === -1? null : new Date(Date.now() + minutes*60*1000)
    await setDoc(doc(db, `chatRooms/${id}/${coll}/${target.uid}`), {
      targetUid: target.uid, targetName: target.displayName,
      bannedBy: auth.currentUser.uid, reason: 'مخالفة',
      type: minutes===-1?'permanent':'temp', until, createdAt: serverTimestamp()
    })
    await addDoc(collection(db, `chatRooms/${id}/messages`),{
      text: `🚫 تم ${type==='mute'?'كتم':type==='ban'?'حظر':'طرد'} ${target.displayName}`, uid: 'system', displayName: 'النظام', isSystem: true, createdAt: serverTimestamp()
    })
    setSelectedUser(null)
  }

  const sendMessage = async (imageUrl?: string)=>{
    if((!text.trim() &&!imageUrl) ||!auth.currentUser) return
    const block = await checkBlock()
    if(block){ alert(block); return }
    await addDoc(collection(db, `chatRooms/${id}/messages`),{
      text: text.trim(), imageUrl: imageUrl || null,
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || myRole?.displayName || "سوداني",
      photoURL: auth.currentUser.photoURL || "",
      role: myRole?.role || 'عضو', isModerator: isMeMod,
      createdAt: serverTimestamp()
    })
    setText(""); setShowEmoji(false)
  }

  // رفع بدون Firebase Storage
  const handleImage = async (e:any)=>{
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size > 5*1024*1024){ alert("الصورة كبيرة - اقل من 5 ميغا"); return }
    setUploading(true)
    try{
      const form = new FormData()
      form.append("image", file)
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: "POST", body: form
      })
      const data = await res.json()
      if(data.data?.url){
        await sendMessage(data.data.url)
      } else {
        alert("فشل الرفع - تأكد من المفتاح")
      }
    }catch(err){
      alert("النت ضعيف - حاول تاني")
    }
    setUploading(false)
    if(fileRef.current) fileRef.current.value = ""
  }

  const getBadge = (m:any) => {
    if(m.role === 'مالك') return <span className="bg-[#00E5FF] text-black text-[9px] font-black px-2 py-0.5 rounded-full">👑 المالك</span>
    if(m.isModerator || m.role === 'مشرف عام') return <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ مشرف</span>
    return null
  }

  return (
    <div className="h-[100dvh] bg-[#0B1416] flex flex-col text-white relative">
      <div className="bg-[#122025] border-b border-[#1E3A42] p-3 flex items-center gap-3">
        <Link href="/chat-rooms" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        <div className={`w-10 h-10 rounded-xl ${room.bg} flex items-center justify-center text-xl`}>{room.icon}</div>
        <div className="flex-1"><h2 className="font-black text-[15px]">{room.name} • 🟢 {messages.length}</h2><p className="text-[11px] text-white/50">اضغط على الاسم للطرد • دوس طويل للتفاعل</p></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-[#0B1416]">
        {messages.map(m=> m.isSystem? (
          <p key={m.id} className="text-center text-[11px] bg-white/10 py-1.5 px-3 rounded-full mx-auto w-fit text-yellow-300">{m.text}</p>
        ) : (
          <div key={m.id} className={`flex gap-2 ${m.uid===auth.currentUser?.uid? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.uid===auth.currentUser?.uid? 'bg-[#00E676] text-black' : m.isModerator? 'bg-[#1A2E35] border border-green-500/30' : 'bg-[#1A2E35]'} p-2.5 rounded-2xl max-w-[78%] text-[14px]`}>
              {m.uid!==auth.currentUser?.uid && <div onClick={()=> isMeMod && setSelectedUser(m)} className="flex items-center gap-1.5 mb-1 cursor-pointer"><p className={`text-[11px] font-black ${m.isModerator?'text-green-400':'opacity-60'}`}>{m.displayName}</p>{getBadge(m)}</div>}
              {m.imageUrl && <img src={m.imageUrl} className="rounded-xl max-w-[220px] mb-1.5" loading="lazy" />}
              {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
            </div>
          </div>
        ))}
      </div>

      {showEmoji && (
        <div className="bg-[#122025] border-t border-[#1E3A42] p-2 grid grid-cols-7 gap-1 animate-in slide-in-from-bottom-2">
          {EMOJIS.map(e=><button key={e} onClick={()=> setText(prev=>prev+e)} className="text-[22px] p-2 hover:bg-white/10 rounded-xl active:scale-90">{e}</button>)}
        </div>
      )}

      <div className="p-3 bg-[#122025] flex gap-2 items-center safe-bottom">
        <input type="file" ref={fileRef} onChange={handleImage} accept="image/*" className="hidden" />
        <button onClick={()=> fileRef.current?.click()} disabled={uploading} className="w-11 h-11 bg-[#1A2E35] rounded-full flex items-center justify-center text-lg active:scale-90">🖼️</button>
        <button onClick={()=> setShowEmoji(!showEmoji)} className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${showEmoji?'bg-[#00E676] text-black':'bg-[#1A2E35]'}`}>😊</button>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==="Enter" && sendMessage()} placeholder={uploading?"جاري رفع الصورة...":"اكتب رسالتك..."} disabled={uploading} className="flex-1 bg-[#1A2E35] rounded-full px-4 py-3 text-[14px] outline-none disabled:opacity-50" />
        <button onClick={()=>sendMessage()} disabled={uploading || (!text.trim())} className="w-12 h-12 bg-[#00E676] rounded-full flex items-center justify-center text-black font-black active:scale-90 disabled:opacity-50">{uploading?'⌛':'➤'}</button>
      </div>

      {selectedUser && isMeMod && (
        <div className="absolute inset-0 bg-black/60 z-[100] flex items-end" onClick={()=>setSelectedUser(null)}>
          <div onClick={e=>e.stopPropagation()} className="w-full bg-[#122025] p-4 rounded-t-[24px]">
            <p className="text-center font-black mb-4">عقوبة لـ {selectedUser.displayName}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>punishUser(selectedUser,'mute',5)} className="bg-yellow-500/15 text-yellow-400 p-3.5 rounded-2xl font-bold">🔇 كتم 5د</button>
              <button onClick={()=>punishUser(selectedUser,'kick',30)} className="bg-orange-500/15 text-orange-400 p-3.5 rounded-2xl font-bold">👢 طرد 30د</button>
              <button onClick={()=>punishUser(selectedUser,'kick',1440)} className="bg-red-500/15 text-red-400 p-3.5 rounded-2xl font-bold">⏰ 24 ساعة</button>
              <button onClick={()=>{ if(confirm('حظر نهائي؟')) punishUser(selectedUser,'ban',-1)}} className="bg-red-600 text-white p-3.5 rounded-2xl font-black">🚫 حظر</button>
            </div>
            <button onClick={()=>setSelectedUser(null)} className="w-full mt-3 bg-white/10 p-3.5 rounded-2xl font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}