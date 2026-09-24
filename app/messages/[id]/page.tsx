"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, User, Smile, CheckCheck } from "lucide-react"

const EMOJIS = ["❤️","😂","😍","😭","😅","👍","🙏","🔥","💔","😎","🥺","🤣","😁","😘","👌","👏","😁"]

export default function MessageRoom(){
  const params = useParams()
  const id = params.id as string
  const [myUid,setMyUid]=useState<string|null>(null)
  const [myData,setMyData]=useState<any>(null)
  const [friendId,setFriendId]=useState<string>("")
  const [friendData,setFriendData]=useState<any>(null)
  const [messages,setMessages]=useState<any[]>([])
  const [text,setText]=useState("")
  const [chatId,setChatId]=useState("")
  const [showEmoji,setShowEmoji]=useState(false)
  const [activeReactId,setActiveReactId]=useState<string|null>(null)
  const bottomRef=useRef<HTMLDivElement>(null)
  const router=useRouter()

  useEffect(()=>{
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
    return ()=> unsub()
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
    <div className="h-[100dvh] bg-[#080e0e] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="h-[56px] bg-[#122025] border-b border-white/10 flex items-center gap-3 px-4 shrink-0">
        <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        {friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full object-cover"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
        <div className="flex flex-col">
          <span className="font-bold text-white text-[14px]">{friendData?.displayName || 'محادثة'}</span>
          <span className="text-[11px] text-white/40">متصل الآن</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-w-[650px] w-full mx-auto bg-[#080e0e]">
        {messages.map(m=>{
          const isMe = m.from===myUid
          return (
            <div key={m.id} className={`flex gap-2 items-end w-full ${isMe?'justify-start':'justify-end'}`}>
              {/* صورتي - للرسائل المرسلة (على الشمال زي اسكرينك) */}
              {isMe && (
                myData?.avatar? <img src={myData.avatar} className="w-8 h-8 rounded-full object-cover shrink-0"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white"/></div>
              )}

              <div className={`flex flex-col ${isMe?'items-start':'items-end'} max-w-[75%]`}>
                <div
                  onClick={()=> setActiveReactId(activeReactId===m.id? null : m.id)}
                  className={`relative px-4 py-3 rounded-[18px] text-[15px] leading-6 shadow-sm cursor-pointer select-none
                  ${isMe?'bg-[#00E5FF] text-black rounded-bl-[6px]':'bg-[#1E2D32] text-white rounded-br-[6px]'}`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>

                  {/* ريأكشن ثابت */}
                  {m.reaction && (
                    <span className="absolute -bottom-3 left-3 bg-[#0B1418] border border-white/10 rounded-full w-7 h-7 flex items-center justify-center text-[14px] shadow-lg">{m.reaction}</span>
                  )}

                  {/* وقت + صحين */}
                  <div className={`flex items-center gap-1 mt-1.5 ${isMe?'justify-start':'justify-end'}`}>
                    <span className={`text-[11px] ${isMe?'text-black/50':'text-white/40'}`}>
                      {m.created_at?.seconds? new Date(m.created_at.seconds*1000).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : 'الآن'}
                    </span>
                    {isMe && (
                      <span className="mr-1">
                        {m.read? <CheckCheck className="w-[16px] h-[16px] text-[#0064ff]" /> : <CheckCheck className="w-[16px] h-[16px] text-black/30" />}
                      </span>
                    )}
                  </div>
                </div>

                {activeReactId===m.id && (
                  <div className="flex gap-1 mt-2 bg-[#1E2D32] rounded-full px-2 py-1 border border-white/10 shadow-2xl animate-in zoom-in-95">
                    {["❤️","😂","😍","👍","🔥","😭","👏"].map(e=>(
                      <button key={e} onClick={()=>addReaction(m.id,e)} className="w-9 h-9 rounded-full hover:bg-white/10 active:scale-90 transition text-[20px]">{e}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* صورة الصديق - للرسائل المستقبلة (على اليمين) */}
              {!isMe && (
                friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full object-cover shrink-0"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white"/></div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} className="h-2"/>
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="bg-[#122025] border-t border-white/10 p-3 max-w-[650px] w-full mx-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=> setText(p=> p+e)} className="text-[22px] hover:bg-white/10 w-10 h-10 rounded-xl transition">{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input - نفس شكل اسكرينك */}
      <div className="p-3 bg-[#0f1a1e] border-t border-white/10 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-[650px] mx-auto flex gap-2.5 items-center">
          <button onClick={handleSend} disabled={!text.trim()} className="w-[44px] h-[44px] rounded-full bg-[#00E5FF] flex items-center justify-center shrink-0 disabled:opacity-50 shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-95 transition">
            <Send className="w-5 h-5 text-black rotate-[-30deg] translate-x-[-1px]"/>
          </button>

          <div className="flex-1 flex items-center bg-[#1E2D32] border border-white/10 rounded-full px-4 h-[44px]">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleSend()} placeholder="اكتب رسالة..." className="flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-white/40"/>
            <button onClick={()=>setShowEmoji(v=>!v)} className="w-8 h-8 rounded-full flex items-center justify-center mr-1"><Smile className="w-[22px] h-[22px] text-white/50"/></button>
          </div>
        </div>
      </div>
    </div>
  )
}