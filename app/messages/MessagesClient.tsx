"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

export default function MessagesClient() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      const q1 = query(collection(db, "chats"), where("members", "array-contains", user.uid))
      const unsub1 = onSnapshot(q1, async (snap) => {
        const list = await Promise.all(snap.docs.map(async d => {
          const data = d.data()
          const otherId = (data.members || []).find((id:string)=> id!==user.uid)
          let userData = null
          if(otherId){
            const uSnap = await getDoc(doc(db,'users',otherId))
            if(uSnap.exists()) userData = uSnap.data()
          }
          return {
            id: d.id, // ده chatId = uid1_uid2
            otherId,
            userData,
            lastMessage: data.lastMessage || "",
            updatedAt: data.updated_at || data.lastAt,
            source: 'chats'
          }
        }))
        setConversations(prev => {
          const old = prev.filter(p=> p.source==='conversations')
          return [...list,...old].sort((a:any,b:any)=> (b.updatedAt?.seconds||0) - (a.updatedAt?.seconds||0))
        })
        setLoading(false)
      })

      const q2 = query(collection(db, "conversations"), where("participants", "array-contains", user.uid))
      const unsub2 = onSnapshot(q2, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id,...d.data(), source:'conversations' }))
        setConversations(prev => {
          const newChats = prev.filter(p=> p.source==='chats')
          return [...newChats,...list]
        })
      })

      return () => { unsub1(); unsub2(); }
    })
    return () => unsubAuth()
  }, [])

  if (loading) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-white/50">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-[#0B1418]" dir="rtl">
      <div className="max-w-[600px] mx-auto p-4">
        <h1 className="text-xl font-black text-white mb-4">الرسائل ({conversations.length})</h1>
        {conversations.length === 0? (
          <div className="py-20 text-center text-white/30">لا توجد محادثات - ابدأ من بروفايل صديق</div>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 p-4 mb-2 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.06] transition"
            >
              <img src={c.userData?.avatar || `https://i.pravatar.cc/100?u=${c.otherId || c.id}`} className="w-12 h-12 rounded-full object-cover"/>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">{c.userData?.displayName || c.id}</div>
                <div className="text-xs text-white/50 truncate">{c.lastMessage || "محادثة"}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}