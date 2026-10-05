"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"
import { MessageCircle, User } from "lucide-react"

export default function MessagesClient() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return }
      const q1 = query(collection(db, "chats"), where("members", "array-contains", user.uid))
      const unsub1 = onSnapshot(q1, async (snap) => {
        const list = await Promise.all(snap.docs.map(async d => {
          const data = d.data()
          const otherId = (data.members || []).find((id:string)=> id!==user.uid)
          let userData = null
          if(otherId){
            try{
              const uSnap = await getDoc(doc(db,'users',otherId))
              if(uSnap.exists()) userData = uSnap.data()
            }catch{}
          }
          // لو ما لقي اليوزر ما نعرض الـ ID الطويل
          return {
            id: d.id,
            otherId,
            userData,
            lastMessage: data.lastMessage || "",
            updatedAt: data.updated_at || data.lastAt || data.created_at,
            unread: data.unreadCounts?.[user.uid] || 0,
          }
        }))
        // فلتر - اي محادثة بدون اسم مستخدم ما نعرضها بـ ID طويل
        const filtered = list.filter(c => c.userData?.displayName)
        setConversations(filtered.sort((a:any,b:any)=> (b.updatedAt?.seconds||0) - (a.updatedAt?.seconds||0)))
        setLoading(false)
      })
      return () => unsub1()
    })
    return () => unsubAuth()
  }, [])

  if (loading) return <div className="min-h-[80dvh] bg-[#0B1418] flex items-center justify-center text-white/50">جاري التحميل...</div>

  return (
    <div className="min-h-[100dvh] bg-[#080e0e] text-white" dir="rtl">
      <div className="max-w-[600px] mx-auto">
        <div className="sticky top-0 z-10 bg-[#080e0e]/90 backdrop-blur-md p-4 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-[18px] font-black">الرسائل</h1>
          <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-full">{conversations.length} محادثة</span>
        </div>

        <div className="p-3 space-y-2">
          {conversations.length===0? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-3"><MessageCircle className="w-7 h-7 text-white/30"/></div>
              <p className="text-white/30 text-[13px]">لا توجد محادثات - ابدأ من بروفايل صديق</p>
            </div>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.otherId}`}
                className={`flex items-center gap-3 p-3.5 rounded-[16px] border transition active:scale-[0.98] overflow-hidden ${c.unread>0? 'bg-[#00E5FF]/[0.08] border-[#00E5FF]/20' : 'bg-[#122025] border-white/[0.06] hover:bg-white/[0.06]'}`}
              >
                <div className="relative shrink-0">
                  {c.userData?.avatar?
                    <img src={c.userData.avatar} className="w-[48px] h-[48px] rounded-full object-cover"/>
                    : <div className="w-[48px] h-[48px] rounded-full bg-white/10 flex items-center justify-center"><User className="w-5 h-5"/></div>
                  }
                  {c.unread>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">{c.unread}</span>}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-bold text-[14px] truncate">{c.userData?.displayName || 'مستخدم'}</div>
                  <div className={`text-[12px] truncate mt-0.5 ${c.unread>0? 'text-white font-medium' : 'text-white/40'}`}>
                    {c.lastMessage? (c.lastMessage.length>30? c.lastMessage.slice(0,30)+'...' : c.lastMessage) : 'محادثة جديدة'}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] text-white/20">
                    {c.updatedAt?.seconds? new Date(c.updatedAt.seconds*1000).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : ''}
                  </span>
                  {c.unread>0 && <div className="w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse"/>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}