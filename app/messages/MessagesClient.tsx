"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"

export default function MessagesClient() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("No user")
        setLoading(false)
        return
      }

      console.log("User found:", user.uid)
      // بدون orderBy عشان ما يحتاج index
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      )

      const unsubSnap = onSnapshot(q, 
        (snap) => {
          console.log("Conversations:", snap.size)
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          setConversations(list)
          setLoading(false)
        },
        (err) => {
          console.error("Firestore error:", err)
          setLoading(false)
        }
      )
      return () => unsubSnap()
    })
    return () => unsubAuth()
  }, [])

  if (loading) return <div className="p-10 text-center">جاري التحميل... افتح الـ Console شوف اللوغ</div>

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">الرسائل ({conversations.length})</h1>
      {conversations.length === 0 ? (
        <div className="py-20 text-center text-gray-500">لا توجد محادثات</div>
      ) : (
        conversations.map((c) => (
          <Link key={c.id} href={`/messages/${c.id}`} className="block p-4 mb-2 bg-white rounded-xl border">
            <div>{c.lastMessage || "محادثة"}</div>
          </Link>
        ))
      )}
    </div>
  )
}