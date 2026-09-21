'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return }
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) setUserData(snap.data())
    })
    return () => unsub()
  }, [router])

  if (!userData) return <div className="p-10 text-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold">أهلا يا {userData.displayName} 👋</h1>
      <p className="text-gray-400">@{userData.username} - حسابك الحقيقي شغال!</p>
      <div className="mt-10 p-6 bg-zinc-900 rounded-2xl">
        <h2 className="text-xl">Postatee Feed قادم...</h2>
        <p className="text-sm text-gray-400 mt-2">ده مكان المنشورات، حنبنيهو مع بعض.</p>
      </div>
      <button onClick={() => signOut(auth)} className="mt-6 bg-white text-black px-4 py-2 rounded-full">تسجيل خروج</button>
    </div>
  )
}