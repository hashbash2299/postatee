"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function ProfilePage() {
  const { uid } = useParams() as { uid: string }
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMe, setIsMe] = useState(false)

  useEffect(() => {
    let mounted = true
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user && user.uid === uid) setIsMe(true)

        const snap = await getDoc(doc(db, "users", uid))
        if (mounted) {
          if (snap.exists()) setProfile(snap.data())
          else setProfile(null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [uid])

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">جاري التحميل...</div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">المستخدم غير موجود</div>
  }

  return (
    <div dir="rtl" style={{ background: '#000', minHeight: '100vh', padding: 20 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        {/* صورة ومعلومات */}
        <div className="flex flex-col items-center py-8">
          <img src={profile.photoURL || "/default.png"} className="w-24 h-24 rounded-full mb-4" />
          <h1 className="text-white text-xl font-bold">{profile.displayName || "مستخدم"}</h1>
          <p className="text-zinc-400 text-sm">@{profile.username || uid.slice(0,6)}</p>
        </div>

        {/* الزرين */}
        {!isMe && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => alert('تمت الإضافة')}
              style={{ height: 52, borderRadius: 999, background: 'white', color: 'black', fontWeight: 900, fontSize: 16, border: 'none' }}>
              إضافة صديق
            </button>
            <button
              onClick={() => alert('طلب مراسلة')}
              style={{ height: 52, borderRadius: 999, background: 'transparent', color: '#00E5FF', fontWeight: 900, fontSize: 16, border: '2px solid #00E5FF' }}>
              طلب مراسلة
            </button>
          </div>
        )}

        {isMe && (
          <div className="text-center text-zinc-500 mt-4">ده بروفايلك انت</div>
        )}

      </div>
    </div>
  )
}