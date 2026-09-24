"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, User, Smile, Check, CheckCheck } from "lucide-react"

const EMOJIS = ["❤️","😂","😍","😭","😅","👍","🙏","🔥","💔","😎","🥺","🤣","😁","😘"]

export default function MessageRoom(){
  const params = useParams()
  const id = params.id as string
  const [myUid,setMyUid]=useState<string|null>(null)
  const [friendId,setFriendId]=useState<string>("")
  const [friendData,setFriendData]=useState<any>(null)
  const [messages,setMessages]=useState<any[]>([])
  const [text,setText]=useState("")
  const [chatId,setChatId]=useState("")
  const [showEmoji,setShowEmoji]=useState(false)
  const bottomRef=useRef<HTMLDivElement>(null)
  const router=useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return router.push('/login')
      setMyUid(u.uid)
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
        const msgs = snap.docs.map(d=>({id:d.id,...d.data()})) as any[]
        setMessages(msgs)
        setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}),100)
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
    const msg = text
    setText("")
    setShowEmoji(false)
    await addDoc(collection(db,'chats',chatId,'messages'),{ from:myUid, to:friendId, text:msg, read:false, reaction:null, created_at:serverTimestamp() })
    await updateDoc(doc(db,'chats',chatId),{ lastMessage:msg, updated_at:serverTimestamp(), lastAt:serverTimestamp() })
  }

  const addReaction = async (msgId:string, emoji:string)=>{
    await updateDoc(doc(db,'chats',chatId,'messages',msgId),{ reaction:emoji })
  }

  return (
    <div className="h-screen bg-[#050a0a] flex flex-col" dir="rtl">
      <header className="h-[56px] bg-[#122025] border-b border-white/10 flex items-center gap-3 px-4">
        <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        {friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
        <span className="font-bold text-white text-sm">{friendData?.displayName || 'محادثة'}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-w-[600px] w-full mx-auto">
        {messages.map(m=>(
          <div key={m.id} className={`flex flex-col ${m.from===myUid?'items-end':'items-start'} group`}>
            <div
              onDoubleClick={()=> addReaction(m.id, '❤️')}
              className={`relative max-w-[78%] px-4 py-2.5 rounded-[20px] text-[14.5px] leading-6 shadow-sm
              ${m.from===myUid?'bg-[#00E5FF] text-black rounded-br-[6px]':'bg-[#1E2D32] text-white rounded-bl-[6px]'}`}
            >
              {m.text}
              {/* ريأكشن */}
              {m.reaction && (
                <span className="absolute -bottom-3 -left-2 bg-[#0B1418] border border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-[13px] shadow-md">{m.reaction}</span>
              )}
              {/* وقت + صح */}
              <span className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${m.from===myUid?'text-black/60':'text-white/40'}`}>
                {m.created_at?.seconds? new Date(m.created_at.seconds*1000).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : ''}
                {m.from===myUid && (
                  <span className="mr-1">
                    {m.read? <CheckCheck className="w-[14px] h-[14px] text-[#0057FF]" /> : <CheckCheck className="w-[14px] h-[14px] text-black/40" />}
                  </span>
                )}
              </span>
            </div>
            {/* ازرار الريأكشن السريعة عند الضغط */}
            <div className="hidden group-active:flex gap-1 mt-1 bg-[#1E2D32] rounded-full px-2 py-1 border border-white/10">
              {["❤️","😂","😍","👍","🔥"].map(e=>(
                <button key={e} onClick={()=>addReaction(m.id,e)} className="hover:scale-125 transition text-[14px]">{e}</button>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {showEmoji && (
        <div className="bg-[#122025] border-t border-white/10 p-3 max-w-[600px] w-full mx-auto">
          <div className="grid grid-cols-7 gap-2">
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=> setText(prev=> prev+e)} className="text-[22px] hover:bg-white/10 w-10 h-10 rounded-xl transition">{e}</button>
            ))}
          </div>
        </div>
      )}

      <div className="p-2.5 bg-[#122025] border-t border-white/10">
        <div className="max-w-[600px] mx-auto flex gap-2 items-center">
          <div className="flex-1 flex items-center bg-[#0B1418] border border-white/10 rounded-full px-2">
            <button onClick={()=>setShowEmoji(v=>!v)} className="w-9 h-9 rounded-full flex items-center justify-center"><Smile className="w-5 h-5 text-white/70"/></button>
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleSend()} placeholder="اكتب رسالة..." className="flex-1 bg-transparent px-2 py-3 text-[14px] text-white outline-none"/>
          </div>
          <button onClick={handleSend} className="w-11 h-11 rounded-full bg-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]"><Send className="w-5 h-5 text-black -rotate-12"/></button>
        </div>
      </div>
    </div>
  )
}