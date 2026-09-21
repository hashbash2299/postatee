'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: any) => {
    e.preventDefault()
    if (!username || !email || !password) return alert('أكمل البيانات')
    setLoading(true)
    try {
      const usernameLower = username.toLowerCase().replace('@','').trim()
      
      // فحص اليوزر موجود ولا لا
      const q = query(collection(db, 'users'), where('usernameLower', '==', usernameLower))
      const exists = await getDocs(q)
      if (!exists.empty) {
        alert('اليوزرنيم محجوز')
        setLoading(false)
        return
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username: usernameLower,
        usernameLower: usernameLower,
        displayName: usernameLower,
        email: email,
        bio: '',
        profileCompleted: false,
        createdAt: serverTimestamp()
      })

      router.push('/')

    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleRegister} className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold mb-6">إنشاء حساب في Postatee</h1>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="اليوزرنيم @postatee" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر" className="w-full p-3 mb-5 rounded-xl bg-black border border-zinc-700" />
        <button disabled={loading} className="w-full bg-white text-black py-3 rounded-full font-bold">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  )
}