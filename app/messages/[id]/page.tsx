"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, User, Smile, CheckCheck, Crown, Star, ExternalLink } from "lucide-react"

const EMOJIS = ["❤️","😂","😍","😭","😅","👍","🙏","🔥","💔","😎","🥺","🤣","😁","😘","👌","👏"]

export default function MessageRoom(){
  const params = useParams()
  const id = params.id as string
  const [myUid,setMyUid]=useState<string|null>(null)
  const [myData,setMyData]=useState<any>(null)
  const [friendId,setFriendId]=useState<string>("")
  const [friendData,setFriendData]=useState<any>(null)
  const [messages,setMessages]=useState<any[]>([])
  const [ads,setAds]=useState<any[]>([])
  const [text,setText]=useState("")
  const [chatId,setChatId]=useState("")
  const [showEmoji,setShowEmoji]=useState(false)
  const [activeReactId,setActiveReactId]=useState<string|null>(null)
  const bottomRef=useRef<HTMLDivElement>(null)
  const router=useRouter()

  useEffect(()=>{
    // === تم التعديل هنا فقط - بدون ما يحتاج Index ===
    const qAds = collection(db,'golden_ads')
    const unsubAds = onSnapshot(qAds as any, snap=>{
      const all = snap.docs.map(d=>({id:d.id,...d.data()})) as any[]
      setAds(all.filter((a:any)=> a.active!== false))
    })

    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return router.push('/login')
      setMyUid(u.uid)
      const mySnap = await getDoc(doc(db,'users',u.uid))
      if(mySnap.exists()) setMyData(mySnap.data())
      let finalChatId = id
      let otherId = ""
      if(id.includes('_')){
        finalChatId = id
        otherId = id.split('_').find(p=> p!==u.uid) || ""
      } else {
        otherId = id
        finalChatId = [u.uid, otherId].sort().join('_')
      }
      setFriendId(otherId)
      setChatId(finalChatId)
      if(otherId){
        const fSnap = await getDoc(doc(db,'users',otherId))
        if(fSnap.exists()) setFriendData(fSnap.data())
      }
      const chatRef = doc(db,'chats',finalChatId)
      const chatSnap = await getDoc(chatRef)
      if(!chatSnap.exists() && otherId){
        await setDoc(chatRef,{ members:[u.uid, otherId], created_at:serverTimestamp(), updated_at:serverTimestamp(), lastMessage:"" })
      }
      const q = query(collection(db,'chats',finalChatId,'messages'), orderBy('created_at','asc'))
      const unsubMsg = onSnapshot(q, async (snap)=>{
        setMessages(snap.docs.map(d=>({id:d.id,...d.data()})) as any[])
        setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}), 80)
        const unread = snap.docs.filter(d=> d.data().to===u.uid &&!d.data().read)
        if(unread.length>0){
          const batch = writeBatch(db)
          unread.forEach(d=> batch.update(d.ref,{read:true}))
          await batch.commit()
        }
      })
      return ()=> unsubMsg()
    })
    return ()=> { unsub(); unsubAds(); }
  },[id])

  const handleSend = async ()=>{
    if(!text.trim() ||!myUid ||!chatId) return
    const msg = text.trim()
    setText("")
    setShowEmoji(false)
    await addDoc(collection(db,'chats',chatId,'messages'),{ from:myUid, to:friendId, text:msg, read:false, reaction:null, created_at:serverTimestamp() })
    await updateDoc(doc(db,'chats',chatId),{ lastMessage:msg, updated_at:serverTimestamp(), lastAt:serverTimestamp() })
  }
  const addReaction = async (msgId:string, emoji:string)=>{
    await updateDoc(doc(db,'chats',chatId,'messages',msgId),{ reaction:emoji })
    setActiveReactId(null)
  }

  return (
    <div className="h-[100dvh] bg-[#080e0e] flex overflow-hidden" dir="rtl">
      {/* الشمال: اعلانات - لابتوب فقط */}
      <div className="hidden lg:flex w-[360px] xl:w-[400px] bg-[#0a1416] border-l border-white/10 flex-col overflow-y-auto shrink-0">
        <div className="p-4 border-b border-white/10 bg-[#122025] sticky top-0 z-10">
          <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400"/><h3 className="font-bold text-white text-[15px]">الشركاء الذهبيون</h3><span className="mr-auto bg-yellow-400/20 text-yellow-400 text-[10px] px-2 py-1 rounded-full font-bold">ممول</span></div>
        </div>
        <div className="p-3 space-y-4">
          {ads.length===0 && <p className="text-white/20 text-[12px] text-center py-10">لا توجد اعلانات حاليا - اضف من لوحة الادمن</p>}
          {ads.map((ad,i)=>(
            <a key={ad.id} href={ad.link||'#'} target="_blank" className={`relative rounded-[18px] overflow-hidden group cursor-pointer border block ${i===0?'h-[280px] border-yellow-400/20':'h-[160px] border-white/10'}`}>
              <img src={ad.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
              <div className={`absolute inset-0 bg-gradient-to-t ${ad.color||'from-yellow-400 to-orange-500'} opacity-60 mix-blend-multiply`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 p-4 w-full">
                {i===0 && <span className="bg-yellow-400 text-black text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit mb-2"><Star className="w-3 h-3"/> شريك ذهبي</span>}
                <h4 className="text-white font-bold text-[16px]">{ad.brand}</h4>
                <p className="text-white/70 text-[12px] mt-1">{ad.title}</p>
                {i===0 && <span className="mt-3 w-full bg-white text-black rounded-full py-2 text-[13px] font-bold flex items-center justify-center gap-1">زور المتجر <ExternalLink className="w-4 h-4"/></span>}
              </div>
              <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000"></div>
            </a>
          ))}
        </div>
      </div>

      {/* اليمين: الدردشة */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[56px] bg-[#122025] border-b border-white/10 flex items-center gap-3 px-4 shrink-0">
          <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
          {friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full object-cover"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
          <div className="flex flex-col"><span className="font-bold text-white text-[14px]">{friendData?.displayName || 'محادثة'}</span><span className="text-[11px] text-white/40">متصل الآن</span></div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 bg-[#080e0e]"><div className="max-w-[700px] mx-auto w-full space-y-3">
          {messages.map(m=>{
            const isMe = m.from===myUid
            return (
              <div key={m.id} className={`flex gap-2 items-end w-full ${isMe?'justify-start':'justify-end'}`}>
                {isMe && (myData?.avatar? <img src={myData.avatar} className="w-8 h-8 rounded-full object-cover shrink-0"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white"/></div>)}
                <div className={`flex flex-col max-w-[75%] ${isMe?'items-start':'items-end'}`}>
                  <div onClick={()=> setActiveReactId(activeReactId===m.id? null : m.id)} className={`relative px-4 py-3 rounded-[18px] text-[15px] leading-6 shadow-sm cursor-pointer select-none ${isMe?'bg-[#00E5FF] text-black rounded-bl-[6px]':'bg-[#1E2D32] text-white rounded-br-[6px]'}`}>
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    {m.reaction && <span className="absolute -bottom-3 left-3 bg-[#0B1418] border border-white/10 rounded-full w-7 h-7 flex items-center justify-center text-[14px] shadow-lg">{m.reaction}</span>}
                    <div className={`flex items-center gap-1 mt-1.5 ${isMe?'justify-start':'justify-end'}`}><span className={`text-[11px] ${isMe?'text-black/50':'text-white/40'}`}>{m.created_at?.seconds? new Date(m.created_at.seconds*1000).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : 'الآن'}</span>{isMe && <span className="mr-1">{m.read? <CheckCheck className="w-[16px] h-[16px] text-[#0064ff]" /> : <CheckCheck className="w-[16px] h-[16px] text-black/30" />}</span>}</div>
                  </div>
                  {activeReactId===m.id && <div className="flex gap-1 mt-2 bg-[#1E2D32] rounded-full px-2 py-1 border border-white/10 shadow-2xl">{["❤️","😂","😍","👍","🔥","😭"].map(e=>(<button key={e} onClick={()=>addReaction(m.id,e)} className="w-9 h-9 rounded-full hover:bg-white/10 active:scale-90 transition text-[20px]">{e}</button>))}</div>}
                </div>
                {!isMe && (friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full object-cover shrink-0"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white"/></div>)}
              </div>
            )
          })}<div ref={bottomRef} className="h-1"/></div></div>
        {showEmoji && <div className="bg-[#122025] border-t border-white/10 p-3 shrink-0"><div className="max-w-[700px] mx-auto grid grid-cols-8 gap-1">{EMOJIS.map(e=>(<button key={e} onClick={()=> setText(p=> p+e)} className="text-[22px] hover:bg-white/10 w-10 h-10 rounded-xl transition">{e}</button>))}</div></div>}
        <div className="bg-[#101c1f] border-t border-white/10 shrink-0 w-full"><div className="max-w-[700px] mx-auto flex items-center gap-2 px-3 py-2.5 w-full"><button onClick={()=>setShowEmoji(v=>!v)} className="w-[40px] h-[40px] flex items-center justify-center shrink-0"><Smile className="w-6 h-6 text-white/60" /></button><div className="flex-1 bg-[#1E2D32] rounded-full px-4 flex items-center min-h-[44px]"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleSend()} placeholder="اكتب رسالة..." className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder:text-white/40 py-2.5 w-full"/></div><button onClick={handleSend} disabled={!text.trim()} className="w-[44px] h-[44px] rounded-full bg-[#1bb6d4] flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition"><Send className="w-5 h-5 text-white -rotate-12" /></button></div></div>
      </div>
    </div>
  )
}