"use client"
import { useEffect, useState, useRef } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, User } from "lucide-react"

export default function MessageRoom(){
  const params = useParams()
  const id = params.id as string
  const [myUid,setMyUid]=useState<string|null>(null)
  const [friendId,setFriendId]=useState<string>("")
  const [friendData,setFriendData]=useState<any>(null)
  const [messages,setMessages]=useState<any[]>([])
  const [text,setText]=useState("")
  const [chatId,setChatId]=useState("")
  const bottomRef=useRef<HTMLDivElement>(null)
  const router=useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return router.push('/login')
      setMyUid(u.uid)

      let finalChatId = id
      let otherId = ""

      // لو الـ id فيه _ معناه ده chatId جاهز (uid1_uid2)
      if(id.includes('_')){
        finalChatId = id
        const parts = id.split('_')
        otherId = parts.find(p=> p!==u.uid) || ""
      } else {
        // لو الـ id هو uid بتاع الصديق
        otherId = id
        finalChatId = [u.uid, otherId].sort().join('_')
      }

      setFriendId(otherId)
      setChatId(finalChatId)

      if(otherId){
        const fSnap = await getDoc(doc(db,'users',otherId))
        if(fSnap.exists()) setFriendData(fSnap.data())
      }

      // تأكد الشات موجود
      const chatRef = doc(db,'chats',finalChatId)
      const chatSnap = await getDoc(chatRef)
      if(!chatSnap.exists() && otherId){
        const mySnap = await getDoc(doc(db,'users',u.uid))
        await setDoc(chatRef,{
          members:[u.uid, otherId],
          created_at:serverTimestamp(),
          updated_at:serverTimestamp(),
          lastMessage:""
        })
      }

      const q = query(collection(db,'chats',finalChatId,'messages'), orderBy('created_at','asc'))
      const unsubMsg = onSnapshot(q,(snap)=>{
        setMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
        setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}),100)
      })
      return ()=> unsubMsg()
    })
    return ()=> unsub()
  },[id])

  const handleSend = async ()=>{
    if(!text.trim() ||!myUid ||!chatId) return
    const msg = text
    setText("")
    await addDoc(collection(db,'chats',chatId,'messages'),{
      from:myUid,
      to:friendId,
      text:msg,
      created_at:serverTimestamp()
    })
    await updateDoc(doc(db,'chats',chatId),{
      lastMessage:msg,
      updated_at:serverTimestamp(),
      lastAt:serverTimestamp()
    })
  }

  return (
    <div className="h-screen bg-[#0B1418] flex flex-col" dir="rtl">
      <header className="h-[56px] bg-[#122025] border-b border-[#1A2E35] flex items-center gap-3 px-4">
        <button onClick={()=>router.push('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        {friendData?.avatar? <img src={friendData.avatar} className="w-8 h-8 rounded-full"/> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
        <span className="font-bold text-white text-sm">{friendData?.displayName || 'محادثة'}</span>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-[600px] w-full mx-auto">
        {messages.map(m=>(
          <div key={m.id} className={`flex ${m.from===myUid?'justify-end':'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] ${m.from===myUid?'bg-[#00E5FF] text-black rounded-br-sm':'bg-white/10 text-white rounded-bl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="p-3 bg-[#122025] border-t border-white/10">
        <div className="max-w-[600px] mx-auto flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleSend()} placeholder="اكتب رسالة..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white outline-none focus:border-cyan-400/50"/>
          <button onClick={handleSend} className="w-11 h-11 rounded-full bg-[#00E5FF] flex items-center justify-center"><Send className="w-5 h-5 text-black"/></button>
        </div>
      </div>
    </div>
  )
}