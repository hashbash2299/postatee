"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

type Conversation = {
  id: string
  participants: string[]
  lastMessage: string
  updatedAt: any
  otherUserName?: string
}

export default function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setLoading(false)
      }
    })
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!userId) return

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    )

    const unsub = onSnapshot(q, (snap) => {
      const list: Conversation[] = snap.docs.map((d) => ({
        id: d.id,
       ...d.data(),
      })) as Conversation[]
      setConversations(list)
      setLoading(false)
    })

    return () => unsub()
  }, [userId])

  if (loading) return <div className="p-6 text-center">جاري تحميل الرسائل...</div>

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">الرسائل</h1>

      {conversations.length === 0? (
        <div className="text-center py-20 text-gray-500">
          لا توجد محادثات بعد
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="block p-4 bg-white dark:bg-zinc-900 rounded-xl border hover:bg-gray-50"
            >
              <div className="font-semibold">{conv.otherUserName || "مستخدم"}</div>
              <div className="text-sm text-gray-500 truncate">{conv.lastMessage}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}