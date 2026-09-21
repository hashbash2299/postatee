'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function SetupProfile() {
  const [bio, setBio] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return }
      const snap = await getDoc(doc(db, 'users', u.uid))
      if (snap.exists()) {
        setDisplayName(snap.data().displayName || '')
        setBio(snap.data().bio || '')
      }
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  const save = async () => {
    const user = auth.currentUser
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), {
      displayName,
      bio,
      profileCompleted: true
    })
    router.push('/')
  }

  if (loading) return <div className="p-10 text-center">...</div>

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold mb-2">كمّل ملفك الشخصي ✨</h1>
        <p className="text-gray-400 text-sm mb-6">دي خطوة مرة وحدة بس، بعدها تمشي الرئيسية</p>

        <label className="text-sm">الاسم الظاهر</label>
        <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full mt-2 mb-4 p-3 rounded-xl bg-black border border-zinc-700" />

        <label className="text-sm">البايو</label>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="اكتب نبذة عنك..." className="w-full mt-2 mb-6 p-3 rounded-xl bg-black border border-zinc-700 h-24" />

        <button onClick={save} className="w-full bg-white text-black py-3 rounded-full font-bold">حفظ والذهاب للرئيسية →</button>
      </div>
    </div>
  )
}