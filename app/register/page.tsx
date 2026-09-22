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
    
    const usernameLower = username.toLowerCase().replace('@','').trim().replace(/\s+/g,'_')
    const emailClean = email.trim().toLowerCase() // الحل لـ invalid-email

    if(password.length < 6) return alert('كلمة السر لازم 6 حروف على الأقل')

    setLoading(true)
    try {
      // فحص اليوزر - لو فشل ما نوقف التسجيل
      try {
        const q = query(collection(db, 'users'), where('usernameLower', '==', usernameLower))
        const exists = await getDocs(q)
        if (!exists.empty) {
          alert('اليوزرنيم محجوز جرب واحد تاني')
          setLoading(false)
          return
        }
      } catch (err) {
        console.log("skip username check", err)
        // ما نوقف، نكمل تسجيل
      }

      const cred = await createUserWithEmailAndPassword(auth, emailClean, password)
      
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username: usernameLower,
        usernameLower: usernameLower,
        displayName: usernameLower,
        email: emailClean,
        bio: '',
        avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
        role: "",
        profileCompleted: false,
        createdAt: serverTimestamp()
      })

      router.push('/profile/setup')

    } catch (err: any) {
      let msg = err.code || err.message
      if(msg.includes('email-already-in-use')) msg = 'الإيميل مسجل مسبقاً'
      if(msg.includes('invalid-email')) msg = 'صيغة الإيميل غلط، اتأكد مافي مسافة'
      if(msg.includes('Missing') || msg.includes('permissions')) msg = 'الرولز لسه ما اتنشرت، اعمل Publish في Firestore Rules'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6" dir="rtl">
      <form onSubmit={handleRegister} className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold mb-6">إنشاء حساب في Postatee</h1>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="اليوزرنيم @postatee" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر (6+)" className="w-full p-3 mb-5 rounded-xl bg-black border border-zinc-700" />
        <button disabled={loading} className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  )
}