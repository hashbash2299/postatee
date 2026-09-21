'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      
      // نشوف هل كمل البروفايل ولا لا
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists() && !snap.data().profileCompleted) {
        router.push('/profile/setup')
      } else {
        router.push('/feed')
      }

    } catch (err: any) {
      alert('خطأ في الإيميل أو كلمة السر')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold mb-6">تسجيل الدخول</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر" className="w-full p-3 mb-5 rounded-xl bg-black border border-zinc-700" />
        <button disabled={loading} className="w-full bg-white text-black py-3 rounded-full font-bold">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  )
}