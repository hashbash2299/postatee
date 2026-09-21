'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return }
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data = snap.data()
        // لو ما كمل البروفايل وده تسجيل جديد، وديهو يكملو
        if (!data.profileCompleted) { router.push('/profile/setup'); return }
        setUserData(data)
      }
    })
    return () => unsub()
  }, [router])

  if (!userData) return <div className="p-10 text-center bg-black text-white min-h-screen">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-[600px] mx-auto border-x border-zinc-800">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Postatee</h1>
        <button onClick={()=>router.push('/profile/setup')} className="w-9 h-9 rounded-full bg-zinc-800">👤</button>
      </div>

      <div className="mt-6 p-4 bg-zinc-900 rounded-2xl">
        <p>أهلا يا {userData.displayName} 👋</p>
        <p className="text-sm text-gray-400">اكتب أول بوست لك هنا...</p>
      </div>
    </div>
  )
}