'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const RESERVED = ["postatee","admin","بوستاتي","postate","المالك","root"];

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('') // الاسم العربي الظاهر
  const [username, setUsername] = useState('') // اليوزرنيم الانجليزي
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // فلترة اليوزرنيم انجليزي بس
  const handleUsernameChange = (e:any) => {
    let val = e.target.value.toLowerCase()
    val = val.replace(/[^a-z0-9_]/g, '').replace(/\s+/g,'_')
    setUsername(val)
  }

  const handleRegister = async (e: any) => {
    e.preventDefault()
    if (!displayName.trim() ||!username ||!email ||!password) return alert('أكمل البيانات')

    // القاعدة الذهبية هنا
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g,'').replace(/\s+/g,'_');
    const cleanDisplayName = displayName.trim();
    const emailClean = email.trim().toLowerCase()

    if(cleanDisplayName.length < 2) return alert('الاسم قصير شديد')
    if(cleanUsername.length < 3) return alert('اسم المستخدم لازم 3 حروف على الأقل')
    if(!/^[a-z0-9_]+$/.test(cleanUsername)) return alert('اسم المستخدم بالانجليزي بس')
    if(password.length < 6) return alert('كلمة السر لازم 6 حروف على الأقل')

    if(RESERVED.includes(cleanDisplayName.toLowerCase()) || RESERVED.includes(cleanUsername)){
      return alert('الاسم ده محجوز للنظام، اختار اسم تاني')
    }

    setLoading(true)
    try {
      try {
        const q = query(collection(db, 'users'), where('usernameLower', '==', cleanUsername))
        const exists = await getDocs(q)
        if (!exists.empty) {
          alert('اليوزرنيم محجوز جرب واحد تاني')
          setLoading(false)
          return
        }
      } catch (err) {
        console.log("skip check", err)
      }

      const cred = await createUserWithEmailAndPassword(auth, emailClean, password)

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username: cleanUsername,
        usernameLower: cleanUsername, // نفس بعض

        displayName: cleanDisplayName,
        displayNameLower: cleanDisplayName.toLowerCase(), // نفس بعض

        email: emailClean,
        bio: '',
        avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
        role: "",
        profileCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      router.push('/profile/setup')

    } catch (err: any) {
      let msg = err.code || err.message
      if(msg.includes('email-already-in-use')) msg = 'الإيميل مسجل مسبقاً'
      if(msg.includes('invalid-email')) msg = 'صيغة الإيميل غلط، اتأكد مافي مسافة'
      if(msg.includes('Missing') || msg.includes('permissions')) msg = 'الرولز لسه ما اتنشرت'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6" dir="rtl">
      <form onSubmit={handleRegister} className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl">
        <h1 className="text-2xl font-bold mb-6">إنشاء حساب في Postatee</h1>

        {/* الاسم الظاهر - عربي */}
        <label className="text-[12px] text-zinc-400">الاسم (بالعربي عادي)</label>
        <input
          value={displayName}
          onChange={e=>setDisplayName(e.target.value)}
          placeholder="مثلا: محمد أحمد"
          className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700"
        />

        {/* اليوزرنيم - انجليزي */}
        <label className="text-[12px] text-zinc-400">اسم المستخدم (انجليزي)</label>
        <div className="relative mb-3">
          <span className="absolute left-3 top-3 text-zinc-500 text-sm">@</span>
          <input
            value={username}
            onChange={handleUsernameChange}
            placeholder="mohamed_ahmed"
            dir="ltr"
            className="w-full p-3 pl-8 rounded-xl bg-black border border-zinc-700 text-left"
          />
        </div>

        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر (6+)" className="w-full p-3 mb-5 rounded-xl bg-black border border-zinc-700" />
        <button disabled={loading} className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50">
          {loading? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>

        {displayName && username && (
          <div className="mt-4 bg-black p-3 rounded-xl border border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500">حيظهر كده:</p>
            <p className="font-bold">{displayName}</p>
            <p className="text-zinc-400 text-sm" dir="ltr">@{username}</p>
          </div>
        )}
      </form>
    </div>
  )
}